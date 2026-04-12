import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalysisResults from "@/content/sidebar/components/AnalysisResults";
import type { AnalysisResponse } from "@/lib/types";

const MOCK_RESPONSE: AnalysisResponse = {
  metadata: {
    title: "Add JWT authentication",
    author: "developer",
    body: "Adds JWT auth",
    state: "open",
    baseBranch: "main",
    headBranch: "feature/auth",
    htmlUrl: "https://github.com/owner/repo/pull/1",
    createdAt: "2026-04-01T10:00:00Z",
  },
  stats: { filesChanged: 3, insertions: 45, deletions: 12 },
  analysis: {
    summary: "This PR adds JWT-based authentication to the API layer.",
    keyChanges: [
      { file: "src/auth.ts", description: "New auth middleware", impact: "high" },
      { file: "src/config.ts", description: "Added JWT secret config", impact: "medium" },
    ],
    risks: [
      { severity: "high", title: "No token expiry", description: "Tokens never expire" },
      { severity: "low", title: "Missing tests", description: "No unit tests for auth" },
    ],
    suggestions: [
      { category: "security", title: "Add token rotation", description: "Implement refresh tokens" },
    ],
  },
  meta: { diffTruncated: false, filesAnalyzed: 3, model: "claude-sonnet-4-20250514" },
};

describe("T-026: AnalysisResults renders all sections", () => {
  it("renders the summary text", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    expect(screen.getByText(/JWT-based authentication/)).toBeInTheDocument();
  });

  it("renders PR metadata header", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    expect(screen.getByText(/Add JWT authentication/)).toBeInTheDocument();
    expect(screen.getByText(/developer/)).toBeInTheDocument();
  });

  it("renders key changes with file names", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    expect(screen.getByText(/src\/auth\.ts/)).toBeInTheDocument();
    expect(screen.getByText(/src\/config\.ts/)).toBeInTheDocument();
  });

  it("renders impact indicators for key changes", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    const highBadges = screen.getAllByText(/high/i);
    const mediumBadges = screen.getAllByText(/medium/i);
    expect(highBadges.length).toBeGreaterThanOrEqual(1);
    expect(mediumBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders risks with severity", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    expect(screen.getByText(/No token expiry/)).toBeInTheDocument();
    expect(screen.getByText(/Missing tests/)).toBeInTheDocument();
  });

  it("renders suggestions", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    expect(screen.getByText(/Add token rotation/)).toBeInTheDocument();
  });

  it("renders stats", () => {
    render(<AnalysisResults data={MOCK_RESPONSE} />);
    const filesTexts = screen.getAllByText(/3 files/i);
    expect(filesTexts.length).toBeGreaterThanOrEqual(1);
  });
});

describe("T-027: AnalysisResults handles empty arrays", () => {
  const EMPTY_RESPONSE: AnalysisResponse = {
    ...MOCK_RESPONSE,
    analysis: {
      summary: "Simple formatting change.",
      keyChanges: [{ file: "README.md", description: "Fixed typo", impact: "low" }],
      risks: [],
      suggestions: [],
    },
  };

  it("shows 'None identified' when risks array is empty", () => {
    render(<AnalysisResults data={EMPTY_RESPONSE} />);
    const noneTexts = screen.getAllByText(/none identified/i);
    expect(noneTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'None identified' when suggestions array is empty", () => {
    render(<AnalysisResults data={EMPTY_RESPONSE} />);
    const noneTexts = screen.getAllByText(/none identified/i);
    expect(noneTexts.length).toBeGreaterThanOrEqual(1);
  });
});
