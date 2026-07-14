const roleService = require("../services/roleService");

class RoleController {
  async getRoles(req, res, next) {
    try {
      const roles = await roleService.getRoles(req.query);
      res.json({ success: true, roles });
    } catch (err) {
      next(err);
    }
  }

  async createRole(req, res, next) {
    try {
      const { name, description, permissions } = req.body;
      if (!name) return res.status(400).json({ message: "Role name is required." });
      const role = await roleService.createRole({ name, description, permissions }, req.user?._id);
      res.status(201).json({ success: true, role, message: "Role created successfully." });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      const role = await roleService.updateRole(id, { name, description, permissions }, req.user?._id);
      res.json({ success: true, role, message: "Role updated successfully." });
    } catch (err) {
      next(err);
    }
  }

  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id, req.user?._id);
      res.json({ success: true, message: "Role deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async cloneRole(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "New role name is required." });
      const role = await roleService.cloneRole(id, name, req.user?._id);
      res.status(201).json({ success: true, role, message: "Role cloned successfully." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoleController();
