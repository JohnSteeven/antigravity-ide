import React, { useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiCheck, FiClock, FiPlus, FiSkipForward, FiSun } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { addDateDays, formatLifeDate, localDateInput, mutationId } from "../utils/lifeFormat";
import { LifeDialog, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";
import CompactTodaySummary from "../components/CompactTodaySummary";

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

  const act = async (item, status, details = {}) => {
    if (busyId) return;
    const previous = query.data;
    setBusyId(item.id);
    setNotice("");
    query.setData((current) => replaceTimelineStatus(current, item.id, status));
    try {
      const payload = { status, scheduledDate: date, scheduledTime: item.scheduledTime || undefined, clientMutationId: mutationId("life", item.type, item.id, date, status), ...details };
      if (status === "snoozed") payload.snoozedUntil = new Date(Date.now() + 30 * 60000).toISOString();
      const response = await lifeApi.logEvent(item.type, item.itemId || item.id, payload);
      const queued = Boolean((response.data || response)?.queued);
      setNotice(queued ? "Recorded on this device. It will sync once you are online." : status === "skipped" ? "Skipped intentionally. This remains different from missed." : status === "snoozed" ? "Moved gently by 30 minutes." : "Recorded.");
      if (!queued) await query.refresh({ quiet: true });
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
      const response = await lifeApi.createHealth({ type: "water", value, unit: "ml", localDate: date, dedupeKey: mutationId("water", date, value) });
      const queued = Boolean((response.data || response)?.queued);
      if (queued) query.setData((current) => ({ ...current, summary: { ...current.summary, water: { ...current.summary.water, currentMl: (current.summary.water.currentMl || 0) + value } } }));
      setNotice(queued ? `${value} ml saved on this device and waiting to sync.` : `${value} ml added.`);
      if (!queued) await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setBusyId("task");
    try {
      const response = await lifeApi.createTask({ title: taskTitle, localDate: date, period: "all_day" });
      const queued = Boolean((response.data || response)?.queued);
      setTaskTitle(""); setTaskOpen(false); setNotice(queued ? "Action saved on this device and waiting to sync." : "Added to this day.");
      if (!queued) await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  const saveReflection = async (event) => {
    event.preventDefault();
    if (!reflection.trim()) return;
    setBusyId("reflection");
    try {
      const response = await lifeApi.createJournal({ type: "daily", localDate: date, title: "What mattered today", body: reflection });
      const queued = Boolean((response.data || response)?.queued);
      if (queued) query.setData((current) => ({ ...current, reflection: { saved: true, pending: true } }));
      setReflection(""); setNotice(queued ? "Reflection saved privately on this device and waiting to sync." : "Reflection saved privately.");
      if (!queued) await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusyId(""); }
  };

  if (query.loading) return <LifeLoading label="Gathering what matters today…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const today = query.data;
  const summary = today.summary;

  return (
    <div className="life-today">
      <div className="life-today-header">
        <LifePageHeader
          eyebrow={today.isToday ? `Good ${today.localNow.hour < 12 ? "morning" : today.localNow.hour < 18 ? "afternoon" : "evening"}, ${firstName}` : "A day in your Life"}
          title={formatLifeDate(date)}
          description={today.vacationMode ? "Vacation mode is protecting this day from expected habits." : "A calm view of what you planned and what actually happened."}
          actions={<div className="life-date-controls" role="group" aria-label="Choose day"><button type="button" onClick={() => setDate(addDateDays(date, -1))} aria-label="Go to previous day"><FiArrowLeft aria-hidden="true" /></button><button type="button" className="life-date-controls__today" onClick={() => setDate(localDateInput())} aria-current={today.isToday ? "date" : undefined}><FiCalendar aria-hidden="true" /> Today</button><button type="button" onClick={() => setDate(addDateDays(date, 1))} aria-label="Go to next day"><FiArrowRight aria-hidden="true" /></button></div>}
        />
      </div>
      <LifeNotice tone={notice?.includes("Couldn't") ? "error" : "success"}>{notice}</LifeNotice>

      <CompactTodaySummary today={today} />

      <div className="life-today-layout">
        <section className="life-timeline" aria-labelledby="life-timeline-title">
          <div className="life-section-heading"><div><span>Plan → do → reflect</span><h2 id="life-timeline-title">Today</h2></div><button type="button" className="life-secondary-button" onClick={() => setTaskOpen(true)}><FiPlus /> Add an action</button></div>
          {today.timeline.total === 0 ? (
            <div className="life-today-empty">
              <span className="life-today-empty__icon" aria-hidden="true"><FiSun /></span>
              <div className="life-today-empty__copy">
                <h3>Your day has room to breathe.</h3>
                <p>Begin with one repeatable practice or add a useful action just for this day.</p>
                <div className="life-today-empty__actions">
                  <button type="button" className="life-primary-button" onClick={() => navigate("/life/habits")}>Create a habit</button>
                  <button type="button" className="life-secondary-button" onClick={() => setTaskOpen(true)}><FiPlus aria-hidden="true" /> Add today&apos;s action</button>
                </div>
              </div>
            </div>
          ) : periods.map(([key, label]) => today.timeline.groups[key]?.length > 0 && (
            <div className="life-period" key={key}><h3>{label}</h3><ul>
              {today.timeline.groups[key].map((item) => (
                <li key={`${item.type}-${item.id}`} className={`life-today-item life-today-item--${item.status}`}>
                  <button type="button" className="life-complete-button" disabled={busyId === item.id} onClick={() => act(item, "completed")} aria-label={item.type === "medication" ? `Mark ${item.title} taken as recorded` : `Mark ${item.title} complete`} aria-pressed={item.status === "completed"}>{item.status === "completed" ? <FiCheck aria-hidden="true" /> : <span aria-hidden="true" />}</button>
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
          {summary.goals.length > 0 && <section className="life-quiet-module"><span className="life-kicker">Goals in motion</span><ul className="life-goal-mini-list">{summary.goals.slice(0, 4).map((goal) => <li key={goal.id}><div><strong>{goal.title}</strong><span>{goal.progress}%</span></div><progress max="100" value={goal.progress}>{goal.progress}%</progress></li>)}</ul><button type="button" className="life-link-button" onClick={() => navigate("/life/goals")}>Open Goals →</button></section>}
          <section className="life-quiet-module"><span className="life-kicker">Tonight</span><h2>What mattered today?</h2>{today.reflection.saved ? <p>Your reflection is safely recorded.</p> : <form onSubmit={saveReflection}><label><span className="life-sr-only">Daily reflection</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="A moment, a lesson, or something worth carrying forward…" /></label><button className="life-secondary-button" disabled={busyId === "reflection"}>Save privately</button></form>}</section>
        </aside>
      </div>

      <LifeDialog open={taskOpen} title="Add one useful action" onClose={() => setTaskOpen(false)}><form className="life-form" onSubmit={createTask}><label>What needs your attention?<input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength="160" required /></label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setTaskOpen(false)}>Cancel</button><button className="life-primary-button" disabled={busyId === "task"}>Add to {date === localDateInput() ? "today" : date}</button></div></form></LifeDialog>
      <LifeDialog open={Boolean(routineItem)} title={routineItem?.title || "Routine"} onClose={() => setRoutineItem(null)}><form className="life-form" onSubmit={saveRoutine}><p className="life-muted-copy">Record each step as it happened. Skipping an optional step does not erase the routine.</p><div className="life-routine-run">{routineSteps.map((step, index) => <label key={step.id}><span>{index + 1}. {step.title}{step.optional ? " (optional)" : ""}</span><select value={step.status} onChange={(event) => setRoutineSteps((current) => current.map((item) => item.id === step.id ? { ...item, status: event.target.value } : item))}><option value="pending">Not recorded</option><option value="completed">Completed</option><option value="skipped">Skipped</option></select></label>)}</div><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setRoutineItem(null)}>Cancel</button><button className="life-primary-button" disabled={Boolean(busyId)}>Save routine</button></div></form></LifeDialog>
    </div>
  );
}
