from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Relationship to their assessment profile
    profile = relationship("AssessmentProfile", back_populates="owner", uselist=False)

class AssessmentProfile(Base):
    __tablename__ = "assessment_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
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
    
    owner = relationship("User", back_populates="profile")
