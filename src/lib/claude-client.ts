import { ClaudeApiError, ClaudeParseError } from "@/lib/errors";
import type { AnalysisResult } from "@/lib/types";
import type { AnalysisPrompt } from "@/lib/prompt-builder";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

export async function analyzeWithClaude(
  prompt: AnalysisPrompt,
  apiKey: string,
): Promise<AnalysisResult> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new ClaudeApiError(
      body.error?.message || `Claude API error: ${response.status}`,
    );
  }

  const body = await response.json();
  const text = body.content[0].text;

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch {
    throw new ClaudeParseError(
      "Claude returned invalid JSON. Expected structured analysis.",
      text,
    );
  }
}

export async function analyzeWithClaudeStream(
  prompt: AnalysisPrompt,
  apiKey: string,
  onChunk: (text: string) => void,
): Promise<AnalysisResult> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new ClaudeApiError(
      body.error?.message || `Claude API error: ${response.status}`,
    );
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "content_block_delta" && data.delta?.text) {
          accumulated += data.delta.text;
          onChunk(data.delta.text);
        }
      } catch {
        // skip non-JSON data lines
      }
    }
  }

  try {
    return JSON.parse(accumulated) as AnalysisResult;
  } catch {
    throw new ClaudeParseError(
      "Claude returned invalid JSON from stream.",
      accumulated,
    );
  }
}
