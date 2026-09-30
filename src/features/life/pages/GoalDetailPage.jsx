import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { FiArrowLeft, FiTarget, FiCalendar, FiTrendingUp, FiCheckSquare, FiSquare, FiPlus, FiArchive, FiClock } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { LifePageHeader, LifeLoading, LifeError, LifeNotice, LifeDialog } from "../components/LifeUI";
import { LifeMetricSummaryCard, LifeProgressRing } from "../components/charts";

export default function GoalDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [newMilestoneOpen, setNewMilestoneOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [manualProgress, setManualProgress] = useState("");

  const query = useLifeQuery(async () => {
    const res = await lifeApi.goalAnalytics(id);
    return res.data;
  }, [id]);

  const toggleMilestone = async (milestoneId, currentStatus) => {
    setBusy(true);
    try {
      await lifeApi.toggleGoalMilestone(id, milestoneId, !currentStatus);
      setNotice("Milestone updated.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to toggle milestone");
    } finally {
      setBusy(false);
    }
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setBusy(true);
    try {
      await lifeApi.addGoalMilestone(id, { title: milestoneTitle.trim() });
      setMilestoneTitle("");
      setNewMilestoneOpen(false);
      setNotice("New milestone added.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to add milestone");
    } finally {
      setBusy(false);
    }
  };

  const updateProgress = async (e) => {
    e.preventDefault();
    const val = Number(manualProgress);
    if (isNaN(val) || val < 0 || val > 100) return;
    setBusy(true);
    try {
      await lifeApi.updateGoal(id, { manualProgress: val, progressStrategy: "manual" });
      setNotice("Progress percentage updated.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to update progress");
    } finally {
      setBusy(false);
    }
  };

  const archiveGoal = async () => {
    setBusy(true);
    try {
      await lifeApi.archiveGoal(id);
      setNotice("Goal archived.");
      await query.refresh({ quiet: true });
    } catch (err) {
      setNotice(err.message || "Failed to archive goal");
    } finally {
      setBusy(false);
    }
  };

  if (query.loading) return <LifeLoading label="Gathering goal intelligence..." />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;

  const data = query.data;
  const goal = data?.goal;
  const analytics = data?.analytics || {};
  const milestones = goal?.milestones || [];
  const supportingHabits = data?.supportingHabits || [];

  return (
    <div className="life-goal-detail-page">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/life/goals" className="life-back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>
          <FiArrowLeft /> Back to Goals
        </Link>
      </div>

      <LifePageHeader
        eyebrow={`Direction & Milestones · ${goal?.status?.toUpperCase() || "ACTIVE"}`}
        title={goal?.title || "Goal Details"}
        description={goal?.why || "A long-term personal trajectory."}
        actions={
          <div className="life-page-actions" style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="life-secondary-button" onClick={() => setNewMilestoneOpen(true)} disabled={busy}>
              <FiPlus /> Add Milestone
            </button>
            {goal?.status !== "archived" && (
              <button type="button" className="life-secondary-button" onClick={archiveGoal} disabled={busy}>
                <FiArchive /> Archive
              </button>
            )}
          </div>
        }
      />

      <LifeNotice tone={notice?.includes("Failed") ? "error" : "success"}>{notice}</LifeNotice>

      {/* KPI Cards */}
      <section className="life-metric-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", border: "1px solid #334155" }}>
          <LifeProgressRing progress={goal?.progress || 0} size={70} strokeWidth={7} tone="accent" label={`${goal?.progress || 0}%`} />
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Progress</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>{goal?.progress || 0}%</div>
            <small style={{ color: "#64748b" }}>{goal?.progressStrategy?.replaceAll("_", " ")}</small>
          </div>
        </div>

        <LifeMetricSummaryCard
          title="Progress Velocity"
          value={analytics.velocityRate ? `+${analytics.velocityRate}%` : "—"}
          unit="/ week"
          icon={<FiTrendingUp />}
          tone={analytics.velocityRate > 0 ? "positive" : "neutral"}
          subtitle="Recent pace of movement"
        />

        <LifeMetricSummaryCard
          title="Projected Finish"
          value={analytics.estimatedCompletionDate || "—"}
          unit=""
          icon={<FiClock />}
          tone={analytics.estimatedCompletionDate ? "positive" : "neutral"}
          subtitle={goal?.targetDate ? `Target: ${goal.targetDate}` : "No hard deadline set"}
        />

        <LifeMetricSummaryCard
          title="Milestones Cleared"
          value={`${analytics.completedMilestonesCount || 0} / ${milestones.length}`}
          unit=""
          icon={<FiCheckSquare />}
          tone="neutral"
          subtitle={`${milestones.length - (analytics.completedMilestonesCount || 0)} milestones remaining`}
        />
      </section>

      {/* Milestones & Habits Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Interactive Milestones Checklist */}
        <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#f8fafc" }}>Milestones Checklist</h3>
            <button type="button" onClick={() => setNewMilestoneOpen(true)} style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <FiPlus /> Add
            </button>
          </div>

          {milestones.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No milestones defined yet. Break this goal into smaller stepping stones.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {milestones.map((m) => {
                const isComplete = Boolean(m.completedAt);
                return (
                  <li
                    key={m._id || m.title}
                    onClick={() => toggleMilestone(m._id, isComplete)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: isComplete ? "rgba(52, 211, 153, 0.08)" : "#0f172a",
                      border: `1px solid ${isComplete ? "rgba(52, 211, 153, 0.3)" : "#334155"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isComplete ? (
                      <FiCheckSquare style={{ color: "#34d399", fontSize: "1.25rem", flexShrink: 0 }} />
                    ) : (
                      <FiSquare style={{ color: "#64748b", fontSize: "1.25rem", flexShrink: 0 }} />
                    )}
                    <span style={{ color: isComplete ? "#94a3b8" : "#f8fafc", textDecoration: isComplete ? "line-through" : "none", fontSize: "0.875rem" }}>
                      {m.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Supporting Habits & Manual Progress Adjustment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Supporting Habits */}
          <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", border: "1px solid #334155" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", color: "#f8fafc" }}>Linked Habits</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Daily practices explicitly connected to this goal:
            </p>
            {supportingHabits.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No habits linked yet. Link a habit in the Habits editor to build daily momentum.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {supportingHabits.map((h) => (
                  <li key={h._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div>
                      <strong style={{ color: "#f8fafc", fontSize: "0.875rem" }}>{h.name}</strong>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{h.intent} · {h.target} {h.unit}</div>
                    </div>
                    <Link to={`/life/habits/${h._id}`} style={{ color: "#38bdf8", fontSize: "0.75rem", textDecoration: "none" }}>
                      View Rhythm →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Quick Manual Progress Slider */}
          <section className="life-card" style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", border: "1px solid #334155" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", color: "#f8fafc" }}>Manual Assessment</h3>
            <form onSubmit={updateProgress} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                max="100"
                placeholder={String(goal?.progress || 0)}
                value={manualProgress}
                onChange={(e) => setManualProgress(e.target.value)}
                style={{ width: "90px", padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc" }}
              />
              <button type="submit" className="life-secondary-button" disabled={busy || manualProgress === ""}>
                Set %
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Add Milestone Dialog */}
      <LifeDialog open={newMilestoneOpen} title="Add Milestone" onClose={() => setNewMilestoneOpen(false)}>
        <form onSubmit={addMilestone} className="life-form">
          <label>
            Milestone Description
            <input
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g. Complete module 3 draft"
              required
            />
          </label>
          <div className="life-dialog-actions">
            <button type="button" className="life-secondary-button" onClick={() => setNewMilestoneOpen(false)}>Cancel</button>
            <button className="life-primary-button" disabled={busy}>Add Milestone</button>
          </div>
        </form>
      </LifeDialog>
    </div>
  );
}
