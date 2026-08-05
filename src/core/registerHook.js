/**
 * registerHook.js — Lifecycle Hook Registration Helper
 *
 * Lifecycle hooks let modules react to CMS events without coupling.
 *
 * Available hook names (convention):
 *   beforeCreate   afterCreate
 *   beforeUpdate   afterUpdate
 *   beforeDelete   afterDelete
 *   beforePublish  afterPublish
 *   beforeUpload   afterUpload
 *   beforeLogin    afterLogin
 *
 * Usage:
 *   import { registerHook } from '../../core/registerHook';
 *
 *   // Newsletter reacts when an article is published:
 *   registerHook('afterPublish:article', async ({ articleId, title, slug }) => {
 *     await newsletterService.notifySubscribers({ articleId, title, slug });
 *   });
 *
 *   // Search indexes new content:
 *   registerHook('afterCreate:article', async ({ article }) => {
 *     await searchService.index('article', article);
 *   });
 *
 *   // Sitemap updates after any publish:
 *   registerHook('afterPublish:*', async ({ entity, id, slug }) => {
 *     await sitemapService.update(entity, slug);
 *   });
 *
 * Hook execution:
 *   await runHook('afterPublish:article', { articleId, title, slug });
 *   // → all registered handlers run in order
 *   // → each can modify the context object
 *   // → failures are caught and logged (do not break the main flow)
 */
export { registerHook, runHook, getHooks } from './cmsCore.js';
