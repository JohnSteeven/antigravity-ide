/**
 * src/core/index.js — CMS Core Barrel Export
 *
 * Single import point for all CMS core APIs.
 * Import what you need:
 *
 *   import { registerLayout, registerBlock, eventBus } from '../core';
 *   import { registerSidebar, registerRoute }          from '../core';
 *   import { CMS_EVENTS }                              from '../core';
 */

// Central registration hub
export {
  // Layouts
  registerLayout,
  getLayout,
  getLayouts,
  getLayoutList,

  // Blocks
  registerBlock,
  getBlock,
  getBlocks,
  getBlockList,

  // Modules
  registerModule,
  getModule,
  getModules,

  // Routes
  registerRoute,
  getRoute,
  getRoutes,

  // Sidebar
  registerSidebar,
  getSidebar,
  getSidebarGroups,

  // Widgets
  registerWidget,
  getWidget,
  getWidgets,
  getWidgetList,

  // Settings
  registerSetting,
  getSetting,
  getSettings,
  getSettingList,

  // Templates
  registerTemplate,
  getTemplate,
  getTemplates,

  // Hooks
  registerHook,
  runHook,
  getHooks,

  // Plugins
  registerPlugin,
  getPlugin,
  getPlugins,
  isPluginEnabled,

  // Debug
  getCmsState,
  _resetForTests,
} from './cmsCore.js';

// Event bus
export { default as eventBus, CMS_EVENTS } from './eventBus.js';

// Convenience re-exports (named register functions for clarity)
export { registerLayout  as registerLayoutFn  } from './registerLayout.js';
export { registerBlock   as registerBlockFn   } from './registerBlock.js';
export { registerModule  as registerModuleFn  } from './registerModule.js';
export { registerRoute   as registerRouteFn   } from './registerRoute.js';
export { registerSidebar as registerSidebarFn } from './registerSidebar.js';
export { registerWidget  as registerWidgetFn  } from './registerWidget.js';
export { registerSetting as registerSettingFn } from './registerSetting.js';
export { registerHook    as registerHookFn    } from './registerHook.js';
