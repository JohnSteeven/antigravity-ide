import React, { useMemo, useState } from "react";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeNotice, LifePageHeader } from "../components/LifeUI";

const modules = ["habits", "goals", "tasks", "routines", "water", "sleep", "workouts", "mood", "money", "journal"];

export default function SettingsPage({ profile, onProfileChange, onDataDeleted }) {
  const [form, setForm] = useState(() => ({ timezone: profile.timezone, weekStart: profile.weekStart, unitSystem: profile.unitSystem, waterUnit: profile.waterUnit, currency: profile.currency, waterTargetMl: profile.waterTargetMl ?? "", sleepTargetMinutes: profile.sleepTargetMinutes ?? "", visibleModules: profile.visibleModules || modules, notifications: profile.notifications || {}, vacationMode: profile.vacationMode || {} }));
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const zoneOptions = useMemo(() => {
    try { return Intl.supportedValuesOf("timeZone"); } catch { return ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"]; }
  }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleModule = (module) => update("visibleModules", form.visibleModules.includes(module) ? form.visibleModules.filter((item) => item !== module) : [...form.visibleModules, module]);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const response = await lifeApi.updateProfile({ ...form, waterTargetMl: form.waterTargetMl === "" ? null : Number(form.waterTargetMl), sleepTargetMinutes: form.sleepTargetMinutes === "" ? null : Number(form.sleepTargetMinutes) }); const next = response.data || response; onProfileChange(next); setNotice("Life preferences saved."); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const exportData = async () => {
    setBusy(true);
    try { const response = await lifeApi.exportData(); const blob = new Blob([JSON.stringify(response.data || response, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `myjourney-life-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); setNotice("Your Life data export was prepared on this device."); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const deleteData = async () => {
    setBusy(true);
    try { await lifeApi.deleteData(confirmation); setDeleteOpen(false); setConfirmation(""); onDataDeleted(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  return <div>
    <LifePageHeader eyebrow="Yours to configure" title="Settings & privacy" description="Control local-time behavior, units, visible modules, reminders, export, and Life data deletion." />
    <LifeNotice tone={notice.toLowerCase().includes("could") || notice.toLowerCase().includes("type") ? "error" : "success"}>{notice}</LifeNotice>
    <form className="life-settings-grid" onSubmit={save}>
      <section className="life-card"><h2>Locale & units</h2><div className="life-form"><label>Time zone<input list="life-timezones" value={form.timezone} onChange={(event) => update("timezone", event.target.value)} required /><datalist id="life-timezones">{zoneOptions.map((zone) => <option value={zone} key={zone} />)}</datalist></label><label>Week starts<select value={form.weekStart} onChange={(event) => update("weekStart", event.target.value)}><option value="monday">Monday</option><option value="sunday">Sunday</option></select></label><label>Unit system<select value={form.unitSystem} onChange={(event) => update("unitSystem", event.target.value)}><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label><label>Water unit<select value={form.waterUnit} onChange={(event) => update("waterUnit", event.target.value)}><option value="ml">ml</option><option value="l">litres</option><option value="oz">fl oz</option></select></label><label>Default currency<input minLength="3" maxLength="3" value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} /></label></div></section>
      <section className="life-card"><h2>Personal targets</h2><p className="life-muted">Optional reference points, never pass/fail scores.</p><div className="life-form"><label>Water target (ml)<input type="number" min="0" value={form.waterTargetMl} onChange={(event) => update("waterTargetMl", event.target.value)} /></label><label>Sleep target (minutes)<input type="number" min="0" max="1440" value={form.sleepTargetMinutes} onChange={(event) => update("sleepTargetMinutes", event.target.value)} /></label></div><h3>Visible modules</h3><div className="life-choice-grid">{modules.map((module) => <label className="life-check" key={module}><input type="checkbox" checked={form.visibleModules.includes(module)} onChange={() => toggleModule(module)} /> {module}</label>)}</div></section>
      <section className="life-card"><h2>Notifications</h2><div className="life-form"><label className="life-check"><input type="checkbox" checked={form.notifications.enabled !== false} onChange={(event) => update("notifications", { ...form.notifications, enabled: event.target.checked })} /> Enable Life notifications</label><label>Daily cap<input type="number" min="0" max="50" value={form.notifications.dailyCap ?? 8} onChange={(event) => update("notifications", { ...form.notifications, dailyCap: Number(event.target.value) })} /></label><label className="life-check"><input type="checkbox" checked={form.notifications.quietHours?.enabled !== false} onChange={(event) => update("notifications", { ...form.notifications, quietHours: { ...form.notifications.quietHours, enabled: event.target.checked } })} /> Respect quiet hours</label><div className="life-form life-form--two"><label>From<input type="time" value={form.notifications.quietHours?.start || "22:00"} onChange={(event) => update("notifications", { ...form.notifications, quietHours: { ...form.notifications.quietHours, start: event.target.value } })} /></label><label>Until<input type="time" value={form.notifications.quietHours?.end || "07:00"} onChange={(event) => update("notifications", { ...form.notifications, quietHours: { ...form.notifications.quietHours, end: event.target.value } })} /></label></div></div></section>
      <section className="life-card"><h2>Vacation mode</h2><p className="life-muted">Temporarily removes scheduled habits from Today without fabricating missed events.</p><div className="life-form"><label className="life-check"><input type="checkbox" checked={Boolean(form.vacationMode.enabled)} onChange={(event) => update("vacationMode", { ...form.vacationMode, enabled: event.target.checked })} /> Pause scheduled habits</label><label>Start<input type="date" value={form.vacationMode.startDate || ""} onChange={(event) => update("vacationMode", { ...form.vacationMode, startDate: event.target.value })} /></label><label>End<input type="date" value={form.vacationMode.endDate || ""} onChange={(event) => update("vacationMode", { ...form.vacationMode, endDate: event.target.value })} /></label></div></section>
      <div className="life-settings-save"><button className="life-primary-button" disabled={busy}>Save preferences</button></div>
    </form>
    <section className="life-card life-privacy-card"><div><span>Your data</span><h2>Export or delete Life</h2><p>Export creates a JSON copy. Deleting removes Life profiles, schedules, logs, plans, journal entries, insights, and notification records. It does not delete your MyJourney account.</p></div><div><button type="button" className="life-secondary-button" disabled={busy} onClick={exportData}>Export Life data</button><button type="button" className="life-danger-button" disabled={busy} onClick={() => setDeleteOpen(true)}>Delete Life data</button></div></section>
    <LifeDialog open={deleteOpen} title="Permanently delete Life data?" onClose={() => setDeleteOpen(false)}><div className="life-delete-dialog"><p>This cannot be recovered from Life after deletion. Your main MyJourney account and editorial activity are not removed.</p><label>Type <strong>DELETE MY LIFE DATA</strong><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setDeleteOpen(false)}>Cancel</button><button type="button" className="life-danger-button" disabled={busy || confirmation !== "DELETE MY LIFE DATA"} onClick={deleteData}>Delete permanently</button></div></div></LifeDialog>
  </div>;
}
