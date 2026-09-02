const articleService = require("../services/articleService");
const commentService = require("../services/commentService");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");
const { serializePublicContent } = require("../premium/contentPreview");

const canReadPremiumContent = async (req) => {
  if (!req.user) return false;
  const resolution = await entitlementService.resolveForUser(req.user._id || req.user.id);
  return entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT);
};

const privateContentResponse = (res) => res.set({
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
});

const runInTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.codeName === "CommandNotSupported" || error.message.includes("does not support sessions")) {
      console.warn("MongoDB standalone mode detected. Falling back to non-transactional execution.");
      return fn(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const calcReadingTime = (html = "") => {
  const plain = html.replace(/<[^>]+>/g, " ");
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { min: minutes, label: `${minutes} min read` };
};

const sendEngagementResponse = (res, result, metric) => {
  const count = Number(result.article[metric] || 0);
  return res.json({
    articleId: String(result.article._id || result.article.id),
    metric,
    isActive: result.isActive,
    count,
    [metric]: count,
    libraryItem: result.libraryItem,
  });
};

class ArticleController {
  async getArticles(req, res, next) {
    try {
      // Public listing is never an alternate route to drafts or protected
      // full-text search. Admins use the dedicated /admin/all endpoint.
      const query = {
        ...req.query,
        status: "published",
        limit: Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 12)),
        ...(req.query.featured !== undefined ? { isFeatured: req.query.featured } : {}),
        ...(req.query.search ? { accessLevel: "free" } : {}),
      };
      const data = await articleService.getArticles(query);
      res.json({ ...data, articles: data.articles.map((article) => serializePublicContent(article, { listing: true })) });
    } catch (err) {
      next(err);
    }
  }

  async getArticleBySlug(req, res, next) {
    try {
      const article = await articleService.getArticleBySlug(req.params.slug);
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "Article not found." });
      }
      const canAccessPremium = await canReadPremiumContent(req);
      privateContentResponse(res).json({ article: serializePublicContent(article, { canAccessPremium }) });
    } catch (err) {
      next(err);
    }
  }

  async incrementViews(req, res, next) {
    try {
      const article = await articleService.incrementMetric(req.params.id, "views");
      if (!article) return res.status(404).json({ message: "Article not found." });
      res.json({ views: article.views });
    } catch (err) {
      next(err);
    }
  }

  async likeArticle(req, res, next) {
    try {
      const result = await articleService.incrementMetric(req.params.id, "likes", req.user._id);
      if (!result) return res.status(404).json({ message: "Article not found." });
      sendEngagementResponse(res, result, "likes");
    } catch (err) {
      next(err);
    }
  }

  async bookmarkArticle(req, res, next) {
    try {
      const result = await articleService.incrementMetric(req.params.id, "bookmarks", req.user._id);
      if (!result) return res.status(404).json({ message: "Article not found." });
      sendEngagementResponse(res, result, "bookmarks");
    } catch (err) {
      next(err);
    }
  }

  async saveArticle(req, res, next) {
    try {
      const result = await articleService.incrementMetric(req.params.id, "saved", req.user._id);
      if (!result) return res.status(404).json({ message: "Article not found." });
      sendEngagementResponse(res, result, "saved");
    } catch (err) {
      next(err);
    }
  }

  async getComments(req, res, next) {
    try {
      const comments = await commentService.getComments({
        articleId: req.params.id,
        status: "approved",
      });
      res.json({ comments });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req, res, next) {
    try {
      const article = await articleService.getArticleById(req.params.id);
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "Article not found." });
      }

      const comment = await commentService.createComment({
        body: req.body.body,
        articleId: req.params.id,
        authorId: req.user._id,
        authorName: [req.user.firstName, req.user.lastName]
          .filter(Boolean)
          .join(" ") || req.user.username || "Reader",
        status: "pending",
      }, req.user._id);

      res.status(201).json({
        comment,
        message: "Comment submitted for moderation.",
      });
    } catch (err) {
      next(err);
    }
  }

  async getAdminArticles(req, res, next) {
    try {
      const data = await articleService.getArticles(req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async createArticle(req, res, next) {
    try {
      const {
        title, slug, description, body: bodyHtml, coverImage,
        gallery, videoUrl, audioUrl, pdfAttachment, category,
        subcategory, tags, status, isFeatured, isMustRead,
        isTrending, isPinned, publishedAt, scheduledAt, rating,
        author, readingTime, seo, categoryId, accessLevel,
      } = req.body;

      const finalSlug = slug ? slugify(slug) : slugify(title);
      const rt = calcReadingTime(bodyHtml || "");

      const article = await articleService.createArticle({
        title,
        slug: finalSlug,
        description: description || "",
        body: bodyHtml || "",
        coverImage: coverImage || "",
        gallery: Array.isArray(gallery) ? gallery : [],
        videoUrl: videoUrl || "",
        audioUrl: audioUrl || "",
        pdfAttachment: pdfAttachment || "",
        category: category || "Life",
        categorySlug: slugify(category || "Life"),
        categoryId,
        subcategory: subcategory || "",
        tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
        status: status || "draft",
        isFeatured: Boolean(isFeatured),
        isMustRead: Boolean(isMustRead),
        isTrending: Boolean(isTrending),
        isPinned: Boolean(isPinned),
        publishedAt: status === "published" ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        readingTimeMin: rt.min,
        readingTime: readingTime || rt.label,
        author: author || [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Noble John Steeven",
        rating: Number(rating) || 4.0,
        seo: seo || {},
        accessLevel: accessLevel === "premium" ? "premium" : "free",
      }, req.user._id);

      res.status(201).json({ article, message: "Article created successfully." });
    } catch (err) {
      next(err);
    }
  }

  async updateArticle(req, res, next) {
    try {
      const {
        title, slug, description, body: bodyHtml, coverImage,
        gallery, videoUrl, audioUrl, pdfAttachment, category,
        subcategory, tags, status, isFeatured, isMustRead,
        isTrending, isPinned, publishedAt, scheduledAt, rating,
        author, readingTime, seo, categoryId, accessLevel,
      } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slugify(slug);
      if (description !== undefined) updateData.description = description;
      if (bodyHtml !== undefined) {
        const rt = calcReadingTime(bodyHtml);
        updateData.body = bodyHtml;
        updateData.readingTimeMin = rt.min;
        updateData.readingTime = readingTime || rt.label;
      }

      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (gallery !== undefined) updateData.gallery = Array.isArray(gallery) ? gallery : [];
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
      if (pdfAttachment !== undefined) updateData.pdfAttachment = pdfAttachment;
      if (author !== undefined) updateData.author = author;
      if (rating !== undefined) updateData.rating = Number(rating) || 4.0;

      if (categoryId !== undefined) updateData.categoryId = categoryId;

      if (category !== undefined) {
        updateData.category = category;
        updateData.categorySlug = slugify(category);
      }
      if (subcategory !== undefined) updateData.subcategory = subcategory;
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];
      }

      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (isMustRead !== undefined) updateData.isMustRead = Boolean(isMustRead);
      if (isTrending !== undefined) updateData.isTrending = Boolean(isTrending);
      if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);

      if (status !== undefined) {
        updateData.status = status;
      }
      if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);
      if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      if (seo !== undefined) updateData.seo = seo;
      if (accessLevel !== undefined) updateData.accessLevel = accessLevel === "premium" ? "premium" : "free";

      const article = await articleService.updateArticle(req.params.id, updateData, req.user._id);
      res.json({ article, message: "Article updated successfully." });
    } catch (err) {
      next(err);
    }
  }

  async deleteArticle(req, res, next) {
    try {
      await runInTransaction(async (session) => {
        // Soft delete the article
        await articleService.softDeleteArticle(req.params.id, req.user._id);
        // Soft delete comments associated with it
        const comments = await commentService.getComments({ articleId: req.params.id });
        for (const c of comments) {
          await commentService.softDeleteComment(c._id, req.user._id);
        }
      });
      res.json({ message: "Article deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async restoreArticle(req, res, next) {
    try {
      let restored;
      await runInTransaction(async (session) => {
        restored = await articleService.restoreArticle(req.params.id, req.user._id);
        const comments = await Comment.find({ articleId: req.params.id, isDeleted: true });
        for (const c of comments) {
          await commentService.restoreComment(c._id, req.user._id);
        }
      });
      res.json({ article: restored, message: "Article restored successfully." });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const article = await articleService.updateArticle(req.params.id, { status }, req.user._id);
      res.json({ article, message: `Article ${status}.` });
    } catch (err) {
      next(err);
    }
  }

}

module.exports = new ArticleController();
