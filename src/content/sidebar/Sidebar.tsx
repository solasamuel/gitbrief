import { useState, useEffect, useCallback } from "react";
import type { AnalysisResponse, ErrorCode } from "@/lib/types";
import type { ContentMessage, ProgressStage } from "@/background/message-types";
import AnalyzeButton from "./components/AnalyzeButton";
import AnalysisResults from "./components/AnalysisResults";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";

type SidebarState =
  | { status: "idle" }
  | { status: "no-keys" }
  | { status: "loading"; stage?: ProgressStage; streamedChars: number }
  | { status: "success"; data: AnalysisResponse }
  | { status: "error"; message: string; code?: ErrorCode };

interface Props {
  prUrl: string;
}

export default function Sidebar({ prUrl }: Props) {
  const [state, setState] = useState<SidebarState>({ status: "idle" });

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "CHECK_API_KEYS" }, (response) => {
      if (response && !response.hasKeys) {
        setState({ status: "no-keys" });
      }
    });
  }, []);

  const startAnalysis = useCallback(() => {
    setState({ status: "loading", streamedChars: 0 });

    const port = chrome.runtime.connect({ name: "analyze" });

    port.onMessage.addListener((msg: ContentMessage) => {
      switch (msg.type) {
        case "PROGRESS":
          setState((prev) =>
            prev.status === "loading"
              ? { ...prev, stage: msg.stage }
              : prev,
          );
          break;
        case "STREAM_CHUNK":
          setState((prev) =>
            prev.status === "loading"
              ? { ...prev, streamedChars: prev.streamedChars + msg.text.length }
              : prev,
          );
          break;
        case "COMPLETE":
          setState({ status: "success", data: msg.data });
          port.disconnect();
          break;
        case "ERROR":
          setState({ status: "error", message: msg.error, code: msg.code });
          port.disconnect();
          break;
      }
    });

    port.postMessage({ type: "START_ANALYSIS", prUrl });
  }, [prUrl]);

  const handleRetry = useCallback(() => {
    startAnalysis();
  }, [startAnalysis]);

  const handleOpenSettings = useCallback(() => {
    chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
  }, []);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        color: "#1f2328",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #d0d7de",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 600 }}>
          GitBrief
        </h2>
        <p style={{ margin: 0, color: "#656d76", fontSize: "12px" }}>
          AI-Powered PR Review
        </p>
      </div>

      {state.status === "idle" && (
        <AnalyzeButton onClick={startAnalysis} />
      )}

      {state.status === "no-keys" && (
        <div style={{ padding: "12px", backgroundColor: "#fff8c5", borderRadius: "6px", border: "1px solid #d4a72c", fontSize: "13px" }}>
          <div style={{ fontWeight: 500, marginBottom: "4px" }}>No API key configured</div>
          <div style={{ color: "#656d76" }}>
            Click the GitBrief extension icon to{" "}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleOpenSettings(); }}
              style={{ color: "#0969da" }}
            >
              open settings
            </a>{" "}
            and enter your Anthropic API key.
          </div>
        </div>
      )}

      {state.status === "loading" && (
        <LoadingState stage={state.stage} streamedChars={state.streamedChars} />
      )}

      {state.status === "success" && (
        <>
          <AnalysisResults data={state.data} />
          <div style={{ marginTop: "12px" }}>
            <AnalyzeButton onClick={startAnalysis} />
          </div>
        </>
      )}

      {state.status === "error" && (
        <ErrorState message={state.message} code={state.code} onRetry={handleRetry} />
      )}
    </div>
  );
}
