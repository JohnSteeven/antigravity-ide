const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  QUEUE_RETENTION_MS,
  QUEUE_SCHEMA_VERSION,
  assessQueuedRecord,
  createQueueRecord,
  replayOwnedRecords,
} = require("../../src/features/life/offline/offlineQueuePolicy.cjs");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", "..", relative), "utf8");
const OWNER_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OWNER_B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ITEM_ID = "cccccccccccccccccccccccc";
const NOW = Date.parse("2026-09-03T00:00:00.000Z");

const taskRecord = (overrides = {}) => createQueueRecord({
  ownerId: OWNER_A,
  operationType: "task.create",
  path: "/api/life/tasks",
  method: "POST",
  body: { title: "One useful next step", localDate: "2026-09-03" },
  clientMutationId: "life-task-0001",
  now: NOW,
  ...overrides,
});

describe("Life offline private-data boundary", () => {
  test("binds records to an immutable account and refuses cross-account replay", async () => {
    const record = taskRecord();
    expect(record).toMatchObject({ schemaVersion: QUEUE_SCHEMA_VERSION, ownerId: OWNER_A, idempotencyKey: "life-task-0001" });
    expect(assessQueuedRecord(record, { ownerId: OWNER_B, now: NOW })).toEqual({ action: "discard", reason: "owner_mismatch" });
    const send = jest.fn();
    const remove = jest.fn();
    const result = await replayOwnedRecords({ records: [record], ownerId: OWNER_B, now: NOW, send, remove, update: jest.fn() });
    expect(send).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith(record.clientMutationId);
    expect(result.discarded).toBe(1);
  });

  test("discards legacy, unowned, expired, malformed, and unsupported records", () => {
    const current = taskRecord();
    expect(assessQueuedRecord({ ...current, schemaVersion: 1 }, { ownerId: OWNER_A, now: NOW }).reason).toBe("legacy");
    expect(assessQueuedRecord({ ...current, ownerId: "" }, { ownerId: OWNER_A, now: NOW }).reason).toBe("unowned");
    expect(assessQueuedRecord(current, { ownerId: OWNER_A, now: NOW + QUEUE_RETENTION_MS + 1 }).reason).toBe("expired");
    expect(assessQueuedRecord({ ...current, headers: { authorization: "secret" } }, { ownerId: OWNER_A, now: NOW }).reason).toBe("corrupted");
    expect(assessQueuedRecord({ ...current, expiresAt: new Date(NOW + (2 * QUEUE_RETENTION_MS)).toISOString() }, { ownerId: OWNER_A, now: NOW }).reason).toBe("corrupted");
    expect(assessQueuedRecord({ ...current, retryCount: 6 }, { ownerId: OWNER_A, now: NOW }).reason).toBe("corrupted");
    expect(assessQueuedRecord({ ...current, path: "/api/life/journal" }, { ownerId: OWNER_A, now: NOW }).reason).toBe("unsupported");
  });

  test("keeps false, zero, empty arrays, and partial completion while removing free text", () => {
    const record = createQueueRecord({
      ownerId: OWNER_A,
      operationType: "event.log",
      path: `/api/life/events/habit/${ITEM_ID}`,
      method: "POST",
      body: { status: "partial", quantity: 0, durationMinutes: 0, backfilled: false, routineSteps: [], note: "private note", password: "never-store-this" },
      clientMutationId: "life-event-0001",
      now: NOW,
    });
    expect(record.payload).toMatchObject({ status: "partial", quantity: 0, durationMinutes: 0, backfilled: false, routineSteps: [] });
    expect(record.payload).not.toHaveProperty("note");
    expect(record.payload).not.toHaveProperty("password");
  });

  test("rejects nested or malformed values in otherwise allowlisted fields", () => {
    const unsafeInputs = [
      { operationType: "task.create", path: "/api/life/tasks", body: { title: "x", lifeAreaId: { password: "secret" } } },
      { operationType: "task.create", path: "/api/life/tasks", body: { title: "x".repeat(161) } },
      { operationType: "task.create", path: "/api/life/tasks", body: { title: "x", linkedGoal: "not-an-id" } },
      { operationType: "event.log", path: `/api/life/events/habit/${ITEM_ID}`, body: { status: "partial", quantity: { token: "secret" } } },
      { operationType: "event.log", path: `/api/life/events/task/${ITEM_ID}`, body: { status: "completed", scheduledDate: "2026-02-31" } },
    ];

    for (const input of unsafeInputs) {
      expect(() => createQueueRecord({ ...input, ownerId: OWNER_A, method: "POST", clientMutationId: "life-invalid-01", now: NOW }))
        .toThrow(expect.objectContaining({ code: "LIFE_OFFLINE_PAYLOAD" }));
    }
  });

  test("rejects arbitrary and sensitive endpoints before persistence", () => {
    for (const [operationType, path] of [
      ["health.create", "/api/life/health"],
      ["journal.create", "/api/life/journal"],
      ["finance.create", "/api/life/money/entries"],
      ["event.log", `/api/life/events/medication/${ITEM_ID}`],
      ["task.create", "javascript:alert(1)"],
    ]) {
      expect(() => createQueueRecord({ ownerId: OWNER_A, operationType, path, method: "POST", body: { title: "x", status: "completed" }, clientMutationId: "life-reject-01", now: NOW })).toThrow(expect.objectContaining({ code: "LIFE_OFFLINE_UNSUPPORTED" }));
    }
  });

  test("replays one idempotency key once and removes duplicate records", async () => {
    const record = taskRecord();
    const send = jest.fn().mockResolvedValue({ success: true });
    const remove = jest.fn().mockResolvedValue(undefined);
    const result = await replayOwnedRecords({ records: [record, { ...record }], ownerId: OWNER_A, now: NOW, send, remove, update: jest.fn() });
    expect(send).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ synced: 1, discarded: 1 });
  });

  test("stops if the active account changes immediately before replay", async () => {
    const send = jest.fn();
    const result = await replayOwnedRecords({ records: [taskRecord()], ownerId: OWNER_A, now: NOW, send, remove: jest.fn(), update: jest.fn(), isOwnerActive: () => false });
    expect(send).not.toHaveBeenCalled();
    expect(result.pending).toBe(1);
  });

  test("keeps conflicts for explicit review and treats authorization loss as a purge signal", async () => {
    const conflictUpdate = jest.fn();
    const conflict = Object.assign(new Error("conflict"), { status: 409 });
    const conflictResult = await replayOwnedRecords({ records: [taskRecord()], ownerId: OWNER_A, now: NOW, send: jest.fn().mockRejectedValue(conflict), remove: jest.fn(), update: conflictUpdate });
    expect(conflictUpdate).toHaveBeenCalledWith(expect.objectContaining({ retryCount: 1, status: "needs_attention" }));
    expect(conflictResult).toMatchObject({ failed: 1, pending: 1, unauthorized: false });

    const unauthorized = Object.assign(new Error("expired"), { status: 401 });
    const unauthorizedResult = await replayOwnedRecords({ records: [taskRecord()], ownerId: OWNER_A, now: NOW, send: jest.fn().mockRejectedValue(unauthorized), remove: jest.fn(), update: jest.fn() });
    expect(unauthorizedResult.unauthorized).toBe(true);
  });

  test("wires logout, session invalidation, account change, and Life deletion to browser erasure", () => {
    const auth = read("src/context/AuthContext.js");
    const settings = read("src/features/life/pages/SettingsPage.jsx");
    const erasure = read("src/utils/privateBrowserData.js");
    expect(auth).toContain('purgePrivateBrowserData("logout")');
    expect(auth).toContain('purgePrivateBrowserData("session_invalidated")');
    expect(auth).toContain('purgePrivateBrowserData("account_change")');
    expect(auth).toContain('purgePrivateBrowserData("account_or_role_change")');
    expect(settings).toContain('clearLifeOfflineData("life_data_deleted")');
    expect(erasure).toContain('"myjourney-life-private"');
  });

  test("sensitive Life APIs remain online-only and the pending-sync UI supports user control", () => {
    const api = read("src/features/life/api/lifeApi.js");
    const status = read("src/features/life/components/LifeOfflineStatus.jsx");
    expect(api).toContain('createHealth: (body) => send("/health"');
    expect(api).toContain('createMoneyEntry: (body) => send("/money/entries"');
    expect(api).toContain('createJournal: (body) => send("/journal"');
    expect(api).not.toMatch(/queuedSend\("\/(health|journal|money)/);
    expect(status).toContain("Inspect");
    expect(status).toContain("Retry");
    expect(status).toContain("Discard");
    expect(status).toContain("Clear all pending changes");
    expect(status).toContain("not encrypted");
  });
});

describe("Life notification navigation", () => {
  const runClick = async (target) => {
    const listeners = {};
    const navigate = jest.fn().mockResolvedValue(undefined);
    const focus = jest.fn().mockResolvedValue(undefined);
    const openWindow = jest.fn().mockResolvedValue(undefined);
    const self = {
      location: { origin: "https://myjourney.example" },
      addEventListener: (type, listener) => { listeners[type] = listener; },
      clients: { matchAll: jest.fn().mockResolvedValue([{ url: "https://myjourney.example/", navigate, focus }]), openWindow },
      registration: { showNotification: jest.fn() },
      skipWaiting: jest.fn(),
    };
    vm.runInNewContext(read("life-sw.js"), { self, URL, caches: {} });
    let completion;
    listeners.notificationclick({ notification: { data: { url: target }, close: jest.fn() }, waitUntil: (promise) => { completion = promise; } });
    await completion;
    return { navigate, openWindow };
  };

  test.each([
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "//evil.example/life/goals",
    "https://evil.example/life/goals",
    "/cms",
    "/life/goals?token=secret",
    "/life/goals#private",
  ])("falls back for unsafe target %s", async (target) => {
    const { navigate, openWindow } = await runClick(target);
    expect(navigate).toHaveBeenCalledWith("/life/today");
    expect(openWindow).not.toHaveBeenCalled();
  });

  test("accepts only an allowlisted same-origin Life route", async () => {
    const { navigate } = await runClick("/life/goals");
    expect(navigate).toHaveBeenCalledWith("/life/goals");
  });

  test("reports PWA availability only after registration succeeds", () => {
    const registration = read("src/pwa/registerLifePwa.js");
    const capability = read("server/life/services/capabilityService.js");
    expect(registration).toContain('state: "registered"');
    expect(registration).toContain('state: "registration_failed"');
    expect(capability).toContain('available: null, state: "client_registration_required"');
  });

  test("the service worker never intercepts API, non-Life navigation, or image responses", () => {
    const listeners = {};
    const self = {
      location: { origin: "https://myjourney.example" },
      addEventListener: (type, listener) => { listeners[type] = listener; },
      clients: { claim: jest.fn() },
      registration: { showNotification: jest.fn() },
      skipWaiting: jest.fn(),
    };
    vm.runInNewContext(read("life-sw.js"), { self, URL, caches: {}, fetch: jest.fn().mockResolvedValue({ ok: false }) });
    const dispatch = (url, overrides = {}) => {
      const respondWith = jest.fn();
      listeners.fetch({
        request: { url, method: "GET", mode: "cors", destination: "", ...overrides },
        respondWith,
      });
      return respondWith;
    };

    expect(dispatch("https://myjourney.example/api/life/profile")).not.toHaveBeenCalled();
    expect(dispatch("https://myjourney.example/cms", { mode: "navigate", destination: "document" })).not.toHaveBeenCalled();
    expect(dispatch("https://myjourney.example/uploads/private-avatar.jpg", { destination: "image" })).not.toHaveBeenCalled();
    expect(dispatch("https://myjourney.example/life/today", { mode: "navigate", destination: "document" })).toHaveBeenCalledTimes(1);
  });

  test("service-worker upgrades delete only obsolete MyJourney Life shell caches", () => {
    const source = read("life-sw.js");
    expect(source).toContain('CACHE_NAME = "myjourney-life-shell-v2"');
    expect(source).toContain('key.startsWith("myjourney-life-shell-") && key !== CACHE_NAME');
    expect(source).toContain("caches.delete(key)");
  });
});
