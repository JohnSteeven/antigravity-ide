const subCategoryService = require("../services/subCategoryService");

class SubCategoryController {
  async getSubCategories(req, res, next) {
    try {
      const subCategories = await subCategoryService.getSubCategories(req.query);
      res.json({ success: true, subCategories });
    } catch (err) {
      next(err);
    }
  }

  async getSubCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const subCategory = await subCategoryService.getSubCategoryById(id);
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found." });
      }
      res.json({ success: true, subCategory });
    } catch (err) {
      next(err);
    }
  }

  async createSubCategory(req, res, next) {
    try {
      const subCategory = await subCategoryService.createSubCategory(req.body, req.user?._id);
      res.status(201).json({ success: true, subCategory });
    } catch (err) {
      next(err);
    }
  }

  async updateSubCategory(req, res, next) {
    try {
      const { id } = req.params;
      const subCategory = await subCategoryService.updateSubCategory(id, req.body, req.user?._id);
      res.json({ success: true, subCategory });
    } catch (err) {
      next(err);
    }
  }

  async softDeleteSubCategory(req, res, next) {
    try {
      const { id } = req.params;
      await subCategoryService.softDeleteSubCategory(id, req.user?._id);
      res.json({ success: true, message: "Subcategory deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async restoreSubCategory(req, res, next) {
    try {
      const { id } = req.params;
      const subCategory = await subCategoryService.restoreSubCategory(id, req.user?._id);
      res.json({ success: true, subCategory });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubCategoryController();
