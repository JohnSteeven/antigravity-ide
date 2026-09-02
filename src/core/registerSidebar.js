/**
 * registerSidebar.js — CMS Sidebar Self-Registration Helper
 *
 * Usage:
 *   import { registerSidebar } from '../../core/registerSidebar';
 *
 *   registerSidebar({
 *     key:         "gallery",
 *     label:       "Gallery",
 *     icon:        FiImage,
 *     path:        "/cms/gallery",
 *     group:       "Plugins",       // groups sidebar items into sections
 *     order:       10,              // lower = higher in group
 *     permissions: ["gallery.read"],
 *     badge:       null,            // or { text: "New", color: "success" }
 *     children:    [],             // sub-items for nested navigation
 *   });
 *
 * Groups (convention):
 *   "Core"         — Dashboard, Profile
 *   "Content"      — Articles, Pages, Media, Categories
 *   "Experience"   — Builder, Layouts, Theme, Navigation
 *   "Operations"   — Features, Settings, Workflows
 *   "Plugins"      — Gallery, Testimonials, Timeline, Projects
 *   "System"       — Users, Roles, Permissions, Logs, Backups
 */
export { registerSidebar, getSidebar, getSidebarGroups } from './cmsCore.js';
