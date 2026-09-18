"use strict";

/**
 * articleBuilder.js
 * Utility to construct canonical Phase 5 articles with strict schema compliance,
 * structured block compilation, accurate word count and reading time calculation.
 */

const { EDITORIAL_BYLINE } = require("../../config/constants");

function countWords(str) {
  if (!str || typeof str !== "string") return 0;
  // Strip HTML tags
  const plain = str.replace(/<[^>]+>/g, " ");
  // Match word characters / sequences
  const matches = plain.trim().match(/[\w'-]+/g);
  return matches ? matches.length : 0;
}

function compileBlockToHtml(block) {
  switch (block.type) {
    case "heading": {
      const level = block.headingLevel || 2;
      return `<h${level}>${block.text}</h${level}>`;
    }
    case "paragraph": {
      return `<p>${block.text}</p>`;
    }
    case "quote": {
      const cite = block.attribution ? ` <cite>— ${block.attribution}</cite>` : "";
      return `<blockquote><p>${block.quote}</p>${cite}</blockquote>`;
    }
    case "callout": {
      const type = block.calloutType || "note";
      return `<div class="editorial-callout editorial-callout--${type}"><p>${block.text}</p></div>`;
    }
    case "list": {
      const items = (block.items || []).map((item) => `<li>${item}</li>`).join("");
      return `<ul>${items}</ul>`;
    }
    case "table": {
      const headers = (block.tableHeaders || []).map((h) => `<th>${h}</th>`).join("");
      const rows = (block.tableRows || [])
        .map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
        .join("");
      return `<div class="editorial-table-wrapper"><table class="editorial-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    case "divider": {
      return `<hr class="editorial-divider" />`;
    }
    case "image": {
      const captionHtml = block.caption ? `<figcaption>${block.caption}</figcaption>` : "";
      return `<figure class="editorial-inline-figure"><img src="${block.image}" alt="${block.alt || ""}" loading="lazy" />${captionHtml}</figure>`;
    }
    case "code": {
      const lang = block.language || "text";
      return `<pre><code class="language-${lang}">${block.code}</code></pre>`;
    }
    default:
      return "";
  }
}

function compileBlocksToBody(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks.map(compileBlockToHtml).filter(Boolean).join("\n\n");
}

function calculateBlocksWordCount(blocks) {
  if (!Array.isArray(blocks)) return 0;
  let words = 0;
  for (const b of blocks) {
    if (b.text) words += countWords(b.text);
    if (b.quote) words += countWords(b.quote);
    if (b.items && Array.isArray(b.items)) {
      b.items.forEach((item) => {
        words += countWords(item);
      });
    }
    if (b.tableRows && Array.isArray(b.tableRows)) {
      b.tableRows.forEach((row) => {
        row.forEach((cell) => {
          words += countWords(cell);
        });
      });
    }
    if (b.caption) words += countWords(b.caption);
  }
  return words;
}

function buildCanonicalArticle(config) {
  const {
    title,
    slug,
    category,
    excerpt,
    coverImage,
    coverImageAlt = "",
    coverImageCaption = "",
    tags = [],
    structuredBlocks = [],
    references = [],
    sources = [],
    relatedArticleSlugs = [],
    accessLevel = "free",
    status = "published",
    publishedAt = new Date("2025-01-15T08:00:00.000Z"),
    editorialProvenance,
    travelVerification,
  } = config;

  // Order structured blocks
  const normalizedBlocks = structuredBlocks.map((block, idx) => ({
    ...block,
    id: block.id || `block-${idx + 1}`,
    order: idx + 1,
  }));

  const body = compileBlocksToBody(normalizedBlocks);
  const wordCount = calculateBlocksWordCount(normalizedBlocks);
  const readingTimeMin = Math.max(1, Math.round(wordCount / 200));
  const readingTime = `${readingTimeMin} min read`;
  const categorySlug = category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

  return {
    title,
    slug,
    category,
    categorySlug,
    contentType: "article",
    author: EDITORIAL_BYLINE,
    byline: EDITORIAL_BYLINE,
    excerpt,
    description: excerpt,
    coverImage,
    coverImageAlt,
    coverImageCaption,
    structuredBlocks: normalizedBlocks,
    body,
    wordCount,
    readingTimeMin,
    readingTime,
    status,
    isArchived: false,
    accessLevel,
    tags,
    references,
    sources,
    relatedArticleSlugs,
    publishedAt,
    ...(editorialProvenance ? { editorialProvenance } : {}),
    ...(travelVerification ? { travelVerification } : {}),
    seo: {
      title: `${title} | MyJourney`,
      description: excerpt,
      keywords: tags,
    },
  };
}

module.exports = {
  countWords,
  compileBlockToHtml,
  compileBlocksToBody,
  calculateBlocksWordCount,
  buildCanonicalArticle,
};
