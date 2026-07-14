const subCategoryRepository = require("../repositories/subCategoryRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class SubCategoryService {
  async getSubCategories(query = {}) {
    const filter = {};
    if (query.category) {
      filter.category = query.category;
    }
    const includeDeleted = query.includeDeleted === "true";
    return subCategoryRepository.find(filter, includeDeleted);
  }

  async getSubCategoryById(id) {
    return subCategoryRepository.findById(id);
  }

  async createSubCategory(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const subCategory = await subCategoryRepository.create(data);

    await activityLogRepository.create({
      action: "subcategory_create",
      description: `Created subcategory "${subCategory.name}"`,
      userId,
    });
    return subCategory;
  }

  async updateSubCategory(id, data, userId) {
    data.updatedBy = userId;
    const subCategory = await subCategoryRepository.update(id, data);
    if (!subCategory) throw new Error("Subcategory not found.");

    await activityLogRepository.create({
      action: "subcategory_update",
      description: `Updated subcategory "${subCategory.name}"`,
      userId,
    });
    return subCategory;
  }

  async softDeleteSubCategory(id, userId) {
    const subCategory = await subCategoryRepository.softDelete(id, userId);
    if (!subCategory) throw new Error("Subcategory not found.");

    await activityLogRepository.create({
      action: "subcategory_delete",
      description: `Soft deleted subcategory "${subCategory.name}"`,
      userId,
    });
    return subCategory;
  }

  async restoreSubCategory(id, userId) {
    const subCategory = await subCategoryRepository.restore(id, userId);
    if (!subCategory) throw new Error("Subcategory not found.");

    await activityLogRepository.create({
      action: "subcategory_restore",
      description: `Restored subcategory "${subCategory.name}"`,
      userId,
    });
    return subCategory;
  }
}

module.exports = new SubCategoryService();
