from sqlalchemy import Boolean, Column, Integer, String, Float, Text
from database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # Clerk user ID
    
    current_role = Column(String, default="Unknown")
    years_of_experience = Column(Integer, default=0)
    core_skills = Column(Text, default="[]") # JSON string
    market_demand_score = Column(Integer, default=0)
    skill_gaps = Column(Text, default="[]") # JSON string
    career_motivator = Column(String, default="")

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
