import React, { useEffect, useMemo, useState } from "react";
import { FiDownload, FiExternalLink, FiFileText, FiFilter, FiLock } from "react-icons/fi";
import { learnApi } from "../../services/apiService";
import CodingSubNav from "./CodingSubNav.jsx";
import { RESOURCE_CATEGORIES, CANONICAL_TRACKS } from "./codingConstants";
import "./coding.css";

const CATEGORY_LABELS = {
  cheat_sheet: "Cheat Sheets",
  course_notes: "Course Notes",
  practice_set: "Practice Sets",
  project_file: "Project Files",
  reference_guide: "Reference Guides",
  interview_prep: "Interview Preparation",
  starter_file: "Starter Files",
  solution_file: "Solution Files",
  general: "General Resources",
};

export default function CodingResources() {
  const [resources, setResources] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = {};
    if (selectedTrack !== "all") params.track = selectedTrack;

    learnApi.codingResources(params)
      .then((res) => {
        if (active) setResources(res.data || []);
      })
      .catch(() => {
        if (active) setResources([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTrack]);

  // Determine only categories that actually contain content
  const availableCategories = useMemo(() => {
    const cats = new Set(resources.map((r) => r.resourceCategory).filter(Boolean));
    return Array.from(cats);
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (selectedCategory === "all") return resources;
    return resources.filter((r) => r.resourceCategory === selectedCategory);
  }, [resources, selectedCategory]);

  return (
    <div className="coding-page">
      <CodingSubNav />

      <section className="coding-hero" style={{ paddingBottom: "1.5rem" }}>
        <p className="coding-hero__kicker">
          <FiFileText /> MATERIALS &amp; GUIDES
        </p>
        <h1>Coding Resource Library</h1>
        <p className="coding-hero__lead">
          Official cheat sheets, checklists, downloadable code templates, and
          reference documentation for the canonical tracks.
        </p>

        {/* Track Filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => setSelectedTrack("all")}
            style={{
              background: selectedTrack === "all" ? "#0284c7" : "var(--cd-surface)",
              color: selectedTrack === "all" ? "#ffffff" : "var(--cd-text-secondary)",
              border: "1px solid var(--cd-border)",
              borderRadius: "6px",
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All Tracks
          </button>
          {CANONICAL_TRACKS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelectedTrack(t.key)}
              style={{
                background: selectedTrack === t.key ? "#0284c7" : "var(--cd-surface)",
                color: selectedTrack === t.key ? "#ffffff" : "var(--cd-text-secondary)",
                border: "1px solid var(--cd-border)",
                borderRadius: "6px",
                padding: "0.45rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Filters (Only categories that actually contain content) */}
        {availableCategories.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              style={{
                background: selectedCategory === "all" ? "var(--cd-surface-card)" : "transparent",
                color: selectedCategory === "all" ? "var(--cd-text-primary)" : "var(--cd-text-muted)",
                border: "1px solid var(--cd-border)",
                borderRadius: "6px",
                padding: "0.3rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              All Categories
            </button>
            {availableCategories.map((catKey) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                style={{
                  background: selectedCategory === catKey ? "var(--cd-surface-card)" : "transparent",
                  color: selectedCategory === catKey ? "var(--cd-text-primary)" : "var(--cd-text-muted)",
                  border: "1px solid var(--cd-border)",
                  borderRadius: "6px",
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {CATEGORY_LABELS[catKey] || catKey}
              </button>
            ))}
          </div>
        )}
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        {loading ? (
          <p style={{ color: "var(--cd-text-muted)" }}>Loading published materials…</p>
        ) : filteredResources.length === 0 ? (
          <div className="coding-section">
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>No Materials Available</h2>
            <p style={{ color: "var(--cd-text-muted)", margin: 0 }}>
              {selectedTrack !== "all"
                ? `No published materials have been added for ${selectedTrack.toUpperCase()} yet.`
                : "No published materials have been attached to the coding curriculum yet."}
            </p>
          </div>
        ) : (
          <div className="coding-resources-grid">
            {filteredResources.map((res) => (
              <article key={res.id} className="coding-resource-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--cd-accent-blue)",
                        textTransform: "uppercase",
                      }}
                    >
                      {CATEGORY_LABELS[res.resourceCategory] || res.resourceType}
                    </span>
                    <span className={`cd-badge ${res.accessLevel === "premium" ? "cd-badge--premium" : "cd-badge--free"}`}>
                      {res.accessLevel === "premium" ? "Premium" : "Free"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
                    {res.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--cd-text-secondary)", margin: "0 0 0.75rem" }}>
                    {res.description}
                  </p>

                  {res.filename && (
                    <div style={{ fontSize: "0.75rem", color: "var(--cd-text-muted)", fontFamily: "monospace" }}>
                      📄 {res.filename}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--cd-border)" }}>
                  {res.locked ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--cd-premium-text)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <FiLock /> MyJourney Premium Required
                    </span>
                  ) : res.externalUrl ? (
                    <a
                      href={res.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-btn cd-btn--secondary cd-btn--full"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Open Resource <FiExternalLink />
                    </a>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--cd-text-muted)" }}>
                      Included in curriculum workspace
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

