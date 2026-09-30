import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { FiArrowLeft, FiPrinter, FiCalendar, FiChevronLeft, FiChevronRight, FiAward, FiCheckCircle } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { localDateInput, addDateDays } from "../utils/lifeFormat";
import { LifePageHeader, LifeLoading, LifeError } from "../components/LifeUI";
import { LifeComparisonBadge } from "../components/charts";

function getGradeColor(grade) {
  switch (grade) {
    case "A":
      return { text: "#34d399", bg: "rgba(52, 211, 153, 0.15)", border: "#059669" };
    case "B":
      return { text: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "#0284c7" };
    case "C":
      return { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "#d97706" };
    default:
      return { text: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "#475569" };
  }
}

export default function PeriodicReportPage({ initialType }) {
  const location = useLocation();
  const defaultType = initialType || (location.pathname.includes("monthly") ? "monthly" : "weekly");
  const [reportType, setReportType] = useState(defaultType);
  const [currentDate, setCurrentDate] = useState(localDateInput());

  const query = useLifeQuery(async () => {
    const res = await lifeApi.periodicReport({ type: reportType, date: currentDate });
    return res.data;
  }, [reportType, currentDate]);

  const navigatePeriod = (direction) => {
    const step = reportType === "weekly" ? 7 : 30;
    setCurrentDate((d) => addDateDays(d, direction * step));
  };

  if (query.loading) return <LifeLoading label="Synthesizing periodic review…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;

  const data = query.data;
  const period = data?.period || {};
  const scorecards = data?.scorecards || {};
  const summary = data?.executiveSummary || [];

  return (
    <div className="life-periodic-report-page">
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/life/insights" className="life-back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>
          <FiArrowLeft /> Back to Insights & Reviews
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="life-secondary-button"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", padding: "0.4rem 0.8rem" }}
        >
          <FiPrinter /> Print / Export
        </button>
      </div>

      <LifePageHeader
        eyebrow="Periodic Synthesis & Scorecard"
        title={period.title || (reportType === "weekly" ? "Weekly Review" : "Monthly Review")}
        description="Deterministic review of your recorded patterns, dimension grades, and period-over-period changes without subjective pressure."
        actions={
          <div className="life-page-actions" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="life-segmented" style={{ display: "inline-flex", background: "#0f172a", borderRadius: "8px", padding: "2px", border: "1px solid #334155" }}>
              <button
                type="button"
                className={reportType === "weekly" ? "is-active" : ""}
                onClick={() => setReportType("weekly")}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", border: "none", borderRadius: "6px", background: reportType === "weekly" ? "#1e293b" : "transparent", color: reportType === "weekly" ? "#38bdf8" : "#94a3b8", cursor: "pointer" }}
              >
                Weekly
              </button>
              <button
                type="button"
                className={reportType === "monthly" ? "is-active" : ""}
                onClick={() => setReportType("monthly")}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", border: "none", borderRadius: "6px", background: reportType === "monthly" ? "#1e293b" : "transparent", color: reportType === "monthly" ? "#38bdf8" : "#94a3b8", cursor: "pointer" }}
              >
                Monthly
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }}>
              <button type="button" className="life-secondary-button" onClick={() => navigatePeriod(-1)} aria-label="Previous Period" style={{ padding: "0.4rem 0.6rem" }}>
                <FiChevronLeft />
              </button>
              <button type="button" className="life-secondary-button" onClick={() => navigatePeriod(1)} aria-label="Next Period" style={{ padding: "0.4rem 0.6rem" }}>
                <FiChevronRight />
              </button>
            </div>
          </div>
        }
      />

      {summary.length > 0 && (
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <FiAward style={{ color: "#38bdf8", fontSize: "1.25rem" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#f8fafc" }}>Executive Highlights</h3>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {summary.map((item, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "#cbd5e1" }}>
                <FiCheckCircle style={{ color: item.tone === "positive" ? "#34d399" : "#38bdf8", flexShrink: 0 }} />
                <span><strong>{item.dimension}:</strong> {item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {Object.entries(scorecards).map(([key, card]) => {
          const gradeStyle = getGradeColor(card.grade);

          return (
            <article
              key={key}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    {card.title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      background: gradeStyle.bg,
                      color: gradeStyle.text,
                      border: `1px solid ${gradeStyle.border}`
                    }}
                  >
                    Grade {card.grade}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f8fafc" }}>
                    {card.currentValue || (card.savingsRate ? `${card.savingsRate} savings` : "—")}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
                  <span>Prev: {card.previousValue || "—"}</span>
                  {card.delta != null && (
                    <LifeComparisonBadge
                      current={typeof card.delta === "number" ? Math.abs(card.delta) : 0}
                      previous={0}
                      label={card.delta >= 0 ? `+${card.delta} ${card.unit || ""}` : `${card.delta} ${card.unit || ""}`}
                      invert={false}
                    />
                  )}
                </div>
              </div>

              {card.target && (
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #334155", fontSize: "0.75rem", color: "#94a3b8" }}>
                  Benchmark Target: <strong>{card.target}</strong>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <p className="life-language-boundary" style={{ marginTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.8125rem" }}>
        {data?.languageBoundary}
      </p>
    </div>
  );
}
