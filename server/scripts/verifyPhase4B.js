/**
 * Retired credential-bearing integration verifier.
 *
 * Use the Jest API suites or a purpose-built operator test that acquires secrets
 * from an approved secret manager and never prints tokens, cookies, or user data.
 */

'use strict';

console.error(
  'This legacy verifier is disabled because it embedded administrator credentials. ' +
  'Use the authenticated Jest API suites.'
);
process.exitCode = 1;
