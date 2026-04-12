import { analyzePr } from "@/lib/analyzer";
import { getApiKeys } from "@/lib/storage";
import { GitHubApiError, ClaudeApiError, ClaudeParseError, ParseUrlError } from "@/lib/errors";
import type { BackgroundMessage, ContentMessage } from "./message-types";

function errorToCode(err: unknown): ContentMessage & { type: "ERROR" } {
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
      const result = await analyzePr(msg.prUrl, (stage) => {
        port.postMessage({ type: "PROGRESS", stage } as ContentMessage);
      });

      port.postMessage({ type: "COMPLETE", data: result } as ContentMessage);
    } catch (err) {
      port.postMessage(errorToCode(err));
    }
  });
});

chrome.runtime.onMessage.addListener(
  (msg: BackgroundMessage, _sender, sendResponse) => {
    if (msg.type === "CHECK_API_KEYS") {
      getApiKeys().then((keys) => {
        sendResponse({ hasKeys: !!keys.anthropicKey });
      });
      return true; // keep channel open for async response
    }
  },
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("GitBrief extension installed");
});
