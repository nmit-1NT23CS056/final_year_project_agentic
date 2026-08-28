from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.tools.tavily_search import TavilySearchResults
import os
import json
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_invoke_llm(llm, prompt_messages):
    return llm.invoke(prompt_messages)

def scan_for_jobs(profile_data: dict) -> list:
    print("Job Agent: Scanning for jobs...")
    
    # Extract candidate data
    role = profile_data.get("current_role", "Software Engineer")
    skills = profile_data.get("core_skills", "[]")
    
    # 1. Search the web for live jobs
    search = TavilySearchResults(max_results=5, tavily_api_key=os.environ.get("TAVILY_API_KEY"))
    query = f"recent remote jobs hiring for {role} requiring {skills}"
    search_results = search.invoke({"query": query})
    
    # 2. Let Gemini filter and rank the jobs, then write cover letters
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f'''
    You are an elite Autonomous Job Hunter Agent.
    I have provided you with a list of live job search results.
    
    Candidate Profile:
    - Role: {role}
    - Skills: {skills}
    - YOE: {profile_data.get("years_of_experience", 0)}
    
    Search Results:
    {json.dumps(search_results)}
    
    Task:
    1. Filter out irrelevant jobs. Keep up to 3 best matches.
    2. For each match, write a short, highly tailored cover letter (150 words) that highlights the candidate's exact skills mapping to the job.
    
    Return the results EXACTLY as a JSON array of objects with keys: "job_title", "company", "job_description", "match_score" (String like '95%'), "tailored_cover_letter".
    NO MARKDOWN, JUST RAW JSON ARRAY.
    '''
    
    response = safe_invoke_llm(llm, [SystemMessage(content="You are a Job Matcher."), HumanMessage(content=prompt)])
    
    try:
        json_text = response.content.replace("`json", "").replace("`", "").strip()
        jobs = json.loads(json_text)
        return jobs
    except Exception as e:
        print(f"Error parsing job agent JSON: {e}")
        return []
