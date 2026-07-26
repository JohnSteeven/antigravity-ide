const express = require("express");
const { validationResult } = require("express-validator");
const { subscribeValidator } = require("../validators/subscriberValidator");
const subscriberController = require("../controllers/subscriberController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// Public Subscription & Verification Routes
router.post("/subscribe", subscribeValidator, validate, subscriberController.subscribe);
router.post("/", subscribeValidator, validate, subscriberController.subscribe);
router.get("/verify/:token", subscriberController.verify);
router.get("/preferences/:token", subscriberController.getPreferences);
router.post("/preferences/:token", subscriberController.updatePreferences);
router.post("/unsubscribe/:token", subscriberController.unsubscribeByToken);
router.get("/track/open/:token", subscriberController.trackOpen);
router.get("/track/click/:token", subscriberController.trackClick);

// Protected Admin Routes (Reusing existing Auth & Admin middleware)
router.get("/stats", authenticate, requireAdmin, subscriberController.getStats);
router.get("/", authenticate, requireAdmin, subscriberController.getSubscribers);
router.post("/:id/resend-verification", authenticate, requireAdmin, subscriberController.resendVerification);
router.delete("/:id", authenticate, requireAdmin, subscriberController.unsubscribe);

module.exports = router;
