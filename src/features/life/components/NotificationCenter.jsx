import React, { useEffect, useState } from "react";
import { FiBell, FiCheck, FiClock } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeEmpty, LifeError, LifeLoading } from "./LifeUI";

const readableTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "";

export default function NotificationCenter({ open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { const response = await lifeApi.notifications(); setData(response.data || response); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open]);
  const markRead = async (id) => { await lifeApi.readNotification(id); await load(); };
  return <LifeDialog open={open} title="Life notifications" onClose={onClose} wide><div className="life-notification-center">
    {loading && <LifeLoading label="Gathering your reminders…" />}
    {error && <LifeError message={error} onRetry={load} />}
    {!loading && !error && data && <>
      <section><h3><FiBell /> Recent</h3>{data.notifications?.length ? <div className="life-notification-list">{data.notifications.map((item) => <article key={item._id} className={item.status === "read" ? "is-read" : ""}><div><strong>{item.title || "Life reminder"}</strong><p>{item.message || item.body}</p><small>{readableTime(item.createdAt)}</small></div>{item.status !== "read" && <button type="button" className="life-icon-button" onClick={() => markRead(item._id)} aria-label={`Mark ${item.title || "notification"} read`}><FiCheck /></button>}</article>)}</div> : <LifeEmpty title="Quiet for now" message="Useful reminders and briefs will appear here when enabled." />}</section>
      {data.upcoming?.length > 0 && <section><h3><FiClock /> Upcoming</h3><div className="life-notification-list">{data.upcoming.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.message}</p><small>{readableTime(item.dueAt)}</small></div></article>)}</div></section>}
      {data.recent?.some((item) => item.status === "failed") && <details className="life-advanced"><summary>Reminders needing attention</summary><p>One or more reminders could not reach a configured channel. Review notification settings or browser permission.</p></details>}
    </>}
  </div></LifeDialog>;
}

