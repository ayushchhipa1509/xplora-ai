"""
Core Graph Definition
Multi-agent LangGraph workflow with agentic loop.

Agents:
  1. Router Agent   — Classifies intent & decides next step
  2. Researcher Agent — Gathers info / thinks deeply about the query
  3. Responder Agent  — Crafts the final user-facing response

Flow:
  User → Router → (Researcher ↔ Responder loop) → Response
"""
from langgraph.graph import StateGraph, END
from core.state import AgentState, AgentStage, default_state
from core.llm_client import get_llm
from core.utils import extract_json_from_response
from langchain_core.messages import AIMessage, HumanMessage


# ─────────────────────────────────────────────
# Agent 1: ROUTER
# Classifies user intent and decides the flow
# ─────────────────────────────────────────────
def router_agent(state: AgentState) -> dict:
    """
    Entry agent. Analyzes the user message and decides
    whether we need research or can respond directly.
    """
    print("\n🔀 === ROUTER AGENT ===")
    messages = state.get("messages", [])
    turn_count = state.get("turn_count", 0)

    # Get last user message
    last_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_message = msg.content
            break

    if not last_message:
        return {
            "messages": [AIMessage(content="Hey there! 👋 I'm Xplora, your AI assistant. Ask me anything — travel spots, recommendations, planning tips, or just chat!")],
            "stage": AgentStage.GREETING,
            "turn_count": turn_count + 1
        }

    # Use LLM to classify
    llm = get_llm(temperature=0)

    classify_prompt = f"""You are a routing agent. Classify the user's message intent.

User message: "{last_message}"

Return ONLY valid JSON:
{{
  "intent": "research" | "chat" | "greeting",
  "topic": "brief topic summary"
}}

Definitions:
- "research": User wants factual info, recommendations, comparisons, or discovery (e.g., "best beaches in Bali", "top restaurants in Paris", "compare iPhone vs Samsung")
- "chat": User wants general conversation, opinions, or simple Q&A (e.g., "how are you", "tell me a joke", "what can you do")
- "greeting": User is greeting or starting (e.g., "hi", "hello", "hey")
"""

    try:
        response = llm.invoke(classify_prompt)
        data = extract_json_from_response(response.content)
        intent = data.get("intent", "chat") if data else "chat"
        topic = data.get("topic", last_message) if data else last_message
        print(f"🔀 Router: intent={intent}, topic={topic}")
    except:
        intent = "chat"
        topic = last_message

    if intent == "greeting":
        return {
            "messages": [AIMessage(content="Hey! 👋 I'm Xplora. Ask me anything — I can research topics, find the best spots, recommend places, or just have a chat. What's on your mind?")],
            "stage": AgentStage.GREETING,
            "turn_count": turn_count + 1
        }

    if intent == "research":
        return {
            "stage": AgentStage.RESEARCHING,
            "user_query": topic,
            "current_agent": "researcher",
            "turn_count": turn_count + 1
        }

    # Default: direct chat
    return {
        "stage": AgentStage.CHATTING,
        "user_query": topic,
        "current_agent": "responder",
        "turn_count": turn_count + 1
    }


# ─────────────────────────────────────────────
# Agent 2: RESEARCHER
# Gathers information and structures findings
# ─────────────────────────────────────────────
def researcher_agent(state: AgentState) -> dict:
    """
    Research agent. Thinks deeply about the query,
    gathers structured information, and prepares data
    for the responder.
    """
    print("\n🔍 === RESEARCHER AGENT ===")
    messages = state.get("messages", [])
    user_query = state.get("user_query", "")

    # Get last user message for full context
    last_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_message = msg.content
            break

    llm = get_llm(temperature=0.3)

    research_prompt = f"""You are a research agent. Your job is to deeply analyze the user's query and provide comprehensive, structured research findings.

User's query: "{last_message}"
Topic: "{user_query}"

Your task:
1. Think step-by-step about what the user wants to know
2. Provide detailed, factual information
3. Include specific recommendations with reasons
4. Add practical tips and lesser-known insights
5. Structure your findings clearly

Return your research as a detailed JSON:
{{
  "topic": "main topic",
  "key_findings": ["finding 1", "finding 2", ...],
  "recommendations": [
    {{"name": "...", "why": "...", "details": "..."}},
    ...
  ],
  "pro_tips": ["tip 1", "tip 2", ...],
  "summary": "one-line summary of findings"
}}

Be thorough and specific. Include real places, real data, and actionable info.
"""

    try:
        response = llm.invoke(research_prompt)
        data = extract_json_from_response(response.content)

        if data:
            print(f"🔍 Researcher found: {data.get('summary', 'N/A')}")
            return {
                "search_results": [data],
                "stage": AgentStage.PLANNING,
                "current_agent": "responder"
            }
    except Exception as e:
        print(f"🔍 Research error: {e}")

    # Fallback: pass raw query to responder
    return {
        "search_results": [{"topic": user_query, "key_findings": [], "recommendations": [], "summary": "Direct response needed"}],
        "stage": AgentStage.PLANNING,
        "current_agent": "responder"
    }


# ─────────────────────────────────────────────
# Agent 3: RESPONDER
# Crafts the final user-facing response
# ─────────────────────────────────────────────
def responder_agent(state: AgentState) -> dict:
    """
    Responder agent. Takes research findings (or direct query)
    and crafts a beautiful, helpful response for the user.
    """
    print("\n💬 === RESPONDER AGENT ===")
    messages = state.get("messages", [])
    search_results = state.get("search_results")
    stage = state.get("stage", AgentStage.CHATTING)

    last_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_message = msg.content
            break

    llm = get_llm(temperature=0.7)

    if search_results and stage == AgentStage.PLANNING:
        # Research-based response
        import json
        research_data = json.dumps(search_results[0], indent=2) if search_results else "{}"

        response_prompt = f"""You are Xplora, a friendly and knowledgeable AI assistant. 
You have research data to share with the user.

User asked: "{last_message}"

Research findings:
{research_data}

Create a response that:
1. Is conversational, warm, and engaging (not robotic)
2. Presents the information in a clear, scannable format
3. Uses emojis sparingly but effectively (1-2 per section)
4. Includes specific recommendations with brief explanations
5. Ends with a follow-up question or offer to help more
6. Keeps sections concise — bullet points over paragraphs

Format: Use markdown-style formatting (bold, bullets, headers).
Max length: 400 words.
"""
    else:
        # Direct chat response
        response_prompt = f"""You are Xplora, a friendly and knowledgeable AI assistant.

User said: "{last_message}"

Respond naturally and helpfully. Be conversational, warm, and engaging.
Use 1-2 emojis. Keep it concise but helpful.
If the user asks what you can do, mention:
- Research and recommend places, restaurants, activities worldwide
- Compare options and help with decisions
- Share travel tips, cultural insights, and local knowledge
- Have a friendly chat about anything

Max length: 150 words.
"""

    try:
        response = llm.invoke(response_prompt)
        final_text = response.content.strip()
    except Exception as e:
        final_text = "I'm having a moment! 😅 Could you try asking that again?"

    return {
        "messages": [AIMessage(content=final_text)],
        "final_response": final_text,
        "stage": AgentStage.COMPLETED,
        "search_results": None  # Clear for next turn
    }


# ─────────────────────────────────────────────
# ROUTING FUNCTIONS
# ─────────────────────────────────────────────
def route_from_router(state: AgentState):
    """Decide where to go after the router."""
    stage = state.get("stage")
    print(f"🔀 Route from router: stage={stage}")

    if stage == AgentStage.RESEARCHING:
        return "researcher_agent"
    elif stage == AgentStage.CHATTING:
        return "responder_agent"
    return END  # Greeting already has a message


def route_from_researcher(state: AgentState):
    """After research, always go to responder."""
    return "responder_agent"


# ─────────────────────────────────────────────
# GRAPH CONSTRUCTION
# ─────────────────────────────────────────────
def create_workflow():
    """
    Build the multi-agent graph.

    Flow:
      ┌─────────────┐
      │ Router Agent │ ← Entry point
      └──────┬───────┘
             │
        ┌────┴────┐
        │         │
    Research?   Chat?
        │         │
        ▼         │
    ┌──────────┐  │
    │Researcher│  │
    └────┬─────┘  │
         │        │
         ▼        ▼
      ┌─────────────┐
      │  Responder   │ → END
      └──────────────┘
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("router_agent", router_agent)
    workflow.add_node("researcher_agent", researcher_agent)
    workflow.add_node("responder_agent", responder_agent)

    # Entry point
    workflow.set_entry_point("router_agent")

    # Router → (Researcher | Responder | END)
    workflow.add_conditional_edges(
        "router_agent",
        route_from_router,
        {
            "researcher_agent": "researcher_agent",
            "responder_agent": "responder_agent",
            END: END
        }
    )

    # Researcher → Responder (always)
    workflow.add_conditional_edges(
        "researcher_agent",
        route_from_researcher,
        {
            "responder_agent": "responder_agent"
        }
    )

    # Responder → END
    workflow.add_edge("responder_agent", END)

    return workflow.compile()
