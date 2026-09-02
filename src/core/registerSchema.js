/**
 * registerSchema.js — Content Schema Registration Helper
 *
 * Usage:
 *   import { registerSchema } from '../../core/registerSchema';
 *
 *   registerSchema({
 *     key: 'books',
 *     name: 'Books',
 *     fields: [ ... ],
 *   });
 */
export { registerSchema, getSchema, getSchemas } from './cmsCore.js';
