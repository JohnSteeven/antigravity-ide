import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiCode, FiFolder } from "react-icons/fi";
import { learnApi } from "../../services/apiService";
import CodingSubNav from "./CodingSubNav.jsx";
import { CANONICAL_TRACKS, courseSlugToTrack } from "./codingConstants";
import "./coding.css";

export default function CodingProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        const promises = CANONICAL_TRACKS.map((t) =>
          learnApi
            .course(t.courseSlug)
            .then((res) => ({ track: t, course: res.data }))
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        if (!active) return;

        const discoveredProjects = [];
        results.forEach((item) => {
          if (!item?.course?.curriculum) return;
          const { track, course } = item;

          course.curriculum.forEach((mod) => {
            mod.lessons?.forEach((lesson) => {
              if (
                lesson.lessonType === "project" ||
                /project/i.test(lesson.title) ||
                /capstone/i.test(lesson.title)
              ) {
                discoveredProjects.push({
                  id: lesson.id,
                  trackKey: track.key,
                  trackLabel: track.label,
                  accent: track.accent,
                  courseSlug: course.slug,
                  courseTitle: course.title,
                  title: lesson.title,
                  description:
                    lesson.description ||
                    `Hands-on practical capstone project building a full ${track.label} application.`,
                  durationSeconds: lesson.durationSeconds,
                  isPreview: Boolean(lesson.isPreview),
                });
              }
            });
          });
        });

        setProjects(discoveredProjects);
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (selectedFilter === "all") return projects;
    return projects.filter((p) => p.trackKey === selectedFilter);
  }, [projects, selectedFilter]);

  return (
    <div className="coding-page">
      <CodingSubNav />

      <section className="coding-hero" style={{ paddingBottom: "1.5rem" }}>
        <p className="coding-hero__kicker">
          <FiFolder /> CAPSTONES
        </p>
        <h1>Portfolio Projects</h1>
        <p className="coding-hero__lead">
          Real-world, portfolio-grade coding projects constructed step-by-step
          with live execution and automated validation.
        </p>

        {/* Filter Chips */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          {["all", "html", "css", "javascript", "python"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFilter(f)}
              style={{
                background: selectedFilter === f ? "#0284c7" : "var(--cd-surface)",
                color: selectedFilter === f ? "#ffffff" : "var(--cd-text-secondary)",
                border: "1px solid var(--cd-border)",
                borderRadius: "6px",
                padding: "0.45rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All Projects" : f}
            </button>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        {loading ? (
          <p style={{ color: "var(--cd-text-muted)" }}>Discovering published project lessons…</p>
        ) : filteredProjects.length === 0 ? (
          <div className="coding-section">
            <p style={{ color: "var(--cd-text-muted)", margin: 0 }}>
              No projects found for the selected track.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredProjects.map((proj) => (
              <article
                key={proj.id}
                style={{
                  background: "var(--cd-surface)",
                  border: "1px solid var(--cd-border)",
                  borderRadius: "12px",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: proj.accent,
                        background: "var(--cd-surface-card)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--cd-border)",
                      }}
                    >
                      {proj.trackLabel}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--cd-text-muted)" }}>
                      {proj.courseTitle}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.6rem" }}>
                    {proj.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.925rem",
                      lineHeight: 1.55,
                      color: "var(--cd-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {proj.description}
                  </p>
                </div>

                <div style={{ marginTop: "1.75rem" }}>
                  <Link
                    to={`/coding/${proj.trackKey}/lesson/${proj.id}`}
                    className="cd-btn cd-btn--primary cd-btn--full"
                  >
                    Launch Project <FiArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

