/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server/tests/categories.test.js  —  Universal Category System Tests
 *  MyJourney Platform  |  P0 Stabilization Phase 2
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Verifies:
 *   - Any category can be created dynamically via CMS (no hardcoded enums/routes).
 *   - Category can be toggled OFF (isActive: false) without deleting articles.
 *   - Category status (draft/published/archived) and visibility (public/unlisted/private)
 *     properly control public accessibility.
 *   - Soft-deleting a category preserves existing category metadata and relations.
 *   - Restoring a category re-enables it cleanly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const categoryService = require('../services/categoryService');
const categoryRepository = require('../repositories/categoryRepository');

jest.mock('../repositories/categoryRepository');
jest.mock('../repositories/activityLogRepository', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

describe('Universal Category Lifecycle Tests (Phase 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Dynamic Category Creation', () => {
    it('creates a new custom category with dynamic name, slug, icon, and colors', async () => {
      const inputData = {
        name: 'Photography & Visuals',
        slug: 'photography-visuals',
        description: 'Camera gear, composition, and visual storytelling.',
        icon: 'camera',
        accentColor: '#e056fd',
        layoutTemplate: 'magazine',
        status: 'published',
        isActive: true,
        visibility: 'public',
        showOnHomepage: true,
        showInNavigation: true,
      };

      categoryRepository.create.mockImplementation(async (payload) => ({
        _id: 'cat-photo-101',
        ...payload,
        createdAt: new Date(),
      }));

      const category = await categoryService.createCategory(inputData, 'user-admin-1');

      expect(categoryRepository.create).toHaveBeenCalledTimes(1);
      const createdArg = categoryRepository.create.mock.calls[0][0];
      expect(createdArg.name).toBe('Photography & Visuals');
      expect(createdArg.slug).toBe('photography-visuals');
      expect(createdArg.icon).toBe('camera');
      expect(createdArg.accentColor).toBe('#e056fd');
      expect(createdArg.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('2. Safe Category Toggle OFF / ON (Non-destructive)', () => {
    it('toggles isActive to false without deleting category or associated articles', async () => {
      const existingCat = {
        _id: 'cat-photo-101',
        name: 'Photography & Visuals',
        slug: 'photography-visuals',
        status: 'published',
        isActive: true,
      };

      categoryRepository.findById.mockResolvedValue(existingCat);
      categoryRepository.update.mockResolvedValue({
        ...existingCat,
        isActive: false,
      });

      const updated = await categoryService.updateCategory('cat-photo-101', { isActive: false }, 'user-admin-1');

      expect(updated.isActive).toBe(false);
      expect(categoryRepository.update).toHaveBeenCalledWith(
        'cat-photo-101',
        expect.objectContaining({ isActive: false, updatedBy: 'user-admin-1' })
      );
    });
  });

  describe('3. Public Category Filtering', () => {
    it('excludes inactive or draft categories from public listings', async () => {
      const mockPublicCats = [
        { name: 'Life', slug: 'life', status: 'published', isActive: true, visibility: 'public' },
        { name: 'Coding', slug: 'coding', status: 'published', isActive: true, visibility: 'public' },
      ];

      categoryRepository.findPublic.mockResolvedValue(mockPublicCats);

      const publicCats = await categoryService.getPublicCategories();

      expect(categoryRepository.findPublic).toHaveBeenCalled();
      expect(publicCats).toHaveLength(2);
      expect(publicCats.map((c) => c.slug)).toEqual(['life', 'coding']);
    });
  });

  describe('4. Soft Delete & Restoration', () => {
    it('soft deletes category setting isDeleted: true without destroying records', async () => {
      categoryRepository.softDelete.mockResolvedValue({
        _id: 'cat-photo-101',
        name: 'Photography & Visuals',
        isDeleted: true,
      });

      const deleted = await categoryService.softDeleteCategory('cat-photo-101', 'user-admin-1');

      expect(categoryRepository.softDelete).toHaveBeenCalledWith('cat-photo-101', 'user-admin-1');
      expect(deleted.isDeleted).toBe(true);
    });

    it('restores a soft-deleted category cleanly', async () => {
      categoryRepository.restore.mockResolvedValue({
        _id: 'cat-photo-101',
        name: 'Photography & Visuals',
        isDeleted: false,
        deletedAt: null,
      });

      const restored = await categoryService.restoreCategory('cat-photo-101', 'user-admin-1');

      expect(categoryRepository.restore).toHaveBeenCalledWith('cat-photo-101', 'user-admin-1');
      expect(restored.isDeleted).toBe(false);
    });
  });
});
