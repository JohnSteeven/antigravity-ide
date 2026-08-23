import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { creatorApi } from "../../services/apiService";
import { ALL_COUNTRY_CODES } from "../../utils/countryCodes";
import "./creators.css";

const CREATOR_TYPE_OPTIONS = [
  { value: "writer", label: "Writer" },
  { value: "storyteller", label: "Storyteller" },
  { value: "educator", label: "Educator" },
  { value: "podcaster", label: "Podcaster" },
  { value: "specialist", label: "Industry specialist" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" },
];

const FORMAT_OPTIONS = [
  { value: "article", label: "Articles" },
  { value: "story", label: "Stories" },
  { value: "course", label: "Courses" },
  { value: "video", label: "Video" },
  { value: "podcast", label: "Podcast" },
  { value: "resource", label: "Resources" },
  { value: "tutorial", label: "Tutorials" },
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Spanish", "French", "German", "Arabic", "Portuguese", "Mandarin"];

const STAGES = [
  { key: "identity", label: "Identity" },
  { key: "expertise", label: "Expertise" },
  { key: "experience", label: "Experience" },
  { key: "create", label: "Create" },
  { key: "review", label: "Review" },
];

const APPLICATION_STATUS_PRESENTATION = {
  applied: {
    title: "Application received",
    message: "Your application has been received and is in the MyJourney review process.",
  },
  under_review: {
    title: "Application under review",
    message: "The MyJourney review team is currently reviewing your application.",
  },
  interview: {
    title: "Interview stage",
    message: "Your application is still being reviewed and has moved to the interview stage.",
  },
  verification: {
    title: "Verification in progress",
    message: "Your application is still being reviewed while verification is completed.",
  },
  approved: {
    title: "Application approved",
    message: "Your application was approved. Creator activation and workspace setup are pending.",
  },
  active: {
    title: "You're an active MyJourney Creator.",
    message: "Your public Creator profile and Creator Studio are ready.",
  },
  rejected: {
    title: "Application not approved",
    message: "This application was not approved and is no longer under review.",
  },
  restricted: {
    title: "Creator access restricted",
    message: "Your Creator access is currently restricted.",
  },
  suspended: {
    title: "Creator access suspended",
    message: "Your Creator access is currently suspended.",
  },
  deactivated: {
    title: "Creator profile deactivated",
    message: "Your Creator profile is currently deactivated.",
  },
};

const normalizeApplicationStatus = (status) => typeof status === "string" ? status.trim().toLowerCase() : "";

const initial = {
  legalName: "",
  displayName: "",
  headline: "",
  biography: "",
  country: "",
  languages: [],
  specialties: [],
  yearsExperience: "",
  professionalBackground: "",
  creatorTypes: [],
  intendedTopics: [],
  intendedFormats: [],
  portfolioLinks: [{ label: "Portfolio", url: "" }],
  workSamples: [{ label: "Work sample", url: "" }],
  motivation: "",
  acceptTerms: false,
  confirmContentRights: false,
};

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const displayList = (value) => asArray(value).length ? value.join(", ") : "Not provided";
const cleanLinks = (links) => links
  .map((link) => ({ label: String(link.label || "").trim(), url: String(link.url || "").trim() }))
  .filter((link) => link.url);

const hydrateApplication = (application) => ({
  ...initial,
  displayName: application?.displayName || "",
  headline: application?.headline || "",
  biography: application?.biography || "",
  languages: asArray(application?.languages),
  specialties: asArray(application?.specialties),
  creatorTypes: asArray(application?.creatorTypes),
  intendedTopics: asArray(application?.intendedTopics),
  intendedFormats: asArray(application?.intendedFormats),
});

const MultiValueField = ({ name, legend, helper, values, options = [], draft, onDraftChange, onToggle, onAdd, required = false, placeholder = "Type a value" }) => {
  const normalizedOptions = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  const fixedValues = new Set(normalizedOptions.map((option) => option.value));
  const customValues = values.filter((value) => !fixedValues.has(value));
  const helpId = `${name}-help`;

  return (
    <fieldset className="creator-multi-field" aria-describedby={helpId} aria-required={required}>
      <legend>{legend}{required && <span className="creator-field-required" aria-hidden="true"> *</span>}</legend>
      {helper && <p id={helpId}>{helper}</p>}
      {!!normalizedOptions.length && <div className="creator-choice-list">
        {normalizedOptions.map((option) => {
          const selected = values.includes(option.value);
          return <button key={option.value} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onToggle(name, option.value)}>{option.label}</button>;
        })}
      </div>}
      {!!customValues.length && <ul className="creator-token-list" aria-label={`Selected ${legend.toLowerCase()}`}>
        {customValues.map((value) => <li key={value}><span>{value}</span><button type="button" aria-label={`Remove ${value}`} onClick={() => onToggle(name, value)}>×</button></li>)}
      </ul>}
      {onAdd && <label className="creator-token-entry">
        <span>Add {legend.toLowerCase()}</span>
        <span className="creator-token-entry__controls">
          <input value={draft} onChange={(event) => onDraftChange(name, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAdd(name); } }} placeholder={placeholder} />
          <button type="button" onClick={() => onAdd(name)}>Add</button>
        </span>
      </label>}
    </fieldset>
  );
};

const LinkCollection = ({ name, legend, helper, items, onChange, onAdd, onRemove }) => (
  <fieldset className="creator-link-field">
    <legend>{legend}</legend>
    <p>{helper}</p>
    <div className="creator-link-list">
      {items.map((item, index) => <div className="creator-link-row" key={`${name}-${index}`}>
        <label><span>Link label</span><input value={item.label} onChange={(event) => onChange(name, index, "label", event.target.value)} maxLength="80" placeholder={legend} /></label>
        <label><span>URL</span><input type="url" value={item.url} onChange={(event) => onChange(name, index, "url", event.target.value)} maxLength="500" placeholder="https://" /></label>
        <button type="button" className="creator-link-remove" onClick={() => onRemove(name, index)}>Remove</button>
      </div>)}
    </div>
    <button type="button" className="creator-add-link" onClick={() => onAdd(name)}>Add another link</button>
  </fieldset>
);

const ReviewBlock = ({ title, step, onEdit, children }) => (
  <section className="creator-review-block">
    <header><h3>{title}</h3><button type="button" onClick={() => onEdit(step)}>Edit</button></header>
    {children}
  </section>
);

export default function CreatorApplication() {
  const { creatorAccess } = useAuth();
  const [form, setForm] = useState(initial);
  const [application, setApplication] = useState(null);
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [drafts, setDrafts] = useState({ languages: "", specialties: "", intendedTopics: "" });
  const [stepError, setStepError] = useState("");
  const [state, setState] = useState({ loading: true, busy: false, message: "", error: "" });
  const applicationStatus = normalizeApplicationStatus(application?.status)
    || normalizeApplicationStatus(creatorAccess?.applicationStatus)
    || normalizeApplicationStatus(creatorAccess?.creatorStatus);

  useEffect(() => {
    creatorApi.myApplication().then((response) => {
      const currentApplication = response.data;
      setApplication(currentApplication);
      if (normalizeApplicationStatus(currentApplication?.status) === "more_info_required") setForm(hydrateApplication(currentApplication));
      setState((current) => ({ ...current, loading: false }));
    }).catch(() => setState((current) => ({ ...current, loading: false })));
  }, []);

  const clearErrors = () => {
    setStepError("");
    setState((current) => ({ ...current, error: "" }));
  };

  const update = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    clearErrors();
  };

  const toggleValue = (name, value) => {
    setForm((current) => ({ ...current, [name]: current[name].includes(value) ? current[name].filter((item) => item !== value) : [...current[name], value] }));
    clearErrors();
  };

  const addDraft = (name) => {
    const value = drafts[name].trim();
    if (!value) return;
    setForm((current) => ({ ...current, [name]: current[name].some((item) => item.toLowerCase() === value.toLowerCase()) ? current[name] : [...current[name], value] }));
    setDrafts((current) => ({ ...current, [name]: "" }));
    clearErrors();
  };

  const updateLink = (name, index, field, value) => {
    setForm((current) => ({ ...current, [name]: current[name].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
    clearErrors();
  };

  const addLink = (name) => setForm((current) => ({ ...current, [name]: [...current[name], { label: name === "portfolioLinks" ? "Portfolio" : "Work sample", url: "" }] }));
  const removeLink = (name, index) => setForm((current) => ({ ...current, [name]: current[name].filter((_, itemIndex) => itemIndex !== index) }));

  const validationMessage = (stage) => {
    if (stage === 0 && (form.legalName.trim().length < 2 || form.displayName.trim().length < 2)) return "Enter your legal name and public Creator name before continuing.";
    if (stage === 1 && form.headline.trim().length < 10) return "Your Creator headline must be at least 10 characters.";
    if (stage === 1 && form.biography.trim().length < 80) return "Your biography must be at least 80 characters.";
    if (stage === 1 && !form.languages.length) return "Choose or add at least one language.";
    if (stage === 1 && !form.specialties.length) return "Add at least one area of expertise.";
    if (stage === 3 && form.motivation.trim().length < 40) return "Tell us why you want to create on MyJourney in at least 40 characters.";
    if (stage === 4 && (!form.acceptTerms || !form.confirmContentRights)) return "Accept the Creator Terms and confirm your content rights before submitting.";
    return "";
  };

  const moveToStep = (nextStep) => {
    setStepError("");
    setStep(nextStep);
    window.requestAnimationFrame(() => document.getElementById(`creator-stage-${STAGES[nextStep].key}`)?.focus());
  };

  const continueApplication = () => {
    const error = validationMessage(step);
    if (error) { setStepError(error); return; }
    const nextStep = Math.min(step + 1, STAGES.length - 1);
    setFurthestStep((current) => Math.max(current, nextStep));
    moveToStep(nextStep);
  };

  const submit = async (event) => {
    event.preventDefault();
    const invalidStep = STAGES.findIndex((_, index) => validationMessage(index));
    if (invalidStep >= 0) {
      setFurthestStep((current) => Math.max(current, invalidStep));
      moveToStep(invalidStep);
      setStepError(validationMessage(invalidStep));
      return;
    }

    setState((current) => ({ ...current, busy: true, error: "", message: "" }));
    const payload = {
      ...form,
      yearsExperience: form.yearsExperience === "" ? 0 : Number(form.yearsExperience),
      portfolioLinks: cleanLinks(form.portfolioLinks),
      workSamples: cleanLinks(form.workSamples),
    };

    try {
      const response = applicationStatus === "more_info_required" ? await creatorApi.updateApplication(payload) : await creatorApi.apply(payload);
      setApplication(response.data);
      setState({ loading: false, busy: false, message: "Your Creator application has been submitted for review.", error: "" });
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error.message }));
    }
  };

  if (state.loading) return <main className="creator-page"><p className="creator-empty" role="status">Checking your Creator application…</p></main>;
  if (applicationStatus && applicationStatus !== "more_info_required") {
    const presentation = APPLICATION_STATUS_PRESENTATION[applicationStatus] || {
      title: "Creator application status",
      message: `Your Creator application status is ${applicationStatus.replaceAll("_", " ")}.`,
    };
    const submittedDate = application?.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "";
    const showApplicantMessage = application?.applicantMessage && applicationStatus !== "active";
    const creatorSlug = typeof creatorAccess?.creatorSlug === "string" ? creatorAccess.creatorSlug.trim() : "";

    return <main className="creator-page creator-application-status"><section className="creator-application-state"><p className="creator-kicker">Creator application</p><h1>{presentation.title}</h1><p>{presentation.message}</p>{showApplicantMessage && <p>{application.applicantMessage}</p>}{submittedDate && <p>Submitted {submittedDate}</p>}<div className="creator-application-state__actions">{applicationStatus === "active" ? <><Link className="creator-primary-action" to="/creator-studio">Open Creator Studio</Link>{creatorSlug && <Link className="creator-text-action" to={`/creators/${creatorSlug}`}>View public profile</Link>}</> : <Link to="/creators">Explore Creators</Link>}</div></section></main>;
  }

  return (
    <main className="creator-page creator-application">
      <section className="creator-hero creator-hero--compact"><p className="creator-kicker">Create with MyJourney</p><h1>Share what you know, with care.</h1><p id="creator-application-intro">Your existing MyJourney account remains your identity. Verification information stays private.</p></section>
      {applicationStatus === "more_info_required" && <p className="creator-notice" role="status"><strong>Additional information is required.</strong> {application?.applicantMessage || "Update the application below and resubmit it for review."}</p>}

      <form onSubmit={submit} className="creator-form creator-application__workspace" aria-describedby="creator-application-intro">
        <nav className="creator-application__progress" aria-label="Creator application progress">
          <ol>{STAGES.map((stage, index) => <li key={stage.key} className={index < step ? "is-complete" : index === step ? "is-current" : ""}><button type="button" disabled={index > furthestStep} aria-current={index === step ? "step" : undefined} onClick={() => moveToStep(index)}><span>{index + 1}</span>{stage.label}</button></li>)}</ol>
        </nav>

        {step === 0 && <section className="creator-form__section creator-form__stage" aria-labelledby="creator-stage-identity">
          <header><p className="creator-kicker">Step 1 of 5</p><h2 id="creator-stage-identity" tabIndex="-1">Identity</h2><p>Tell the review team who you are and choose the name readers will see.</p></header>
          <div className="creator-form__grid">
            <label>Legal or real name <input name="legalName" value={form.legalName} onChange={update} minLength="2" maxLength="160" required autoComplete="name" /></label>
            <label>Public Creator name <input name="displayName" value={form.displayName} onChange={update} minLength="2" maxLength="100" required /></label>
          </div>
          <label>Country <select name="country" value={form.country} onChange={update}><option value="">Select a country</option>{ALL_COUNTRY_CODES.map((country) => <option key={country.country} value={country.name}>{country.flag} {country.name}</option>)}</select></label>
        </section>}

        {step === 1 && <section className="creator-form__section creator-form__stage" aria-labelledby="creator-stage-expertise">
          <header><p className="creator-kicker">Step 2 of 5</p><h2 id="creator-stage-expertise" tabIndex="-1">Expertise and public profile</h2><p>Describe the perspective, practice, or knowledge readers can expect from you.</p></header>
          <label>Creator headline <input name="headline" value={form.headline} onChange={update} minLength="10" maxLength="180" required /><small>A concise description of your work and point of view.</small></label>
          <label>Biography <textarea name="biography" value={form.biography} onChange={update} minLength="80" maxLength="3000" required /><small>At least 80 characters.</small></label>
          <MultiValueField name="languages" legend="Languages" helper="Choose every language you can create in." values={form.languages} options={LANGUAGE_OPTIONS} draft={drafts.languages} onDraftChange={(name, value) => setDrafts((current) => ({ ...current, [name]: value }))} onToggle={toggleValue} onAdd={addDraft} required placeholder="Add another language" />
          <MultiValueField name="specialties" legend="Areas of expertise" helper="Add focused areas that help readers understand what you know." values={form.specialties} draft={drafts.specialties} onDraftChange={(name, value) => setDrafts((current) => ({ ...current, [name]: value }))} onToggle={toggleValue} onAdd={addDraft} required placeholder="Example: Software engineering" />
        </section>}

        {step === 2 && <section className="creator-form__section creator-form__stage" aria-labelledby="creator-stage-experience">
          <header><p className="creator-kicker">Step 3 of 5</p><h2 id="creator-stage-experience" tabIndex="-1">Experience and previous work</h2><p>Share the background and public examples that support your application.</p></header>
          <aside className="creator-verification-note"><strong>What helps the review</strong><p>Professional background, portfolios, and relevant writing, video, course, or podcast samples give the team useful context.</p></aside>
          <label>Years of experience <input type="number" min="0" max="80" name="yearsExperience" value={form.yearsExperience} onChange={update} inputMode="numeric" /></label>
          <label>Professional background <textarea name="professionalBackground" value={form.professionalBackground} onChange={update} maxLength="3000" placeholder="Roles, practice, teaching, lived experience, or other relevant background" /></label>
          <LinkCollection name="portfolioLinks" legend="Portfolio and professional links" helper="Add a portfolio, professional profile, or relevant public page." items={form.portfolioLinks} onChange={updateLink} onAdd={addLink} onRemove={removeLink} />
          <LinkCollection name="workSamples" legend="Previous work samples" helper="Add representative writing, video, course, podcast, or other published work." items={form.workSamples} onChange={updateLink} onAdd={addLink} onRemove={removeLink} />
        </section>}

        {step === 3 && <section className="creator-form__section creator-form__stage" aria-labelledby="creator-stage-create">
          <header><p className="creator-kicker">Step 4 of 5</p><h2 id="creator-stage-create" tabIndex="-1">What you want to create</h2><p>Choose the roles and formats that best describe your intended contribution.</p></header>
          <MultiValueField name="creatorTypes" legend="Creator types" helper="Select every role that fits your work." values={form.creatorTypes} options={CREATOR_TYPE_OPTIONS} onToggle={toggleValue} />
          <MultiValueField name="intendedTopics" legend="Topics you plan to cover" helper="Add topics in your own words." values={form.intendedTopics} draft={drafts.intendedTopics} onDraftChange={(name, value) => setDrafts((current) => ({ ...current, [name]: value }))} onToggle={toggleValue} onAdd={addDraft} placeholder="Example: Career transitions" />
          <MultiValueField name="intendedFormats" legend="Formats you plan to create" helper="Choose the formats that match your work." values={form.intendedFormats} options={FORMAT_OPTIONS} onToggle={toggleValue} />
          <label>Why do you want to join? <textarea name="motivation" value={form.motivation} onChange={update} minLength="40" maxLength="3000" required /><small>Tell us what you hope to contribute and who it may help.</small></label>
        </section>}

        {step === 4 && <section className="creator-form__section creator-form__stage creator-form__review" aria-labelledby="creator-stage-review">
          <header><p className="creator-kicker">Step 5 of 5</p><h2 id="creator-stage-review" tabIndex="-1">Review and submit</h2><p>Check the public-facing details and your planned contribution before submitting.</p></header>
          <div className="creator-review-grid">
            <ReviewBlock title="Public identity" step={0} onEdit={moveToStep}><dl><div><dt>Creator name</dt><dd>{form.displayName || "Not provided"}</dd></div><div><dt>Headline</dt><dd>{form.headline || "Not provided"}</dd></div></dl></ReviewBlock>
            <ReviewBlock title="Expertise" step={1} onEdit={moveToStep}><dl><div><dt>Expertise</dt><dd>{displayList(form.specialties)}</dd></div><div><dt>Languages</dt><dd>{displayList(form.languages)}</dd></div></dl></ReviewBlock>
            <ReviewBlock title="Creation plan" step={3} onEdit={moveToStep}><dl><div><dt>Creator types</dt><dd>{displayList(form.creatorTypes)}</dd></div><div><dt>Topics</dt><dd>{displayList(form.intendedTopics)}</dd></div><div><dt>Formats</dt><dd>{displayList(form.intendedFormats)}</dd></div></dl></ReviewBlock>
          </div>
          <div className="creator-form__agreements" id="creator-form-note">
            <label><input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={update} required /> I agree to the Creator Terms and content rules.</label>
            <label><input type="checkbox" name="confirmContentRights" checked={form.confirmContentRights} onChange={update} required /> I will submit only content and assets I have the rights to use.</label>
          </div>
        </section>}

        {(stepError || state.error) && <p className="creator-notice" role="alert">{stepError || state.error}</p>}
        {state.message && <p className="creator-notice" role="status">{state.message}</p>}

        <div className="creator-form__navigation">
          {step > 0 && <button type="button" className="creator-step-back" onClick={() => moveToStep(step - 1)}>Back</button>}
          {step < STAGES.length - 1 ? <button type="button" className="creator-step-next" onClick={continueApplication}>Continue</button> : <button className="creator-submit-action" type="submit" disabled={state.busy}>{state.busy ? "Submitting…" : application ? "Resubmit information" : "Submit application"}</button>}
        </div>
      </form>
    </main>
  );
}
