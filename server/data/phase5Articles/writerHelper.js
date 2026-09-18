"use strict";

const fs = require("fs");
const path = require("path");

// Helper to write article file with code formatting
function writeArticleModule(categoryDir, filename, config) {
  const dirPath = path.join(__dirname, categoryDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const targetPath = path.join(dirPath, filename);
  const code = `"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = ${JSON.stringify(config, null, 2)};

module.exports = buildCanonicalArticle(articleConfig);
`;
  fs.writeFileSync(targetPath, code, "utf8");
  console.log(`[Batch 2A] Written: ${categoryDir}/${filename}`);
}

module.exports = { writeArticleModule };
