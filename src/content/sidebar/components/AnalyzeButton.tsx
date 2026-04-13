interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function AnalyzeButton({ onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: "#fff",
        backgroundColor: disabled ? "#8b949e" : "#2da44e",
        border: "none",
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      Analyze this PR
    </button>
  );
}
