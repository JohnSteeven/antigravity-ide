/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  mediaRoutes.js  —  Digital Asset Management (DAM) API Routes
 *  MyJourney CMS  |  Phase 2: Media Library 2.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

const router = express.Router();

// Memory Storage for Multer so StorageFactory adapter handles writing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Folders CRUD
router.get('/folders', authenticate, mediaController.getFolders);
router.post('/folders', authenticate, mediaController.createFolder);
router.patch('/folders/:id', authenticate, mediaController.updateFolder);
router.delete('/folders/:id', authenticate, mediaController.deleteFolder);

// Asset Operations & Queries
router.get('/', authenticate, mediaController.getMedia);
router.get('/usage/:id', authenticate, mediaController.getAssetUsage);
router.get('/:id', authenticate, mediaController.getMediaById);

router.post('/', authenticate, upload.single('file'), mediaController.uploadMedia);
router.post('/upload', authenticate, upload.single('file'), mediaController.uploadMedia);
router.post('/replace/:id', authenticate, upload.single('file'), mediaController.replaceMedia);

router.patch('/:id', authenticate, mediaController.updateMedia);
router.delete('/:id', authenticate, mediaController.deleteMedia);

// Bulk Operations
router.post('/bulk', authenticate, mediaController.bulkAction);
router.post('/move', authenticate, (req, res, next) => { req.body.action = 'move'; next(); }, mediaController.bulkAction);
router.post('/archive', authenticate, (req, res, next) => { req.body.action = 'archive'; next(); }, mediaController.bulkAction);

// Legacy route aliases
router.put('/:id/rename', authenticate, mediaController.updateMedia);
router.delete('/:id/file', authenticate, mediaController.deleteMedia);

apiRegistry.register({
  name: 'MediaLibrary',
  prefix: '/api/media',
  router,
  public: false,
});

module.exports = router;
