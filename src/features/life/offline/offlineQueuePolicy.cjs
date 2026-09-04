const QUEUE_SCHEMA_VERSION = 2;
const QUEUE_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_RETRY_COUNT = 5;
const OWNER_ID_PATTERN = /^[a-f\d]{24}$/i;
const MUTATION_ID_PATTERN = /^[a-zA-Z0-9:_-]{8,240}$/;
const EVENT_PATH_PATTERN = /^\/api\/life\/events\/(habit|task|goal_action)\/([a-f\d]{24})$/i;
const EVENT_STATUSES = new Set(["completed", "partial", "skipped", "missed", "snoozed"]);
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const TASK_PERIODS = new Set(["all_day", "morning", "afternoon", "evening"]);
const TASK_PRIORITIES = new Set(["none", "low", "medium", "high"]);
const TASK_STATUSES = new Set(["active", "archived"]);
const RECORD_KEYS = new Set([
  "schemaVersion", "clientMutationId", "idempotencyKey", "ownerId", "operationType",
  "path", "method", "payload", "createdAt", "expiresAt", "retryCount", "status",
]);

const OPERATION_SPECS = Object.freeze({
  "task.create": Object.freeze({
    path: "/api/life/tasks",
    method: "POST",
    payloadKeys: Object.freeze([
      "title", "localDate", "scheduledFor", "period", "priority", "linkedGoal",
      "lifeAreaId", "durationEstimateMinutes", "status", "clientMutationId",
    ]),
  }),
  "event.log": Object.freeze({
    pathPattern: EVENT_PATH_PATTERN,
    method: "POST",
    payloadKeys: Object.freeze([
      "status", "scheduledDate", "scheduledTime", "scheduledFor", "occurredAt",
      "quantity", "unit", "durationMinutes", "snoozedUntil", "clientMutationId",
      "backfilled", "routineSteps",
    ]),
  }),
});

const queueError = (message, code) => Object.assign(new Error(message), { code, status: 0 });
const normalizeOwnerId = (ownerId) => OWNER_ID_PATTERN.test(String(ownerId || "")) ? String(ownerId).toLowerCase() : "";
const isBoundedString = (value, max, { nonEmpty = false } = {}) => typeof value === "string"
  && value.length <= max
  && (!nonEmpty || value.trim().length > 0);
const isDateKey = (value) => {
  if (!DATE_KEY_PATTERN.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const isIsoDateTime = (value) => typeof value === "string"
  && ISO_DATE_TIME_PATTERN.test(value)
  && Number.isFinite(Date.parse(value));
const isFiniteNumberInRange = (value, min = -Number.MAX_VALUE, max = Number.MAX_VALUE) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return value >= min && value <= max;
};
const optional = (payload, key, validate, { nullable = false } = {}) => !Object.prototype.hasOwnProperty.call(payload, key)
  || (nullable && payload[key] === null)
  || validate(payload[key]);

const resolveOperation = ({ operationType, path, method }) => {
  const spec = OPERATION_SPECS[operationType];
  const normalizedMethod = String(method || "").toUpperCase();
  if (!spec || normalizedMethod !== spec.method) return null;
  if (spec.path && path !== spec.path) return null;
  if (spec.pathPattern && !spec.pathPattern.test(String(path || ""))) return null;
  return spec;
};

const sanitizePayload = (payload, spec) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const sanitized = {};
  for (const key of spec.payloadKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) sanitized[key] = payload[key];
  }
  return sanitized;
};

const validatePayload = (operationType, payload) => {
  if (!payload) return false;
  if (!MUTATION_ID_PATTERN.test(String(payload.clientMutationId || ""))) return false;
  if (operationType === "task.create") {
    return isBoundedString(payload.title, 160, { nonEmpty: true })
      && optional(payload, "localDate", isDateKey)
      && optional(payload, "scheduledFor", isIsoDateTime, { nullable: true })
      && optional(payload, "period", (value) => TASK_PERIODS.has(value))
      && optional(payload, "priority", (value) => TASK_PRIORITIES.has(value))
      && optional(payload, "linkedGoal", (value) => value === "" || OWNER_ID_PATTERN.test(value), { nullable: true })
      && optional(payload, "lifeAreaId", (value) => isBoundedString(value, 80))
      && optional(payload, "durationEstimateMinutes", (value) => isFiniteNumberInRange(value, 0, 1440), { nullable: true })
      && optional(payload, "status", (value) => TASK_STATUSES.has(value));
  }
  if (operationType === "event.log") {
    if (!EVENT_STATUSES.has(payload.status)) return false;
    if (payload.routineSteps !== undefined && (!Array.isArray(payload.routineSteps) || payload.routineSteps.length > 0)) return false;
    return optional(payload, "scheduledDate", isDateKey)
      && optional(payload, "scheduledTime", (value) => TIME_PATTERN.test(value))
      && optional(payload, "scheduledFor", isIsoDateTime)
      && optional(payload, "occurredAt", isIsoDateTime)
      && optional(payload, "quantity", (value) => isFiniteNumberInRange(value), { nullable: true })
      && optional(payload, "unit", (value) => isBoundedString(value, 40))
      && optional(payload, "durationMinutes", (value) => isFiniteNumberInRange(value, 0), { nullable: true })
      && optional(payload, "snoozedUntil", isIsoDateTime)
      && optional(payload, "backfilled", (value) => typeof value === "boolean");
  }
  return false;
};

const createQueueRecord = ({ ownerId, operationType, path, method, body, clientMutationId, now = Date.now() }) => {
  const normalizedOwnerId = normalizeOwnerId(ownerId);
  if (!normalizedOwnerId) throw queueError("Offline saving needs an active verified account. Reconnect and try again.", "LIFE_OFFLINE_OWNER_REQUIRED");
  if (!MUTATION_ID_PATTERN.test(String(clientMutationId || ""))) throw queueError("This offline change could not be identified safely.", "LIFE_OFFLINE_MUTATION_ID");
  const spec = resolveOperation({ operationType, path, method });
  if (!spec) throw queueError("This Life change is not stored offline. Reconnect before trying again.", "LIFE_OFFLINE_UNSUPPORTED");
  const payload = sanitizePayload(body, spec);
  if (!payload) throw queueError("This Life change cannot be stored safely offline.", "LIFE_OFFLINE_PAYLOAD");
  payload.clientMutationId = payload.clientMutationId || clientMutationId;
  if (!validatePayload(operationType, payload)) throw queueError("This Life change cannot be stored safely offline.", "LIFE_OFFLINE_PAYLOAD");
  const createdAt = new Date(now).toISOString();
  return {
    schemaVersion: QUEUE_SCHEMA_VERSION,
    clientMutationId,
    idempotencyKey: clientMutationId,
    ownerId: normalizedOwnerId,
    operationType,
    path,
    method: spec.method,
    payload,
    createdAt,
    expiresAt: new Date(now + QUEUE_RETENTION_MS).toISOString(),
    retryCount: 0,
    status: "pending",
  };
};

const assessQueuedRecord = (record, { ownerId, now = Date.now() } = {}) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) return { action: "discard", reason: "corrupted" };
  if (record.schemaVersion !== QUEUE_SCHEMA_VERSION) return { action: "discard", reason: "legacy" };
  if (Object.keys(record).some((key) => !RECORD_KEYS.has(key))) return { action: "discard", reason: "corrupted" };
  const normalizedOwnerId = normalizeOwnerId(ownerId);
  if (!normalizeOwnerId(record.ownerId)) return { action: "discard", reason: "unowned" };
  if (!normalizedOwnerId || normalizeOwnerId(record.ownerId) !== normalizedOwnerId) return { action: "discard", reason: "owner_mismatch" };
  if (!MUTATION_ID_PATTERN.test(String(record.clientMutationId || "")) || record.idempotencyKey !== record.clientMutationId) return { action: "discard", reason: "corrupted" };
  const createdAt = Date.parse(record.createdAt);
  const expiresAt = Date.parse(record.expiresAt);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt <= createdAt || expiresAt - createdAt > QUEUE_RETENTION_MS || createdAt > now + (5 * 60 * 1000)) return { action: "discard", reason: "corrupted" };
  if (expiresAt <= now) return { action: "discard", reason: "expired" };
  if (!Number.isInteger(record.retryCount) || record.retryCount < 0 || record.retryCount > MAX_RETRY_COUNT || !["pending", "needs_attention"].includes(record.status)) return { action: "discard", reason: "corrupted" };
  const spec = resolveOperation(record);
  if (!spec) return { action: "discard", reason: "unsupported" };
  if (!record.payload || Object.keys(record.payload).some((key) => !spec.payloadKeys.includes(key))) return { action: "discard", reason: "corrupted" };
  if (!validatePayload(record.operationType, record.payload) || record.payload.clientMutationId !== record.clientMutationId) return { action: "discard", reason: "corrupted" };
  return { action: "replay" };
};

const describeQueuedRecord = (record) => {
  if (record?.operationType === "task.create") return { label: "Create task", detail: String(record.payload?.title || "Untitled task").slice(0, 120) };
  const match = String(record?.path || "").match(EVENT_PATH_PATTERN);
  const kind = match?.[1]?.replace("_", " ") || "Life item";
  return { label: `Update ${kind}`, detail: `${record?.payload?.status || "change"}${record?.payload?.scheduledDate ? ` · ${record.payload.scheduledDate}` : ""}` };
};

const replayOwnedRecords = async ({
  records,
  ownerId,
  now = Date.now(),
  send,
  remove,
  update,
  isOwnerActive = () => true,
  includeNeedsAttention = false,
  onlyMutationId = "",
}) => {
  const result = { synced: 0, failed: 0, discarded: 0, pending: 0, unauthorized: false };
  const seen = new Set();
  const ordered = [...(records || [])].sort((a, b) => String(a?.createdAt || "").localeCompare(String(b?.createdAt || "")));
  for (const record of ordered) {
    const assessment = assessQueuedRecord(record, { ownerId, now });
    if (assessment.action !== "replay" || seen.has(record?.idempotencyKey)) {
      await remove(record?.clientMutationId);
      result.discarded += 1;
      continue;
    }
    seen.add(record.idempotencyKey);
    if (onlyMutationId && record.clientMutationId !== onlyMutationId) continue;
    if (record.status === "needs_attention" && !includeNeedsAttention) { result.pending += 1; continue; }
    if (!isOwnerActive(record.ownerId)) { result.pending += 1; break; }
    try {
      await send(record);
      await remove(record.clientMutationId);
      result.synced += 1;
    } catch (error) {
      result.failed += 1;
      const retryCount = Math.min(MAX_RETRY_COUNT, record.retryCount + 1);
      if ([401, 403].includes(error?.status)) { result.unauthorized = true; break; }
      const conflict = [409, 422].includes(error?.status);
      await update({ ...record, retryCount, status: conflict || retryCount >= MAX_RETRY_COUNT ? "needs_attention" : "pending" });
      result.pending += 1;
      if ([0, 408].includes(error?.status) || Number(error?.status) >= 500) break;
    }
  }
  return result;
};

module.exports = {
  EVENT_PATH_PATTERN,
  MAX_RETRY_COUNT,
  OPERATION_SPECS,
  QUEUE_RETENTION_MS,
  QUEUE_SCHEMA_VERSION,
  assessQueuedRecord,
  createQueueRecord,
  describeQueuedRecord,
  normalizeOwnerId,
  replayOwnedRecords,
  resolveOperation,
};
