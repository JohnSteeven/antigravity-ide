const Article = require("../models/Article");
const Comment = require("../models/Comment");
const Subscriber = require("../models/Subscriber");
const User = require("../models/User");
const Media = require("../models/Media");

class StatsService {
  async getDashboardStats() {
    const [
      totalArticles,
      publishedCount,
      draftCount,
      archivedCount,
      scheduledCount,
      totalComments,
      pendingComments,
      totalUsers,
      totalSubscribers,
      totalMedia,
      viewsAgg,
      likesAgg,
      topArticles,
      recentArticles,
    ] = await Promise.all([
      Article.countDocuments({ isDeleted: false }),
      Article.countDocuments({ status: "published", isDeleted: false }),
      Article.countDocuments({ status: "draft", isDeleted: false }),
      Article.countDocuments({ status: "archived", isDeleted: false }),
      Article.countDocuments({ status: "scheduled", isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ status: "pending", isDeleted: false }),
      User.countDocuments({}),
      Subscriber.countDocuments({ active: true, isDeleted: false }),
      Media.countDocuments({ isDeleted: false }),
      Article.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),
      Article.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$likes" } } },
      ]),
      Article.find({ status: "published", isDeleted: false })
        .sort({ views: -1 })
        .limit(5)
        .select("title slug views likes category publishedAt")
        .lean(),
      Article.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(8)
        .select("title status updatedAt category")
        .lean(),
    ]);

    return {
      articleCount: totalArticles,
      publishedCount,
      draftCount,
      archivedCount,
      scheduledCount,
      views: viewsAgg[0]?.total || 0,
      likes: likesAgg[0]?.total || 0,
      comments: totalComments,
      pendingComments,
      users: totalUsers,
      subscribers: totalSubscribers,
      media: totalMedia,
      topArticles,
      recentActivity: recentArticles,
    };
  }
}

module.exports = new StatsService();
