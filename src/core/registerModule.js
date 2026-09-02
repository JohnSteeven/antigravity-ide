/**
 * registerModule.js — CMS Module Self-Registration Helper
 *
 * Usage (in a module's entry point):
 *   import { registerModule } from '../../core/registerModule';
 *
 *   registerModule({
 *     key:          "gallery",
 *     label:        "Gallery",
 *     version:      "1.0.0",
 *     description:  "Photo gallery management",
 *     component:    GalleryModule,
 *     permissions:  ["gallery.read", "gallery.write"],
 *     dependencies: ["media"],
 *     manifest:     require('./manifest.json'),
 *   });
 */
export { registerModule, getModule, getModules } from './cmsCore.js';
