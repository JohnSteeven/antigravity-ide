const express = require("express");
const rateLimit = require("express-rate-limit");
const controllers = require("../learn/controllers");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();
const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const progressLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 240, standardHeaders: true, legacyHeaders: false });
const engagementLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false });
const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false });

router.get("/", optionalAuthenticate, controllers.home);
router.get("/topics/admin", authenticate, requireAdmin, controllers.listAdminTopics);
router.get("/topics", searchLimiter, controllers.listTopics);
router.post("/topics", authenticate, requireAdmin, controllers.createTopic);
router.patch("/topics/:id", authenticate, requireAdmin, controllers.updateTopic);
router.get("/search", searchLimiter, controllers.search);
router.get("/continue", authenticate, controllers.continueLearning);
router.get("/courses", searchLimiter, controllers.listCourses);
router.get("/courses/:slug", optionalAuthenticate, controllers.getCourse);
router.get("/courses/:slug/lessons/:lessonId", optionalAuthenticate, controllers.getLesson);
router.post("/courses/:courseId/enroll", authenticate, progressLimiter, controllers.enroll);
router.patch("/courses/:courseId/progress", authenticate, progressLimiter, controllers.progress);
router.post("/engagement", authenticate, engagementLimiter, controllers.recordEngagement);
router.post("/reports", authenticate, reportLimiter, controllers.reportContent);
router.get("/reports/admin", authenticate, requireAdmin, controllers.listContentReports);
router.patch("/reports/admin/:id", authenticate, requireAdmin, controllers.reviewContentReport);
router.get("/videos", searchLimiter, controllers.listVideos);
router.get("/videos/:slug", optionalAuthenticate, controllers.getVideo);
router.get("/podcasts", searchLimiter, controllers.listPodcasts);
router.get("/podcasts/:slug", optionalAuthenticate, controllers.getPodcast);
router.get("/resources", searchLimiter, controllers.listResources);
router.get("/resources/:slug", optionalAuthenticate, controllers.getResource);
router.get("/exams", searchLimiter, controllers.listExams);
router.get("/media/capability", controllers.mediaCapability);
router.get("/media/:assetId/access", authenticate, controllers.assetAccess);

module.exports = router;
