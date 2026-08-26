const migration = require("../migrations/010-theme-safety-foundation");

describe("theme safety migration", () => {
  test("targets only the built-in Dark Pro legacy defaults", async () => {
    const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const db = { collection: jest.fn(() => ({ updateMany })) };

    await migration.up(db);

    expect(db.collection).toHaveBeenCalledWith("themes");
    expect(updateMany).toHaveBeenCalledWith(
      { key: "dark-pro", isBuiltIn: true },
      [expect.objectContaining({ $set: expect.objectContaining({
        "tokens.colors.surface": expect.any(Object),
        "tokens.colors.panel": expect.any(Object),
        "tokens.colors.muted": expect.any(Object),
      }) })]
    );
  });
});
