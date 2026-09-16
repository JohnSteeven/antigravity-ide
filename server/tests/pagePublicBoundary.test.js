"use strict";

const express = require("express");
const request = require("supertest");
const Page = require("../models/Page");
const Layout = require("../models/Layout");
const FeatureFlag = require("../models/FeatureFlag");
const PageService = require("../services/pageService");
const FeatureFlagService = require("../services/featureFlagService");
const pageController = require("../controllers/pageController");
const AuditLogger = require("../audit/AuditLogger");
const pageRoutes = require("../routes/pageRoutes");

describe("Published Page authorization and honest content delivery", () => {
  let page;
  let findPage;
  let insertPages;
  let updateViews;
  let layout;
  const app = express();
  app.use(express.json());
  app.use("/api/pages", pageRoutes);

  beforeEach(() => {
    page = {
      _id: "page-a", slug: "example", title: "Example", status: "published", visibility: "public",
      layoutKey: "minimal", blocks: [{ id: "visible", type: "rich_text", visibility: true, props: { body: "Public content" } }],
      permissions: { roles: [] }, history: [{ blocks: [{ props: { body: "Old private content" } }] }],
      settings: { privateNote: "Internal only" }, createdBy: "admin-id", updatedBy: "admin-id",
    };
    findPage = jest.spyOn(Page, "findOne").mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(page) }));
    insertPages = jest.spyOn(Page, "insertMany").mockResolvedValue([]);
    updateViews = jest.spyOn(Page, "findByIdAndUpdate").mockResolvedValue({});
    layout = jest.spyOn(Layout, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue({ key: "minimal", status: "published", createdBy: "internal-id" }) });
  });

  afterEach(() => jest.restoreAllMocks());

  test.each(["private", "password", "members", undefined])("does not deliver %s Pages through the public slug endpoint", async (visibility) => {
    page.visibility = visibility;
    const result = await request(app).get("/api/pages/slug/example");
    expect(result.status).toBe(404);
    expect(JSON.stringify(result.body)).not.toContain("Public content");
    expect(updateViews).not.toHaveBeenCalled();
    expect(layout).not.toHaveBeenCalled();
  });

  test("queries only explicitly public published Pages and omits management data", async () => {
    const result = await request(app).get("/api/pages/slug/EXAMPLE");
    expect(result.status).toBe(200);
    expect(findPage).toHaveBeenCalledWith({ slug: "example", status: "published", visibility: "public" });
    expect(result.headers["cache-control"]).toBe("private, no-store");
    expect(result.body.data.blocks[0].props.body).toBe("Public content");
    for (const key of ["history", "settings", "permissions", "createdBy", "updatedBy"]) expect(result.body.data).not.toHaveProperty(key);
    expect(result.body.data.layout).not.toHaveProperty("createdBy");
    expect(insertPages).not.toHaveBeenCalled();
  });

  test("an empty database remains empty after public and Admin list reads", async () => {
    page = null;
    expect((await request(app).get("/api/pages/slug/privacy")).status).toBe(404);
    jest.spyOn(Page, "find").mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await pageController.getPages({ user: { id: "admin-a" }, query: {} }, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    expect(insertPages).not.toHaveBeenCalled();
  });

  test.each([
    ["draft", { status: "draft" }],
    ["scheduled", { publishDate: new Date(Date.now() + 86400000) }],
    ["expired", { expireDate: new Date(Date.now() - 1000) }],
    ["invalid schedule", { expireDate: "invalid-date" }],
    ["restricted role", { permissions: { roles: ["Admin"] } }],
  ])("denies %s content before delivering blocks", async (_name, patch) => {
    Object.assign(page, patch);
    const result = await request(app).get("/api/pages/slug/example?userRole=Admin&userId=admin-a");
    expect(result.status).toBe(404);
    expect(updateViews).not.toHaveBeenCalled();
  });

  test("honors trusted role context for restricted public Pages", async () => {
    page.permissions.roles = ["Admin"];
    await expect(PageService.getBySlug("example", { userRole: "Admin", userId: "admin-a" })).resolves.toMatchObject({ title: "Example" });
  });

  test("unknown page flags fail closed without changing legacy feature callers", async () => {
    page.featureFlag = "missing-feature";
    jest.spyOn(FeatureFlag, "findOne").mockResolvedValue(null);
    expect((await request(app).get("/api/pages/slug/example")).status).toBe(404);
    await expect(FeatureFlagService.evaluate("missing-feature")).resolves.toMatchObject({ allowed: true });
  });

  test("filters hidden, role-restricted, and unavailable feature blocks", async () => {
    page.blocks.push(
      { id: "hidden", visibility: false, props: { body: "Hidden data" } },
      { id: "admin", visibility: true, roles: ["Admin"], props: { body: "Admin data" } },
      { id: "disabled", visibility: true, featureFlag: "off", props: { body: "Feature data" } }
    );
    jest.spyOn(FeatureFlagService, "evaluate").mockResolvedValue({ allowed: false });
    const result = await request(app).get("/api/pages/slug/example");
    expect(result.status).toBe(200);
    expect(result.body.data.blocks.map((block) => block.id)).toEqual(["visible"]);
  });

  test("feature evaluation failures never fall through to public delivery", async () => {
    page.featureFlag = "unavailable";
    jest.spyOn(FeatureFlagService, "evaluate").mockRejectedValue(new Error("Database unavailable"));
    const result = await request(app).get("/api/pages/slug/example");
    expect(result.status).toBe(500);
    expect(result.body).not.toHaveProperty("data");
    expect(updateViews).not.toHaveBeenCalled();
  });

  test.each([
    ["privacy", "Your privacy is important to us. We do not collect or sell personal data."],
    ["terms", "By accessing MyJourney you agree to our terms of use."],
  ])("quarantines the exact old generated %s placeholder without mutating it", async (slug, body) => {
    Object.assign(page, { slug, isSystem: true, blocks: [{ visibility: true, props: { body } }] });
    expect((await request(app).get(`/api/pages/slug/${slug}`)).status).toBe(404);
    expect(updateViews).not.toHaveBeenCalled();
    page.blocks[0].props.body = "Replacement content supplied through the CMS.";
    expect((await request(app).get(`/api/pages/slug/${slug}`)).status).toBe(200);
  });

  test("create and update retain explicit CMS visibility, roles, and schedules", async () => {
    findPage.mockResolvedValue(null);
    const save = jest.spyOn(Page.prototype, "save").mockImplementation(async function savePage() { return this; });
    jest.spyOn(AuditLogger, "log").mockResolvedValue({});
    const input = { title: "Private page", slug: "private-page", status: "published", visibility: "private", permissions: { roles: ["Admin"] }, publishDate: "2026-01-01T00:00:00.000Z", expireDate: "2027-01-01T00:00:00.000Z" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await pageController.createPage({ body: input, user: {} }, res);
    const created = save.mock.instances[0];
    expect(created.visibility).toBe("private");
    expect(created.permissions.roles).toEqual(["Admin"]);
    expect(created.publishDate.toISOString()).toBe(input.publishDate);
    expect(created.expireDate.toISOString()).toBe(input.expireDate);
    jest.spyOn(Page, "findById").mockResolvedValue(created);
    await pageController.updatePage({ params: { id: created._id }, body: { visibility: "members", publishDate: null, expireDate: null }, user: {} }, res);
    expect(created.visibility).toBe("members");
    expect(created.publishDate).toBeNull();
    expect(created.expireDate).toBeNull();
  });
});
