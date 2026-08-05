/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pluginSDK.js  —  Universal Frontend Plugin SDK
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { registerRoute } from './registerRoute';
import { registerSidebar } from './registerSidebar';
import { registerWidget } from './registerWidget';
import { registerBlock } from './registerBlock';
import { registerSetting } from './registerSetting';
import { registerHook } from './registerHook';
import { cmsCore } from './cmsCore';

export const PluginSDK = {
  /**
   * Register a self-contained frontend plugin
   */
  registerPlugin(pluginManifest) {
    if (!pluginManifest || !pluginManifest.id) {
      console.warn('[PluginSDK] Invalid plugin manifest registered.');
      return;
    }
    cmsCore.registerModule(pluginManifest);
    console.info(`[PluginSDK] Extension plugin '${pluginManifest.name}' successfully registered.`);
  },

  registerRoute,
  registerSidebar,
  registerWidget,
  registerBlock,
  registerSetting,
  registerHook,
};

export default PluginSDK;
