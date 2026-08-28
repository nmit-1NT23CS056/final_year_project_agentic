import os
import json
import io
import pdfplumber
from google import genai
from langchain_community.tools.tavily_search import TavilySearchResults
from dotenv import load_dotenv

load_dotenv()

# Extract text using pdfplumber
resume_text = ""
with pdfplumber.open("dummy.pdf") as pdf:
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            resume_text += page_text + "\n"

print("Extracted text:", resume_text)

api_key = os.environ.get("GEMINI_API_KEY")
tavily_key = os.environ.get("TAVILY_API_KEY")

try:
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
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    json_text = response.text.replace("```json", "").replace("```", "").strip()
    parsed_data = json.loads(json_text)
    print("Parsed data:", parsed_data)
    
    search = TavilySearchResults(max_results=3, tavily_api_key=tavily_key)
    role = parsed_data.get('current_role', 'Software Engineer')
    skills_str = ", ".join(parsed_data.get('core_skills', []))
    
    query = f"Current job market demand and missing skills for {role} knowing {skills_str}"
    market_results = search.invoke({"query": query})
    market_context = json.dumps(market_results)
    print("Tavily successful")
    
    gap_prompt = f'''
    You are a market analyst. Based on the candidate's skills: {skills_str} for the role of {role}.
    And the following live market data: {market_context}
    
    Determine their market demand score (0-100) and the top 3-5 missing skills they need to learn to be highly competitive.
    Return STRICT JSON:
    {{
        "market_demand_score": Integer,
        "skill_gaps": ["List", "of", "missing", "skills"]
    }}
    '''
    gap_response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=gap_prompt
    )
    
    gap_json = gap_response.text.replace("```json", "").replace("```", "").strip()
    gap_data = json.loads(gap_json)
    print("Final success:", gap_data)
    
except Exception as e:
    import traceback
    traceback.print_exc()
