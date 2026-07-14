const express = require("express");
const permissionController = require("../controllers/permissionController");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();

router.use(authenticate);

router.get("/", checkPermission("permissions.manage"), permissionController.getPermissions);
router.put("/:roleId", checkPermission("permissions.manage"), permissionController.updateRolePermissions);

module.exports = router;
