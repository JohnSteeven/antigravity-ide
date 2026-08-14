import React, { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBookOpen, FiCheckSquare, FiChevronDown, FiDollarSign, FiDroplet, FiHeart, FiMic, FiMoon, FiRepeat, FiTarget } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeNotice } from "./LifeUI";
import { localDateInput } from "../utils/lifeFormat";
import { parseCaptureText } from "../utils/captureParser";

const RECENT_KEY = "myjourney-life-recent-capture-types";
const actions = [
  { id: "water", label: "Water", icon: FiDroplet }, { id: "expense", label: "Expense", icon: FiDollarSign },
  { id: "task", label: "Today action", icon: FiCheckSquare }, { id: "journal", label: "Quick note", icon: FiBookOpen },
  { id: "mood", label: "Check-in", icon: FiHeart }, { id: "workout", label: "Workout", icon: FiActivity },
  { id: "sleep", label: "Sleep", icon: FiMoon }, { id: "income", label: "Income", icon: FiDollarSign },
  { id: "habit", label: "Habit", icon: FiRepeat }, { id: "routine", label: "Routine", icon: FiRepeat },
  { id: "goal", label: "Goal", icon: FiTarget }, { id: "health_note", label: "Health note", icon: FiHeart },
  { id: "medication", label: "Medication", icon: FiHeart },
];
const defaults = { value: 250, unit: "ml", amount: "", currency: "INR", category: "Other", title: "", note: "", time: "", mood: 3, energy: 3, stress: 3, minutes: 30, steps: "", medicationId: "" };

const readRecents = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter((id) => actions.some((action) => action.id === id)).slice(0, 4); }
  catch { return []; }
};

export default function QuickCapture({ open, initialType = "", onClose, onSaved }) {
  const navigate = useNavigate();
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(defaults);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [recents, setRecents] = useState(readRecents);
  const [voiceText, setVoiceText] = useState("");
  const [voicePreview, setVoicePreview] = useState(null);
  const [medications, setMedications] = useState([]);
  const recognitionAvailable = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { if (open && initialType) setType(initialType); }, [open, initialType]);
  useEffect(() => {
    if (open && type === "medication") lifeApi.medications({ status: "active" }).then((response) => setMedications((response.data || response).items || [])).catch((error) => setNotice(error.message));
  }, [open, type]);
  const displayed = useMemo(() => {
    const recentActions = recents.map((id) => actions.find((action) => action.id === id)).filter(Boolean);
    const primary = actions.slice(0, 5).filter((action) => !recents.includes(action.id));
    return more ? actions : [...recentActions, ...primary].slice(0, 5);
  }, [more, recents]);
  const select = (next) => { setType(next); setNotice(""); setVoicePreview(null); };
  const remember = (id) => {
    const next = [id, ...recents.filter((item) => item !== id)].slice(0, 4);
    setRecents(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };
  const finish = async (response, message) => {
    remember(type);
    const queued = Boolean((response.data || response)?.queued);
    setNotice(queued ? "Saved on this device. It will sync once you are online." : message);
    setForm(defaults);
    window.dispatchEvent(new CustomEvent("life:data-changed"));
    onSaved?.({ type, queued });
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      let response;
      if (type === "water") response = await lifeApi.createHealth({ type: "water", value: Number(form.value), unit: form.unit, localDate: localDateInput() });
      else if (["expense", "income"].includes(type)) response = await lifeApi.createMoneyEntry({ type, amount: Number(form.amount), currency: form.currency.toUpperCase(), category: form.category || "Other", note: form.note, localDate: localDateInput() });
      else if (type === "journal") response = await lifeApi.createJournal({ type: "free", body: form.note, localDate: localDateInput() });
      else if (type === "mood") response = await lifeApi.createHealth({ type: "mood", mood: Number(form.mood), energy: Number(form.energy), stress: Number(form.stress), note: form.note, localDate: localDateInput() });
      else if (type === "workout") response = await lifeApi.createHealth({ type: "workout", workoutType: "custom", durationMinutes: Number(form.minutes), note: form.note, localDate: localDateInput() });
      else if (type === "sleep") response = await lifeApi.createHealth({ type: "sleep", durationMinutes: Number(form.minutes), quality: Number(form.mood), note: form.note, localDate: localDateInput() });
      else if (type === "health_note") response = await lifeApi.createHealth({ type: "symptom", label: form.title || "Health note", note: form.note, severity: Number(form.mood), localDate: localDateInput() });
      else if (type === "task") response = await lifeApi.createTask({ title: form.title, localDate: localDateInput(), scheduledFor: form.time ? new Date(`${localDateInput()}T${form.time}:00`).toISOString() : null });
      else if (type === "habit") response = await lifeApi.createHabit({ name: form.title, schedule: { type: "daily", startDate: localDateInput(), times: form.time ? [form.time] : [] }, reminder: { enabled: false } });
      else if (type === "routine") response = await lifeApi.createRoutine({ name: form.title, items: form.steps.split("\n").map((title, order) => ({ title: title.trim(), order, linkedType: "routine_only" })).filter((item) => item.title), schedule: { type: "daily", startDate: localDateInput(), times: form.time ? [form.time] : [] }, reminder: { enabled: false } });
      else if (type === "goal") response = await lifeApi.createGoal({ title: form.title, why: form.note });
      else if (type === "medication") response = await lifeApi.logEvent("medication", form.medicationId, { status: "completed", scheduledDate: localDateInput(), note: form.note });
      await finish(response, "Captured. Your Life view is up to date.");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const parseVoiceText = (text) => { setVoiceText(text); setVoicePreview(text.trim() ? parseCaptureText(text) : null); };
  const applyPreview = () => {
    if (!voicePreview) return;
    if (voicePreview.type === "habit_lookup") { onClose(); navigate(`/life/habits?q=${encodeURIComponent(voicePreview.fields.query)}`); return; }
    select(voicePreview.type); setForm((current) => ({ ...current, ...voicePreview.fields })); setVoicePreview(null);
  };
  const listen = () => {
    if (!recognitionAvailable) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition(); recognition.interimResults = false; recognition.lang = document.documentElement.lang || "en";
    recognition.onresult = (event) => parseVoiceText(event.results[0][0].transcript);
    recognition.onerror = () => setNotice("Voice input was unavailable. You can type the same words below.");
    recognition.start();
  };
  const selected = actions.find((action) => action.id === type);
  return <LifeDialog open={open} title="Quick capture" onClose={onClose} wide>
    <div className="life-capture">
      <p className="life-muted">Record what happened in a few seconds. Nothing is shared publicly.</p>
      <div className="life-capture-voice"><label>Type or speak naturally<input value={voiceText} onChange={(event) => parseVoiceText(event.target.value)} placeholder="Log 500 ml of water" /></label>{recognitionAvailable && <button type="button" className="life-icon-button" onClick={listen} aria-label="Use voice input"><FiMic /></button>}</div>
      {voicePreview && <div className="life-parse-preview" role="status"><div><span>Preview · {voicePreview.confidence} confidence</span><strong>{voicePreview.type.replace("_", " ")}</strong><small>{Object.entries(voicePreview.fields).filter(([, value]) => value !== "").map(([key, value]) => `${key}: ${value}`).join(" · ")}</small></div><button type="button" className="life-secondary-button" onClick={applyPreview}>Use this</button></div>}
      {!selected && <><div className="life-capture-actions">{displayed.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => select(id)}><Icon /><span>{label}</span></button>)}</div><button type="button" className="life-link-button life-capture-more" onClick={() => setMore((value) => !value)}>{more ? "Show common actions" : "More capture types"} <FiChevronDown /></button></>}
      <LifeNotice tone={notice.toLowerCase().includes("could") || notice.toLowerCase().includes("invalid") ? "error" : "success"}>{notice}</LifeNotice>
      {selected && <form className="life-form life-capture-form" onSubmit={save}><button type="button" className="life-link-button" onClick={() => setType("")}>← All capture types</button><h3><selected.icon /> {selected.label}</h3>
        {type === "water" && <><div className="life-quick-row"><button type="button" onClick={() => update("value", 250)}>+250 ml</button><button type="button" onClick={() => update("value", 500)}>+500 ml</button></div><div className="life-form life-form--two"><label>Amount<input type="number" min="1" value={form.value} onChange={(event) => update("value", event.target.value)} required /></label><label>Unit<select value={form.unit} onChange={(event) => update("unit", event.target.value)}><option value="ml">ml</option><option value="l">litres</option><option value="oz">fl oz</option></select></label></div></>}
        {["expense", "income"].includes(type) && <div className="life-form life-form--two"><label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => update("amount", event.target.value)} required autoFocus /></label><label>Currency<input minLength="3" maxLength="3" value={form.currency} onChange={(event) => update("currency", event.target.value)} required /></label><label>Category<input value={form.category} onChange={(event) => update("category", event.target.value)} /></label><label>Optional note<input value={form.note} onChange={(event) => update("note", event.target.value)} /></label></div>}
        {type === "journal" && <label>Note<textarea value={form.note} onChange={(event) => update("note", event.target.value)} required autoFocus /></label>}
        {type === "mood" && <><div className="life-form life-form--two"><label>Mood (1–5)<input type="number" min="1" max="5" value={form.mood} onChange={(event) => update("mood", event.target.value)} /></label><label>Energy (1–5)<input type="number" min="1" max="5" value={form.energy} onChange={(event) => update("energy", event.target.value)} /></label><label>Stress (1–5)<input type="number" min="1" max="5" value={form.stress} onChange={(event) => update("stress", event.target.value)} /></label></div><label>Optional note<input value={form.note} onChange={(event) => update("note", event.target.value)} /></label></>}
        {["workout", "sleep"].includes(type) && <><label>{type === "sleep" ? "Minutes slept" : "Minutes"}<input type="number" min="0" value={form.minutes} onChange={(event) => update("minutes", event.target.value)} required /></label>{type === "sleep" && <label>Quality (1–5)<input type="number" min="1" max="5" value={form.mood} onChange={(event) => update("mood", event.target.value)} /></label>}<label>Optional note<input value={form.note} onChange={(event) => update("note", event.target.value)} /></label></>}
        {["task", "habit", "routine", "goal", "health_note"].includes(type) && <><label>{type === "task" ? "Action" : "Name"}<input value={form.title} onChange={(event) => update("title", event.target.value)} required autoFocus /></label>{type === "routine" && <label>Steps, one per line<textarea value={form.steps} onChange={(event) => update("steps", event.target.value)} required /></label>}{["task", "habit", "routine"].includes(type) && <label>Optional time<input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} /></label>}{["goal", "health_note"].includes(type) && <label>Note<textarea value={form.note} onChange={(event) => update("note", event.target.value)} /></label>}{type === "health_note" && <label>Severity (1–10)<input type="number" min="1" max="10" value={form.mood} onChange={(event) => update("mood", event.target.value)} /></label>}</>}
        {type === "medication" && (medications.length ? <><label>Medication<select value={form.medicationId} onChange={(event) => update("medicationId", event.target.value)} required><option value="">Choose one</option>{medications.map((item) => <option key={item._id} value={item._id}>{item.name} {item.doseText}</option>)}</select></label><label>Optional note<input value={form.note} onChange={(event) => update("note", event.target.value)} /></label></> : <p className="life-muted">No active medication records are available. Add one from Health first.</p>)}
        <div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={onClose}>Close</button><button className="life-primary-button" disabled={busy || (type === "medication" && !medications.length)}>Save</button></div>
      </form>}
    </div>
  </LifeDialog>;
}

