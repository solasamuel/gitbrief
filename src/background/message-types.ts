import type { AnalysisResponse, ErrorCode } from "@/lib/types";

export type ProgressStage =
  | "parsing_url"
  | "fetching_metadata"
  | "fetching_diff"
  | "processing_diff"
  | "analyzing";

export type BackgroundMessage =
  | { type: "START_ANALYSIS"; prUrl: string }
  | { type: "CHECK_API_KEYS" }
  | { type: "OPEN_SETTINGS" };

export type ContentMessage =
  | { type: "PROGRESS"; stage: ProgressStage }
  | { type: "STREAM_CHUNK"; text: string }
  | { type: "COMPLETE"; data: AnalysisResponse }
  | { type: "ERROR"; error: string; code?: ErrorCode };
