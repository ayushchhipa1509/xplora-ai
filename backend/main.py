"""
Xplora AI Chatbot — FastAPI Backend
Multi-agent conversational AI powered by LangGraph + Groq.
"""
from core.state import AgentState, default_state
from core.graph import create_workflow
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
import sys
import os
import uuid
from dotenv import load_dotenv
from pathlib import Path

# ─── Environment Setup ───
root_dir = Path(__file__).parent.parent
backend_dir = Path(__file__).parent

load_dotenv(root_dir / ".env")
load_dotenv(backend_dir / ".env")

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


# ─── FastAPI App ───
app = FastAPI(
    title="Xplora AI Chatbot API",
    description="Multi-agent conversational AI with agentic loop architecture",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build the multi-agent graph
workflow = create_workflow()


# ─── Models ───
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    stage: str
    agent_used: Optional[str] = None


# ─── In-Memory Conversation Store ───
conversations: Dict[str, AgentState] = {}


def get_or_create_state(conversation_id: str) -> AgentState:
    if conversation_id not in conversations:
        conversations[conversation_id] = default_state()
    return conversations[conversation_id]


# ─── Endpoints ───
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint — routes through multi-agent graph."""
    try:
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY not configured. Please set it in .env file"
            )

        os.environ["GROQ_API_KEY"] = GROQ_API_KEY

        conversation_id = request.conversation_id or str(uuid.uuid4())
        print(f"\n📩 MESSAGE: '{request.message}'")

        state = get_or_create_state(conversation_id)
        state["messages"].append(HumanMessage(content=request.message))

        # Run the multi-agent graph
        config = {"recursion_limit": 25}
        result = await workflow.ainvoke(state, config=config)

        # Extract last AI message
        last_ai_message = None
        for msg in reversed(result.get("messages", [])):
            if isinstance(msg, AIMessage):
                last_ai_message = msg
                break

        response_text = last_ai_message.content if last_ai_message else "I'm sorry, I didn't understand that."

        # Save state
        conversations[conversation_id] = result

        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            stage=result.get("stage", "greeting"),
            agent_used=result.get("current_agent")
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Xplora AI Chatbot",
        "api_key": "configured" if GROQ_API_KEY else "missing",
        "provider": "Groq"
    }


@app.get("/")
async def root():
    """API root — info endpoint."""
    return {
        "name": "Xplora AI Chatbot",
        "version": "2.0.0",
        "description": "Multi-agent conversational AI with agentic loop",
        "endpoints": {
            "chat": "POST /chat",
            "health": "GET /health",
            "graph": "GET /graph-info"
        }
    }


@app.get("/graph-info")
async def graph_info():
    """Returns info about the multi-agent architecture."""
    return {
        "architecture": "Multi-Agent LangGraph",
        "agents": [
            {
                "name": "Router Agent",
                "role": "Classifies intent & routes to appropriate agent",
                "triggers": "Every user message"
            },
            {
                "name": "Researcher Agent",
                "role": "Deep analysis, fact-gathering, structured research",
                "triggers": "When user asks for recommendations, comparisons, or factual info"
            },
            {
                "name": "Responder Agent",
                "role": "Crafts the final user-facing response",
                "triggers": "After research is complete, or for direct chat"
            }
        ],
        "flow": "Router → (Researcher → Responder) | (Responder) → Response",
        "agentic_loop": "Router decides → Researcher gathers → Responder delivers"
    }


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation from memory."""
    if conversation_id in conversations:
        del conversations[conversation_id]
        return {"status": "deleted", "conversation_id": conversation_id}
    raise HTTPException(status_code=404, detail="Conversation not found")


@app.get("/conversations")
async def list_conversations():
    """List active conversation IDs."""
    return {
        "active_conversations": len(conversations),
        "ids": list(conversations.keys())
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
