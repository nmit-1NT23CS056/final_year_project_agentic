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
    saved_roadmap = Column(Text, nullable=True) # Stores the cached JSON roadmap
    market_sources = Column(Text, default="[]") # JSON string of URL sources
    ai_reasoning = Column(Text, default="")
    skill_demands = Column(Text, default="[]") # JSON string mapping skill to demand %

    # Adaptive Profile & Evaluation Fields
    persona = Column(String, default="student") # "student" or "professional"
    target_role = Column(String, default="")
    available_hours_per_week = Column(Integer, default=15)
    github_link = Column(String, default="")
    online_courses = Column(Text, default="[]") # JSON string of [{course_name, completion_percentage}]
    human_goal = Column(Text, default="")
    domain_marks = Column(Text, default="{}") # JSON string mapping domains to marks scored & max marks
    adaptive_duration = Column(String, default="") # e.g. "2 Weeks Sprint"
    topic_dependencies = Column(Text, default="[]") # JSON string of DAG dependencies

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
