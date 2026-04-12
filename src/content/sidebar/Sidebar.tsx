export default function Sidebar() {
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
      }}
    >
      <h2 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
        GitBrief
      </h2>
      <p style={{ margin: 0, color: "#656d76", fontSize: "12px" }}>
        AI-Powered PR Review
      </p>
    </div>
  );
}
