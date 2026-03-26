"""
Agent State Definition
Defines the state structure shared across the multi-agent graph.
"""
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from enum import Enum


class AgentStage(str, Enum):
    """Dialog stages for the multi-agent conversation flow."""
    GREETING = "greeting"
    CHATTING = "chatting"
    RESEARCHING = "researching"
    PLANNING = "planning"
    COMPLETED = "completed"


class AgentState(TypedDict):
    """Shared state across all agents in the graph."""
    messages: Annotated[List[BaseMessage], add_messages]

    # Flow control
    stage: AgentStage
    current_agent: Optional[str]

    # User context
    user_query: Optional[str]
    search_results: Optional[List[Dict[str, Any]]]

    # Response
    final_response: Optional[str]

    # Metadata
    conversation_id: Optional[str]
    turn_count: int


def default_state() -> AgentState:
    """Initialize a fresh conversation state."""
    return {
        "messages": [],
        "stage": AgentStage.GREETING,
        "current_agent": None,
        "user_query": None,
        "search_results": None,
        "final_response": None,
        "conversation_id": None,
        "turn_count": 0
    }
