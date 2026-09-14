const express = require("express");
const billingController = require("../controllers/billingController");

const router = express.Router();

// Mounted with express.raw before global JSON parsing and browser CSRF. Provider
// authenticity is established exclusively by the raw-body HMAC signature.
router.post("/", billingController.handleRazorpayWebhook);

module.exports = router;
