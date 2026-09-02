const express = require("express");
const settingController = require("../controllers/settingController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.use(authenticate, requireAdmin);
router.post("/test-smtp", settingController.testSmtp);
router.get("/:key", settingController.getSetting);
router.put("/:key", settingController.updateSetting);

module.exports = router;
