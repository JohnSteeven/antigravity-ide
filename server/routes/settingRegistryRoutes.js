/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingRegistryRoutes.js  —  Settings Registry API Routes
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const settingRegistryController = require('../controllers/settingRegistryController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// System settings can contain operational metadata and masked secret fields.
// Public theme delivery is handled by /api/themes/active instead.
router.use(authenticate, requireAdmin);
router.get('/', settingRegistryController.getAllSettings);
router.get('/export', settingRegistryController.exportSettings);
router.post('/import', settingRegistryController.importSettings);
router.post('/register', settingRegistryController.registerDefinition);

router.get('/:key', settingRegistryController.getSettingByKey);
router.put('/:key', settingRegistryController.updateSetting);
router.get('/:key/revisions', settingRegistryController.getRevisions);
router.post('/:key/rollback/:revisionId', settingRegistryController.rollbackRevision);

apiRegistry.register({
  name: 'SettingsRegistry',
  prefix: '/api/settings-registry',
  router,
  public: false,
});

module.exports = router;
