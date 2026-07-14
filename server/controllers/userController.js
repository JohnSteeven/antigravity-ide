const userService = require("../services/userService");
const Notification = require("../models/Notification");
const Article = require("../models/Article");
const Comment = require("../models/Comment");
const User = require("../models/User");

const safeUser = (user) => {
  const nextUser = user.toSafeJSON ? user.toSafeJSON() : user;
  if (nextUser._id && !nextUser.id) {
    nextUser.id = nextUser._id.toString();
  }
  return nextUser;
};

class UserController {
  async getMe(req, res, next) {
    try {
      const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

      const user = safeUser(req.user);
      user.profile = {
        ...(user.profile || {}),
        notifications,
      };

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const allowedRoot = [
        "firstName",
        "lastName",
        "username",
        "email",
        "countryCode",
        "mobile",
      ];

      const updateData = {};
      allowedRoot.forEach((key) => {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      });

      if (req.body.profile) {
        updateData.profile = {
          ...(req.user.profile || {}),
          ...req.body.profile,
        };
      }

      const updated = await userService.updateUserProfile(req.user._id, updateData, req.user._id);
      res.json({
        user: safeUser(updated),
        message: "Profile updated successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Admin User Operations ---

  async getUsers(req, res, next) {
    try {
      const data = await userService.getUsers(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Fetch user's article interactions
      const [articles, comments] = await Promise.all([
        Article.find({ authorId: user._id, isDeleted: false }).select("title slug status views likes bookmarks"),
        Comment.find({ authorId: user._id, isDeleted: false }).populate("articleId", "title slug"),
      ]);

      const safe = safeUser(user);

      res.json({
        success: true,
        user: safe,
        interactions: {
          articles,
          comments,
          bookmarks: user.profile?.bookmarks || [],
          likedArticles: user.profile?.likedArticles || [],
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, status, firstName, lastName, email, mobile } = req.body;
      const updateData = {};
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (mobile !== undefined) updateData.mobile = mobile;

      const updated = await userService.updateUserProfile(id, updateData, req.user._id);
      res.json({ success: true, user: safeUser(updated), message: "User updated successfully." });
    } catch (err) {
      next(err);
    }
  }

  async suspendUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.suspendUser(id, req.user._id);
      res.json({ success: true, user: safeUser(user), message: `User status toggled successfully.` });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await userService.softDeleteUser(id, req.user._id);
      res.json({ success: true, message: "User soft-deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async restoreUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.restoreUser(id, req.user._id);
      res.json({ success: true, user: safeUser(user), message: "User restored successfully." });
    } catch (err) {
      next(err);
    }
  }

  async forceLogout(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.forceLogout(id, req.user._id);
      res.json({ success: true, user: safeUser(user), message: "User session terminated." });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required." });
      }
      const user = await userService.resetPassword(id, password, req.user._id);
      res.json({ success: true, user: safeUser(user), message: "Password reset completed." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
