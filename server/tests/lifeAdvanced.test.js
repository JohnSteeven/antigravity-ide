jest.mock("web-push", () => ({ setVapidDetails: jest.fn(), sendNotification: jest.fn() }));

const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeGoal = require("../life/models/LifeGoal");
const LifeHabit = require("../life/models/LifeHabit");
const LifeImportBatch = require("../life/models/LifeImportBatch");
const LifeJournalEntry = require("../life/models/LifeJournalEntry");
const LifePushSubscription = require("../life/models/LifePushSubscription");
const LifeRoutine = require("../life/models/LifeRoutine");
const LifeTask = require("../life/models/LifeTask");
const Notification = require("../models/Notification");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const TrustedDevice = require("../models/TrustedDevice");
const User = require("../models/User");
const accountDeletionService = require("../services/accountDeletionService");
const MigrationRunner = require("../migrations/MigrationRunner");
const advancedMigration = require("../migrations/005-life-os-advanced");
const financeImportService = require("../life/services/financeImportService");
const habitService = require("../life/services/habitService");
const integrationService = require("../life/services/integrationService");
const lifeAiService = require("../life/services/lifeAiService");
const lifeDataService = require("../life/services/lifeDataService");
const privacyService = require("../life/services/privacyService");
const profileService = require("../life/services/profileService");
const searchService = require("../life/services/searchService");
const templateService = require("../life/services/templateService");

const chain = (rows) => ({ select: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(rows) });

describe("LifeOS advanced privacy and capability contracts", () => {
  const originalEnv = { ...process.env };
  afterEach(() => { jest.restoreAllMocks(); process.env = { ...originalEnv }; });

  test("private search applies the requesting user to every Life collection", async () => {
    const userId = "64b000000000000000000001";
    const models = [LifeHabit, LifeGoal, LifeRoutine, LifeTask, LifeJournalEntry, LifeFinanceEntry];
    models.forEach((Model) => jest.spyOn(Model, "find").mockReturnValue(chain([])));
    const result = await searchService.searchLife(userId, "gym");
    models.forEach((Model) => expect(Model.find).toHaveBeenCalledWith(expect.objectContaining({ user: userId })));
    expect(result.privacy).toBe("private_user_scope");
    expect(JSON.stringify(result)).not.toContain("user-b");
  });

  test("templates are explicit starting points and create ordinary Life entities", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ timezone: "UTC" });
    jest.spyOn(habitService, "createHabit").mockResolvedValue({ _id: "habit-a", name: "Read gently" });
    const templates = templateService.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(6);
    await templateService.applyTemplate("user-a", "reading", { name: "Read gently", reminderEnabled: false, time: "20:15" });
    expect(habitService.createHabit).toHaveBeenCalledWith("user-a", expect.objectContaining({ name: "Read gently", reminder: expect.objectContaining({ enabled: false }) }));
    expect(habitService.createHabit.mock.calls[0][1]).not.toHaveProperty("templateRuntime");
  });

  test("routine templates remain customizable before normal routine creation", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ timezone: "UTC" });
    jest.spyOn(lifeDataService, "createRoutine").mockResolvedValue({ _id: "routine-a" });
    await templateService.applyTemplate("user-a", "morning-routine", { name: "My start", steps: ["Water", "Plan"], time: "08:00" });
    expect(lifeDataService.createRoutine).toHaveBeenCalledWith("user-a", expect.objectContaining({ name: "My start", items: [{ title: "Water", order: 0, linkedType: "routine_only" }, { title: "Plan", order: 1, linkedType: "routine_only" }] }));
  });

  test("CSV import previews invalid rows and never imports before confirmation", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ currency: "USD" });
    jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(chain([]));
    jest.spyOn(LifeImportBatch, "create").mockImplementation(async (value) => ({ _id: "batch-a", ...value }));
    const preview = await financeImportService.previewFinanceCsv("user-a", "date,amount,currency,category,id\n2026-08-10,12.50,USD,Food,tx-1\nbad-date,9,USD,Other,tx-2");
    expect(preview).toMatchObject({ rowsDetected: 2, validRows: 1, importableRows: 1, duplicateRows: 0 });
    expect(preview.invalidRows).toHaveLength(1);
    expect(LifeImportBatch.create).toHaveBeenCalled();
  });

  test("CSV parsing preserves quoted values and confirmation is atomically user-scoped", async () => {
    expect(financeImportService.parseCsv('date,note\n2026-08-10,"line one\nline two"')).toEqual([["date", "note"], ["2026-08-10", "line one\nline two"]]);
    expect(() => financeImportService.parseDateValue("08/09/2026")).toThrow(/ambiguous/i);
    const batch = { rows: [{ duplicate: false, type: "expense", amountMinor: 1200, currency: "USD", localDate: "2026-08-10", category: "Food", payee: "Cafe", note: "", externalId: "tx-1" }], invalidRows: [], status: "importing", save: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(LifeImportBatch, "findOneAndUpdate").mockResolvedValue(batch);
    jest.spyOn(LifeFinanceEntry, "insertMany").mockResolvedValue([{}]);
    const result = await financeImportService.confirmFinanceImport("user-a", "batch-a");
    expect(LifeImportBatch.findOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({ _id: "batch-a", user: "user-a", status: "preview" }), { $set: { status: "importing" } }, { new: true });
    expect(result).toMatchObject({ imported: 1, duplicatesSkipped: 0 });
    expect(batch.status).toBe("imported");
  });

  test("provider-independent integrations reject unavailable adapters honestly", async () => {
    const registry = new integrationService.ProviderRegistry("calendar", ["google"]);
    expect(registry.capabilities()).toEqual([{ provider: "google", state: "unavailable", capabilities: [] }]);
    await expect(registry.invoke("user-a", "google", "events", {})).rejects.toMatchObject({ code: "LIFE_CALENDAR_UNAVAILABLE" });
  });

  test("Life AI remains disabled without the server flag even when a user opted in", async () => {
    process.env.LIFE_AI_ENABLED = "false";
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ aiInsightsEnabled: true, aiReview: {} });
    await expect(lifeAiService.normalizedReviewInput("user-a", { days: 7 })).rejects.toMatchObject({ code: "LIFE_AI_UNAVAILABLE" });
  });

  test("push subscriptions cannot be claimed from another user", async () => {
    process.env.VAPID_SUBJECT = "mailto:test@example.com"; process.env.VAPID_PUBLIC_KEY = "public"; process.env.VAPID_PRIVATE_KEY = "private";
    jest.resetModules();
    const PushModel = require("../life/models/LifePushSubscription");
    jest.spyOn(PushModel, "findOne").mockResolvedValue({ user: "user-b" });
    const pushService = require("../life/services/webPushService");
    await expect(pushService.subscribe("user-a", { endpoint: "https://push.example/sub", keys: { p256dh: "key", auth: "auth" } })).rejects.toMatchObject({ code: "LIFE_PUSH_OWNERSHIP" });
  });

  test("account cleanup invokes every Life-owned collection with an exact user scope", async () => {
    const userId = "64b000000000000000000001";
    Object.values(privacyService.LIFE_OWNED_MODELS).forEach((Model) => jest.spyOn(Model, "deleteMany").mockResolvedValue({ deletedCount: 1 }));
    jest.spyOn(Notification, "deleteMany").mockResolvedValue({ deletedCount: 1 });
    const result = await privacyService.deleteAllLifeData(userId);
    Object.values(privacyService.LIFE_OWNED_MODELS).forEach((Model) => expect(Model.deleteMany).toHaveBeenCalledWith({ user: userId }));
    expect(Notification.deleteMany).toHaveBeenCalledWith({ user: userId, source: "life" });
    expect(Object.keys(result.deleted)).toEqual(expect.arrayContaining(Object.keys(privacyService.LIFE_OWNED_MODELS)));
  });

  test("permanent account deletion joins centralized Life cleanup and auth cleanup", async () => {
    jest.spyOn(privacyService, "deleteAllLifeData").mockResolvedValue({ deleted: { habits: 1 } });
    [Session, RefreshToken, TrustedDevice].forEach((Model) => jest.spyOn(Model, "deleteMany").mockResolvedValue({ deletedCount: 1 }));
    jest.spyOn(User, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    const result = await accountDeletionService.permanentlyDeleteAccount("user-a");
    expect(result).toMatchObject({ userDeleted: true, life: { habits: 1 }, authentication: { sessions: 1, refreshTokens: 1, trustedDevices: 1 } });
  });

  test("advanced migration is safe to rerun and validation is read-only", async () => {
    const collections = new Map();
    const db = { collection: (name) => {
      if (!collections.has(name)) collections.set(name, { items: [{ name: "_id_", key: { _id: 1 } }], indexes: jest.fn(async function indexes() { return this.items; }), createIndex: jest.fn(async function createIndex(keys, options) { this.items.push({ name: options.name, key: keys, ...options }); return options.name; }), dropIndex: jest.fn() });
      return collections.get(name);
    } };
    await advancedMigration.up(db); const firstCount = [...collections.values()].reduce((sum, collection) => sum + collection.items.length, 0);
    await advancedMigration.up(db); const secondCount = [...collections.values()].reduce((sum, collection) => sum + collection.items.length, 0);
    expect(secondCount).toBe(firstCount);
    const runner = new MigrationRunner(db); runner.loadMigrations = () => [{ name: "005-life-os-advanced", ...advancedMigration }]; runner.getApplied = async () => new Set(["005-life-os-advanced"]);
    const validation = await runner.validate();
    expect(validation.valid).toBe(true); expect(validation.checks[0].status).toBe("valid");
  });
});
