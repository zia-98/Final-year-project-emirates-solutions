import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

async def evaluate_resume(criteria: dict, resume_text: str) -> dict:
    """Evaluate a resume against criteria using Gemini API."""
    
    system_prompt = """You are an expert HR recruiter and resume evaluator. 
Your job is to evaluate resumes against internship criteria and 
return ONLY a valid JSON object with no extra text."""

    user_prompt = f"""
Internship Criteria:
{json.dumps(criteria, indent=2)}

Resume Text:
{resume_text}

Evaluate this resume and return a JSON object with these exact fields:
candidate_name, email, phone, skills_matched (array), skills_missing (array),
education, experience_years (number), match_score (0-100), 
strengths (array), weaknesses (array), recommendation (Shortlist/Maybe/Reject),
summary (2 sentences max)

Return ONLY the JSON. No markdown, no explanation.
"""

    try:
        response = await model.generate_content_async(
            f"{system_prompt}\n\n{user_prompt}"
        )
        
        # Parse result
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        # Return a fallback error structure
        return {
            "candidate_name": "Parsing Failed",
            "email": "N/A",
            "phone": "N/A",
            "skills_matched": [],
            "skills_missing": [],
            "education": "N/A",
            "experience_years": 0.0,
            "match_score": 0,
            "strengths": [],
            "weaknesses": ["AI Evaluation Failed"],
            "recommendation": "Reject",
            "summary": f"Could not evaluate resume due to an error: {str(e)}"
        }
