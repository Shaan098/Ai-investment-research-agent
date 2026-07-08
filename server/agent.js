const { TavilySearch } = require("@langchain/tavily");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const searchTool = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
  searchDepth: "advanced",
  includeAnswer: true,
  topic: "finance",
});

const SEARCH_QUERIES = [
  "{company} recent financial performance earnings revenue profit",
  "{company} latest leadership changes major announcements",
  "{company} legal regulatory controversy risk",
  "{company} competitors industry trends market position",
];

const POSITIVE_TERMS = [
  "growth",
  "profit",
  "profitable",
  "beat",
  "strong",
  "record",
  "upgrade",
  "raises guidance",
  "expansion",
  "market share",
];

const NEGATIVE_TERMS = [
  "loss",
  "decline",
  "miss",
  "lawsuit",
  "probe",
  "investigation",
  "regulatory",
  "fine",
  "layoffs",
  "debt",
  "downgrade",
  "risk",
  "controversy",
];

function normalizeResult(result) {
  return {
    title: result.title || "Untitled source",
    url: result.url || "",
    content: result.content || result.snippet || "",
    score: result.score || 0,
  };
}

function dedupeResults(results) {
  const seen = new Set();

  return results.filter((result) => {
    if (!result.url || seen.has(result.url)) {
      return false;
    }

    seen.add(result.url);
    return true;
  });
}

function countTerms(text, terms) {
  const lowerText = text.toLowerCase();

  return terms.reduce((count, term) => {
    return lowerText.includes(term) ? count + 1 : count;
  }, 0);
}

function sentenceFromResult(result) {
  const text = result.content.replace(/\s+/g, " ").trim();

  if (!text) {
    return result.title;
  }

  const firstSentence = text.match(/^(.{40,220}?[.!?])\s/)?.[1];
  return firstSentence || text.slice(0, 220);
}

function buildKeyFactors(results) {
  return results.slice(0, 5).map((result) => {
    return `${result.title}: ${sentenceFromResult(result)}`;
  });
}

function buildDecision(results) {
  if (results.length < 3) {
    return {
      decision: "PASS",
      confidence: 0.35,
      summary: "Not enough reliable Tavily search results were found to support an investment call.",
      reasoning:
        "The Tavily-only flow needs multiple current sources before it can make a basic evidence-backed call. With too little evidence, the safer decision is PASS.",
    };
  }

  const combinedText = results.map((result) => `${result.title} ${result.content}`).join(" ");
  const positiveSignals = countTerms(combinedText, POSITIVE_TERMS);
  const negativeSignals = countTerms(combinedText, NEGATIVE_TERMS);
  const decision = positiveSignals > negativeSignals + 1 ? "INVEST" : "PASS";
  const signalGap = Math.abs(positiveSignals - negativeSignals);
  const confidence = Math.min(0.85, 0.45 + results.length * 0.03 + signalGap * 0.04);

  return {
    decision,
    confidence: Number(confidence.toFixed(2)),
    summary:
      decision === "INVEST"
        ? "Tavily search results show more positive business and financial signals than negative risk signals."
        : "Tavily search results do not show a strong enough positive signal to justify an INVEST call.",
    reasoning:
      `This Tavily-only analysis reviewed ${results.length} search results and found ` +
      `${positiveSignals} positive signal(s) versus ${negativeSignals} risk signal(s). ` +
      "Because no LLM is being used, the decision is based on transparent keyword and source-count heuristics rather than generated analysis.",
  };
}

async function runSearch(query) {
  const response = await searchTool.invoke({ query });

  if (response?.error) {
    return [];
  }

  return (response?.results || []).map(normalizeResult);
}

async function researchCompany(companyName) {
  const searches = await Promise.all(
    SEARCH_QUERIES.map((queryTemplate) => {
      return runSearch(queryTemplate.replace("{company}", companyName));
    })
  );
  const results = dedupeResults(searches.flat()).sort((a, b) => b.score - a.score);
  const decision = buildDecision(results);

  return {
    ...decision,
    keyFactors: buildKeyFactors(results),
    sources: results.slice(0, 8).map((result) => ({
      claim: result.title,
      url: result.url,
    })),
  };
}

module.exports = { researchCompany };
