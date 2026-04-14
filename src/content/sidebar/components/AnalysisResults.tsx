import type { AnalysisResponse } from "@/lib/types";

const IMPACT_COLORS: Record<string, string> = {
  high: "#cf222e",
  medium: "#bf8700",
  low: "#1a7f37",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "#cf222e",
  medium: "#bf8700",
  low: "#1a7f37",
};

interface Props {
  data: AnalysisResponse;
}

export default function AnalysisResults({ data }: Props) {
  const { metadata, stats, analysis } = data;

  return (
    <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
      {/* PR Header */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #d0d7de" }}>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>{metadata.title}</div>
        <div style={{ color: "#656d76", fontSize: "12px", marginTop: "4px" }}>
          {metadata.author} &middot; {metadata.baseBranch} ← {metadata.headBranch}
        </div>
        <div style={{ fontSize: "12px", marginTop: "4px", display: "flex", gap: "8px" }}>
          <span style={{ color: "#656d76" }}>{stats.filesChanged} files</span>
          <span style={{ color: "#1a7f37" }}>+{stats.insertions}</span>
          <span style={{ color: "#cf222e" }}>-{stats.deletions}</span>
        </div>
      </div>

      {/* Summary */}
      <Section title="Summary">
        <p style={{ margin: 0 }}>{analysis.summary}</p>
      </Section>

      {/* Key Changes */}
      <Section title="Key Changes">
        {analysis.keyChanges.map((change, i) => (
          <div key={i} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <code style={{ fontSize: "12px", color: "#0969da" }}>{change.file}</code>
              <Badge color={IMPACT_COLORS[change.impact]}>{change.impact}</Badge>
            </div>
            <div style={{ color: "#656d76", fontSize: "12px", marginTop: "2px" }}>
              {change.description}
            </div>
          </div>
        ))}
      </Section>

      {/* Risks */}
      <Section title="Risks">
        {analysis.risks.length === 0 ? (
          <p style={{ margin: 0, color: "#656d76", fontStyle: "italic" }}>None identified</p>
        ) : (
          analysis.risks.map((risk, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Badge color={SEVERITY_COLORS[risk.severity]}>{risk.severity}</Badge>
                <span style={{ fontWeight: 500 }}>{risk.title}</span>
              </div>
              <div style={{ color: "#656d76", fontSize: "12px", marginTop: "2px" }}>
                {risk.description}
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Suggestions */}
      <Section title="Suggestions">
        {analysis.suggestions.length === 0 ? (
          <p style={{ margin: 0, color: "#656d76", fontStyle: "italic" }}>None identified</p>
        ) : (
          analysis.suggestions.map((suggestion, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ fontWeight: 500 }}>{suggestion.title}</div>
              <div style={{ color: "#656d76", fontSize: "12px", marginTop: "2px" }}>
                {suggestion.description}
              </div>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: 600, color: "#1f2328" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "1px 6px",
        borderRadius: "10px",
        color: "#fff",
        backgroundColor: color,
      }}
    >
      {children}
    </span>
  );
}
