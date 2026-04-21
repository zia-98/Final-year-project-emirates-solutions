
import pandas as pd
import numpy as np
import re
from collections import Counter

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import linear_kernel
    SKLEARN_AVAILABLE = True
except Exception as e:
    SKLEARN_AVAILABLE = False
    TfidfVectorizer = None
    linear_kernel = None
    print(f"WARNING: scikit-learn unavailable, using fallback text similarity. Detail: {e}")

from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

# Force load environment variables from .env
load_dotenv(override=True)

class InternshipRecommender:
    def __init__(self, data_path='internships.csv'):
        self.data_path = data_path
        self.df = None
        self.tfidf_matrix = None
        self.tfidf = None
        self.indices = None
        
        # Initialize LLM for Re-ranking
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
            print("LLM Re-ranker initialized.")
        else:
            self.llm = None
            print("WARNING: No API Key found for Re-ranking.")

    def load_data(self):
        """Loads the dataset and handles missing values."""
        try:
            self.df = pd.read_csv(self.data_path)
            self.df = self.df.fillna('')
            print(f"Loaded {len(self.df)} internships.")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False

    def preprocess_text(self, text):
        """Simple text preprocessing."""
        if not isinstance(text, str):
            return ""
        return text.lower()

    def create_features(self):
        """Combines relevant columns into a single text feature."""
        self.df['combined_features'] = (
            self.df['title'] + " " +
            self.df['skills_required'] + " " +
            self.df['description'] + " " +
            self.df['domain'] + " " + 
            self.df['location']
        )
        self.df['combined_features'] = self.df['combined_features'].apply(self.preprocess_text)

    def train(self):
        """Vectorizes the text data and computes the cosine similarity matrix."""
        if SKLEARN_AVAILABLE:
            self.tfidf = TfidfVectorizer(stop_words='english')
            self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined_features'])
        else:
            self.tfidf = None
            self.tfidf_matrix = None
        self.indices = pd.Series(self.df.index, index=self.df['title'].apply(lambda x: x.lower())).drop_duplicates()
        print("Model trained successfully.")

    def _token_overlap_score(self, query_text, doc_text):
        """Fallback similarity score when sklearn isn't available."""
        q_tokens = re.findall(r"[a-z0-9]+", str(query_text).lower())
        d_tokens = re.findall(r"[a-z0-9]+", str(doc_text).lower())
        if not q_tokens or not d_tokens:
            return 0.0

        q_counter = Counter(q_tokens)
        d_counter = Counter(d_tokens)
        intersection = sum((q_counter & d_counter).values())
        norm = (sum(v * v for v in q_counter.values()) ** 0.5) * (sum(v * v for v in d_counter.values()) ** 0.5)
        if norm == 0:
            return 0.0
        return intersection / norm

    def recommend(self, profile_or_title, top_n=5, assessment_scores=None, user_history=None):
        """
        Returns top N recommended internships with AI-assisted re-ranking.
        """
        query_text = ""
        preferred_domain = ""
        skill_proficiency = {"python": 1, "sql": 1, "java": 1}

        if isinstance(profile_or_title, str):
            query_text = profile_or_title.lower()
        elif isinstance(profile_or_title, dict):
            skills = profile_or_title.get('skills', '')
            interests = profile_or_title.get('interests', '')
            projects = profile_or_title.get('projects', '')
            location_pref = profile_or_title.get('locationPreference', '')
            preferred_domain = profile_or_title.get('preferredDomain', '').lower()
            preferred_domain = preferred_domain.replace(' intern', '').strip()
            
            education = profile_or_title.get('education', '')
            resume_text = profile_or_title.get('resumeText', '')
            
            level_map = {"Advanced": 2.5, "Intermediate": 1.5, "Beginner": 1.0, "": 1.0}
            skill_proficiency["python"] = level_map.get(profile_or_title.get('pythonLevel', ''), 1.0)
            skill_proficiency["sql"] = level_map.get(profile_or_title.get('sqlLevel', ''), 1.0)
            skill_proficiency["java"] = level_map.get(profile_or_title.get('javaLevel', ''), 1.0)
            
            levels_text = f"{profile_or_title.get('pythonLevel', '')} Python {profile_or_title.get('sqlLevel', '')} SQL {profile_or_title.get('javaLevel', '')} Java"
            parts = [skills, interests, projects, location_pref, preferred_domain, education, resume_text, levels_text]
            query_text = " ".join([p for p in parts if p]).lower()
        
        if not query_text:
            return []

        # 1. Base Retrieval (TF-IDF Similarity)
        if SKLEARN_AVAILABLE and self.tfidf is not None and self.tfidf_matrix is not None:
            query_vec = self.tfidf.transform([query_text])
            sim_scores = linear_kernel(query_vec, self.tfidf_matrix).flatten()
        else:
            sim_scores = np.array([
                self._token_overlap_score(query_text, row_text)
                for row_text in self.df['combined_features']
            ])

        # 2. Heuristic Scoring & Filtering
        candidates = []
        for idx, score in enumerate(sim_scores):
            internship = self.df.iloc[idx]
            role_domain = str(internship.get('domain', '')).lower()
            role_title = str(internship.get('title', '')).lower()
            required_skills = str(internship.get('skills_required', '')).lower()
            
            current_score = score ** 0.5
            
            # Domain Match (DYNAMIC Weighting)
            if preferred_domain and (preferred_domain in role_domain or role_domain in preferred_domain):
                current_score *= 4.0  # Much higher boost for explicitly selected domain
            
            # Activity/History Boost
            if user_history and role_domain in [h.get('domain', '').lower() for h in user_history]:
                current_score *= 1.5 # Boost roles in domains the user has applied to
            
            # Skill Level Boost
            for skill, weight in skill_proficiency.items():
                if weight > 1.0 and skill in (role_title + " " + required_skills):
                    current_score *= weight
            
            # Assessment Boost
            if assessment_scores:
                skill_score = assessment_scores.get(internship.get('domain', ''), 0) / 100.0
                if skill_score > 0:
                    current_score = (0.6 * current_score) + (0.4 * skill_score)

            if current_score > 0.05:
                candidates.append((idx, current_score))

        # Sort and take top 10 for AI Re-ranking (to keep it fast)
        candidates = sorted(candidates, key=lambda x: x[1], reverse=True)[:10]
        
        # 3. AI RE-RANKING (Semantic Accuracy)
        if self.llm and candidates:
            try:
                # Prepare candidates for AI
                ai_list = []
                for idx, _ in candidates:
                    row = self.df.iloc[idx]
                    ai_list.append(f"ID:{idx} - {row['title']} (Domain: {row['domain']}) - Skills: {row['skills_required']}")
                
                prompt = f"""
                You are a career matching expert. 
                Identify the BEST internship matches for this student profile. 
                Rank them by technical fit and career progression.
                
                USER PROFILE:
                - Skills: {profile_or_title.get('skills', 'N/A') if isinstance(profile_or_title, dict) else 'N/A'}
                - Interests: {profile_or_title.get('interests', 'N/A') if isinstance(profile_or_title, dict) else 'N/A'}
                - Selected Field: {preferred_domain}
                - Skill Levels: {skill_proficiency}
                - Resume Context: {query_text[:500]}...
                
                CANDIDATES:
                {chr(10).join(ai_list)}
                
                TASK:
                Return ONLY a JSON array of the top 5 ranked IDs with a 1-sentence expert 'reasoning'.
                Example: [{{"id": 0, "reasoning": "Fits your advanced Python skill level."}}]
                """
                
                response = self.llm.invoke(prompt)
                ai_data = response.content
                # Robust extraction
                import json, re
                match = re.search(r'\[.*\]', ai_data, re.DOTALL)
                if match:
                    ai_rankings = json.loads(match.group(0))
                    
                    results = []
                    for rank_info in ai_rankings:
                        idx = int(rank_info['id'])
                        item = self.df.iloc[idx].to_dict()
                        item['matchScore'] = round((10 - ai_rankings.index(rank_info)) * 10, 2) # Synthetic score for UI
                        item['reasoning'] = rank_info['reasoning']
                        item['matchedSkills'] = [s.strip() for s in str(item.get('skills_required', '')).split() if s.strip()]
                        item['id'] = str(item.get('internship_id', idx))
                        results.append(item)
                    return results
            except Exception as e:
                print(f"AI Re-ranking error: {e}. Falling back to heuristics.")

        # Fallback Results (if AI fails or not enabled)
        results = []
        for idx, score in candidates[:top_n]:
            item = self.df.iloc[idx].to_dict()
            item['matchScore'] = min(99, round(score * 40, 2))
            item['reasoning'] = f"Matches your {item.get('domain')} preferences."
            item['matchedSkills'] = [s.strip() for s in str(item.get('skills_required', '')).split() if s.strip()]
            item['id'] = str(item.get('internship_id', idx))
            results.append(item)

        return results
