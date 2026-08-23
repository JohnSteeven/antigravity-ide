const express = require('express');
const request = require('supertest');

jest.mock('../core/apiRegistry', () => ({ register: jest.fn() }));

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    const role = req.get('x-test-role');
    if (!role) return res.status(401).json({ message: 'Authentication required.' });
    req.user = { id: `${role.toLowerCase()}-1`, role };
    return next();
  },
  optionalAuthenticate: (req, res, next) => {
    const role = req.get('x-test-role');
    if (role) req.user = { id: `${role.toLowerCase()}-1`, role };
    next();
  },
}));

const mockOk = (req, res) => res.json({ ok: true });

jest.mock('../controllers/settingRegistryController', () => ({
  getAllSettings: mockOk,
  exportSettings: mockOk,
  importSettings: mockOk,
  registerDefinition: mockOk,
  getSettingByKey: mockOk,
  updateSetting: mockOk,
  getRevisions: mockOk,
  rollbackRevision: mockOk,
}));

jest.mock('../controllers/contentModelingController', () => ({
  getContentTypes: mockOk,
  getContentTypeById: mockOk,
  createContentType: mockOk,
  updateContentType: mockOk,
  deleteContentType: mockOk,
  getEntries: mockOk,
  createEntry: mockOk,
  deleteEntry: mockOk,
}));

jest.mock('../controllers/themeController', () => ({
  getThemes: mockOk,
  getActiveTheme: mockOk,
  getThemeById: mockOk,
  createTheme: mockOk,
  updateTheme: mockOk,
  deleteTheme: mockOk,
  publishTheme: mockOk,
}));

jest.mock('../controllers/featureFlagController', () => ({
  getAllFeatures: mockOk,
  getFeatureByKey: mockOk,
  createFeature: mockOk,
  updateFeature: mockOk,
  deleteFeature: mockOk,
  toggleFeature: mockOk,
  updateRollout: mockOk,
}));

jest.mock('../controllers/aiController', () => new Proxy({}, {
  get: () => mockOk,
}));

jest.mock('../controllers/readerController', () => ({
  getPersonalizedFeed: mockOk,
  updateProgress: mockOk,
  getContinueReading: mockOk,
  getLearningPaths: mockOk,
  getProfile: mockOk,
  updateProfile: mockOk,
  getCollections: mockOk,
  createCollection: mockOk,
  addToCollection: mockOk,
}));

const app = express();
app.use(express.json());
app.use('/api/settings-registry', require('../routes/settingRegistryRoutes'));
app.use('/api/content-modeling', require('../routes/contentModelingRoutes'));
app.use('/api/themes', require('../routes/themeRoutes'));
app.use('/api/features', require('../routes/featureFlagRoutes'));
app.use('/api/ai', require('../routes/aiRoutes'));
app.use('/api/reader', require('../routes/readerRoutes'));

const expectAdminBoundary = async (makeRequest) => {
  expect((await makeRequest()).status).toBe(401);
  expect((await makeRequest().set('x-test-role', 'Reader')).status).toBe(403);
  expect((await makeRequest().set('x-test-role', 'Admin')).status).toBe(200);
};

describe('server-authoritative authorization boundaries', () => {
  test('settings registry reads are Admin-only', async () => {
    await expectAdminBoundary(() => request(app).get('/api/settings-registry'));
  });

  test('content modeling reads are Admin-only', async () => {
    await expectAdminBoundary(() => request(app).get('/api/content-modeling/types'));
  });

  test('only the active theme contract is public', async () => {
    expect((await request(app).get('/api/themes/active')).status).toBe(200);
    await expectAdminBoundary(() => request(app).get('/api/themes'));
  });

  test('feature evaluation is public but management detail is Admin-only', async () => {
    expect((await request(app).get('/api/features')).status).toBe(200);
    await expectAdminBoundary(() => request(app).get('/api/features/homepage'));
  });

  test('legacy AI completions are Admin-only while availability is public', async () => {
    expect((await request(app).get('/api/ai/status')).status).toBe(200);
    await expectAdminBoundary(() => request(app).post('/api/ai/chat').send({ query: 'hello' }));
  });

  test('reader progress is user-owned while generic discovery stays public', async () => {
    expect((await request(app).get('/api/reader/feed')).status).toBe(200);
    expect((await request(app).get('/api/reader/learning-paths')).status).toBe(200);
    expect((await request(app).post('/api/reader/progress')).status).toBe(401);
    expect((await request(app).post('/api/reader/progress').set('x-test-role', 'Reader')).status).toBe(200);
    expect((await request(app).get('/api/reader/continue-reading')).status).toBe(401);
  });
});
