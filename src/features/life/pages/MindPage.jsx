import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import lifeApi from "../api/lifeApi";
import {
  LifeLineChart,
  LifeCalendarHeatmap,
  LifeMetricSummaryCard,
  LifeRangeSelector,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

const EMOTIONS_LIST = [
  "Grateful", "Calm", "Peaceful", "Focused", "Joyful",
  "Productive", "Excited", "Anxious", "Fatigued", "Frustrated",
  "Overwhelmed", "Restless", "Hopeful", "Stressed", "Reflective",
];

const CONTEXT_LIST = [
  "Work", "Deep Work", "Family", "Friends", "Workout",
  "Outdoors", "Sleep", "Commute", "Creative", "Meditation",
];

export default function MindPage() {
  const [range, setRange] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(2);
  const [focus, setFocus] = useState(4);
  const [motivation, setMotivation] = useState(4);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedContext, setSelectedContext] = useState([]);
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const [sumRes, listRes] = await Promise.all([
        lifeApi.mindSummary({ days }),
        lifeApi.mindEntries({ limit: 50 }),
      ]);
      setSummary(sumRes);
      setEntries(listRes?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load mind reflections");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleEmotion = (em) => {
    if (selectedEmotions.includes(em)) {
      setSelectedEmotions(selectedEmotions.filter((x) => x !== em));
    } else {
      setSelectedEmotions([...selectedEmotions, em]);
    }
  };

  const toggleContext = (ctx) => {
    if (selectedContext.includes(ctx)) {
      setSelectedContext(selectedContext.filter((x) => x !== ctx));
    } else {
      setSelectedContext([...selectedContext, ctx]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await lifeApi.createMindEntry({
        mood: Number(mood),
        energy: Number(energy),
        stress: Number(stress),
        focus: Number(focus),
        motivation: Number(motivation),
        emotions: selectedEmotions,
        contextTags: selectedContext,
        note: note || undefined,
        source: { type: "manual" },
      });

      setSelectedEmotions([]);
      setSelectedContext([]);
      setNote("");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to log reflection");
    } finally {
      setSubmitting(false);
    }
  };

  const trendData = (summary?.series || []).map((point) => ({
    label: point.date.slice(5),
    value: point.mood,
    date: point.date,
  }));

  const heatmapData = (summary?.heatmap || []).map((h) => ({
    date: h.date,
    count: h.count,
  }));

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Mind & Mood Wellbeing</h1>
            <p className="life-page-subtitle">Track emotional patterns, energy levels, focus, and stress factors.</p>
          </div>
          <LifeRangeSelector value={range} onChange={setRange} />
        </div>
        <div className="life-subnav">
          <Link to="/life/health" className="life-subnav-link">← Overview</Link>
          <Link to="/life/health/body" className="life-subnav-link">Body</Link>
          <Link to="/life/health/vitals" className="life-subnav-link">Vitals</Link>
          <Link to="/life/health/sleep" className="life-subnav-link">Sleep</Link>
          <Link to="/life/fitness" className="life-subnav-link">Fitness</Link>
          <Link to="/life/nutrition" className="life-subnav-link">Nutrition</Link>
          <Link to="/life/mind" className="life-subnav-link active">Mind</Link>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">ℹ</span>
        <span>
          Emotional Wellness Self-Reflection: Emotional ratings and context tags are qualitative self-reported records for mindfulness and self-awareness. They are not psychological assessments or psychiatric treatment tools.
        </span>
      </div>

      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Average Mood"
          value={summary?.averages?.mood ? `${summary.averages.mood} / 5` : "—"}
          secondaryValue={`Selected range (${range})`}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Average Energy"
          value={summary?.averages?.energy ? `${summary.averages.energy} / 5` : "—"}
          status="success"
        />
        <LifeMetricSummaryCard
          title="Average Stress"
          value={summary?.averages?.stress ? `${summary.averages.stress} / 5` : "—"}
          status={Number(summary?.averages?.stress) >= 4 ? "danger" : Number(summary?.averages?.stress) >= 3 ? "warning" : "neutral"}
        />
        <LifeMetricSummaryCard
          title="Average Focus"
          value={summary?.averages?.focus ? `${summary.averages.focus} / 5` : "—"}
          secondaryValue={summary?.averages?.motivation ? `Motivation: ${summary.averages.motivation} / 5` : undefined}
          status="info"
        />
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <div>
            <h2 className="life-card-title">Mood Trend</h2>
            <p className="life-card-subtitle">Daily average subjective mood score over time</p>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading trend data...</div>
        ) : trendData.length > 0 ? (
          <LifeLineChart data={trendData} strokeColor="#38bdf8" height={220} />
        ) : (
          <LifeEmptyChartState message="No mood reflections logged yet." />
        )}
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <div>
            <h2 className="life-card-title">Mindfulness Consistency Heatmap</h2>
            <p className="life-card-subtitle">Annual check-in frequency</p>
          </div>
        </div>
        <LifeCalendarHeatmap data={heatmapData} />
      </div>

      <div className="life-card">
        <div className="life-card-header">
          <h2 className="life-card-title">Quick Mind Check-in</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="life-form-grid">
            <div className="life-form-group">
              <label className="life-form-label">Mood (1–5) *</label>
              <select className="life-select" value={mood} onChange={(e) => setMood(e.target.value)}>
                <option value="5">5 - Great / Optimistic</option>
                <option value="4">4 - Good / Content</option>
                <option value="3">3 - Neutral / Okay</option>
                <option value="2">2 - Low / Meh</option>
                <option value="1">1 - Difficult / Struggling</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Energy (1–5) *</label>
              <select className="life-select" value={energy} onChange={(e) => setEnergy(e.target.value)}>
                <option value="5">5 - Vibrant / High Stamina</option>
                <option value="4">4 - Alert / Steady</option>
                <option value="3">3 - Moderate</option>
                <option value="2">2 - Sluggish / Tired</option>
                <option value="1">1 - Drained / Exhausted</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Stress Level (1–5) *</label>
              <select className="life-select" value={stress} onChange={(e) => setStress(e.target.value)}>
                <option value="1">1 - Calm / Serene</option>
                <option value="2">2 - Low / Manageable</option>
                <option value="3">3 - Moderate Pressure</option>
                <option value="4">4 - Elevated Tension</option>
                <option value="5">5 - High Anxiety / Overwhelmed</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Focus & Clarity (1–5)</label>
              <select className="life-select" value={focus} onChange={(e) => setFocus(e.target.value)}>
                <option value="5">5 - Deep Focus / Flow</option>
                <option value="4">4 - Clear / Organized</option>
                <option value="3">3 - Balanced</option>
                <option value="2">2 - Distracted</option>
                <option value="1">1 - Brain Fog</option>
              </select>
            </div>

            <div className="life-form-group">
              <label className="life-form-label">Motivation (1–5)</label>
              <select className="life-select" value={motivation} onChange={(e) => setMotivation(e.target.value)}>
                <option value="5">5 - Driven / Purposeful</option>
                <option value="4">4 - Willing / Active</option>
                <option value="3">3 - Steady</option>
                <option value="2">2 - Reluctant</option>
                <option value="1">1 - Apathetic</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">What are you feeling right now?</label>
            <div className="life-tag-group">
              {EMOTIONS_LIST.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => toggleEmotion(em)}
                  className={`life-tag-chip ${selectedEmotions.includes(em) ? "active" : ""}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Context / Influences</label>
            <div className="life-tag-group">
              {CONTEXT_LIST.map((ctx) => (
                <button
                  type="button"
                  key={ctx}
                  onClick={() => toggleContext(ctx)}
                  className={`life-tag-chip ${selectedContext.includes(ctx) ? "active" : ""}`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </div>

          <div className="life-form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="life-form-label">Reflection Note</label>
            <textarea
              placeholder="What contributed to this state?"
              className="life-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="life-btn life-btn-primary">
            {submitting ? "Saving..." : "Record Reflection"}
          </button>
        </form>
      </div>
    </div>
  );
}
