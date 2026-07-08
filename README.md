# Investment Research Agent

A small full-stack app that researches a public company and returns an investment call with supporting evidence.

## Overview

The app has two parts:

- `server/` runs an Express API that uses a ReAct agent with Gemini and Tavily search.
- `client/` is a React frontend that lets you submit a company name and displays the result.

The backend researches the company first, then converts the findings into a structured decision object for the UI.

## How to Run

### Requirements

- Node.js 18+ recommended
- A valid `GOOGLE_API_KEY`
- A valid `TAVILY_API_KEY`

### Environment Variables

Create `server/.env` with:

```bash
GOOGLE_API_KEY=your_google_api_key
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

The backend uses a two-pass flow:

1. A Gemini-powered ReAct agent searches the web with Tavily and gathers raw findings.
2. A second Gemini pass converts those findings into structured JSON with:
   - `decision`
   - `confidence`
   - `summary`
   - `reasoning`
   - `keyFactors`
   - `sources`

The frontend renders that structured object as cards, badges, bullet lists, and clickable source links.

## Key Decisions & Trade-offs

- Two-pass output was used so the agent can research freely first, then render clean structured data for the UI.
- `recursionLimit: 15` is set as a safety net so the ReAct loop cannot wander forever.
- The backend now maps Gemini quota failures to a friendly `429` response instead of a vague fetch error.
- The model moved through several options during testing. The working model for this key is `gemini-2.5-flash-lite`.
- `.gitignore` excludes `node_modules/`, `dist/`, and `.env` so the submission stays small and does not leak secrets.

## Example Runs

The live backend was re-checked on 2026-07-08, but Gemini free-tier quota was exhausted during verification, so this section currently includes the captured Tesla example plus the quota error path.

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

### Tesla - quota-limited response

When the Gemini quota is exhausted, the API returns a friendly 429:

```json
{
  "error": "Gemini quota limit reached. Please wait a moment and try again.",
  "details": "[GoogleGenerativeAI Error]: ..."
}
```

## What I Would Improve Next

- Add caching so repeated company searches do not hit Gemini every time.
- Store structured results for later viewing.
- Add a retry strategy when the quota window resets.
- Add deployment configuration for a hosted demo.
- Add more sample runs once the Gemini quota is available again.
