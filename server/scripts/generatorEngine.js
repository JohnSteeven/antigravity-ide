"use strict";

const fs = require("fs");
const path = require("path");
const { buildCanonicalArticle, countWords } = require("../data/phase5Articles/articleBuilder");

const BANNED_PATTERNS = [
  /\blorem ipsum\b/i,
  /\bplaceholder\b/i,
  /\btbd\b/i,
  /\bcoming soon\b/i,
  /\btodo\b/i,
  /\bboundless grace\b/i,
  /\byou are whole\b/i,
  /\byou are enough\b/i,
  /\bfinal sanctuary\b/i,
  /\bfinal peace\b/i,
  /\bfinal arrival\b/i,
  /\bholy sanctuary\b/i,
  /\bsacred vessel\b/i,
];

const globalParagraphSet = new Set();

function normalizeText(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function verifyNoBanned(text, context) {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`[Quality Error] Banned pattern "${pattern}" detected in ${context}`);
    }
  }
}

function registerParagraph(text, articleSlug) {
  const norm = normalizeText(text);
  if (norm.length > 40) {
    if (globalParagraphSet.has(norm)) {
      throw new Error(`[Duplication Error] Duplicate paragraph detected in article "${articleSlug}": "${text.slice(0, 60)}..."`);
    }
    globalParagraphSet.add(norm);
  }
}

function assembleStructuredBlocks(sections, inlineImages = []) {
  const blocks = [];
  let blockOrder = 1;
  let imageIdx = 0;

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const s = sections[sIdx];

    // Heading
    if (s.heading) {
      blocks.push({
        type: "heading",
        headingLevel: 2,
        text: s.heading,
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // Insert inline image after section 2 and section 6 if available
    if ((sIdx === 2 || sIdx === 6 || sIdx === 10) && imageIdx < inlineImages.length) {
      const img = inlineImages[imageIdx++];
      blocks.push({
        type: "image",
        image: img.image,
        alt: img.alt,
        caption: img.caption,
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // Callout
    if (s.callout) {
      blocks.push({
        type: "callout",
        calloutType: s.callout.type || "note",
        text: s.callout.text,
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // Paragraphs
    if (Array.isArray(s.paragraphs)) {
      for (const p of s.paragraphs) {
        blocks.push({
          type: "paragraph",
          text: p,
          id: `block-${blockOrder}`,
          order: blockOrder++,
        });
      }
    }

    // Quote
    if (s.quote) {
      blocks.push({
        type: "quote",
        quote: s.quote.quote,
        attribution: s.quote.attribution || "",
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // List
    if (s.list && Array.isArray(s.list)) {
      blocks.push({
        type: "list",
        items: s.list,
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // Table
    if (s.table && s.table.headers && s.table.rows) {
      blocks.push({
        type: "table",
        tableHeaders: s.table.headers,
        tableRows: s.table.rows,
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }

    // Divider
    if (sIdx < sections.length - 1) {
      blocks.push({
        type: "divider",
        id: `block-${blockOrder}`,
        order: blockOrder++,
      });
    }
  }

  return blocks;
}

function writeCanonicalArticleModule(categoryDir, filename, config) {
  const dirPath = path.join(__dirname, "../data/phase5Articles", categoryDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Pre-validate quality
  verifyNoBanned(config.title, `${categoryDir}/${filename} title`);
  verifyNoBanned(config.excerpt, `${categoryDir}/${filename} excerpt`);

  for (const block of config.structuredBlocks) {
    if (block.text) {
      verifyNoBanned(block.text, `${categoryDir}/${filename} block`);
      if (block.type === "paragraph") {
        registerParagraph(block.text, config.slug);
      }
    }
    if (block.quote) verifyNoBanned(block.quote, `${categoryDir}/${filename} quote`);
  }

  const builtArticle = buildCanonicalArticle(config);

  const targetPath = path.join(dirPath, filename);
  const code = `"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = ${JSON.stringify(config, null, 2)};

module.exports = buildCanonicalArticle(articleConfig);
`;
  fs.writeFileSync(targetPath, code, "utf8");
  console.log(`[Generated] ${categoryDir}/${filename} (${builtArticle.wordCount} words, ${builtArticle.readingTime})`);
  return builtArticle;
}

function preloadExistingArticles(categories = ["life", "reflections", "lessons"], excludeSlug = null) {
  for (const cat of categories) {
    try {
      const articles = require(`../data/phase5Articles/${cat}`);
      for (const a of articles) {
        if (excludeSlug && a.slug === excludeSlug) continue;
        if (a && a.structuredBlocks) {
          for (const b of a.structuredBlocks) {
            if (b.type === "paragraph" && b.text) {
              registerParagraph(b.text, a.slug);
            }
          }
        }
      }
      console.log(`[Preloaded] ${cat} paragraphs registered (${globalParagraphSet.size} total in set).`);
    } catch(e) {
      console.warn(`Could not preload ${cat}: ${e.message}`);
    }
  }
}

module.exports = {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  verifyNoBanned,
  registerParagraph,
  globalParagraphSet,
  preloadExistingArticles,
};
