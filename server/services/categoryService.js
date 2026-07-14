const categoryRepository = require("../repositories/categoryRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class CategoryService {
  async getCategories(query = {}) {
    const filter = {};
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    const includeDeleted = query.includeDeleted === "true";
    return categoryRepository.find(filter, { sortOrder: 1, name: 1 }, includeDeleted);
  }

  async getCategoryBySlug(slug) {
    return categoryRepository.findBySlug(slug);
  }

  async getCategoryById(id) {
    return categoryRepository.findById(id);
  }

  async createCategory(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const category = await categoryRepository.create(data);

    await activityLogRepository.create({
      action: "category_create",
      description: `Created category "${category.name}"`,
      userId,
    });
    return category;
  }

  async updateCategory(id, data, userId) {
    data.updatedBy = userId;
    const category = await categoryRepository.update(id, data);
    if (!category) throw new Error("Category not found.");

    await activityLogRepository.create({
      action: "category_update",
      description: `Updated category "${category.name}"`,
      userId,
    });
    return category;
  }

  async softDeleteCategory(id, userId) {
    const category = await categoryRepository.softDelete(id, userId);
    if (!category) throw new Error("Category not found.");

    await activityLogRepository.create({
      action: "category_delete",
      description: `Soft deleted category "${category.name}"`,
      userId,
    });
    return category;
  }

  async restoreCategory(id, userId) {
    const category = await categoryRepository.restore(id, userId);
    if (!category) throw new Error("Category not found.");

    await activityLogRepository.create({
      action: "category_restore",
      description: `Restored category "${category.name}"`,
      userId,
    });
    return category;
  }
}

module.exports = new CategoryService();
