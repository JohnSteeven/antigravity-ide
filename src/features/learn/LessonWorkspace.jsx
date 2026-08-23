import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { learnApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import ContentReportForm from "./ContentReportForm.jsx";
import "./learn.css";

const idempotencyKey = () => globalThis.crypto?.randomUUID?.() || `lesson-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function LessonWorkspace() {
  const { slug, lessonId } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "", completed: false });
  const bodyParagraphs = useMemo(() => String(data?.lesson?.body || "").split(/\n{2,}/).filter(Boolean), [data?.lesson?.body]);

  useEffect(() => {
    let active = true;
    setState({ loading: true, busy: false, error: "", completed: false });
    learnApi.lesson(slug, lessonId).then((response) => { if (active) { setData(response.data); setState({ loading: false, busy: false, error: "", completed: false }); } }).catch((error) => active && setState({ loading: false, busy: false, error: error.message, completed: false }));
    return () => { active = false; };
  }, [lessonId, slug]);

  const complete = async () => {
    if (!isAuthenticated) { setState((current) => ({ ...current, error: "Sign in and enroll to save Lesson progress." })); return; }
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      await learnApi.progress(data.course.id, { lessonId: data.lesson.id, positionSeconds: data.lesson.durationSeconds || 0, completed: true, idempotencyKey: idempotencyKey() });
      setState((current) => ({ ...current, busy: false, completed: true }));
    } catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  };

  if (state.loading) return <main className="learn-page"><p className="learn-state" role="status">Opening Lesson…</p></main>;
  if (!data) return <main className="learn-page"><section className="learn-lock" role="alert"><p className="learn-kicker">Course access</p><h1>{state.error?.toLowerCase().includes("premium") ? "This Lesson is part of MyJourney Premium." : "Lesson unavailable"}</h1><p>{state.error}</p><div><Link className="learn-primary-action" to="/premium">Explore Premium</Link><Link to={`/learn/courses/${slug}`}>Back to Course</Link></div></section></main>;

  return (
    <main className="learn-page learn-lesson">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb"><Link to="/learn">Learn</Link><span>/</span><Link to={`/learn/courses/${slug}`}>{data.course.title}</Link></nav>
      <article className="learn-lesson__reader">
        <header><p className="learn-kicker">{data.lesson.lessonType} Lesson</p><h1>{data.lesson.title}</h1>{data.lesson.description && <p>{data.lesson.description}</p>}</header>
        {data.lesson.mediaAssetId && <section className="learn-media-boundary"><h2>Lesson media</h2><p>Secure playback becomes available when a production media provider is configured. Access remains protected server-side.</p></section>}
        <div className="learn-prose">{bodyParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>)}</div>
        {data.lesson.transcript && <details className="learn-transcript"><summary>Transcript</summary><div className="learn-prose"><p>{data.lesson.transcript}</p></div></details>}
        <footer><button className="learn-primary-action" type="button" onClick={complete} disabled={state.busy || state.completed}>{state.completed ? "Lesson complete" : state.busy ? "Saving…" : "Mark Lesson complete"}</button>{state.error && <p className="learn-notice" role="alert">{state.error}</p>}</footer>
        <ContentReportForm targetType="lesson" targetId={data.lesson.id} />
      </article>
    </main>
  );
}
