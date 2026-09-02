import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { learnApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import ContentReportForm from "./ContentReportForm.jsx";
import "./learn.css";

export default function CoursePage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "" });

  useEffect(() => {
    let active = true;
    learnApi.course(slug).then((response) => { if (active) { setCourse(response.data); setState({ loading: false, busy: false, error: "" }); } }).catch((error) => active && setState({ loading: false, busy: false, error: error.message }));
    return () => { active = false; };
  }, [slug]);

  const firstLesson = useMemo(() => course?.curriculum?.flatMap((module) => module.lessons || [])[0], [course]);
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

  return (
    <main className="learn-page learn-course">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb"><Link to="/learn">Learn</Link><span aria-hidden="true">/</span><span>Course</span></nav>
      <header className="learn-course__header">
        <div><p className="learn-kicker">{course.accessLevel === "premium" ? "MyJourney Premium Course" : "Free Course"}</p><h1>{course.title}</h1><p className="learn-course__subtitle">{course.subtitle || course.description}</p>{course.creator && <p>Created by <Link to={`/creators/${course.creator.slug}`}>{course.creator.displayName}</Link></p>}<div className="learn-meta"><span>{course.level?.replaceAll("_", " ")}</span><span>{course.lessonCount || 0} Lessons</span><span>{course.estimatedDurationMinutes || 0} min</span><span>{course.language}</span></div><button className="learn-primary-action" type="button" onClick={begin} disabled={state.busy}>{state.busy ? "Opening…" : course.enrollment ? "Continue Course" : "Start Course"}</button>{state.error && <p className="learn-notice" role="alert">{state.error}</p>}</div>
        {course.coverImage && <img src={course.coverImage} alt={course.coverImageAlt || ""} />}
      </header>

      <div className="learn-course__body">
        <section className="learn-course__overview"><h2>What you will learn</h2>{course.learningOutcomes?.length ? <ul>{course.learningOutcomes.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{course.description}</p>}{!!course.prerequisites?.length && <><h3>Before you begin</h3><ul>{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></>}</section>
        <section className="learn-curriculum" aria-labelledby="curriculum-title"><div className="learn-section-heading"><div><p className="learn-kicker">Course structure</p><h2 id="curriculum-title">Curriculum</h2></div></div>{course.curriculum?.map((module, index) => <section className="learn-module" key={module.stableKey || module.id}><header><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{module.title}</h3>{module.description && <p>{module.description}</p>}</div></header><ol>{module.lessons.map((lesson) => <li key={lesson.stableKey || lesson.id}><Link to={`/learn/courses/${course.slug}/lessons/${lesson.id}`}><span>{lesson.title}</span><small>{lesson.isPreview ? "Preview" : course.accessLevel === "premium" ? "Premium" : lesson.lessonType}</small></Link></li>)}</ol></section>)}</section>
      </div>
      <ContentReportForm targetType="course" targetId={course.id} />
    </main>
  );
}
