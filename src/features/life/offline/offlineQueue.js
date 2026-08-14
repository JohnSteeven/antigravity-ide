import { apiRequest } from "../../../services/authService";

const DB_NAME = "myjourney-life-private";
const STORE = "mutationQueue";
const DB_VERSION = 1;
const listeners = new Set();

export const createMutationId = () => globalThis.crypto?.randomUUID?.() || `life-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const supported = () => typeof indexedDB !== "undefined";
const openDb = () => new Promise((resolve, reject) => {
  if (!supported()) return reject(new Error("Offline storage is unavailable in this browser."));
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "clientMutationId" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("Offline storage could not be opened."));
});

const withStore = async (mode, operation) => {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
};

const emit = (detail) => {
  listeners.forEach((listener) => listener(detail));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("life:sync-status", { detail }));
};

export const subscribeToLifeSync = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const listQueuedMutations = async () => supported() ? (await withStore("readonly", (store) => store.getAll())) : [];
export const queueMutation = async (mutation) => {
  const record = { ...mutation, createdAt: mutation.createdAt || new Date().toISOString(), retryCount: mutation.retryCount || 0, status: mutation.status || "pending" };
  await withStore("readwrite", (store) => store.put(record));
  emit({ state: "pending", clientMutationId: record.clientMutationId });
  return record;
};
export const removeQueuedMutation = (clientMutationId) => withStore("readwrite", (store) => store.delete(clientMutationId));

export const queueOrSend = async ({ path, method, body, type, clientMutationId = createMutationId() }) => {
  const payload = { ...body };
  if (type === "event") payload.clientMutationId = payload.clientMutationId || clientMutationId;
  else if (type === "task") payload.clientMutationId = payload.clientMutationId || clientMutationId;
  else payload.dedupeKey = payload.dedupeKey || `offline:${clientMutationId}`;
  const mutation = { clientMutationId, type, path, method, payload };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueMutation(mutation);
    return { success: true, data: { queued: true, clientMutationId } };
  }
  try {
    return await apiRequest(path, { method, body: JSON.stringify(payload) });
  } catch (error) {
    if (![0, 408].includes(error.status)) throw error;
    await queueMutation(mutation);
    return { success: true, data: { queued: true, clientMutationId } };
  }
};

let syncing = false;
export const syncLifeQueue = async () => {
  if (syncing || (typeof navigator !== "undefined" && !navigator.onLine)) return { synced: 0, pending: (await listQueuedMutations()).length };
  syncing = true;
  const records = (await listQueuedMutations()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let synced = 0;
  let failed = 0;
  emit({ state: "syncing", pending: records.length });
  for (const record of records) {
    try {
      await apiRequest(record.path, { method: record.method, body: JSON.stringify(record.payload) });
      await removeQueuedMutation(record.clientMutationId);
      synced += 1;
    } catch (error) {
      failed += 1;
      await queueMutation({ ...record, retryCount: (record.retryCount || 0) + 1, status: error.status && error.status !== 0 ? "needs_attention" : "pending" });
      if ([0, 408].includes(error.status)) break;
    }
  }
  syncing = false;
  const pending = (await listQueuedMutations()).length;
  emit({ state: failed ? "needs_attention" : "synced", synced, failed, pending });
  if (synced && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("life:data-changed"));
  return { synced, failed, pending };
};

export const startLifeSync = () => {
  if (typeof window === "undefined") return () => {};
  const onOnline = () => syncLifeQueue().catch(() => emit({ state: "needs_attention" }));
  window.addEventListener("online", onOnline);
  if (navigator.onLine) onOnline();
  return () => window.removeEventListener("online", onOnline);
};
