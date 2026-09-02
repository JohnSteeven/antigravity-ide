const express = require("express");
const rateLimit = require("express-rate-limit");
const { validationResult } = require("express-validator");
const controllers = require("../creators/controllers");
const { applicationValidator, reviewValidator } = require("../creators/validators");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);
const applicationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
const followLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 80, standardHeaders: true, legacyHeaders: false });
const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

router.get("/capability", authenticate, controllers.getCapability);
router.post("/applications", authenticate, applicationLimiter, applicationValidator, validate, controllers.apply);
router.get("/applications/me", authenticate, controllers.getMyApplication);
router.patch("/applications/me", authenticate, applicationLimiter, applicationValidator, validate, controllers.updateMyApplication);

router.get("/admin/applications", authenticate, requireAdmin, controllers.listApplications);
router.get("/admin/applications/:id", authenticate, requireAdmin, controllers.getApplicationReview);
router.patch("/admin/applications/:id/status", authenticate, requireAdmin, reviewValidator, validate, controllers.reviewApplication);
router.get("/admin/content", authenticate, requireAdmin, controllers.listContentReview);
router.patch("/admin/content/:contentType/:contentId/status", authenticate, requireAdmin, controllers.reviewContent);

router.get("/", searchLimiter, controllers.listCreators);
router.post("/:slug/follow", authenticate, followLimiter, controllers.followCreator);
router.delete("/:slug/follow", authenticate, followLimiter, controllers.unfollowCreator);
router.get("/:slug", optionalAuthenticate, controllers.getCreator);

module.exports = router;
