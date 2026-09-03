/**
 * Centralized AI Provider Client
 * Supports Google Gemini, OpenAI, and a built-in semantic evaluator fallback.
 * Strictly server-side only. Never expose credentials to the client.
 */

export interface AiRequestOptions {
  systemInstruction?: string;
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
  timeoutMs?: number;
}

export interface AiResponse {
  rawText: string;
  parsedJson?: any;
  model: string;
}

// Configurable settings via environment variables
export const AI_CONFIG = {
  enabled: process.env.AI_GRADING_ENABLED !== "false",
  apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "",
  provider: (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "gemini")) as "gemini" | "openai" | "custom",
  model: process.env.AI_GRADING_MODEL || (process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "gemini-2.5-flash"),
  confidenceThresholdAuto: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD_AUTO || "0.85"),
  confidenceThresholdReview: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD_REVIEW || "0.60"),
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "20000", 10),
};

/**
 * Call the configured AI provider with timeout protection and structured JSON parsing.
 */
export async function callAiService(options: AiRequestOptions): Promise<AiResponse> {
  const { apiKey, provider, model, timeoutMs } = AI_CONFIG;
  const effectiveTimeout = options.timeoutMs || timeoutMs;

  if (!apiKey) {
    console.warn("⚠️ AI_API_KEY is not set in environment. Falling back to local semantic evaluator.");
    return {
      rawText: "",
      model: "local-semantic-fallback",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    if (provider === "openai") {
      return await callOpenAi(apiKey, model, options, controller.signal);
    } else {
      return await callGemini(apiKey, model, options, controller.signal);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Google Gemini API integration
 */
async function callGemini(
  apiKey: string,
  model: string,
  options: AiRequestOptions,
  signal: AbortSignal
): Promise<AiResponse> {
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
    },
  };

  if (options.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.jsonMode) {
    requestBody.generationConfig.responseMimeType = "application/json";
  }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let parsedJson;
  if (options.jsonMode && candidateText) {
    try {
      parsedJson = JSON.parse(cleanJsonString(candidateText));
    } catch {
      console.error("Failed to parse Gemini JSON output:", candidateText);
    }
  }

  return {
    rawText: candidateText,
    parsedJson,
    model: `gemini/${model}`,
  };
}

/**
 * OpenAI API integration
 */
async function callOpenAi(
  apiKey: string,
  model: string,
  options: AiRequestOptions,
  signal: AbortSignal
): Promise<AiResponse> {
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: options.prompt });

  const requestBody: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
  };

  if (options.jsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";

  let parsedJson;
  if (options.jsonMode && content) {
    try {
      parsedJson = JSON.parse(cleanJsonString(content));
    } catch {
      console.error("Failed to parse OpenAI JSON output:", content);
    }
  }

  return {
    rawText: content,
    parsedJson,
    model: `openai/${model}`,
  };
}

/**
 * Sanitizes markdown code blocks (e.g. ```json ... ```) from JSON string before parsing
 */
function cleanJsonString(str: string): string {
  const trimmed = str.trim();
  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  }
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}
