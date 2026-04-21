from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import pandas as pd
import requests
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Import our recommendation modules
from recommender import InternshipRecommender
from roadmap_generator import AI_RoadmapGenerator

# Import our screening modules
from database import engine, Base, get_db
from models import InternshipCriteria, Candidate
from parser import extract_text
from ai_screener import evaluate_resume

load_dotenv(override=True)

# Initialize FastAPI
app = FastAPI(title="Unified Recommendation & Screening API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Recommendation Components
recommender = InternshipRecommender(data_path='internships.csv')
roadmap_generator = AI_RoadmapGenerator()

# Load and Train Recommendation Model on startup
if recommender.load_data():
    recommender.create_features()
    recommender.train()
else:
    print("FAILED TO LOAD RECOMMENDATION DATA.")

# Create screening database tables
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "temp_resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Recommendation Routes ---

@app.get("/health")
def health():
    return {"status": "healthy", "service": "unified-ai-service"}

@app.post("/recommend")
async def recommend(request: Request):
    try:
        data = await request.json()
        student_profile = data.get('studentProfile')
        assessment_scores = data.get('assessmentScores')
        user_id = data.get('user_id')
        top_n = data.get('top_n', 5)
        
        if not student_profile:
             raise HTTPException(status_code=400, detail="Missing 'studentProfile' in body")

        user_history = []
        if user_id:
            try:
                supabase_url = os.getenv("VITE_SUPABASE_URL")
                supabase_key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
                if supabase_url and supabase_key:
                    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
                    resp = requests.get(
                        f"{supabase_url}/rest/v1/recommendation_history?user_id=eq.{user_id}&select=recommendations&order=created_at.desc&limit=5",
                        headers=headers
                    )
                    if resp.ok:
                        history_data = resp.json()
                        for entry in history_data:
                            if entry.get('recommendations'):
                                user_history.extend(entry['recommendations'])
            except Exception as e:
                print(f"Error fetching user history: {e}")

        recommendations = recommender.recommend(
            student_profile, 
            top_n=top_n, 
            assessment_scores=assessment_scores,
            user_history=user_history
        )
        
        return {"success": True, "recommendations": recommendations}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-roadmap")
async def generate_roadmap(request: Request):
    try:
        data = await request.json()
        title = data.get('title')
        duration = data.get('duration', '8 weeks')
        student_profile = data.get('studentProfile', 'N/A')
        availability = data.get('availability', 'N/A')
        
        if not title:
            raise HTTPException(status_code=400, detail="Missing 'title' in body")

        roadmap = roadmap_generator.generate(title, duration, student_profile, availability)

        return {"success": True, "roadmap": roadmap}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Resume Screening Routes ---

@app.post("/api/criteria")
def save_criteria(criteria_data: dict, db: Session = Depends(get_db)):
    db.query(InternshipCriteria).delete()
    new_criteria = InternshipCriteria(
        job_title=criteria_data.get("job_title"),
        required_skills=criteria_data.get("required_skills"),
        preferred_skills=criteria_data.get("preferred_skills"),
        min_education=criteria_data.get("min_education"),
        experience_level=criteria_data.get("experience_level"),
        custom_notes=criteria_data.get("custom_notes")
    )
    db.add(new_criteria)
    db.commit()
    db.refresh(new_criteria)
    return {"status": "success", "id": new_criteria.id}

import re
from collections import Counter

def calculate_local_score(resume_text, criteria):
    """Calculate a fast local match score using token overlap (sklearn-free fallback)."""
    try:
        # Combine criteria into a single search string
        target = f"{criteria.job_title} {criteria.required_skills} {criteria.preferred_skills}"
        # Preprocess: lowercase and remove non-alphanumeric
        def clean(text):
            return re.sub(r'\W+', ' ', text.lower())

        target_tokens = clean(target).split()
        resume_tokens = clean(resume_text).split()
        if not target_tokens or not resume_tokens:
            return 0

        t_counter = Counter(target_tokens)
        r_counter = Counter(resume_tokens)
        intersection = sum((t_counter & r_counter).values())
        norm = (sum(v * v for v in t_counter.values()) ** 0.5) * (sum(v * v for v in r_counter.values()) ** 0.5)
        score = (intersection / norm) if norm else 0.0
        
        # Scale score to 0-100 and add a small boost for keyword density
        final_score = min(int(score * 150), 100) # Scaling factor tuned for resumes
        return final_score
    except Exception as e:
        print(f"Local scoring error: {e}")
        return 0

@app.post("/api/upload-resumes")
async def upload_resumes(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    uploaded_files = []
    # Get current criteria for local ranking
    criteria = db.query(InternshipCriteria).first()
    
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = extract_text(file_path)
        
        # Immediate local ranking
        local_score = 0
        if criteria:
            local_score = calculate_local_score(text, criteria)
            
        new_candidate = Candidate(
            resume_filename=file.filename,
            resume_text=text,
            match_score=local_score, # Set initial score
            status="Pending"
        )
        db.add(new_candidate)
        uploaded_files.append(file.filename)
    
    db.commit()
    return {"status": "success", "files": uploaded_files}

# Limit concurrent AI requests
MAX_CONCURRENT_SCREENING = 5
screening_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCREENING)

async def process_screening():
    print(f"DEBUG: Starting process_screening at {datetime.now()}")
    # Use a fresh session for the background task
    db = next(get_db())
    try:
        criteria = db.query(InternshipCriteria).first()
        if not criteria: 
            print("DEBUG: No criteria found.")
            return
        
        criteria_dict = {
            "job_title": criteria.job_title,
            "required_skills": criteria.required_skills,
            "preferred_skills": criteria.preferred_skills,
            "min_education": criteria.min_education,
            "experience_level": criteria.experience_level,
            "custom_notes": criteria.custom_notes
        }
        
        candidates = db.query(Candidate).filter(Candidate.status.in_(["Pending", "Processing"])).all()
        if not candidates: 
            print("DEBUG: No pending/processing candidates found.")
            return

        print(f"DEBUG: Found {len(candidates)} candidates to process.")

        async def screen_candidate(candidate_id):
            async with screening_semaphore:
                print(f"DEBUG: Processing candidate ID {candidate_id}")
                # Fresh session for each parallel task to avoid race conditions
                task_db = next(get_db())
                try:
                    candidate = task_db.query(Candidate).filter(Candidate.id == candidate_id).first()
                    candidate.status = "Processing"
                    task_db.commit()
                    
                    print(f"DEBUG: Calling AI for candidate {candidate_id}")
                    evaluation = await evaluate_resume(criteria_dict, candidate.resume_text)
                    print(f"DEBUG: AI success for candidate {candidate_id}")
                    
                    candidate.candidate_name = evaluation.get("candidate_name")
                    candidate.email = evaluation.get("email")
                    candidate.phone = evaluation.get("phone")
                    candidate.skills_matched = evaluation.get("skills_matched")
                    candidate.skills_missing = evaluation.get("skills_missing")
                    candidate.education = evaluation.get("education")
                    candidate.experience_years = evaluation.get("experience_years")
                    candidate.match_score = evaluation.get("match_score")
                    candidate.strengths = evaluation.get("strengths")
                    candidate.weaknesses = evaluation.get("weaknesses")
                    candidate.recommendation = evaluation.get("recommendation")
                    candidate.summary = evaluation.get("summary")
                    candidate.status = "Completed"
                    task_db.commit()
                except Exception as e:
                    print(f"DEBUG: Error processing candidate {candidate_id}: {e}")
                    candidate.status = "Failed"
                    candidate.error_message = str(e)
                    task_db.commit()
                finally:
                    task_db.close()

        # Run all pending candidates in parallel
        await asyncio.gather(*[screen_candidate(c.id) for c in candidates])
    finally:
        db.close()

@app.post("/api/screen")
async def trigger_screening(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_screening)
    return {"status": "Processing started"}

@app.get("/api/results")
def get_results(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.match_score.desc()).all()

@app.get("/api/results/download")
def download_results(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    data = []
    for c in candidates:
        data.append({
            "Name": c.candidate_name, "Email": c.email, "Phone": c.phone,
            "Match Score": c.match_score, "Recommendation": c.recommendation,
            "Matched Skills": ", ".join(c.skills_matched) if c.skills_matched else "",
            "Missing Skills": ", ".join(c.skills_missing) if c.skills_missing else "",
            "Summary": c.summary
        })
    df = pd.DataFrame(data)
    csv_path = "screening_results.csv"
    df.to_csv(csv_path, index=False)
    return FileResponse(csv_path, filename=f"screening_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")

@app.delete("/api/reset")
def reset_data(db: Session = Depends(get_db)):
    db.query(Candidate).delete()
    db.query(InternshipCriteria).delete()
    db.commit()
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    return {"status": "All data cleared"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5001)
