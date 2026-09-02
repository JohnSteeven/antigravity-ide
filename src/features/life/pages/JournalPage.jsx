import React, { useState } from "react";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const prompts = {
  daily: "What felt meaningful today?",
  free: "Write what needs somewhere to land.",
  weekly_review: "What worked, what felt difficult, and what deserves attention next week?",
  monthly_review: "What changed this month, and what do you want to carry forward?",
};

export default function JournalPage() {
  const query = useLifeQuery(() => lifeApi.journal({ limit: 50 }), []);
  const [form, setForm] = useState({ type: "daily", title: "", body: "", localDate: localDateInput(), pinnedToTimeline: false });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try { await lifeApi.createJournal(form); setNotice("Reflection saved privately."); setForm((current) => ({ ...current, title: "", body: "" })); await query.refresh({ quiet: true }); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const remove = async (id) => {
    setBusy(true); try { await lifeApi.deleteJournal(id); setNotice("Reflection removed from active records."); await query.refresh({ quiet: true }); } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  };
  if (query.loading) return <LifeLoading label="Opening your private journal…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const entries = query.data?.items || [];
  return <div>
    <LifePageHeader eyebrow="Private by default" title="Journal" description="A quiet place for daily notes, free writing, and intentional reviews." />
    <LifeNotice tone={notice.toLowerCase().includes("could") ? "error" : "success"}>{notice}</LifeNotice>
    <div className="life-journal-layout">
      <form className="life-card life-journal-editor" onSubmit={save}>
        <div className="life-segmented" aria-label="Reflection type">{Object.keys(prompts).map((type) => <button type="button" className={form.type === type ? "is-active" : ""} onClick={() => update("type", type)} key={type}>{type.replace("_", " ")}</button>)}</div>
        <p className="life-prompt">{prompts[form.type]}</p>
        <div className="life-form life-form--two"><label>Title (optional)<input value={form.title} onChange={(event) => update("title", event.target.value)} /></label><label>Date<input type="date" value={form.localDate} onChange={(event) => update("localDate", event.target.value)} /></label><label className="life-field-span">Reflection<textarea className="life-journal-textarea" value={form.body} onChange={(event) => update("body", event.target.value)} required /></label><label className="life-check life-field-span"><input type="checkbox" checked={form.pinnedToTimeline} onChange={(event) => update("pinnedToTimeline", event.target.checked)} /> Show this marker in my timeline</label><button className="life-primary-button life-field-span" disabled={busy}>Save reflection</button></div>
      </form>
      <section className="life-journal-history"><h2>Past reflections</h2>{entries.length === 0 ? <LifeEmpty title="A blank page" message="There is no quota and no streak. Write when it helps." /> : entries.map((entry) => <article className="life-journal-entry" key={entry._id}><div><span>{entry.type.replace("_", " ")} · {entry.localDate}</span><button type="button" className="life-link-button" disabled={busy} onClick={() => remove(entry._id)}>Remove</button></div><h3>{entry.title || "Untitled reflection"}</h3><p>{entry.body}</p></article>)}</section>
    </div>
  </div>;
}
