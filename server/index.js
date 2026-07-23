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
app.use(globalLimiter);
app.use(sanitizeRequest);
app.use(csrfProtection);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "myjourney-api" });
});

// Auth & user routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticate, userRoutes);

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

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(notFound);
app.use(errorHandler);

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
