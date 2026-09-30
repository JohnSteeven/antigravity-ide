import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiBookmark, FiClock, FiEdit3 } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";
import { LifeMetricSummaryCard } from "../components/charts";
import "../lifeExpansion.css";

const prompts = {
  daily: "What felt meaningful today?",
  free: "Write what needs somewhere to land.",
  weekly_review: "What worked, what felt difficult, and what deserves attention next week?",
  monthly_review: "What changed this month, and what do you want to carry forward?",
};

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Form state
  const [form, setForm] = useState({
    type: "daily",
    title: "",
    body: "",
    localDate: localDateInput(),
    pinnedToTimeline: false,
  });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchJournalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        lifeApi.journalSearch({
          q: searchQuery || undefined,
          type: filterType || undefined,
          pinned: onlyPinned ? "true" : undefined,
          limit: 50,
        }),
        lifeApi.journalAnalytics().catch(() => null),
      ]);
      setEntries(listRes?.data?.items || listRes?.items || []);
      setAnalytics(statsRes?.data || statsRes);
    } catch (err) {
      setError(err?.message || "Failed to load journal");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, onlyPinned]);

  useEffect(() => {
    fetchJournalData();
  }, [fetchJournalData]);

  const update = (key, value) => setForm((curr) => ({ ...curr, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.body.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      await lifeApi.createJournal(form);
      setNotice("Reflection saved privately.");
      setForm((curr) => ({ ...curr, title: "", body: "" }));
      await fetchJournalData();
    } catch (err) {
      setNotice(err?.message || "Failed to save journal reflection");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this reflection?")) return;
    setBusy(true);
    try {
      await lifeApi.deleteJournal(id);
      setNotice("Reflection removed from records.");
      await fetchJournalData();
    } catch (err) {
      setNotice(err?.message || "Failed to delete reflection");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Journal Intelligence</h1>
            <p className="life-page-subtitle">A private, unindexed sanctum for daily notes, deep reviews, and search.</p>
          </div>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">â„¹</span>
        <span>
          Zero-Knowledge Privacy: Journal entries are encrypted in transit, never indexed in search engines, and strictly inaccessible to other users or creators.
        </span>
      </div>

      {notice && <div className="life-notice life-notice--neutral" style={{ marginBottom: "1.5rem" }}>{notice}</div>}
      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      <div className="life-kpi-grid">
        <LifeMetricSummaryCard
          title="Total Words"
          value={analytics?.totalWords != null ? analytics.totalWords.toLocaleString() : "0"}
          secondaryValue={`Avg ${(analytics?.avgWordsPerEntry || 0)} words per entry`}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Total Reflections"
          value={analytics?.totalEntries != null ? String(analytics.totalEntries) : "0"}
          secondaryValue="Lifetime journal count"
          status="neutral"
        />
        <LifeMetricSummaryCard
          title="Writing Days"
          value={analytics?.uniqueWritingDays != null ? `${analytics.uniqueWritingDays} days` : "0 days"}
          secondaryValue="Unique dates recorded"
          status="success"
        />
        <LifeMetricSummaryCard
          title="Reading Time"
          value={analytics?.totalWords ? `~${Math.round(analytics.totalWords / 200)} min` : "0 min"}
          secondaryValue="Cumulative reading archive"
          status="neutral"
        />
      </div>

      <div className="life-two-panel">
        <form className="life-card life-journal-editor" onSubmit={save} style={{ marginBottom: 0 }}>
          <div className="life-segmented" aria-label="Reflection type" style={{ marginBottom: "1rem" }}>
            {Object.keys(prompts).map((type) => (
              <button
                type="button"
                className={form.type === type ? "is-active" : ""}
                onClick={() => update("type", type)}
                key={type}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          <p className="life-prompt" style={{ fontSize: "0.95rem", color: "#38bdf8", fontStyle: "italic", marginBottom: "1.25rem" }}>
            "{prompts[form.type]}"
          </p>

          <div className="life-form life-form--two">
            <label>
              Title (optional)
              <input
                className="life-input"
                placeholder="Give this reflection a name"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                className="life-input"
                value={form.localDate}
                onChange={(event) => update("localDate", event.target.value)}
              />
            </label>
            <label className="life-field-span">
              Reflection *
              <textarea
                className="life-textarea"
                style={{ minHeight: "150px" }}
                placeholder="Write freely..."
                value={form.body}
                onChange={(event) => update("body", event.target.value)}
                required
              />
            </label>
            <label className="life-check life-field-span" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={form.pinnedToTimeline}
                onChange={(event) => update("pinnedToTimeline", event.target.checked)}
              />
              <span>Pin this entry to your daily timeline</span>
            </label>
            <button className="life-btn life-btn-primary life-field-span" disabled={busy} style={{ width: "100%", marginTop: "0.5rem" }}>
              {busy ? "Saving..." : "Save Reflection Privately"}
            </button>
          </div>
        </form>

        <section className="life-journal-history">
          <div className="life-card" style={{ marginBottom: 0 }}>
            <div className="life-card-header">
              <h2 className="life-card-title">Past Reflections</h2>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                <FiSearch style={{ position: "absolute", left: "10px", top: "12px", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search reflections..."
                  className="life-input"
                  style={{ paddingLeft: "2rem", width: "100%" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="life-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="daily">Daily</option>
                <option value="free">Freeform</option>
                <option value="weekly_review">Weekly Review</option>
                <option value="monthly_review">Monthly Review</option>
              </select>
              <button
                type="button"
                className={`life-btn ${onlyPinned ? "life-btn-primary" : "life-btn-secondary"}`}
                style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
                onClick={() => setOnlyPinned(!onlyPinned)}
              >
                <FiBookmark /> Pinned
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Searching entries...</div>
            ) : entries.length === 0 ? (
              <LifeEmpty title="No reflections found" message="Try adjusting your search terms or write a new entry." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {entries.map((entry) => (
                  <article
                    key={entry._id}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", textTransform: "capitalize", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                          {entry.type.replace("_", " ")}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                          {entry.localDate}
                        </span>
                        {entry.pinnedToTimeline && (
                          <span style={{ marginLeft: "0.5rem", color: "#f59e0b", fontSize: "0.8rem" }}>â˜… Pinned</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="life-btn life-btn-danger"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                        disabled={busy}
                        onClick={() => remove(entry._id)}
                      >
                        Delete
                      </button>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0.25rem 0 0.5rem 0" }}>
                      {entry.title || "Untitled reflection"}
                    </h3>

                    <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-wrap", margin: "0 0 0.75rem 0" }}>
                      {entry.body}
                    </p>

                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem" }}>
                      <span><FiEdit3 style={{ verticalAlign: "middle" }} /> {entry.wordCount || (entry.body || "").split(/\s+/).filter(Boolean).length} words</span>
                      <span><FiClock style={{ verticalAlign: "middle" }} /> ~{entry.readingTimeMinutes || Math.max(1, Math.ceil(((entry.body || "").split(/\s+/).filter(Boolean).length) / 200))} min read</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
