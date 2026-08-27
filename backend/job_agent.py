import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

def get_tavily():
    key = os.environ.get("TAVILY_API_KEY")
    return TavilyClient(api_key=key) if key else None

def scan_for_jobs(profile: dict, user_id: str):
    tavily = get_tavily()
    llm = get_llm()
    
    motivator = profile.get("career_motivator", "Impact")
    tech_score = profile.get("technical_skills_score", 5.0)
    
    role_level = "Junior" if tech_score < 4.0 else "Mid-Level" if tech_score < 7.0 else "Senior"
    search_query = f"{role_level} IT software engineering jobs hiring now, emphasizing {motivator}"
    
    search_results = []
    if tavily:
        try:
            res = tavily.search(query=search_query, search_depth="basic")
            search_results = res.get("results", [])[:3]
        except Exception:
            pass
            
    if not search_results:
        search_results = [
            {"title": f"{role_level} Backend Engineer", "content": "Looking for Python/FastAPI experts to build scalable infrastructure.", "url": "https://example.com/job1"},
            {"title": f"{role_level} Fullstack Developer", "content": "React and Node.js developer needed for a fast-paced AI startup.", "url": "https://example.com/job2"},
            {"title": f"Lead Cloud Architect", "content": "AWS/GCP experience required. Focus on security and deployment pipelines.", "url": "https://example.com/job3"}
        ]
        
    jobs_found = []
    
    for result in search_results:
        job_title = result.get('title', 'Software Engineer')
        url = result.get('url', 'https://tech.company/job')
        company = url.split('/')[2] if '//' in url else 'Tech Startup'
        description = result.get('content', '')
        
        prompt = f'''
        You are an expert career agent working on behalf of a candidate.
        Candidate Profile: {json.dumps(profile)}
        Job Title: {job_title}
        Company: {company}
        Job Description: {description}
        Write a highly persuasive, 3-paragraph tailored cover letter for this candidate applying to this exact job.
        Highlight their technical score ({tech_score}/10) and their career motivator ({motivator}).
        '''
        
        res = llm.invoke([
            SystemMessage(content="You are an autonomous job application writer. Return ONLY the cover letter text."),
            HumanMessage(content=prompt)
        ])
        
        match_score = f"{int(min(99, 50 + (tech_score * 4)))}%"
        
        jobs_found.append({
            "job_title": job_title,
            "company": company,
            "job_description": description,
            "match_score": match_score,
            "tailored_cover_letter": res.content,
            "status": "Found"
        })
        
    return jobs_found
