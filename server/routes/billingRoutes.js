const express = require("express");
const billingController = require("../controllers/billingController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const apiRegistry = require("../core/apiRegistry");

const router = express.Router();

router.get("/capability", billingController.getCapability);
router.post("/checkout/orders", authenticate, billingController.createCheckoutOrder);
router.post("/checkout/verify", authenticate, billingController.verifyCheckoutPayment);
router.get("/payments/:paymentId", authenticate, billingController.getMyPayment);
router.post("/payments/:paymentId/refunds", authenticate, billingController.createRefund);
router.get("/admin/reconcile/payments/:paymentId", authenticate, requireAdmin, billingController.reconcilePayment);

apiRegistry.register({ name: "BillingPlatform", prefix: "/api/billing", router, public: true, version: "1.0.0" });

module.exports = router;
