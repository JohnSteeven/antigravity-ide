/**
 * registerRoute.js — CMS Route Self-Registration Helper
 *
 * Usage (in a module's entry point):
 *   import { registerRoute } from '../../core/registerRoute';
 *
 *   registerRoute({
 *     path:        "/cms/gallery",
 *     component:   GalleryModule,
 *     auth:        true,
 *     permissions: ["gallery.read"],
 *     exact:       true,
 *   });
 */
export { registerRoute, getRoute, getRoutes } from './cmsCore.js';
