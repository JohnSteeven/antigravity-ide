import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeBarChart,
  LifeMetricSummaryCard,
  LifeRangeSelector,
  LifeDataSourceBadge,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

export default function SleepDetailPage() {
  const [range, setRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");
  const [isNap, setIsNap] = useState(false);
  const [quality, setQuality] = useState(4);
  const [timeAwakeMinutes, setTimeAwakeMinutes] = useState("");
  const [awakeningsCount, setAwakeningsCount] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const [analyticsRes, listRes] = await Promise.all([
        lifeApi.sleepAnalytics({ days }),
        lifeApi.sleepSessions({ limit: 50 }),
      ]);
      setAnalytics(analyticsRes);
      setSessions(listRes?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load sleep data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sleepStart || !sleepEnd) return;
    try {
      setSubmitting(true);
      setError(null);

      const start = new Date(sleepStart);
      const end = new Date(sleepEnd);
      const durationMinutes = Math.round((end - start) / 60000);

      if (durationMinutes <= 0) {
        throw new Error("Wake time must be after bedtime");
      }

      await lifeApi.createSleepSession({
        sleepStart: start.toISOString(),
        sleepEnd: end.toISOString(),
        durationMinutes,
        isNap,
        quality: Number(quality),
        timeAwakeMinutes: timeAwakeMinutes ? Number(timeAwakeMinutes) : 0,
        awakeningsCount: awakeningsCount ? Number(awakeningsCount) : 0,
        source: { type: sourceType },
        note: note || undefined,
      });

      setSleepStart("");
      setSleepEnd("");
      setIsNap(false);
      setTimeAwakeMinutes("");
      setAwakeningsCount("");
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to log sleep session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sleep record?")) return;
    try {
      await lifeApi.deleteSleepSession(id);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete sleep record");
    }
  };

  const chartData = (analytics?.series || []).map((point) => ({
    label: point.date.slice(5),
    value: Number((point.durationMinutes / 60).toFixed(1)),
    date: point.date,
  }));

  const targetHours = analytics?.targetHours || 8;
  const avgHours = analytics?.averageDurationHours != null ? analytics.averageDurationHours : "—";
  const sleepDebtMinutes = analytics?.sleepDebtMinutes || 0;
  const debtHours = (Math.abs(sleepDebtMinutes) / 60).toFixed(1);
  const recoveryScore = analytics?.recoveryScore != null ? analytics.recoveryScore : "—";

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Sleep Architecture</h1>
            <p className="life-page-subtitle">Duration trends, sleep debt rollups, and recovery indicators.</p>
          </div>
          <LifeRangeSelector value={range} onChange={setRange} />
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link active">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Transparent Wellness Metric: Recovery and sleep debt are calculated purely from your target ({targetHours}h) vs recorded duration and consistency. No medical diagnosis or polysomnography is claimed or implied.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Average Sleep"
          value={avgHours !== "—" ? `${avgHours} hrs` : "—"}
          secondaryValue={`Target: ${targetHours}h / night`}
          status={Number(avgHours) >= targetHours - 0.5 ? "success" : "warning"}
        />
        <LifeMetricSummaryCard
          title="Sleep Debt"
          value={sleepDebtMinutes > 0 ? `-${debtHours} hrs` : `+${debtHours} hrs`}
          secondaryValue={sleepDebtMinutes > 0 ? "Cumulative deficit below target" : "Sleep surplus against target"}
          trend={sleepDebtMinutes > 60 ? "down" : "neutral"}
          status={sleepDebtMinutes > 120 ? "danger" : sleepDebtMinutes > 30 ? "warning" : "success"}
        />
        <LifeMetricSummaryCard
          title="Sleep Recovery Score"
          value={recoveryScore !== "—" ? `${recoveryScore}/100` : "—"}
          secondaryValue="Calculated from duration, efficiency & debt"
          status={Number(recoveryScore) >= 80 ? "success" : Number(recoveryScore) >= 60 ? "info" : "warning"}
        />
        <LifeMetricSummaryCard
          title="Recorded Sessions"
          value={analytics?.totalSessions != null ? String(analytics.totalSessions) : "0"}
          secondaryValue={analytics?.napsCount ? `${analytics.napsCount} afternoon naps` : "No naps recorded"}
          status="neutral"
        />
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <div>
            <h2 className="life-card-title">Sleep Duration History (Hours)</h2>
            <p className="life-card-subtitle">Nightly sleep duration compared to {targetHours}h baseline</p>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading sleep trends...</div>
        ) : chartData.length > 0 ? (
          <LifeBarChart data={chartData} color="#818cf8" height={260} />
        ) : (
          <LifeEmptyChartState message="No sleep sessions logged in this timeframe. Log your sleep below." />
        )}
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Log Sleep Session</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Bedtime / Fall Asleep *</label>
              <input
                type="datetime-local"
                required
                className="life-input"
                value={sleepStart}
                onChange={(e) => setSleepStart(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Wake Time *</label>
              <input
                type="datetime-local"
                required
                className="life-input"
                value={sleepEnd}
                onChange={(e) => setSleepEnd(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Subjective Quality (1–5)</label>
              <select className="life-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                <option value="5">5 - Excellent / Restored</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Fair / Average</option>
                <option value="2">2 - Restless / Poor</option>
                <option value="1">1 - Terrible / Exhausted</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Time Awake in Bed (min)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="life-input"
                value={timeAwakeMinutes}
                onChange={(e) => setTimeAwakeMinutes(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Awakenings Count</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="life-input"
                value={awakeningsCount}
                onChange={(e) => setAwakeningsCount(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Data Source</label>
              <select className="life-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">Manual Entry</option>
                <option value="wearable">Wearable Tracker</option>
                <option value="phone">Phone Bedside App</option>
                <option value="import">Imported Data</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id="napCheck"
              checked={isNap}
              onChange={(e) => setIsNap(e.target.checked)}
            />
            <label htmlFor="napCheck" className="life-form-label" style={{ cursor: "pointer", marginBottom: 0 }}>
              This was an afternoon nap
            </label>
          </div>

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Read for 15 mins before sleeping, woke once for water"
              className="life-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Record Sleep Session"}
          </button>
        </form>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Recent Sleep Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem" }}>No sleep records found.</div>
        ) : (
          <div className="life-table-container">
            <table className="life-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Quality</th>
                  <th>Time Awake</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id}>
                    <td>
                      {session.localDate}
                      {session.isNap && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", background: "rgba(56,189,248,0.15)", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>Nap</span>}
                    </td>
                    <td>
                      <strong>{(session.durationMinutes / 60).toFixed(1)} hrs</strong> ({session.durationMinutes} min)
                    </td>
                    <td>{"★".repeat(session.quality || 3)}</td>
                    <td>{session.timeAwakeMinutes ? `${session.timeAwakeMinutes} min` : "0 min"}</td>
                    <td><LifeDataSourceBadge source={session.source?.type || "manual"} /></td>
                    <td>
                      <button
                        onClick={() => handleDelete(session._id)}
                        className="life-btn life-btn-danger"
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
