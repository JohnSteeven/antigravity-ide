const userRepository = require("../repositories/userRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const bcrypt = require("bcrypt");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");

class UserService {
  async getUsers(query = {}) {
    const filter = {};

    if (query.role && query.role !== "all") {
      filter.role = query.role;
    }
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }
    if (query.verified !== undefined && query.verified !== "all") {
      const isVerified = query.verified === "true";
      filter["verified.email"] = isVerified;
    }
    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { username: regex },
        { email: regex },
      ];
    }

    const includeDeleted = query.includeDeleted === "true";
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (query.sortBy) {
      const direction = query.sortDir === "asc" ? 1 : -1;
      sort = { [query.sortBy]: direction };
    }

    const [users, total] = await Promise.all([
      userRepository.find(filter, sort, limit, skip),
      userRepository.count(filter),
    ]);

    return {
      users: users.map(u => {
        delete u.passwordHash;
        return u;
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id) {
    return userRepository.findById(id);
  }

  async getUserByEmail(email) {
    return userRepository.findByEmail(email);
  }

  async updateUserProfile(id, updateData, userId) {
    const user = await userRepository.update(id, updateData);
    if (!user) throw new Error("User not found.");

    await activityLogRepository.create({
      userId,
      action: "user_profile_update",
      description: `Updated profile details for user "${user.username}"`,
      module: "users",
      status: "success",
    });

    return user;
  }

  async suspendUser(id, userId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found.");

    const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    user.status = newStatus;
    // Force logout on suspension
    if (newStatus === "SUSPENDED") {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
      await Session.updateMany({ user: user._id }, { isActive: false });
    }
    await user.save();

    await activityLogRepository.create({
      userId,
      action: newStatus === "SUSPENDED" ? "user_suspend" : "user_activate",
      description: `${newStatus === "SUSPENDED" ? "Suspended" : "Activated"} user account "${user.username}"`,
      module: "users",
      status: "success",
    });

    return user;
  }

  async softDeleteUser(id, userId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found.");

    const deleted = await userRepository.softDelete(id);

    await activityLogRepository.create({
      userId,
      action: "user_delete",
      description: `Soft-deleted user account "${user.username}"`,
      module: "users",
      status: "success",
    });

    return deleted;
  }

  async restoreUser(id, userId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found.");

    const restored = await userRepository.restore(id);

    await activityLogRepository.create({
      userId,
      action: "user_restore",
      description: `Restored soft-deleted user account "${user.username}"`,
      module: "users",
      status: "success",
    });

    return restored;
  }

  async forceLogout(id, userId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found.");

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
    await Session.updateMany({ user: user._id }, { isActive: false });
    await user.save();

    await activityLogRepository.create({
      userId,
      action: "user_force_logout",
      description: `Forced logout for user account "${user.username}"`,
      module: "users",
      status: "success",
    });

    return user;
  }

  async resetPassword(id, newPassword, userId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found.");

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.tokenVersion = (user.tokenVersion || 0) + 1; // force logout other devices
    user.lastPasswordChange = new Date();
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
    await Session.updateMany({ user: user._id }, { isActive: false });
    await user.save();

    await activityLogRepository.create({
      userId,
      action: "user_password_reset",
      description: `Reset password for user account "${user.username}"`,
      module: "users",
      status: "success",
    });

    return user;
  }
}

module.exports = new UserService();
