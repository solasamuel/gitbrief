import type { ProgressStage } from "@/background/message-types";

const STAGE_LABELS: Record<ProgressStage, string> = {
  parsing_url: "Parsing PR URL...",
  fetching_metadata: "Fetching PR metadata...",
  fetching_diff: "Fetching diff...",
  processing_diff: "Processing diff...",
  analyzing: "Analyzing with Claude...",
};

interface Props {
  stage?: ProgressStage;
  streamedChars?: number;
}

export default function LoadingState({ stage, streamedChars }: Props) {
  const label = stage ? STAGE_LABELS[stage] : "Starting analysis...";

  return (
    <div aria-busy="true" aria-live="polite" style={{ textAlign: "center", padding: "24px 0" }}>
      <div
        style={{
          width: "24px",
          height: "24px",
          border: "3px solid #d0d7de",
          borderTopColor: "#0969da",
          borderRadius: "50%",
          margin: "0 auto 12px",
          animation: "gitbrief-spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: "13px", color: "#656d76" }}>{label}</div>
      {streamedChars !== undefined && streamedChars > 0 && (
        <div style={{ fontSize: "11px", color: "#8b949e", marginTop: "4px" }}>
          {streamedChars.toLocaleString()} characters received
        </div>
      )}
      <style>{`
        @keyframes gitbrief-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
