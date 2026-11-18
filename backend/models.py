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
    
    # Real-World Portal & Application Kit Fields
    job_url = Column(String, default="")
    source_portal = Column(String, default="LinkedIn") # LinkedIn, Naukri, Internshala, Wellfound, Company Careers
    location = Column(String, default="Remote / Hybrid")
    employment_type = Column(String, default="Full-time") # Full-time, Internship, Contract
    salary_range = Column(String, default="Competitive")
    experience_level = Column(String, default="Fresher / 0-2 yrs")
    matching_skills = Column(Text, default="[]") # JSON list of matched skills
    missing_skills = Column(Text, default="[]") # JSON list of missing skills
    application_status = Column(String, default="Saved") # "Saved", "Applied"
    applied_at = Column(String, default="")
