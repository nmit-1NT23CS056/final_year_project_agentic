from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from job_agent import scan_for_jobs
from pydantic import BaseModel
import json
import datetime

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

class UpdateLetterRequest(BaseModel):
    tailored_cover_letter: str

@router.get("/")
def get_jobs(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    jobs = db.query(models.JobMatch).filter(models.JobMatch.user_id == current_user).order_by(models.JobMatch.id.desc()).all()
    return jobs

@router.post("/scan")
def trigger_job_scan(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete assessment.")
        
    profile_data = {
        "target_role": profile.target_role or profile.current_role,
        "current_role": profile.current_role,
        "persona": profile.persona or "student",
        "years_of_experience": profile.years_of_experience,
        "core_skills": profile.core_skills,
        "career_motivator": profile.career_motivator
    }
    
    # Run the agent
    found_jobs = scan_for_jobs(profile_data)
    
    # Keep applied jobs in history, remove old un-applied ones so user gets fresh active listings
    db.query(models.JobMatch).filter(
        models.JobMatch.user_id == current_user, 
        models.JobMatch.application_status != "Applied"
    ).delete()
    
    # Save newly discovered jobs to database
    for j in found_jobs:
        matching_skills_str = json.dumps(j.get("matching_skills", [])) if isinstance(j.get("matching_skills"), list) else str(j.get("matching_skills", "[]"))
        missing_skills_str = json.dumps(j.get("missing_skills", [])) if isinstance(j.get("missing_skills"), list) else str(j.get("missing_skills", "[]"))
        
        new_match = models.JobMatch(
            user_id=current_user,
            job_title=j.get("job_title", "Software Developer"),
            company=j.get("company", "Tech Company"),
            job_description=j.get("job_description", ""),
            match_score=j.get("match_score", "90%"),
            tailored_cover_letter=j.get("tailored_cover_letter", ""),
            job_url=j.get("job_url", ""),
            source_portal=j.get("source_portal", "LinkedIn"),
            location=j.get("location", "Remote / Hybrid"),
            employment_type=j.get("employment_type", "Full-time"),
            salary_range=j.get("salary_range", "Competitive"),
            experience_level=j.get("experience_level", "Fresher / 0-2 yrs"),
            matching_skills=matching_skills_str,
            missing_skills=missing_skills_str,
            application_status="Saved"
        )
        db.add(new_match)
    
    db.commit()
    
    return {"status": "success", "found": len(found_jobs)}

@router.put("/{job_id}/letter")
def update_cover_letter(job_id: int, request: UpdateLetterRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    job = db.query(models.JobMatch).filter(models.JobMatch.id == job_id, models.JobMatch.user_id == current_user).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.tailored_cover_letter = request.tailored_cover_letter
    db.commit()
    return {"status": "success", "message": "Cover letter saved successfully"}

@router.post("/{job_id}/apply")
def mark_job_applied(job_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    job = db.query(models.JobMatch).filter(models.JobMatch.id == job_id, models.JobMatch.user_id == current_user).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.application_status = "Applied"
    job.applied_at = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
    db.commit()
    return {
        "status": "success", 
        "message": "Application logged successfully", 
        "applied_at": job.applied_at,
        "job_url": job.job_url
    }

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    job = db.query(models.JobMatch).filter(models.JobMatch.id == job_id, models.JobMatch.user_id == current_user).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    db.delete(job)
    db.commit()
    return {"status": "success"}
