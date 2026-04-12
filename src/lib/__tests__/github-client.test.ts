import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPrMetadata } from "@/lib/github-client";
import { GitHubApiError } from "@/lib/errors";

const MOCK_GITHUB_RESPONSE = {
  title: "Add authentication",
  user: { login: "developer" },
  body: "This PR adds JWT auth",
  state: "open",
  base: { ref: "main" },
  head: { ref: "feature/auth" },
  html_url: "https://github.com/owner/repo/pull/1",
  created_at: "2026-04-01T10:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("T-005: fetchPrMetadata returns typed metadata on success", () => {
  it("maps GitHub API response to PrMetadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_GITHUB_RESPONSE),
      })
    );

    const result = await fetchPrMetadata("owner", "repo", 1);

    expect(result).toEqual({
      title: "Add authentication",
      author: "developer",
      body: "This PR adds JWT auth",
      state: "open",
      baseBranch: "main",
      headBranch: "feature/auth",
      htmlUrl: "https://github.com/owner/repo/pull/1",
      createdAt: "2026-04-01T10:00:00Z",
    });
  });

  it("calls the correct GitHub API endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_GITHUB_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchPrMetadata("facebook", "react", 28000);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/facebook/react/pulls/28000",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github.v3+json",
        }),
      })
    );
  });

  it("handles null body in PR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ ...MOCK_GITHUB_RESPONSE, body: null }),
      })
    );

    const result = await fetchPrMetadata("owner", "repo", 1);
    expect(result.body).toBeNull();
  });
});

describe("T-006: fetchPrMetadata sends auth header when token provided", () => {
  it("includes Authorization header when token is provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_GITHUB_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchPrMetadata("owner", "repo", 1, "ghp_test_token");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer ghp_test_token",
        }),
      })
    );
  });

  it("omits Authorization header when no token provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_GITHUB_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchPrMetadata("owner", "repo", 1);

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders).not.toHaveProperty("Authorization");
  });
});

describe("T-007: fetchPrMetadata handles 404 and 403 errors", () => {
  it("throws GitHubApiError with status 404 for not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({ message: "Not Found" }),
      })
    );

    await expect(fetchPrMetadata("owner", "repo", 999)).rejects.toThrow(
      GitHubApiError
    );
    await expect(
      fetchPrMetadata("owner", "repo", 999)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws GitHubApiError with status 403 for rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            message: "API rate limit exceeded",
          }),
      })
    );

    await expect(fetchPrMetadata("owner", "repo", 1)).rejects.toThrow(
      GitHubApiError
    );
    await expect(
      fetchPrMetadata("owner", "repo", 1)
    ).rejects.toMatchObject({ status: 403 });
  });

  it("includes GitHub error message in the thrown error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Not Found" }),
      })
    );

    await expect(fetchPrMetadata("owner", "repo", 999)).rejects.toThrow(
      /Not Found/
    );
  });
});
