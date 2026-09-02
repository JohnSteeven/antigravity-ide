import React from "react";
import { FiDroplet, FiMoon } from "react-icons/fi";
import { formatMinutes, formatMoney } from "../utils/lifeFormat";

export default function CompactTodaySummary({ today }) {
  const summary = today.summary;
  const planned = Number(summary.planned) || 0;
  const completed = Number(summary.completed) || 0;
  const partial = Number(summary.partial) || 0;
  const skipped = Number(summary.skipped) || 0;
  const remaining = Math.max(0, planned - completed - partial - skipped);
  const waterMl = Number(summary.water?.currentMl) || 0;
  const waterTargetMl = Number(summary.water?.targetMl) || 0;
  const sleepMinutes = Number(summary.sleep?.durationMinutes) || 0;
  const exerciseMinutes = Number(summary.exercise?.durationMinutes) || 0;
  const exerciseSessions = Number(summary.exercise?.sessions) || 0;
  const totalSpending = Object.entries(summary.spending || {})[0] || null;
  const next = Object.values(today.timeline.groups || {}).flat().filter((item) => !["completed", "skipped"].includes(item.status)).sort((a, b) => String(a.scheduledFor || "").localeCompare(String(b.scheduledFor || "")))[0];
  const planDetail = planned === 0 ? "Nothing planned yet" : [partial > 0 && `${partial} partial`, skipped > 0 && `${skipped} skipped`].filter(Boolean).join(" · ") || (remaining > 0 ? `${remaining} still open` : "Everything recorded");
  return <section className="life-daily-line" aria-label="Compact Today summary">
    <div className={planned === 0 ? "is-empty" : ""}><span>{next ? "Next" : "Plan"}</span><strong>{next ? next.title : planned > 0 ? `${completed} of ${planned}` : "Open day"}</strong><small>{next?.scheduledTime || planDetail}</small></div>
    {today.visibleModules.includes("water") && <div className={waterMl === 0 ? "is-empty" : ""}><span><FiDroplet aria-hidden="true" /> Water</span><strong>{waterMl > 0 ? `${(waterMl / 1000).toFixed(1)} L` : "Not started"}</strong><small>{waterTargetMl ? `${waterMl > 0 ? "of" : "Target"} ${(waterTargetMl / 1000).toFixed(1)} L` : "Set your own target"}</small></div>}
    {today.visibleModules.includes("sleep") && <div className={sleepMinutes === 0 ? "is-empty" : ""}><span><FiMoon aria-hidden="true" /> Sleep</span><strong>{sleepMinutes > 0 ? formatMinutes(sleepMinutes) : "Not logged"}</strong><small>{sleepMinutes > 0 ? (summary.sleep?.quality ? `Quality ${summary.sleep.quality}/5` : "Duration recorded") : "Add it when useful"}</small></div>}
    {today.visibleModules.includes("workouts") && <div className={exerciseMinutes === 0 && exerciseSessions === 0 ? "is-empty" : ""}><span>Movement</span><strong>{exerciseMinutes > 0 ? `${exerciseMinutes} min` : "No activity yet"}</strong><small>{exerciseSessions > 0 ? `${exerciseSessions} recorded session${exerciseSessions === 1 ? "" : "s"}` : "Nothing recorded today"}</small></div>}
    {today.visibleModules.includes("money") && <div className={!totalSpending ? "is-empty" : ""}><span>Spent</span><strong>{totalSpending ? formatMoney(totalSpending[1], totalSpending[0]) : "Nothing logged"}</strong><small>{totalSpending ? (Object.keys(summary.spending).length > 1 ? "Multiple currencies kept separate" : "Recorded today") : "No spending recorded"}</small></div>}
  </section>;
}

