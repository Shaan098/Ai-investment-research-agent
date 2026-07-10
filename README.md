# AI Investment Research Agent

An AI agent that takes a company name, researches it autonomously using live web search, and returns an INVEST/PASS decision with supporting reasoning and sources.

Built for the InsideIIM × Altuni AI Labs AI Product Development Engineer (Intern) take-home assignment.

**Build period:** July 3 – July 10, 2026 (within the assignment's 7-day window)

---

## Overview

Given a company name, this app:
1. Spins up a tool-calling LLM agent that decides for itself what to search for (financials, leadership news, legal/regulatory issues, competitive position, industry trends) and how many searches it needs.
2. Runs those searches live using the Tavily search API.
3. Takes the agent's free-form findings and converts them into a strict structured object (decision, confidence score, summary, reasoning, key factors, sources) using a schema-constrained second LLM pass.
4. Displays the result in a simple React UI as a decision badge, confidence %, written reasoning, key factors, and clickable source links.

This is deliberately built as an **agentic** system rather than a fixed pipeline: the LLM decides what to look up and when it has enough information, rather than following a hardcoded sequence of steps for every company.

---

## Tech stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **AI orchestration:** LangChain.js + LangGraph.js (`createReactAgent`)
- **LLM:** Google Gemini (`gemini-2.5-flash-lite`) via `@langchain/google-genai`
- **Search tool:** Tavily (`@langchain/tavily`)
- **Structured output:** Zod schema + LangChain's `withStructuredOutput`

---

## How to run

### Prerequisites
- Node.js (v18+) installed
- A free [Google AI Studio](https://aistudio.google.com/apikey) API key (Gemini)
- A free [Tavily](https://tavily.com) API key

### 1. Clone / unzip the project
```
investment-research-agent/
├── client/   ← React frontend
└── server/   ← Express + LangChain backend
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create a `.env` file inside `server/` (copy `.env.example` and fill in your keys):
```
GOOGLE_API_KEY=your_gemini_key_here
TAVILY_API_KEY=your_tavily_key_here
PORT=5000
```

Start the backend:
```bash
node index.js
```
You should see: `Server running on port 5000`

### 3. Set up the frontend
In a **second terminal**:
```bash
cd client
npm install
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

### 4. Use it
Type a company name into the input box and click "Research." The agent will search the web live and return a decision after ~15-30 seconds.

---

## How it works (architecture)

```
User enters company name (React)
        │
        ▼
POST /api/research (Express)
        │
        ▼
┌───────────────────────────────────────────┐
│  Research Agent (LangGraph createReactAgent) │
│                                             │
│  LLM (Gemini) ⇄ Tavily search tool          │
│  loops until it decides it has enough info  │
│  (capped by recursionLimit: 15 as a safety   │
│  net against runaway loops)                 │
└───────────────────────────────────────────┘
        │  raw free-text findings
        ▼
┌───────────────────────────────────────────┐
│  Structuring pass (second Gemini call)      │
│  forced into a Zod schema:                  │
│  { decision, confidence, summary,           │
│    reasoning, keyFactors, sources }         │
└───────────────────────────────────────────┘
        │  structured JSON
        ▼
Express returns JSON → React renders decision
badge, confidence %, reasoning, key factors,
and clickable sources
```

**Why two LLM passes instead of one?** Forcing strict JSON output *while* the agent is still actively deciding whether to call more tools tends to be unreliable — the model has to juggle "should I search again?" and "match this exact schema" at once. Splitting it into (1) research freely, (2) then structure the findings afterward, made output far more consistent in testing.

---

## Key decisions & trade-offs

- **Agentic search over fixed pipeline:** The LLM decides what to search for and how many times, rather than a hardcoded sequence (e.g., always exactly 3 fixed queries). This means research depth adapts to the company — but it also means two runs on the same company aren't guaranteed to check identical things, and search/LLM cost varies per run.
- **Gemini over paid providers:** Chosen to avoid requiring a paid API key for evaluators to test this. Trade-off: free-tier rate limits meant switching model versions (`gemini-1.5-flash` → `gemini-2.5-flash-lite`) during development after hitting quota/model-availability errors on the original key.
- **Recursion limit (15):** Hard cap on agent↔tool loop iterations, to prevent a confused agent from looping indefinitely and running up latency/cost. Left generous enough that normal research (2-4 searches) never hits it.
- **Separate React + Express apps (not Next.js):** Built as plain React (Vite) + Express instead of a unified Next.js app, since that's the environment I was more comfortable executing quickly within the timeframe. Trade-off: two servers to run locally instead of one, and CORS has to be handled manually (done via the `cors` package).
- **Source citation approach:** Sources are returned as `{claim, url}` pairs generated by the structuring LLM from the raw findings, rather than tracked programmatically at the tool-call level. This is simpler to implement but relies on the LLM accurately attributing claims to the right URLs — a more robust version would tag each search result with an ID at retrieval time and have the LLM reference IDs directly.
- **What I left out:** no database/persistence (results aren't saved between runs), no comparison across previously researched companies, no streaming of intermediate agent steps to the UI (the user only sees a loading spinner, not "searching earnings... searching news...", which would be a nice improvement — see below).

---

## Example runs

> Replace this section with your own real output — run the app on 2-3 companies and paste the actual JSON/response you get back.

### Example 1: [Company name]
```json
{
  "decision": "",
  "confidence": 0,
  "summary": "",
  "reasoning": "",
  "keyFactors": [],
  "sources": []
}
```

### Example 2: [Company name]
```json
{
  "decision": "",
  "confidence": 0,
  "summary": "",
  "reasoning": "",
  "keyFactors": [],
  "sources": []
}
```

### Example 3: [Company name — try an obscure/small company to show edge-case handling]
```json
{
  "decision": "",
  "confidence": 0,
  "summary": "",
  "reasoning": "",
  "keyFactors": [],
  "sources": []
}
```

---

## What I would improve with more time

- **Stream intermediate agent steps to the UI** (e.g., "Searching recent earnings...", "Checking leadership news...") instead of a single loading spinner — makes the reasoning process visible and builds user trust, and is a natural fit for LangGraph's streaming support.
- **ID-tagged source citations** instead of LLM-generated `{claim, url}` pairs, for more reliable attribution.
- **Persistence layer (Postgres)** to store past research results, allow comparison against previously analyzed companies, and avoid re-researching the same company repeatedly within a short window.
- **Multi-agent breakdown** (separate Financial / News / Risk sub-agents feeding a final "Portfolio Manager" decision node) for more specialized, parallelizable research instead of one general-purpose agent doing everything.
- **Deployment** to Vercel/Render for a live demo link.
- **Better handling of ambiguous company names** (e.g., "Apple" the tech company vs. other companies of the same name) — currently relies entirely on the LLM's judgment with no disambiguation step.

---

## AI usage disclosure

This project was built with heavy AI assistance (as explicitly permitted and required by the assignment), over the period July 3–10, 2026. See:
- `AI_CHAT_LOGS.md` — dated, concise log of AI-assisted changes
- `CHAT_TRANSCRIPT.md` — fuller dated narrative of the build session, decisions, bugs hit, and fixes applied