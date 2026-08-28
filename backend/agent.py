from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Dict, Any
import os
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_invoke_llm(llm, prompt_messages):
    return llm.invoke(prompt_messages)

# Define the state for the agents
class AgentState(TypedDict):
    user_id: str
    profile_data: Dict[str, Any]
    draft_roadmap: str
    critic_feedback: str
    revision_count: int
    final_roadmap: str

def strategist_node(state: AgentState):
    print("Strategist: Drafting the initial roadmap...")
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    profile = state.get("profile_data", {})
    
    # Updated Profile Extraction based on new JSON
    role = profile.get("current_role", "Professional")
    yoe = profile.get("years_of_experience", 0)
    skills = profile.get("core_skills", "[]")
    gaps = profile.get("skill_gaps", "[]")
    motivator = profile.get("career_motivator", "Growth")
    
    prompt = f'''
    You are an elite Career Strategist AI.
    Create a highly personalized 3-month career development roadmap for this candidate.
    
    Candidate Profile:
    - Current Role: {role} ({yoe} years experience)
    - Verified Skills: {skills}
    - Market Gaps to Fill: {gaps}
    - Primary Motivator: {motivator}
    '''
    
    feedback = state.get("critic_feedback")
    if feedback and feedback != "APPROVED":
        prompt += f"\n\nPREVIOUS CRITIC FEEDBACK TO INCORPORATE:\n{feedback}"
        
    prompt += '''
    Your plan MUST address how to learn those exact missing market gaps over the next 3 months.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - You must use proper Markdown formatting.
    - Use Markdown Tables to display weekly/monthly schedules.
    - Use bold headers (##) for different sections.
    - Use bullet points for actionable tasks.
    - Keep it clean, professional, and visually structured. Do NOT output a single wall of text.
    '''
    
    response = safe_invoke_llm(llm, [SystemMessage(content="You are a career strategist."), HumanMessage(content=prompt)])
    content = response.content
    if isinstance(content, list):
        draft = " ".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
    else:
        draft = str(content)
        
    return {"draft_roadmap": draft}

def critic_node(state: AgentState):
    print(f"Critic: Reviewing draft (Revision {state['revision_count']})...")
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f'''
    You are an elite Career Coach and Critic. Review this roadmap draft.
    Does it directly address closing the candidate's skill gaps? Is it realistic for a {state['profile_data'].get("years_of_experience")} YOE {state['profile_data'].get("current_role")}?
    If it is excellent, reply with EXACTLY "APPROVED".
    If it needs improvement, provide 2-3 specific feedback points.
    
    Draft:
    {state['draft_roadmap']}
    '''
    
    response = safe_invoke_llm(llm, [SystemMessage(content="You are a harsh but fair critic."), HumanMessage(content=prompt)])
    content = response.content
    if isinstance(content, list):
        # Extract text if it's a list of blocks
        text_content = " ".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
        feedback = text_content.strip()
    else:
        feedback = str(content).strip()
    
    if "APPROVED" in feedback.upper() or state["revision_count"] >= 2:
        return {"final_roadmap": state["draft_roadmap"], "critic_feedback": "APPROVED"}
    else:
        return {"critic_feedback": feedback, "revision_count": state["revision_count"] + 1}

def routing_function(state: AgentState):
    if state.get("critic_feedback") == "APPROVED":
        return "end"
    return "strategist"

workflow = StateGraph(AgentState)
workflow.add_node("strategist", strategist_node)
workflow.add_node("critic", critic_node)

workflow.add_edge(START, "strategist")
workflow.add_edge("strategist", "critic")
workflow.add_conditional_edges("critic", routing_function, {"end": END, "strategist": "strategist"})

career_agent = workflow.compile()
