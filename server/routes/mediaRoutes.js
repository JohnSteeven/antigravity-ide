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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

const router = express.Router();
router.use(authenticate, requireAdmin);

const { multerFileFilter, validateFileBuffer } = require('../middleware/uploadValidation');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: multerFileFilter,
});

// Middleware helper to catch Multer file filter errors and return 400/415
const handleUpload = (singleField) => (req, res, next) => {
  upload.single(singleField)(req, res, (err) => {
    if (err) {
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        error: statusCode === 415 ? 'Unsupported Media Type' : 'Bad Request',
        message: err.message,
      });
    }
    next();
  });
};

// Folders CRUD
router.get('/folders', mediaController.getFolders);
router.post('/folders', mediaController.createFolder);
router.patch('/folders/:id', mediaController.updateFolder);
router.delete('/folders/:id', mediaController.deleteFolder);

// Asset Operations & Queries
router.get('/', mediaController.getMedia);
router.get('/usage/:id', mediaController.getAssetUsage);
router.get('/:id', mediaController.getMediaById);

router.post('/', handleUpload('file'), validateFileBuffer, mediaController.uploadMedia);
router.post('/upload', handleUpload('file'), validateFileBuffer, mediaController.uploadMedia);
router.post('/replace/:id', handleUpload('file'), validateFileBuffer, mediaController.replaceMedia);

router.patch('/:id', mediaController.updateMedia);
router.delete('/:id', mediaController.deleteMedia);

// Bulk Operations
router.post('/bulk', mediaController.bulkAction);
router.post('/move', (req, res, next) => { req.body.action = 'move'; next(); }, mediaController.bulkAction);
router.post('/archive', (req, res, next) => { req.body.action = 'archive'; next(); }, mediaController.bulkAction);

// Legacy route aliases
router.put('/:id/rename', mediaController.updateMedia);
router.delete('/:id/file', mediaController.deleteMedia);

apiRegistry.register({
  name: 'MediaLibrary',
  prefix: '/api/media',
  router,
  public: false,
});

module.exports = router;
