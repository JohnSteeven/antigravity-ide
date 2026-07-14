const roleRepository = require("../repositories/roleRepository");
const userRepository = require("../repositories/userRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class RoleService {
  async getRoles(query = {}) {
    const includeDeleted = query.includeDeleted === "true";
    return roleRepository.find({}, includeDeleted);
  }

  async getRoleById(id) {
    return roleRepository.findById(id);
  }

  async createRole(data, userId) {
    // Check if role name already exists
    const existing = await roleRepository.findByName(data.name);
    if (existing) {
      throw new Error(`Role name "${data.name}" already exists.`);
    }

    const role = await roleRepository.create(data);

    await activityLogRepository.create({
      userId,
      action: "role_create",
      description: `Created custom role "${role.name}"`,
      module: "roles",
      status: "success",
    });

    return role;
  }

  async updateRole(id, data, userId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new Error("Role not found.");

    if (role.isSystem) {
      // For system roles, only allow editing description or updating permissions, but do NOT allow renaming!
      if (data.name && data.name !== role.name) {
        throw new Error("Cannot rename system roles.");
      }
    }

    const updated = await roleRepository.update(id, data);

    await activityLogRepository.create({
      userId,
      action: "role_update",
      description: `Updated role "${updated.name}"`,
      module: "roles",
      status: "success",
    });

    return updated;
  }

  async deleteRole(id, userId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new Error("Role not found.");

    if (role.isSystem) {
      throw new Error("System roles cannot be deleted.");
    }

    // Check if role is currently assigned to users
    const usersWithRole = await userRepository.find({ role: role.name, isDeleted: false });
    if (usersWithRole.length > 0) {
      throw new Error(`Cannot delete role "${role.name}" because it is currently assigned to ${usersWithRole.length} user(s).`);
    }

    const deleted = await roleRepository.softDelete(id);

    await activityLogRepository.create({
      userId,
      action: "role_delete",
      description: `Soft-deleted role "${role.name}"`,
      module: "roles",
      status: "success",
    });

    return deleted;
  }

  async cloneRole(id, newName, userId) {
    const sourceRole = await roleRepository.findById(id);
    if (!sourceRole) throw new Error("Source role not found.");

    const existing = await roleRepository.findByName(newName);
    if (existing) {
      throw new Error(`Role name "${newName}" already exists.`);
    }

    const role = await roleRepository.create({
      name: newName,
      description: `Clone of ${sourceRole.name}. ${sourceRole.description || ""}`,
      permissions: sourceRole.permissions,
      isSystem: false,
    });

    await activityLogRepository.create({
      userId,
      action: "role_clone",
      description: `Cloned role "${sourceRole.name}" as "${role.name}"`,
      module: "roles",
      status: "success",
    });

    return role;
  }
}

module.exports = new RoleService();
