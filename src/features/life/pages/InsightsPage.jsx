import React, { useState } from "react";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { addDateDays, localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

export default function InsightsPage() {
  const [days, setDays] = useState(7);
  const end = localDateInput();
  const start = addDateDays(end, -(days - 1));
  const query = useLifeQuery(() => lifeApi.insights({ start, end }), [start, end]);
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const dismiss = async (id) => { setBusy(true); try { await lifeApi.dismissInsight(id); await query.refresh({ quiet: true }); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const saveReview = async (event) => {
    event.preventDefault(); setBusy(true);
    try { await lifeApi.createJournal({ type: days === 7 ? "weekly_review" : "monthly_review", localDate: end, title: days === 7 ? "Weekly review" : "Monthly review", body: review }); setReview(""); setNotice("Review saved in your private journal."); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  if (query.loading) return <LifeLoading label="Looking for patterns in your records…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const data = query.data || { metrics: {}, insights: [] };
  return <div>
    <LifePageHeader eyebrow="Patterns, not verdicts" title="Insights" description="Deterministic summaries of your recorded data, with plain-language quality boundaries." actions={<div className="life-segmented"><button type="button" className={days === 7 ? "is-active" : ""} onClick={() => setDays(7)}>7 days</button><button type="button" className={days === 30 ? "is-active" : ""} onClick={() => setDays(30)}>30 days</button></div>} />
    <LifeNotice tone={notice.toLowerCase().includes("could") ? "error" : "success"}>{notice}</LifeNotice>
    <section className="life-stat-grid" aria-label="Period summary"><article><span>Planned</span><strong>{data.metrics.planned || 0}</strong></article><article><span>Completed</span><strong>{data.metrics.completed || 0}</strong></article><article><span>Partial</span><strong>{data.metrics.partial || 0}</strong></article><article><span>Recorded consistency</span><strong>{data.metrics.consistency || 0}%</strong></article></section>
    <div className="life-insights-grid">
      <section><h2>Observations</h2>{data.insights?.length ? data.insights.map((insight) => <article className="life-insight-card" key={insight._id}><div><span>{insight.kind}</span><small>Evidence quality: {insight.quality}</small></div><p>{insight.message}</p><button className="life-link-button" type="button" disabled={busy} onClick={() => dismiss(insight._id)}>Dismiss</button></article>) : <LifeEmpty title="No reliable pattern yet" message="A little more recorded history may make a useful observation possible." />}</section>
      <form className="life-card life-review-card" onSubmit={saveReview}><span>{days === 7 ? "Weekly" : "Monthly"} review</span><h2>What do you notice?</h2><p>Numbers are context. Your interpretation belongs beside them.</p><textarea value={review} onChange={(event) => setReview(event.target.value)} placeholder="What worked? What felt heavy? What is one gentle adjustment?" required /><button className="life-primary-button" disabled={busy}>Save to journal</button></form>
    </div>
    <p className="life-language-boundary">{data.languageBoundary}</p>
  </div>;
}
