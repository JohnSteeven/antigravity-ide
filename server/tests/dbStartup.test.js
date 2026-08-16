describe("database startup lifecycle", () => {
  const loadConnectDb = ({ connectResult, connectError } = {}) => {
    jest.resetModules();
    const connection = { readyState: 0 };
    const mongoose = {
      connection,
      set: jest.fn(),
      connect: connectError
        ? jest.fn().mockRejectedValue(connectError)
        : jest.fn().mockImplementation(async () => {
            connection.readyState = 1;
            return connectResult || connection;
          }),
    };
    const seedCmsPermissionsAndRoles = jest.fn().mockResolvedValue(undefined);
    const seedArticles = jest.fn().mockResolvedValue(undefined);

    jest.doMock("mongoose", () => mongoose);
    jest.doMock("../config/env", () => ({ mongoUri: "mongodb://127.0.0.1:27017/test" }));
    jest.doMock("../config/seeder", () => seedCmsPermissionsAndRoles);
    jest.doMock("../scripts/seedArticles", () => seedArticles);

    return {
      connectDb: require("../config/db"),
      mongoose,
      seedArticles,
      seedCmsPermissionsAndRoles,
    };
  };

  afterEach(() => {
    delete process.env.SEED_DEMO_DATA;
    jest.restoreAllMocks();
  });

  test("waits for MongoDB before running startup seeders", async () => {
    const runtime = loadConnectDb();

    await expect(runtime.connectDb()).resolves.toBe(runtime.mongoose.connection);
    expect(runtime.mongoose.connect).toHaveBeenCalledWith(
      "mongodb://127.0.0.1:27017/test",
      { serverSelectionTimeoutMS: 3000 }
    );
    expect(runtime.seedCmsPermissionsAndRoles).toHaveBeenCalledTimes(1);
    expect(runtime.seedArticles).not.toHaveBeenCalled();
  });

  test("fails startup instead of serving while Mongoose is disconnected", async () => {
    const failure = new Error("server selection failed");
    const runtime = loadConnectDb({ connectError: failure });
    jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runtime.connectDb()).rejects.toBe(failure);
    expect(runtime.seedCmsPermissionsAndRoles).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "MongoDB connection failed; server startup aborted:",
      failure.message
    );
  });
});
