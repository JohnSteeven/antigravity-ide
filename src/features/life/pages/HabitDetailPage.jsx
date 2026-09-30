import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { FiArrowLeft, FiCheckCircle, FiClock, FiCalendar, FiTrendingUp, FiSmile, FiPause, FiPlay, FiArchive } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { localDateInput } from "../utils/lifeFormat";
import { LifePageHeader, LifeLoading, LifeError, LifeNotice } from "../components/LifeUI";
import { LifeMetricSummaryCard, LifeCalendarHeatmap } from "../components/charts";

export default function HabitDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useLifeQuery(async () => {
    const res = await lifeApi.habitAnalytics(id, { days: 365 });
    return res.data;
  }, [id]);

  const setStatus = async (status) => {
    setBusy(true);
    try {
      await lifeApi.setHabitStatus(id, status);
      setNotice(status === "paused" ? "Habit paused without losing history." : status === "archived" ? "Habit archived." : "Habit resumed.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const logToday = async () => {
    setBusy(true);
    try {
      const today = localDateInput();
      const habit = query.data?.habit;
      await lifeApi.createDailyEntry({
        date: today,
        habitLogs: [{ habitId: id, completed: true, value: habit?.target || 1 }]
      });
      setNotice("Completed today! Your rhythm continues.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to log completion");
    } finally {
      setBusy(false);
    }
  };

  if (query.loading) return <LifeLoading label="Gathering habit analytics..." />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;

  const data = query.data;
  const habit = data?.habit;
  const analytics = data?.analytics || {};
  const heatmapData = data?.heatmap || [];
  const correlation = analytics.moodCorrelation;

  return (
    <div className="life-habit-detail-page">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/life/habits" className="life-back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>
          <FiArrowLeft /> Back to Habits & Routines
        </Link>
      </div>

      <LifePageHeader
        eyebrow={`Habit Intelligence · ${habit?.intent?.toUpperCase() || "BUILD"}`}
        title={habit?.name || "Habit Details"}
        description={habit?.why || "A personal daily rhythm designed for consistency."}
        actions={
          <div className="life-page-actions" style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="life-primary-button" onClick={logToday} disabled={busy || habit?.status !== "active"}>
              <FiCheckCircle /> Log Today
            </button>
            {habit?.status === "active" ? (
              <button type="button" className="life-secondary-button" onClick={() => setStatus("paused")} disabled={busy}>
                <FiPause /> Pause
              </button>
            ) : habit?.status === "paused" ? (
              <button type="button" className="life-secondary-button" onClick={() => setStatus("active")} disabled={busy}>
                <FiPlay /> Resume
              </button>
            ) : null}
            {habit?.status !== "archived" && (
              <button type="button" className="life-secondary-button" onClick={() => setStatus("archived")} disabled={busy}>
                <FiArchive /> Archive
              </button>
            )}
          </div>
        }
      />

      <LifeNotice tone={notice?.includes("Failed") ? "error" : "success"}>{notice}</LifeNotice>

      {/* Primary KPI Metrics Cards */}
      <section className="life-metric-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <LifeMetricSummaryCard
          title="Current Streak"
          value={analytics.currentStreak || 0}
          unit="days"
          icon={<FiTrendingUp />}
          tone={analytics.currentStreak > 7 ? "positive" : "neutral"}
          subtitle={`Best: ${analytics.longestStreak || 0} days`}
        />
        <LifeMetricSummaryCard
          title="30-Day Consistency"
          value={`${analytics.consistency30d || 0}%`}
          unit=""
          icon={<FiCalendar />}
          tone={(analytics.consistency30d || 0) >= 80 ? "positive" : (analytics.consistency30d || 0) >= 50 ? "neutral" : "caution"}
          subtitle={`${analytics.completions30d || 0} / 30 days active`}
        />
        <LifeMetricSummaryCard
          title="Yearly Consistency"
          value={`${analytics.consistencyYear || 0}%`}
          unit=""
          icon={<FiClock />}
          tone="neutral"
          subtitle={`${analytics.totalCompletions || 0} completions recorded`}
        />
        <LifeMetricSummaryCard
          title="Target & Rhythm"
          value={`${habit?.target || 1} ${habit?.unit || "times"}`}
          unit=""
          icon={<FiCheckCircle />}
          tone="neutral"
          subtitle={habit?.schedule?.type?.replaceAll("_", " ") || "daily"}
        />
      </section>

      {/* Heatmap Section */}
      <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#f8fafc" }}>52-Week Rhythm Heatmap</h3>
            <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.875rem" }}>
              Every active check-in across the past year. Darker cells indicate verified completions.
            </p>
          </div>
        </div>
        <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
          <LifeCalendarHeatmap
            data={heatmapData}
            startDate={data?.analytics?.startDate}
            endDate={data?.analytics?.endDate}
          />
        </div>
      </section>

      {/* Correlation & Context Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Wellbeing Correlation */}
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", border: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <FiSmile style={{ color: "#38bdf8", fontSize: "1.25rem" }} />
            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#f8fafc" }}>Mood & Energy Synergy</h3>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1rem" }}>
            How your habit adherence correlates with how you feel:
          </p>
          {correlation ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", background: "#0f172a", borderRadius: "8px" }}>
                <span style={{ color: "#cbd5e1", fontSize: "0.875rem" }}>Avg Mood on Days Completed</span>
                <strong style={{ color: "#34d399", fontSize: "0.875rem" }}>{correlation.completedMoodAvg || "—"} / 5</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", background: "#0f172a", borderRadius: "8px" }}>
                <span style={{ color: "#cbd5e1", fontSize: "0.875rem" }}>Avg Mood on Missed Days</span>
                <strong style={{ color: "#f87171", fontSize: "0.875rem" }}>{correlation.missedMoodAvg || "—"} / 5</strong>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                {correlation.insight || "Keep logging daily check-ins to unlock grounded correlation signals."}
              </p>
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
              Log mood alongside habit completions to reveal personal patterns.
            </p>
          )}
        </section>

        {/* Schedule & Guidelines */}
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", border: "1px solid #334155" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", color: "#f8fafc" }}>Rhythm Architecture</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #334155" }}>
              <span style={{ color: "#94a3b8" }}>Preferred Time</span>
              <span style={{ color: "#f8fafc" }}>{habit?.preferredPeriod || "Anytime"} ({habit?.schedule?.times?.[0] || "flexible"})</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #334155" }}>
              <span style={{ color: "#94a3b8" }}>Measurement Type</span>
              <span style={{ color: "#f8fafc" }}>{habit?.measurementType || "boolean"}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #334155" }}>
              <span style={{ color: "#94a3b8" }}>Reminders</span>
              <span style={{ color: "#f8fafc" }}>{habit?.reminder?.enabled ? "Calm in-app enabled" : "Off"}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
              <span style={{ color: "#94a3b8" }}>Status</span>
              <span style={{ color: habit?.status === "active" ? "#34d399" : "#f59e0b", textTransform: "capitalize" }}>{habit?.status}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
