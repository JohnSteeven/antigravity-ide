import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { creatorApi } from "../../services/apiService";
import "./creators.css";

const CreatorCard = ({ creator }) => (
  <article className="creator-card">
    <div className="creator-card__identity">
      {creator.profileImage ? <img src={creator.profileImage} alt="" /> : <span aria-hidden="true">{creator.displayName?.slice(0, 1)}</span>}
      <div><h2><Link to={`/creators/${creator.slug}`}>{creator.displayName}</Link></h2><p>{creator.headline}</p></div>
    </div>
    <ul className="creator-chip-list" aria-label={`${creator.displayName} specialties`}>
      {(creator.specialties || []).slice(0, 4).map((specialty) => <li key={specialty}>{specialty}</li>)}
    </ul>
    <div className="creator-card__meta">
      <span>{creator.metrics?.publishedContentCount || 0} published</span>
      <span>{creator.metrics?.followerCount || 0} followers</span>
    </div>
  </article>
);

export default function CreatorDirectory() {
  const [filters, setFilters] = useState({ search: "", specialty: "", language: "", format: "", sort: "featured" });
  const [result, setResult] = useState({ creators: [], facets: {}, pagination: {} });
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState({ loading: true, error: "" });
      creatorApi.list(filters).then((response) => {
        setResult({ creators: response.creators || [], facets: response.facets || {}, pagination: response.pagination || {} });
        setState({ loading: false, error: "" });
      }).catch((error) => setState({ loading: false, error: error.message }));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const update = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <main className="creator-page creator-directory">
      <section className="creator-hero">
        <p className="creator-kicker">People who know</p>
        <h1>Learn from experience, craft, and generous expertise.</h1>
        <p>Discover verified writers, educators, storytellers, specialists, and multi-format Creators across MyJourney.</p>
        <Link className="creator-primary-action" to="/creators/apply">Apply to become a Creator</Link>
      </section>

      <section className="creator-filters" aria-label="Filter Creators">
        <label><span>Search</span><input value={filters.search} onChange={update("search")} placeholder="Name, specialty, or topic" /></label>
        <label><span>Expertise</span><select value={filters.specialty} onChange={update("specialty")}><option value="">All expertise</option>{(result.facets.specialties || []).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Language</span><select value={filters.language} onChange={update("language")}><option value="">All languages</option>{(result.facets.languages || []).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Format</span><select value={filters.format} onChange={update("format")}><option value="">All formats</option>{(result.facets.formats || []).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Order</span><select value={filters.sort} onChange={update("sort")}><option value="featured">Featured</option><option value="new">New</option><option value="popular">Popular</option></select></label>
      </section>

      <section aria-labelledby="creator-results-heading">
        <div className="creator-section-heading"><div><p className="creator-kicker">Creator directory</p><h2 id="creator-results-heading">Explore Creators</h2></div><span>{result.pagination.total || 0} Creators</span></div>
        {state.error && <p className="creator-notice" role="alert">{state.error}</p>}
        {state.loading ? <p className="creator-empty" role="status">Finding Creators…</p> : result.creators.length ? (
          <div className="creator-grid">{result.creators.map((creator) => <CreatorCard key={creator.creatorKey} creator={creator} />)}</div>
        ) : <div className="creator-empty"><h2>No Creators match these filters yet.</h2><p>Try a broader topic or return as the community grows.</p></div>}
      </section>
    </main>
  );
}
