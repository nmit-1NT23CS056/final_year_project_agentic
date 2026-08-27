from sqlalchemy import Boolean, Column, Integer, String, Float
from database import Base

class AssessmentProfile(Base):
    __tablename__ = "assessment_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # Clerk user ID
    
    # 5-Dimensional Scores
    technical_skills_score = Column(Float, default=0.0)
    soft_skills_score = Column(Float, default=0.0)
    career_motivator = Column(String) # e.g., 'Impact', 'Compensation', 'Work-Life Balance'
    personality_type = Column(String) # e.g., INTJ, etc.
    
    # EQ Scores (Mayer-Salovey-Caruso model)
    eq_self_awareness = Column(Float, default=0.0)
    eq_empathy = Column(Float, default=0.0)
    eq_self_regulation = Column(Float, default=0.0)
    eq_motivation = Column(Float, default=0.0)

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    job_title = Column(String)
    company = Column(String)
    job_description = Column(String)
    match_score = Column(String)
    tailored_cover_letter = Column(String)
    status = Column(String, default="Found")
