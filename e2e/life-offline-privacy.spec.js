const { test, expect } = require("@playwright/test");
const { fixtures } = require("./support/environment.cjs");

const DB_NAME = "myjourney-life-private";
const STORE_NAME = "mutationQueue";

const login = async (page, email = fixtures.primaryEmail) => {
  await page.goto("/login");
  await page.locator("#login-identifier").fill(email);
  await page.locator("#login-password").fill(fixtures.password);
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/auth/login") && response.request().method() === "POST"),
    page.locator('button[type="submit"]').click(),
  ]);
  await expect(page).not.toHaveURL(/\/login/);
};

const openLife = async (page) => {
  await page.goto("/life/today");
  const skip = page.getByRole("button", { name: "Skip setup" });
  if (await skip.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false)) {
    await Promise.all([
      page.waitForResponse((response) => response.url().endsWith("/api/life/onboarding/skip")),
      skip.click(),
    ]);
  }
  await expect(page.getByRole("heading", { name: /Today/ }).first()).toBeVisible();
};

const readQueue = (page) => page.evaluate(({ dbName, storeName }) => new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, 2);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "clientMutationId" });
  };
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result;
    const getAll = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    getAll.onerror = () => reject(getAll.error);
    getAll.onsuccess = () => { db.close(); resolve(getAll.result); };
  };
}), { dbName: DB_NAME, storeName: STORE_NAME });

const putQueueRecords = (page, records) => page.evaluate(({ dbName, storeName, records: values }) => new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, 2);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "clientMutationId" });
  };
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(storeName, "readwrite");
    values.forEach((record) => transaction.objectStore(storeName).put(record));
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => { db.close(); resolve(); };
  };
}), { dbName: DB_NAME, storeName: STORE_NAME, records });

const validRecord = (overrides = {}) => {
  const now = Date.now();
  const id = overrides.clientMutationId || `browser-${now}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    schemaVersion: 2,
    clientMutationId: id,
    idempotencyKey: id,
    ownerId: fixtures.primaryUserId,
    operationType: "event.log",
    path: `/api/life/events/task/${fixtures.articleId}`,
    method: "POST",
    payload: {
      status: "partial",
      scheduledDate: "2026-09-04",
      quantity: 0,
      backfilled: false,
      routineSteps: [],
      clientMutationId: id,
    },
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    retryCount: 0,
    status: "pending",
    ...overrides,
  };
};

const queueTaskThroughUi = async (page, title) => {
  await page.locator(".life-desktop-tools").getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("dialog", { name: "Quick capture" }).getByRole("button", { name: "Today action" }).click();
  await page.getByRole("dialog", { name: "Quick capture" }).getByLabel("Action").fill(title);
  await page.getByRole("dialog", { name: "Quick capture" }).getByRole("button", { name: "Save" }).click();
  await expect.poll(() => readQueue(page).then((items) => items.some((item) => item.payload?.title === title))).toBe(true);
  const close = page.getByRole("dialog", { name: "Quick capture" }).getByRole("button", { name: "Close", exact: true });
  if (await close.isVisible().catch(() => false)) await close.click();
};

test.describe.configure({ mode: "serial", timeout: 60_000 });

test("allowed offline records preserve values; unsafe records are discarded; review controls work", async ({ page, context }) => {
  await login(page);
  await openLife(page);
  await page.route("**/api/life/tasks", (route) => route.abort("internetdisconnected"));
  await context.setOffline(true);

  await queueTaskThroughUi(page, "Offline privacy browser task");
  let records = await readQueue(page);
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ ownerId: fixtures.primaryUserId, operationType: "task.create", path: "/api/life/tasks", method: "POST" });
  expect(records[0].payload).not.toHaveProperty("password");
  expect(records[0].payload).not.toHaveProperty("note");

  const preserved = validRecord();
  const corrupt = validRecord({ clientMutationId: "browser-corrupt", idempotencyKey: "browser-corrupt", password: "must-not-survive" });
  const legacy = validRecord({ clientMutationId: "browser-legacy1", idempotencyKey: "browser-legacy1", schemaVersion: 1 });
  const expired = validRecord({ clientMutationId: "browser-expired", idempotencyKey: "browser-expired", createdAt: "2026-09-01T00:00:00.000Z", expiresAt: "2026-09-01T01:00:00.000Z" });
  const wrongOwner = validRecord({ clientMutationId: "browser-wrongacct", idempotencyKey: "browser-wrongacct", ownerId: fixtures.secondaryUserId });
  const unsupported = validRecord({ clientMutationId: "browser-endpoint", idempotencyKey: "browser-endpoint", operationType: "journal.create", path: "/api/life/journal" });
  await putQueueRecords(page, [preserved, corrupt, legacy, expired, wrongOwner, unsupported]);

  records = await readQueue(page);
  expect(records.find((record) => record.clientMutationId === preserved.clientMutationId).payload).toMatchObject({ quantity: 0, backfilled: false, routineSteps: [] });

  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: /changes? waiting/ })).toBeVisible();
  records = await readQueue(page);
  expect(records.map((record) => record.clientMutationId).sort()).toEqual(expect.arrayContaining([preserved.clientMutationId]));
  expect(records.some((record) => ["browser-corrupt", "browser-legacy1", "browser-expired", "browser-wrongacct", "browser-endpoint"].includes(record.clientMutationId))).toBe(false);

  await page.getByRole("button", { name: "Review pending changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Pending offline changes" });
  await dialog.getByRole("button", { name: "Inspect" }).first().click();
  await expect(dialog.getByText("Operation")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Retry" }).first()).toBeEnabled();
  await dialog.getByRole("button", { name: "Retry" }).first().click();
  await dialog.getByRole("button", { name: "Discard" }).first().click();
  await dialog.getByRole("button", { name: "Clear all pending changes" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Discard every pending change");
  await dialog.getByRole("button", { name: "Discard all" }).click();
  await expect.poll(() => readQueue(page).then((items) => items.length)).toBe(0);
});

test("sensitive Quick Capture types are not queued and account switching never replays another account's record", async ({ page, context }) => {
  await login(page);
  await openLife(page);
  await page.route("**/api/life/tasks", (route) => route.abort("internetdisconnected"));
  await context.setOffline(true);

  const unsupportedChecks = [
    { name: "Quick note", fill: async (dialog) => dialog.getByLabel("Note").fill("Private journal text") },
    { name: "Water", fill: async () => {} },
    { name: "Expense", fill: async (dialog) => dialog.getByLabel("Amount").fill("12") },
  ];
  for (const check of unsupportedChecks) {
    await page.locator(".life-desktop-tools").getByRole("button", { name: "Add", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Quick capture" });
    if (!(await dialog.getByRole("button", { name: check.name }).isVisible().catch(() => false))) await dialog.getByRole("button", { name: /More capture types/ }).click();
    await dialog.getByRole("button", { name: check.name }).click();
    await check.fill(dialog);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => readQueue(page).then((items) => items.length)).toBe(0);
    await dialog.getByRole("button", { name: "← All capture types" }).click();
    await dialog.getByRole("button", { name: "Close dialog" }).click();
  }

  await queueTaskThroughUi(page, "Pending across logout boundary");

  await context.setOffline(false);
  await page.getByRole("button", { name: /Open account menu/ }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect.poll(() => readQueue(page).then((items) => items.length)).toBe(0);

  let replayAttempts = 0;
  await page.unroute("**/api/life/tasks");
  await page.route("**/api/life/tasks", async (route) => {
    if (route.request().method() === "POST") replayAttempts += 1;
    await route.continue();
  });
  await login(page, fixtures.secondaryEmail);
  await openLife(page);
  await page.waitForTimeout(750);
  expect(replayAttempts).toBe(0);
  expect(await readQueue(page)).toHaveLength(0);

  await putQueueRecords(page, [validRecord({ clientMutationId: "browser-expiry", idempotencyKey: "browser-expiry", ownerId: fixtures.secondaryUserId })]);
  await page.evaluate(() => window.dispatchEvent(new Event("myjourney:auth-invalidated")));
  await expect.poll(() => readQueue(page).then((items) => items.length)).toBe(0);
});

test("blocked IndexedDB deletion resolves safely after the other tab closes", async ({ page, context }) => {
  await login(page);
  await openLife(page);
  const second = await context.newPage();
  await second.goto("/");
  await context.setOffline(true);
  await queueTaskThroughUi(page, "Blocked deletion record");
  await second.evaluate(({ dbName }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { window.__lifeDbBlocker = request.result; resolve(); };
  }), { dbName: DB_NAME });

  await context.setOffline(false);
  await page.getByRole("button", { name: /Open account menu/ }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await second.evaluate(() => { window.__lifeDbBlocker?.close(); delete window.__lifeDbBlocker; });
  await second.close();
  await expect.poll(() => readQueue(page).then((items) => items.length)).toBe(0);
});

test("service worker activation purges old Life caches, excludes APIs, and reports a real registration", async ({ page, context }) => {
  await login(page);
  await openLife(page);
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const old = await caches.open("myjourney-life-shell-v1");
    await old.put("/", new Response("old"));
  });
  const replacement = await context.newPage();
  await page.close();
  await replacement.goto("/life/settings");
  const result = await replacement.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetch("/api/life/capabilities", { credentials: "include" });
    const registration = await navigator.serviceWorker.getRegistration();
    const keys = await caches.keys();
    const entries = (await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()))).flat().map((request) => request.url);
    return { scope: registration?.scope || "", keys, entries };
  });
  expect(result.scope).toBe(`${new URL(replacement.url()).origin}/`);
  expect(result.keys).not.toContain("myjourney-life-shell-v1");
  expect(result.keys).toContain("myjourney-life-shell-v2");
  expect(result.entries.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);

  const pwaCard = replacement.locator("section.life-card").filter({ has: replacement.getByRole("heading", { name: "Offline app shell" }) });
  await expect(pwaCard).toBeVisible();
  await expect(pwaCard.getByText(/registered/)).toBeVisible();
});

test("Life remains keyboard reachable without horizontal overflow at mobile and desktop widths", async ({ page }) => {
  await login(page);
  await openLife(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("heading", { name: /Today/ }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expect(page.locator(".life-offline-banner").or(page.locator("body"))).toBeVisible();
});
