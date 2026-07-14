const mediaService = require("../services/mediaService");

class MediaController {
  async getMediaFiles(req, res, next) {
    try {
      const files = await mediaService.getMediaFiles(req.query);
      res.json({ success: true, ...files });
    } catch (err) {
      next(err);
    }
  }

  async uploadFile(req, res, next) {
    try {
      const folder = req.body.folder || req.query.folder || "misc";
      if (req.file) {
        const file = req.file;
        const media = await mediaService.uploadFile(file, folder, req.user?._id);
        return res.status(201).json({ success: true, media, message: "Media uploaded." });
      }

      if (req.files && Object.keys(req.files).length > 0) {
        const file = req.files.file;
        const media = await mediaService.uploadFile(file, folder, req.user?._id);
        return res.status(201).json({ success: true, media, message: "Media uploaded." });
      }

      const { name, fileName, url, type, alt, size, mimeType, provider } = req.body;
      if (!url) return res.status(400).json({ message: "URL is required." });

      const media = await mediaService.uploadFile({
        name: name || fileName || "Untitled",
        fileName: fileName || name || "file",
        url,
        type: type || "image",
        folder: folder || "Uploads",
        alt: alt || "",
        size: size || "",
        mimeType: mimeType || "image/jpeg",
        provider: provider || "local",
      }, folder, req.user?._id);

      res.status(201).json({ media, message: "Media saved." });
    } catch (err) {
      next(err);
    }
  }

  async renameMedia(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required." });
      const media = await mediaService.renameMedia(id, name, req.user?._id);
      res.json({ success: true, media, message: "Media renamed." });
    } catch (err) {
      next(err);
    }
  }

  async moveMedia(req, res, next) {
    try {
      const { id } = req.params;
      const { folder } = req.body;
      if (!folder) return res.status(400).json({ message: "Target folder is required." });
      const media = await mediaService.moveMedia(id, folder, req.user?._id);
      res.json({ success: true, media, message: "Media moved." });
    } catch (err) {
      next(err);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { id } = req.params;
      await mediaService.deleteFile(id, req.user?._id);
      res.json({ success: true, message: "Media asset deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async restoreFile(req, res, next) {
    try {
      const { id } = req.params;
      const media = await mediaService.restoreFile(id, req.user?._id);
      res.json({ success: true, media, message: "Media asset restored successfully." });
    } catch (err) {
      next(err);
    }
  }

  async getFolders(req, res, next) {
    try {
      const folders = await mediaService.getFolders();
      res.json({ success: true, folders });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MediaController();
