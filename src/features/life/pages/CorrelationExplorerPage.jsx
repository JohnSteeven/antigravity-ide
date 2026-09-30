import React, { useState } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiActivity, FiMoon, FiTrendingUp, FiSmile, FiDollarSign, FiInfo } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { LifePageHeader, LifeLoading, LifeError } from "../components/LifeUI";

function getStrengthBadge(strength, r, method) {
  const symbol = method === "spearman" ? "\u03c1" : "r";
  switch (strength) {
    case "strong_positive":
      return { text: `Strong Positive (${symbol} = ${r})`, color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" };
    case "moderate_positive":
      return { text: `Moderate Positive (${symbol} = ${r})`, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" };
    case "strong_negative":
      return { text: `Strong Inverse (${symbol} = ${r})`, color: "#f87171", bg: "rgba(239, 68, 68, 0.12)" };
    case "moderate_negative":
      return { text: `Moderate Inverse (${symbol} = ${r})`, color: "#fb923c", bg: "rgba(251, 146, 60, 0.12)" };
    case "insufficient_data":
      return { text: "Insufficient Data (N < 7)", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" };
    default:
      return { text: `Neutral / Weak (${symbol} = ${r != null ? r : 0})`, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" };
  }
}

function getPairIcon(id) {
  switch (id) {
    case "sleep_vs_energy":
      return <FiMoon style={{ color: "#818cf8" }} />;
    case "movement_vs_sleep":
      return <FiActivity style={{ color: "#34d399" }} />;
    case "habits_vs_mood":
      return <FiSmile style={{ color: "#f59e0b" }} />;
    case "spending_vs_stress":
      return <FiDollarSign style={{ color: "#ec4899" }} />;
    default:
      return <FiTrendingUp style={{ color: "#38bdf8" }} />;
  }
}

export default function CorrelationExplorerPage() {
  const [days, setDays] = useState(30);

  const query = useLifeQuery(async () => {
    const res = await lifeApi.correlations({ days });
    return res.data;
  }, [days]);

  if (query.loading) return <LifeLoading label="Computing cross-domain associations…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;

  const data = query.data;
  const correlations = data?.correlations || [];

  return (
    <div className="life-correlations-page">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/life/insights" className="life-back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>
          <FiArrowLeft /> Back to Insights & Reviews
        </Link>
      </div>

      <LifePageHeader
        eyebrow="Empirical Rhythm Intelligence"
        title="Cross-Domain Correlation Explorer"
        description="Statistically grounded relationships between your sleep, physical movement, habit consistency, spending, and subjective wellbeing. Requires at least 7 paired days for statistical validity."
        actions={
          <div className="life-page-actions" style={{ display: "flex", gap: "0.5rem" }}>
            {[14, 30, 90, 180].map((d) => (
              <button
                key={d}
                type="button"
                className={days === d ? "life-primary-button" : "life-secondary-button"}
                onClick={() => setDays(d)}
                style={{ fontSize: "0.8125rem", padding: "0.4rem 0.8rem" }}
              >
                {d} days
              </button>
            ))}
          </div>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155", marginBottom: "1.5rem", color: "#94a3b8", fontSize: "0.8125rem" }}>
        <FiInfo style={{ color: "#38bdf8", flexShrink: 0, fontSize: "1rem" }} />
        <span>
          Correlation does not mean causation. Association does not establish causation. These metrics highlight observational patterns in your self-reported logs and synced inputs to help guide mindful adjustments.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {correlations.map((c) => {
          const badge = getStrengthBadge(c.strength, c.r, c.method);
          const icon = getPairIcon(c.id);

          return (
            <article
              key={c.id}
              className="life-card"
              style={{
                background: "#1e293b",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontSize: "1.25rem", padding: "0.5rem", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155", display: "flex" }}>
                      {icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#f8fafc" }}>{c.title}</h3>
                      <small style={{ color: "#64748b" }}>
                        {c.independentVar?.label} ({c.independentVar?.unit}) vs {c.dependentVar?.label} ({c.dependentVar?.unit})
                      </small>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "9999px",
                      background: badge.bg,
                      color: badge.color,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {badge.text}
                  </span>
                </div>

                <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: "1.5", margin: "1rem 0" }}>
                  {c.description}
                </p>

                {c.insufficientData ? (
                  <div style={{ padding: "1.25rem", background: "#0f172a", borderRadius: "8px", textAlign: "center", border: "1px dashed #334155" }}>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>
                      Recorded <strong>{c.sampleSize}</strong> of <strong>7</strong> required paired entries.
                    </p>
                    <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                      Log {c.independentVar?.label?.toLowerCase()} alongside daily check-ins to view empirical correlation.
                    </small>
                  </div>
                ) : (
                  <div style={{ padding: "1rem", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                      <span>Sample: {c.sampleSize} paired days</span>
                      <span>{c.method === "spearman" ? "Spearman rank (\u03c1)" : "Pearson (r)"}: {c.r}</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#334155", borderRadius: "3px", position: "relative", overflow: "hidden" }}>
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: "50%",
                          width: `${Math.min(50, Math.abs((c.r || 0) * 50))}%`,
                          transform: (c.r || 0) < 0 ? "scaleX(-1)" : "none",
                          transformOrigin: "left",
                          background: (c.r || 0) > 0 ? "#34d399" : "#f87171",
                          borderRadius: "3px"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", marginTop: "0.35rem" }}>
                      <span>-1.0 (Inverse)</span>
                      <span>0.0</span>
                      <span>+1.0 (Direct)</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Confidence: {c.sampleSize >= 14 ? "High" : c.sampleSize >= 7 ? "Medium" : "Pending"}</span>
                <span style={{ fontSize: "0.75rem", color: "#38bdf8" }}>{c.sampleSize} records analyzed</span>
              </div>
            </article>
          );
        })}
      </div>

      <p className="life-language-boundary" style={{ marginTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.8125rem" }}>
        {data?.languageBoundary}
      </p>
    </div>
  );
}
