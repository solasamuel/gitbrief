import { ParseUrlError } from "@/lib/errors";
import type { PrReference } from "@/lib/types";

const GITHUB_PR_REGEX =
  /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/pull\/(\d+)/;

const MAX_PR_NUMBER = 2_147_483_647; // int32 max

export function parsePrUrl(input: string): PrReference {
  if (!input || !input.trim()) {
    throw new ParseUrlError("URL is required");
  }

  const trimmed = input.trim();

  if (!trimmed.includes("github.com")) {
    throw new ParseUrlError(
      "Not a GitHub URL. Please provide a GitHub pull request URL."
    );
  }

  if (/github\.com\/[^/]+\/[^/]+\/issues\//.test(trimmed)) {
    throw new ParseUrlError(
      "This is a GitHub issue URL, not a pull request URL. Use a /pull/ URL instead."
    );
  }

  const match = trimmed.match(GITHUB_PR_REGEX);

  if (!match) {
    throw new ParseUrlError(
      "Not a valid GitHub pull request URL. Expected format: https://github.com/owner/repo/pull/123"
    );
  }

  const owner = match[1];
  const repo = match[2];
  const pullNumber = parseInt(match[3], 10);

  if (pullNumber <= 0) {
    throw new ParseUrlError(
      "Pull request number must be a positive integer."
    );
  }

  if (pullNumber > MAX_PR_NUMBER) {
    throw new ParseUrlError(
      "Pull request number is too large."
    );
  }

  return { owner, repo, pullNumber };
}
