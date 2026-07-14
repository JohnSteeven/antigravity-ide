const express = require("express");
const backupController = require("../controllers/backupController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/", authenticate, requireAdmin, backupController.getBackups);
router.post("/", authenticate, requireAdmin, backupController.triggerBackup);
router.delete("/:id", authenticate, requireAdmin, backupController.deleteBackup);

module.exports = router;
