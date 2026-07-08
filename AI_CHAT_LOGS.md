# AI Chat Logs

This file records the important AI-assisted work done in this workspace so the submission includes the conversation trail requested by the review notes.

## 2026-07-08

- Fixed the environment variable mismatch in `server/agent.js` by changing the Gemini API key lookup to `GOOGLE_API_KEY`.
- Made server env loading more robust by explicitly loading `server/.env` from the module directory.
- Rebuilt the frontend as a research app UI, then replaced it with the simpler input/result layout requested in the review notes.
- Added `client/src/App.css` for the requested dark form-and-result styling.
- Switched the Gemini model repeatedly after live testing until finding a supported model for the current key.
- Verified the frontend build succeeds with `npm run build`.
- Verified the backend can return a full real research response for Tesla after switching to a supported Gemini model.
- Observed that `gemini-1.5-flash` and `gemini-1.5-flash-8b` were not supported for this API key and API version, then listed models and switched to `gemini-2.5-flash-lite`.
- Confirmed the UI renders the form correctly in the browser and the backend research endpoint returns a completed response.
- Added structured JSON output, decision cards, and clearer quota error mapping.
- Added submission hygiene files: `.gitignore`, `server/.env.example`, and `README.md`.
- Verified the browser now shows a clear Gemini quota message instead of a fetch failure when the model is rate-limited.
- Re-checked the live backend on 2026-07-08 for Tesla and Microsoft; both attempts were blocked by the Gemini free-tier quota, so no new full-company example outputs could be captured in this session.

## Notes

- If more AI-assisted work happens later, append another dated section here.
- This file is intentionally concise and human-readable rather than a raw transcript.
