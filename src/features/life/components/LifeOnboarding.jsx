import React, { useMemo, useState } from "react";
import lifeApi from "../api/lifeApi";
import { localDateInput } from "../utils/lifeFormat";
import { LifeNotice } from "./LifeUI";

const priorityOptions = ["Energy", "Focus", "Health", "Relationships", "Money", "Creativity", "Rest", "Growth"];
const moduleOptions = ["habits", "goals", "tasks", "routines", "water", "sleep", "workouts", "mood", "money", "journal"];
const starters = [
  { id: "water", name: "Drink water", target: 250, unit: "ml", measurementType: "quantity", preferredPeriod: "morning" },
  { id: "move", name: "Move for ten minutes", target: 10, unit: "minutes", measurementType: "duration", preferredPeriod: "afternoon" },
  { id: "reflect", name: "Pause and reflect", target: 1, unit: "check-in", measurementType: "boolean", preferredPeriod: "evening" },
];

export default function LifeOnboarding({ profile, onDone }) {
  const detectedZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [form, setForm] = useState({ timezone: profile.timezone === "UTC" ? detectedZone : profile.timezone, currency: profile.currency || "USD", priorities: [], visibleModules: profile.visibleModules || moduleOptions, starters: [] });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const finish = async () => {
    setBusy(true); setNotice("");
    try {
      const response = await lifeApi.completeOnboarding({ timezone: form.timezone, currency: form.currency.toUpperCase(), priorities: form.priorities, visibleModules: form.visibleModules });
      const profileResult = response.data || response;
      if (form.starters.length) {
        const selected = starters.filter((starter) => form.starters.includes(starter.id));
        const results = await Promise.allSettled(selected.map((starter) => lifeApi.createHabit({ ...starter, intent: "build", schedule: { type: "daily", startDate: localDateInput(), times: [starter.preferredPeriod === "morning" ? "08:00" : starter.preferredPeriod === "afternoon" ? "14:00" : "20:00"] }, reminder: { enabled: false } })));
        if (results.some((result) => result.status === "rejected")) setNotice("Life is ready. One optional starter could not be added, but you can create it later.");
      }
      onDone(profileResult);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const skip = async () => {
    setBusy(true); setNotice("");
    try { const response = await lifeApi.skipOnboarding({ timezone: form.timezone }); onDone(response.data || response); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  return <main className="life-onboarding">
    <div className="life-onboarding-brand"><span>MYJOURNEY</span><strong>LIFE</strong></div>
    <section className="life-onboarding-panel" aria-labelledby="life-onboarding-title">
      <div className="life-onboarding-progress" aria-label={`Step ${step + 1} of 3`}><span className={step >= 0 ? "is-active" : ""} /><span className={step >= 1 ? "is-active" : ""} /><span className={step >= 2 ? "is-active" : ""} /></div>
      <LifeNotice tone="error">{notice}</LifeNotice>
      {step === 0 && <div><span className="life-eyebrow">A private space for your real life</span><h1 id="life-onboarding-title">Make today easier to see.</h1><p>Life brings habits, goals, health notes, money records, and reflection into one calm daily view. Use only the parts that help.</p><div className="life-form"><label>Your time zone<input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required /></label><label>Default currency<input minLength="3" maxLength="3" value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} /></label></div></div>}
      {step === 1 && <div><span className="life-eyebrow">Choose your emphasis</span><h1 id="life-onboarding-title">What deserves attention?</h1><p>Pick up to five. These choices organize Life; they do not score you.</p><div className="life-option-grid">{priorityOptions.map((option) => <button type="button" key={option} className={form.priorities.includes(option) ? "is-selected" : ""} disabled={!form.priorities.includes(option) && form.priorities.length >= 5} onClick={() => toggle("priorities", option)}>{option}</button>)}</div><h2>Visible modules</h2><div className="life-choice-grid">{moduleOptions.map((module) => <label className="life-check" key={module}><input type="checkbox" checked={form.visibleModules.includes(module)} onChange={() => toggle("visibleModules", module)} /> {module}</label>)}</div></div>}
      {step === 2 && <div><span className="life-eyebrow">Optional starting points</span><h1 id="life-onboarding-title">Begin empty, or add one gentle habit.</h1><p>Nothing is selected for you. You can change or archive any habit later without erasing history.</p><div className="life-starter-list">{starters.map((starter) => <label key={starter.id}><input type="checkbox" checked={form.starters.includes(starter.id)} onChange={() => toggle("starters", starter.id)} /><span><strong>{starter.name}</strong><small>Daily · no reminder</small></span></label>)}</div></div>}
      <footer><button type="button" className="life-link-button" onClick={skip} disabled={busy}>Skip setup</button><div>{step > 0 && <button type="button" className="life-secondary-button" onClick={() => setStep((value) => value - 1)} disabled={busy}>Back</button>}{step < 2 ? <button type="button" className="life-primary-button" onClick={() => setStep((value) => value + 1)}>Continue</button> : <button type="button" className="life-primary-button" onClick={finish} disabled={busy}>{busy ? "Preparing Life…" : "Open Life"}</button>}</div></footer>
    </section>
  </main>;
}
