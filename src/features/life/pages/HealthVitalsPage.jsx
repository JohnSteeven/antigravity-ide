import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeMetricSummaryCard,
  LifeDataSourceBadge,
} from "../components/charts";
import "../lifeExpansion.css";

export default function HealthVitalsPage() {
  const [vitals, setVitals] = useState({ restingHeartRate: [], bloodPressure: [], oxygenSaturation: [], temperature: [], bloodGlucose: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [metricType, setMetricType] = useState("resting_heart_rate");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await lifeApi.vitals({ days: 30 });
      setVitals(res?.vitals || {});
    } catch (err) {
      setError(err?.message || "Failed to load health vitals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      let payload = {
        type: metricType === "resting_heart_rate" ? "vitals_resting_hr" : metricType,
        source: { type: sourceType },
        note: note || undefined,
      };

      if (metricType === "blood_pressure") {
        if (!systolic || !diastolic) return;
        payload.value = Number(systolic);
        payload.unit = "mmHg";
        payload.label = `${systolic}/${diastolic} mmHg`;
      } else {
        if (!value) return;
        payload.value = Number(value);
        if (metricType === "resting_heart_rate") payload.unit = "bpm";
        if (metricType === "oxygen_saturation") payload.unit = "%";
        if (metricType === "temperature") payload.unit = "°C";
        if (metricType === "blood_glucose") payload.unit = "mg/dL";
      }

      await lifeApi.createHealth(payload);
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to log vital entry");
    } finally {
      setSubmitting(false);
    }
  };

  const latestHR = vitals.restingHeartRate?.[0];
  const latestBP = vitals.bloodPressure?.[0];
  const latestSpO2 = vitals.oxygenSaturation?.[0];
  const latestTemp = vitals.temperature?.[0];

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Health Vitals</h1>
            <p className="life-page-subtitle">Track resting heart rate, blood pressure, oxygenation, and temperature.</p>
          </div>
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link active">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Non-clinical wellness notice: All biometric vitals tracked in MyJourney Life are self-reported or imported for personal awareness. They are not intended as diagnostic measurements, clinical assessments, or medical advice.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Resting Heart Rate"
          value={latestHR?.value ? `${latestHR.value} bpm` : "—"}
          secondaryValue={latestHR?.occurredAt ? `Logged: ${new Date(latestHR.occurredAt).toLocaleDateString()}` : undefined}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Blood Pressure"
          value={latestBP?.label || (latestBP?.value ? `${latestBP.value} mmHg` : "—")}
          secondaryValue={latestBP?.occurredAt ? `Logged: ${new Date(latestBP.occurredAt).toLocaleDateString()}` : undefined}
          status="neutral"
        />
        <LifeMetricSummaryCard
          title="Oxygen Saturation (SpO2)"
          value={latestSpO2?.value ? `${latestSpO2.value}%` : "—"}
          secondaryValue={latestSpO2?.occurredAt ? `Logged: ${new Date(latestSpO2.occurredAt).toLocaleDateString()}` : undefined}
          status="success"
        />
        <LifeMetricSummaryCard
          title="Body Temperature"
          value={latestTemp?.value ? `${latestTemp.value} °C` : "—"}
          secondaryValue={latestTemp?.occurredAt ? `Logged: ${new Date(latestTemp.occurredAt).toLocaleDateString()}` : undefined}
          status="neutral"
        />
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Log Vital Sign</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Vital Type *</label>
              <select className="life-select" value={metricType} onChange={(e) => setMetricType(e.target.value)}>
                <option value="resting_heart_rate">Resting Heart Rate (bpm)</option>
                <option value="blood_pressure">Blood Pressure (mmHg)</option>
                <option value="oxygen_saturation">Oxygen Saturation - SpO2 (%)</option>
                <option value="temperature">Body Temperature (°C)</option>
                <option value="blood_glucose">Blood Glucose (mg/dL)</option>
              </select>
            </div>

            {metricType === "blood_pressure" ? (
              <>
                <div className="life-form-group">
                  <label className="life-form-label">Systolic (top number) *</label>
                  <input
                    type="number"
                    placeholder="120"
                    required
                    className="life-input"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                </div>
                <div className="life-form-group">
                  <label className="life-form-label">Diastolic (bottom number) *</label>
                  <input
                    type="number"
                    placeholder="80"
                    required
                    className="life-input"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="life-form-group">
                <label className="life-form-label">Value *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={
                    metricType === "resting_heart_rate" ? "e.g. 62" :
                    metricType === "oxygen_saturation" ? "e.g. 98" :
                    metricType === "temperature" ? "e.g. 36.8" : "e.g. 95"
                  }
                  className="life-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}

            <div className="life-form-group">
              <label className="life-form-label">Data Source</label>
              <select className="life-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">Manual Entry</option>
                <option value="wearable">Wearable Device</option>
                <option value="phone">Phone / Smart Sensor</option>
                <option value="import">Imported File</option>
              </select>
            </div>
          </div>

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Context / Note</label>
            <input
              type="text"
              placeholder="e.g. Measured right after waking"
              className="life-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Record Vital"}
          </button>
        </form>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Resting Heart Rate History</h2>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>Loading records...</div>
        ) : vitals.restingHeartRate?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>No heart rate records found.</div>
        ) : (
          <div className="life-table-container">
            <table className="life-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Value</th>
                  <th>Source</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vitals.restingHeartRate.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.localDate || new Date(entry.occurredAt).toLocaleDateString()}</td>
                    <td><strong>{entry.value} bpm</strong></td>
                    <td><LifeDataSourceBadge source={entry.source?.type || "manual"} /></td>
                    <td style={{ color: "#94a3b8" }}>{entry.note || "—"}</td>
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
