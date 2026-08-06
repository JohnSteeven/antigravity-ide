const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const connectDb = require("./config/db");
const env = require("./config/env");
const { authenticate } = require("./middleware/auth");
const {
  csrfProtection,
  globalLimiter,
  sanitizeRequest,
} = require("./middleware/security");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const articleRoutes = require("./routes/articleRoutes");
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
const path = require("path");

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
if (env.nodeEnv === 'production') app.use(globalLimiter);
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

// ── Stage 3–6 routes (AI, Reader, Membership, Community, Distribution,
//    Search, Developer, Tenant, Governance, Infrastructure, Launch) ──────────
app.use("/api/ai", aiRoutes);
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

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  connectDb()
    .then(() => {
      app.listen(env.port, () => {
        console.log(`Auth API running on port ${env.port}`);
        try {
          const { startScheduler } = require("./cron");
          startScheduler();
        } catch (err) {
          console.error("Failed to start scheduler:", err);
        }
      });
    })
    .catch((error) => {
      console.error("Could not start server", error);
      process.exit(1);
    });
}

module.exports = app;
