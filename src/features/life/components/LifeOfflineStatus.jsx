import React, { useCallback, useEffect, useState } from "react";
import { FiCloudOff, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { LifeDialog, LifeNotice } from "./LifeUI";
import {
  clearQueuedMutations,
  discardQueuedMutation,
  inspectQueuedMutation,
  listQueuedMutations,
  retryQueuedMutation,
  subscribeToLifeSync,
} from "../offline/offlineQueue";

export default function LifeOfflineStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [items, setItems] = useState([]);
  const [state, setState] = useState("idle");
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshItems = useCallback(async () => {
    try { setItems(await listQueuedMutations()); }
    catch { setNotice("Pending changes could not be read from this browser."); }
  }, []);

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    const updateQueue = (detail = {}) => {
      setState(detail.state || "idle");
      if (detail.reason === "legacy_or_unsafe") setNotice("Older unowned or unsafe offline changes were discarded and were not sent.");
      refreshItems();
    };
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    const unsubscribe = subscribeToLifeSync(updateQueue);
    refreshItems();
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      unsubscribe();
    };
  }, [refreshItems]);

  const retry = async (id) => {
    setBusyId(id); setNotice("");
    try { await retryQueuedMutation(id); await refreshItems(); }
    catch { setNotice("That change could not be retried. It remains available to review or discard."); }
    finally { setBusyId(""); }
  };
  const discard = async (id) => {
    setBusyId(id); setNotice("");
    try { await discardQueuedMutation(id); await refreshItems(); }
    catch { setNotice("That pending change could not be discarded. Try again."); }
    finally { setBusyId(""); }
  };
  const clearAll = async () => {
    setBusyId("all"); setNotice("");
    try { await clearQueuedMutations(); await refreshItems(); setConfirmClear(false); setNotice("All pending changes were discarded from this browser."); }
    catch { setNotice("Pending changes could not be cleared. Try again."); }
    finally { setBusyId(""); }
  };

  const pending = items.length;
  if (online && !pending && !notice && !["syncing", "needs_attention"].includes(state)) return null;
  return <>
    <div className={`life-offline-banner ${online ? "is-online" : ""}`} role="status">
      <span>{state === "syncing" ? <FiRefreshCw className="is-spinning" aria-hidden="true" /> : <FiCloudOff aria-hidden="true" />}{!online ? `Offline${pending ? ` · ${pending} allowed change${pending === 1 ? "" : "s"} waiting` : " · sensitive changes require a connection"}` : state === "syncing" ? "Syncing allowed Life changes…" : notice && !pending ? notice : state === "needs_attention" ? `${pending} change${pending === 1 ? "" : "s"} need attention` : `${pending} change${pending === 1 ? "" : "s"} waiting to sync`}</span>
      {pending > 0 && <button type="button" className="life-link-button" onClick={() => setOpen(true)}>Review pending changes</button>}
    </div>
    <LifeDialog open={open} title="Pending offline changes" onClose={() => { setOpen(false); setConfirmClear(false); }} wide>
      <div className="life-offline-review">
        <p>Only minimal task and non-medication completion data can wait on this device. It is not encrypted, expires after 24 hours, and is cleared when your account session ends.</p>
        <LifeNotice tone={/could not|cannot/i.test(notice) ? "error" : "neutral"}>{notice}</LifeNotice>
        {!items.length ? <p className="life-muted">No changes are waiting.</p> : <ul className="life-offline-list">{items.map((record) => {
          const item = inspectQueuedMutation(record);
          const expanded = expandedId === item.clientMutationId;
          return <li key={item.clientMutationId}>
            <div><strong>{item.label}</strong><span>{item.detail}</span><small>{item.status.replace("_", " ")} · retries {item.retryCount}</small></div>
            <div className="life-offline-actions">
              <button type="button" className="life-link-button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? "" : item.clientMutationId)}>{expanded ? "Hide details" : "Inspect"}</button>
              <button type="button" className="life-secondary-button" disabled={!online || Boolean(busyId)} onClick={() => retry(item.clientMutationId)}>Retry</button>
              <button type="button" className="life-danger-button" disabled={Boolean(busyId)} onClick={() => discard(item.clientMutationId)}>Discard</button>
            </div>
            {expanded && <dl className="life-offline-details"><div><dt>Queued</dt><dd>{new Date(item.createdAt).toLocaleString()}</dd></div><div><dt>Expires</dt><dd>{new Date(item.expiresAt).toLocaleString()}</dd></div><div><dt>Operation</dt><dd>{item.operationType}</dd></div></dl>}
          </li>;
        })}</ul>}
        {items.length > 0 && (confirmClear ? <div className="life-offline-clear-confirm" role="alert"><p>Discard every pending change from this browser?</p><button type="button" className="life-secondary-button" onClick={() => setConfirmClear(false)}>Keep changes</button><button type="button" className="life-danger-button" disabled={Boolean(busyId)} onClick={clearAll}><FiTrash2 aria-hidden="true" /> Discard all</button></div> : <button type="button" className="life-danger-button" onClick={() => setConfirmClear(true)}>Clear all pending changes</button>)}
      </div>
    </LifeDialog>
  </>;
}
