import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiCheckCircle, FiCode, FiZap } from "react-icons/fi";
import { learnApi } from "../../services/apiService";
import CodingSubNav from "./CodingSubNav.jsx";
import { CANONICAL_TRACKS } from "./codingConstants";
import "./coding.css";

export default function CodingPractice() {
  const [selectedTrack, setSelectedTrack] = useState("html");
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const currentTrack = CANONICAL_TRACKS.find((t) => t.key === selectedTrack);
    if (!currentTrack) return;

    setLoading(true);
    learnApi
      .course(currentTrack.courseSlug)
      .then((res) => {
        if (!active) return;
        const allLessons = res.data?.curriculum?.flatMap((m) => m.lessons || []) || [];
        const codingLessons = allLessons.filter(
          (l) => l.lessonType === "coding" || l.lessonType === "project"
        );
        setChallenges(codingLessons);
      })
      .catch(() => {
        if (active) setChallenges([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTrack]);

  return (
    <div className="coding-page">
      <CodingSubNav />

      <section className="coding-hero" style={{ paddingBottom: "1.5rem" }}>
        <p className="coding-hero__kicker">
          <FiZap /> PRACTICE
        </p>
        <h1>Quick Code Challenges</h1>
        <p className="coding-hero__lead">
          Targeted exercises to sharpen syntax, layout debugging, algorithmic
          logic, and problem-solving skills across the canonical tracks.
        </p>

        {/* Track Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
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
                padding: "0.45rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label} Challenges</span>
            </button>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        {loading ? (
          <p style={{ color: "var(--cd-text-muted)" }}>Loading practical exercises…</p>
        ) : challenges.length === 0 ? (
          <div className="coding-section">
            <p style={{ color: "var(--cd-text-muted)", margin: 0 }}>
              No practice exercises found for this track.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {challenges.map((challenge, idx) => (
              <article
                key={challenge.id}
                style={{
                  background: "var(--cd-surface)",
                  border: "1px solid var(--cd-border)",
                  borderRadius: "10px",
                  padding: "1.5rem",
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
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--cd-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Challenge #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                        color: "var(--cd-accent-cyan)",
                        background: "var(--cd-surface-card)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      {challenge.lessonType}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
                    {challenge.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      color: "var(--cd-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {challenge.description ||
                      "Execute live code, inspect the challenge requirements, and pass all automated tests."}
                  </p>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <Link
                    to={`/coding/${selectedTrack}/lesson/${challenge.id}`}
                    className="cd-btn cd-btn--secondary cd-btn--full"
                  >
                    Start Challenge <FiArrowRight />
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

