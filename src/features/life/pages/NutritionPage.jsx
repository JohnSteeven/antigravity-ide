import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeDonutChart,
  LifeMetricSummaryCard,
  LifeProgressRing,
  LifeDataSourceBadge,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

export default function NutritionPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [mealType, setMealType] = useState("lunch");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [carbsGrams, setCarbsGrams] = useState("");
  const [fatGrams, setFatGrams] = useState("");
  const [fiberGrams, setFiberGrams] = useState("");
  const [sodiumMg, setSodiumMg] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, listRes] = await Promise.all([
        lifeApi.nutritionSummary({ date }),
        lifeApi.nutritionEntries({ date, limit: 50 }),
      ]);
      setSummary(sumRes);
      setEntries(listRes?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !calories) return;
    try {
      setSubmitting(true);
      setError(null);

      await lifeApi.createNutritionEntry({
        mealType,
        name,
        calories: Number(calories),
        proteinGrams: proteinGrams ? Number(proteinGrams) : 0,
        carbsGrams: carbsGrams ? Number(carbsGrams) : 0,
        fatGrams: fatGrams ? Number(fatGrams) : 0,
        fiberGrams: fiberGrams ? Number(fiberGrams) : 0,
        sodiumMg: sodiumMg ? Number(sodiumMg) : 0,
        localDate: date,
        source: { type: sourceType },
        note: note || undefined,
      });

      setName("");
      setCalories("");
      setProteinGrams("");
      setCarbsGrams("");
      setFatGrams("");
      setFiberGrams("");
      setSodiumMg("");
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to save meal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this food entry?")) return;
    try {
      await lifeApi.deleteNutritionEntry(id);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete food entry");
    }
  };

  const targetCalories = summary?.targetCalories || 2200;
  const currentCalories = summary?.totalCalories || 0;
  const calPercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const macroDonutData = [
    { label: "Protein", value: (summary?.macros?.proteinGrams || 0) * 4, color: "#38bdf8" },
    { label: "Carbs", value: (summary?.macros?.carbsGrams || 0) * 4, color: "#f59e0b" },
    { label: "Fat", value: (summary?.macros?.fatGrams || 0) * 9, color: "#ec4899" },
  ].filter((m) => m.value > 0);

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Nutrition & Fuel</h1>
            <p className="life-page-subtitle">Track caloric intake, macronutrient splits, and meal timing.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label className="life-form-label" style={{ marginBottom: 0 }}>Date:</label>
            <input
              type="date"
              className="life-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link active">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Dietary Awareness Guide: Nutritional information is self-logged to support balanced dietary habits. It does not replace medical nutrition therapy, dietitian guidance, or clinical eating disorder treatment.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <div className="life-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", marginBottom: 0 }}>
          <LifeProgressRing progress={calPercent} size={90} strokeWidth={8} color="#38bdf8" />
          <div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Daily Calories</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc" }}>{currentCalories.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#64748b" }}>/ {targetCalories.toLocaleString()} kcal</span></div>
            <div style={{ fontSize: "0.8rem", color: currentCalories > targetCalories ? "#f87171" : "#34d399", marginTop: "0.25rem" }}>
              {targetCalories - currentCalories >= 0 ? `${targetCalories - currentCalories} kcal remaining` : `${currentCalories - targetCalories} kcal over target`}
            </div>
          </div>
        </div>

        <LifeMetricSummaryCard
          title="Protein"
          value={`${summary?.macros?.proteinGrams || 0}g`}
          secondaryValue={`${((summary?.macros?.proteinGrams || 0) * 4).toLocaleString()} kcal (${summary?.totalCalories ? Math.round(((summary?.macros?.proteinGrams || 0) * 400) / summary.totalCalories) : 0}%)`}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Carbohydrates"
          value={`${summary?.macros?.carbsGrams || 0}g`}
          secondaryValue={`Fiber: ${summary?.macros?.fiberGrams || 0}g`}
          status="warning"
        />
        <LifeMetricSummaryCard
          title="Fats"
          value={`${summary?.macros?.fatGrams || 0}g`}
          secondaryValue={`${((summary?.macros?.fatGrams || 0) * 9).toLocaleString()} kcal`}
          status="danger"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="life-card" style={{ marginBottom: 0 }}>
          <div className="life-card-header">
            <h2 className="life-card-title">Macronutrient Calorie Ratio</h2>
          </div>
          {macroDonutData.length > 0 ? (
            <LifeDonutChart data={macroDonutData} height={220} />
          ) : (
            <LifeEmptyChartState message="No meals logged for this date." />
          )}
        </div>

        <div className="life-card" style={{ marginBottom: 0 }}>
          <div className="life-card-header">
            <h2 className="life-card-title">Meals by Schedule</h2>
          </div>
          {summary?.meals?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {summary.meals.map((m, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #334155" }}>
                  <div>
                    <span style={{ textTransform: "capitalize", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", marginRight: "0.5rem" }}>{m.mealType}</span>
                    <strong style={{ color: "#f8fafc" }}>{m.name}</strong>
                  </div>
                  <div style={{ textAlign: "right", color: "#f8fafc", fontWeight: 600 }}>
                    {m.calories} kcal
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LifeEmptyChartState message="Log your breakfast, lunch, or dinner below." />
          )}
        </div>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Log Meal or Snack</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Meal Type *</label>
              <select className="life-select" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="pre_workout">Pre-Workout</option>
                <option value="post_workout">Post-Workout</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Meal / Food Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Grilled Chicken Salad"
                className="life-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Calories (kcal) *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="550"
                className="life-input"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Protein (g)</label>
              <input
                type="number"
                min="0"
                placeholder="45"
                className="life-input"
                value={proteinGrams}
                onChange={(e) => setProteinGrams(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Carbs (g)</label>
              <input
                type="number"
                min="0"
                placeholder="30"
                className="life-input"
                value={carbsGrams}
                onChange={(e) => setCarbsGrams(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Fats (g)</label>
              <input
                type="number"
                min="0"
                placeholder="15"
                className="life-input"
                value={fatGrams}
                onChange={(e) => setFatGrams(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Dietary Fiber (g)</label>
              <input
                type="number"
                min="0"
                placeholder="6"
                className="life-input"
                value={fiberGrams}
                onChange={(e) => setFiberGrams(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Sodium (mg)</label>
              <input
                type="number"
                min="0"
                placeholder="650"
                className="life-input"
                value={sodiumMg}
                onChange={(e) => setSodiumMg(e.target.value)}
              />
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Source</label>
              <select className="life-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">Manual Entry</option>
                <option value="import">Imported Log</option>
                <option value="phone">Phone Food App</option>
              </select>
            </div>
          </div>

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Meal Notes</label>
            <input
              type="text"
              placeholder="e.g. Added olive oil dressing"
              className="life-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Log Meal"}
          </button>
        </form>
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Logged Meals for {date}</h2>
        </div>
        {entries.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem" }}>No meal entries for this day.</div>
        ) : (
          <div className="life-table-container">
            <table className="life-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Food Item</th>
                  <th>Calories</th>
                  <th>Macros (P / C / F)</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td><span style={{ textTransform: "capitalize", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}>{entry.mealType}</span></td>
                    <td><strong>{entry.name}</strong></td>
                    <td>{entry.calories} kcal</td>
                    <td>{entry.proteinGrams || 0}g P · {entry.carbsGrams || 0}g C · {entry.fatGrams || 0}g F</td>
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
