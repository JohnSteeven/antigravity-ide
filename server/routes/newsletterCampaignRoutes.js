const express = require("express");
const { validationResult } = require("express-validator");
const { campaignValidator } = require("../validators/newsletterCampaignValidator");
const newsletterCampaignController = require("../controllers/newsletterCampaignController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// All newsletter campaign routes are admin routes
router.use(authenticate);
router.use(requireAdmin);

router.get("/", newsletterCampaignController.getCampaigns);
router.post(
  "/",
  campaignValidator,
  validate,
  newsletterCampaignController.createCampaign
);
router.put(
  "/:id",
  campaignValidator,
  validate,
  newsletterCampaignController.updateCampaign
);
router.post("/:id/send", newsletterCampaignController.sendCampaign);
router.delete("/:id", newsletterCampaignController.deleteCampaign);
router.post("/:id/restore", newsletterCampaignController.restoreCampaign);

module.exports = router;
