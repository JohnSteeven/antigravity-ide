import React, { useMemo, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiClock, FiDroplet, FiMoon, FiPlus, FiRefreshCw, FiSkipForward } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { addDateDays, formatLifeDate, formatMinutes, formatMoney, localDateInput, mutationId } from "../utils/lifeFormat";
import { LifeDialog, LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const periods = [
  ["all_day", "Anytime"], ["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"],
];

const replaceTimelineStatus = (today, itemId, status) => ({
  ...today,
  timeline: {
    ...today.timeline,
    groups: Object.fromEntries(Object.entries(today.timeline.groups).map(([period, items]) => [period, items.map((item) => item.id === itemId ? { ...item, status } : item)])),
  },
});

export default function TodayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(localDateInput());
  const query = useLifeQuery(() => lifeApi.today(date), [date]);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [routineItem, setRoutineItem] = useState(null);
  const [routineSteps, setRoutineSteps] = useState([]);
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const totalSpending = useMemo(() => Object.entries(query.data?.summary?.spending || {})[0] || null, [query.data]);

  const act = async (item, status, details = {}) => {
    if (busyId) return;
    const previous = query.data;
    setBusyId(item.id);
    setNotice("");
    query.setData((current) => replaceTimelineStatus(current, item.id, status));
    try {
      const payload = { status, scheduledDate: date, scheduledTime: item.scheduledTime || undefined, clientMutationId: mutationId("life", item.type, item.id, date, status), ...details };
      if (status === "snoozed") payload.snoozedUntil = new Date(Date.now() + 30 * 60000).toISOString();
      await lifeApi.logEvent(item.type, item.itemId || item.id, payload);
      setNotice(status === "skipped" ? "Skipped intentionally. This remains different from missed." : status === "snoozed" ? "Moved gently by 30 minutes." : "Recorded.");
      await query.refresh({ quiet: true });
    } catch (error) {
      query.setData(previous);
      setNotice(error.message || "Couldn't save this completion. Try again.");
    } finally {
      setBusyId("");
    }
  };

  const openRoutine = (item) => {
    setRoutineItem(item);
    setRoutineSteps((item.steps || []).map((step) => ({ ...step })));
  };

  const saveRoutine = async (event) => {
    event.preventDefault();
    const required = routineSteps.filter((step) => !step.optional);
    const completed = required.length > 0 && required.every((step) => step.status === "completed");
    await act(routineItem, completed ? "completed" : "partial", { routineSteps: routineSteps.map((step) => ({ stepId: step.id, title: step.title, status: step.status })) });
    setRoutineItem(null);
  };

  const addWater = async (value) => {
    setBusyId("water");
    try {
      await lifeApi.createHealth({ type: "water", value, unit: "ml", localDate: date, dedupeKey: mutationId("water", date, value) });
      setNotice(`${value} ml added.`);
      await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setBusyId("task");
    try {
      await lifeApi.createTask({ title: taskTitle, localDate: date, period: "all_day" });
      setTaskTitle(""); setTaskOpen(false); setNotice("Added to this day.");
      await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  const saveReflection = async (event) => {
    event.preventDefault();
    if (!reflection.trim()) return;
    setBusyId("reflection");
    try {
      await lifeApi.createJournal({ type: "daily", localDate: date, title: "What mattered today", body: reflection });
      setReflection(""); setNotice("Reflection saved privately.");
      await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  if (query.loading) return <LifeLoading label="Gathering what matters today…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const today = query.data;
  const summary = today.summary;

  return (
    <div className="life-today">
      <LifePageHeader
        eyebrow={today.isToday ? `Good ${today.localNow.hour < 12 ? "morning" : today.localNow.hour < 18 ? "afternoon" : "evening"}, ${firstName}` : "A day in your Life"}
        title={formatLifeDate(date)}
        description={today.vacationMode ? "Vacation mode is protecting this day from expected habits." : "A calm view of what you planned and what actually happened."}
        actions={<div className="life-date-controls"><button type="button" onClick={() => setDate(addDateDays(date, -1))} aria-label="Previous day"><FiArrowLeft /></button><button type="button" onClick={() => setDate(localDateInput())}>Today</button><button type="button" onClick={() => setDate(addDateDays(date, 1))} aria-label="Next day"><FiArrowRight /></button></div>}
      />
      <LifeNotice tone={notice?.includes("Couldn't") ? "error" : "success"}>{notice}</LifeNotice>

      <section className="life-daily-line" aria-label="Daily summary">
        <div><span>Plan</span><strong>{summary.completed} of {summary.planned}</strong><small>{summary.partial} partial · {summary.skipped} skipped</small></div>
        {today.visibleModules.includes("water") && <div><span><FiDroplet /> Water</span><strong>{(summary.water.currentMl / 1000).toFixed(1)} L</strong><small>{summary.water.targetMl ? `of ${(summary.water.targetMl / 1000).toFixed(1)} L` : "Set your own target"}</small></div>}
        {today.visibleModules.includes("sleep") && <div><span><FiMoon /> Sleep</span><strong>{formatMinutes(summary.sleep?.durationMinutes)}</strong><small>{summary.sleep?.quality ? `Quality ${summary.sleep.quality}/5` : "No quality rating"}</small></div>}
        {today.visibleModules.includes("workouts") && <div><span>Movement</span><strong>{summary.exercise.durationMinutes} min</strong><small>{summary.exercise.sessions} recorded session{summary.exercise.sessions === 1 ? "" : "s"}</small></div>}
        {today.visibleModules.includes("money") && <div><span>Spent</span><strong>{totalSpending ? formatMoney(totalSpending[1], totalSpending[0]) : "Nothing logged"}</strong><small>{Object.keys(summary.spending).length > 1 ? "Multiple currencies kept separate" : "Recorded today"}</small></div>}
      </section>

      <div className="life-today-layout">
        <section className="life-timeline" aria-labelledby="life-timeline-title">
          <div className="life-section-heading"><div><span>Plan → do → reflect</span><h2 id="life-timeline-title">Today</h2></div><button type="button" className="life-secondary-button" onClick={() => setTaskOpen(true)}><FiPlus /> Add an action</button></div>
          {today.timeline.total === 0 ? (
            <LifeEmpty title="Your day has room to breathe." message="Choose one small thing you would like to make easier to repeat." action={<button type="button" className="life-primary-button" onClick={() => navigate("/life/habits")}>Create a habit</button>} />
          ) : periods.map(([key, label]) => today.timeline.groups[key]?.length > 0 && (
            <div className="life-period" key={key}><h3>{label}</h3><ul>
              {today.timeline.groups[key].map((item) => (
                <li key={`${item.type}-${item.id}`} className={`life-today-item life-today-item--${item.status}`}>
                  <button type="button" className="life-complete-button" disabled={busyId === item.id} onClick={() => act(item, "completed")} aria-label={item.type === "medication" ? `Mark ${item.title} taken as recorded` : `Mark ${item.title} complete`} aria-pressed={item.status === "completed"}>{item.status === "completed" ? <FiCheck /> : <span />}</button>
                  <div><strong>{item.title}</strong><small>{item.type === "habit" ? `${item.intent} · ${item.target ?? 1} ${item.unit || "completion"}` : item.type === "routine" ? `${item.steps?.length || 0} ordered steps${item.scheduledTime ? ` · ${item.scheduledTime}` : ""}` : item.type === "medication" ? `${item.doseText || "Your recorded instructions"}${item.scheduledTime ? ` · ${item.scheduledTime}` : ""}` : item.priority !== "none" ? `${item.priority} priority` : "Daily action"}</small></div>
                  <div className="life-item-actions">
                    {item.type === "routine" ? <button type="button" onClick={() => openRoutine(item)} disabled={Boolean(busyId)}>Start routine</button> : <button type="button" onClick={() => act(item, "partial")} disabled={Boolean(busyId)}>{item.type === "medication" ? "Taken partly" : "Partial"}</button>}
                    <button type="button" onClick={() => act(item, "snoozed")} disabled={Boolean(busyId)}><FiClock /> Snooze</button>
                    <button type="button" onClick={() => act(item, "skipped")} disabled={Boolean(busyId)}><FiSkipForward /> Skip</button>
                  </div>
                </li>
              ))}
            </ul></div>
          ))}
        </section>

        <aside className="life-today-aside">
          {today.visibleModules.includes("water") && <section className="life-quiet-module"><span className="life-kicker">Water</span><h2>{summary.water.currentMl.toLocaleString()} ml</h2><p>Log what you actually drink. Your target is yours to choose.</p><div className="life-quick-row"><button type="button" disabled={busyId === "water"} onClick={() => addWater(250)}>+250 ml</button><button type="button" disabled={busyId === "water"} onClick={() => addWater(500)}>+500 ml</button></div></section>}
          <section className="life-quiet-module"><span className="life-kicker">Goals in motion</span>{summary.goals.length ? <ul className="life-goal-mini-list">{summary.goals.slice(0, 4).map((goal) => <li key={goal.id}><div><strong>{goal.title}</strong><span>{goal.progress}%</span></div><progress max="100" value={goal.progress}>{goal.progress}%</progress></li>)}</ul> : <p>No active goals yet. A goal can give your habits a larger direction.</p>}<button type="button" className="life-link-button" onClick={() => navigate("/life/goals")}>Open Goals →</button></section>
          <section className="life-quiet-module"><span className="life-kicker">Tonight</span><h2>What mattered today?</h2>{today.reflection.saved ? <p>Your reflection is safely recorded.</p> : <form onSubmit={saveReflection}><label><span className="life-sr-only">Daily reflection</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="A moment, a lesson, or something worth carrying forward…" /></label><button className="life-secondary-button" disabled={busyId === "reflection"}>Save privately</button></form>}</section>
        </aside>
      </div>

      <LifeDialog open={taskOpen} title="Add one useful action" onClose={() => setTaskOpen(false)}><form className="life-form" onSubmit={createTask}><label>What needs your attention?<input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength="160" required /></label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setTaskOpen(false)}>Cancel</button><button className="life-primary-button" disabled={busyId === "task"}>Add to {date === localDateInput() ? "today" : date}</button></div></form></LifeDialog>
      <LifeDialog open={Boolean(routineItem)} title={routineItem?.title || "Routine"} onClose={() => setRoutineItem(null)}><form className="life-form" onSubmit={saveRoutine}><p className="life-muted-copy">Record each step as it happened. Skipping an optional step does not erase the routine.</p><div className="life-routine-run">{routineSteps.map((step, index) => <label key={step.id}><span>{index + 1}. {step.title}{step.optional ? " (optional)" : ""}</span><select value={step.status} onChange={(event) => setRoutineSteps((current) => current.map((item) => item.id === step.id ? { ...item, status: event.target.value } : item))}><option value="pending">Not recorded</option><option value="completed">Completed</option><option value="skipped">Skipped</option></select></label>)}</div><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setRoutineItem(null)}>Cancel</button><button className="life-primary-button" disabled={Boolean(busyId)}>Save routine</button></div></form></LifeDialog>
    </div>
  );
}
