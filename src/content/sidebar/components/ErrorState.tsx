import type { ErrorCode } from "@/lib/types";

interface Props {
  message: string;
  code?: ErrorCode;
  onRetry: () => void;
}

export default function ErrorState({ message, code, onRetry }: Props) {
  const showSettings = code === "CLAUDE_ERROR";

  return (
    <div role="alert" style={{ padding: "12px", backgroundColor: "#fff5f5", borderRadius: "6px", border: "1px solid #ffcdd2" }}>
      <div style={{ fontSize: "13px", color: "#cf222e", fontWeight: 500, marginBottom: "8px" }}>
        {message}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={onRetry}
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            border: "1px solid #d0d7de",
            borderRadius: "6px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        {showSettings && (
          <span style={{ fontSize: "12px", color: "#656d76" }}>
            Check your API key in{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
              }}
              style={{ color: "#0969da" }}
            >
              settings
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
