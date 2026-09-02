/**
 * Retired unsafe compatibility entry point.
 *
 * Password resets must use the authenticated password-change or tokenized
 * forgot-password flow. This script never connects to MongoDB or changes a user.
 */

'use strict';

console.error(
  'This legacy password-reset script is disabled. Use the application password ' +
  'recovery flow or an approved, audited operator procedure.'
);
process.exitCode = 1;
