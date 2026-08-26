from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.auth import get_current_user
from pydantic import BaseModel
import pdfplumber
import io
import os
import json
from google import genai
from fastapi_cache.decorator import cache

router = APIRouter(prefix="/api/profile", tags=["profile"])

class ProfileUpdate(BaseModel):
    technical_skills_score: float
    soft_skills_score: float
    career_motivator: str
    personality_type: str
    eq_self_awareness: float
    eq_empathy: float
    eq_self_regulation: float
    eq_motivation: float

@router.post("/")
def update_profile(profile_data: ProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if profile exists
    profile = db.query(models.AssessmentProfile).filter(models.AssessmentProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = models.AssessmentProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update fields
    for key, value in profile_data.dict().items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully", "profile": profile}

@router.get("/")
@cache(expire=300)
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.AssessmentProfile).filter(models.AssessmentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/upload-resume")
async def parse_resume(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read PDF content in memory
    content = await file.read()
    
    # Extract text using pdfplumber
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
                
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
    # Check if Gemini API key exists
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Mock response for testing if no key is provided yet
        return {
            "parsed_data": {
                "technical_skills_score": 8.5,
                "career_motivator": "Impact",
                "extracted_skills": ["Python", "React", "Cloud Architecture"],
                "notice": "This is mock data because GEMINI_API_KEY is not set."
            }
        }
        
    # Use Gemini to extract structured data
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
        You are an expert HR system. Parse the following resume text.
        Extract the following data into a pure JSON object (no markdown, just JSON):
        {{
            "technical_skills_score": (float 1-10 based on depth of experience),
            "career_motivator": (string, e.g., 'Leadership', 'Technical Depth', 'Impact')
        }}
        
        Resume Text:
        {extracted_text[:4000]} # Limit to 4k chars to save tokens for now
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        # Parse the JSON string from Gemini's response
        # We strip potential markdown codeblocks that LLMs sometimes add
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(json_text)
        
        return {"parsed_data": parsed_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse with AI: {str(e)}")
