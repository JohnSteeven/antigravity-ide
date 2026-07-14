const tagService = require("../services/tagService");

class TagController {
  async getTags(req, res, next) {
    try {
      const tags = await tagService.getTags(req.query);
      res.json({ tags });
    } catch (err) {
      next(err);
    }
  }

  async getTagById(req, res, next) {
    try {
      const tag = await tagService.getTagById(req.params.id);
      if (!tag) return res.status(404).json({ message: "Tag not found." });
      res.json({ tag });
    } catch (err) {
      next(err);
    }
  }

  async createTag(req, res, next) {
    try {
      const tag = await tagService.createTag(req.body, req.user?._id);
      res.status(201).json({ tag, message: "Tag created." });
    } catch (err) {
      next(err);
    }
  }

  async updateTag(req, res, next) {
    try {
      const tag = await tagService.updateTag(req.params.id, req.body, req.user?._id);
      res.json({ tag, message: "Tag updated." });
    } catch (err) {
      next(err);
    }
  }

  async deleteTag(req, res, next) {
    try {
      await tagService.softDeleteTag(req.params.id, req.user?._id);
      res.json({ message: "Tag deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreTag(req, res, next) {
    try {
      const tag = await tagService.restoreTag(req.params.id, req.user?._id);
      res.json({ tag, message: "Tag restored." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TagController();
