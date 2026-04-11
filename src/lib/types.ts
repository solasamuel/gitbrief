export interface PrReference {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface PrMetadata {
  title: string;
  author: string;
  body: string | null;
  state: string;
  baseBranch: string;
  headBranch: string;
  htmlUrl: string;
  createdAt: string;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface KeyChange {
  file: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export interface Risk {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface Suggestion {
  category: "performance" | "security" | "readability" | "testing" | "other";
  title: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  keyChanges: KeyChange[];
  risks: Risk[];
  suggestions: Suggestion[];
}

export interface AnalysisResponse {
  metadata: PrMetadata;
  stats: DiffStats;
  analysis: AnalysisResult;
  meta: {
    diffTruncated: boolean;
    filesAnalyzed: number;
    model: string;
  };
}

export type ErrorCode =
  | "INVALID_URL"
  | "INVALID_BODY"
  | "GITHUB_ERROR"
  | "CLAUDE_ERROR"
  | "RATE_LIMITED";

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
}

export type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AnalysisResponse }
  | { status: "error"; message: string; code?: ErrorCode };
