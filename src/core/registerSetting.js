/**
 * registerSetting.js — Settings Panel Self-Registration Helper
 *
 * Usage:
 *   import { registerSetting } from '../../core/registerSetting';
 *
 *   registerSetting({
 *     key:         "seo",
 *     label:       "SEO",
 *     group:       "Core",
 *     icon:        FiSearch,
 *     description: "Search engine optimization settings",
 *     component:   SeoSettingsForm,
 *     order:       2,
 *   });
 *
 * Built-in setting groups (convention):
 *   "Core"        — General, SEO, Security, Email
 *   "Experience"  — Theme, Typography, Animations
 *   "Marketing"   — Social, Analytics, Newsletter
 *   "Operations"  — Performance, Search, Queue, Cache, Storage
 *   "Media"       — Upload limits, formats, CDN
 */
export { registerSetting, getSetting, getSettings, getSettingList } from './cmsCore.js';
