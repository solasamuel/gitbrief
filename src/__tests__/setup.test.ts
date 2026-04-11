import { describe, it, expect } from "vitest";

describe("T-001: Project setup", () => {
  it("vitest executes tests successfully", () => {
    expect(true).toBe(true);
  });

  it("can import shared types", async () => {
    const types = await import("@/lib/types");
    expect(types).toBeDefined();
  });

  it("can import error classes", async () => {
    const { GitHubApiError, ClaudeApiError, ClaudeParseError, ParseUrlError } =
      await import("@/lib/errors");
    expect(GitHubApiError).toBeDefined();
    expect(ClaudeApiError).toBeDefined();
    expect(ClaudeParseError).toBeDefined();
    expect(ParseUrlError).toBeDefined();
  });
});
