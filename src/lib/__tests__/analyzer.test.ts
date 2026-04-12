import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzePr } from "@/lib/analyzer";
import { GitHubApiError, ClaudeApiError } from "@/lib/errors";

// Mock all dependencies
vi.mock("@/lib/storage", () => ({
  getApiKeys: vi.fn(),
}));
vi.mock("@/lib/github-client", () => ({
  fetchPrMetadata: vi.fn(),
  fetchPrDiff: vi.fn(),
}));
vi.mock("@/lib/claude-client", () => ({
  analyzeWithClaude: vi.fn(),
}));

import { getApiKeys } from "@/lib/storage";
import { fetchPrMetadata, fetchPrDiff } from "@/lib/github-client";
import { analyzeWithClaude } from "@/lib/claude-client";

const mockGetApiKeys = vi.mocked(getApiKeys);
const mockFetchMetadata = vi.mocked(fetchPrMetadata);
const mockFetchDiff = vi.mocked(fetchPrDiff);
const mockAnalyze = vi.mocked(analyzeWithClaude);

const MOCK_METADATA = {
  title: "Add auth",
  author: "dev",
  body: "Adds authentication",
  state: "open",
  baseBranch: "main",
  headBranch: "feature/auth",
  htmlUrl: "https://github.com/owner/repo/pull/1",
  createdAt: "2026-04-01T10:00:00Z",
};

const MOCK_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,2 +1,3 @@
 const app = express();
+app.use(auth());
 export default app;
`;

const MOCK_ANALYSIS = {
  summary: "Adds authentication middleware.",
  keyChanges: [{ file: "src/auth.ts", description: "Added auth", impact: "high" as const }],
  risks: [],
  suggestions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("T-024: analyzePr orchestrates full pipeline and returns AnalysisResponse", () => {
  it("runs the full pipeline and returns a complete response", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test", githubToken: "ghp_test" });
    mockFetchMetadata.mockResolvedValue(MOCK_METADATA);
    mockFetchDiff.mockResolvedValue(MOCK_DIFF);
    mockAnalyze.mockResolvedValue(MOCK_ANALYSIS);

    const onProgress = vi.fn();
    const result = await analyzePr("https://github.com/owner/repo/pull/1", onProgress);

    expect(result.metadata).toEqual(MOCK_METADATA);
    expect(result.analysis).toEqual(MOCK_ANALYSIS);
    expect(result.stats.filesChanged).toBe(1);
    expect(result.stats.insertions).toBe(1);
    expect(result.meta.model).toContain("claude");
  });

  it("calls onProgress for each pipeline stage", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test" });
    mockFetchMetadata.mockResolvedValue(MOCK_METADATA);
    mockFetchDiff.mockResolvedValue(MOCK_DIFF);
    mockAnalyze.mockResolvedValue(MOCK_ANALYSIS);

    const onProgress = vi.fn();
    await analyzePr("https://github.com/owner/repo/pull/1", onProgress);

    expect(onProgress).toHaveBeenCalledWith("parsing_url");
    expect(onProgress).toHaveBeenCalledWith("fetching_metadata");
    expect(onProgress).toHaveBeenCalledWith("fetching_diff");
    expect(onProgress).toHaveBeenCalledWith("processing_diff");
    expect(onProgress).toHaveBeenCalledWith("analyzing");
  });

  it("passes GitHub token to fetch functions when available", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test", githubToken: "ghp_token" });
    mockFetchMetadata.mockResolvedValue(MOCK_METADATA);
    mockFetchDiff.mockResolvedValue(MOCK_DIFF);
    mockAnalyze.mockResolvedValue(MOCK_ANALYSIS);

    await analyzePr("https://github.com/owner/repo/pull/1");

    expect(mockFetchMetadata).toHaveBeenCalledWith("owner", "repo", 1, "ghp_token");
    expect(mockFetchDiff).toHaveBeenCalledWith("owner", "repo", 1, "ghp_token");
  });

  it("works without a GitHub token", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test" });
    mockFetchMetadata.mockResolvedValue(MOCK_METADATA);
    mockFetchDiff.mockResolvedValue(MOCK_DIFF);
    mockAnalyze.mockResolvedValue(MOCK_ANALYSIS);

    await analyzePr("https://github.com/owner/repo/pull/1");

    expect(mockFetchMetadata).toHaveBeenCalledWith("owner", "repo", 1, undefined);
  });
});

describe("T-025: analyzePr throws appropriate errors for each failure mode", () => {
  it("throws ClaudeApiError when no API key is configured", async () => {
    mockGetApiKeys.mockResolvedValue({});

    await expect(
      analyzePr("https://github.com/owner/repo/pull/1")
    ).rejects.toThrow(ClaudeApiError);
    await expect(
      analyzePr("https://github.com/owner/repo/pull/1")
    ).rejects.toThrow(/API key/i);
  });

  it("throws ParseUrlError for invalid URLs", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test" });

    await expect(
      analyzePr("https://github.com/owner/repo")
    ).rejects.toThrow();
  });

  it("propagates GitHubApiError from metadata fetch", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test" });
    mockFetchMetadata.mockRejectedValue(new GitHubApiError("Not Found", 404));

    await expect(
      analyzePr("https://github.com/owner/repo/pull/999")
    ).rejects.toThrow(GitHubApiError);
  });

  it("propagates ClaudeApiError from analysis", async () => {
    mockGetApiKeys.mockResolvedValue({ anthropicKey: "sk-ant-test" });
    mockFetchMetadata.mockResolvedValue(MOCK_METADATA);
    mockFetchDiff.mockResolvedValue(MOCK_DIFF);
    mockAnalyze.mockRejectedValue(new ClaudeApiError("Rate limit exceeded"));

    await expect(
      analyzePr("https://github.com/owner/repo/pull/1")
    ).rejects.toThrow(ClaudeApiError);
  });
});
