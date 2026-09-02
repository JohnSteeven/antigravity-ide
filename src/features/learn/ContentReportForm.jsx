import React, { useState } from "react";
import { Link } from "react-router";
import { learnApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";

export default function ContentReportForm({ targetType, targetId }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reason: "misleading", details: "" });
  const [state, setState] = useState({ busy: false, error: "", message: "" });
  const submit = async (event) => {
    event.preventDefault(); setState({ busy: true, error: "", message: "" });
    try { await learnApi.report({ targetType, targetId, ...form }); setState({ busy: false, error: "", message: "Report received for moderator review." }); }
    catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  };
  return <aside className="learn-report"><button type="button" className="learn-report__trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>Report this content</button>{open && (isAuthenticated ? <form onSubmit={submit}><label>Reason <select value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}>{["misleading", "spam", "harassment", "copyright", "dangerous", "privacy", "other"].map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label><label>Details <textarea value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} maxLength="2000" /></label>{state.error && <p className="learn-notice" role="alert">{state.error}</p>}{state.message && <p className="learn-notice" role="status">{state.message}</p>}<button type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send report"}</button></form> : <p><Link to="/login">Sign in</Link> to send a report.</p>)}</aside>;
}
