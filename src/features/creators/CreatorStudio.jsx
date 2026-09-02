import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { creatorApi, creatorStudioApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import "./creators.css";

const CONTENT_TYPES = ["article", "story", "course", "video", "podcast", "resource"];
const STORY_LAYOUTS = [
  ["classic-reader", "Classic Reader"], ["reader-image-right", "Image Companion"], ["alternating-editorial", "Alternating Editorial"],
  ["chapter-journey", "Chapter Journey"], ["magazine-feature", "Magazine Feature"], ["minimal-longform", "Minimal Longform"],
];
const initialDraft = { title: "", description: "", body: "", category: "Life", accessLevel: "free", storyLayout: "classic-reader", language: "English", level: "all_levels", confirmContentRights: false };
const clientKey = () => globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const newLesson = () => ({ stableKey: clientKey(), title: "", description: "", lessonType: "text", body: "", durationSeconds: 0, isPreview: false, completionMode: "manual" });
const newModule = () => ({ stableKey: clientKey(), title: "", description: "", lessons: [newLesson()] });

const StatusSummary = ({ statuses = {} }) => (
  <dl className="creator-studio__status">
    {["draft", "submitted", "under_review", "changes_requested", "published"].map((status) => <div key={status}><dt>{status.replaceAll("_", " ")}</dt><dd>{statuses[status] || 0}</dd></div>)}
  </dl>
);

function CreateFlow({ onCreated }) {
  const [type, setType] = useState("");
  const [draft, setDraft] = useState(initialDraft);
  const [modules, setModules] = useState([newModule()]);
  const [state, setState] = useState({ busy: false, error: "", saved: null });
  const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const updateModule = (moduleIndex, field, value) => setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, [field]: value } : module));
  const updateLesson = (moduleIndex, lessonIndex, field, value) => setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, position) => position === lessonIndex ? { ...lesson, [field]: value } : lesson) } : module));
  const addLesson = (moduleIndex) => setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: [...module.lessons, newLesson()] } : module));
  const save = async (event) => {
    event.preventDefault(); setState({ busy: true, error: "", saved: null });
    try {
      let response;
      if (type === "article") response = await creatorStudioApi.createArticle(draft);
      if (type === "story") response = await creatorStudioApi.createStory({ ...draft, storySections: [{ id: clientKey(), type: "text", heading: draft.title, body: draft.body }] });
      if (type === "course") {
        response = await creatorStudioApi.createCourse(draft);
        await creatorStudioApi.saveCurriculum(response.data._id, { expectedStructuralVersion: response.data.structuralVersion, modules });
      }
      setState({ busy: false, error: "", saved: { id: response.data._id, type } });
      onCreated?.();
    } catch (error) { setState({ busy: false, error: error.message, saved: null }); }
  };
  const submit = async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try { if (type === "course") await creatorStudioApi.submitCourse(state.saved.id); else await creatorStudioApi.submit(type, state.saved.id); setState((current) => ({ ...current, busy: false, saved: { ...current.saved, submitted: true } })); onCreated?.(); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };
  if (!type) return <div className="creator-create-choice"><h2>Start with what you know best.</h2><p>Choose a format that is available today. Video, Podcast, and downloadable Resource publishing will open when secure media delivery is configured.</p><div>{["article", "story", "course"].map((item) => <button key={item} type="button" onClick={() => setType(item)}>{item}</button>)}</div><p className="creator-notice">Media formats prepared but not operational: video, podcast, resource.</p></div>;
  if (state.saved) return <div className="creator-empty"><p className="creator-kicker">Draft saved</p><h2>{state.saved.submitted ? "Submitted for review" : "Your work is safe."}</h2><p>{state.saved.submitted ? "The editorial team will review it before publication." : "Submit when the draft is ready for editorial review."}</p>{!state.saved.submitted && <button className="creator-primary-action" type="button" onClick={submit} disabled={state.busy}>Submit for review</button>}<button className="creator-text-action" type="button" onClick={() => { setType(""); setDraft(initialDraft); setState({ busy: false, error: "", saved: null }); }}>Create another</button></div>;
  return (
    <form className="creator-form creator-create-form" onSubmit={save}>
      <div className="creator-section-heading"><div><p className="creator-kicker">New {type}</p><h2>Save a thoughtful first draft</h2></div><button type="button" className="creator-text-action" onClick={() => setType("")}>Change format</button></div>
      <label>Title <input name="title" value={draft.title} onChange={update} required /></label><label>Description <textarea name="description" value={draft.description} onChange={update} required /></label>
      {type !== "course" && <label>Draft content <textarea name="body" value={draft.body} onChange={update} required /></label>}
      {type === "article" && <label>Category <input name="category" value={draft.category} onChange={update} /></label>}
      {type === "story" && <label>Recommended reading layout <select name="storyLayout" value={draft.storyLayout} onChange={update}>{STORY_LAYOUTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {type === "course" && <><label>Language <input name="language" value={draft.language} onChange={update} required /></label><label>Level <select name="level" value={draft.level} onChange={update}><option value="all_levels">All Levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><div className="creator-curriculum"><div className="creator-section-heading"><h3>Curriculum</h3><button type="button" onClick={() => setModules((current) => [...current, newModule()])}>Add Module</button></div>{modules.map((module, moduleIndex) => <fieldset key={module.stableKey}><legend>Module {moduleIndex + 1}</legend><label>Module title <input value={module.title} onChange={(event) => updateModule(moduleIndex, "title", event.target.value)} required /></label>{module.lessons.map((lesson, lessonIndex) => <div className="creator-lesson-draft" key={lesson.stableKey}><h4>Lesson {lessonIndex + 1}</h4><label>Lesson title <input value={lesson.title} onChange={(event) => updateLesson(moduleIndex, lessonIndex, "title", event.target.value)} required /></label><label>Format <select value={lesson.lessonType} onChange={(event) => updateLesson(moduleIndex, lessonIndex, "lessonType", event.target.value)}><option value="text">Text</option><option value="video">Video</option><option value="audio">Audio</option><option value="mixed">Mixed</option><option value="practice">Practice</option></select></label><label>Lesson notes <textarea value={lesson.body} onChange={(event) => updateLesson(moduleIndex, lessonIndex, "body", event.target.value)} /></label><label className="creator-check"><input type="checkbox" checked={lesson.isPreview} onChange={(event) => updateLesson(moduleIndex, lessonIndex, "isPreview", event.target.checked)} /> Free preview lesson</label></div>)}<button type="button" onClick={() => addLesson(moduleIndex)}>Add Lesson</button></fieldset>)}</div></>}
      <label>Access <select name="accessLevel" value={draft.accessLevel} onChange={update}><option value="free">Free</option><option value="premium">MyJourney Premium</option></select></label>
      <label className="creator-check"><input type="checkbox" name="confirmContentRights" checked={draft.confirmContentRights} onChange={update} required /> I confirm I hold the rights to this content and its assets.</label>
      {state.error && <p className="creator-notice" role="alert">{state.error}</p>}<button type="submit" className="creator-primary-action" disabled={state.busy}>{state.busy ? "Saving…" : "Save draft"}</button>
    </form>
  );
}

function EditFlow({ contentType, item, onDone }) {
  const [draft, setDraft] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "" });
  useEffect(() => {
    let active = true;
    creatorStudioApi.preview(contentType, item._id).then((response) => {
      if (active) {
        const value = response.data;
        setDraft({ title: value.title || "", description: value.description || "", body: value.body || "", accessLevel: value.accessLevel || "free", category: value.category || "Life", storyLayout: value.storyLayout || value.storyLayoutPreset || "classic-reader", language: value.language || "English", level: value.level || "all_levels" });
        setState({ loading: false, busy: false, error: "" });
      }
    }).catch((error) => active && setState({ loading: false, busy: false, error: error.message }));
    return () => { active = false; };
  }, [contentType, item._id]);
  const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      if (contentType === "article") await creatorStudioApi.updateArticle(item._id, draft);
      else if (contentType === "story") await creatorStudioApi.updateStory(item._id, draft);
      else if (contentType === "course") await creatorStudioApi.updateCourse(item._id, draft);
      onDone(true);
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };
  if (state.loading) return <p className="creator-empty" role="status">Opening draft…</p>;
  if (!draft) return <div className="creator-empty" role="alert"><h2>Draft unavailable</h2><p>{state.error}</p><button type="button" onClick={() => onDone(false)}>Back</button></div>;
  return <form className="creator-form creator-create-form" onSubmit={save}><div className="creator-section-heading"><div><p className="creator-kicker">Edit {contentType}</p><h2>{item.title}</h2></div><button type="button" className="creator-text-action" onClick={() => onDone(false)}>Cancel</button></div><label>Title <input name="title" value={draft.title} onChange={update} required /></label><label>Description <textarea name="description" value={draft.description} onChange={update} required /></label>{contentType !== "course" && <label>Draft content <textarea name="body" value={draft.body} onChange={update} required /></label>}{contentType === "article" && <label>Category <input name="category" value={draft.category} onChange={update} /></label>}{contentType === "story" && <label>Recommended reading layout <select name="storyLayout" value={draft.storyLayout} onChange={update}>{STORY_LAYOUTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}{contentType === "course" && <><label>Language <input name="language" value={draft.language} onChange={update} /></label><label>Level <select name="level" value={draft.level} onChange={update}><option value="all_levels">All Levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><p className="creator-notice">This edits Course metadata. Curriculum changes continue through the versioned Module and Lesson editor when creating the draft.</p></>}<label>Access <select name="accessLevel" value={draft.accessLevel} onChange={update}><option value="free">Free</option><option value="premium">MyJourney Premium</option></select></label>{state.error && <p className="creator-notice" role="alert">{state.error}</p>}<button className="creator-primary-action" type="submit" disabled={state.busy}>{state.busy ? "Saving…" : "Save changes"}</button></form>;
}

function ProfileEditor({ slug }) {
  const [form, setForm] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "", message: "" });
  useEffect(() => {
    let active = true;
    creatorApi.get(slug).then((response) => { const profile = response.data; if (active) { setForm({ displayName: profile.displayName || "", headline: profile.headline || "", biography: profile.biography || "", profileImage: profile.profileImage || "", coverImage: profile.coverImage || "", specialties: (profile.specialties || []).join(", "), languages: (profile.languages || []).join(", "), creatorTypes: (profile.creatorTypes || []).join(", "), moduleOrder: (profile.modules || []).join(", "), publicLinks: (profile.publicLinks || []).map((link) => `${link.label} | ${link.url}`).join("\n") }); setState({ loading: false, busy: false, error: "", message: "" }); } }).catch((error) => active && setState({ loading: false, busy: false, error: error.message, message: "" }));
    return () => { active = false; };
  }, [slug]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const split = (value) => value.split(",").map((entry) => entry.trim()).filter(Boolean);
  const save = async (event) => {
    event.preventDefault(); setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      const publicLinks = form.publicLinks.split("\n").map((line) => { const [label, ...url] = line.split("|"); return { label: label?.trim(), url: url.join("|").trim() }; }).filter((link) => link.url);
      await creatorStudioApi.updateProfile({ ...form, specialties: split(form.specialties), languages: split(form.languages), creatorTypes: split(form.creatorTypes), moduleOrder: split(form.moduleOrder), publicLinks });
      setState({ loading: false, busy: false, error: "", message: "Public Creator profile saved." });
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };
  if (state.loading) return <p className="creator-empty" role="status">Opening public profile…</p>;
  if (!form) return <p className="creator-notice" role="alert">{state.error}</p>;
  return <form className="creator-form" onSubmit={save}><div className="creator-section-heading"><div><p className="creator-kicker">Public presence</p><h2>Creator profile</h2></div><Link to={`/creators/${slug}`}>View public profile</Link></div><label>Public name <input name="displayName" value={form.displayName} onChange={update} required /></label><label>Headline <input name="headline" value={form.headline} onChange={update} required /></label><label>Biography <textarea name="biography" value={form.biography} onChange={update} required /></label><label>Profile image URL <input type="url" name="profileImage" value={form.profileImage} onChange={update} /></label><label>Cover image URL <input type="url" name="coverImage" value={form.coverImage} onChange={update} /></label><label>Specialties, comma separated <input name="specialties" value={form.specialties} onChange={update} /></label><label>Languages, comma separated <input name="languages" value={form.languages} onChange={update} /></label><label>Creator types, comma separated <input name="creatorTypes" value={form.creatorTypes} onChange={update} /></label><label>Profile modules, comma separated <input name="moduleOrder" value={form.moduleOrder} onChange={update} aria-describedby="module-help" /></label><small id="module-help">Supported modules: courses, videos, articles, stories, podcasts, resources, about.</small><label>Public links, one “Label | https://…” per line <textarea name="publicLinks" value={form.publicLinks} onChange={update} /></label>{state.error && <p className="creator-notice" role="alert">{state.error}</p>}{state.message && <p className="creator-notice" role="status">{state.message}</p>}<button className="creator-primary-action" type="submit" disabled={state.busy}>{state.busy ? "Saving…" : "Save public profile"}</button></form>;
}

export default function CreatorStudio() {
  const { creatorAccess } = useAuth();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [contentType, setContentType] = useState("article");
  const [content, setContent] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [editing, setEditing] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [state, setState] = useState({ loading: true, error: "", message: "" });
  const refresh = () => Promise.all([creatorStudioApi.overview(), creatorStudioApi.content({ contentType })]).then(([overviewResponse, contentResponse]) => { setOverview(overviewResponse.data); setContent(contentResponse.items || []); setState({ loading: false, error: "", message: "" }); }).catch((error) => setState({ loading: false, error: error.message, message: "" }));
  useEffect(() => { if (creatorAccess?.studioAvailable) refresh(); else setState((current) => ({ ...current, loading: false })); }, [creatorAccess?.studioAvailable, contentType]);
  useEffect(() => { if (creatorAccess?.creatorSlug) creatorApi.get(creatorAccess.creatorSlug).then((response) => setFeatured((response.data?.featuredContent || []).map((item) => ({ contentType: item.contentType, contentId: String(item.contentId) })))).catch(() => {}); }, [creatorAccess?.creatorSlug]);
  useEffect(() => { if (tab === "analytics" && !analytics) creatorStudioApi.analytics().then((response) => setAnalytics(response.data)).catch((error) => setState((current) => ({ ...current, error: error.message }))); if (tab === "earnings" && !earnings) creatorStudioApi.earnings().then((response) => setEarnings(response.data)).catch((error) => setState((current) => ({ ...current, error: error.message }))); }, [analytics, earnings, tab]);
  const submit = async (item) => { try { await creatorStudioApi.submit(contentType, item._id); setState((current) => ({ ...current, message: "Content submitted for review." })); refresh(); } catch (error) { setState((current) => ({ ...current, error: error.message })); } };
  const toggleFeatured = async (item) => {
    const present = featured.some((entry) => entry.contentType === contentType && entry.contentId === String(item._id));
    const next = present ? featured.filter((entry) => !(entry.contentType === contentType && entry.contentId === String(item._id))) : [...featured, { contentType, contentId: String(item._id) }];
    try { await creatorStudioApi.updateFeatured(next); setFeatured(next); setState((current) => ({ ...current, message: present ? "Removed from your featured shelf." : "Added to your featured shelf.", error: "" })); }
    catch (error) { setState((current) => ({ ...current, error: error.message })); }
  };
  if (!creatorAccess?.studioAvailable) return <main className="creator-page"><section className="creator-application-state"><p className="creator-kicker">Creator Studio</p><h1>{creatorAccess?.applicationStatus ? creatorAccess.applicationStatus.replaceAll("_", " ") : "Creator access required"}</h1><p>{creatorAccess?.applicationMessage || "Apply with your existing MyJourney account. Creator access is activated only after review and verification."}</p><Link className="creator-primary-action" to="/creators/apply">Creator application</Link></section></main>;
  return (
    <main className="creator-studio">
      <header className="creator-studio__header"><div><p className="creator-kicker">Private Creator workspace</p><h1>Creator Studio</h1><p>Draft, submit, understand engagement, and manage your public presence.</p></div><Link to={`/creators/${creatorAccess.creatorSlug}`}>View public profile</Link></header>
      <nav className="creator-studio__tabs" aria-label="Creator Studio sections">{["overview", "create", "content", "analytics", "earnings", "profile"].map((item) => <button type="button" key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {state.error && <p className="creator-notice" role="alert">{state.error}</p>}{state.message && <p className="creator-notice" role="status">{state.message}</p>}
      {state.loading ? <p className="creator-empty" role="status">Opening Creator Studio…</p> : <section className="creator-studio__workspace">
        {tab === "overview" && <><div className="creator-section-heading"><div><p className="creator-kicker">At a glance</p><h2>Your publishing flow</h2></div></div><StatusSummary statuses={overview?.contentStatus} />{!Object.values(overview?.contentStatus || {}).some(Boolean) && <div className="creator-empty"><h2>You haven’t created anything yet.</h2><p>Start with what you know best.</p><button className="creator-primary-action" onClick={() => setTab("create")}>Create</button></div>}</>}
        {tab === "create" && <CreateFlow onCreated={refresh} />}
        {tab === "content" && (editing ? <EditFlow contentType={contentType} item={editing} onDone={(saved) => { setEditing(null); if (saved) refresh(); }} /> : <><div className="creator-content-toolbar" aria-label="Content format">{CONTENT_TYPES.map((type) => <button key={type} type="button" aria-pressed={contentType === type} onClick={() => setContentType(type)}>{type}</button>)}</div>{content.length ? <div className="creator-content-list">{content.map((item) => { const workflow = item.creatorWorkflowStatus || item.workflowStatus; const editable = ["draft", "changes_requested"].includes(workflow); const published = workflow === "published" || item.status === "published" || item.publicationStatus === "published"; const isFeatured = featured.some((entry) => entry.contentType === contentType && entry.contentId === String(item._id)); return <article key={item._id}><div><p className="creator-kicker">{workflow}</p><h3>{item.title}</h3><p>{item.description}</p></div><div className="creator-content-list__actions">{editable && <><button type="button" onClick={() => setEditing(item)}>Edit</button><button type="button" onClick={() => submit(item)}>Submit</button></>}{published && <button type="button" aria-pressed={isFeatured} onClick={() => toggleFeatured(item)}>{isFeatured ? "Featured" : "Feature"}</button>}</div></article>; })}</div> : <div className="creator-empty"><h2>No {contentType} drafts yet.</h2><p>Create when you have something useful to share.</p></div>}</>)}
        {tab === "analytics" && <><p className="creator-kicker">Aggregated, privacy-safe</p><h2>Qualified engagement</h2><p>{analytics?.privacy}</p><div className="creator-analytics-list">{(analytics?.aggregates || []).map((row) => <article key={row.contentType}><h3>{row.contentType}</h3><p>{row.qualifiedEvents} qualified events</p><p>{Math.round(row.qualifiedDurationSeconds / 60)} qualified minutes</p></article>)}</div></>}
        {tab === "earnings" && <div className="creator-empty"><p className="creator-kicker">Creator economy</p><h2>{earnings?.message || "Creator Earnings Program — not yet activated."}</h2><p>Raw views are never treated as money. No payout, currency amount, KYC, or bank connection is currently active.</p></div>}
        {tab === "profile" && <ProfileEditor slug={creatorAccess.creatorSlug} />}
      </section>}
    </main>
  );
}
