const articleService = require("../services/articleService");

class StoryController {
  async getStories(req, res, next) {
    try {
      const query = { ...req.query, contentType: "story", status: "published" };
      const data = await articleService.getArticles(query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getStoryBySlug(req, res, next) {
    try {
      const article = await articleService.getArticleBySlug(req.params.slug);
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "Story not found." });
      }
      if (article.contentType && article.contentType !== "story") {
        return res.status(400).json({ redirect: true, article, message: "Content is an article" });
      }
      res.json({ article });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StoryController();
