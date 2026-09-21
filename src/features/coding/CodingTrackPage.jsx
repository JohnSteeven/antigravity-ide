import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import { FiArrowRight, FiCheck, FiLock, FiPlay } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { learnApi } from "../../services/apiService";
import CodingSubNav from "./CodingSubNav.jsx";
import { trackToCourseSlug, courseSlugToTrack, CANONICAL_TRACKS } from "./codingConstants";
import "./coding.css";

export default function CodingTrackPage() {
  const { track } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const trackKey = (track || "html").toLowerCase();
  const courseSlug = trackToCourseSlug(trackKey);
  const trackMeta = CANONICAL_TRACKS.find((t) => t.key === trackKey) || CANONICAL_TRACKS[0];

  const [course, setCourse] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "" });

  useEffect(() => {
    let active = true;
    setState({ loading: true, busy: false, error: "" });

    learnApi.course(courseSlug)
      .then((res) => {
        if (active) {
          setCourse(res.data);
          setState({ loading: false, busy: false, error: "" });
        }
      })
      .catch((err) => {
        if (active) {
          setState({ loading: false, busy: false, error: err.message });
        }
      });

    return () => {
      active = false;
    };
  }, [courseSlug]);

  const firstLesson = useMemo(
    () => course?.curriculum?.flatMap((m) => m.lessons || [])[0],
    [course]
  );

  const completedLessonKeys = useMemo(() => {
    const set = new Set();
    const progressList = course?.enrollment?.lessonProgress || [];
    progressList.forEach((p) => {
      if (p.completedAt) {
        if (p.lessonId) set.add(String(p.lessonId));
        if (p.lessonStableKey) set.add(p.lessonStableKey);
      }
    });
    return set;
  }, [course]);

  const totalLessons = course?.lessonCount || 0;
  const completedCount = course?.enrollment?.completedLessonCount || 0;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isPremiumCourse =
    course?.accessLevel === "premium" ||
    course?.monetizationType === "PREMIUM_INCLUDED";

  const begin = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      if (!course.enrollment) await learnApi.enroll(course.id);
      const targetLessonId = course.enrollment?.currentLessonId || firstLesson?.id;
      if (targetLessonId) {
        navigate(`/coding/${trackKey}/lesson/${targetLessonId}`);
      } else {
        setState((current) => ({
          ...current,
          busy: false,
          error: "This track does not have published lessons yet.",
        }));
      }
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error.message }));
    }
  };

  if (state.loading) {
    return (
      <div className="coding-page">
        <CodingSubNav />
        <main className="coding-track-hero">
          <p style={{ color: "var(--cd-text-muted)" }}>Loading {trackMeta.label} Foundations…</p>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="coding-page">
        <CodingSubNav />
        <main className="coding-track-hero">
          <div className="coding-section">
            <h2>Track unavailable</h2>
            <p>{state.error || "The requested coding track could not be found."}</p>
            <Link to="/coding" className="cd-btn cd-btn--secondary">
              Back to Coding Hub
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="coding-page">
      <CodingSubNav />

      {/* Exactly ONE Hero Block */}
      <section className="coding-track-hero">
        <div className="coding-track-hero__card">
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: "var(--cd-text-muted)",
              marginBottom: "1.25rem",
            }}
            aria-label="Breadcrumb"
          >
            <Link to="/coding" style={{ color: "inherit", textDecoration: "none" }}>
              Coding
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--cd-text-primary)" }}>{course.title}</span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span
              className={`cd-badge ${
                isPremiumCourse ? "cd-badge--premium" : "cd-badge--free"
              }`}
            >
              {isPremiumCourse ? "PREMIUM INCLUDED" : "FREE"}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--cd-text-muted)" }}>
              Curriculum by <strong>MyJourney Coding</strong>
            </span>
          </div>

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0 0 0.75rem",
            }}
          >
            {course.title}
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.6,
              color: "var(--cd-text-secondary)",
              maxWidth: "700px",
              margin: "0 0 1.5rem",
            }}
          >
            {course.subtitle || course.description}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "1.25rem",
              fontSize: "0.875rem",
              color: "var(--cd-text-secondary)",
              marginBottom: "2rem",
            }}
          >
            <span>{course.level?.replace("_", " ")}</span>
            <span>•</span>
            <span>{totalLessons} Lessons</span>
            <span>•</span>
            <span>{course.estimatedDurationMinutes || 180} min</span>
            <span>•</span>
            <span>{course.language}</span>
          </div>

          {/* Enrolled Progress Bar */}
          {course.enrollment && (
            <div
              style={{
                maxWidth: "400px",
                marginBottom: "2rem",
                padding: "1rem",
                background: "var(--cd-surface-subtle)",
                borderRadius: "8px",
                border: "1px solid var(--cd-border)",
              }}
              role="region"
              aria-label="Your track progress"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "var(--cd-text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                <span>
                  {completedCount} of {totalLessons} lessons completed
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "var(--cd-border)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    background: trackMeta.accent,
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>
          )}

          <button
            className="cd-btn cd-btn--primary"
            type="button"
            onClick={begin}
            disabled={state.busy}
          >
            {state.busy
              ? "Opening…"
              : course.enrollment?.status === "completed"
              ? "Review Track"
              : course.enrollment
              ? "Continue Learning"
              : "Start Track"}
          </button>
          {state.error && (
            <p style={{ color: "var(--cd-red-text)", marginTop: "1rem" }} role="alert">
              {state.error}
            </p>
          )}
        </div>
      </section>

      {/* Course Content Body */}
      <div className="coding-track-body">
        {/* Exactly ONE "What you will learn" Outcomes Section */}
        <section className="coding-section coding-track-outcomes" aria-labelledby="outcomes-heading">
          <h2 id="outcomes-heading">What you will learn</h2>
          {course.learningOutcomes?.length ? (
            <ul className="coding-outcomes-list">
              {course.learningOutcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--cd-text-secondary)" }}>{course.description}</p>
          )}

          {Boolean(course.prerequisites?.length) && (
            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--cd-border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                Prerequisites
              </h3>
              <ul style={{ paddingLeft: "1.25rem", margin: 0, color: "var(--cd-text-secondary)" }}>
                {course.prerequisites.map((req) => (
                  <li key={req} style={{ marginBottom: "0.35rem" }}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Exactly ONE Course Roadmap */}
        <section className="coding-section" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading">Course Roadmap</h2>

          {course.curriculum?.map((module, mIdx) => (
            <div key={module.stableKey || module.id || mIdx} className="coding-module-block coding-module-card">
              <div className="coding-module-header">
                <span>Module {String(mIdx + 1).padStart(2, "0")}</span>
                <h3>{module.title}</h3>
              </div>
              {module.description && (
                <p style={{ fontSize: "0.875rem", color: "var(--cd-text-muted)", margin: "0 0 0.85rem" }}>
                  {module.description}
                </p>
              )}

              <ol className="coding-lesson-list">
                {module.lessons?.map((lesson, lIdx) => {
                  const isDone =
                    completedLessonKeys.has(String(lesson.id)) ||
                    completedLessonKeys.has(lesson.stableKey);
                  const isCurrent =
                    String(course.enrollment?.currentLessonId) === String(lesson.id);
                  const isLocked =
                    isPremiumCourse && !lesson.isPreview && !isAuthenticated;

                  return (
                    <li key={lesson.stableKey || lesson.id} className="coding-lesson-item">
                      <Link to={`/coding/${trackKey}/lesson/${lesson.id}`}>
                        <div className="coding-lesson-item__left">
                          <span
                            className={`coding-lesson-item__status ${
                              isDone
                                ? "coding-lesson-item__status--completed"
                                : isCurrent
                                ? "coding-lesson-item__status--current"
                                : isLocked
                                ? "coding-lesson-item__status--locked"
                                : "coding-lesson-item__status--available"
                            }`}
                            aria-hidden="true"
                          >
                            {isDone ? "✓" : isCurrent ? "●" : isLocked ? "🔒" : "○"}
                          </span>
                          <span style={{ fontWeight: isCurrent ? 600 : 400 }}>
                            {lesson.title}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--cd-text-muted)",
                              textTransform: "capitalize",
                            }}
                          >
                            {lesson.lessonType}
                          </span>
                          {lesson.isPreview && (
                            <span className="cd-badge cd-badge--amber">Preview</span>
                          )}
                          {isDone && (
                            <span className="cd-badge cd-badge--free">Done</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

