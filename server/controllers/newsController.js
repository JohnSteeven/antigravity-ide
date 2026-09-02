const newsService = require("../services/NewsService");
const NewsClick = require("../models/NewsClick");
const NewsImpression = require("../models/NewsImpression");

class NewsController {
  // Fetch news headlines and log impressions in the background
  async getNews(req, res, next) {
    try {
      const { category = "world", q = "" } = req.query;
      const articles = await newsService.fetchArticles(category, q);

      // Async background logging of impressions to prevent slowing down the request
      if (articles && articles.length > 0) {
        process.nextTick(async () => {
          try {
            // Group by publisher to do batch updates/upserts
            const groups = {};
            articles.forEach(a => {
              const pub = a.source || "Global Press";
              groups[pub] = (groups[pub] || 0) + 1;
            });

            for (const [publisher, count] of Object.entries(groups)) {
              await NewsImpression.findOneAndUpdate(
                { publisher, category: category.toLowerCase() },
                { 
                  $inc: { impressions: count }, 
                  $set: { viewedAt: new Date() } 
                },
                { upsert: true, new: true }
              );
            }
          } catch (err) {
            console.error("[NewsController] Failed to log background impressions:", err.message);
          }
        });
      }

      res.json({ success: true, articles });
    } catch (err) {
      next(err);
    }
  }

  // Track click event when user visits external article source
  async trackClick(req, res, next) {
    try {
      const { articleId, title, publisher, category, url } = req.body;
      if (!articleId || !title || !publisher || !category || !url) {
        return res.status(400).json({ success: false, message: "Missing required click analytics fields." });
      }

      const click = await NewsClick.create({
        articleId,
        title,
        publisher,
        category: category.toLowerCase(),
        url
      });

      res.json({ success: true, click });
    } catch (err) {
      next(err);
    }
  }

  // Track impressions directly (alternative client-side reporting)
  async trackImpression(req, res, next) {
    try {
      const { impressions } = req.body;
      if (Array.isArray(impressions)) {
        for (const item of impressions) {
          const { publisher, category, count = 1 } = item;
          if (publisher && category) {
            await NewsImpression.findOneAndUpdate(
              { publisher, category: category.toLowerCase() },
              { $inc: { impressions: count }, $set: { viewedAt: new Date() } },
              { upsert: true }
            );
          }
        }
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Retrieve news analytics for CMS panel
  async getStats(req, res, next) {
    try {
      // 1. Total clicks
      const totalClicks = await NewsClick.countDocuments();

      // 2. Top clicked articles
      const topArticles = await NewsClick.aggregate([
        { $group: { _id: "$articleId", title: { $first: "$title" }, publisher: { $first: "$publisher" }, clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 }
      ]);

      // 3. Top publishers by clicks
      const topPublishersByClicks = await NewsClick.aggregate([
        { $group: { _id: "$publisher", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 }
      ]);

      // 4. Top publishers by impressions
      const topPublishersByImpressions = await NewsImpression.aggregate([
        { $group: { _id: "$publisher", impressions: { $sum: "$impressions" } } },
        { $sort: { impressions: -1 } },
        { $limit: 5 }
      ]);

      // 5. Category popularity by clicks
      const categoriesByClicks = await NewsClick.aggregate([
        { $group: { _id: "$category", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } }
      ]);

      // 6. Category popularity by impressions
      const categoriesByImpressions = await NewsImpression.aggregate([
        { $group: { _id: "$category", impressions: { $sum: "$impressions" } } },
        { $sort: { impressions: -1 } }
      ]);

      res.json({
        success: true,
        stats: {
          totalClicks,
          topArticles,
          topPublishersByClicks,
          topPublishersByImpressions,
          categoriesByClicks,
          categoriesByImpressions
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NewsController();
