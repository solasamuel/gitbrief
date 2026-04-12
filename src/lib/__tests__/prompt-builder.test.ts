import { describe, it, expect } from "vitest";
import { buildAnalysisPrompt } from "@/lib/prompt-builder";
import type { PrMetadata } from "@/lib/types";

const MOCK_METADATA: PrMetadata = {
  title: "Add JWT authentication",
  author: "developer",
  body: "This PR adds JWT-based auth to the API layer.",
  state: "open",
  baseBranch: "main",
  headBranch: "feature/auth",
  htmlUrl: "https://github.com/owner/repo/pull/1",
  createdAt: "2026-04-01T10:00:00Z",
};

const MOCK_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
+export function authenticate() { return true; }
`;

describe("T-014: buildAnalysisPrompt returns system+user messages", () => {
  it("returns an object with system and user string properties", () => {
    const result = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("system prompt contains JSON schema instructions", () => {
    const { system } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(system).toContain("summary");
    expect(system).toContain("keyChanges");
    expect(system).toContain("risks");
    expect(system).toContain("suggestions");
    expect(system).toContain("JSON");
  });

  it("system prompt defines severity and impact values", () => {
    const { system } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(system).toContain("high");
    expect(system).toContain("medium");
    expect(system).toContain("low");
  });

  it("user message includes PR title", () => {
    const { user } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(user).toContain("Add JWT authentication");
  });

  it("user message includes PR author", () => {
    const { user } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(user).toContain("developer");
  });

  it("user message includes branch info", () => {
    const { user } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(user).toContain("main");
    expect(user).toContain("feature/auth");
  });

  it("user message includes the PR description", () => {
    const { user } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(user).toContain("JWT-based auth");
  });

  it("user message includes the diff", () => {
    const { user } = buildAnalysisPrompt(MOCK_METADATA, MOCK_DIFF);

    expect(user).toContain("authenticate()");
  });
});

describe("T-015: buildAnalysisPrompt handles empty description", () => {
  it("does not include 'undefined' when body is null", () => {
    const metadata = { ...MOCK_METADATA, body: null };
    const { user } = buildAnalysisPrompt(metadata, MOCK_DIFF);

    expect(user).not.toContain("undefined");
    expect(user).not.toContain("null");
  });

  it("does not include 'undefined' when body is empty string", () => {
    const metadata = { ...MOCK_METADATA, body: "" };
    const { user } = buildAnalysisPrompt(metadata, MOCK_DIFF);

    expect(user).not.toContain("undefined");
  });

  it("still includes the diff when body is null", () => {
    const metadata = { ...MOCK_METADATA, body: null };
    const { user } = buildAnalysisPrompt(metadata, MOCK_DIFF);

    expect(user).toContain("authenticate()");
  });
});
