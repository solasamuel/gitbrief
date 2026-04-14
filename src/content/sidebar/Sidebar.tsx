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
  onClose: () => void;
}

export default function Sidebar({ prUrl, onClose }: Props) {
  const [state, setState] = useState<SidebarState>({ status: "idle" });
  const [activePort, setActivePort] = useState<chrome.runtime.Port | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "CHECK_API_KEYS" }, (response) => {
      if (response && !response.hasKeys) {
        setState({ status: "no-keys" });
      }
    });
  }, []);

  const startAnalysis = useCallback(() => {
    if (activePort) {
      activePort.disconnect();
    }

    setState({ status: "loading", streamedChars: 0 });

    const port = chrome.runtime.connect({ name: "analyze" });
    setActivePort(port);

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
          setActivePort(null);
          port.disconnect();
          break;
        case "ERROR":
          setState({ status: "error", message: msg.error, code: msg.code });
          setActivePort(null);
          port.disconnect();
          break;
      }
    });

    port.postMessage({ type: "START_ANALYSIS", prUrl });
  }, [prUrl, activePort]);

  const handleReset = useCallback(() => {
    if (activePort) {
      activePort.disconnect();
      setActivePort(null);
    }
    setState({ status: "idle" });
  }, [activePort]);

  const handleOpenSettings = useCallback(() => {
    chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
  }, []);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        color: "#1f2328",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #d0d7de",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #d0d7de",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
            GitBrief
          </h2>
          <p style={{ margin: "2px 0 0", color: "#656d76", fontSize: "11px" }}>
            AI-Powered PR Review
          </p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {(state.status === "success" || state.status === "error" || state.status === "loading") && (
            <button
              onClick={handleReset}
              title="Reset"
              style={{
                background: "none",
                border: "1px solid #d0d7de",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
                color: "#656d76",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            title="Close sidebar"
            style={{
              background: "none",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              width: "28px",
              height: "28px",
              fontSize: "16px",
              color: "#656d76",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        {state.status === "idle" && (
          <div>
            <p style={{ margin: "0 0 12px", color: "#656d76", fontSize: "13px" }}>
              Analyze this pull request with AI to get a structured code review.
            </p>
            <AnalyzeButton onClick={startAnalysis} />
          </div>
        )}

        {state.status === "no-keys" && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff8c5",
              borderRadius: "6px",
              border: "1px solid #d4a72c",
              fontSize: "13px",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>
              No API key configured
            </div>
            <div style={{ color: "#656d76" }}>
              Click the GitBrief extension icon to{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenSettings();
                }}
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
          <div>
            <AnalysisResults data={state.data} />
            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid #d0d7de",
              }}
            >
              <AnalyzeButton onClick={startAnalysis} />
            </div>
          </div>
        )}

        {state.status === "error" && (
          <ErrorState
            message={state.message}
            code={state.code}
            onRetry={startAnalysis}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid #d0d7de",
          fontSize: "11px",
          color: "#8b949e",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleOpenSettings();
            }}
            style={{ color: "#8b949e", textDecoration: "none" }}
          >
            Settings
          </a>
        </span>
        {state.status === "success" && state.data.meta && (
          <span>{state.data.meta.model}</span>
        )}
      </div>
    </div>
  );
}
