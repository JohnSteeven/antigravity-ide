jest.mock("../config/db", () => jest.fn());
jest.mock("../models/Article", () => ({ findOneAndUpdate: jest.fn() }));
jest.mock("../models/Category", () => ({ findOne: jest.fn() }));
jest.mock("../models/User", () => ({ findOne: jest.fn() }));

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const User = require("../models/User");
const seedArticles = require("../scripts/seedArticles");

describe("development Article/Story fixture guard", () => {
  const originalEnvironment = process.env.NODE_ENV;
  afterEach(() => {
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
    jest.restoreAllMocks();
  });
  beforeEach(() => { jest.clearAllMocks(); });

  test.each(["production", "staging", "Development", "development ", "", undefined])("rejects NODE_ENV=%p before connecting or accessing data", async (environment) => {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
    await expect(seedArticles()).rejects.toThrow("NODE_ENV=development or NODE_ENV=test");
    await expect(seedArticles.runDirectly()).rejects.toThrow("NODE_ENV=development or NODE_ENV=test");
    expect(connectDb).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(Article.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test.each(["development", "test"])("permits only the intended fixture environment %s", async (environment) => {
    process.env.NODE_ENV = environment;
    connectDb.mockResolvedValue(undefined);
    User.findOne.mockRejectedValueOnce(new Error("Stop before fixture mutation"));
    const disconnect = jest.spyOn(mongoose, "disconnect").mockResolvedValue(undefined);
    jest.spyOn(console, "log").mockImplementation(() => {});
    await expect(seedArticles.runDirectly()).rejects.toThrow("Stop before fixture mutation");
    expect(connectDb).toHaveBeenCalledWith({ runSeeders: false });
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(Article.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
