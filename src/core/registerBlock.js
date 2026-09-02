/**
 * registerBlock.js — Block Self-Registration Helper
 *
 * Usage (inside any block component file):
 *   import { registerBlock } from '../../core/registerBlock';
 *
 *   registerBlock({
 *     type:          "hero",
 *     label:         "Hero Banner",
 *     icon:          FiStar,
 *     group:         "Content",
 *     component:     HeroBlock,
 *     defaultConfig: { title: "", subtitle: "", image: "", buttonText: "" },
 *     schema: [
 *       { name: "title",   type: "text",  label: "Title" },
 *       { name: "image",   type: "image", label: "Background Image" },
 *       { name: "buttonText", type: "text", label: "Button Text" },
 *     ],
 *   });
 */
export { registerBlock, getBlock, getBlocks, getBlockList } from './cmsCore.js';
