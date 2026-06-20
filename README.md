# NeuroAgent-PD

**Multi-agent clinical decision-support system for explainable Parkinson's disease analysis.**

NeuroAgent-PD is an autonomous healthcare AI platform that analyzes clinical, speech, and gait data to support Parkinson's disease risk assessment, severity estimation, autonomous triage, and explainable neurologist-facing reports.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│             Doctor Dashboard (Vite)              │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (port 5173)
┌──────────────────────▼──────────────────────────┐
│              Backend API (FastAPI)               │
│                  uvicorn (port 8000)              │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Clinical │ │  Speech  │ │   Gait   │         │
│  │  Agent   │ │  Agent   │ │  Agent   │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │            │            │                │
│  ┌────▼────────────▼────────────▼─────┐          │
│  │         Coordinator Agent          │          │
│  └────┬────────────┬────────────┬─────┘          │
│       │            │            │                │
│  ┌────▼───┐ ┌──────▼────┐ ┌────▼────────┐       │
│  │ Triage │ │ Conflict  │ │ Critic      │       │
│  │ Agent  │ │  Agent    │ │ (Safety)    │       │
│  └────────┘ └───────────┘ └─────────────┘       │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────┐       │
│  │  RAG Agent   │  │  Explainability     │       │
│  │ (PubMed)     │  │  Agent              │       │
│  └──────────────┘  └─────────────────────┘       │
│                                                  │
│  ┌─────────────────┐  ┌──────────────────┐       │
│  │ Progression     │  │ DBS Referral     │       │
│  │ Simulation      │  │ Agent            │       │
│  └─────────────────┘  └──────────────────┘       │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │         PostgreSQL (port 5435)         │      │
│  │   analysis_results | doctor_feedback   │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

## Agents

| Agent | Role |
|---|---|
| **Clinical Agent** | Analyzes UPDRS, tremor, rigidity, bradykinesia scores |
| **Speech Agent** | Analyzes jitter, shimmer, HNR, pitch variation |
| **Gait Agent** | Analyzes walking speed, stride variability, freezing, balance |
| **Coordinator Agent** | Fuses domain agent outputs into unified risk assessment |
| **Triage Agent** | Assigns priority level and clinical recommendation |
| **Conflict Agent** | Detects disagreement between agents |
| **Critic Agent** | Safety monitor that flags low-confidence predictions |
| **RAG Agent** | Retrieves Parkinson's evidence (simulated PubMed lookup) |
| **Explainability Agent** | Feature contribution breakdown per agent |
| **Progression Agent** | Simulates 12-month risk trajectory |
| **DBS Referral Agent** | Evaluates Deep Brain Stimulation candidacy |
| **Report Generator** | Produces doctor-facing clinical summary (optionally via LLM) |

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, scikit-learn, pandas
- **Frontend:** React 19, Vite, CSS
- **Database:** PostgreSQL 17 (Alpine)
- **Containerization:** Docker + Docker Compose
- **LLM Support:** Groq / Gemini (optional, for report generation)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend dev outside Docker)

### Setup

1. Clone the repo and copy the environment file:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open the dashboard at **http://localhost:5173**

4. Access the API docs at **http://localhost:8000/docs**

### Services

| Service | Port |
|---|---|
| Frontend (React) | 5173 |
| Backend API (FastAPI) | 8000 |
| PostgreSQL | 5435 |

## Usage

1. Select a patient from the sidebar or load the demo patient
2. Click **Run Agent Analysis** to execute all agents
3. Review results across the **Agent Analysis** tab:
   - Domain agent cards (clinical, speech, gait)
   - Feature contribution breakdown (Explainability)
   - Unified risk score (Coordinator)
   - Triage priority and recommendation
   - Safety monitor and conflict analysis
   - Medical evidence from RAG agent
   - 12-month progression simulation
   - DBS referral evaluation
4. View saved analysis history and submit doctor feedback

## LLM Integration

Set the following in `.env` to enable AI-generated clinical reports:

```env
LLM_ENABLED=true
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
```

## License

MIT
