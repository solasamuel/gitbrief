import type { DiffStats } from "@/lib/types";

const DEFAULT_CHAR_LIMIT = 100_000;

const IGNORED_FILE_PATTERNS = [
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /\.min\.js$/,
  /\.map$/,
];

/**
 * Splits a unified diff into per-file sections.
 * Each section starts with "diff --git".
 */
function splitIntoFileDiffs(diff: string): string[] {
  const sections: string[] = [];
  const lines = diff.split("\n");
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git") && current.length > 0) {
      sections.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0 && current.some((l) => l.trim() !== "")) {
    sections.push(current.join("\n"));
  }

  return sections;
}

/**
 * Truncates a diff at file boundaries to stay within a character limit.
 * Appends a [truncated] marker if any content was removed.
 */
export function truncateDiff(
  diff: string,
  limit: number = DEFAULT_CHAR_LIMIT,
): string {
  if (diff.length <= limit) {
    return diff;
  }

  const sections = splitIntoFileDiffs(diff);
  const kept: string[] = [];
  let totalLength = 0;

  for (const section of sections) {
    // +1 for the newline between sections
    if (totalLength + section.length + 1 > limit && kept.length > 0) {
      break;
    }
    kept.push(section);
    totalLength += section.length + 1;
  }

  return kept.join("\n") + "\n\n[truncated]";
}

/**
 * Removes lock files, binary files, and other low-signal file diffs.
 */
export function filterDiff(diff: string): string {
  const sections = splitIntoFileDiffs(diff);

  const filtered = sections.filter((section) => {
    // Remove binary file diffs
    if (section.includes("Binary files")) {
      return false;
    }

    // Check against ignored file patterns
    const headerMatch = section.match(/^diff --git a\/(.+?) b\//);
    if (headerMatch) {
      const filePath = headerMatch[1];
      if (IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(filePath))) {
        return false;
      }
    }

    return true;
  });

  return filtered.join("\n");
}

/**
 * Extracts statistics from a unified diff: files changed, insertions, deletions.
 * Only counts actual change lines (starting with + or -), not headers or context.
 */
export function extractDiffStats(diff: string): DiffStats {
  if (!diff.trim()) {
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }

  const lines = diff.split("\n");
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      filesChanged++;
    } else if (line.startsWith("+++") || line.startsWith("---")) {
      // File headers, skip
    } else if (line.startsWith("+")) {
      insertions++;
    } else if (line.startsWith("-")) {
      deletions++;
    }
  }

  return { filesChanged, insertions, deletions };
}
