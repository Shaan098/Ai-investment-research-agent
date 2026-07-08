# AI Chat Session Transcript — Investment Research Agent Build

This document is the chat log/transcript of the AI-assisted development session for this project, included per the assignment's bonus submission criteria.

**Assistant used:** Claude (Anthropic)
**Project:** AI Investment Research Agent (InsideIIM × Altuni AI Labs take-home assignment)

---

## Session summary (chronological)

### 1. Project ideation
Asked for project topic suggestions given the assignment brief and job description (React/Node, LangChain/LangGraph, AI investment research agent). Discussed four possible approaches: fundamentals-first agent, multi-agent analyst team, web-research tool-calling agent, and memory/comparison agent with a database. Chose the **web-research tool-calling agent** approach — an LLM agent with a search tool that decides what to look up itself, rather than a fixed pipeline.

### 2. Architecture explanation
Had the tool-calling / ReAct pattern explained in detail: how an LLM decides to call a tool, how the tool result is fed back into the conversation, and how this loops until the LLM has enough information. Covered how LangGraph.js provides prebuilt scaffolding (`createReactAgent`) for this loop instead of writing it by hand.

### 3. Roadmap
Requested and received a 7-day roadmap: Day 1 skeleton wiring, Day 2 single tool call, Day 3 full LangGraph loop, Day 4 structured output + citations, Day 5 frontend polish, Day 6 edge cases + deploy, Day 7 README + example runs.

### 4. Step-by-step build — backend setup
- Initially planned around Next.js, then switched to a plain **React (Vite) + separate Express backend** after preference was stated, since API keys can't safely live in frontend-only code.
- Set up `server/` (Express, dotenv, LangChain/LangGraph packages) and `client/` (Vite + React) as two independent projects.
- Hit an `ERESOLVE` dependency conflict during `npm install` (mismatched `@langchain/core` versions pulled in by `@langchain/community`). Resolved by cleaning `node_modules`/`package-lock.json` and reinstalling with pinned compatible versions.
- Hit PowerShell vs. CMD syntax issues (`rmdir /s /q` doesn't work in PowerShell) — corrected to `Remove-Item -Recurse -Force`.

### 5. Basic LLM call test
Built a minimal `agent.js` with a plain `ChatOpenAI` call (no tools yet) and wired it to an Express `/api/research` POST endpoint, to confirm the full chain (React → Express → LangChain → LLM) worked before adding complexity. Hit a `429 insufficient_quota` error from OpenAI — confirmed this was a billing/quota issue, not a code bug, since the request reached OpenAI successfully.

### 6. Switching LLM providers
To avoid needing a paid OpenAI account:
- First attempted switching to **Anthropic Claude** (`ChatAnthropic` + `claude-3-5-haiku-latest`). Caught and fixed a bug where a search **retriever** (`TavilySearchAPIRetriever`) was mistakenly used instead of a proper LangChain **tool** (`TavilySearchResults`) — retrievers don't expose the tool interface `createReactAgent` needs.
- Asked about fully free alternatives. Compared **Google Gemini**, **Groq**, and **OpenRouter** free tiers. Chose **Gemini** for its generous free tier and first-class LangChain.js tool-calling support.

### 7. Building the real tool-calling agent
Rebuilt `agent.js` around `ChatGoogleGenerativeAI` + `TavilySearch` (from the newer `@langchain/tavily` package) + `createReactAgent`, with a system prompt instructing the agent to research financials, leadership news, legal/regulatory issues, and competitive position, using 2-3+ searches before answering.

### 8. Bug: environment variable mismatch
Provided project zip for review. Found `agent.js` was reading `process.env.GEMINI_API_KEY` while `.env` actually defined `GOOGLE_API_KEY` — a silent mismatch that meant the API key was `undefined`. Fixed by aligning the variable name, and additionally hardened `.env` loading using `dotenv.config({ path: path.join(__dirname, ".env") })` so it loads reliably regardless of the working directory the process is started from.

### 9. Frontend build
Replaced the placeholder React component (which only pinged `/api/health`) with a real UI: company name input, submit button, loading state, error state, and a result display. Initially rendered raw text output; styled with a dark-themed `App.css`.

### 10. Quota troubleshooting on Gemini
Hit `429` quota errors on `gemini-2.0-flash`, then `gemini-1.5-flash` and `gemini-1.5-flash-8b` (unsupported for the given key/API version). Resolved by listing available models for the key and switching to `gemini-2.5-flash-lite`, which worked end-to-end.

### 11. Structured output layer
Rebuilt `researchCompany` as a two-pass process:
1. **Research pass** — the ReAct agent searches freely and returns raw findings, capped with `recursionLimit: 15` as a safety net against runaway agent loops.
2. **Structuring pass** — a second Gemini call, bound to a Zod schema (`decision`, `confidence`, `summary`, `reasoning`, `keyFactors`, `sources`) via `withStructuredOutput`, converts the raw findings into strict JSON.

Rationale discussed: forcing strict JSON *while* the agent is still deciding whether to keep searching is less reliable than separating "research freely" from "structure the findings" into two distinct steps.

Also added: edge-case instructions in both prompts (what to do if a company can't be found or search results are empty/irrelevant), and backend-side detection of quota-related errors to return a clearer 429 message to the frontend instead of a generic 500.

### 12. Frontend structured rendering
Updated the React result display to render the structured object properly: a colored INVEST/PASS badge, confidence percentage, summary, reasoning, a bullet list of key factors, and clickable source links — replacing the earlier raw-text dump.

### 13. Project review & cleanup guidance
Reviewed the submitted zip for completeness. Flagged: `node_modules` and `client/dist` should never be included in a submission zip (regenerable build artifacts); `.env` should be excluded from submission with a `.env.example` provided instead (variable names only, no real keys); a `.gitignore` was recommended; minor redundant `dotenv.config()` calls were flagged for cleanup.

### 14. README
Generated the full `README.md` covering Overview, How to run, How it works (with architecture diagram), Key decisions & trade-offs, Example runs (left as a template for the developer to fill in with real output), and What would be improved with more time.

### 15. This chat log
Generated as the formal chat transcript for the assignment's bonus submission criteria.

---

## Key technical decisions surfaced during this session

| Decision | Reasoning |
|---|---|
| Tool-calling ReAct agent over fixed pipeline | LLM decides what/how much to research per company, rather than a rigid fixed sequence |
| Two-pass structured output (research → structure) | More reliable than forcing strict JSON schema compliance mid-tool-use |
| `recursionLimit: 15` | Safety net against runaway agent↔tool loops |
| Gemini (`gemini-2.5-flash-lite`) over OpenAI/Claude | Avoids requiring a paid key for evaluators; found after working through quota/model-availability issues on other providers |
| Separate React (Vite) + Express apps, not Next.js | Matched developer's stated comfort level with React |
| `TavilySearch` tool (not a retriever) | Retrievers lack the tool-calling interface `createReactAgent` requires |

---

*This log was compiled from the actual assistant-guided development conversation for this project and reflects the real sequence of decisions, bugs, and fixes encountered while building it.*
