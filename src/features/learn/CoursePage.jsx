import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";
import { learnApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import ContentReportForm from "./ContentReportForm.jsx";
import "./learn.css";

const CANONICAL_CODING_TRACKS = {
  "html-foundations": "html",
  "css-foundations": "css",
  "javascript-foundations": "javascript",
  "python-foundations": "python",
};

export default function CoursePage() {
  const { slug } = useParams();

  // Canonical coding courses must redirect to dedicated /coding product surface
  const codingTrack = CANONICAL_CODING_TRACKS[slug];
  if (codingTrack) {
    return <Navigate to={`/coding/${codingTrack}`} replace />;
  }

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "" });

  useEffect(() => {
    let active = true;
    learnApi.course(slug)
      .then((response) => {
        if (active) {
          setCourse(response.data);
          setState({ loading: false, busy: false, error: "" });
        }
      })
      .catch((error) => active && setState({ loading: false, busy: false, error: error.message }));
    return () => { active = false; };
  }, [slug]);

  const firstLesson = useMemo(() => course?.curriculum?.flatMap((module) => module.lessons || [])[0], [course]);

  // Set of completed lesson keys
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
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const begin = async () => {
    if (!isAuthenticated) { navigate("/login", { state: { from: location.pathname } }); return; }
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      if (!course.enrollment) await learnApi.enroll(course.id);
      if (firstLesson) navigate(`/learn/courses/${course.slug}/lessons/${firstLesson.id}`);
      else setState((current) => ({ ...current, busy: false, error: "This Course does not have a published Lesson yet." }));
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  if (state.loading) return <main className="learn-page"><p className="learn-state" role="status">Opening Course…</p></main>;
  if (!course) return <main className="learn-page"><div className="learn-state" role="alert"><h1>Course unavailable</h1><p>{state.error}</p><Link to="/learn">Back to Learn</Link></div></main>;

  const monetizationBadge =
    course.monetizationType === "STANDALONE_PAID"
      ? "Standalone Paid Course"
      : course.accessLevel === "premium" || course.monetizationType === "PREMIUM_INCLUDED"
      ? "MyJourney Premium Course"
      : "Free Course";

  const isCanonicalCoding =
    course.isSystemOwned ||
    ["html-foundations", "css-foundations", "javascript-foundations", "python-foundations"].includes(course.slug);

  return (
    <main className="learn-page learn-course">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <Link to="/learn/courses">Courses</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{course.title}</span>
      </nav>

      <header className="learn-course__header">
        <div>
          <p className="learn-kicker">{monetizationBadge}</p>
          <h1>{course.title}</h1>
          <p className="learn-course__subtitle">{course.subtitle || course.description}</p>
          {isCanonicalCoding ? (
            <p className="learn-course__author">
              Curriculum by <strong>MyJourney Coding</strong>
            </p>
          ) : course.creator ? (
            <p className="learn-course__author">
              Curriculum by <strong>{course.creator.displayName}</strong>
            </p>
          ) : null}
          <div className="learn-meta">
            <span>{course.level?.replaceAll("_", " ")}</span>
            <span>{course.lessonCount || 0} Lessons</span>
            <span>{course.estimatedDurationMinutes || 0} min</span>
            <span>{course.language}</span>
          </div>

          {/* Course Progress Bar for Enrolled Learners */}
          {course.enrollment && (
            <div className="learn-course__progress-card" role="region" aria-label="Your course progress">
              <div className="learn-course__progress-labels">
                <span>{completedCount} of {totalLessons} lessons completed</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="learn-progress-track">
                <div className="learn-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <button className="learn-primary-action" type="button" onClick={begin} disabled={state.busy}>
            {state.busy
              ? "Opening…"
              : course.enrollment?.status === "completed"
              ? "Review Course"
              : course.enrollment
              ? "Continue Learning"
              : "Start Course"}
          </button>
          {state.error && <p className="learn-notice" role="alert">{state.error}</p>}
        </div>
        {!isCanonicalCoding && course.coverImage && (
          <img src={course.coverImage} alt={course.coverImageAlt || ""} />
        )}
      </header>

      <div className="learn-course__body">
        <section className="learn-course__overview">
          <h2>What you will learn</h2>
          {course.learningOutcomes?.length ? (
            <ul>
              {course.learningOutcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{course.description}</p>
          )}
          {!!course.prerequisites?.length && (
            <>
              <h3>Prerequisites</h3>
              <ul>
                {course.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="learn-curriculum" aria-labelledby="curriculum-title">
          <div className="learn-section-heading">
            <div>
              <p className="learn-kicker">Course structure</p>
              <h2 id="curriculum-title">Interactive Curriculum</h2>
            </div>
          </div>

          {course.curriculum?.map((module, index) => (
            <section className="learn-module" key={module.stableKey || module.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{module.title}</h3>
                  {module.description && <p>{module.description}</p>}
                </div>
              </header>
              <ol className="learn-module__lesson-list">
                {module.lessons.map((lesson) => {
                  const isDone = completedLessonKeys.has(String(lesson.id)) || completedLessonKeys.has(lesson.stableKey);
                  const isCurrent = String(course.enrollment?.currentLessonId) === String(lesson.id);

                  return (
                    <li key={lesson.stableKey || lesson.id} className={isDone ? "learn-lesson-item--done" : ""}>
                      <Link to={`/learn/courses/${course.slug}/lessons/${lesson.id}`}>
                        <div className="learn-lesson-item__title">
                          <span className="learn-lesson-item__status-icon" aria-hidden="true">
                            {isDone ? "✓" : isCurrent ? "▶" : "○"}
                          </span>
                          <span>{lesson.title}</span>
                        </div>
                        <div className="learn-lesson-item__meta">
                          <span className="learn-badge learn-badge--type">{lesson.lessonType}</span>
                          {lesson.isPreview && <span className="learn-badge learn-badge--preview">Free Preview</span>}
                          {isDone && <span className="learn-badge learn-badge--completed">Done</span>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </section>
      </div>
      <ContentReportForm targetType="course" targetId={course.id} />
    </main>
  );
}
