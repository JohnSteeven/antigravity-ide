const express = require("express");
const rateLimit = require("express-rate-limit");
const controllers = require("../creators/studioControllers");
const { authenticate } = require("../middleware/auth");
const { requireActiveCreator } = require("../creators/middleware");

const router = express.Router();
const submissionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
const mediaLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.use(authenticate, requireActiveCreator);
router.get("/overview", controllers.overview);
router.get("/analytics", controllers.analytics);
router.get("/earnings", controllers.earnings);
router.patch("/profile", controllers.updateProfile);
router.put("/profile/featured", controllers.updateFeaturedContent);
router.get("/content", controllers.listContent);
router.get("/content/:contentType/:contentId/preview", controllers.previewContent);
router.post("/content/:contentType/:contentId/submit", submissionLimiter, controllers.submitContent);
router.post("/articles", controllers.createArticle);
router.patch("/articles/:id", controllers.updateArticle);
router.post("/stories", controllers.createStory);
router.patch("/stories/:id", controllers.updateStory);
router.post("/courses", controllers.createCourse);
router.patch("/courses/:id", controllers.updateCourse);
router.put("/courses/:id/curriculum", controllers.replaceCurriculum);
router.post("/courses/:id/submit", submissionLimiter, controllers.submitCourse);
router.get("/courses/:slug/lessons/:lessonId/preview", controllers.previewLesson);
router.get("/media/capability", controllers.mediaCapability);
router.post("/media/upload-session", mediaLimiter, controllers.createUploadSession);
router.post("/media/assets", mediaLimiter, controllers.registerAsset);
router.post("/videos", controllers.createVideo);
router.post("/podcast-series", controllers.createPodcastSeries);
router.post("/podcast-episodes", controllers.createPodcastEpisode);
router.post("/resources", controllers.createResource);

module.exports = router;
