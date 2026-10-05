from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
import os
import json
import io
import pdfplumber
from google import genai
from fastapi_cache.decorator import cache
from langchain_community.tools.tavily_search import TavilySearchResults
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_generate_content(client, model, contents):
    return client.models.generate_content(model=model, contents=contents)

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("/")
def get_profile(current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...), current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    
    # Extract text using pdfplumber
    resume_text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                resume_text += page_text + "\n"
                
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
    api_key = os.environ.get("GEMINI_API_KEY")
    tavily_key = os.environ.get("TAVILY_API_KEY")
    if not api_key or not tavily_key:
        raise HTTPException(status_code=500, detail="Missing API Keys in backend.")
        
    try:
        # 1. Parse Resume using Gemini
        client = genai.Client(api_key=api_key)
        prompt = f'''
        You are an expert tech recruiter. Analyze the following resume text and extract the core data into a strict JSON object (NO markdown, ONLY valid JSON).
        Format:
        {{
            "current_role": "String (e.g., Software Engineer, Data Scientist, Student)",
            "years_of_experience": Integer,
            "core_skills": ["List", "of", "exact", "technologies"],
            "career_motivator": "String (e.g., Impact, Money, Learning, Growth)"
        }}
        Resume Text:
        {resume_text[:4000]}
        '''
        
        response = safe_generate_content(
            client=client,
            model='gemini-3.5-flash-lite',
            contents=prompt
        )
        
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(json_text)
        
        # 2. Market Fit Analysis using Tavily
        search = TavilySearchResults(max_results=3, tavily_api_key=tavily_key)
        role = parsed_data.get('current_role', 'Software Engineer')
        skills_str = ", ".join(parsed_data.get('core_skills', []))
        
        query = f"Current job market demand and missing skills for {role} knowing {skills_str}"
        market_results = search.invoke({"query": query})
        
        # Extract sources from Tavily results
        market_sources = []
        if isinstance(market_results, list):
            for res in market_results:
                if "url" in res:
                    market_sources.append(res["url"])
        
        market_context = json.dumps(market_results)
        
        # 3. Analyze Market Gap with Gemini
        gap_prompt = f'''
        You are a market analyst. Based on the candidate's skills: {skills_str} for the role of {role}.
        And the following live market data: {market_context}
        
        Determine their market demand score (0-100) and the top 3-5 missing skills they need to learn to be highly competitive.
        Provide a 2-sentence reasoning for the score, and assign a realistic percentage (60-95) representing how often each missing skill appears in job descriptions.
        Return STRICT JSON:
        {{
            "market_demand_score": Integer,
            "skill_gaps": ["List", "of", "missing", "skills"],
            "ai_reasoning": "A 2-sentence explanation of why they got this score based on market data.",
            "skill_demands": {{"Skill1": 85, "Skill2": 70}} // Map each missing skill from skill_gaps to an integer demand percentage
        }}
        '''
        gap_response = safe_generate_content(
            client=client,
            model='gemini-3.5-flash-lite',
            contents=gap_prompt
        )
        
        gap_json = gap_response.text.replace("```json", "").replace("```", "").strip()
        gap_data = json.loads(gap_json)
        
        # 4. Save to Database
        profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
        if not profile:
            profile = models.CandidateProfile(user_id=current_user_id)
            db.add(profile)
            
        profile.current_role = parsed_data.get('current_role', 'Unknown')
        profile.years_of_experience = parsed_data.get('years_of_experience', 0)
        profile.core_skills = json.dumps(parsed_data.get('core_skills', []))
        profile.career_motivator = parsed_data.get('career_motivator', 'Growth')
        profile.market_demand_score = gap_data.get('market_demand_score', 50)
        profile.skill_gaps = json.dumps(gap_data.get('skill_gaps', []))
        profile.market_sources = json.dumps(market_sources)
        profile.ai_reasoning = gap_data.get('ai_reasoning', '')
        profile.skill_demands = json.dumps(gap_data.get('skill_demands', {}))
        profile.saved_roadmap = None # Clear cached roadmap since skills changed
        
        db.commit()
        db.refresh(profile)
        
        return {"message": "Profile analyzed and saved successfully", "profile": profile}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze profile: {str(e)}")

from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    current_role: str
    years_of_experience: int
    core_skills: str
    career_motivator: str

@router.put("/")
def update_profile(profile_data: ProfileUpdate, current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
    if not profile:
        profile = models.CandidateProfile(user_id=current_user_id)
        db.add(profile)
        
    profile.current_role = profile_data.current_role
    profile.years_of_experience = profile_data.years_of_experience
    profile.core_skills = profile_data.core_skills
    profile.career_motivator = profile_data.career_motivator
    profile.saved_roadmap = None # Clear cached roadmap since skills changed
    
    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully", "profile": profile}
