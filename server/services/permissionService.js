const permissionRepository = require("../repositories/permissionRepository");
const roleService = require("./roleService");

class PermissionService {
  async getPermissions() {
    return permissionRepository.findAllSorted();
  }

  async updateRolePermissions(roleId, permissions, userId) {
    return roleService.updateRole(roleId, { permissions }, userId);
  }
}

module.exports = new PermissionService();
