const express = require("express");
const settingController = require("../controllers/settingController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/:key", settingController.getSetting);
router.put("/:key", authenticate, requireAdmin, settingController.updateSetting);

module.exports = router;
