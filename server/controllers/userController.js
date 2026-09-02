const userService = require("../services/userService");
const Notification = require("../models/Notification");
const Article = require("../models/Article");
const Comment = require("../models/Comment");
const User = require("../models/User");
const ReaderProfile = require("../models/ReaderProfile");

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
      const lastActive = req.user.notificationPreferences?.lastActiveAt;
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (!lastActive || lastActive < fifteenMinutesAgo) {
        if (!req.user.notificationPreferences) {
          req.user.notificationPreferences = {};
        }
        req.user.notificationPreferences.lastActiveAt = new Date();
        await req.user.save();
      }

      const user = safeUser(req.user);

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const lastActive = req.user.notificationPreferences?.lastActiveAt;
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (!lastActive || lastActive < fifteenMinutesAgo) {
        if (!req.user.notificationPreferences) {
          req.user.notificationPreferences = {};
        }
        req.user.notificationPreferences.lastActiveAt = new Date();
        await req.user.save();
      }

      const allowedRoot = [
        "firstName",
        "lastName",
        "username",
        "email",
        "countryCode",
        "mobile",
        "newsletter",
      ];

      const updateData = {};
      allowedRoot.forEach((key) => {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      });

      if (req.body.profile) {
        const allowedProfile = ["avatar", "coverImage", "bio", "location", "website", "skills"];
        const currentProfile = req.user.profile
          ? (typeof req.user.profile.toObject === "function" ? req.user.profile.toObject() : req.user.profile)
          : {};
        const incomingProfile = {};
        allowedProfile.forEach((key) => {
          if (req.body.profile[key] !== undefined) incomingProfile[key] = req.body.profile[key];
        });
        updateData.profile = {
          ...currentProfile,
          ...incomingProfile,
        };
      }

      if (req.body.notificationPreferences) {
        const currentPrefs = req.user.notificationPreferences
          ? req.user.notificationPreferences.toObject()
          : {};
        const incomingPrefs = req.body.notificationPreferences;
        updateData.notificationPreferences = {
          ...currentPrefs,
          ...incomingPrefs,
          dailyQuote: {
            enabled: incomingPrefs.dailyQuote?.enabled !== undefined ? incomingPrefs.dailyQuote.enabled : currentPrefs.dailyQuote?.enabled ?? true,
            time: {
              hour: incomingPrefs.dailyQuote?.time?.hour !== undefined ? incomingPrefs.dailyQuote.time.hour : currentPrefs.dailyQuote?.time?.hour ?? 9,
              minute: incomingPrefs.dailyQuote?.time?.minute !== undefined ? incomingPrefs.dailyQuote.time.minute : currentPrefs.dailyQuote?.time?.minute ?? 0
            }
          },
          newArticles: {
            enabled: incomingPrefs.newArticles?.enabled !== undefined ? incomingPrefs.newArticles.enabled : currentPrefs.newArticles?.enabled ?? false
          },
          readingReminders: {
            enabled: incomingPrefs.readingReminders?.enabled !== undefined ? incomingPrefs.readingReminders.enabled : currentPrefs.readingReminders?.enabled ?? false
          },
          weeklySummary: {
            enabled: incomingPrefs.weeklySummary?.enabled !== undefined ? incomingPrefs.weeklySummary.enabled : currentPrefs.weeklySummary?.enabled ?? false
          }
        };
      }

      const updated = await userService.updateUserProfile(req.user._id, updateData, req.user._id);

      const safe = safeUser(updated);

      res.json({
        user: safe,
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
      const [articles, comments, readerProfile] = await Promise.all([
        Article.find({ authorId: user._id, isDeleted: false }).select("title slug status views likes bookmarks"),
        Comment.find({ authorId: user._id, isDeleted: false }).populate("articleId", "title slug"),
        ReaderProfile.findOne({ userId: user._id }).select("bookmarks likedArticles savedArticles").lean(),
      ]);

      const safe = safeUser(user);

      res.json({
        success: true,
        user: safe,
        interactions: {
          articles,
          comments,
          bookmarks: readerProfile?.bookmarks || [],
          likedArticles: readerProfile?.likedArticles || [],
          savedArticles: readerProfile?.savedArticles || [],
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

  async markNotificationAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await Notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { $set: { status: "read", readAt: new Date() } },
        { new: true }
      );
      if (!notification) {
        return res.status(404).json({ message: "Notification not found." });
      }
      res.json({ success: true, notification });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
