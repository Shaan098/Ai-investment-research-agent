const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { TavilySearch } = require("@langchain/tavily");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { z } = require("zod");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// 1. The LLM — Google Gemini
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash-lite",
  temperature: 0,
});

const structuringLlm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash-lite",
  temperature: 0,
});

// 2. Search tool
const searchTool = new TavilySearch({
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
});

// 3. ReAct agent
const agentExecutor = createReactAgent({
  llm,
  tools: [searchTool],
});

// 4. System prompt
const SYSTEM_PROMPT = `You are an investment research analyst.
Given a company name, research it using the search tool by looking into:
- Recent financial performance and earnings
- Leadership changes or major announcements
- Legal, regulatory, or controversy issues
- Competitive position and industry trends

Use the search tool as many times as needed (at least 2-3 searches) to gather enough information.
If the company cannot be found or search results are empty/irrelevant, clearly say so instead of guessing.
Once you have enough information, respond with your findings in plain text, including source URLs.`;

const DecisionSchema = z.object({
  decision: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasoning: z.string(),
  keyFactors: z.array(z.string()),
  sources: z.array(
    z.object({
      claim: z.string(),
      url: z.string(),
    })
  ),
});

const structuredLlm = structuringLlm.withStructuredOutput(DecisionSchema);

function getMessageContent(message) {
  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part) {
          return part.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return String(message.content);
}

async function researchCompany(companyName) {
  const result = await agentExecutor.invoke(
    {
    messages: [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(`Research this company: ${companyName}`),
    ],
  },
    { recursionLimit: 15 }
  );

  const finalMessage = result.messages[result.messages.length - 1];
  const rawFindings = getMessageContent(finalMessage);

  return structuredLlm.invoke([
    new SystemMessage(
      "You convert raw investment research findings into a structured JSON object. Do not invent facts that are not supported by the findings. If the findings do not support a strong thesis, choose PASS and explain why."
    ),
    new HumanMessage(`Company: ${companyName}\n\nRaw findings:\n${rawFindings}`),
  ]);
}

module.exports = { researchCompany };
