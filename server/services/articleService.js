const mongoose = require("mongoose");
const articleRepository = require("../repositories/articleRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const Category = require("../models/Category");
const Article = require("../models/Article");

class ArticleService {
  async getArticles(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.subcategory) filter.subcategory = query.subcategory;
    if (query.isFeatured) filter.isFeatured = query.isFeatured === "true";
    if (query.isMustRead) filter.isMustRead = query.isMustRead === "true";
    if (query.isTrending) filter.isTrending = query.isTrending === "true";
    if (query.isPinned) filter.isPinned = query.isPinned === "true";
    if (query.author) filter.author = query.author;
    if (query.tags) {
      filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };
    }

    if (query.ids) {
      const idList = (Array.isArray(query.ids) ? query.ids : String(query.ids).split(","))
        .filter(Boolean)
        .filter(id => mongoose.Types.ObjectId.isValid(id));
      if (idList.length > 0) {
        filter._id = { $in: idList };
      } else {
        filter._id = { $in: [] };
      }
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sort = {};
    if (query.sort === "popular") {
      sort.views = -1;
    } else if (query.sort === "oldest") {
      sort.publishedAt = 1;
    } else {
      sort.publishedAt = -1; // default to latest
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      articleRepository.find(filter, sort, limit, skip),
      articleRepository.count(filter),
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getArticleBySlug(slug) {
    return articleRepository.findBySlug(slug);
  }

  async getArticleById(id) {
    return articleRepository.findById(id);
  }

  async createArticle(data, userId) {
    if (data.categoryId) {
      const categoryDoc = await Category.findById(data.categoryId);
      if (categoryDoc) {
        data.category = categoryDoc.name;
        data.categorySlug = categoryDoc.slug;
      }
    }

    // Generate unique slug
    let baseSlug = data.slug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await Article.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    data.slug = slug;
    data.createdBy = userId;
    data.updatedBy = userId;

    const article = await articleRepository.create(data);
    await activityLogRepository.create({
      action: "article_create",
      description: `Created article "${article.title}"`,
      userId,
    });
    return article;
  }

  async updateArticle(id, data, userId) {
    if (data.categoryId) {
      const categoryDoc = await Category.findById(data.categoryId);
      if (categoryDoc) {
        data.category = categoryDoc.name;
        data.categorySlug = categoryDoc.slug;
      }
    }

    data.updatedBy = userId;
    const article = await articleRepository.update(id, data);
    if (!article) throw new Error("Article not found.");

    await activityLogRepository.create({
      action: "article_update",
      description: `Updated article "${article.title}"`,
      userId,
    });
    return article;
  }

  async softDeleteArticle(id, userId) {
    const article = await articleRepository.softDelete(id, userId);
    if (!article) throw new Error("Article not found.");

    await activityLogRepository.create({
      action: "article_delete",
      description: `Soft deleted article "${article.title}"`,
      userId,
    });
    return article;
  }

  async restoreArticle(id, userId) {
    const article = await articleRepository.restore(id, userId);
    if (!article) throw new Error("Article not found.");

    await activityLogRepository.create({
      action: "article_restore",
      description: `Restored article "${article.title}"`,
      userId,
    });
    return article;
  }

  async incrementMetric(id, metric, userId) {
    if (!["views", "likes", "bookmarks", "saved"].includes(metric)) {
      throw new Error("Invalid metric type.");
    }

    if (metric === "views") {
      return articleRepository.update(id, { $inc: { views: 1 } });
    }

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const userRepository = require("../repositories/userRepository");
    const fieldMap = {
      likes: "likedArticles",
      bookmarks: "bookmarks",
      saved: "savedArticles",
    };
    const userField = fieldMap[metric];

    const { isAdded } = await userRepository.toggleArticleReference(userId, userField, id);
    const incValue = isAdded ? 1 : -1;

    const article = await articleRepository.findById(id);
    if (!article) return null;
    let newValue = (article[metric] || 0) + incValue;
    if (newValue < 0) newValue = 0;

    return articleRepository.update(id, { [metric]: newValue });
  }
}

module.exports = new ArticleService();
