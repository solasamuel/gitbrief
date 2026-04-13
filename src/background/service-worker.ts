import { getApiKeys } from "@/lib/storage";
import { parsePrUrl } from "@/lib/parse-pr-url";
import { fetchPrMetadata, fetchPrDiff } from "@/lib/github-client";
import { filterDiff, truncateDiff, extractDiffStats } from "@/lib/diff-utils";
import { buildAnalysisPrompt } from "@/lib/prompt-builder";
import { analyzeWithClaudeStream } from "@/lib/claude-client";
import { GitHubApiError, ClaudeApiError, ClaudeParseError, ParseUrlError } from "@/lib/errors";
import type { BackgroundMessage, ContentMessage } from "./message-types";

const MODEL = "claude-sonnet-4-20250514";

function errorToMessage(err: unknown): ContentMessage & { type: "ERROR" } {
  if (err instanceof ParseUrlError) {
    return { type: "ERROR", error: err.message, code: "INVALID_URL" };
  }
  if (err instanceof GitHubApiError) {
    return { type: "ERROR", error: err.message, code: "GITHUB_ERROR" };
  }
  if (err instanceof ClaudeApiError || err instanceof ClaudeParseError) {
    return { type: "ERROR", error: err.message, code: "CLAUDE_ERROR" };
  }
  return {
    type: "ERROR",
    error: err instanceof Error ? err.message : "Unknown error",
  };
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "analyze") return;

  port.onMessage.addListener(async (msg: BackgroundMessage) => {
    if (msg.type !== "START_ANALYSIS") return;

    try {
      const keys = await getApiKeys();
      if (!keys.anthropicKey) {
        port.postMessage({
          type: "ERROR",
          error: "No API key configured. Click the GitBrief icon to open settings.",
          code: "CLAUDE_ERROR",
        } as ContentMessage);
        return;
      }

      port.postMessage({ type: "PROGRESS", stage: "parsing_url" } as ContentMessage);
      const ref = parsePrUrl(msg.prUrl);

      port.postMessage({ type: "PROGRESS", stage: "fetching_metadata" } as ContentMessage);
      const metadata = await fetchPrMetadata(ref.owner, ref.repo, ref.pullNumber, keys.githubToken);

      port.postMessage({ type: "PROGRESS", stage: "fetching_diff" } as ContentMessage);
      const rawDiff = await fetchPrDiff(ref.owner, ref.repo, ref.pullNumber, keys.githubToken);

      port.postMessage({ type: "PROGRESS", stage: "processing_diff" } as ContentMessage);
      const filtered = filterDiff(rawDiff);
      const processed = truncateDiff(filtered);
      const stats = extractDiffStats(filtered);
      const prompt = buildAnalysisPrompt(metadata, processed);

      port.postMessage({ type: "PROGRESS", stage: "analyzing" } as ContentMessage);
      const analysis = await analyzeWithClaudeStream(prompt, keys.anthropicKey, (chunk) => {
        port.postMessage({ type: "STREAM_CHUNK", text: chunk } as ContentMessage);
      });

      port.postMessage({
        type: "COMPLETE",
        data: {
          metadata,
          stats,
          analysis,
          meta: {
            diffTruncated: processed.includes("[truncated]"),
            filesAnalyzed: stats.filesChanged,
            model: MODEL,
          },
        },
      } as ContentMessage);
    } catch (err) {
      port.postMessage(errorToMessage(err));
    }
  });
});

chrome.runtime.onMessage.addListener(
  (msg: BackgroundMessage, _sender, sendResponse) => {
    if (msg.type === "CHECK_API_KEYS") {
      getApiKeys().then((keys) => {
        sendResponse({ hasKeys: !!keys.anthropicKey });
      });
      return true;
    }
    if (msg.type === "OPEN_SETTINGS") {
      chrome.action.openPopup();
      return false;
    }
  },
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("GitBrief extension installed");
});
