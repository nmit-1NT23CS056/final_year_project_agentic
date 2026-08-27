from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from agent import career_agent

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

@router.post("/generate")
def generate_roadmap(current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Fetch the user's profile from SQLite
    profile = db.query(models.AssessmentProfile).filter(models.AssessmentProfile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete the assessment first.")
        
    # 2. Convert to dictionary to pass into our LangGraph State
    profile_dict = {
        "technical_skills_score": profile.technical_skills_score,
        "soft_skills_score": profile.soft_skills_score,
        "career_motivator": profile.career_motivator,
        "personality_type": profile.personality_type,
        "eq_self_awareness": profile.eq_self_awareness,
        "eq_empathy": profile.eq_empathy,
        "eq_self_regulation": profile.eq_self_regulation,
        "eq_motivation": profile.eq_motivation
    }
    
    initial_state = {
        "user_id": current_user_id,
        "profile_data": profile_dict,
        "revision_count": 0
    }
    
    # 3. Trigger the Multi-Agent System!
    try:
        print("Starting LangGraph execution...")
        final_state = career_agent.invoke(initial_state)
        print("LangGraph execution finished successfully!")
        
        # Return the roadmap drafted by the Strategist and approved by the Critic
        return {"roadmap": final_state.get("final_roadmap", "Failed to generate roadmap.")}
    except Exception as e:
        print(f"Error in LangGraph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
