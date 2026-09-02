import React, { useMemo, useState } from "react";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { formatMinutes, localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const nowInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function HealthPage() {
  const [date, setDate] = useState(localDateInput());
  const query = useLifeQuery(async () => {
    const [entries, summary, medications] = await Promise.all([lifeApi.health({ start: date, end: date }), lifeApi.healthSummary({ start: date, end: date }), lifeApi.medications({ status: "active" })]);
    return { entries: entries.data, summary: summary.data, medications: medications.data };
  }, [date]);
  const [kind, setKind] = useState("water");
  const [form, setForm] = useState({ value: "250", unit: "ml", startedAt: nowInput(), endedAt: nowInput(), quality: "3", mood: "3", energy: "3", stress: "3", durationMinutes: "30", workoutType: "custom", label: "", doseText: "", severity: "3", note: "", scheduledTime: "08:00", reminderEnabled: true });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const payload = useMemo(() => {
    const base = { type: kind, localDate: date, note: form.note, occurredAt: new Date().toISOString() };
    if (kind === "water") return { ...base, value: Number(form.value), unit: form.unit };
    if (kind === "sleep") return { ...base, startedAt: new Date(form.startedAt).toISOString(), endedAt: new Date(form.endedAt).toISOString(), quality: Number(form.quality) };
    if (kind === "mood") return { ...base, mood: Number(form.mood), energy: Number(form.energy), stress: Number(form.stress) };
    if (kind === "workout") return { ...base, workoutType: form.workoutType, durationMinutes: Number(form.durationMinutes) };
    if (kind === "symptom") return { ...base, label: form.label, severity: Number(form.severity) };
    return { ...base, label: form.label, doseText: form.doseText };
  }, [date, form, kind]);

  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      if (kind === "medication") await lifeApi.createMedication({ name: form.label, doseText: form.doseText, notes: form.note, schedule: { type: "daily", startDate: date, times: [form.scheduledTime] }, reminder: { enabled: form.reminderEnabled, times: [form.scheduledTime], channels: ["in_app"] } });
      else await lifeApi.createHealth(payload);
      setNotice(kind === "medication" ? "Medication schedule saved exactly as entered. Life will not change or interpret your instructions." : "Health entry saved privately."); await query.refresh({ quiet: true });
    }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const remove = async (id) => {
    setBusy(true);
    try { await lifeApi.deleteHealth(id); setNotice("Entry removed from your active health history."); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  if (query.loading) return <LifeLoading label="Gathering your health notes…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const entries = query.data?.entries?.items || [];
  const medications = query.data?.medications?.items || [];
  const summary = query.data?.summary || {};

  return <div>
    <LifePageHeader eyebrow="Recorded, not judged" title="Health" description="A private, lightweight record of sleep, hydration, movement, mood, symptoms, and medication." actions={<label className="life-inline-date">Day<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>} />
    <div className="life-safety-note">Life records what you enter; it does not diagnose conditions or replace professional care. Seek qualified help for medical concerns.</div>
    <LifeNotice tone={notice.toLowerCase().includes("could") ? "error" : "success"}>{notice}</LifeNotice>
    <section className="life-stat-grid" aria-label="Health summary">
      <article><span>Water</span><strong>{Math.round(summary.waterMl || 0)} ml</strong></article>
      <article><span>Sleep</span><strong>{formatMinutes(summary.sleepAverageMinutes)}</strong></article>
      <article><span>Movement</span><strong>{formatMinutes(summary.workoutMinutes || 0)}</strong></article>
      <article><span>Entries</span><strong>{summary.entryCount || entries.length}</strong></article>
    </section>
    <div className="life-two-panel">
      <section className="life-card">
        <h2>Log something</h2>
        <div className="life-segmented" aria-label="Health entry type">{["water", "sleep", "mood", "workout", "symptom", "medication"].map((item) => <button type="button" className={kind === item ? "is-active" : ""} onClick={() => setKind(item)} key={item}>{item}</button>)}</div>
        <form className="life-form life-form--two" onSubmit={save}>
          {kind === "water" && <><label>Amount<input type="number" min="0" step="any" value={form.value} onChange={(event) => update("value", event.target.value)} required /></label><label>Unit<select value={form.unit} onChange={(event) => update("unit", event.target.value)}><option value="ml">ml</option><option value="l">litres</option><option value="oz">fl oz</option></select></label></>}
          {kind === "sleep" && <><label>Sleep started<input type="datetime-local" value={form.startedAt} onChange={(event) => update("startedAt", event.target.value)} required /></label><label>Woke up<input type="datetime-local" value={form.endedAt} onChange={(event) => update("endedAt", event.target.value)} required /></label><label>Quality (1–5)<input type="number" min="1" max="5" value={form.quality} onChange={(event) => update("quality", event.target.value)} /></label></>}
          {kind === "mood" && ["mood", "energy", "stress"].map((item) => <label key={item}>{item} (1–5)<input type="number" min="1" max="5" value={form[item]} onChange={(event) => update(item, event.target.value)} /></label>)}
          {kind === "workout" && <><label>Movement type<select value={form.workoutType} onChange={(event) => update("workoutType", event.target.value)}><option value="strength">Strength</option><option value="cardio">Cardio</option><option value="mobility">Mobility</option><option value="sport">Sport</option><option value="custom">Other</option></select></label><label>Minutes<input type="number" min="0" value={form.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)} /></label></>}
          {kind === "symptom" && <><label>Symptom<input value={form.label} onChange={(event) => update("label", event.target.value)} required /></label><label>Severity (1–10)<input type="number" min="1" max="10" value={form.severity} onChange={(event) => update("severity", event.target.value)} /></label></>}
          {kind === "medication" && <><label>Name<input value={form.label} onChange={(event) => update("label", event.target.value)} required /></label><label>Dose as written<input value={form.doseText} onChange={(event) => update("doseText", event.target.value)} placeholder="Your recorded instructions" /></label><label>Scheduled time<input type="time" value={form.scheduledTime} onChange={(event) => update("scheduledTime", event.target.value)} required /></label><label className="life-check"><input type="checkbox" checked={form.reminderEnabled} onChange={(event) => update("reminderEnabled", event.target.checked)} /> In-app reminder</label></>}
          <label className="life-field-span">Private note<textarea value={form.note} onChange={(event) => update("note", event.target.value)} /></label>
          <button className="life-primary-button life-field-span" disabled={busy}>{kind === "medication" ? "Save schedule" : "Save entry"}</button>
        </form>
      </section>
      <section className="life-card"><h2>Medication schedules</h2><div className="life-safety-inline">Reminders repeat only the name, time, and dose text you entered. They never recommend, alter, or infer medication instructions.</div>{medications.length === 0 ? <LifeEmpty title="No schedules" message="If useful, record a schedule from your own instructions. Life does not provide dosage advice." /> : <div className="life-record-list">{medications.map((medication) => <article key={medication._id}><div><strong>{medication.name}</strong><span>{medication.doseText || "No dose text"} · {medication.schedule?.times?.join(", ") || "No time"}</span></div><button type="button" className="life-link-button" disabled={busy} onClick={async () => { setBusy(true); try { await lifeApi.updateMedication(medication._id, { status: "archived" }); setNotice("Medication schedule archived; existing logs remain preserved."); await query.refresh({ quiet: true }); } catch (error) { setNotice(error.message); } finally { setBusy(false); } }}>Archive</button></article>)}</div>}<h2 className="life-subheading">Recorded this day</h2>{entries.length === 0 ? <p className="life-muted">Nothing else recorded for this day.</p> : <div className="life-record-list">{entries.map((entry) => <article key={entry._id}><div><strong>{entry.type}</strong><span>{entry.type === "water" ? `${entry.value} ${entry.unit}` : entry.type === "sleep" ? formatMinutes(entry.durationMinutes) : entry.label || entry.workoutType || "Recorded"}</span></div><button type="button" className="life-link-button" disabled={busy} onClick={() => remove(entry._id)}>Remove</button></article>)}</div>}</section>
    </div>
  </div>;
}
