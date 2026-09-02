/**
 * Retired unsafe compatibility entry point.
 *
 * Administrator bootstrap is available only through the opt-in, non-destructive
 * BOOTSTRAP_ADMIN_* flow in server/config/seeder.js.
 */

'use strict';

console.error(
  'This legacy admin script is disabled. Set BOOTSTRAP_ADMIN_ENABLED=true with ' +
  'BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, then start the API once.'
);
process.exitCode = 1;
