const permissionService = require("../services/permissionService");

class PermissionController {
  async getPermissions(req, res, next) {
    try {
      const permissions = await permissionService.getPermissions();
      res.json({ success: true, permissions });
    } catch (err) {
      next(err);
    }
  }

  async updateRolePermissions(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Permissions must be an array of strings." });
      }

      const role = await permissionService.updateRolePermissions(roleId, permissions, req.user?._id);
      res.json({ success: true, role, message: "Permissions assigned to role successfully." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PermissionController();
