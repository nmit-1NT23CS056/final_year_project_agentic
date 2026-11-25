from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from starlette.background import BackgroundTask
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from pydantic import BaseModel
from typing import List, Dict
import json
import os
from fastapi.responses import StreamingResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from mem0 import Memory

router = APIRouter(prefix="/interview", tags=["interview"])

class ChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]] = []

def get_mem0_config():
    api_key = os.environ.get("GEMINI_API_KEY")
    return {
        "llm": {
            "provider": "gemini",
            "config": {
                "model": "gemini-2.0-flash",
                "api_key": api_key,
            }
        },
        "embedder": {
            "provider": "gemini",
            "config": {
                "model": "models/gemini-embedding-001",
                "api_key": api_key,
            }
        },
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "collection_name": "gemini_memories",
                "embedding_model_dims": 768,
            }
        }
    }

def save_memory_background(user_id: str, user_message: str, ai_response: str):
    try:
        m = Memory.from_config(get_mem0_config())
        m.add([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": ai_response}
        ], user_id=user_id)
        print(f"Background memory saved for user: {user_id}")
    except Exception as e:
        print(f"Error saving memory: {e}")

@router.post("/chat")
async def chat_with_interviewer(request: ChatRequest, current_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please upload a resume first.")
        
    skill_gaps = profile.skill_gaps or "[]"
    
    past_memories = ""
    try:
        m = Memory.from_config(get_mem0_config())
        results = m.search(request.message, filters={"user_id": current_user_id})
        if results:
            facts = [res['memory'] for res in results]
            past_memories = "\n".join(facts)
    except Exception as e:
        print(f"Memory search error: {e}")

    memory_context = ""
    if past_memories:
        memory_context = f"\nPAST KNOWLEDGE ABOUT THIS CANDIDATE:\n{past_memories}\n(Use this to proactively recall their past struggles/strengths and personalize your response.)\n"

    system_prompt = f"""
    You are an elite Senior Staff Engineer, Lead Software Architect, and empathetic AI Technical Mentor (operating with the intellect, depth, and clarity of ChatGPT / Claude).
    You assist the candidate with software engineering, system design, data structures, algorithms, cloud architecture, code reviews, and mock technical interviews.
    
    Candidate Context:
    - Target Desired Role: {profile.target_role or profile.current_role}
    - Verified Core Skills: {profile.core_skills}
    - Target Skill Gaps / Growth Areas: {skill_gaps}
    {memory_context}
    
    CRITICAL BEHAVIORAL INSTRUCTIONS:
    1. EXPLANATION & TEACHING REQUESTS (e.g. "teach me...", "explain...", "how does...", "what is..."):
       - ALWAYS provide an in-depth, structured, high-value masterclass response (similar to top answers on Claude or ChatGPT).
       - NEVER give a superficial, one-paragraph summary.
       - NEVER deflect by merely throwing a question back without first thoroughly teaching the concepts.
       - Structure your response cleanly using GitHub Markdown:
         * ### Core Concept & Architectural Overview
         * Key Building Blocks & Components (use bullet points or comparison tables)
         * Practical Code / Implementation Patterns (syntax highlighted with ```language)
         * Architectural Trade-offs & Production Realities (e.g. CAP theorem, caching strategies, latency vs consistency)
         * Senior Engineer Pro-Tip / Common Mistakes
         * 1 engaging follow-up thought or invitation for the next step.
          
    2. GREETINGS & CASUAL QUESTIONS (e.g. "hi", "hello", "who are you"):
       - Greet the candidate warmly, conversationally, and concisely as their AI Technical Mentor.
       - DO NOT lecture them or push missing skills unprompted. Let the candidate lead the direction.
          
    3. MOCK INTERVIEW MODE (e.g. "interview me", "quiz me", "ask me an interview question"):
       - Act as a rigorous, supportive FAANG-level interviewer.
       - Pose 1 realistic problem / scenario at a time (coding, architecture, or behavioral STAR method).
       - When the candidate answers, analyze their solution: point out strengths, edge cases missed, Big-O complexity, and guide them to optimal design.
          
    4. FORMATTING RULES:
       - Always format with Markdown: clear headings (###), bold key terms, tables, bulleted lists, and formatted code blocks.
       - Ensure high readability and professional aesthetic.
    """
    
    messages = [SystemMessage(content=system_prompt)]
    for msg in request.chat_history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg.get("content", "")))
        elif msg.get("role") == "ai" and msg.get("content", "").strip():
            messages.append(AIMessage(content=msg.get("content", "")))
            
    messages.append(HumanMessage(content=request.message))
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", api_key=os.environ.get("GEMINI_API_KEY"), temperature=0.7, max_retries=5)
    
    # We will accumulate the response to save it to memory
    response_container = {"text": ""}
    
    async def event_stream():
        try:
            async for chunk in llm.astream(messages):
                text_val = ""
                if isinstance(chunk.content, str):
                    text_val = chunk.content
                elif isinstance(chunk.content, list):
                    for item in chunk.content:
                        if isinstance(item, dict) and "text" in item:
                            text_val += item["text"]
                        elif isinstance(item, str):
                            text_val += item
                else:
                    text_val = str(chunk.content)
                
                if text_val:
                    response_container["text"] += text_val
                    yield f"data: {json.dumps({'text': text_val})}\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
    # When StreamingResponse finishes, it calls the background task
    task = BackgroundTask(
        save_memory_background,
        user_id=current_user_id,
        user_message=request.message,
        ai_response=response_container  # Wait, dict mutates, but we need a lazy eval or wrapper
    )
    
    # Better: just wrap the BackgroundTask logic inside a callable that reads response_container
    def bg_task():
        save_memory_background(current_user_id, request.message, response_container["text"])
        
    return StreamingResponse(event_stream(), media_type="text/event-stream", background=BackgroundTask(bg_task))
