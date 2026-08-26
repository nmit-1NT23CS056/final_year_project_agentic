import os
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from dotenv import load_dotenv
from tavily import TavilyClient

# Load API keys from .env
load_dotenv()

# Define the State that agents will pass around
class AgentState(TypedDict):
    user_id: int
    profile_data: dict
    profiler_summary: str
    market_research: str
    draft_roadmap: str
    critic_feedback: str
    final_roadmap: str
    revision_count: int

# Initialize LLM and Tools
# If key is missing, it will throw an error when used, but we catch it in the router
def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

def get_tavily():
    key = os.environ.get("TAVILY_API_KEY")
    return TavilyClient(api_key=key) if key else None


# === Node 1: The Profiler ===
def profiler_node(state: AgentState):
    llm = get_llm()
    profile = state["profile_data"]
    prompt = f"""
    Analyze this IT professional's profile:
    {profile}
    Write a short, highly insightful paragraph summarizing their behavioral archetype, 
    their strengths, and their primary areas of improvement (especially regarding EQ).
    """
    res = llm.invoke([SystemMessage(content="You are an expert tech career profiler."), HumanMessage(content=prompt)])
    return {"profiler_summary": res.content}

# === Node 2: The Market Researcher ===
def researcher_node(state: AgentState):
    summary = state["profiler_summary"]
    motivator = state["profile_data"].get("career_motivator", "Impact")
    
    tavily = get_tavily()
    if not tavily:
        return {"market_research": "Tavily API key missing. Mock market data used."}
        
    query = f"Current 2026 job market trends, required AI skills, and average salary for IT professional matching: {summary} motivated by {motivator}"
    try:
        search_result = tavily.search(query=query, search_depth="basic")
        # Combine the snippets of the top search results
        context = "\n".join([res['content'] for res in search_result.get('results', [])])
    except Exception as e:
        context = f"Market research failed: {str(e)}"
        
    return {"market_research": context}

@tool
def search_market_data(query: str) -> str:
    """Use this tool to search the live internet for job market trends, salaries, or specific skills needed for a role."""
    tavily = get_tavily()
    if not tavily:
        return "Search unavailable. Proceed with general knowledge."
    try:
        res = tavily.search(query=query, search_depth="basic")
        return "\n".join([r['content'] for r in res.get('results', [])])
    except Exception as e:
        return str(e)


# === Node 3: The Career Strategist ===
def strategist_node(state: AgentState):
    llm = get_llm()
    # Bind our new LangChain Tool to the LLM!
    llm_with_tools = llm.bind_tools([search_market_data])
    
    profile = state["profile_data"]
    research = state.get("market_research", "")
    feedback = state.get("critic_feedback", "")
    
    # --- RAG IMPLEMENTATION ---
    company_knowledge = ""
    try:
        from routers.knowledge import get_vectorstore
        vectorstore = get_vectorstore()
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.invoke(f"career progression and skills for {state.get('profiler_summary', '')}")
        if docs:
            company_knowledge = "\n".join([doc.page_content for doc in docs])
            company_knowledge = f"\n\nInternal Company Guidelines (from RAG Database):\n{company_knowledge}"
    except Exception as e:
        pass 
    # --------------------------

    prompt = f"""
    Create a highly specific, multi-step career roadmap for this IT professional.
    Profile: {profile}
    Initial Market Research: {research}
    Previous Critic Feedback (Address this!): {feedback}
    {company_knowledge}
    
    If you need MORE specific live information (e.g., exact certifications or tools trending right now), 
    USE YOUR `search_market_data` TOOL to find out!
    
    Once you have all information, output a detailed, structured plan in Markdown format.
    Include Actionable Steps, Timeline, and Skill gaps.
    """
    
    # Setup our message history for the agent loop
    messages = [
        SystemMessage(content="You are an autonomous career strategist. You can use tools to research before answering. After using tools, output the final markdown roadmap."),
        HumanMessage(content=prompt)
    ]
    
    # Give the agent up to 3 turns to use tools and think
    for _ in range(3):
        res = llm_with_tools.invoke(messages)
        messages.append(res)
        
        # If the LLM didn't call a tool, it's done writing the roadmap!
        if not res.tool_calls:
            break
            
        # If it DID call a tool, execute the Python function for it
        for tool_call in res.tool_calls:
            if tool_call["name"] == "search_market_data":
                print(f"🤖 Strategist autonomously decided to search for: {tool_call['args']['query']}")
                tool_result = search_market_data.invoke(tool_call["args"])
                messages.append(ToolMessage(content=tool_result, tool_call_id=tool_call["id"]))
                
    # Ensure the final output is just text (in case it ended on a tool or complex block)
    final_output = res.content
    if isinstance(final_output, list):
        final_output = final_output[0].get("text", str(final_output))
        
    current_revisions = state.get("revision_count", 0)
    # The final message content is the completed roadmap
    return {"draft_roadmap": str(final_output), "revision_count": current_revisions + 1}

# === Node 4: The Critic ===
def critic_node(state: AgentState):
    llm = get_llm()
    draft = state["draft_roadmap"]
    profile = state["profile_data"]
    
    prompt = f"""
    Review this career roadmap against the user's profile.
    Profile: {profile}
    Roadmap: {draft}
    
    If the roadmap is generic, ignores their EQ scores, or fails to be actionable, output exactly:
    REJECT: <reason why it failed>
    
    If the roadmap is excellent, personalized, and ready for the user, output exactly:
    APPROVE
    """
    res = llm.invoke([SystemMessage(content="You are a strict, world-class CTO evaluator."), HumanMessage(content=prompt)])
    content = res.content.strip()
    
    if content.startswith("APPROVE"):
        return {"final_roadmap": draft, "critic_feedback": "APPROVED"}
    else:
        return {"critic_feedback": content}

# === Edge Routing Logic ===
def route_critic(state: AgentState):
    # If approved, or if we've looped 3 times (to prevent infinite loops), end the graph.
    if state.get("critic_feedback") == "APPROVED" or state.get("revision_count", 0) >= 3:
        # If we hit max revisions without approval, just use the last draft as final
        if state.get("critic_feedback") != "APPROVED":
            state["final_roadmap"] = state["draft_roadmap"] 
        return END
    
    # Otherwise, route back to the strategist to try again
    return "strategist"

# === Compile the LangGraph ===
graph = StateGraph(AgentState)
graph.add_node("profiler", profiler_node)
graph.add_node("researcher", researcher_node)
graph.add_node("strategist", strategist_node)
graph.add_node("critic", critic_node)

# Set the flow
graph.set_entry_point("profiler")
graph.add_edge("profiler", "researcher")
graph.add_edge("researcher", "strategist")
graph.add_edge("strategist", "critic")

# Add the conditional loop between critic and strategist
graph.add_conditional_edges("critic", route_critic, {END: END, "strategist": "strategist"})

career_agent = graph.compile()
