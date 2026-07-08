# Investment Research Agent

A small full-stack app that researches a public company and returns an investment call with supporting evidence.

## Overview

The app has two parts:

- `server/` runs an Express API that uses Tavily search for research and a deterministic scoring pass for the investment call.
- `client/` is a React frontend that lets you submit a company name and displays the result.

The backend researches the company first, then converts the findings into a structured decision object for the UI.

## How to Run

### Requirements

- Node.js 18+ recommended
- A valid `TAVILY_API_KEY`

### Environment Variables

Create `server/.env` with:

```bash
TAVILY_API_KEY=your_tavily_api_key
PORT=5000
```

For reference, `server/.env.example` is included with the variable names only.

### Install

Install dependencies in both folders:

```bash
cd server
npm install

cd ../client
npm install
```

### Start the App

Run the backend:

```bash
cd server
node index.js
```

Run the frontend in another terminal:

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How It Works

The backend uses a Tavily-only flow:

1. Several targeted Tavily searches gather recent company findings.
2. A deterministic scoring pass converts those findings into structured JSON with:
   - `decision`
   - `confidence`
   - `summary`
   - `reasoning`
   - `keyFactors`
   - `sources`

The frontend renders that structured object as cards, badges, bullet lists, and clickable source links.

## Key Decisions & Trade-offs

- The backend no longer depends on a separate LLM provider or model credits.
- Tavily is used for all external research requests.
- The backend maps Tavily quota failures to a friendly `429` response instead of a vague fetch error.
- The investment call is heuristic-based because Tavily is a search API, not a chat model.
- `.gitignore` excludes `node_modules/`, `dist/`, and `.env` so the submission stays small and does not leak secrets.

## Example Runs

The live backend was updated on 2026-07-08 to use Tavily only. Results now depend only on Tavily search availability.

### Tesla - captured structured result

Verified API output from `POST /api/research`:

```json
{
  "result": {
    "decision": "PASS",
    "confidence": 0,
    "summary": "Unable to retrieve any information about Tesla.",
    "reasoning": "The provided findings explicitly state that no information could be retrieved for Tesla. Therefore, no investment decision can be made.",
    "keyFactors": ["Lack of data"],
    "sources": []
  }
}
```

### Tavily quota-limited response

When the Tavily quota is exhausted, the API returns a friendly 429:

```json
{
  "error": "Tavily quota or rate limit reached. Please wait a moment and try again.",
  "details": "Error 429: ..."
}
```

## What I Would Improve Next

- Add caching so repeated company searches do not hit Tavily every time.
- Store structured results for later viewing.
- Add a retry strategy when the quota window resets.
- Add deployment configuration for a hosted demo.
- Add an optional LLM provider later if richer generated analysis is needed.
