const User = require("../models/User");

class UserRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
  }

  async findByUsername(username) {
    return User.findOne({ username: username.trim(), isDeleted: false });
  }

  async findByMobile(mobile) {
    return User.findOne({ mobile, isDeleted: false });
  }

  async create(data) {
    return User.create(data);
  }

  async toggleArticleReference(userId, field, articleId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found.");

    if (!user.profile) {
      user.profile = {
        bio: "",
        skills: [],
        bookmarks: [],
        likedArticles: [],
        savedArticles: [],
        comments: [],
      };
    }

    const index = user.profile[field].findIndex(id => String(id) === String(articleId));
    let isAdded = false;
    if (index === -1) {
      user.profile[field].push(articleId);
      isAdded = true;
    } else {
      user.profile[field].splice(index, 1);
    }
    await user.save();
    return { user, isAdded };
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async softDelete(id) {
    return User.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
  }

  async restore(id) {
    return User.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );
  }
}

module.exports = new UserRepository();
