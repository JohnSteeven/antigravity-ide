/**
 * Phase 6 Canonical Coding Curricula Index
 * Exports the 4 foundational tracks:
 * 1. HTML Foundations (12 lessons, FREE)
 * 2. CSS Foundations (13 lessons, FREE)
 * 3. JavaScript Foundations (15 lessons, PREMIUM_INCLUDED)
 * 4. Python Foundations (15 lessons, PREMIUM_INCLUDED)
 */

const htmlFoundations = require('./htmlFoundations');
const cssFoundations = require('./cssFoundations');
const javascriptFoundations = require('./javascriptFoundations');
const pythonFoundations = require('./pythonFoundations');

const canonicalCourses = [
  htmlFoundations,
  cssFoundations,
  javascriptFoundations,
  pythonFoundations
];

module.exports = {
  htmlFoundations,
  cssFoundations,
  javascriptFoundations,
  pythonFoundations,
  canonicalCourses
};

