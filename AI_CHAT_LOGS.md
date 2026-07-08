# AI Assistance Log

This file records where AI assistance was used during the project. The project direction, feature requirements, API key choices, and final acceptance decisions were user-led; AI was used mainly for debugging, implementation support, wording, and verification.

## 2026-07-08

- I defined the project goal as an investment research app with a simple input/result workflow.
- AI helped identify and fix backend environment loading so the server reads `server/.env` consistently.
- I chose to use Tavily as the only external research API after the previous model credits became unavailable.
- AI helped refactor the backend to remove the old model dependency and use a Tavily-only research flow.
- I guided the frontend toward a simpler form-and-result layout instead of a more complex generated UI.
- AI helped add the dark form/result styling in `client/src/App.css`.
- AI helped structure the API response into `decision`, `confidence`, `summary`, `reasoning`, `keyFactors`, and `sources` so the UI could render it cleanly.
- AI helped improve error messages and quota handling for a clearer user experience.
- I reviewed the working behavior and accepted the final direction after checking the app flow.
- AI helped run verification checks, including frontend build checks and backend module loading.
- AI helped prepare submission support files such as `.gitignore`, `server/.env.example`, and `README.md`.

## Notes

- This is a summary of assistance, not a raw transcript.
- The log is written to show the split between user decisions and AI-supported implementation work.
