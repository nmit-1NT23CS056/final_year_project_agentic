from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
import os
import json
import io
import re
import urllib.request
import pdfplumber
from google import genai

def audit_github_profile(github_input: str) -> dict:
    """
    Directly queries the official GitHub REST API to audit a candidate's real public activity,
    extracting top repositories, programming languages used, and star counts.
    """
    if not github_input or not github_input.strip():
        return {"verified": False, "reason": "No GitHub link provided by candidate"}
        
    try:
        raw = github_input.strip().rstrip("/")
        match = re.search(r"github\.com/([a-zA-Z0-9_-]+)", raw)
        username = match.group(1) if match else raw.split("/")[-1]
        
        if not username:
            return {"verified": False, "reason": "Invalid GitHub profile URL"}
            
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=6"
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "Career-Advisory-Agent", "Accept": "application/vnd.github.v3+json"}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            repos_data = json.loads(response.read().decode())
            
        if not isinstance(repos_data, list) or len(repos_data) == 0:
            return {
                "verified": True, 
                "username": username, 
                "repo_count": 0, 
                "reason": "Profile exists but has 0 public repositories"
            }
            
        top_repos = []
        languages = set()
        total_stars = 0
        
        for r in repos_data:
            lang = r.get("language")
            if lang:
                languages.add(lang)
            stars = r.get("stargazers_count", 0)
            total_stars += stars
            top_repos.append({
                "name": r.get("name"),
                "language": lang or "Unspecified",
                "stars": stars,
                "description": (r.get("description") or "No description provided")[:120]
            })
            
        return {
            "verified": True,
            "username": username,
            "repo_count": len(top_repos),
            "top_repos": top_repos[:5],
            "detected_languages": list(languages),
            "total_stars": total_stars
        }
    except Exception as e:
        print(f"Notice: GitHub live audit skipped: {e}")
        return {"verified": False, "reason": f"GitHub live query error: {str(e)}"}
try:
    from langchain_community.tools.tavily_search import TavilySearchResults
    def perform_tavily_search(query: str, api_key: str, max_results: int = 3):
        return TavilySearchResults(max_results=max_results, tavily_api_key=api_key).invoke({"query": query})
except ImportError:
    from tavily import TavilyClient
    def perform_tavily_search(query: str, api_key: str, max_results: int = 3):
        client = TavilyClient(api_key=api_key)
        res = client.search(query=query, max_results=max_results)
        return res.get("results", [])
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
async def parse_resume(
    file: UploadFile = File(...),
    persona: str = Form("student"),
    target_role: str = Form(""),
    available_hours_per_week: int = Form(15),
    github_link: str = Form(""),
    online_courses: str = Form("[]"),
    human_goal: str = Form(""),
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
        # 1. Parse Resume using Gemini (extract skills, role, and practical project summary)
        client = genai.Client(api_key=api_key)
        prompt = f'''
        You are an expert tech recruiter and technical evaluator.
        Analyze the following resume text and extract the candidate's core profile into a strict JSON object (NO markdown, ONLY valid JSON).
        Format:
        {{
            "current_role": "String (e.g., Software Engineer, Data Scientist, Student)",
            "years_of_experience": Integer,
            "core_skills": ["List", "of", "exact", "technologies", "and", "languages"],
            "career_motivator": "String (e.g., Impact, Money, Learning, Growth)",
            "projects_summary": "2-3 sentences summarizing the practical projects, tech stack used, and complexity demonstrated in the resume"
        }}
        Resume Text:
        {resume_text[:4500]}
        '''
        
        response = safe_generate_content(
            client=client,
            model='gemini-3.5-flash-lite',
            contents=prompt
        )
        
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(json_text)
        
        # 2. Determine target position and Market Fit Analysis using Tavily
        extracted_role = parsed_data.get('current_role', 'Software Engineer')
        effective_target = target_role.strip() if target_role and target_role.strip() else extracted_role
        skills_str = ", ".join(parsed_data.get('core_skills', []))
        
        query = f"Current job market demand, required skills, and missing skills for {effective_target} knowing {skills_str}"
        market_results = perform_tavily_search(query=query, api_key=tavily_key, max_results=3)
        
        # Extract sources from Tavily results
        market_sources = []
        if isinstance(market_results, list):
            for res in market_results:
                if "url" in res:
                    market_sources.append(res["url"])
        
        market_context = json.dumps(market_results)
        
        # 3. Live GitHub Public API Audit
        github_audit = audit_github_profile(github_link)
        
        # 4. Analyze Market Gap & Calculate 100-Mark Rubric with Gemini
        gap_prompt = f'''
        You are an elite Senior IT Technical Hiring Bar Raiser and Academic Project Evaluator.
        Candidate Evaluation Data:
        - Persona: {persona} (Available study time: {available_hours_per_week} hrs/week)
        - Current Role: {extracted_role} ({parsed_data.get("years_of_experience", 0)} YOE)
        - Target Desired Role: {effective_target}
        - Verified Skills: {skills_str}
        - Resume Projects Summary: {parsed_data.get("projects_summary", "None listed")}
        - LIVE GITHUB AUDIT (Scraped from GitHub REST API): {json.dumps(github_audit)}
        - Online Courses & Certifications (NPTEL/Coursera): {online_courses}
        - Specific Candidate Goal: {human_goal if human_goal else "General upskilling"}
        - Live Job Market Data: {market_context}
        
        Task:
        1. Evaluate how ready this candidate is specifically for their TARGET ROLE: {effective_target}.
        2. Distribute 100 total marks across 5 foundational domains:
           - "Languages & Core CS" (Max: 20 marks)
           - "Target Domain Alignment" (Max: 30 marks)
           - "Cloud, DevOps & Systems" (Max: 20 marks)
           - "Projects & Practical Proof" (Max: 15 marks):
             * Strictly grade using the LIVE GITHUB AUDIT. If the user has verified public repositories matching their tech stack, award high marks (12-15).
             * If GitHub audit failed, has 0 public repositories, or is missing, penalize appropriately (down to 4-8 marks) and state this in the reasoning.
           - "Courses & Certifications" (Max: 15 marks):
             * Grade based on reported online courses (NPTEL, Coursera, etc.) and completion percentage.
           (The sum of these 5 domain scores is their exact market_demand_score out of 100).
        3. Identify the top 3-5 critical missing skills they need to learn for {effective_target}.
        4. Assign a realistic demand percentage (60-95) for each missing skill based on live market demand.
        5. Provide a 2-sentence executive reasoning for the score explicitly mentioning what GitHub/project evidence was found.
        
        Return STRICT JSON (NO MARKDOWN):
        {{
            "market_demand_score": Integer (sum of the 5 domain scores, between 0 and 100),
            "skill_gaps": ["List", "of", "3-5", "missing", "skills"],
            "ai_reasoning": "2-sentence executive summary explaining the evaluation against the target role.",
            "skill_demands": {{"Skill1": 85, "Skill2": 70}},
            "domain_marks": {{
                "Languages & Core CS": {{"score": Integer, "max": 20}},
                "Target Domain": {{"score": Integer, "max": 30}},
                "Cloud & DevOps": {{"score": Integer, "max": 20}},
                "Projects & GitHub": {{"score": Integer, "max": 15}},
                "Courses & Certs": {{"score": Integer, "max": 15}}
            }}
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
            
        profile.current_role = extracted_role
        profile.years_of_experience = parsed_data.get('years_of_experience', 0)
        profile.core_skills = json.dumps(parsed_data.get('core_skills', []))
        profile.career_motivator = parsed_data.get('career_motivator', 'Growth')
        profile.market_demand_score = gap_data.get('market_demand_score', 50)
        profile.skill_gaps = json.dumps(gap_data.get('skill_gaps', []))
        profile.market_sources = json.dumps(market_sources)
        profile.ai_reasoning = gap_data.get('ai_reasoning', '')
        profile.skill_demands = json.dumps(gap_data.get('skill_demands', {}))
        
        # Save new adaptive fields
        profile.persona = persona
        profile.target_role = effective_target
        profile.available_hours_per_week = available_hours_per_week
        profile.github_link = github_link
        profile.online_courses = online_courses
        profile.human_goal = human_goal
        profile.domain_marks = json.dumps(gap_data.get('domain_marks', {}))
        
        profile.saved_roadmap = None # Clear cached roadmap since skills or target changed
        
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
    persona: str = "student"
    target_role: str = ""
    available_hours_per_week: int = 15
    github_link: str = ""
    online_courses: str = "[]"
    human_goal: str = ""

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
    profile.persona = profile_data.persona
    profile.target_role = profile_data.target_role
    profile.available_hours_per_week = profile_data.available_hours_per_week
    profile.github_link = profile_data.github_link
    profile.online_courses = profile_data.online_courses
    profile.human_goal = profile_data.human_goal
    profile.saved_roadmap = None # Clear cached roadmap since skills changed
    
    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully", "profile": profile}
