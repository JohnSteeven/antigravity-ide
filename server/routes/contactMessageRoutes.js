const express = require("express");
const { validationResult } = require("express-validator");
const { contactMessageValidator } = require("../validators/contactMessageValidator");
const contactMessageController = require("../controllers/contactMessageController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// Public route to submit contact message (anonymous)
router.post(
  "/",
  contactMessageValidator,
  validate,
  contactMessageController.createMessage
);

// Admin routes
router.get("/", authenticate, requireAdmin, contactMessageController.getMessages);
router.get("/:id", authenticate, requireAdmin, contactMessageController.getMessageById);
router.put("/:id", authenticate, requireAdmin, contactMessageController.updateMessage);
router.delete("/:id", authenticate, requireAdmin, contactMessageController.deleteMessage);
router.post("/:id/restore", authenticate, requireAdmin, contactMessageController.restoreMessage);

module.exports = router;
