jest.mock("../config/db", () => jest.fn());
jest.mock("../migrations/MigrationRunner", () => jest.fn());

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const MigrationRunner = require("../migrations/MigrationRunner");
const { parseArguments, run } = require("../scripts/runMigrations");

describe("migration CLI fail-closed arguments", () => {
  let disconnect;
  let table;
  const runner = { up: jest.fn(), down: jest.fn(), status: jest.fn(), validate: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
    connectDb.mockResolvedValue(undefined);
    disconnect = jest.spyOn(mongoose, "disconnect").mockResolvedValue(undefined);
    table = jest.spyOn(console, "table").mockImplementation(() => {});
    MigrationRunner.mockImplementation(() => runner);
    runner.up.mockResolvedValue(undefined);
    runner.down.mockResolvedValue(undefined);
    runner.status.mockResolvedValue([]);
    runner.validate.mockResolvedValue({ valid: true, checks: [] });
  });
  afterEach(() => { disconnect.mockRestore(); table.mockRestore(); });

  test.each([
    ["stats"], ["validate", "up"], ["down", "0"], ["down", "-1"], ["down", "all"],
    ["down", "1.5"], ["down", "Infinity"], ["down", "9007199254740992"], ["up", "1"], ["down", "1", "extra"],
  ])("rejects %j before connecting or creating a runner", async (...args) => {
    await expect(run(args)).rejects.toThrow("Usage:");
    expect(connectDb).not.toHaveBeenCalled();
    expect(MigrationRunner).not.toHaveBeenCalled();
    expect(disconnect).not.toHaveBeenCalled();
  });

  test.each([[], ["up"], ["status"], ["validate"], ["down"], ["down", "2"]])("executes only the explicit operation %j", async (...args) => {
    const { command, count } = parseArguments(args);
    await run(args);
    expect(connectDb).toHaveBeenCalledWith({ runSeeders: false });
    expect(runner[command]).toHaveBeenCalledTimes(1);
    if (command === "down") expect(runner.down).toHaveBeenCalledWith(count);
    Object.keys(runner).filter((name) => name !== command).forEach((name) => expect(runner[name]).not.toHaveBeenCalled());
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test("disconnects if the selected migration fails", async () => {
    runner.up.mockRejectedValueOnce(new Error("Migration write failed"));
    await expect(run(["up"])).rejects.toThrow("Migration write failed");
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
