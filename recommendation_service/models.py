from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from datetime import datetime
from database import Base

class InternshipCriteria(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String)
    required_skills = Column(String)  # Comma-separated
    preferred_skills = Column(String) # Comma-separated
    min_education = Column(String)
    experience_level = Column(String)
    custom_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String)
    email = Column(String)
    phone = Column(String)
    skills_matched = Column(JSON)
    skills_missing = Column(JSON)
    education = Column(String)
    experience_years = Column(Float)
    match_score = Column(Integer)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    recommendation = Column(String)
    summary = Column(Text)
    resume_text = Column(Text)
    resume_filename = Column(String)
    status = Column(String, default="Pending") # Pending, Processing, Completed, Failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
