import React, { useState } from "react";
import { FiCheck, FiEyeOff, FiStar, FiSunrise } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { addDateDays, localDateInput } from "../utils/lifeFormat";
import { formatMoney } from "../utils/lifeFormat";
import { LifeDialog, LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";

const reportParams = (range, start, end) => range === "ytd" ? { period: "ytd" } : range === "custom" ? { start, end } : { days: range };

export default function InsightsPage() {
  const today = localDateInput();
  const [range, setRange] = useState(7);
  const [customStart, setCustomStart] = useState(addDateDays(today, -29));
  const [customEnd, setCustomEnd] = useState(today);
  const params = reportParams(range, customStart, customEnd);
  const query = useLifeQuery(() => lifeApi.report(params), [range, customStart, customEnd]);
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [plan, setPlan] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const feedback = async (id, action) => { setBusy(true); try { await lifeApi.insightFeedback(id, action); setNotice(action === "useful" ? "Marked useful." : action === "hide_similar" ? "Similar observations will stay hidden." : "Observation dismissed."); await query.refresh({ quiet: true }); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const saveReview = async (event) => {
    event.preventDefault(); setBusy(true);
    try { await lifeApi.createJournal({ type: Number(range) <= 7 ? "weekly_review" : "monthly_review", localDate: today, title: Number(range) <= 7 ? "Weekly review" : "Period review", body: review }); setReview(""); setNotice("Review saved in your private journal."); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const generateAiReview = async () => { setBusy(true); setAiReview(""); try { const response = await lifeApi.aiReview(params); setAiReview((response.data || response).review); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const askAi = async (event) => { event.preventDefault(); setBusy(true); setAnswer(""); try { const response = await lifeApi.aiAsk({ ...params, question }); setAnswer((response.data || response).answer); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const openPlan = async () => { setPlanOpen(true); setPlan(null); try { const response = await lifeApi.planTomorrow(); setPlan(response.data || response); } catch (error) { setNotice(error.message); } };
  if (query.loading) return <LifeLoading label="Preparing your private report…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const data = query.data || { habits: {}, health: {}, money: {}, goals: [], insights: [] };
  return <div>
    <LifePageHeader eyebrow="Patterns, not verdicts" title="Insights & reviews" description="Deterministic summaries of your recorded data. Weak evidence is suppressed and sensitive AI use stays optional." actions={<button type="button" className="life-secondary-button" onClick={openPlan}><FiSunrise /> Plan tomorrow</button>} />
    <div className="life-report-controls"><div className="life-segmented" aria-label="Report range">{[7, 30, 90].map((value) => <button type="button" key={value} className={range === value ? "is-active" : ""} onClick={() => setRange(value)}>{value} days</button>)}<button type="button" className={range === "ytd" ? "is-active" : ""} onClick={() => setRange("ytd")}>Year to date</button><button type="button" className={range === "custom" ? "is-active" : ""} onClick={() => setRange("custom")}>Custom</button></div>{range === "custom" && <div className="life-custom-range"><label>From<input type="date" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} /></label><label>To<input type="date" value={customEnd} min={customStart} max={today} onChange={(event) => setCustomEnd(event.target.value)} /></label></div>}</div>
    <LifeNotice tone={/could|unavailable|enable/i.test(notice) ? "error" : "success"}>{notice}</LifeNotice>
    <p className="life-report-period">{data.start} to {data.end}</p>
    <section className="life-stat-grid" aria-label="Habit report"><article><span>Planned</span><strong>{data.habits.planned || 0}</strong></article><article><span>Completed</span><strong>{data.habits.completed || 0}</strong></article><article><span>Partial</span><strong>{data.habits.partial || 0}</strong></article><article><span>Recorded consistency</span><strong>{data.habits.consistency || 0}%</strong></article></section>
    <div className="life-insights-grid">
      <section><h2>Observations</h2>{data.insights?.length ? data.insights.map((insight) => <article className="life-insight-card" key={insight._id}><div><span>{insight.kind}</span><small>{insight.sampleSize ? `${insight.sampleSize} records · ` : ""}{insight.quality} evidence</small></div><p>{insight.message}</p><div className="life-inline-actions"><button className="life-link-button" type="button" disabled={busy} onClick={() => feedback(insight._id, "useful")}><FiCheck /> Useful</button><button className="life-link-button" type="button" disabled={busy} onClick={() => feedback(insight._id, "dismiss")}>Dismiss</button><button className="life-link-button" type="button" disabled={busy} onClick={() => feedback(insight._id, "hide_similar")}><FiEyeOff /> Hide similar</button></div></article>) : <LifeEmpty title="No reliable pattern yet" message="A little more recorded history may make a useful observation possible." />}
        <details className="life-card life-report-details"><summary>Health, goals, and money</summary><div className="life-report-sections"><section><h3>Health</h3><p>{data.health.workoutSessions || 0} workouts · {data.health.workoutMinutes || 0} minutes</p><p>{data.health.sleepNights || 0} sleep records{data.health.sleepAverageMinutes ? ` · ${Math.floor(data.health.sleepAverageMinutes / 60)}h ${data.health.sleepAverageMinutes % 60}m average` : ""}</p><p>{Math.round(data.health.waterMl || 0)} ml water recorded</p></section><section><h3>Goals</h3>{data.goals?.length ? data.goals.map((goal) => <p key={goal.id}>{goal.title} · {goal.progress}% · {goal.status}</p>) : <p>No goal records in this report.</p>}</section><section><h3>Money</h3>{Object.entries(data.money || {}).length ? Object.entries(data.money).map(([currency, summary]) => <p key={currency}>{formatMoney(summary.incomeMinor, currency)} income · {formatMoney(summary.expenseMinor, currency)} expenses</p>) : <p>No money entries in this report.</p>}</section></div></details>
      </section>
      <section className="life-card life-review-card"><span>Private reflection</span><h2>What do you notice?</h2><p>Numbers are context. Your interpretation belongs beside them.</p><textarea value={review} onChange={(event) => setReview(event.target.value)} placeholder="What worked? What felt heavy? What is one gentle adjustment?" required /><button type="button" className="life-primary-button" disabled={busy || !review.trim()} onClick={saveReview}>Save to journal</button><details className="life-advanced"><summary><FiStar /> Optional AI assistance</summary><p>Uses only the structured scopes you enabled in Settings. It never writes records.</p><button type="button" className="life-secondary-button" onClick={generateAiReview} disabled={busy}>Generate an editable review</button>{aiReview && <div className="life-ai-output"><p>{aiReview}</p><button type="button" className="life-link-button" onClick={() => setReview(aiReview)}>Use as reflection draft</button></div>}<form className="life-ai-ask" onSubmit={askAi}><label>Ask about this report<input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Which habits did I skip most?" required /></label><button className="life-secondary-button" disabled={busy}>Ask</button></form>{answer && <div className="life-ai-output"><strong>Grounded answer</strong><p>{answer}</p></div>}</details></section>
    </div>
    <p className="life-language-boundary">{data.languageBoundary}</p>
    <LifeDialog open={planOpen} title="Plan tomorrow" onClose={() => setPlanOpen(false)}>{!plan ? <LifeLoading label="Looking at tomorrow…" /> : <div className="life-plan"><p><strong>{plan.date}</strong> · {plan.recurringCount} recurring items already scheduled.</p>{plan.suggestions?.length ? plan.suggestions.map((item) => <div key={item.type} className="life-plan-suggestion"><p>{item.message}</p>{item.actions?.length > 0 && <ul>{item.actions.map((action) => <li key={action.id}>{action.title}</li>)}</ul>}</div>) : <LifeEmpty title="Tomorrow has room" message="No overload or unfinished one-time actions need attention." />}<p className="life-muted">Nothing is moved automatically. Recurring habits keep their normal next occurrence.</p><div className="life-dialog-actions"><button type="button" className="life-primary-button" onClick={() => setPlanOpen(false)}>Done</button></div></div>}</LifeDialog>
  </div>;
}
