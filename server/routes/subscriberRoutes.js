const express = require("express");
const { validationResult } = require("express-validator");
const { subscribeValidator } = require("../validators/subscriberValidator");
const subscriberController = require("../controllers/subscriberController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

router.post("/", subscribeValidator, validate, subscriberController.subscribe);
router.get("/", authenticate, requireAdmin, subscriberController.getSubscribers);
router.delete("/:id", authenticate, requireAdmin, subscriberController.unsubscribe);

module.exports = router;
