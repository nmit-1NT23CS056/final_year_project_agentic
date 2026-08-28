from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from job_agent import scan_for_jobs

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("/")
def get_jobs(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    jobs = db.query(models.JobMatch).filter(models.JobMatch.user_id == current_user).all()
    return jobs

@router.post("/scan")
def trigger_job_scan(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete assessment.")
        
    profile_data = {
        "current_role": profile.current_role,
        "years_of_experience": profile.years_of_experience,
        "core_skills": profile.core_skills,
        "career_motivator": profile.career_motivator
    }
    
    # Run the agent
    found_jobs = scan_for_jobs(profile_data)
    
    # Save to database
    for j in found_jobs:
        new_match = models.JobMatch(
            user_id=current_user,
            job_title=j["job_title"],
            company=j["company"],
            job_description=j["job_description"],
            match_score=j["match_score"],
            tailored_cover_letter=j["tailored_cover_letter"]
        )
        db.add(new_match)
    
    db.commit()
    
    return {"status": "success", "found": len(found_jobs)}
