import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeWithClaude } from "@/lib/claude-client";
import { ClaudeApiError, ClaudeParseError } from "@/lib/errors";
import type { AnalysisPrompt } from "@/lib/prompt-builder";

const MOCK_PROMPT: AnalysisPrompt = {
  system: "You are GitBrief...",
  user: "PR Title: Test PR\nDiff:\n+added line",
};

const MOCK_ANALYSIS = {
  summary: "This PR adds a new feature.",
  keyChanges: [
    { file: "src/auth.ts", description: "Added auth module", impact: "high" },
  ],
  risks: [
    {
      severity: "medium",
      title: "No tests",
      description: "No test coverage for new module",
    },
  ],
  suggestions: [
    {
      category: "testing",
      title: "Add unit tests",
      description: "Add tests for the auth module",
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("T-016: Claude client sends request and parses JSON response", () => {
  it("sends POST to api.anthropic.com with correct headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: JSON.stringify(MOCK_ANALYSIS) }],
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "sk-ant-test-key",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        }),
      })
    );
  });

  it("sends correct request body shape", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: JSON.stringify(MOCK_ANALYSIS) }],
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      model: expect.stringContaining("claude"),
      max_tokens: 4096,
      system: MOCK_PROMPT.system,
      messages: [{ role: "user", content: MOCK_PROMPT.user }],
    });
  });

  it("parses Claude response into AnalysisResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            content: [{ type: "text", text: JSON.stringify(MOCK_ANALYSIS) }],
          }),
      })
    );

    const result = await analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key");

    expect(result).toEqual(MOCK_ANALYSIS);
  });
});

describe("T-017: Claude client throws ClaudeParseError on invalid JSON", () => {
  it("throws ClaudeParseError when response is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            content: [{ type: "text", text: "This is not JSON at all" }],
          }),
      })
    );

    await expect(
      analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key")
    ).rejects.toThrow(ClaudeParseError);
  });

  it("includes raw response text in the error", async () => {
    const rawText = "Here is my analysis in plain text...";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            content: [{ type: "text", text: rawText }],
          }),
      })
    );

    try {
      await analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key");
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ClaudeParseError);
      expect((e as ClaudeParseError).rawResponse).toBe(rawText);
    }
  });
});

describe("T-018: Claude client throws ClaudeApiError on HTTP errors", () => {
  it("throws ClaudeApiError on 401 (invalid key)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { message: "Invalid API key" },
          }),
      })
    );

    await expect(
      analyzeWithClaude(MOCK_PROMPT, "bad-key")
    ).rejects.toThrow(ClaudeApiError);
    await expect(
      analyzeWithClaude(MOCK_PROMPT, "bad-key")
    ).rejects.toThrow(/Invalid API key/);
  });

  it("throws ClaudeApiError on 429 (rate limit)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: { message: "Rate limit exceeded" },
          }),
      })
    );

    await expect(
      analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key")
    ).rejects.toThrow(ClaudeApiError);
  });

  it("throws ClaudeApiError on 500 (server error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: { message: "Internal server error" },
          }),
      })
    );

    await expect(
      analyzeWithClaude(MOCK_PROMPT, "sk-ant-test-key")
    ).rejects.toThrow(ClaudeApiError);
  });
});
