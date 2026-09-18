"use strict";

const fs = require("fs");
const path = require("path");
const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles();

const lessonsDir = path.join(__dirname, "../data/phase5Articles/lessons");
if (!fs.existsSync(lessonsDir)) {
  fs.mkdirSync(lessonsDir, { recursive: true });
}

console.log("Starting generation of 10 Canonical Lessons...");
