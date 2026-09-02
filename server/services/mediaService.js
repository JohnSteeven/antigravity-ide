/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  mediaService.js  —  Digital Asset Management (DAM) Service Layer
 *  MyJourney CMS  |  Phase 2: Media Library 2.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const Media = require('../models/Media');
const MediaFolder = require('../models/MediaFolder');
const StorageFactory = require('../storage/StorageFactory');
const Article = require('../models/Article');
const Category = require('../models/Category');

const DEFAULT_FOLDERS = [
  { name: 'Images', color: '#426c67', icon: 'Image' },
  { name: 'Videos', color: '#4d6478', icon: 'Video' },
  { name: 'Documents', color: '#a85f49', icon: 'FileText' },
  { name: 'Audio', color: '#b58b5f', icon: 'Music' },
  { name: 'Icons', color: '#2e7d5a', icon: 'Smile' },
  { name: 'Logos', color: '#666d6d', icon: 'Box' },
  { name: 'Hero Images', color: '#426c67', icon: 'Star' },
  { name: 'Gallery', color: '#4d6478', icon: 'Grid' },
  { name: 'Articles', color: '#a85f49', icon: 'Edit' },
  { name: 'Avatars', color: '#2e7d5a', icon: 'User' },
  { name: 'Downloads', color: '#b58b5f', icon: 'Download' },
  { name: 'Archived', color: '#999999', icon: 'Archive' },
];

class MediaService {
  /**
   * Seed default system folders if empty
   */
  static async seedDefaultFolders(userId = null) {
    try {
      const count = await MediaFolder.countDocuments({ parentFolder: null });
      if (count === 0) {
        console.info('[MediaService] Seeding default media folders...');
        const folderDocs = DEFAULT_FOLDERS.map((f) => ({
          name: f.name,
          slug: f.name.toLowerCase().replace(/\s+/g, '-'),
          parentFolder: null,
          path: `/${f.name.toLowerCase().replace(/\s+/g, '-')}/`,
          color: f.color,
          icon: f.icon,
          createdBy: userId,
        }));
        await MediaFolder.insertMany(folderDocs);
        console.info(`[MediaService] Seeded ${folderDocs.length} media folders.`);
      }
    } catch (err) {
      console.error('[MediaService] Folder seed error:', err.message);
    }
  }

  /**
   * Calculate SHA256 checksum from Buffer
   */
  static computeChecksum(buffer) {
    if (!Buffer.isBuffer(buffer)) return null;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Check if a file already exists by checksum
   */
  static async findDuplicate(checksum) {
    if (!checksum) return null;
    return await Media.findOne({ checksum, isDeleted: false });
  }

  /**
   * Query media with smart collections & filters
   */
  static async queryMedia({ folderId, collection, type, search, page = 1, limit = 24 }) {
    const query = { isDeleted: false };

    // 1. Folder filter
    if (folderId) {
      query.folder = folderId;
    }

    // 2. Type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    // 3. Smart Collections
    if (collection) {
      switch (collection) {
        case 'favorites':
          query.isFavorite = true;
          break;
        case 'recently_uploaded':
          // Handled by sort order
          break;
        case 'unused':
          query.usageCount = 0;
          break;
        case 'most_used':
          query.usageCount = { $gt: 0 };
          break;
        case 'large':
          query.sizeBytes = { $gt: 5 * 1024 * 1024 }; // > 5MB
          break;
        case 'duplicates':
          query.isDuplicate = true;
          break;
        case 'archived':
          query.status = 'archived';
          break;
        default:
          break;
      }
    }

    // 4. Text Search
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { fileName: regex },
        { originalName: regex },
        { altText: regex },
        { caption: regex },
        { tags: regex },
      ];
    }

    const sort = collection === 'most_used' ? { usageCount: -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Media.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Media.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Scan usage references across database to prevent deleting used assets
   */
  static async checkAssetUsage(mediaId) {
    const media = await Media.findById(mediaId);
    if (!media) return { usageCount: 0, usedBy: [] };

    const usedBy = [];

    // Scan Articles using this image URL or mediaId
    const articles = await Article.find({
      $or: [{ featuredImage: media.url }, { content: new RegExp(media.url, 'i') }],
      isDeleted: false,
    }).select('title _id').lean();

    articles.forEach((a) => {
      usedBy.push({ entityType: 'article', entityId: a._id, title: a.title, field: 'featuredImage' });
    });

    // Scan Categories using this image
    const categories = await Category.find({ image: media.url, isDeleted: false }).select('name _id').lean();
    categories.forEach((c) => {
      usedBy.push({ entityType: 'category', entityId: c._id, title: c.name, field: 'image' });
    });

    // Update media document usage count
    media.usageCount = usedBy.length;
    media.usedBy = usedBy;
    media.lastUsed = usedBy.length > 0 ? new Date() : media.lastUsed;
    await media.save();

    return {
      usageCount: usedBy.length,
      usedBy,
    };
  }

  /**
   * Process and save uploaded file using StorageFactory adapter
   */
  static async uploadFile({ file, filename, mimetype, folderId, userId }) {
    const checksum = MediaService.computeChecksum(file);
    const existingDuplicate = await MediaService.findDuplicate(checksum);

    const storage = StorageFactory.create();
    const folderDoc = folderId ? await MediaFolder.findById(folderId) : null;

    const uploaded = await storage.upload(file, {
      filename,
      mimetype,
      folder: folderDoc ? folderDoc.slug : 'uploads',
    });

    // Determine high-level asset type
    let assetType = 'image';
    if (mimetype.startsWith('video/')) assetType = 'video';
    else if (mimetype.startsWith('audio/')) assetType = 'audio';
    else if (mimetype.includes('pdf')) assetType = 'pdf';
    else if (mimetype.includes('document') || mimetype.includes('word')) assetType = 'document';

    const ext = filename.split('.').pop() || '';

    const media = new Media({
      name: filename,
      fileName: uploaded.filename || filename,
      originalName: filename,
      displayName: filename,
      slug: filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-'),
      mimeType: mimetype,
      type: assetType,
      extension: ext.toLowerCase(),
      url: uploaded.url,
      provider: process.env.STORAGE_DRIVER || 'local',
      folder: folderId || null,
      folderPath: folderDoc ? folderDoc.path : '/',
      sizeBytes: uploaded.size || 0,
      size: `${(uploaded.size / (1024 * 1024)).toFixed(2)} MB`,
      checksum,
      isDuplicate: !!existingDuplicate,
      duplicateOf: existingDuplicate ? existingDuplicate._id : null,
      uploadedById: userId,
      createdBy: userId,
    });

    await media.save();
    return { media, isDuplicate: !!existingDuplicate, duplicate: existingDuplicate };
  }

  /**
   * Replace file with version tracking
   */
  static async replaceFile(mediaId, { file, filename, mimetype, userId }) {
    const media = await Media.findById(mediaId);
    if (!media) throw new Error('Asset not found.');

    // Save previous version snapshot
    const currentVersion = (media.versions?.length || 0) + 1;
    media.versions.push({
      version: currentVersion,
      key: media.fileName,
      url: media.url,
      sizeBytes: media.sizeBytes,
      createdAt: new Date(),
    });

    const storage = StorageFactory.create();
    const uploaded = await storage.upload(file, { filename, mimetype });

    media.url = uploaded.url;
    media.fileName = uploaded.filename;
    media.originalName = filename;
    media.mimeType = mimetype;
    media.sizeBytes = uploaded.size;
    media.checksum = MediaService.computeChecksum(file);
    media.updatedBy = userId;

    await media.save();
    return media;
  }

  /**
   * Bulk operations (move, copy, archive, tag, delete)
   */
  static async bulkAction({ action, ids = [], payload = {} }) {
    switch (action) {
      case 'move':
        await Media.updateMany({ _id: { $in: ids } }, { $set: { folder: payload.targetFolderId || null } });
        break;
      case 'archive':
        await Media.updateMany({ _id: { $in: ids } }, { $set: { status: 'archived', isArchived: true } });
        break;
      case 'tag':
        if (payload.tags) {
          await Media.updateMany({ _id: { $in: ids } }, { $addToSet: { tags: { $each: payload.tags } } });
        }
        break;
      case 'delete':
        await Media.updateMany({ _id: { $in: ids } }, { $set: { isDeleted: true, deletedAt: new Date() } });
        break;
      default:
        throw new Error(`Unsupported bulk action '${action}'`);
    }
    return { count: ids.length, action };
  }
}

module.exports = MediaService;
