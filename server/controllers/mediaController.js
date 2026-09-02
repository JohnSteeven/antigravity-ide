/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  mediaController.js  —  Digital Asset Management (DAM) API Controller
 *  MyJourney CMS  |  Phase 2: Media Library 2.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Media = require('../models/Media');
const MediaFolder = require('../models/MediaFolder');
const MediaService = require('../services/mediaService');
const AuditLogger = require('../audit/AuditLogger');

// ── Asset Handlers ────────────────────────────────────────────────────────────

exports.getMedia = async (req, res) => {
  try {
    const { folderId, collection, type, search, page = 1, limit = 24 } = req.query;
    await MediaService.seedDefaultFolders(req.user?.id);
    const result = await MediaService.queryMedia({ folderId, collection, type, search, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media assets', message: err.message });
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Not Found', message: 'Asset not found' });
    const usage = await MediaService.checkAssetUsage(media._id);
    res.json({ success: true, data: media, usage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch asset', message: err.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const folderId = req.body.folderId || req.body.folder || null;
    let fileBuffer = null;
    let filename = req.body.name || 'file';
    let mimetype = req.body.mimeType || 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer || req.file.path;
      filename = req.file.originalname || filename;
      mimetype = req.file.mimetype || mimetype;
    } else if (req.files && req.files.file) {
      const f = req.files.file;
      fileBuffer = f.data || f.tempFilePath;
      filename = f.name || filename;
      mimetype = f.mimetype || mimetype;
    } else if (req.body.url) {
      // URL based registration
      const media = new Media({
        name: filename,
        fileName: filename,
        url: req.body.url,
        type: req.body.type || 'image',
        mimeType: mimetype,
        folder: folderId,
        uploadedById: req.user?.id,
      });
      await media.save();
      return res.status(201).json({ success: true, data: media });
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Missing File', message: 'No file uploaded or URL provided.' });
    }

    const { media, isDuplicate, duplicate } = await MediaService.uploadFile({
      file: fileBuffer,
      filename,
      mimetype,
      folderId,
      userId: req.user?.id,
    });

    await AuditLogger.log({
      entity: 'media',
      entityId: media._id,
      action: 'upload',
      userId: req.user?.id,
      after: media,
      req,
      details: `Uploaded asset '${media.name}'`,
    });

    res.status(201).json({
      success: true,
      data: media,
      isDuplicate,
      warning: isDuplicate ? `Duplicate asset detected (matches '${duplicate.name}')` : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', message: err.message });
  }
};

exports.updateMedia = async (req, res) => {
  try {
    const { altText, caption, description, tags, folder, isFavorite, status, name } = req.body;
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Not Found', message: 'Asset not found' });

    if (altText !== undefined) { media.altText = altText; media.alt = altText; }
    if (caption !== undefined) media.caption = caption;
    if (description !== undefined) media.description = description;
    if (tags !== undefined) media.tags = tags;
    if (folder !== undefined) media.folder = folder;
    if (isFavorite !== undefined) media.isFavorite = isFavorite;
    if (status !== undefined) media.status = status;
    if (name !== undefined) media.name = name;

    media.updatedBy = req.user?.id;
    await media.save();

    res.json({ success: true, data: media });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', message: err.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Not Found', message: 'Asset not found' });

    const usage = await MediaService.checkAssetUsage(media._id);
    const force = req.query.force === 'true';

    if (usage.usageCount > 0 && !force) {
      return res.status(409).json({
        error: 'Asset In Use',
        message: `Cannot delete asset. It is currently referenced in ${usage.usageCount} location(s). Pass ?force=true to override.`,
        usage,
      });
    }

    media.isDeleted = true;
    media.deletedAt = new Date();
    await media.save();

    res.json({ success: true, message: `Asset '${media.name}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', message: err.message });
  }
};

// ── Bulk & Versioning Handlers ───────────────────────────────────────────────

exports.bulkAction = async (req, res) => {
  try {
    const { action, ids, payload } = req.body;
    if (!action || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid Request', message: 'Must provide action and ids array' });
    }
    const result = await MediaService.bulkAction({ action, ids, payload });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Bulk action failed', message: err.message });
  }
};

exports.getAssetUsage = async (req, res) => {
  try {
    const usage = await MediaService.checkAssetUsage(req.params.id);
    res.json({ success: true, ...usage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage', message: err.message });
  }
};

exports.replaceMedia = async (req, res) => {
  try {
    let fileBuffer = null;
    let filename = 'replaced-file';
    let mimetype = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer || req.file.path;
      filename = req.file.originalname || filename;
      mimetype = req.file.mimetype || mimetype;
    }

    if (!fileBuffer) return res.status(400).json({ error: 'Missing File', message: 'File is required for replacement.' });

    const media = await MediaService.replaceFile(req.params.id, {
      file: fileBuffer,
      filename,
      mimetype,
      userId: req.user?.id,
    });

    res.json({ success: true, data: media, message: 'File replaced successfully with version snapshot.' });
  } catch (err) {
    res.status(500).json({ error: 'Replacement failed', message: err.message });
  }
};

// ── Folder Handlers ───────────────────────────────────────────────────────────

exports.getFolders = async (req, res) => {
  try {
    await MediaService.seedDefaultFolders(req.user?.id);
    const folders = await MediaFolder.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: folders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders', message: err.message });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolder, color, icon } = req.body;
    const parentDoc = parentFolder ? await MediaFolder.findById(parentFolder) : null;
    const parentPath = parentDoc ? parentDoc.path : '/';

    const folder = new MediaFolder({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      parentFolder: parentFolder || null,
      path: `${parentPath}${name.toLowerCase().replace(/\s+/g, '-')}/`,
      color: color || '#426c67',
      icon: icon || 'Folder',
      createdBy: req.user?.id,
    });

    await folder.save();
    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder', message: err.message });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const folder = await MediaFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Not Found', message: 'Folder not found' });

    if (name) {
      folder.name = name;
      folder.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (color) folder.color = color;
    if (icon) folder.icon = icon;

    await folder.save();
    res.json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update folder', message: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const assetCount = await Media.countDocuments({ folder: folderId, isDeleted: false });
    if (assetCount > 0) {
      return res.status(409).json({ error: 'Folder Not Empty', message: `Cannot delete folder containing ${assetCount} assets.` });
    }
    await MediaFolder.findByIdAndDelete(folderId);
    res.json({ success: true, message: 'Folder deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete folder', message: err.message });
  }
};

// ── Legacy Compatibility Wrappers ─────────────────────────────────────────────
exports.getMediaFiles = exports.getMedia;
exports.renameMedia = exports.updateMedia;
exports.deleteMediaFile = exports.deleteMedia;
