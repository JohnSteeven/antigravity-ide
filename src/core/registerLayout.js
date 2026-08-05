/**
 * registerLayout.js — Layout Self-Registration Helper
 *
 * Usage (inside any layout component file):
 *   import { registerLayout } from '../../core/registerLayout';
 *
 *   registerLayout({
 *     key:       "magazine",
 *     label:     "Magazine",
 *     icon:      "▤",
 *     component: MagazineLayout,
 *     thumbnail: "/assets/layouts/magazine.png",
 *     config:    { columns: 2, showSidebar: true },
 *   });
 */
export { registerLayout, getLayout, getLayouts, getLayoutList } from './cmsCore.js';
