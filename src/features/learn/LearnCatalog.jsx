import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { learnApi } from "../../services/apiService";
import { LearnCard } from "./LearnHome";
import "./learn.css";

const CONFIG = {
  courses: { label: "Courses", singular: "course", load: learnApi.courses },
  videos: { label: "Videos", singular: "video", load: learnApi.videos },
  podcasts: { label: "Podcasts", singular: "podcast", load: learnApi.podcasts },
  resources: { label: "Resources", singular: "resource", load: learnApi.resources },
  exams: { label: "Exam preparation", singular: "exam", load: learnApi.exams },
};

export default function LearnCatalog({ format }) {
  const config = CONFIG[format];
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [accessLevel, setAccessLevel] = useState("");
  const [result, setResult] = useState({ items: [], pagination: {} });
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState({ loading: true, error: "" });
      config.load({ search, accessLevel }).then((response) => {
        const items = response.courses || response.items || response.data || [];
        setResult({ items, pagination: response.pagination || {} });
        setState({ loading: false, error: "" });
      }).catch((error) => setState({ loading: false, error: error.message }));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [accessLevel, config, search]);

  return (
    <main className="learn-page learn-catalog">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb"><Link to="/learn">Learn</Link><span>/</span><span>{config.label}</span></nav>
      <header><p className="learn-kicker">Learn by format</p><h1>{config.label}</h1><p>Published, reviewed work from MyJourney Creators.</p></header>
      <section className="learn-filters" aria-label={`Filter ${config.label}`}><label>Search <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.label}`} /></label>{format !== "exams" && <label>Access <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value)}><option value="">Free and Premium</option><option value="free">Free</option><option value="premium">MyJourney Premium</option></select></label>}</section>
      {format === "exams" && <p className="learn-notice">Exam catalog metadata is ready. Practice sessions, scoring, and certificates stay unavailable until the assessment engine is implemented and verified.</p>}
      {state.error && <p className="learn-notice" role="alert">{state.error}</p>}
      {state.loading ? <p className="learn-state" role="status">Finding {config.label}…</p> : result.items.length ? <div className="learn-card-grid">{result.items.map((item) => <LearnCard key={item.id || item._id || item.slug} item={item} format={config.singular} />)}</div> : <section className="learn-state"><h2>No published {config.label.toLowerCase()} match yet.</h2><p>Try a broader search or return as the library grows.</p></section>}
    </main>
  );
}
