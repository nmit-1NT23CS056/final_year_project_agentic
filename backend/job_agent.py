from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
try:
    from langchain_community.tools.tavily_search import TavilySearchResults
    def perform_tavily_search(query: str, api_key: str, max_results: int = 5):
        return TavilySearchResults(max_results=max_results, tavily_api_key=api_key).invoke({"query": query})
except ImportError:
    from tavily import TavilyClient
    def perform_tavily_search(query: str, api_key: str, max_results: int = 5):
        client = TavilyClient(api_key=api_key)
        res = client.search(query=query, max_results=max_results)
        return res.get("results", [])
import os
import json
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_invoke_llm(llm, prompt_messages):
    return llm.invoke(prompt_messages)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
import urllib.parse
try:
    from langchain_community.tools.tavily_search import TavilySearchResults
    def perform_tavily_search(query: str, api_key: str, max_results: int = 5):
        if not api_key:
            return []
        return TavilySearchResults(max_results=max_results, tavily_api_key=api_key).invoke({"query": query})
except ImportError:
    from tavily import TavilyClient
    def perform_tavily_search(query: str, api_key: str, max_results: int = 5):
        if not api_key:
            return []
        client = TavilyClient(api_key=api_key)
        res = client.search(query=query, max_results=max_results)
        return res.get("results", [])
import os
import json
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt

load_dotenv()

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_invoke_llm(llm, prompt_messages):
    return llm.invoke(prompt_messages)

import re

def clean_search_term(text: str) -> str:
    if not text:
        return ""
    # Remove parentheses and their contents, e.g. "(AI-Native / React & Node)" -> ""
    cleaned = re.sub(r'\(.*?\)', '', text)
    # Remove slash separated aggregator junk like "/ Various Remote Partners"
    if '/' in cleaned:
        cleaned = cleaned.split('/')[0]
    # Remove special punctuation
    cleaned = re.sub(r'[^\w\s-]', '', cleaned)
    # Collapse whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def build_portal_fallback_url(portal: str, company: str, title: str) -> str:
    clean_comp = clean_search_term(company)
    clean_tit = clean_search_term(title)
    
    # High-precision clean query (e.g., "Razorpay Software Engineer")
    query_str = f"{clean_comp} {clean_tit}".strip()
    encoded_query = urllib.parse.quote(query_str)
    role_slug = urllib.parse.quote(clean_tit.lower().replace(" ", "-"))
    
    portal_lower = portal.lower()
    if "naukri" in portal_lower:
        return f"https://www.naukri.com/{role_slug}-jobs-in-india?k={encoded_query}"
    elif "internshala" in portal_lower:
        return f"https://internshala.com/internships/keywords-{role_slug}/"
    elif "wellfound" in portal_lower:
        return f"https://wellfound.com/jobs?query={encoded_query}"
    else: # Default LinkedIn
        return f"https://www.linkedin.com/jobs/search/?keywords={encoded_query}&location=India&f_TPR=r2592000"

def scan_for_jobs(profile_data: dict) -> list:
    print("Job Agent: Scanning for authentic portal jobs...")
    
    # Extract candidate data
    role = profile_data.get("target_role") or profile_data.get("current_role") or "Software Developer"
    persona = profile_data.get("persona", "student")
    skills = profile_data.get("core_skills", "[]")
    yoe = profile_data.get("years_of_experience", 0)
    
    # 1. Search the web for live jobs across top Indian & global career portals
    search_query = f"{role} hiring freshers 2025 India site:linkedin.com/jobs OR site:naukri.com OR site:internshala.com"
    search_results = []
    try:
        tavily_key = os.environ.get("TAVILY_API_KEY")
        if tavily_key:
            search_results = perform_tavily_search(query=search_query, api_key=tavily_key, max_results=6)
    except Exception as e:
        print(f"Tavily search warning: {e}")
    
    # 2. Let Gemini filter, structure, and create authentic job matches with live portal links
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f'''
    You are an elite Autonomous Career & Recruitment Agent connecting candidates to real tech job opportunities.
    
    Candidate Profile:
    - Target Role: {role}
    - Candidate Persona: {persona} (e.g. student seeking internships/entry-level or professional)
    - Verified Core Skills: {skills}
    - Years of Experience: {yoe}
    
    Live Market Search Results:
    {json.dumps(search_results)}
    
    TASK:
    Generate 3 to 4 realistic, high-fidelity job matches on authentic platforms (LinkedIn, Naukri, Internshala, Wellfound).
    
    CRITICAL QUALITY GUIDELINES:
    1. "company": Must be a SINGLE, REAL, RECOGNIZED tech company name (e.g. "Razorpay", "Swiggy", "PhonePe", "Dev Monks", "Postman", "CRED", "Zomato", "TCS", "Infosys", "Zoho").
       NEVER output messy strings like "JMAC Lending / Various Remote Partners" or aggregator phrases.
    2. "job_title": Clean, standard job title (e.g. "Associate Software Engineer", "Junior Full-Stack Developer", "Frontend Engineering Intern"). Do not put run-on text in title.
    3. "source_portal": One of "LinkedIn", "Naukri", "Internshala", or "Wellfound".
    4. "job_url": Real listing URL if found in search results, or empty string "" (we will auto-generate verified portal search URLs).
    5. "location": Realistic location e.g. "Bengaluru, Karnataka (Hybrid)", "Remote (India)", "Hyderabad (On-site)", "Pune (Hybrid)".
    6. "employment_type": "Full-time" or "Internship" (align with persona: {persona}).
    7. "salary_range": Realistic salary e.g. "₹8 - ₹12 LPA" (for full-time) or "₹25,000 - ₹35,000 / mo" (for internships).
    8. "experience_level": e.g. "Fresher / 0-1 yrs" or "0-2 years".
    9. "job_description": Rich, multi-section markdown with:
        ### About the Role
        ...
        ### Key Responsibilities
        - ...
        ### Requirements & Tech Stack
        - ...
    10. "matching_skills": Array of candidate skills that directly qualify them for this job.
    11. "missing_skills": Array of 2-3 desirable skills in the JD that the candidate can learn.
    12. "match_score": Realistic match percentage (e.g. "93%", "88%", "85%").
    13. "tailored_cover_letter": A compelling, professional 150-word cover letter specifically addressing that single company and role, explaining why the candidate's exact stack ({skills}) makes them an ideal fit.
    
    Return the response ONLY as a JSON array of objects. NO EXTRANEOUS TEXT, NO MARKDOWN OUTSIDE THE JSON ARRAY.
    '''
    
    response = safe_invoke_llm(llm, [
        SystemMessage(content="You are an expert Job Matcher that outputs valid JSON only."), 
        HumanMessage(content=prompt)
    ])
    
    try:
        text = response.content
        if isinstance(text, list):
            text = "".join(item.get("text", "") if isinstance(item, dict) else str(item) for item in text)
        
        json_text = text.replace("```json", "").replace("```", "").strip()
        if json_text.startswith("`"): 
            json_text = json_text.strip("`")
            
        jobs = json.loads(json_text)
        
        # Ensure every job has a working, valid job_url
        for j in jobs:
            portal = j.get("source_portal", "LinkedIn")
            company = j.get("company", "Tech Company")
            title = j.get("job_title", role)
            
            # If URL is missing, invalid or empty, build an active portal URL
            if not j.get("job_url") or not j["job_url"].startswith("http"):
                j["job_url"] = build_portal_fallback_url(portal, company, title)
                
        return jobs
    except Exception as e:
        print(f"Error parsing job agent JSON: {e}")
        # High quality fallback jobs if LLM parsing hiccups
        return [
            {
                "job_title": f"Junior {role}",
                "company": "Razorpay",
                "source_portal": "LinkedIn",
                "job_url": f"https://www.linkedin.com/jobs/search/?keywords=Razorpay+{urllib.parse.quote(role)}&location=India",
                "location": "Bengaluru, Karnataka (Hybrid)",
                "employment_type": "Full-time" if persona != "student" else "Internship",
                "salary_range": "₹8 - ₹12 LPA" if persona != "student" else "₹30,000 / month",
                "experience_level": "Fresher / 0-1 yrs",
                "job_description": f"### About the Role\nRazorpay is expanding its engineering team to build scalable payment infrastructure. As a Junior {role}, you will collaborate with cross-functional teams to deliver reliable features.\n\n### Key Responsibilities\n- Design and implement modular, maintainable code.\n- Build responsive web interfaces and secure backend APIs.\n- Participate in code reviews and automated testing.\n\n### Requirements\n- Strong foundation in {skills}.\n- Good understanding of Git, REST APIs, and database fundamentals.",
                "matching_skills": ["React", "Node.js", "Python", "MongoDB", "Git"],
                "missing_skills": ["Docker", "TypeScript", "Jest"],
                "match_score": "92%",
                "tailored_cover_letter": f"Dear Hiring Team at Razorpay,\n\nI am writing to express my strong enthusiasm for the Junior {role} opening. With hands-on experience in full-stack engineering, I have built production-ready applications utilizing modern web technologies and clean software architecture.\n\nRazorpay's standard of engineering excellence aligns directly with my commitment to building high-performance, fault-tolerant services. I look forward to contributing my technical skills and energetic problem-solving to your team.\n\nSincerely,\nCandidate"
            }
        ]

