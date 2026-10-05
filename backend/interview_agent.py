import os
import json
from typing import TypedDict, List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=30), stop=stop_after_attempt(5))
def safe_invoke_llm(llm, prompt_messages):
    return llm.invoke(prompt_messages)

class InterviewState(TypedDict):
    skills_to_test: str
    chat_history: List[Dict[str, str]]  
    latest_message: str
    ai_response: str

def interview_node(state: InterviewState):
    print("Interviewer: Processing user message...")
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=os.environ.get("GEMINI_API_KEY"))
    
    system_prompt = f"""
    You are an elite Senior IT Technical Interviewer and Mentor.
    You are helping the candidate practice the following skills: {state['skills_to_test']}
    
    INSTRUCTIONS:
    1. If this is the start of the conversation (no history), warmly greet the candidate, acknowledge their upcoming career goals, and ask how they would like to prepare today. Do NOT jump into a technical question immediately.
    2. Be highly adaptable. If the user asks a general question (e.g., "What is React?"), answer it clearly like a mentor.
    3. If the user asks you to interview them or test them, then you should start asking them technical questions (you can prioritize their missing skills, or ask general questions based on what they want).
    4. When evaluating answers: If they are correct, praise them and ask a harder question. If they are wrong or say "I don't know", switch to "Teacher Mode" and explain the concept simply.
    5. Keep responses conversational and concise (max 3-4 sentences). 
    4. Only ask ONE question at a time. Do not overwhelm them.
    """
    
    messages = [SystemMessage(content=system_prompt)]
    
    for msg in state.get("chat_history", []):
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "ai":
            messages.append(AIMessage(content=msg["content"]))
            
    if state.get("latest_message"):
        messages.append(HumanMessage(content=state["latest_message"]))
        
    response = safe_invoke_llm(llm, messages)
    content = response.content
    
    if isinstance(content, list):
        text_content = " ".join([c.get("text", "") for c in content if isinstance(c, dict) and "text" in c])
        final_response = text_content.strip()
    else:
        final_response = str(content).strip()
        
    return {"ai_response": final_response}

workflow = StateGraph(InterviewState)
workflow.add_node("interviewer", interview_node)
workflow.add_edge(START, "interviewer")
workflow.add_edge("interviewer", END)

interview_graph = workflow.compile()


