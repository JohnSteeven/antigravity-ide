const fs = require("fs");
const path = require("path");
const CreatorEngagementEvent = require("../models/CreatorEngagementEvent");

const root = path.join(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const jsFiles = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = path.join(directory, entry.name);
  return entry.isDirectory() ? jsFiles(relative) : entry.name.endsWith(".js") ? [relative] : [];
});

describe("Creator and Learn ownership/privacy firewall", () => {
  test("application review routes require authenticated admin access", () => {
    const routes = read("server", "routes", "creatorRoutes.js");
    expect(routes).toContain('router.patch("/admin/applications/:id/status", authenticate, requireAdmin');
    expect(routes).toContain('router.patch("/admin/content/:contentType/:contentId/status", authenticate, requireAdmin');
  });

  test("every Studio route is behind active Creator middleware", () => {
    const routes = read("server", "routes", "creatorStudioRoutes.js");
    expect(routes).toContain("router.use(authenticate, requireActiveCreator)");
    expect(routes).not.toMatch(/req\.(body|params|query)\.creatorId/);
  });

  test("Learn progress ownership comes only from the authenticated user", () => {
    const controllers = read("server", "learn", "controllers.js");
    expect(controllers).toContain("userId: userId(req)");
    expect(controllers).not.toMatch(/req\.(body|params|query)\.userId/);
    expect(read("server", "learn", "courseService.js")).toContain("CourseEnrollment.findOne({ userId, courseId })");
  });

  test("Creator and Learn services never import private Life data", () => {
    const source = [...jsFiles("server/creators"), ...jsFiles("server/learn")].map((file) => read(file)).join("\n");
    expect(source).not.toMatch(/require\(["'][^"']*life\//i);
    expect(source).not.toMatch(/Life(Journal|Finance|Health|Medication|Goal|Habit|Task)/);
  });

  test("analytics stores actor identity privately and never returns learner rows", () => {
    expect(CreatorEngagementEvent.schema.path("actorUserId").options.select).toBe(false);
    expect(CreatorEngagementEvent.schema.path("sessionHash").options.select).toBe(false);
    const service = read("server", "creators", "engagementService.js");
    expect(service).toContain("Aggregated engagement only");
    expect(service).not.toMatch(/populate\(["']actorUserId/);
  });

  test("permanent account deletion removes private learning data and preserves published identity", () => {
    const deletion = read("server", "services", "accountDeletionService.js");
    ["CreatorApplication.deleteMany", "CourseEnrollment.deleteMany", "LearningEvent.deleteMany", "CreatorEngagementEvent.deleteMany", "ContentReport.deleteMany", "UserFollow.deleteMany"].forEach((contract) => expect(deletion).toContain(contract));
    expect(deletion).toContain('status: "deactivated"');
    expect(deletion).toContain("publishedContentPreserved: true");
  });

  test("protected uploads are not routed through the legacy public uploads mount", () => {
    const media = read("server", "learn", "mediaService.js");
    const asset = read("server", "models", "ProtectedMediaAsset.js");
    expect(asset).toContain("storageKey");
    expect(asset).toContain("select: false");
    expect(media).not.toContain('"/uploads/');
  });
});
