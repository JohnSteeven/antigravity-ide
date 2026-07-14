const categoryService = require("../services/categoryService");

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getCategories(req.query);
      res.json({ categories });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      if (!category) return res.status(404).json({ message: "Category not found." });
      res.json({ category });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body, req.user?._id);
      res.status(201).json({ category, message: "Category created." });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body, req.user?._id);
      res.json({ category, message: "Category updated." });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.softDeleteCategory(req.params.id, req.user?._id);
      res.json({ message: "Category deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreCategory(req, res, next) {
    try {
      const category = await categoryService.restoreCategory(req.params.id, req.user?._id);
      res.json({ category, message: "Category restored." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
