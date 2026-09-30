import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeDonutChart,
  LifeMetricSummaryCard,
  LifeRangeSelector,
  LifeDataSourceBadge,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

export default function FitnessPage() {
  const [range, setRange] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [workoutType, setWorkoutType] = useState("strength");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState(7);
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [note, setNote] = useState("");

  // Exercises builder for strength workouts
  const [exercises, setExercises] = useState([
    { name: "Barbell Squat", sets: [{ reps: 8, weight: 80, completed: true }] },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const [sumRes, listRes, volRes] = await Promise.all([
        lifeApi.fitnessSummary({ days }),
        lifeApi.workoutSessions({ limit: 50 }),
        lifeApi.strengthVolume({ days }),
      ]);
      setSummary(sumRes);
      setWorkouts(listRes?.items || []);
      setVolumeData(volRes);
    } catch (err) {
      setError(err?.message || "Failed to load fitness data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: [{ reps: 10, weight: 20, completed: true }] }]);
  };

  const handleAddSet = (exerciseIndex) => {
    const next = [...exercises];
    const prevSet = next[exerciseIndex].sets[next[exerciseIndex].sets.length - 1];
    next[exerciseIndex].sets.push({
      reps: prevSet ? prevSet.reps : 10,
      weight: prevSet ? prevSet.weight : 20,
      completed: true,
    });
    setExercises(next);
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const next = [...exercises];
    next[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(next);
  };

  const handleSetChange = (exerciseIndex, setIndex, field, val) => {
    const next = [...exercises];
    next[exerciseIndex].sets[setIndex][field] = Number(val);
    setExercises(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !durationMinutes) return;
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title,
        workoutType,
        durationMinutes: Number(durationMinutes),
        perceivedExertion: Number(perceivedExertion),
        caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
        exercises: workoutType === "strength" ? exercises.filter((ex) => ex.name.trim() !== "") : undefined,
        source: { type: sourceType },
        note: note || undefined,
      };

      await lifeApi.createWorkoutSession(payload);
      setTitle("");
      setDurationMinutes("");
      setCaloriesBurned("");
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to save workout session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout session?")) return;
    try {
      await lifeApi.deleteWorkoutSession(id);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete workout session");
    }
  };

  const donutData = Object.entries(summary?.byType || {}).map(([type, count]) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Fitness & Strength Hub</h1>
            <p className="life-page-subtitle">Track strength volume tonnage, workout splits, and personal records.</p>
          </div>
          <LifeRangeSelector value={range} onChange={setRange} />
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link active">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Athletic Training Tracker: All metrics, tonnage computations, and volume records represent logged training stimulus for progressive overload, not professional athletic coaching or clinical prescription.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Total Workouts"
          value={summary?.totalWorkouts != null ? String(summary.totalWorkouts) : "0"}
          secondaryValue={`Selected timeframe (${range})`}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Total Active Minutes"
          value={summary?.totalDurationMinutes != null ? `${summary.totalDurationMinutes} min` : "0 min"}
          secondaryValue={`Avg ${(summary?.totalDurationMinutes && summary?.totalWorkouts ? Math.round(summary.totalDurationMinutes / summary.totalWorkouts) : 0)} min/session`}
          status="success"
        />
        <LifeMetricSummaryCard
          title="Strength Volume Tonnage"
          value={volumeData?.totalVolumeKg ? `${Math.round(volumeData.totalVolumeKg).toLocaleString()} kg` : "—"}
          secondaryValue="Total sets × reps × weight lifted"
          status="info"
        />
        <LifeMetricSummaryCard
          title="Average Intensity"
          value={summary?.averagePerceivedExertion ? `RPE ${summary.averagePerceivedExertion}/10` : "—"}
          secondaryValue="Rate of perceived exertion"
          status="neutral"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="life-card" style={{ marginBottom: 0 }}>
          <div className="life-card-header">
            <h2 className="life-card-title">Workout Types Breakdown</h2>
          </div>
          {donutData.length > 0 ? (
            <LifeDonutChart data={donutData} height={220} />
          ) : (
            <LifeEmptyChartState message="No workout sessions logged in this timeframe." />
          )}
        </div>

        <div className="life-card" style={{ marginBottom: 0 }}>
          <div className="life-card-header">
            <h2 className="life-card-title">Top Exercises & Personal Records</h2>
          </div>
          {volumeData?.exercises?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {volumeData.exercises.slice(0, 5).map((ex) => (
                <div key={ex.name} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #334155" }}>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>{ex.name}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{ex.totalSets} sets · {ex.totalReps} total reps</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#38bdf8", fontWeight: 700 }}>PR: {ex.prWeight} kg</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Volume: {Math.round(ex.totalVolume).toLocaleString()} kg</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LifeEmptyChartState message="Log strength sessions with exercises to see PRs and volume." />
          )}
        </div>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Log Workout Session</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Workout Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Upper Body Hypertrophy"
                className="life-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Type *</label>
              <select className="life-select" value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
                <option value="strength">Strength / Hypertrophy</option>
                <option value="cardio">Cardio / Endurance</option>
                <option value="mobility">Mobility / Stretching</option>
                <option value="sport">Sport / Recreational</option>
                <option value="custom">Other / Custom</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 50"
                className="life-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Perceived Exertion (RPE 1-10)</label>
              <select className="life-select" value={perceivedExertion} onChange={(e) => setPerceivedExertion(e.target.value)}>
                <option value="10">10 - Maximum effort / failure</option>
                <option value="9">9 - Very heavy / 1 rep in reserve</option>
                <option value="8">8 - Heavy / 2 reps in reserve</option>
                <option value="7">7 - Moderate vigorous / 3 RIR</option>
                <option value="6">6 - Moderate steady</option>
                <option value="5">5 - Light / Warmup</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Estimated Calories Burned</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 320"
                className="life-input"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Source</label>
              <select className="life-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">Manual Entry</option>
                <option value="wearable">Fitness Watch / Sensor</option>
                <option value="phone">Phone Gym App</option>
                <option value="import">Imported Log</option>
              </select>
            </div>
          </div>

          {workoutType === "strength" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1rem", color: "#f8fafc", margin: 0 }}>Exercise Sets & Reps</h3>
                <button type="button" onClick={handleAddExercise} className="life-btn life-btn-secondary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
                  + Add Exercise
                </button>
              </div>

              {exercises.map((exercise, exIndex) => (
                <div key={exIndex} className="exercise-builder">
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Bench Press)"
                      className="life-input"
                      style={{ flex: 1 }}
                      value={exercise.name}
                      onChange={(e) => {
                        const next = [...exercises];
                        next[exIndex].name = e.target.value;
                        setExercises(next);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIndex)}
                      className="life-btn life-btn-secondary"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      + Set
                    </button>
                  </div>

                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      <span className="set-index">Set {setIndex + 1}</span>
                      <input
                        type="number"
                        placeholder="Reps"
                        className="life-input"
                        style={{ width: "90px" }}
                        value={set.reps}
                        onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                      />
                      <span style={{ color: "#94a3b8" }}>reps @</span>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        className="life-input"
                        style={{ width: "100px" }}
                        value={set.weight}
                        onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                      />
                      <span style={{ color: "#94a3b8" }}>kg</span>
                      {exercise.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIndex, setIndex)}
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", marginLeft: "auto" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Session Notes</label>
            <input
              type="text"
              placeholder="e.g. High energy, new 5RM on squats"
              className="life-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Save Workout Session"}
          </button>
        </form>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Recent Workouts</h2>
        </div>
        {workouts.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem" }}>No workouts recorded yet.</div>
        ) : (
          <div className="life-table-container">
            <table className="life-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Workout</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Intensity</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((w) => (
                  <tr key={w._id}>
                    <td>{w.localDate}</td>
                    <td><strong>{w.title}</strong></td>
                    <td><span style={{ textTransform: "capitalize", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{w.workoutType}</span></td>
                    <td>{w.durationMinutes} min</td>
                    <td>RPE {w.perceivedExertion || "—"}/10</td>
                    <td><LifeDataSourceBadge source={w.source?.type || "manual"} /></td>
                    <td>
                      <button
                        onClick={() => handleDelete(w._id)}
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
