import { ClaudeApiError } from "@/lib/errors";
import type { AnalysisResponse } from "@/lib/types";
import type { ProgressStage } from "@/background/message-types";
import { getApiKeys } from "@/lib/storage";
import { parsePrUrl } from "@/lib/parse-pr-url";
import { fetchPrMetadata, fetchPrDiff } from "@/lib/github-client";
import { filterDiff, truncateDiff, extractDiffStats } from "@/lib/diff-utils";
import { buildAnalysisPrompt } from "@/lib/prompt-builder";
import { analyzeWithClaude } from "@/lib/claude-client";

const MODEL = "claude-sonnet-4-20250514";

export async function analyzePr(
  url: string,
  onProgress?: (stage: ProgressStage) => void,
): Promise<AnalysisResponse> {
  const keys = await getApiKeys();
  if (!keys.anthropicKey) {
    throw new ClaudeApiError("No API key configured. Open GitBrief settings to add your Anthropic API key.");
  }

  onProgress?.("parsing_url");
  const ref = parsePrUrl(url);

  onProgress?.("fetching_metadata");
  const metadata = await fetchPrMetadata(ref.owner, ref.repo, ref.pullNumber, keys.githubToken);

  onProgress?.("fetching_diff");
  const rawDiff = await fetchPrDiff(ref.owner, ref.repo, ref.pullNumber, keys.githubToken);

  onProgress?.("processing_diff");
  const filtered = filterDiff(rawDiff);
  const processed = truncateDiff(filtered);
  const stats = extractDiffStats(filtered);
  const prompt = buildAnalysisPrompt(metadata, processed);

  onProgress?.("analyzing");
  const analysis = await analyzeWithClaude(prompt, keys.anthropicKey);

  return {
    metadata,
    stats,
    analysis,
    meta: {
      diffTruncated: processed.includes("[truncated]"),
      filesAnalyzed: stats.filesChanged,
      model: MODEL,
    },
  };
}
