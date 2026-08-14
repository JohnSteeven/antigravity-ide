import React, { useEffect, useMemo, useState } from "react";
import { FiBell, FiCalendar, FiCpu, FiDownload, FiHeart, FiUploadCloud } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeNotice, LifePageHeader } from "../components/LifeUI";
import { disableLifePush, enableLifePush, pushSupport } from "../utils/pushClient";

const modules = ["habits", "goals", "tasks", "routines", "water", "sleep", "workouts", "mood", "money", "journal"];
const reminderControls = [["habitReminders", "Habit reminders"], ["goalReminders", "Goal reminders"], ["billReminders", "Bill reminders"], ["medicationReminders", "Medication reminders"], ["weeklyReviewReminder", "Weekly review reminder"]];

export default function SettingsPage({ profile, onProfileChange, onDataDeleted }) {
  const [form, setForm] = useState(() => ({
    timezone: profile.timezone, weekStart: profile.weekStart, unitSystem: profile.unitSystem, waterUnit: profile.waterUnit, currency: profile.currency,
    waterTargetMl: profile.waterTargetMl ?? "", sleepTargetMinutes: profile.sleepTargetMinutes ?? "", visibleModules: profile.visibleModules || modules,
    notifications: profile.notifications || {}, vacationMode: profile.vacationMode || {}, aiInsightsEnabled: Boolean(profile.aiInsightsEnabled), aiReview: profile.aiReview || {},
  }));
  const [capabilities, setCapabilities] = useState(null);
  const [pushState, setPushState] = useState(pushSupport().state);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const zoneOptions = useMemo(() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"]; } }, []);
  useEffect(() => { lifeApi.capabilities().then((response) => setCapabilities(response.data || response)).catch(() => setCapabilities(null)); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateNotifications = (key, value) => update("notifications", { ...form.notifications, [key]: value });
  const toggleModule = (module) => update("visibleModules", form.visibleModules.includes(module) ? form.visibleModules.filter((item) => item !== module) : [...form.visibleModules, module]);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await lifeApi.updateProfile({ ...form, waterTargetMl: form.waterTargetMl === "" ? null : Number(form.waterTargetMl), sleepTargetMinutes: form.sleepTargetMinutes === "" ? null : Number(form.sleepTargetMinutes) });
      const next = response.data || response; onProfileChange(next); setNotice("Life preferences saved.");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const enablePush = async () => {
    setBusy(true); setNotice("");
    try {
      const configResponse = await lifeApi.pushConfig(); const config = configResponse.data || configResponse;
      if (!config.available) throw new Error("Web push is unavailable until the server has VAPID credentials.");
      const subscription = await enableLifePush(config.publicKey);
      await lifeApi.subscribePush(subscription.toJSON());
      const channels = [...new Set([...(form.notifications.channels || ["in_app"]), "web_push"])];
      updateNotifications("channels", channels); setPushState("granted"); setNotice("Browser notifications are connected. Save preferences to choose which reminders use them.");
    } catch (error) { setPushState(pushSupport().state); setNotice(error.message); }
    finally { setBusy(false); }
  };
  const disablePush = async () => {
    setBusy(true); setNotice("");
    try {
      const endpoint = await disableLifePush(); if (endpoint) await lifeApi.unsubscribePush(endpoint);
      updateNotifications("channels", (form.notifications.channels || []).filter((item) => item !== "web_push")); setPushState(pushSupport().state); setNotice("This browser is no longer subscribed to Life push notifications.");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const exportData = async () => {
    setBusy(true);
    try {
      const response = await lifeApi.exportData(); const blob = new Blob([JSON.stringify(response.data || response, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `myjourney-life-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); setNotice("Your Life data export was prepared on this device.");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const validateOwnExport = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()); const valid = Number(parsed.schemaVersion) >= 1 && parsed.generatedAt && parsed.data;
      setImportPreview(valid ? { schemaVersion: parsed.schemaVersion, generatedAt: parsed.generatedAt, sections: Object.keys(parsed.data) } : null);
      setNotice(valid ? "Export validated locally. Restore is intentionally not enabled until duplicate and conflict review is available." : "This file is not a recognized Life export.");
    } catch { setImportPreview(null); setNotice("This file is not valid JSON."); }
    event.target.value = "";
  };
  const deleteData = async () => {
    setBusy(true);
    try { await lifeApi.deleteData(confirmation); setDeleteOpen(false); setConfirmation(""); onDataDeleted(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const pushCapability = capabilities?.webPush;
  return <div>
    <LifePageHeader eyebrow="Yours to configure" title="Settings & privacy" description="Control local-time behavior, units, reminders, integrations, export, and Life data deletion." />
    <LifeNotice tone={/could|unavailable|denied|not valid|not recognized/i.test(notice) ? "error" : "success"}>{notice}</LifeNotice>
    <form className="life-settings-grid" onSubmit={save}>
      <section className="life-card"><h2>Locale & units</h2><div className="life-form"><label>Time zone<input list="life-timezones" value={form.timezone} onChange={(event) => update("timezone", event.target.value)} required /><datalist id="life-timezones">{zoneOptions.map((zone) => <option value={zone} key={zone} />)}</datalist></label><label>Week starts<select value={form.weekStart} onChange={(event) => update("weekStart", event.target.value)}><option value="monday">Monday</option><option value="sunday">Sunday</option></select></label><label>Unit system<select value={form.unitSystem} onChange={(event) => update("unitSystem", event.target.value)}><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label><label>Water unit<select value={form.waterUnit} onChange={(event) => update("waterUnit", event.target.value)}><option value="ml">ml</option><option value="l">litres</option><option value="oz">fl oz</option></select></label><label>Default currency<input minLength="3" maxLength="3" value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} /></label></div></section>
      <section className="life-card"><h2>Personal targets</h2><p className="life-muted">Optional reference points, never pass/fail scores.</p><div className="life-form"><label>Water target (ml)<input type="number" min="0" value={form.waterTargetMl} onChange={(event) => update("waterTargetMl", event.target.value)} /></label><label>Sleep target (minutes)<input type="number" min="0" max="1440" value={form.sleepTargetMinutes} onChange={(event) => update("sleepTargetMinutes", event.target.value)} /></label></div><h3>Visible modules</h3><div className="life-choice-grid">{modules.map((module) => <label className="life-check" key={module}><input type="checkbox" checked={form.visibleModules.includes(module)} onChange={() => toggleModule(module)} /> {module}</label>)}</div></section>
      <section className="life-card life-settings-wide"><div className="life-card-heading"><div><span>Useful, not noisy</span><h2>Notifications</h2></div><FiBell /></div><div className="life-notification-settings"><div className="life-form"><label className="life-check"><input type="checkbox" checked={form.notifications.enabled !== false} onChange={(event) => updateNotifications("enabled", event.target.checked)} /> Enable Life notifications</label><label>Daily cap<input type="number" min="0" max="50" value={form.notifications.dailyCap ?? 8} onChange={(event) => updateNotifications("dailyCap", Number(event.target.value))} /></label><label className="life-check"><input type="checkbox" checked={form.notifications.quietHours?.enabled !== false} onChange={(event) => updateNotifications("quietHours", { ...form.notifications.quietHours, enabled: event.target.checked })} /> Respect quiet hours</label><div className="life-form life-form--two"><label>From<input type="time" value={form.notifications.quietHours?.start || "22:00"} onChange={(event) => updateNotifications("quietHours", { ...form.notifications.quietHours, start: event.target.value })} /></label><label>Until<input type="time" value={form.notifications.quietHours?.end || "07:00"} onChange={(event) => updateNotifications("quietHours", { ...form.notifications.quietHours, end: event.target.value })} /></label></div></div><div><h3>Browser push</h3><p className="life-muted">Permission is requested only when you choose to connect this browser.</p><p className="life-capability-state"><span className={`is-${pushState}`}>●</span> {pushCapability?.available ? pushState.replace("_", " ") : pushCapability?.reason || "Checking availability…"}</p>{pushState === "granted" ? <button type="button" className="life-secondary-button" onClick={disablePush} disabled={busy}>Disconnect this browser</button> : <button type="button" className="life-secondary-button" onClick={enablePush} disabled={busy || !pushCapability?.available}>Enable browser notifications</button>}</div></div><details className="life-advanced"><summary>Briefs and reminder types</summary><div className="life-choice-grid life-settings-controls"><label className="life-check"><input type="checkbox" checked={Boolean(form.notifications.morningBrief)} onChange={(event) => updateNotifications("morningBrief", event.target.checked)} /> Morning brief</label><label>Morning time<input type="time" value={form.notifications.morningBriefTime || "07:30"} onChange={(event) => updateNotifications("morningBriefTime", event.target.value)} /></label><label className="life-check"><input type="checkbox" checked={Boolean(form.notifications.eveningSummary)} onChange={(event) => updateNotifications("eveningSummary", event.target.checked)} /> Evening summary</label><label>Evening time<input type="time" value={form.notifications.eveningSummaryTime || "20:30"} onChange={(event) => updateNotifications("eveningSummaryTime", event.target.value)} /></label>{reminderControls.map(([key, label]) => <label className="life-check" key={key}><input type="checkbox" checked={form.notifications[key] !== false} onChange={(event) => updateNotifications(key, event.target.checked)} /> {label}</label>)}</div></details></section>
      <section className="life-card"><h2>Vacation mode</h2><p className="life-muted">Temporarily removes scheduled habits from Today without fabricating missed events.</p><div className="life-form"><label className="life-check"><input type="checkbox" checked={Boolean(form.vacationMode.enabled)} onChange={(event) => update("vacationMode", { ...form.vacationMode, enabled: event.target.checked })} /> Pause scheduled habits</label><label>Start<input type="date" value={form.vacationMode.startDate || ""} onChange={(event) => update("vacationMode", { ...form.vacationMode, startDate: event.target.value })} /></label><label>End<input type="date" value={form.vacationMode.endDate || ""} onChange={(event) => update("vacationMode", { ...form.vacationMode, endDate: event.target.value })} /></label></div></section>
      <section className="life-card"><h2>Advanced, optional</h2><details className="life-advanced"><summary><FiCpu /> AI-assisted reviews</summary><p className="life-muted">Deterministic totals remain authoritative. AI is disabled unless both server capability and your opt-in are active.</p><p className="life-capability-state"><span className={capabilities?.aiReview?.available ? "is-available" : "is-unavailable"}>●</span> {capabilities?.aiReview?.state || "checking"}</p><label className="life-check"><input type="checkbox" checked={form.aiInsightsEnabled} onChange={(event) => update("aiInsightsEnabled", event.target.checked)} disabled={!capabilities?.aiReview?.available} /> Enable AI summaries</label>{[["includeJournal", "Include selected journal excerpts"], ["includeHealth", "Include health summary"], ["includeFinance", "Include finance summary"]].map(([key, label]) => <label className="life-check" key={key}><input type="checkbox" checked={Boolean(form.aiReview[key])} onChange={(event) => update("aiReview", { ...form.aiReview, [key]: event.target.checked })} disabled={!form.aiInsightsEnabled} /> {label}</label>)}</details><details className="life-advanced"><summary><FiCalendar /> Calendar connections</summary><p className="life-muted">Google, Microsoft, and device calendar adapters are prepared for future read-only connections. No provider is connected or simulated.</p><p className="life-capability-state"><span className="is-unavailable">●</span> Disconnected</p></details><details className="life-advanced"><summary><FiHeart /> Health connections</summary><p className="life-muted">Apple Health, Health Connect, Fitbit, Garmin, and Strava require provider or device infrastructure not available to this browser. Import adapters remain disconnected.</p><p className="life-capability-state"><span className="is-unavailable">●</span> Disconnected</p></details></section>
      <div className="life-settings-save"><button className="life-primary-button" disabled={busy}>Save preferences</button></div>
    </form>
    <section className="life-card life-privacy-card"><div><span>Your data</span><h2>Export, validate, or delete Life</h2><p>Export includes a schema version, generation time, timezone, units, and Life-owned records. Restore remains preview-only until conflict handling is production-safe.</p>{importPreview && <small>Validated schema {importPreview.schemaVersion} · {importPreview.sections.length} sections</small>}</div><div><button type="button" className="life-secondary-button" disabled={busy} onClick={exportData}><FiDownload /> Export Life data</button><label className="life-secondary-button life-file-button"><FiUploadCloud /> Validate an export<input type="file" accept="application/json,.json" onChange={validateOwnExport} /></label><button type="button" className="life-danger-button" disabled={busy} onClick={() => setDeleteOpen(true)}>Delete Life data</button></div></section>
    <LifeDialog open={deleteOpen} title="Permanently delete Life data?" onClose={() => setDeleteOpen(false)}><div className="life-delete-dialog"><p>This cannot be recovered from Life after deletion. Your main MyJourney account and editorial activity are not removed.</p><label>Type <strong>DELETE MY LIFE DATA</strong><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setDeleteOpen(false)}>Cancel</button><button type="button" className="life-danger-button" disabled={busy || confirmation !== "DELETE MY LIFE DATA"} onClick={deleteData}>Delete permanently</button></div></div></LifeDialog>
  </div>;
}
