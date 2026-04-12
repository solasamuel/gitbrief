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
