import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeLineChart,
  LifeMetricSummaryCard,
  LifeRangeSelector,
  LifeDataSourceBadge,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

export default function BodyMeasurementsPage() {
  const [range, setRange] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const [sumRes, listRes] = await Promise.all([
        lifeApi.bodySummary({ days }),
        lifeApi.bodyEntries({ limit: 50 }),
      ]);
      setSummary(sumRes);
      setEntries(listRes?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load body measurements");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    try {
      setSubmitting(true);
      setError(null);
      await lifeApi.createBodyEntry({
        weight: Number(weight),
        weightUnit,
        height: height ? Number(height) : undefined,
        heightUnit,
        bodyFatPercentage: bodyFat ? Number(bodyFat) : undefined,
        muscleMassPercentage: muscleMass ? Number(muscleMass) : undefined,
        waistCircumference: waist ? Number(waist) : undefined,
        chestCircumference: chest ? Number(chest) : undefined,
        hipCircumference: hips ? Number(hips) : undefined,
        note: note || undefined,
        source: { type: sourceType },
      });
      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      setWaist("");
      setChest("");
      setHips("");
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to save measurement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this body measurement record?")) return;
    try {
      await lifeApi.deleteBodyEntry(id);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete measurement");
    }
  };

  const chartData = (summary?.series || []).map((point) => ({
    label: point.date.slice(5),
    value: point.weight,
    date: point.date,
  }));

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Body Measurements</h1>
            <p className="life-page-subtitle">Track weight, body composition trends, and biometric changes.</p>
          </div>
          <LifeRangeSelector value={range} onChange={setRange} />
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link active">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Non-clinical wellness tracking: Body measurements and derived BMI are recorded for personal progress tracking and lifestyle habits, not medical diagnosis or clinical treatment.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Current Weight"
          value={summary?.latest?.weight != null ? `${summary.latest.weight} ${summary.latest.weightUnit || "kg"}` : "—"}
          secondaryValue={summary?.change != null ? `${summary.change > 0 ? "+" : ""}${summary.change} ${summary.latest?.weightUnit || "kg"} in ${range}` : undefined}
          trend={summary?.change > 0 ? "up" : summary?.change < 0 ? "down" : "neutral"}
          status={summary?.change != null ? "info" : "neutral"}
        />
        <LifeMetricSummaryCard
          title="Derived BMI"
          value={summary?.latest?.bmi != null ? summary.latest.bmi : "—"}
          secondaryValue={summary?.latest?.height ? `Height: ${summary.latest.height} ${summary.latest.heightUnit}` : "Add height to compute BMI"}
          status="info"
        />
        <LifeMetricSummaryCard
          title="7-Day Moving Avg"
          value={summary?.movingAverages?.sevenDay != null ? `${summary.movingAverages.sevenDay} ${summary.latest?.weightUnit || "kg"}` : "—"}
          status="neutral"
        />
        <LifeMetricSummaryCard
          title="Body Fat %"
          value={summary?.latest?.bodyFatPercentage != null ? `${summary.latest.bodyFatPercentage}%` : "—"}
          secondaryValue={summary?.latest?.muscleMassPercentage != null ? `Muscle: ${summary.latest.muscleMassPercentage}%` : undefined}
          status="neutral"
        />
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <div>
            <h2 className="life-card-title">Weight Trend</h2>
            <p className="life-card-subtitle">Moving trend line over the selected period</p>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading chart data...</div>
        ) : chartData.length > 0 ? (
          <LifeLineChart data={chartData} strokeColor="#38bdf8" height={260} />
        ) : (
          <LifeEmptyChartState message="No weight records found in this date range. Log your first measurement below." />
        )}
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Log New Measurement</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Weight *</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 74.5"
                  className="life-input"
                  style={{ flex: 1 }}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <select className="life-select" value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Height (for BMI)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 178"
                  className="life-input"
                  style={{ flex: 1 }}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <select className="life-select" value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)}>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 18.2"
                className="life-input"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Muscle Mass %</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 42.0"
                className="life-input"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Waist (cm)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 82"
                className="life-input"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Data Source</label>
              <select className="life-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">Manual Entry</option>
                <option value="wearable">Smart Scale / Wearable</option>
                <option value="phone">Phone / Health App</option>
                <option value="import">Imported CSV</option>
              </select>
            </div>
          </div>

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Fasted morning weigh-in"
              className="life-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Save Measurement"}
          </button>
        </form>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Recent Measurement History</h2>
        </div>
        {entries.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem" }}>No entries recorded yet.</div>
        ) : (
          <div className="life-table-container">
            <table className="life-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>BMI</th>
                  <th>Body Fat</th>
                  <th>Waist</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.localDate}</td>
                    <td><strong>{entry.weight} {entry.weightUnit}</strong></td>
                    <td>{entry.bmi != null ? entry.bmi : "—"}</td>
                    <td>{entry.bodyFatPercentage != null ? `${entry.bodyFatPercentage}%` : "—"}</td>
                    <td>{entry.waistCircumference != null ? `${entry.waistCircumference} cm` : "—"}</td>
                    <td><LifeDataSourceBadge source={entry.source?.type || "manual"} /></td>
                    <td>
                      <button
                        onClick={() => handleDelete(entry._id)}
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
