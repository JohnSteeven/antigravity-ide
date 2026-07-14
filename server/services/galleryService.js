const galleryRepository = require("../repositories/galleryRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class GalleryService {
  async getGalleryItems(query = {}) {
    const filter = {};

    if (query.album && query.album !== "all") {
      filter.album = query.album;
    }

    if (query.visibility !== undefined && query.visibility !== "all") {
      filter.visibility = query.visibility === "true" || query.visibility === true;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { title: regex },
        { alt: regex },
        { category: regex },
        { album: regex },
      ];
    }

    const sort = {};
    if (query.sortBy) {
      const direction = query.sortDir === "desc" ? -1 : 1;
      sort[query.sortBy] = direction;
    } else {
      sort.sortOrder = 1;
      sort.createdAt = -1;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 12);
    const skip = (page - 1) * limit;

    const includeDeleted = query.includeDeleted === "true" || query.includeDeleted === true;

    let files, total;
    if (includeDeleted) {
      files = await galleryRepository.findWithDeleted(filter, sort, limit, skip);
      total = await galleryRepository.countWithDeleted(filter);
    } else {
      files = await galleryRepository.find(filter, sort, limit, skip);
      total = await galleryRepository.count(filter);
    }

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createGalleryItem(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const item = await galleryRepository.create(data);

    await activityLogRepository.create({
      action: "gallery_create",
      description: `Uploaded/Created gallery image "${item.title || item.fileName}" in album "${item.album}"`,
      userId,
      module: "gallery",
    });

    return item;
  }

  async updateGalleryItem(id, data, userId) {
    data.updatedBy = userId;
    const item = await galleryRepository.update(id, data);
    if (!item) throw new Error("Gallery item not found.");

    await activityLogRepository.create({
      action: "gallery_update",
      description: `Updated gallery item "${item.title || item.fileName}"`,
      userId,
      module: "gallery",
    });

    return item;
  }

  async softDeleteGalleryItem(id, userId) {
    const item = await galleryRepository.softDelete(id, userId);
    if (!item) throw new Error("Gallery item not found.");

    await activityLogRepository.create({
      action: "gallery_delete",
      description: `Soft deleted gallery item "${item.title || item.fileName}"`,
      userId,
      module: "gallery",
    });

    return item;
  }

  async restoreGalleryItem(id, userId) {
    const item = await galleryRepository.restore(id, userId);
    if (!item) throw new Error("Gallery item not found.");

    await activityLogRepository.create({
      action: "gallery_restore",
      description: `Restored gallery item "${item.title || item.fileName}"`,
      userId,
      module: "gallery",
    });

    return item;
  }

  async getAlbums() {
    return galleryRepository.getAlbums();
  }
}

module.exports = new GalleryService();
