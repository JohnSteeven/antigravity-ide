import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiFileText, FiRefreshCw, FiShield, FiUsers } from "react-icons/fi";
import { creatorApi, learnApi } from "../../services/apiService";
import "./CreatorReviewModule.css";

const APPLICATION_TRANSITIONS = {
  applied: ["under_review", "rejected"],
  under_review: ["more_info_required", "interview", "verification", "approved", "rejected"],
  more_info_required: ["under_review", "rejected"],
  interview: ["verification", "approved", "rejected"],
  verification: ["approved", "rejected"],
  approved: ["active", "restricted", "suspended", "deactivated"],
  active: ["restricted", "suspended", "deactivated"],
  restricted: ["active", "suspended", "deactivated"],
  suspended: ["active", "deactivated"],
  deactivated: ["active"],
};

const CONTENT_TRANSITIONS = {
  submitted: ["under_review", "changes_requested", "approved", "rejected"],
  under_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["submitted", "rejected"],
  approved: ["published"],
  published: ["archived"],
  rejected: ["changes_requested"],
};

const label = (value = "") => value.replaceAll("_", " ");

export default function CreatorReviewModule() {
  const [tab, setTab] = useState("applications");
  const [applicationStatus, setApplicationStatus] = useState("");
  const [contentType, setContentType] = useState("course");
  const [applications, setApplications] = useState([]);
  const [content, setContent] = useState([]);
  const [topics, setTopics] = useState([]);
  const [reports, setReports] = useState([]);
  const [topicForm, setTopicForm] = useState({ name: "", description: "", status: "active", sortOrder: 0 });
  const [notes, setNotes] = useState({ publicMessage: "", privateNote: "", contentMessage: "" });
  const [state, setState] = useState({ loading: true, busy: false, error: "", message: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const [applicationResponse, contentResponse, topicResponse, reportResponse] = await Promise.all([
        creatorApi.adminApplications({ status: applicationStatus }),
        creatorApi.adminContent({ contentType }),
        learnApi.adminTopics(),
        learnApi.adminReports(),
      ]);
      setApplications(applicationResponse.data || []);
      setContent(contentResponse.items || []);
      setTopics(topicResponse.data || []);
      setReports(reportResponse.data || []);
      setState((current) => ({ ...current, loading: false }));
    } catch (error) { setState((current) => ({ ...current, loading: false, error: error.message })); }
  }, [applicationStatus, contentType]);

  useEffect(() => { load(); }, [load]);

  const reviewApplication = async (application, status) => {
    if (!window.confirm(`Move this application to ${label(status)}?`)) return;
    setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      await creatorApi.reviewApplication(application._id, { status, publicMessage: notes.publicMessage, privateNote: notes.privateNote });
      setNotes((current) => ({ ...current, publicMessage: "", privateNote: "" }));
      setState((current) => ({ ...current, busy: false, message: `Application moved to ${label(status)}.` }));
      await load();
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  const reviewContent = async (item, status) => {
    if (!window.confirm(`Move this ${contentType} to ${label(status)}?`)) return;
    setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      await creatorApi.reviewContent(contentType, item._id, { status, message: notes.contentMessage });
      setNotes((current) => ({ ...current, contentMessage: "" }));
      setState((current) => ({ ...current, busy: false, message: `Content moved to ${label(status)}.` }));
      await load();
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  const pendingApplications = useMemo(() => applications.filter((item) => !["active", "rejected", "deactivated"].includes(item.status)).length, [applications]);

  const createTopic = async (event) => {
    event.preventDefault(); setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try { await learnApi.createTopic(topicForm); setTopicForm({ name: "", description: "", status: "active", sortOrder: 0 }); setState((current) => ({ ...current, busy: false, message: "Learn Topic created." })); await load(); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  const setTopicStatus = async (topic, status) => {
    setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try { await learnApi.updateTopic(topic._id, { status }); setState((current) => ({ ...current, busy: false, message: `Topic moved to ${status}.` })); await load(); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  const reviewReport = async (report, status) => {
    setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try { await learnApi.reviewReport(report._id, { status }); setState((current) => ({ ...current, busy: false, message: `Content report moved to ${status}.` })); await load(); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  return (
    <div className="cms-panel creator-review">
      <div className="cms-panel-heading creator-review__heading"><div><span className="section-kicker">Trust and publishing</span><h2>Creator Review</h2><p>Application approval, account activation, and editorial publishing remain separate decisions.</p></div><button className="small-outline-btn" type="button" onClick={load} disabled={state.loading || state.busy}><FiRefreshCw /> Refresh</button></div>
      <div className="creator-review__summary"><div><FiUsers /><strong>{applications.length}</strong><span>applications in view</span></div><div><FiShield /><strong>{pendingApplications}</strong><span>requiring a decision</span></div><div><FiFileText /><strong>{content.length}</strong><span>{contentType} review items</span></div></div>
      <div className="creator-review__tabs" role="tablist" aria-label="Creator review queues"><button type="button" role="tab" aria-selected={tab === "applications"} onClick={() => setTab("applications")}><FiUsers /> Applications</button><button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")}><FiFileText /> Content review</button><button type="button" role="tab" aria-selected={tab === "topics"} onClick={() => setTab("topics")}><FiFileText /> Learn Topics</button><button type="button" role="tab" aria-selected={tab === "reports"} onClick={() => setTab("reports")}><FiShield /> Reports {reports.length ? `(${reports.length})` : ""}</button></div>
      {state.error && <div className="alert-message error" role="alert">{state.error}</div>}{state.message && <div className="alert-message success" role="status"><FiCheck /> {state.message}</div>}

      {tab === "applications" && <section role="tabpanel" className="creator-review__queue"><div className="creator-review__toolbar"><label>Status <select className="form-select" value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value)}><option value="">All statuses</option>{Object.keys(APPLICATION_TRANSITIONS).map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label></div><div className="creator-review__notes"><label>Message visible to applicant <textarea className="form-input" value={notes.publicMessage} onChange={(event) => setNotes((current) => ({ ...current, publicMessage: event.target.value }))} maxLength="2000" /></label><label>Private review note <textarea className="form-input" value={notes.privateNote} onChange={(event) => setNotes((current) => ({ ...current, privateNote: event.target.value }))} maxLength="4000" /></label></div>{state.loading ? <p className="empty-state">Loading Creator applications…</p> : applications.length ? <div className="creator-review__list">{applications.map((application) => <article key={application._id}><header><div><span className={`status-pill ${application.status}`}>{label(application.status)}</span><h3>{application.displayName || application.legalName}</h3><p>{application.headline}</p></div><small>{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "Not submitted"}</small></header><dl><div><dt>Legal name</dt><dd>{application.legalName}</dd></div><div><dt>Country</dt><dd>{application.country || "Not provided"}</dd></div><div><dt>Experience</dt><dd>{application.yearsExperience ?? 0} years</dd></div><div><dt>Formats</dt><dd>{(application.intendedFormats || []).join(", ") || "Not provided"}</dd></div></dl><p className="creator-review__motivation">{application.motivation}</p><div className="inline-actions">{(APPLICATION_TRANSITIONS[application.status] || []).map((status) => <button key={status} type="button" className="small-outline-btn" disabled={state.busy} onClick={() => reviewApplication(application, status)}>{label(status)}</button>)}</div></article>)}</div> : <p className="empty-state">No Creator applications match this status.</p>}</section>}

      {tab === "content" && <section role="tabpanel" className="creator-review__queue"><div className="creator-review__toolbar"><label>Format <select className="form-select" value={contentType} onChange={(event) => setContentType(event.target.value)}>{["article", "story", "course", "video", "podcast", "resource"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Editorial message <input className="form-input" value={notes.contentMessage} onChange={(event) => setNotes((current) => ({ ...current, contentMessage: event.target.value }))} maxLength="2000" placeholder="Reason for changes or editorial note" /></label></div>{state.loading ? <p className="empty-state">Loading editorial queue…</p> : content.length ? <div className="creator-review__list">{content.map((item) => { const status = item.creatorWorkflowStatus || item.workflowStatus; const creator = item.creatorProfileId || item.creatorId; return <article key={item._id}><header><div><span className={`status-pill ${status}`}>{label(status)}</span><h3>{item.title}</h3><p>{item.description}</p></div><small>{creator?.displayName || "Creator"}</small></header><div className="inline-actions">{(CONTENT_TRANSITIONS[status] || []).map((nextStatus) => <button key={nextStatus} type="button" className="small-outline-btn" disabled={state.busy} onClick={() => reviewContent(item, nextStatus)}>{label(nextStatus)}</button>)}</div></article>; })}</div> : <p className="empty-state">No {contentType} items are waiting in this review queue.</p>}</section>}

      {tab === "topics" && <section role="tabpanel" className="creator-review__queue"><form className="creator-review__topic-form" onSubmit={createTopic}><label>Name <input className="form-input" value={topicForm.name} onChange={(event) => setTopicForm((current) => ({ ...current, name: event.target.value }))} required minLength="2" maxLength="100" /></label><label>Description <input className="form-input" value={topicForm.description} onChange={(event) => setTopicForm((current) => ({ ...current, description: event.target.value }))} maxLength="1000" /></label><label>Status <select className="form-select" value={topicForm.status} onChange={(event) => setTopicForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Active</option><option value="draft">Draft</option></select></label><label>Order <input className="form-input" type="number" value={topicForm.sortOrder} onChange={(event) => setTopicForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label><button className="small-outline-btn" type="submit" disabled={state.busy}>Create Topic</button></form>{state.loading ? <p className="empty-state">Loading Learn Topics…</p> : <div className="creator-review__list">{topics.map((topic) => <article key={topic._id}><header><div><span className={`status-pill ${topic.status}`}>{topic.status}</span><h3>{topic.name}</h3><p>{topic.description}</p></div><small>Order {topic.sortOrder || 0}</small></header><div className="inline-actions">{topic.status !== "active" && <button className="small-outline-btn" type="button" onClick={() => setTopicStatus(topic, "active")}>Activate</button>}{topic.status !== "archived" && <button className="small-outline-btn" type="button" onClick={() => setTopicStatus(topic, "archived")}>Archive</button>}</div></article>)}</div>}</section>}

      {tab === "reports" && <section role="tabpanel" className="creator-review__queue">{state.loading ? <p className="empty-state">Loading reports…</p> : reports.length ? <div className="creator-review__list">{reports.map((report) => <article key={report._id}><header><div><span className={`status-pill ${report.status}`}>{report.status}</span><h3>{report.targetType} · {report.reason}</h3><p>{report.details || "No additional details."}</p></div><small>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}</small></header><dl><div><dt>Target</dt><dd>{report.targetId}</dd></div><div><dt>Reporter</dt><dd>{report.reporterId?.email || "Authenticated reader"}</dd></div></dl><div className="inline-actions">{report.status !== "reviewing" && <button className="small-outline-btn" type="button" onClick={() => reviewReport(report, "reviewing")}>Reviewing</button>}<button className="small-outline-btn" type="button" onClick={() => reviewReport(report, "resolved")}>Resolve</button><button className="small-outline-btn" type="button" onClick={() => reviewReport(report, "dismissed")}>Dismiss</button></div></article>)}</div> : <p className="empty-state">No open content reports.</p>}</section>}
    </div>
  );
}
