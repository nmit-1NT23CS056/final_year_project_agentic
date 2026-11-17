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
    human_feedback: str = ""

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

@router.post("/generate")
def generate_roadmap(request: GenerateRequest = None, current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if request is None:
        request = GenerateRequest(force_regenerate=False)
        
    # 1. Fetch the user's profile from SQLite
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete the assessment first.")
        
    # 2. Check Cache (if human_feedback is passed, always force regenerate)
    should_regenerate = request.force_regenerate or bool(request.human_feedback.strip())
    if profile.saved_roadmap and not should_regenerate:
        print("Returning cached roadmap from database.")
        try:
            return {
                "roadmap": json.loads(profile.saved_roadmap),
                "adaptive_duration": profile.adaptive_duration or ""
            }
        except json.JSONDecodeError:
            pass # If it fails to parse, regenerate
            
    # 3. Convert to comprehensive dictionary to pass into our LangGraph State
    profile_dict = {
        "current_role": profile.current_role,
        "target_role": profile.target_role or profile.current_role,
        "persona": profile.persona or "student",
        "available_hours_per_week": profile.available_hours_per_week or 15,
        "years_of_experience": profile.years_of_experience,
        "core_skills": profile.core_skills,
        "skill_gaps": profile.skill_gaps,
        "career_motivator": profile.career_motivator,
        "market_demand_score": profile.market_demand_score,
        "github_link": profile.github_link or "",
        "online_courses": profile.online_courses or "[]",
        "human_goal": profile.human_goal or ""
    }
    
    initial_state = {
        "user_id": current_user_id,
        "profile_data": profile_dict,
        "revision_count": 0,
        "draft_roadmap": "",
        "critic_feedback": "",
        "final_roadmap": "",
        "human_feedback": request.human_feedback.strip(),
        "calculated_timeline": ""
    }
    
    # 4. Trigger the Multi-Agent System!
    try:
        print("Starting LangGraph execution...")
        final_state = career_agent.invoke(initial_state)
        print("LangGraph execution finished successfully!")
        
        final_roadmap = final_state.get("final_roadmap", "Failed to generate roadmap.")
        calculated_timeline = final_state.get("calculated_timeline", "")
        
        # 5. Save the generated roadmap and adaptive duration back to the database
        profile.saved_roadmap = json.dumps(final_roadmap)
        profile.adaptive_duration = calculated_timeline
        db.commit()
        
        # Return the roadmap drafted by the Strategist and approved by the Critic
        return {
            "roadmap": final_roadmap,
            "adaptive_duration": calculated_timeline
        }
    except Exception as e:
        print(f"Error in LangGraph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
