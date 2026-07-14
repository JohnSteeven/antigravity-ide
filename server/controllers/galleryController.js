const galleryService = require("../services/galleryService");

class GalleryController {
  async getGalleryItems(req, res, next) {
    try {
      const result = await galleryService.getGalleryItems(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createGalleryItem(req, res, next) {
    try {
      const item = await galleryService.createGalleryItem(req.body, req.user?._id);
      res.status(201).json({ success: true, file: item });
    } catch (err) {
      next(err);
    }
  }

  async updateGalleryItem(req, res, next) {
    try {
      const item = await galleryService.updateGalleryItem(req.params.id, req.body, req.user?._id);
      res.json({ success: true, file: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteGalleryItem(req, res, next) {
    try {
      await galleryService.softDeleteGalleryItem(req.params.id, req.user?._id);
      res.json({ success: true, message: "Gallery item soft deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreGalleryItem(req, res, next) {
    try {
      const item = await galleryService.restoreGalleryItem(req.params.id, req.user?._id);
      res.json({ success: true, file: item, message: "Gallery item restored." });
    } catch (err) {
      next(err);
    }
  }

  async getAlbums(req, res, next) {
    try {
      const albums = await galleryService.getAlbums();
      res.json({ success: true, albums });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GalleryController();
