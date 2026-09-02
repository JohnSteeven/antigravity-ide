import React, { useEffect, useState } from "react";
import { FiCheck, FiClock } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeError, LifeLoading, LifeNotice } from "./LifeUI";

export default function LifeTemplates({ open, onClose, onApplied }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", time: "", reminderEnabled: false, steps: "" });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => { setLoading(true); try { const response = await lifeApi.templates(); setTemplates(response.data || response); } catch (error) { setNotice(error.message); } finally { setLoading(false); } };
  useEffect(() => { if (open && !templates.length) load(); }, [open]);
  const choose = (template) => { setSelected(template); setForm({ name: template.name, time: template.time, reminderEnabled: false, steps: (template.steps || []).join("\n") }); setNotice(""); };
  const apply = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await lifeApi.applyTemplate(selected.key, { name: form.name, time: form.time, reminderEnabled: form.reminderEnabled, ...(selected.kind === "routine" ? { steps: form.steps.split("\n").map((item) => item.trim()).filter(Boolean) } : {}) });
      setNotice(`${form.name} was added as a normal ${selected.kind}. You can edit or pause it any time.`); onApplied?.(); setSelected(null);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  return <LifeDialog open={open} title="Start from a template" onClose={onClose} wide><div className="life-templates"><p className="life-muted">Templates are optional starting points. Review every detail before anything is created.</p><LifeNotice tone={notice.toLowerCase().includes("could") || notice.toLowerCase().includes("choose") ? "error" : "success"}>{notice}</LifeNotice>{loading && <LifeLoading label="Opening templates…" />}{!loading && !selected && <div className="life-template-list">{templates.map((template) => <button type="button" key={template.key} onClick={() => choose(template)}><span>{template.category}</span><strong>{template.name}</strong><p>{template.description}</p><small><FiClock /> {template.time} · {template.kind}</small></button>)}</div>}{selected && <form className="life-form" onSubmit={apply}><button type="button" className="life-link-button" onClick={() => setSelected(null)}>← All templates</button><label>Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label><label>Preferred time<input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required /></label>{selected.kind === "routine" && <label>Steps, one per line<textarea value={form.steps} onChange={(event) => setForm((current) => ({ ...current, steps: event.target.value }))} required /></label>}<label className="life-check"><input type="checkbox" checked={form.reminderEnabled} onChange={(event) => setForm((current) => ({ ...current, reminderEnabled: event.target.checked }))} /> Enable a calm in-app reminder</label><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setSelected(null)}>Back</button><button className="life-primary-button" disabled={busy}><FiCheck /> Add to Life</button></div></form>}</div></LifeDialog>;
}

