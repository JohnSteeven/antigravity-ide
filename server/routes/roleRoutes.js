const express = require("express");
const roleController = require("../controllers/roleController");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();

router.use(authenticate);

router.get("/", checkPermission("roles.manage"), roleController.getRoles);
router.post("/", checkPermission("roles.manage"), roleController.createRole);
router.put("/:id", checkPermission("roles.manage"), roleController.updateRole);
router.delete("/:id", checkPermission("roles.manage"), roleController.deleteRole);
router.post("/:id/clone", checkPermission("roles.manage"), roleController.cloneRole);

module.exports = router;
