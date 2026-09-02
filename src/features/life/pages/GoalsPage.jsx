import React, { useState } from "react";
import { FiArchive, FiPlus, FiTarget } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { localDateInput } from "../utils/lifeFormat";
import { LifeDialog, LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const emptyGoal = () => ({ title: "", why: "", targetDate: "", progressStrategy: "manual", targetValue: "", unit: "", milestones: "" });

export default function GoalsPage() {
  const query = useLifeQuery(() => lifeApi.goals({ status: "all" }), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyGoal());
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const create = async (event) => {
    event.preventDefault(); setBusy("create");
    try {
      await lifeApi.createGoal({
        title: form.title, why: form.why, startDate: localDateInput(), targetDate: form.targetDate || null,
        progressStrategy: form.progressStrategy, targetValue: form.targetValue === "" ? null : Number(form.targetValue), unit: form.unit,
        milestones: form.milestones.split("\n").map((title, order) => ({ title: title.trim(), order })).filter((item) => item.title),
      });
      setForm(emptyGoal()); setOpen(false); setNotice("Goal created. Add habits or actions when they genuinely support it."); await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(""); }
  };

  const setProgress = async (goal, value) => {
    setBusy(goal._id);
    try { await lifeApi.updateGoal(goal._id, { manualProgress: Number(value), progressStrategy: "manual" }); setNotice("Progress updated from your own assessment."); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(""); }
  };

  const archive = async (goal) => {
    setBusy(goal._id);
    try { await lifeApi.archiveGoal(goal._id); setNotice("Goal archived without erasing what happened."); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(""); }
  };

  if (query.loading) return <LifeLoading label="Gathering your longer direction…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const goals = query.data.items || [];
  return <div>
    <LifePageHeader eyebrow="Direction over pressure" title="Goals" description="Connect larger intentions to milestones, habits, and the next useful action." actions={<button type="button" className="life-primary-button" onClick={() => setOpen(true)}><FiPlus /> New goal</button>} />
    <LifeNotice tone={notice?.includes("Couldn't") ? "error" : "success"}>{notice}</LifeNotice>
    {goals.length === 0 ? <LifeEmpty title="What would be worth moving toward?" message="A goal can be practical, personal, unfinished, paused, or changed. It is direction—not a judgment." action={<button className="life-primary-button" type="button" onClick={() => setOpen(true)}>Create a personal goal</button>} /> : <section className="life-goal-list">{goals.map((goal) => <article key={goal._id} className={`life-goal-row life-goal-row--${goal.status}`}><div className="life-goal-icon"><FiTarget /></div><div className="life-goal-copy"><div><span>{goal.status}</span>{goal.targetDate && <small>Target {goal.targetDate}</small>}</div><h2>{goal.title}</h2><p>{goal.why || "A direction you chose."}</p><div className="life-goal-progress"><progress max="100" value={goal.progress}>{goal.progress}%</progress><strong>{goal.progress}%</strong></div>{goal.milestones?.length > 0 && <ul>{goal.milestones.map((milestone) => <li key={milestone._id || milestone.title} className={milestone.completedAt ? "is-complete" : ""}>{milestone.title}</li>)}</ul>}</div><div className="life-goal-controls">{goal.status === "active" && <label>Update progress<input type="range" min="0" max="100" defaultValue={goal.progress} disabled={busy === goal._id} onChange={(event) => setProgress(goal, event.target.value)} /></label>}{goal.status !== "archived" && <button type="button" onClick={() => archive(goal)} disabled={busy === goal._id}><FiArchive /> Archive</button>}</div></article>)}</section>}
    <LifeDialog open={open} title="Create a goal" onClose={() => setOpen(false)} wide><form className="life-form life-form--two" onSubmit={create}><label className="life-field-span">Title<input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Build a portfolio I am proud of" required /></label><label className="life-field-span">Why this matters<textarea value={form.why} onChange={(event) => update("why", event.target.value)} /></label><label>Target date (optional)<input type="date" value={form.targetDate} min={localDateInput()} onChange={(event) => update("targetDate", event.target.value)} /></label><label>Progress approach<select value={form.progressStrategy} onChange={(event) => update("progressStrategy", event.target.value)}><option value="manual">My own percentage</option><option value="milestones">Milestones</option><option value="quantity">A quantity</option><option value="linked_completions">Linked completions</option></select></label>{["quantity", "linked_completions"].includes(form.progressStrategy) && <><label>Target value<input type="number" value={form.targetValue} onChange={(event) => update("targetValue", event.target.value)} /></label><label>Unit<input value={form.unit} onChange={(event) => update("unit", event.target.value)} placeholder="sessions, pages, rupees…" /></label></>}<label className="life-field-span">Milestones, one per line<textarea value={form.milestones} onChange={(event) => update("milestones", event.target.value)} placeholder={'Finish first draft\nAsk for feedback\nPublish'} /></label><div className="life-dialog-actions life-field-span"><button type="button" className="life-secondary-button" onClick={() => setOpen(false)}>Cancel</button><button className="life-primary-button" disabled={busy === "create"}>Create goal</button></div></form></LifeDialog>
  </div>;
}
