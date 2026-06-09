export type DeepSeekMemeRequest = {
  teamName: string;
  teamSlug: string;
  priority: "hot" | "standard";
  matchContext: string;
  existingCauses: string[];
  existingEpitaphs: string[];
  causeCount: number;
  epitaphCount: number;
};

export type DeepSeekMemeResponse = {
  causes: string[];
  epitaphs: string[];
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionPayload = {
  model: string;
  temperature: number;
  response_format: { type: "json_object" };
  messages: ChatMessage[];
};

const defaultBaseUrl = "https://api.deepseek.com";
const defaultModel = "deepseek-chat";

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("DeepSeek did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function assertMemeResponse(value: unknown): DeepSeekMemeResponse {
  if (!value || typeof value !== "object") {
    throw new Error("DeepSeek response is not an object.");
  }

  const candidate = value as Partial<DeepSeekMemeResponse>;
  if (!Array.isArray(candidate.causes) || !Array.isArray(candidate.epitaphs)) {
    throw new Error("DeepSeek response is missing causes or epitaphs.");
  }

  if (
    !candidate.causes.every((item) => typeof item === "string") ||
    !candidate.epitaphs.every((item) => typeof item === "string")
  ) {
    throw new Error("DeepSeek response contains non-string content.");
  }

  return {
    causes: candidate.causes,
    epitaphs: candidate.epitaphs,
  };
}

export function buildDeepSeekMemePayload(request: DeepSeekMemeRequest): ChatCompletionPayload {
  const model = process.env.MEME_REFRESH_MODEL || defaultModel;
  return {
    model,
    temperature: request.priority === "hot" ? 0.92 : 0.76,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write original English football satire for a World Cup funeral website. Return strict JSON only. Avoid slurs, hate, real-person insults, politics, links, hashtags, and copied memes.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate fresh football meme copy.",
          outputShape: {
            causes: `array of ${request.causeCount} strings, each <= 80 chars`,
            epitaphs: `array of ${request.epitaphCount} strings, each <= 120 chars`,
          },
          tone:
            "dark comedy, fan pain, tactical jokes, scoreboard cruelty, football concepts only",
          team: {
            name: request.teamName,
            slug: request.teamSlug,
            priority: request.priority,
          },
          matchContext: request.matchContext,
          avoidNearDuplicatesOf: {
            causes: request.existingCauses.slice(0, 30),
            epitaphs: request.existingEpitaphs.slice(0, 30),
          },
        }),
      },
    ],
  };
}

export async function generateDeepSeekMemeContent(
  request: DeepSeekMemeRequest,
): Promise<DeepSeekMemeResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured.");

  const baseUrl = process.env.DEEPSEEK_BASE_URL || defaultBaseUrl;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildDeepSeekMemePayload(request)),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek returned ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  return assertMemeResponse(parseJsonObject(content));
}

export const deepSeekInternals = {
  assertMemeResponse,
  parseJsonObject,
};
