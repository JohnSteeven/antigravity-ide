const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const connectDb = require("./config/db");
const env = require("./config/env");
const { authenticate } = require("./middleware/auth");
const { requireEntitlement } = require("./middleware/entitlement");
const { ENTITLEMENTS } = require("./premium/catalog");
const { csrfProtection, globalLimiter, sanitizeRequest } = require("./middleware/security");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── Core routes ────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const articleRoutes = require("./routes/articleRoutes");
const storyRoutes = require("./routes/storyRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const tagRoutes = require("./routes/tagRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const statsRoutes = require("./routes/statsRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const settingRoutes = require("./routes/settingRoutes");
const backupRoutes = require("./routes/backupRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const newsletterCampaignRoutes = require("./routes/newsletterCampaignRoutes");
const contactMessageRoutes = require("./routes/contactMessageRoutes");
const newsRoutes = require("./routes/newsRoutes");
const securityRoutes = require("./routes/securityRoutes");
const featureFlagRoutes = require("./routes/featureFlagRoutes");
const settingRegistryRoutes = require("./routes/settingRegistryRoutes");
const layoutRoutes = require("./routes/layoutRoutes");
const navigationRoutes = require("./routes/navigationRoutes");
const pageRoutes = require("./routes/pageRoutes");
const themeRoutes = require("./routes/themeRoutes");
const designTokenRoutes = require("./routes/designTokenRoutes");
const componentRoutes = require("./routes/componentRoutes");
const contentModelingRoutes = require("./routes/contentModelingRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const versionControlRoutes = require("./routes/versionControlRoutes");
const automationRoutes = require("./routes/automationRoutes");
const formRoutes = require("./routes/formRoutes");
const pluginRoutes = require("./routes/pluginRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const seoRoutes = require("./routes/seoRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const localizationRoutes = require("./routes/localizationRoutes");

// ── Stage 3: AI Platform ───────────────────────────────────────────────────────
// LEGACY: /api/ai/* remains while AskMyJourneyWidget migration completes.
// All new AI interactions should go through /api/agent/v1/*.
// Remove this route after regression-testing the full migration.
// Track with feature flag: agent_ai_legacy_enabled
const aiRoutes = require("./routes/aiRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const readerRoutes = require("./routes/readerRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const communityRoutes = require("./routes/communityRoutes");
const distributionRoutes = require("./routes/distributionRoutes");
const searchRoutes = require("./routes/searchRoutes");
const developerRoutes = require("./routes/developerRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const governanceRoutes = require("./routes/governanceRoutes");
const infrastructureRoutes = require("./routes/infrastructureRoutes");
const launchRoutes = require("./routes/launchRoutes");
const multiplayerRoutes = require("./routes/multiplayerRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const creatorStudioRoutes = require("./routes/creatorStudioRoutes");
const learnRoutes = require("./routes/learnRoutes");
const lifeRoutes = require("./life/routes");

// ── MyJourney Agent — canonical unified AI/agentic surface ────────────────────
const agentRoutes = require("./routes/agentRoutes");

const { multiplayerPlatform } = require("./multiplayer/platform");
const { attachMultiplayerSocketServer } = require("./multiplayer/realtime/socketServer");

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (env.nodeEnv === "production") app.use(globalLimiter);
app.use(sanitizeRequest);
app.use(csrfProtection);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "myjourney-api" });
});

// Auth & user routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/security", authenticate, securityRoutes);

// Content routes (public reads, admin writes)
app.use("/api/articles", articleRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/newsletter", subscriberRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/newsletter-campaigns", newsletterCampaignRoutes);
app.use("/api/contact-messages", contactMessageRoutes);
app.use("/api/contact", contactMessageRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/features", featureFlagRoutes);
app.use("/api/settings-registry", settingRegistryRoutes);
app.use("/api/layouts", layoutRoutes);
app.use("/api/navigation", navigationRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/design-tokens", designTokenRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/content-modeling", contentModelingRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/version-control", versionControlRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/plugins", pluginRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/localization", localizationRoutes);

// ── Stage 3–6 routes ─────────────────────────────────────────────────────────
app.use("/api/ai", aiRoutes);  // Legacy — transitional; see comment above
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reader", readerRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/distribution", distributionRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/governance", governanceRoutes);
app.use("/api/infrastructure", infrastructureRoutes);
app.use("/api/launch", launchRoutes);
app.use("/api/multiplayer", multiplayerRoutes);
app.use("/api/creators", creatorRoutes);
app.use("/api/creator-studio", creatorStudioRoutes);
app.use("/api/learn", learnRoutes);

// Life routes: Premium-gated, auth required.
// Export/delete privacy routes bypass entitlement check but still require auth.
const requireLifeAccess = requireEntitlement(ENTITLEMENTS.LIFE_ACCESS);
const lifeAccessPolicy = (req, res, next) => {
  const privacyRoute =
    (req.method === "GET" && req.path === "/settings/export") ||
    (req.method === "DELETE" && req.path === "/settings/data");
  return privacyRoute ? next() : requireLifeAccess(req, res, next);
};
app.use("/api/life", authenticate, lifeAccessPolicy, lifeRoutes);

// ── MyJourney Agent — canonical unified AI/agentic surface ────────────────────
// Authentication is enforced inside agentRoutes per endpoint.
// capabilities: optionalAuthenticate; all conversation endpoints: authenticate.
app.use("/api/agent/v1", agentRoutes);

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDb();
  multiplayerPlatform.readiness.storage = mongoose.connection.readyState === 1;
  mongoose.connection.on("connected", () => { multiplayerPlatform.readiness.storage = true; });
  mongoose.connection.on("disconnected", () => { multiplayerPlatform.readiness.storage = false; });
  const httpServer = http.createServer(app);
  const multiplayerRuntime = env.multiplayer.enabled
    ? await attachMultiplayerSocketServer(httpServer, multiplayerPlatform)
    : null;

  await new Promise((resolve) => httpServer.listen(env.port, resolve));
  console.log(`MyJourney API running on port ${env.port}`);

  try {
    const { startScheduler } = require("./cron");
    startScheduler();
  } catch (err) {
    console.error("Failed to start scheduler:", err);
  }

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`Received ${signal}; shutting down MyJourney.`);
    await multiplayerRuntime?.close();
    if (httpServer.listening) await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.disconnect();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit(0)));
  process.once("SIGINT", () => shutdown("SIGINT").finally(() => process.exit(0)));

  return { httpServer, multiplayerRuntime, shutdown };
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Could not start server", error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
