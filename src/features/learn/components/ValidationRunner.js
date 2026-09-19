/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ValidationRunner.js — Client-Side Educational Exercise Validator Re-Export
 * ─────────────────────────────────────────────────────────────────────────────
 */

import runnerModule from "./ValidationRunner.cjs";

export const {
  validateHtmlExercise,
  validateCssExercise,
  validateJsExercise,
  validatePythonExercise,
  runExerciseValidation,
} = runnerModule;

export default runnerModule;

