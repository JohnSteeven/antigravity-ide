/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  cmsCore.js  —  CMS Extension API / Central Registration Hub
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The single source of truth for all CMS registrations.
 *
 *  Instead of editing registry files, every module self-registers:
 *    registerLayout({ key: "magazine", component: MagazineLayout })
 *    registerBlock({ type: "hero", component: HeroBlock, meta })
 *    registerSidebar({ key: "gallery", label: "Gallery", path: "/cms/gallery" })
 *
 *  Plugins drop into plugins/ and call the same API.
 *  The CMS core never needs to know about them in advance.
 *
 *  Pattern: Map-based registries (fast O(1) lookup by key/type)
 *  Zero dependencies — can be imported anywhere safely.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Internal Registries ───────────────────────────────────────────────────────

const _layouts    = new Map(); // key  → { key, label, icon, component, thumbnail, config }
const _blocks     = new Map(); // type → { type, label, icon, component, schema, defaultConfig }
const _modules    = new Map(); // key  → { key, label, component, manifest }
const _routes     = new Map(); // path → { path, component, auth, permissions[] }
const _sidebar    = [];        // ordered array of sidebar item configs
const _widgets    = new Map(); // key  → { key, label, component, size }
const _settings   = new Map(); // key  → { key, label, group, component }
const _hooks      = new Map(); // name → handler[]
const _templates  = new Map(); // key  → { key, label, component }
const _plugins    = new Map(); // key  → plugin manifest

// ── Layout Registry ───────────────────────────────────────────────────────────

export function registerLayout(config) {
  if (!config.key) throw new Error('[CMS] registerLayout: "key" is required');
  if (!config.component) throw new Error('[CMS] registerLayout: "component" is required');
  if (_layouts.has(config.key)) {
    console.warn(`[CMS] Layout "${config.key}" is already registered — overwriting.`);
  }
  _layouts.set(config.key, {
    label:     config.label || config.key,
    icon:      config.icon  || '⊞',
    thumbnail: config.thumbnail || null,
    config:    config.config    || {},
    isBuiltIn: config.isBuiltIn ?? true,
    sortOrder: config.sortOrder ?? 99,
    ...config,
  });
}

export function getLayout(key)   { return _layouts.get(key); }
export function getLayouts()     { return Object.fromEntries(_layouts); }
export function getLayoutList()  {
  return [..._layouts.values()].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
}

// ── Block / Component Registry ────────────────────────────────────────────────

export function registerBlock(config) {
  if (!config.type) throw new Error('[CMS] registerBlock: "type" is required');
  if (!config.component) throw new Error('[CMS] registerBlock: "component" is required');
  if (_blocks.has(config.type)) {
    console.warn(`[CMS] Block "${config.type}" is already registered — overwriting.`);
  }
  _blocks.set(config.type, {
    label:         config.label         || config.type,
    icon:          config.icon          || null,
    defaultConfig: config.defaultConfig || {},
    schema:        config.schema        || [],
    isBuiltIn:     config.isBuiltIn     ?? true,
    group:         config.group         || 'Content',
    ...config,
  });
}

export function getBlock(type)  { return _blocks.get(type); }
export function getBlocks()     { return Object.fromEntries(_blocks); }
export function getBlockList()  { return [..._blocks.values()]; }

// ── Module Registry ───────────────────────────────────────────────────────────

export function registerModule(config) {
  if (!config.key) throw new Error('[CMS] registerModule: "key" is required');
  _modules.set(config.key, {
    label:       config.label       || config.key,
    version:     config.version     || '1.0.0',
    description: config.description || '',
    permissions: config.permissions || [],
    dependencies:config.dependencies|| [],
    ...config,
  });
}

export function getModule(key) { return _modules.get(key); }
export function getModules()   { return Object.fromEntries(_modules); }

// ── Route Registry ────────────────────────────────────────────────────────────

export function registerRoute(config) {
  if (!config.path) throw new Error('[CMS] registerRoute: "path" is required');
  if (!config.component) throw new Error('[CMS] registerRoute: "component" is required');
  _routes.set(config.path, {
    auth:        config.auth        ?? true,
    permissions: config.permissions || [],
    exact:       config.exact       ?? true,
    ...config,
  });
}

export function getRoute(path) { return _routes.get(path); }
export function getRoutes()    { return [..._routes.values()]; }

// ── Sidebar Registry ──────────────────────────────────────────────────────────

export function registerSidebar(config) {
  if (!config.key)  throw new Error('[CMS] registerSidebar: "key" is required');
  if (!config.path) throw new Error('[CMS] registerSidebar: "path" is required');

  // Deduplicate by key
  const existingIndex = _sidebar.findIndex(s => s.key === config.key);
  const item = {
    label:       config.label       || config.key,
    icon:        config.icon        || null,
    group:       config.group       || 'Other',
    order:       config.order       ?? 99,
    permissions: config.permissions || [],
    badge:       config.badge       || null,
    children:    config.children    || [],
    ...config,
  };

  if (existingIndex >= 0) {
    _sidebar[existingIndex] = item;
  } else {
    _sidebar.push(item);
  }
}

export function getSidebar(group = null) {
  const sorted = [..._sidebar].sort((a, b) => (a.order || 99) - (b.order || 99));
  if (!group) return sorted;
  return sorted.filter(s => s.group === group);
}

export function getSidebarGroups() {
  const groups = [...new Set(_sidebar.map(s => s.group || 'Other'))];
  return groups;
}

// ── Widget Registry ───────────────────────────────────────────────────────────

export function registerWidget(config) {
  if (!config.key) throw new Error('[CMS] registerWidget: "key" is required');
  _widgets.set(config.key, {
    label:       config.label || config.key,
    size:        config.size  || 'half',   // full | half | quarter
    order:       config.order ?? 99,
    permissions: config.permissions || [],
    defaultVisible: config.defaultVisible ?? true,
    ...config,
  });
}

export function getWidget(key) { return _widgets.get(key); }
export function getWidgets()   { return Object.fromEntries(_widgets); }
export function getWidgetList(){ return [..._widgets.values()].sort((a,b) => (a.order||99)-(b.order||99)); }

// ── Settings Registry ─────────────────────────────────────────────────────────

export function registerSetting(config) {
  if (!config.key) throw new Error('[CMS] registerSetting: "key" is required');
  _settings.set(config.key, {
    label:       config.label || config.key,
    group:       config.group || 'Other',
    order:       config.order ?? 99,
    icon:        config.icon  || null,
    description: config.description || '',
    ...config,
  });
}

export function getSetting(key)  { return _settings.get(key); }
export function getSettings()    { return Object.fromEntries(_settings); }
export function getSettingList() { return [..._settings.values()].sort((a,b) => (a.order||99)-(b.order||99)); }

// ── Template Registry ─────────────────────────────────────────────────────────

export function registerTemplate(config) {
  if (!config.key) throw new Error('[CMS] registerTemplate: "key" is required');
  _templates.set(config.key, {
    label:     config.label     || config.key,
    thumbnail: config.thumbnail || null,
    ...config,
  });
}

export function getTemplate(key) { return _templates.get(key); }
export function getTemplates()   { return Object.fromEntries(_templates); }

// ── Hook Registry (Lifecycle Hooks) ───────────────────────────────────────────

export function registerHook(name, handler) {
  if (!name)    throw new Error('[CMS] registerHook: "name" is required');
  if (typeof handler !== 'function') throw new Error('[CMS] registerHook: handler must be a function');

  if (!_hooks.has(name)) _hooks.set(name, []);
  _hooks.get(name).push(handler);
}

export async function runHook(name, context = {}) {
  const handlers = _hooks.get(name) || [];
  let ctx = { ...context };
  for (const handler of handlers) {
    const result = await handler(ctx);
    if (result !== undefined) ctx = { ...ctx, ...result };
  }
  return ctx;
}

export function getHooks(name) { return _hooks.get(name) || []; }

// ── Plugin Registry ───────────────────────────────────────────────────────────

export function registerPlugin(manifest) {
  if (!manifest.key) throw new Error('[CMS] registerPlugin: manifest.key is required');
  _plugins.set(manifest.key, {
    version:     manifest.version     || '1.0.0',
    description: manifest.description || '',
    author:      manifest.author      || 'Unknown',
    enabled:     manifest.enabled     ?? true,
    ...manifest,
  });
  console.info(`[CMS] Plugin registered: ${manifest.name || manifest.key} v${manifest.version || '1.0.0'}`);
}

export function getPlugin(key)  { return _plugins.get(key); }
export function getPlugins()    { return Object.fromEntries(_plugins); }
export function isPluginEnabled(key) { return _plugins.get(key)?.enabled ?? false; }

// ── CMS Core State Dump (for debugging) ──────────────────────────────────────

export function getCmsState() {
  return {
    layouts:   _layouts.size,
    blocks:    _blocks.size,
    modules:   _modules.size,
    routes:    _routes.size,
    sidebar:   _sidebar.length,
    widgets:   _widgets.size,
    settings:  _settings.size,
    templates: _templates.size,
    hooks:     _hooks.size,
    plugins:   _plugins.size,
  };
}

// ── Reset (for testing only) ──────────────────────────────────────────────────

export function _resetForTests() {
  _layouts.clear(); _blocks.clear(); _modules.clear(); _routes.clear();
  _sidebar.length = 0; _widgets.clear(); _settings.clear();
  _hooks.clear(); _templates.clear(); _plugins.clear();
}
