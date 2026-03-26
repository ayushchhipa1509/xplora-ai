"""
Centralized LLM Client
Handles all LLM initialization and API key management
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq

backend_dir = Path(__file__).parent
root_dir = backend_dir.parent

load_dotenv(backend_dir / ".env")
if not os.getenv("GROQ_API_KEY"):
    load_dotenv(root_dir / ".env")

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY
else:
    print("⚠️  WARNING: GROQ_API_KEY not found in .env file!")

DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_TEMPERATURE = 0.7


def get_llm(model: str = None, temperature: float = None) -> ChatGroq:
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not found. Please set it in .env file in backend directory."
        )
    
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY
    
    return ChatGroq(
        model=model or DEFAULT_MODEL,
        temperature=temperature if temperature is not None else DEFAULT_TEMPERATURE
    )
