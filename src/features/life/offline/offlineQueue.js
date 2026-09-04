import { apiRequest } from "../../../services/authService";
import { purgePrivateBrowserData } from "../../../utils/privateBrowserData";
import queuePolicy from "./offlineQueuePolicy.cjs";

const {
  QUEUE_SCHEMA_VERSION,
  assessQueuedRecord,
  createQueueRecord,
  describeQueuedRecord,
  normalizeOwnerId,
  replayOwnedRecords,
  resolveOperation,
} = queuePolicy;

const DB_NAME = "myjourney-life-private";
const STORE = "mutationQueue";
const DB_VERSION = 2;
const listeners = new Set();
let activeOwnerId = "";
let ownerEpoch = 0;
let syncing = false;
let legacyRecordsDiscarded = false;

export const createMutationId = () => globalThis.crypto?.randomUUID?.() || `life-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const supported = () => typeof indexedDB !== "undefined";

const emit = (detail) => {
  listeners.forEach((listener) => listener(detail));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("life:sync-status", { detail }));
};

const openDb = () => new Promise((resolve, reject) => {
  if (!supported()) return reject(new Error("Offline storage is unavailable in this browser."));
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = (event) => {
    const db = request.result;
    const store = db.objectStoreNames.contains(STORE)
      ? request.transaction.objectStore(STORE)
      : db.createObjectStore(STORE, { keyPath: "clientMutationId" });
    if (event.oldVersion > 0 && event.oldVersion < DB_VERSION) {
      store.clear();
      legacyRecordsDiscarded = true;
    }
    if (!store.indexNames.contains("ownerId")) store.createIndex("ownerId", "ownerId", { unique: false });
    if (!store.indexNames.contains("expiresAt")) store.createIndex("expiresAt", "expiresAt", { unique: false });
    if (!store.indexNames.contains("status")) store.createIndex("status", "status", { unique: false });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("Offline storage could not be opened."));
  request.onblocked = () => reject(new Error("Offline storage is open in another tab. Close it and try again."));
});

const withStore = async (mode, operation) => {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Offline storage request failed."));
      transaction.onerror = () => reject(transaction.error || new Error("Offline storage transaction failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Offline storage transaction was stopped."));
    });
  } finally {
    db.close();
  }
};

const getAllRecords = async () => supported() ? (await withStore("readonly", (store) => store.getAll())) : [];
const putRecord = (record) => withStore("readwrite", (store) => store.put(record));
export const removeQueuedMutation = (clientMutationId) => supported() && clientMutationId
  ? withStore("readwrite", (store) => store.delete(clientMutationId))
  : Promise.resolve();

const discardUnsafeRecords = async (ownerId, now = Date.now()) => {
  const records = await getAllRecords();
  let discarded = 0;
  for (const record of records) {
    if (assessQueuedRecord(record, { ownerId, now }).action === "replay") continue;
    await removeQueuedMutation(record?.clientMutationId);
    discarded += 1;
  }
  if (discarded || legacyRecordsDiscarded) {
    emit({ state: "discarded", discarded: discarded + (legacyRecordsDiscarded ? 1 : 0), reason: legacyRecordsDiscarded ? "legacy_or_unsafe" : "unsafe" });
    legacyRecordsDiscarded = false;
  }
  return discarded;
};

export const subscribeToLifeSync = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

export const setLifeQueueOwner = async (ownerId) => {
  const normalized = normalizeOwnerId(ownerId);
  if (!normalized) throw Object.assign(new Error("Life offline storage needs an authenticated account."), { code: "LIFE_OFFLINE_OWNER_REQUIRED" });
  if (activeOwnerId && activeOwnerId !== normalized) await purgePrivateBrowserData("account_change");
  activeOwnerId = normalized;
  ownerEpoch += 1;
  await discardUnsafeRecords(activeOwnerId);
  return activeOwnerId;
};

export const clearLifeOfflineData = async (reason = "user_clear") => {
  activeOwnerId = "";
  ownerEpoch += 1;
  const results = await purgePrivateBrowserData(reason);
  emit({ state: "cleared", pending: 0, reason });
  return results;
};

export const listQueuedMutations = async () => {
  if (!activeOwnerId || !supported()) return [];
  await discardUnsafeRecords(activeOwnerId);
  return (await getAllRecords())
    .filter((record) => assessQueuedRecord(record, { ownerId: activeOwnerId }).action === "replay")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const queueMutation = async (input) => {
  const record = createQueueRecord({ ...input, ownerId: activeOwnerId });
  await putRecord(record);
  emit({ state: "pending", clientMutationId: record.clientMutationId });
  return record;
};

export const queueOrSend = async ({ path, method, body, operationType, clientMutationId = createMutationId() }) => {
  const spec = resolveOperation({ operationType, path, method });
  if (!spec) throw Object.assign(new Error("This Life change is not supported by offline storage."), { code: "LIFE_OFFLINE_UNSUPPORTED", status: 0 });
  const onlinePayload = { ...body, clientMutationId: body?.clientMutationId || clientMutationId };
  const mutation = { clientMutationId, operationType, path, method, body: onlinePayload };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const record = await queueMutation(mutation);
    return { success: true, data: { queued: true, clientMutationId: record.clientMutationId } };
  }
  try {
    return await apiRequest(path, { method, body: JSON.stringify(onlinePayload) });
  } catch (error) {
    if (![0, 408].includes(error.status)) throw error;
    const record = await queueMutation(mutation);
    return { success: true, data: { queued: true, clientMutationId: record.clientMutationId } };
  }
};

export const syncLifeQueue = async ({ onlyMutationId = "", includeNeedsAttention = false } = {}) => {
  if (syncing || !activeOwnerId || (typeof navigator !== "undefined" && !navigator.onLine)) return { synced: 0, pending: (await listQueuedMutations()).length };
  syncing = true;
  const ownerId = activeOwnerId;
  const epoch = ownerEpoch;
  try {
    const records = await getAllRecords();
    emit({ state: "syncing", pending: records.length });
    const result = await replayOwnedRecords({
      records,
      ownerId,
      onlyMutationId,
      includeNeedsAttention,
      isOwnerActive: (recordOwnerId) => ownerEpoch === epoch && activeOwnerId === recordOwnerId,
      send: (record) => apiRequest(record.path, { method: record.method, body: JSON.stringify(record.payload) }),
      remove: removeQueuedMutation,
      update: putRecord,
    });
    if (result.unauthorized) {
      await clearLifeOfflineData("session_expired");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("myjourney:auth-invalidated"));
      return { ...result, pending: 0 };
    }
    const pending = (await listQueuedMutations()).length;
    const state = result.failed || pending ? "needs_attention" : result.discarded ? "discarded" : "synced";
    emit({ state, ...result, pending });
    if (result.synced && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("life:data-changed"));
    return { ...result, pending };
  } finally {
    syncing = false;
  }
};

export const retryQueuedMutation = (clientMutationId) => syncLifeQueue({ onlyMutationId: clientMutationId, includeNeedsAttention: true });
export const discardQueuedMutation = async (clientMutationId) => { await removeQueuedMutation(clientMutationId); emit({ state: "discarded", clientMutationId }); };
export const clearQueuedMutations = async () => {
  if (!activeOwnerId || !supported()) return;
  const records = await listQueuedMutations();
  await Promise.all(records.map((record) => removeQueuedMutation(record.clientMutationId)));
  emit({ state: "cleared", pending: 0 });
};
export const inspectQueuedMutation = (record) => ({
  clientMutationId: record.clientMutationId,
  operationType: record.operationType,
  status: record.status,
  retryCount: record.retryCount,
  createdAt: record.createdAt,
  expiresAt: record.expiresAt,
  ...describeQueuedRecord(record),
});

export const startLifeSync = () => {
  if (typeof window === "undefined") return () => {};
  const onOnline = () => syncLifeQueue().catch(() => emit({ state: "needs_attention" }));
  const onPrivateDataCleared = () => { activeOwnerId = ""; ownerEpoch += 1; emit({ state: "cleared", pending: 0 }); };
  window.addEventListener("online", onOnline);
  window.addEventListener("myjourney:private-data-cleared", onPrivateDataCleared);
  if (navigator.onLine) onOnline();
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("myjourney:private-data-cleared", onPrivateDataCleared);
  };
};

export { QUEUE_SCHEMA_VERSION };
