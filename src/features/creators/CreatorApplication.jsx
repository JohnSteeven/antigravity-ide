import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { creatorApi } from "../../services/apiService";
import "./creators.css";

const initial = { legalName: "", displayName: "", headline: "", biography: "", country: "", languages: "", specialties: "", yearsExperience: "", professionalBackground: "", creatorTypes: "", intendedTopics: "", intendedFormats: "", motivation: "", acceptTerms: false, confirmContentRights: false };
const split = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function CreatorApplication() {
  const [form, setForm] = useState(initial);
  const [application, setApplication] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, message: "", error: "" });
  useEffect(() => { creatorApi.myApplication().then((response) => { setApplication(response.data); setState((current) => ({ ...current, loading: false })); }).catch(() => setState((current) => ({ ...current, loading: false }))); }, []);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    const payload = { ...form, languages: split(form.languages), specialties: split(form.specialties), creatorTypes: split(form.creatorTypes), intendedTopics: split(form.intendedTopics), intendedFormats: split(form.intendedFormats) };
    try { const response = application?.status === "more_info_required" ? await creatorApi.updateApplication(payload) : await creatorApi.apply(payload); setApplication(response.data); setState({ loading: false, busy: false, message: "Your Creator application has been submitted for review.", error: "" }); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };
  if (state.loading) return <main className="creator-page"><p className="creator-empty" role="status">Checking your Creator application…</p></main>;
  if (application && application.status !== "more_info_required") return <main className="creator-page"><section className="creator-application-state"><p className="creator-kicker">Creator application</p><h1>{application.status.replaceAll("_", " ")}</h1><p>{application.applicantMessage || "Your application is safely with the MyJourney review team."}</p><p>Submitted {new Date(application.submittedAt).toLocaleDateString()}</p><Link to="/creators">Explore Creators</Link></section></main>;
  return (
    <main className="creator-page creator-application">
      <section className="creator-hero creator-hero--compact"><p className="creator-kicker">Create with MyJourney</p><h1>Share what you know, with care.</h1><p>Your existing MyJourney account remains your identity. Verification information stays private.</p></section>
      {application?.applicantMessage && <p className="creator-notice" role="status">Review request: {application.applicantMessage}</p>}
      <form onSubmit={submit} className="creator-form" aria-describedby="creator-form-note">
        <div className="creator-form__section"><h2>Identity</h2><label>Legal or real name <input name="legalName" value={form.legalName} onChange={update} required /></label><label>Public Creator name <input name="displayName" value={form.displayName} onChange={update} required /></label><label>Country <input name="country" value={form.country} onChange={update} /></label></div>
        <div className="creator-form__section"><h2>Public profile</h2><label>Creator headline <input name="headline" value={form.headline} onChange={update} minLength="10" maxLength="180" required /></label><label>Biography <textarea name="biography" value={form.biography} onChange={update} minLength="80" required /></label><label>Languages, comma separated <input name="languages" value={form.languages} onChange={update} required /></label><label>Areas of expertise, comma separated <input name="specialties" value={form.specialties} onChange={update} required /></label></div>
        <div className="creator-form__section"><h2>Experience and intent</h2><label>Years of experience <input type="number" min="0" max="80" name="yearsExperience" value={form.yearsExperience} onChange={update} /></label><label>Professional background <textarea name="professionalBackground" value={form.professionalBackground} onChange={update} /></label><label>Creator types <input name="creatorTypes" value={form.creatorTypes} onChange={update} placeholder="Writer, Coding educator, Podcaster" /></label><label>Topics you plan to cover <input name="intendedTopics" value={form.intendedTopics} onChange={update} /></label><label>Formats you plan to create <input name="intendedFormats" value={form.intendedFormats} onChange={update} /></label><label>Why do you want to join? <textarea name="motivation" value={form.motivation} onChange={update} minLength="40" required /></label></div>
        <div className="creator-form__section creator-form__agreements" id="creator-form-note"><label><input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={update} required /> I agree to the Creator Terms and content rules.</label><label><input type="checkbox" name="confirmContentRights" checked={form.confirmContentRights} onChange={update} required /> I will submit only content and assets I have the rights to use.</label></div>
        {state.error && <p className="creator-notice" role="alert">{state.error}</p>}{state.message && <p className="creator-notice" role="status">{state.message}</p>}
        <button className="creator-primary-action" type="submit" disabled={state.busy}>{state.busy ? "Submitting…" : application ? "Resubmit information" : "Submit application"}</button>
      </form>
    </main>
  );
}
