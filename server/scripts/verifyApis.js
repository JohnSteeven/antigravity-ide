/**
 * Retired verification script.
 *
 * It previously embedded an administrator password and printed session material.
 * Use npm test, npm run doctor, and the documented authenticated API test suite.
 */

'use strict';

console.error(
  'This legacy API verifier is disabled because it cannot safely handle operator ' +
  'credentials. Use npm test and npm run doctor.'
);
process.exitCode = 1;
