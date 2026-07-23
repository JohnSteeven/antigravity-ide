const express = require("express");
const { validationResult } = require("express-validator");
const { updateProfileValidator, updateUserValidator } = require("../validators/userValidator");
const userController = require("../controllers/userController");
const { handleValidation } = require("../middleware/errorHandler");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();
const validate = handleValidation(validationResult);

// Personal Profile routes
router.get("/me", authenticate, userController.getMe);
router.put("/me", authenticate, updateProfileValidator, validate, userController.updateProfile);
router.patch("/notifications/:id", authenticate, userController.markNotificationAsRead);

// Admin User management routes (requires dynamic checkPermission RBAC middleware)
router.get("/", authenticate, checkPermission("users.manage"), userController.getUsers);
router.get("/:id", authenticate, checkPermission("users.manage"), userController.getUserById);
router.put("/:id", authenticate, checkPermission("users.manage"), updateUserValidator, validate, userController.updateUser);
router.delete("/:id", authenticate, checkPermission("users.manage"), userController.deleteUser);
router.post("/:id/restore", authenticate, checkPermission("users.manage"), userController.restoreUser);
router.post("/:id/suspend", authenticate, checkPermission("users.manage"), userController.suspendUser);
router.post("/:id/force-logout", authenticate, checkPermission("users.manage"), userController.forceLogout);
router.post("/:id/reset-password", authenticate, checkPermission("users.manage"), userController.resetPassword);

module.exports = router;
