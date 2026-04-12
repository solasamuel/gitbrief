import { describe, it, expect } from "vitest";
import { parsePrUrl } from "@/lib/parse-pr-url";
import { ParseUrlError } from "@/lib/errors";

describe("T-002: parsePrUrl extracts owner/repo/pullNumber from valid URLs", () => {
  it("parses a standard GitHub PR URL", () => {
    const result = parsePrUrl("https://github.com/facebook/react/pull/28000");
    expect(result).toEqual({
      owner: "facebook",
      repo: "react",
      pullNumber: 28000,
    });
  });

  it("parses a URL with trailing slash", () => {
    const result = parsePrUrl("https://github.com/vercel/next.js/pull/123/");
    expect(result).toEqual({
      owner: "vercel",
      repo: "next.js",
      pullNumber: 123,
    });
  });

  it("parses a URL with query string", () => {
    const result = parsePrUrl(
      "https://github.com/owner/repo/pull/456?diff=split"
    );
    expect(result).toEqual({
      owner: "owner",
      repo: "repo",
      pullNumber: 456,
    });
  });

  it("parses a URL with hash fragment", () => {
    const result = parsePrUrl(
      "https://github.com/owner/repo/pull/789#discussion_r123"
    );
    expect(result).toEqual({
      owner: "owner",
      repo: "repo",
      pullNumber: 789,
    });
  });

  it("parses a URL with /files or /commits suffix", () => {
    const result = parsePrUrl(
      "https://github.com/owner/repo/pull/42/files"
    );
    expect(result).toEqual({
      owner: "owner",
      repo: "repo",
      pullNumber: 42,
    });
  });

  it("handles repos with dots and hyphens in names", () => {
    const result = parsePrUrl(
      "https://github.com/my-org/my-repo.js/pull/1"
    );
    expect(result).toEqual({
      owner: "my-org",
      repo: "my-repo.js",
      pullNumber: 1,
    });
  });
});

describe("T-003: parsePrUrl rejects non-GitHub and non-PR URLs", () => {
  it("rejects an empty string", () => {
    expect(() => parsePrUrl("")).toThrow(ParseUrlError);
  });

  it("rejects random text", () => {
    expect(() => parsePrUrl("not a url at all")).toThrow(ParseUrlError);
  });

  it("rejects a GitLab URL", () => {
    expect(() =>
      parsePrUrl("https://gitlab.com/owner/repo/merge_requests/1")
    ).toThrow(ParseUrlError);
    expect(() =>
      parsePrUrl("https://gitlab.com/owner/repo/merge_requests/1")
    ).toThrow(/GitHub/i);
  });

  it("rejects a GitHub repo URL (not a PR)", () => {
    expect(() =>
      parsePrUrl("https://github.com/facebook/react")
    ).toThrow(ParseUrlError);
  });

  it("rejects a GitHub issue URL", () => {
    expect(() =>
      parsePrUrl("https://github.com/facebook/react/issues/123")
    ).toThrow(ParseUrlError);
    expect(() =>
      parsePrUrl("https://github.com/facebook/react/issues/123")
    ).toThrow(/pull request/i);
  });

  it("rejects a GitHub compare URL", () => {
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/compare/main...feature")
    ).toThrow(ParseUrlError);
  });
});

describe("T-004: parsePrUrl edge cases (zero, negative, non-numeric)", () => {
  it("rejects pull/0", () => {
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/pull/0")
    ).toThrow(ParseUrlError);
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/pull/0")
    ).toThrow(/positive/i);
  });

  it("rejects pull/-1", () => {
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/pull/-1")
    ).toThrow(ParseUrlError);
  });

  it("rejects pull/abc", () => {
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/pull/abc")
    ).toThrow(ParseUrlError);
  });

  it("rejects extremely large numbers", () => {
    expect(() =>
      parsePrUrl("https://github.com/owner/repo/pull/99999999999999999")
    ).toThrow(ParseUrlError);
  });
});
