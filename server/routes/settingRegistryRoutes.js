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
const apiRegistry = require('../core/apiRegistry');

// Public read (for theme / public site tokens)
router.get('/', settingRegistryController.getAllSettings);
router.get('/export', authenticate, settingRegistryController.exportSettings);
router.post('/import', authenticate, settingRegistryController.importSettings);
router.post('/register', authenticate, settingRegistryController.registerDefinition);

router.get('/:key', settingRegistryController.getSettingByKey);
router.put('/:key', authenticate, settingRegistryController.updateSetting);
router.get('/:key/revisions', authenticate, settingRegistryController.getRevisions);
router.post('/:key/rollback/:revisionId', authenticate, settingRegistryController.rollbackRevision);

apiRegistry.register({
  name: 'SettingsRegistry',
  prefix: '/api/settings-registry',
  router,
  public: true,
});

module.exports = router;
