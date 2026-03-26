# 🔍 Xplora — Multi-Agent AI Discovery Chatbot

> AI-powered multi-agent chatbot with agentic loop architecture. Discover the best spots worldwide. Built with LangGraph, Groq, and Streamlit.

[![Streamlit](https://img.shields.io/badge/Streamlit-Demo-FF4B4B?logo=streamlit)](https://your-app.streamlit.app)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-00C853)](https://github.com/langchain-ai/langgraph)

---

## ✨ What is Xplora?

Xplora is a multi-agent conversational AI that uses an **agentic loop** to process your queries intelligently. Instead of a single LLM call, Xplora routes your message through specialized agents:

```
User Message
     │
┌────▼────┐
│ Router  │ ← Classifies intent (research vs chat)
└────┬────┘
     │
┌────┴────┐
│         │
▼         ▼
Research   Chat
│         │
▼         │
┌──────┐  │
│Resear│  │
│cher  │  │
└──┬───┘  │
   │      │
   ▼      ▼
┌───────────┐
│ Responder │ → Final Response
└───────────┘
```

### 🧠 Agents

| Agent | Role |
|-------|------|
| **Router** | Classifies user intent and routes to the right agent |
| **Researcher** | Deep analysis, fact-gathering, structured research |
| **Responder** | Crafts the final user-facing response |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/xplora-ai.git
cd xplora-ai
pip install -r backend/requirements.txt
```

### 2. Set API Key

```bash
# Create .env in /backend
echo "GROQ_API_KEY=your_key_here" > backend/.env
```

Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 3. Run

**Streamlit Demo (recommended for quick start):**
```bash
streamlit run app.py
```

**FastAPI Backend (for React frontend):**
```bash
cd backend
python main.py
```

**React Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🏗️ Project Structure

```
xplora-ai/
├── app.py                 # Streamlit demo (deploy to Streamlit Cloud)
├── backend/
│   ├── main.py            # FastAPI backend
│   ├── .env               # API keys
│   ├── requirements.txt   # Python dependencies
│   └── core/
│       ├── graph.py       # Multi-agent LangGraph workflow
│       ├── state.py       # Shared agent state
│       ├── llm_client.py  # Groq LLM client
│       └── utils.py       # Utility functions
└── frontend/              # Next.js React frontend
    ├── components/
    ├── app/
    └── package.json
```

---

## 🛠️ Tech Stack

- **LLM**: Groq (Llama 3.3 70B) — free, fast inference
- **Orchestration**: LangGraph — multi-agent state machine
- **Backend**: FastAPI — async API server
- **Demo UI**: Streamlit — quick deploy to cloud
- **Frontend**: Next.js + React — full production UI
- **Language**: LangChain — LLM abstractions

---

## 📦 Deploy to Streamlit Cloud (Free)

1. Push to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your repo
4. Set `app.py` as the main file
5. Add `GROQ_API_KEY` to Streamlit secrets
6. Deploy! 🚀

---

## 🤝 Contributing

PRs welcome! Feel free to:
- Add new agents to the graph
- Integrate new LLM providers
- Improve the Streamlit UI
- Add conversation memory/persistence

---

## 📄 License

MIT License
