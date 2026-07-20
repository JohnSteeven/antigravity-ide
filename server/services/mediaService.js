const fs = require("fs");
const path = require("path");
const mediaRepository = require("../repositories/mediaRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class LocalStorageProvider {
  async upload(file, folder) {
    const uploadDir = path.join(__dirname, "../../uploads", folder || "");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.name || "file"}`;
    const filePath = path.join(uploadDir, uniqueName);
    
    if (file.mv) {
      await file.mv(filePath);
    } else if (file.data) {
      fs.writeFileSync(filePath, file.data);
    }

    const url = `/uploads/${folder ? folder + "/" : ""}${uniqueName}`;
    return {
      fileName: uniqueName,
      originalName: file.name,
      url,
      mimeType: file.mimetype || "image/jpeg",
      sizeBytes: file.size || 0,
      size: `${((file.size || 0) / 1024).toFixed(2)} KB`,
    };
  }

  async delete(fileName, folder) {
    const filePath = path.join(__dirname, "../../uploads", folder || "", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

class MediaService {
  constructor() {
    this.provider = new LocalStorageProvider();
  }

  async getMediaFiles(query = {}) {
    const filter = {};
    if (query.type && query.type !== "all") filter.type = query.type;
    if (query.folder && query.folder !== "all") filter.folder = query.folder;
    const includeDeleted = query.includeDeleted === "true";

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      mediaRepository.find(filter, { createdAt: -1 }, limit, skip, includeDeleted),
      mediaRepository.count(filter, includeDeleted),
    ]);

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

  async uploadFile(file, folder, userId) {
    let uploadedData;
    if (file.url) {
      uploadedData = file;
    } else if (file.filename) {
      // Multer file object
      const cleanFolder = folder ? folder.toLowerCase() : "misc";
      const allowedFolders = ["articles", "covers", "gallery", "profile", "newsletters", "logos", "uploads", "misc"];
      const targetFolder = allowedFolders.includes(cleanFolder) ? cleanFolder : "misc";
      const url = `/uploads/${targetFolder}/${file.filename}`;
      uploadedData = {
        fileName: file.filename,
        originalName: file.originalname,
        url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.mimetype.split("/")[0] || "image",
      };
    } else {
      uploadedData = await this.provider.upload(file, folder);
    }

    const media = await mediaRepository.create({
      ...uploadedData,
      name: file.originalname || file.name || uploadedData.name || "Untitled",
      folder: folder || "Uploads",
      uploadedById: userId,
    });

    await activityLogRepository.create({
      action: "media_upload",
      description: `Uploaded media file "${media.name}"`,
      userId,
    });

    return media;
  }

  async renameMedia(id, newName, userId) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new Error("Media asset not found.");
    media.name = newName;
    media.updatedBy = userId;
    await media.save();
    return media;
  }

  async moveMedia(id, newFolder, userId) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new Error("Media asset not found.");
    const allowedFolders = ["articles", "covers", "gallery", "profile", "newsletters", "logos", "misc"];
    if (!allowedFolders.includes(newFolder)) {
      throw new Error("Invalid target folder.");
    }
    
    // Move on disk if file exists
    const oldPath = path.join(__dirname, "../../uploads", media.folder, media.fileName);
    const newPath = path.join(__dirname, "../../uploads", newFolder, media.fileName);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
    
    media.folder = newFolder;
    media.url = `/uploads/${newFolder}/${media.fileName}`;
    media.updatedBy = userId;
    await media.save();
    return media;
  }

  async deleteFile(id, userId) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new Error("Media asset not found.");

    const updated = await mediaRepository.softDelete(id, userId);
    
    await activityLogRepository.create({
      action: "media_delete",
      description: `Soft deleted media asset "${media.name}"`,
      userId,
    });

    return updated;
  }

  async restoreFile(id, userId) {
    const media = await mediaRepository.restore(id, userId);
    if (!media) throw new Error("Media asset not found.");

    await activityLogRepository.create({
      action: "media_restore",
      description: `Restored media asset "${media.name}"`,
      userId,
    });
    return media;
  }

  async getFolders() {
    return mediaRepository.distinctFolders();
  }
}

module.exports = new MediaService();
