import React, { useEffect, useState } from "react";
import { FiCloudOff, FiRefreshCw } from "react-icons/fi";
import { listQueuedMutations, subscribeToLifeSync } from "../offline/offlineQueue";

export default function LifeOfflineStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [pending, setPending] = useState(0);
  const [state, setState] = useState("idle");
  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    const updateQueue = (detail = {}) => { setState(detail.state || "idle"); listQueuedMutations().then((items) => setPending(items.length)).catch(() => {}); };
    window.addEventListener("online", updateNetwork); window.addEventListener("offline", updateNetwork);
    const unsubscribe = subscribeToLifeSync(updateQueue); updateQueue();
    return () => { window.removeEventListener("online", updateNetwork); window.removeEventListener("offline", updateNetwork); unsubscribe(); };
  }, []);
  if (online && !pending && !["syncing", "needs_attention"].includes(state)) return null;
  return <div className={`life-offline-banner ${online ? "is-online" : ""}`} role="status"><span>{state === "syncing" ? <FiRefreshCw className="is-spinning" /> : <FiCloudOff />}{!online ? `Offline${pending ? ` · ${pending} change${pending === 1 ? "" : "s"} waiting` : ""}` : state === "syncing" ? "Syncing private Life changes…" : state === "needs_attention" ? `${pending} change${pending === 1 ? "" : "s"} need attention` : `${pending} change${pending === 1 ? "" : "s"} waiting to sync`}</span></div>;
}

