const MigrationRunner = require("../migrations/MigrationRunner");

describe("migration index validation", () => {
  test("rejects a same-name index whose security-relevant options differ", async () => {
    const db = {
      collection: jest.fn(() => ({
        indexes: jest.fn().mockResolvedValue([{
          name: "dedupe_unique",
          key: { owner: 1, requestId: 1 },
          unique: false,
          partialFilterExpression: { requestId: { $exists: true } },
        }]),
      })),
    };
    const runner = new MigrationRunner(db);
    runner.loadMigrations = () => [{
      name: "999-test",
      indexes: {
        events: [[
          { owner: 1, requestId: 1 },
          {
            unique: true,
            name: "dedupe_unique",
            partialFilterExpression: { requestId: { $type: "string" } },
          },
        ]],
      },
    }];
    runner.getApplied = async () => new Set(["999-test"]);

    await expect(runner.validate()).resolves.toMatchObject({
      valid: false,
      checks: [{ status: "invalid", missingIndexes: ["events.dedupe_unique"] }],
    });
  });

  test("accepts an equivalent index even when its generated name differs", async () => {
    const db = {
      collection: jest.fn(() => ({
        indexes: jest.fn().mockResolvedValue([{
          name: "expiresAt_1",
          key: { expiresAt: 1 },
          expireAfterSeconds: 0,
        }]),
      })),
    };
    const runner = new MigrationRunner(db);
    runner.loadMigrations = () => [{
      name: "999-test",
      indexes: {
        sessions: [[
          { expiresAt: 1 },
          { expireAfterSeconds: 0, name: "session_expiry_ttl" },
        ]],
      },
    }];
    runner.getApplied = async () => new Set(["999-test"]);

    await expect(runner.validate()).resolves.toMatchObject({
      valid: true,
      checks: [{ status: "valid", missingIndexes: [] }],
    });
  });
});
