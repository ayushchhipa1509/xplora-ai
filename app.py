"""
Xplora AI Chatbot — Streamlit Demo
Multi-agent conversational AI powered by LangGraph + Groq.

Run: streamlit run app.py
"""
import streamlit as st
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# ─── Path Setup ───
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Load env
load_dotenv(backend_dir / ".env")
load_dotenv(Path(__file__).parent / ".env")


# ─── Page Config ───
st.set_page_config(
    page_title="Xplora — AI Discovery Chatbot",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── Custom CSS ───
st.markdown("""
<style>
    /* Dark theme overrides */
    .stApp {
        background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%);
    }

    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1a1a3e 0%, #0f0c29 100%);
        border-right: 1px solid rgba(255,255,255,0.05);
    }

    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #e0d4ff;
    }

    /* Chat message styling */
    .stChatMessage {
        background: rgba(255,255,255,0.03) !important;
        border: 1px solid rgba(255,255,255,0.05) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(10px);
    }

    /* Input styling */
    .stChatInputContainer {
        border-color: rgba(139, 92, 246, 0.3) !important;
    }

    /* Metric cards */
    [data-testid="stMetric"] {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 16px;
    }

    /* Success/info boxes */
    .stAlert {
        border-radius: 12px !important;
    }

    /* Button styling */
    .stButton button {
        border-radius: 8px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(139, 92, 246, 0.1);
        transition: all 0.3s ease;
    }
    .stButton button:hover {
        background: rgba(139, 92, 246, 0.3);
        border-color: rgba(139, 92, 246, 0.6);
    }

    /* Header gradient text */
    .gradient-text {
        background: linear-gradient(135deg, #a78bfa, #c084fc, #e879f9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
    }

    /* Agent badge */
    .agent-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 4px;
    }
    .agent-router { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
    .agent-researcher { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .agent-responder { background: rgba(244, 114, 182, 0.2); color: #f9a8d4; border: 1px solid rgba(244, 114, 182, 0.3); }
</style>
""", unsafe_allow_html=True)


# ─── Sidebar ───
with st.sidebar:
    st.markdown('<h1 class="gradient-text">🔍 Xplora</h1>', unsafe_allow_html=True)
    st.caption("Multi-Agent AI Discovery Chatbot")

    st.divider()

    # API Configuration
    st.markdown("### ⚙️ API Configuration")

    api_provider = st.selectbox(
        "Provider",
        ["Groq (Free)", "OpenAI", "Anthropic"],
        index=0,
        help="Select your LLM provider"
    )

    api_key_input = st.text_input(
        "API Key",
        type="password",
        placeholder="Enter your API key...",
        value=os.getenv("GROQ_API_KEY", ""),
        help="Your API key for the selected provider"
    )

    model_name = st.selectbox(
        "Model",
        ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
        if "Groq" in api_provider
        else ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
        index=0
    )

    if api_key_input:
        os.environ["GROQ_API_KEY"] = api_key_input

    st.divider()

    # Architecture Info
    st.markdown("### 🏗️ Agent Architecture")
    st.markdown("""
    ```
    User Message
         │
    ┌────▼────┐
    │ Router  │ ← Classifies intent
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Research   Chat
    │         │
    ▼         │
 ┌──────┐    │
 │Resear│    │
 │cher  │    │
 └──┬───┘    │
    │        │
    ▼        ▼
 ┌───────────┐
 │ Responder │ → Final Answer
 └───────────┘
    ```
    """)

    st.divider()

    # Conversation controls
    st.markdown("### 💬 Conversation")
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.session_state.agent_log = []
        if "graph_state" in st.session_state:
            del st.session_state["graph_state"]
        st.rerun()

    st.divider()
    st.caption("Built with LangGraph + Groq • [GitHub](https://github.com)")


# ─── Initialize Session State ───
if "messages" not in st.session_state:
    st.session_state.messages = []
if "agent_log" not in st.session_state:
    st.session_state.agent_log = []


# ─── Main Chat Area ───
st.markdown('<h2 class="gradient-text">Chat with Xplora</h2>', unsafe_allow_html=True)
st.caption("Discover the best spots, get recommendations, or just chat! 🌍")

# Display chat history
for msg in st.session_state.messages:
    role = msg["role"]
    with st.chat_message(role, avatar="🔍" if role == "assistant" else "👤"):
        # Show agent badge if available
        if role == "assistant" and msg.get("agent"):
            agent = msg["agent"]
            badge_class = {
                "router": "agent-router",
                "researcher": "agent-researcher",
                "responder": "agent-responder"
            }.get(agent, "agent-responder")
            st.markdown(f'<span class="agent-badge {badge_class}">🔹 {agent.title()} Agent</span>', unsafe_allow_html=True)
        st.markdown(msg["content"])


# ─── Chat Input ───
if prompt := st.chat_input("Ask Xplora anything..."):
    # Check API key
    if not api_key_input and not os.getenv("GROQ_API_KEY"):
        st.error("⚠️ Please enter your API key in the sidebar to start chatting.")
        st.stop()

    # Display user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    # Process with multi-agent graph
    with st.chat_message("assistant", avatar="🔍"):
        with st.spinner("🔀 Routing through agents..."):
            try:
                # Import and build graph
                from core.graph import create_workflow
                from core.state import default_state, AgentStage
                from langchain_core.messages import HumanMessage as HM, AIMessage as AM

                # Get or create state
                if "graph_state" not in st.session_state:
                    st.session_state.graph_state = default_state()

                state = st.session_state.graph_state
                state["messages"].append(HM(content=prompt))

                # Run graph
                workflow_instance = create_workflow()
                result = workflow_instance.invoke(state, {"recursion_limit": 25})

                # Extract response
                last_ai = None
                for msg in reversed(result.get("messages", [])):
                    if isinstance(msg, AM):
                        last_ai = msg
                        break

                response_text = last_ai.content if last_ai else "I'm having a moment! Could you try again?"
                agent_used = result.get("current_agent", "responder")

                # Show agent badge
                badge_class = {
                    "router": "agent-router",
                    "researcher": "agent-researcher",
                    "responder": "agent-responder"
                }.get(agent_used, "agent-responder")

                st.markdown(f'<span class="agent-badge {badge_class}">🔹 {agent_used.title()} Agent</span>', unsafe_allow_html=True)
                st.markdown(response_text)

                # Save state
                st.session_state.graph_state = result
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": response_text,
                    "agent": agent_used
                })

                # Agent log
                st.session_state.agent_log.append({
                    "query": prompt,
                    "agent": agent_used,
                    "stage": result.get("stage", "unknown")
                })

            except Exception as e:
                import traceback
                traceback.print_exc()
                error_msg = f"Error: {str(e)}"
                st.error(error_msg)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": f"⚠️ {error_msg}",
                    "agent": "error"
                })


# ─── Footer Metrics ───
if st.session_state.agent_log:
    st.divider()
    cols = st.columns(3)
    with cols[0]:
        st.metric("💬 Messages", len(st.session_state.messages))
    with cols[1]:
        research_count = sum(1 for log in st.session_state.agent_log if log.get("agent") == "researcher")
        st.metric("🔍 Research Calls", research_count)
    with cols[2]:
        st.metric("🔀 Agent Hops", len(st.session_state.agent_log))
