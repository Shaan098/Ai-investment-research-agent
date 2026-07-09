# Investment Research Agent

A full-stack investment research app that takes a company name, searches the web with Tavily, and returns a simple `INVEST` or `PASS` call with confidence, reasoning, key factors, and source links.

## Features

- Search any public company from a clean React form.
- Backend runs multiple targeted Tavily finance searches.
- Results are deduplicated and ranked by Tavily score.
- Output includes:
  - investment decision
  - confidence score
  - summary
  - reasoning
  - key factors
  - clickable sources
- Friendly API errors for missing input and Tavily quota/rate limits.
- `.env` is ignored so API keys are not committed.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Research API: Tavily through `@langchain/tavily`
- Config: `dotenv`

## Project Structure

```text
investment-research-agent/
  client/                 React frontend
    src/App.jsx           Main UI and API call
    src/App.css           App styling
    vite.config.js        Dev server and /api proxy

  server/                 Express backend
    index.js              API routes
    agent.js              Tavily research and scoring logic
    .env.example          Required environment variables

  AI_CHAT_LOGS.md         Summary of AI-assisted work
  README.md               Project documentation
```

## Requirements

- Node.js 18 or newer
- A valid Tavily API key

## Environment Setup

Create `server/.env`:

```bash
TAVILY_API_KEY=your_tavily_api_key
PORT=5000
```

`server/.env.example` contains the same variable names without secrets.

## Install Dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Run Locally

Start the backend:

```bash
cd server
node index.js
```

The backend runs on:

```text
http://localhost:5000
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to the Express backend.

## API Endpoints

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "Server is running!"
}
```

### Research Company

```http
POST /api/research
Content-Type: application/json
```

Request body:

```json
{
  "companyName": "Tesla"
}
```

Example response shape:

```json
{
  "result": {
    "decision": "PASS",
    "confidence": 0.64,
    "summary": "Tavily search results do not show a strong enough positive signal to justify an INVEST call.",
    "reasoning": "This Tavily-only analysis reviewed 12 search results and found 4 positive signal(s) versus 5 risk signal(s). Because no LLM is being used, the decision is based on transparent keyword and source-count heuristics rather than generated analysis.",
    "keyFactors": [
      "Source title: Short supporting finding from the search result."
    ],
    "sources": [
      {
        "claim": "Source title",
        "url": "https://example.com/article"
      }
    ]
  }
}
```

## How The Research Works

The backend runs four Tavily searches for each company:

- recent financial performance, earnings, revenue, and profit
- leadership changes and major announcements
- legal, regulatory, controversy, and risk issues
- competitors, industry trends, and market position

The results are normalized, deduplicated by URL, sorted by Tavily score, and then analyzed with a simple heuristic:

- positive terms include words like `growth`, `profit`, `strong`, `upgrade`, and `market share`
- negative terms include words like `loss`, `decline`, `lawsuit`, `regulatory`, `debt`, and `controversy`
- the app returns `INVEST` only when positive signals clearly outweigh risk signals
- otherwise, it returns `PASS`

This keeps the app independent from separate LLM credits while still producing a structured research summary.

## Limitations

- This is not financial advice.
- The decision is heuristic-based, not a professional valuation model.
- Search quality depends on Tavily results and available public sources.
- The app does not currently cache results, so repeated searches can use more Tavily quota.
- Very recent or obscure companies may return incomplete results.

## Error Handling

If `companyName` is missing, the API returns:

```json
{
  "error": "companyName is required"
}
```

If Tavily quota or rate limits are reached, the API returns:

```json
{
  "error": "Tavily quota or rate limit reached. Please wait a moment and try again.",
  "details": "Error details from the Tavily request"
}
```

## Future Improvements

- Add result caching to reduce Tavily usage.
- Store previous research reports.
- Add filters for region, sector, or time range.
- Improve scoring with more finance-specific signals.
- Add charts or financial metrics when reliable data is available.
