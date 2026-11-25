from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Dict, Any, Optional
import os
import json
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
    human_feedback: Optional[str]
    calculated_timeline: Optional[str]

def calculate_adaptive_timeline(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes mathematical/pedagogical study effort and duration based on:
    - Number of skill gaps & difficulty
    - Persona (Student: 15-20 hrs/week vs Professional: 5-8 hrs/week)
    - Available weekly study bandwidth
    """
    persona = profile.get("persona", "student")
    hours_per_week = profile.get("available_hours_per_week") or (15 if persona == "student" else 6)
    
    # Parse gaps
    raw_gaps = profile.get("skill_gaps", "[]")
    if isinstance(raw_gaps, str):
        try:
            gaps = json.loads(raw_gaps)
        except Exception:
            gaps = [g.strip() for g in raw_gaps.split(",") if g.strip()]
    else:
        gaps = raw_gaps or []
        
    num_gaps = max(1, len(gaps))
    
    # Each missing skill has an estimated mastery requirement of ~15-20 hours
    total_effort_hours = num_gaps * 18
    calculated_weeks = max(1, round(total_effort_hours / max(1, hours_per_week)))
    
    if calculated_weeks <= 1:
        timeline_label = "1-Week Accelerated Sprint (Daily Milestones)"
    elif calculated_weeks <= 2:
        timeline_label = f"2-Week Rapid Sprint ({total_effort_hours} Total Study Hours @ {hours_per_week} hrs/week)"
    elif calculated_weeks <= 4:
        timeline_label = f"4-Week Targeted Bridge ({total_effort_hours} Total Study Hours @ {hours_per_week} hrs/week)"
    elif calculated_weeks <= 8:
        timeline_label = f"8-Week Comprehensive Mastery ({total_effort_hours} Total Study Hours @ {hours_per_week} hrs/week)"
    else:
        timeline_label = f"{calculated_weeks}-Week Progressive Career Transformation (@ {hours_per_week} hrs/week)"
        
    return {
        "timeline_label": timeline_label,
        "total_effort_hours": total_effort_hours,
        "calculated_weeks": calculated_weeks,
        "hours_per_week": hours_per_week,
        "num_gaps": num_gaps
    }

def strategist_node(state: AgentState):
    print("Strategist: Drafting the adaptive roadmap with DAG dependencies and actionable sources...")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    profile = state.get("profile_data", {})
    
    # Calculate adaptive timeline based on persona and hours
    timeline_meta = calculate_adaptive_timeline(profile)
    timeline_label = timeline_meta["timeline_label"]
    
    role = profile.get("current_role", "Professional")
    target_role = profile.get("target_role") or role
    yoe = profile.get("years_of_experience", 0)
    skills = profile.get("core_skills", "[]")
    gaps = profile.get("skill_gaps", "[]")
    persona = profile.get("persona", "student")
    hours_per_week = timeline_meta["hours_per_week"]
    human_feedback = state.get("human_feedback") or ""
    human_goal = profile.get("human_goal") or ""
    github_link = profile.get("github_link") or "None"
    
    prompt = f'''
    You are an elite Lead Career Strategist, Pedagogical Curriculum Designer, and Academic Bar Raiser.
    Design an ADAPTIVE, pedagogically validated learning roadmap for this candidate.
    
    Candidate Context:
    - Persona: {persona.upper()}
    - Current Position: {role} ({yoe} YOE)
    - TARGET ROLE GOAL: {target_role}
    - Verified Existing Skills: {skills}
    - Missing Skills to Bridge: {gaps}
    - Available Study Bandwidth: {hours_per_week} Hours / Week
    - Candidate GitHub / Projects: {github_link}
    - Candidate Stated Goal: {human_goal if human_goal else "Targeted career upskilling"}
    
    DETERMINED ADAPTIVE TIMELINE:
    {timeline_label}
    (Do NOT arbitrarily give a generic 3-month plan. You MUST strictly format the curriculum to fit this exact timeframe).
    '''
    
    if human_feedback:
        prompt += f"\n\nDIRECT HUMAN USER REVISION INSTRUCTIONS (HIGHEST PRIORITY):\n\"{human_feedback}\"\nDirectly implement and respect this user feedback in the revised plan.\n"
        
    feedback = state.get("critic_feedback")
    if feedback and feedback != "APPROVED":
        prompt += f"\n\nPREVIOUS CRITIC AGENT FEEDBACK TO RESOLVE:\n{feedback}\n"
        
    prompt += f'''
    MANDATORY PEDAGOGICAL REQUIREMENTS:
    1. TIMELINE & PACING JUSTIFICATION:
       Begin with a clean summary card explaining:
       - Persona ({persona.capitalize()}) & Study Pace ({hours_per_week} hrs/week).
       - Total Effort required to bridge gaps.
       - Exact calculated duration ({timeline_label}).
       
    2. TOPIC DEPENDENCIES & DIRECTED ACYCLIC GRAPH (DAG) ORDERING:
       For every milestone or topic, explicitly specify its dependency relation:
       - Tag as `[🔒 Prerequisite: Topic X]` (must be completed first) OR `[⚡ Independent / Parallel-Friendly]` (can be studied concurrently).
       - Ensure strictly proper pedagogical order (e.g. fundamentals/syntax -> core design -> hands-on capstone project).
       
    3. ACTIONABLE LEARNING SOURCES FOR EVERY OBJECTIVE:
       For every topic/skill, provide real, high-quality, verified clickable sources:
       - 📖 **Official Documentation**: Direct official docs link (e.g., `[Official Docs](https://...)`)
       - 🎓 **Top Free Course / Video**: High quality Coursera/freeCodeCamp/DeepLearning.AI/YouTube tutorial
       - 💻 **Hands-On GitHub Repository / Practice Lab**: Open-source starter repository or project to build
       
    4. PRACTICAL CAPSTONE PROJECT DELIVERABLE:
       Include a concrete, senior-level project deliverable for the target role ({target_role}) that proves real-world competency.
       
    5. FORMATTING:
       - Use clean Markdown with headers (`##`, `###`), tables, bullet points, and highlight badges (`[Prerequisite]`, `[Parallel]`).
       - Keep it clear, professional, structured, and visually engaging.
    '''
    
    response = safe_invoke_llm(llm, [SystemMessage(content="You are an elite career strategist and curriculum architect."), HumanMessage(content=prompt)])
    content = response.content
    if isinstance(content, list):
        draft = " ".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
    else:
        draft = str(content)
        
    return {"draft_roadmap": draft, "calculated_timeline": timeline_label}

def critic_node(state: AgentState):
    print(f"Critic: Evaluating adaptive roadmap (Revision {state['revision_count']})...")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f'''
    You are an elite Academic and Industry Technical Bar Raiser.
    Review this roadmap drafted by the Strategist Agent.
    
    Evaluation Checklist:
    1. Does it strictly adhere to the adaptive timeline ({state.get("calculated_timeline")}) instead of an arbitrary 3-month plan?
    2. Does it clearly label topic dependencies (Prerequisites vs Parallel-friendly)?
    3. Does it include actionable learning sources (Docs, Courses, GitHub repos)?
    4. Does it address the candidate's target role ({state['profile_data'].get("target_role")})?
    
    IMPORTANT: You are focused on speed and efficiency. If it meets these criteria and is logically structured, reply with EXACTLY "APPROVED".
    Only reject if it fails critical dependencies or ignores the adaptive duration.
    
    Draft to Review:
    {state['draft_roadmap']}
    '''
    
    response = safe_invoke_llm(llm, [SystemMessage(content="You are a fair, high-standard curriculum reviewer."), HumanMessage(content=prompt)])
    content = response.content
    if isinstance(content, list):
        text_content = " ".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
        feedback = text_content.strip()
    else:
        feedback = str(content).strip()
        
    if "APPROVED" in feedback.upper() or state["revision_count"] >= 1:
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



