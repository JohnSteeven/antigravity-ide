import React, { useState } from "react";
import { FiArchive, FiPause, FiPlay, FiPlus, FiRepeat } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { localDateInput } from "../utils/lifeFormat";
import { LifeDialog, LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const emptyHabit = () => ({ name: "", why: "", intent: "build", measurementType: "boolean", target: 1, unit: "completion", preferredPeriod: "morning", scheduleType: "daily", weekdays: [], time: "08:00", reminder: false, linkedGoal: "", replacementBehavior: "" });
const weekdayOptions = [[1, "M"], [2, "T"], [3, "W"], [4, "T"], [5, "F"], [6, "S"], [0, "S"]];

export default function HabitsPage() {
  const query = useLifeQuery(async () => {
    const [habits, goals, routines] = await Promise.all([lifeApi.habits({ status: "all" }), lifeApi.goals({ status: "active" }), lifeApi.routines({ status: "all" })]);
    return { habits: habits.data, goals: goals.data, routines: routines.data };
  }, []);
  const [open, setOpen] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [form, setForm] = useState(emptyHabit());
  const [routine, setRoutine] = useState({ name: "", items: "", time: "07:30", reminder: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleWeekday = (day) => update("weekdays", form.weekdays.includes(day) ? form.weekdays.filter((item) => item !== day) : [...form.weekdays, day]);

  const createHabit = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await lifeApi.createHabit({
        name: form.name, why: form.why, intent: form.intent, measurementType: form.measurementType,
        target: form.target, unit: form.unit, preferredPeriod: form.preferredPeriod,
        linkedGoal: form.linkedGoal || null, replacementBehavior: form.replacementBehavior,
        schedule: { type: form.scheduleType, startDate: localDateInput(), weekdays: form.weekdays, times: [form.time], timesPerWeek: Math.max(1, form.weekdays.length) },
        reminder: { enabled: form.reminder, times: [form.time], channels: ["in_app"] },
      });
      setForm(emptyHabit()); setOpen(false); setNotice("Habit created. It now belongs to your schedule, not a disposable checklist.");
      await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  const setStatus = async (habit, status) => {
    setBusy(true);
    try { await lifeApi.setHabitStatus(habit._id, status); setNotice(status === "paused" ? "Paused without losing any history." : status === "archived" ? "Archived. Past records remain intact." : "Habit resumed."); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  const createRoutine = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await lifeApi.createRoutine({ name: routine.name, items: routine.items.split("\n").map((title, order) => ({ title: title.trim(), order, linkedType: "routine_only" })).filter((item) => item.title), schedule: { type: "daily", startDate: localDateInput(), times: [routine.time] }, reminder: { enabled: routine.reminder, times: [routine.time], channels: ["in_app"] } });
      setRoutine({ name: "", items: "", time: "07:30", reminder: false }); setRoutineOpen(false); setNotice("Routine created as an ordered flow."); await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  const setRoutineStatus = async (item, status) => {
    setBusy(true);
    try { await lifeApi.updateRoutine(item._id, { status }); setNotice(status === "paused" ? "Routine paused without changing past logs." : status === "archived" ? "Routine archived; its history remains." : "Routine resumed."); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  if (query.loading) return <LifeLoading label="Loading your rhythms…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const habits = query.data.habits.items || [];
  const routines = query.data.routines.items || [];
  return (
    <div>
      <LifePageHeader eyebrow="Practice, not perfection" title="Habits & routines" description="Build, maintain, reduce, or quit—without turning one difficult day into a verdict." actions={<div className="life-page-actions"><button className="life-secondary-button" type="button" onClick={() => setRoutineOpen(true)}><FiRepeat /> New routine</button><button className="life-primary-button" type="button" onClick={() => setOpen(true)}><FiPlus /> New habit</button></div>} />
      <LifeNotice tone={notice?.includes("Couldn't") ? "error" : "success"}>{notice}</LifeNotice>
      {habits.length === 0 ? <LifeEmpty title="Choose one small repeatable thing." message="Start with something that would make daily life a little easier—not an idealized version of yourself." action={<button type="button" className="life-primary-button" onClick={() => setOpen(true)}>Create your first habit</button>} /> : (
        <section className="life-list-section"><div className="life-section-heading"><div><span>Your practices</span><h2>Active and remembered</h2></div></div><ul className="life-definition-list">{habits.map((habit) => <li key={habit._id} className={`life-definition-row${habit.status !== "active" ? " is-muted" : ""}`}><div className="life-definition-mark" aria-hidden="true">{habit.intent.slice(0, 1).toUpperCase()}</div><div className="life-definition-copy"><div><strong>{habit.name}</strong><span>{habit.status}</span></div><p>{habit.why || "A personal practice."}</p><small>{habit.intent} · {habit.measurementType} · {habit.target} {habit.unit} · {habit.schedule?.type?.replaceAll("_", " ")}</small></div><div className="life-definition-actions">{habit.status === "paused" ? <button type="button" onClick={() => setStatus(habit, "active")} disabled={busy}><FiPlay /> Resume</button> : habit.status === "active" ? <button type="button" onClick={() => setStatus(habit, "paused")} disabled={busy}><FiPause /> Pause</button> : null}{habit.status !== "archived" && <button type="button" onClick={() => setStatus(habit, "archived")} disabled={busy}><FiArchive /> Archive</button>}</div></li>)}</ul></section>
      )}

      <section className="life-list-section life-routine-section"><div className="life-section-heading"><div><span>Ordered flows</span><h2>Routines</h2></div></div>{routines.length ? <ul className="life-routine-list">{routines.map((item) => <li key={item._id} className={`life-routine-row${item.status !== "active" ? " is-muted" : ""}`}><div><strong>{item.name}</strong><span>{item.items.length} steps · {item.status}</span></div><ol>{item.items.slice().sort((a, b) => a.order - b.order).map((step) => <li key={step._id || step.title}>{step.title}</li>)}</ol><div className="life-definition-actions">{item.status === "paused" ? <button type="button" onClick={() => setRoutineStatus(item, "active")} disabled={busy}><FiPlay /> Resume</button> : item.status === "active" ? <button type="button" onClick={() => setRoutineStatus(item, "paused")} disabled={busy}><FiPause /> Pause</button> : null}{item.status !== "archived" && <button type="button" onClick={() => setRoutineStatus(item, "archived")} disabled={busy}><FiArchive /> Archive</button>}</div></li>)}</ul> : <p className="life-muted-copy">A routine can hold an ordered morning, workout, work-start, or evening flow. Nothing is added automatically.</p>}</section>

      <LifeDialog open={open} title="Create a habit" onClose={() => setOpen(false)} wide><form className="life-form life-form--two" onSubmit={createHabit}>
        <label className="life-field-span">Name<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Practice guitar" required maxLength="120" /></label>
        <label className="life-field-span">Why it matters<textarea value={form.why} onChange={(event) => update("why", event.target.value)} placeholder="A quiet creative practice after work." maxLength="800" /></label>
        <label>Intent<select value={form.intent} onChange={(event) => update("intent", event.target.value)}><option value="build">Build</option><option value="maintain">Maintain</option><option value="reduce">Reduce gently</option><option value="quit">Quit with support</option></select></label>
        <label>Measure as<select value={form.measurementType} onChange={(event) => update("measurementType", event.target.value)}><option value="boolean">Done / not done</option><option value="quantity">Quantity</option><option value="duration">Duration</option><option value="count">Count</option><option value="limit">Stay under a limit</option><option value="avoid">Avoid</option><option value="time">By a time</option><option value="custom">Custom</option></select></label>
        <label>Target<input type="number" value={form.target} onChange={(event) => update("target", Number(event.target.value))} /></label><label>Unit<input value={form.unit} onChange={(event) => update("unit", event.target.value)} placeholder="minutes, pages, glasses…" /></label>
        <label>Part of day<select value={form.preferredPeriod} onChange={(event) => update("preferredPeriod", event.target.value)}><option value="anytime">Anytime</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
        <label>Schedule<select value={form.scheduleType} onChange={(event) => update("scheduleType", event.target.value)}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekends">Weekends</option><option value="specific_weekdays">Specific weekdays</option><option value="times_per_week">Times per week</option><option value="every_n_days">Every N days</option><option value="monthly">Monthly</option></select></label>
        {["specific_weekdays", "times_per_week"].includes(form.scheduleType) && <fieldset className="life-weekdays life-field-span"><legend>Preferred days</legend>{weekdayOptions.map(([day, label], index) => <label key={`${day}-${index}`}><input type="checkbox" checked={form.weekdays.includes(day)} onChange={() => toggleWeekday(day)} /><span>{label}</span></label>)}</fieldset>}
        <label>Preferred time<input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} /></label>
        <label className="life-switch-row"><input type="checkbox" checked={form.reminder} onChange={(event) => update("reminder", event.target.checked)} /><span>Send a calm in-app reminder</span></label>
        {query.data.goals.items?.length > 0 && <label>Linked goal<select value={form.linkedGoal} onChange={(event) => update("linkedGoal", event.target.value)}><option value="">None</option>{query.data.goals.items.map((goal) => <option key={goal._id} value={goal._id}>{goal.title}</option>)}</select></label>}
        {["reduce", "quit"].includes(form.intent) && <label className="life-field-span">Replacement behavior<input value={form.replacementBehavior} onChange={(event) => update("replacementBehavior", event.target.value)} placeholder="When the urge appears, I will…" /></label>}
        <details className="life-field-span life-advanced"><summary>How scheduling changes work</summary><p>Future edits create a new schedule version. Yesterday continues to use the definition that was active yesterday.</p></details>
        <div className="life-dialog-actions life-field-span"><button type="button" className="life-secondary-button" onClick={() => setOpen(false)}>Cancel</button><button className="life-primary-button" disabled={busy}>Create habit</button></div>
      </form></LifeDialog>

      <LifeDialog open={routineOpen} title="Create a routine" onClose={() => setRoutineOpen(false)}><form className="life-form" onSubmit={createRoutine}><label>Name<input value={routine.name} onChange={(event) => setRoutine((current) => ({ ...current, name: event.target.value }))} placeholder="Morning routine" required /></label><label>Steps, one per line<textarea value={routine.items} onChange={(event) => setRoutine((current) => ({ ...current, items: event.target.value }))} placeholder={'Water\nStretch\nPlan the day'} required /></label><label>Preferred time<input type="time" value={routine.time} onChange={(event) => setRoutine((current) => ({ ...current, time: event.target.value }))} /></label><label className="life-check"><input type="checkbox" checked={routine.reminder} onChange={(event) => setRoutine((current) => ({ ...current, reminder: event.target.checked }))} /> Send a calm in-app reminder</label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setRoutineOpen(false)}>Cancel</button><button className="life-primary-button" disabled={busy}>Create routine</button></div></form></LifeDialog>
    </div>
  );
}
