const fs = require('fs');
const path = require('path');

const readRoute = (name) => fs.readFileSync(path.join(__dirname, '..', 'routes', name), 'utf8');

describe('CMS route policy contracts', () => {
  test.each([
    'automationRoutes.js',
    'componentRoutes.js',
    'contentModelingRoutes.js',
    'dashboardRoutes.js',
    'layoutRoutes.js',
    'mediaRoutes.js',
    'pluginRoutes.js',
    'settingRegistryRoutes.js',
    'versionControlRoutes.js',
    'workflowRoutes.js',
  ])('%s applies the shared Admin boundary', (routeFile) => {
    const source = readRoute(routeFile);
    expect(source).toContain("require('../middleware/admin')");
    expect(source).toContain('router.use(authenticate, requireAdmin)');
  });

  test.each([
    'componentRoutes.js',
    'contentModelingRoutes.js',
    'dashboardRoutes.js',
    'layoutRoutes.js',
    'pluginRoutes.js',
    'settingRegistryRoutes.js',
    'versionControlRoutes.js',
    'workflowRoutes.js',
  ])('%s is not registered as a public API', (routeFile) => {
    expect(readRoute(routeFile)).toContain('public: false');
  });

  test('Creator Studio remains separate from Admin authorization', () => {
    const source = readRoute('creatorStudioRoutes.js');
    expect(source).toContain('router.use(authenticate, requireActiveCreator)');
    expect(source).not.toContain('requireAdmin');
  });

  test('Life routes remain behind authentication and account Premium policy', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
    expect(source).toContain('app.use("/api/life", authenticate, lifeAccessPolicy, lifeRoutes)');
    expect(source).toContain('requireEntitlement(ENTITLEMENTS.LIFE_ACCESS)');
  });
});
