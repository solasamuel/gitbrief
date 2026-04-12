import { GitHubApiError } from "@/lib/errors";
import type { PrMetadata } from "@/lib/types";

const GITHUB_API_BASE = "https://api.github.com";

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchPrMetadata(
  owner: string,
  repo: string,
  pullNumber: number,
  token?: string,
): Promise<PrMetadata> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}`;
  const response = await fetch(url, { headers: buildHeaders(token) });

  if (!response.ok) {
    const body = await response.json();
    throw new GitHubApiError(
      body.message || `GitHub API error: ${response.status}`,
      response.status,
    );
  }

  const data = await response.json();

  return {
    title: data.title,
    author: data.user.login,
    body: data.body ?? null,
    state: data.state,
    baseBranch: data.base.ref,
    headBranch: data.head.ref,
    htmlUrl: data.html_url,
    createdAt: data.created_at,
  };
}
