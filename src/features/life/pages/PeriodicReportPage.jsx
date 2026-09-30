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
  const defaultType = initialType || (location.pathname.includes("yearly") ? "yearly" : location.pathname.includes("monthly") ? "monthly" : "weekly");
  const [reportType, setReportType] = useState(defaultType);
  const [currentDate, setCurrentDate] = useState(localDateInput());

  const query = useLifeQuery(async () => {
    const res = await lifeApi.periodicReport({ type: reportType, date: currentDate });
    return res.data;
  }, [reportType, currentDate]);

  const navigatePeriod = (direction) => {
    const step = reportType === "weekly" ? 7 : reportType === "monthly" ? 30 : 365;
    setCurrentDate((d) => addDateDays(d, direction * step));
  };

  if (query.loading) return <LifeLoading label="Synthesizing periodic review…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;

  const data = query.data;
  const period = data?.period || {};
  const scorecards = data?.scorecards || {};
  const summary = data?.executiveSummary || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const currencies = data?.currencies || {};
  const bodyTrends = data?.bodyTrends;
  const journalActivity = data?.journalActivity;
  const achievements = data?.achievements || [];

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
        title={period.title || (reportType === "weekly" ? "Weekly Review" : reportType === "monthly" ? "Monthly Review" : "Yearly Review")}
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
              <button
                type="button"
                className={reportType === "yearly" ? "is-active" : ""}
                onClick={() => setReportType("yearly")}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", border: "none", borderRadius: "6px", background: reportType === "yearly" ? "#1e293b" : "transparent", color: reportType === "yearly" ? "#38bdf8" : "#94a3b8", cursor: "pointer" }}
              >
                Yearly
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

      {achievements.length > 0 && (
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <FiAward style={{ color: "#f59e0b", fontSize: "1.25rem" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#f8fafc" }}>Yearly Milestones & Achievements</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {achievements.map((ach, idx) => (
              <div key={idx} style={{ background: "#0f172a", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
                <h4 style={{ margin: "0 0 0.35rem 0", color: "#38bdf8", fontSize: "0.95rem" }}>{ach.title}</h4>
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.4 }}>{ach.description}</p>
              </div>
            ))}
          </div>
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

      {/* YEARLY 12-MONTH OVERVIEW TABLE */}
      {reportType === "yearly" && monthlyTrends.length > 0 && (
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem 0", color: "#f8fafc", fontSize: "1.1rem" }}>12-Month Progression Overview</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>Month-by-month trajectory across all monitored dimensions</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: "#cbd5e1", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Month</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Habit Consistency</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Sleep Avg</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Movement</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Mood</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Reflections</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((m) => (
                  <tr key={m.month} style={{ borderBottom: "1px solid rgba(51, 65, 85, 0.5)" }}>
                    <td style={{ padding: "0.6rem 0.8rem", fontWeight: 600, color: "#f8fafc" }}>{m.label}</td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      {m.habitsPlanned > 0 ? (
                        <span style={{ color: m.habitConsistency >= 70 ? "#34d399" : "#f59e0b" }}>
                          {m.habitConsistency}% ({m.habitsCompleted}/{m.habitsPlanned})
                        </span>
                      ) : <span style={{ color: "#64748b" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      {m.sleepNights > 0 ? (
                        <span>{Math.floor(m.sleepAverageMinutes / 60)}h {m.sleepAverageMinutes % 60}m ({m.sleepNights}n)</span>
                      ) : <span style={{ color: "#64748b" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      {m.workoutSessions > 0 ? (
                        <span>{m.workoutMinutes}m ({m.workoutSessions} sessions)</span>
                      ) : <span style={{ color: "#64748b" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      {m.moodAverage != null ? (
                        <span>{m.moodAverage} / 5</span>
                      ) : <span style={{ color: "#64748b" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      {m.journalEntries > 0 ? (
                        <span>{m.journalEntries} entries ({m.journalWords}w)</span>
                      ) : <span style={{ color: "#64748b" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* YEARLY CURRENCY TOTALS */}
      {reportType === "yearly" && Object.keys(currencies).length > 0 && (
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc", fontSize: "1.1rem" }}>Annual Financial Summary (by Currency)</h3>
          <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>Currencies maintained separately without conversion</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {Object.entries(currencies).map(([curr, flow]) => (
              <div key={curr} style={{ background: "#0f172a", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
                <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>{curr}</span>
                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Inflow:</span>
                    <strong style={{ color: "#34d399" }}>{formatMoney(flow.incomeMinor, curr)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Outflow:</span>
                    <strong style={{ color: "#f87171" }}>{formatMoney(flow.expenseMinor, curr)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #334155", paddingTop: "0.35rem", marginTop: "0.25rem" }}>
                    <span style={{ color: "#cbd5e1" }}>Net Saved:</span>
                    <strong style={{ color: flow.netMinor >= 0 ? "#38bdf8" : "#f59e0b" }}>{formatMoney(flow.netMinor, curr)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* YEARLY BODY & JOURNAL PRACTICE */}
      {reportType === "yearly" && (bodyTrends || journalActivity) && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {bodyTrends && (
            <div className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.25rem", border: "1px solid #334155" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc", fontSize: "0.95rem" }}>Body & Health Progression</h4>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                Recorded {bodyTrends.entriesCount} checkpoints: from <strong>{bodyTrends.firstRecorded}</strong> to <strong>{bodyTrends.latestRecorded}</strong> ({bodyTrends.delta >= 0 ? `+${bodyTrends.delta}` : bodyTrends.delta}).
              </p>
            </div>
          )}
          {journalActivity && (
            <div className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.25rem", border: "1px solid #334155" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc", fontSize: "0.95rem" }}>Reflection & Mind Practice</h4>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                Recorded {journalActivity.totalEntries} private entries totaling ~{journalActivity.totalWords} words across {journalActivity.activeMonthsCount} months.
              </p>
            </div>
          )}
        </section>
      )}

      <p className="life-language-boundary" style={{ marginTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.8125rem" }}>
        {data?.languageBoundary}
      </p>
    </div>
  );
}
