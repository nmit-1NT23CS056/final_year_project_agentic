from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from agent import career_agent

from pydantic import BaseModel
import json

class GenerateRequest(BaseModel):
    force_regenerate: bool = False

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

@router.post("/generate")
def generate_roadmap(request: GenerateRequest = None, current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if request is None:
        request = GenerateRequest(force_regenerate=False)
        
    # 1. Fetch the user's profile from SQLite
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete the assessment first.")
        
    # 2. Check Cache
    if profile.saved_roadmap and not request.force_regenerate:
        print("Returning cached roadmap from database.")
        try:
            return {"roadmap": json.loads(profile.saved_roadmap)}
        except json.JSONDecodeError:
            pass # If it fails to parse, just regenerate
            
    # 3. Convert to dictionary to pass into our LangGraph State
    profile_dict = {
        "current_role": profile.current_role,
        "years_of_experience": profile.years_of_experience,
        "core_skills": profile.core_skills,
        "skill_gaps": profile.skill_gaps,
        "career_motivator": profile.career_motivator,
        "market_demand_score": profile.market_demand_score
    }
    
    initial_state = {
        "user_id": current_user_id,
        "profile_data": profile_dict,
        "revision_count": 0
    }
    
    # 4. Trigger the Multi-Agent System!
    try:
        print("Starting LangGraph execution...")
        final_state = career_agent.invoke(initial_state)
        print("LangGraph execution finished successfully!")
        
        final_roadmap = final_state.get("final_roadmap", "Failed to generate roadmap.")
        
        # 5. Save the generated roadmap back to the database
        profile.saved_roadmap = json.dumps(final_roadmap)
        db.commit()
        
        # Return the roadmap drafted by the Strategist and approved by the Critic
        return {"roadmap": final_roadmap}
    except Exception as e:
        print(f"Error in LangGraph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
