const categoryRepository = require('../repositories/categoryRepository');
const activityLogRepository = require('../repositories/activityLogRepository');

// All fields the CMS is allowed to save on a category
const ALLOWED_FIELDS = [
  'name', 'slug', 'description', 'longDescription',
  'icon', 'heroImage', 'accentColor', 'layoutTemplate',
  'sortOrder', 'isFeatured',
  'status', 'isActive', 'visibility',
  'showOnHomepage', 'showInNavigation', 'showInFooter',
  'showInSearch', 'includeInSitemap',
  'allowArticles', 'allowComments',
  'seoTitle', 'seoDescription', 'seoKeywords',
  'subcategories', 'parentCategory',
];

function pickAllowed(data) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

class CategoryService {
  /**
   * CMS admin list — returns ALL non-deleted categories regardless of visibility.
   * Supports ?isActive, ?status, ?includeDeleted query params.
   */
  async getCategories(query = {}) {
    const filter = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.status) filter.status = query.status;
    const includeDeleted = query.includeDeleted === 'true';
    return categoryRepository.find(filter, { sortOrder: 1, name: 1 }, includeDeleted);
  }

  /**
   * Public site list — only published + active + public categories.
   * Optionally filtered by a surface flag (showOnHomepage, showInNavigation, etc.)
   */
  async getPublicCategories(surfaceFilter = {}) {
    return categoryRepository.findPublic(surfaceFilter);
  }

  async getCategoryBySlug(slug) {
    return categoryRepository.findBySlug(slug);
  }

  async getCategoryById(id) {
    return categoryRepository.findById(id);
  }

  async createCategory(data, userId) {
    const payload = pickAllowed(data);
    payload.createdBy = userId;
    payload.updatedBy = userId;
    if (payload.status === 'published' && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    const category = await categoryRepository.create(payload);

    await activityLogRepository.create({
      action: 'category_create',
      description: `Created category "${category.name}"`,
      userId,
    });
    return category;
  }

  async updateCategory(id, data, userId) {
    const payload = pickAllowed(data);
    payload.updatedBy = userId;

    // Track publish/archive timestamps
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new Error('Category not found.');
    if (payload.status === 'published' && existing.status !== 'published') {
      payload.publishedAt = new Date();
    }
    if (payload.status === 'archived' && existing.status !== 'archived') {
      payload.archivedAt = new Date();
    }

    const category = await categoryRepository.update(id, payload);
    if (!category) throw new Error('Category not found.');

    await activityLogRepository.create({
      action: 'category_update',
      description: `Updated category "${category.name}" — status: ${category.status}, isActive: ${category.isActive}`,
      userId,
    });
    return category;
  }

  async softDeleteCategory(id, userId) {
    const category = await categoryRepository.softDelete(id, userId);
    if (!category) throw new Error('Category not found.');

    await activityLogRepository.create({
      action: 'category_delete',
      description: `Soft deleted category "${category.name}" — articles preserved`,
      userId,
    });
    return category;
  }

  async restoreCategory(id, userId) {
    const category = await categoryRepository.restore(id, userId);
    if (!category) throw new Error('Category not found.');

    await activityLogRepository.create({
      action: 'category_restore',
      description: `Restored category "${category.name}"`,
      userId,
    });
    return category;
  }
}

module.exports = new CategoryService();
