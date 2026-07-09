import { useState } from 'react'
import './App.css'

function App() {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
 const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://ai-investment-research-agent-cyvk.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault()
    if (!companyName.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

  try {
  const res = await fetch(`${apiBaseUrl}/api/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyName: companyName.trim(),
    }),
  });

  const contentType = res.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON:\n${text}`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  if (!data.result) {
    throw new Error("Server returned an invalid response.");
  }

  setResult(data.result);
} catch (err) {
  setError(err.message || "Failed to reach the server");
} finally {
  setLoading(false);
}

  return (
    <div className="app">
      <h1>AI Investment Research Agent</h1>
      <p className="subtitle">
        Enter a company name — the agent will research it and give you an Invest/Pass call.
      </p>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Tesla, Zomato, Infosys"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !companyName.trim()}>
          {loading ? 'Researching…' : 'Research'}
        </button>
      </form>

      {loading && (
        <div className="status-box loading-box">
          Agent is searching the web and analyzing findings. This can take 15–30 seconds…
        </div>
      )}

      {error && <div className="status-box error-box">{error}</div>}

      {result && (
        <div className="result-box">
          <div className="decision-header">
            <span className={`decision-badge ${result.decision === 'INVEST' ? 'invest' : 'pass'}`}>
              {result.decision}
            </span>
            <span className="confidence">Confidence: {Math.round(result.confidence * 100)}%</span>
          </div>

          <h3>Summary</h3>
          <p>{result.summary}</p>

          <h3>Reasoning</h3>
          <p>{result.reasoning}</p>

          <h3>Key Factors</h3>
          <ul>
            {(result.keyFactors || []).map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>

          <h3>Sources</h3>
          <ul className="sources-list">
            {(result.sources || []).map((src, i) => (
              <li key={i}>
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.claim}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
