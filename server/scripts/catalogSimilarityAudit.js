"use strict";

/**
 * catalogSimilarityAudit.js
 *
 * Full Similarity & Boilerplate Audit across the 74 canonical Phase 5 articles.
 */

const { canonicalArticles } = require("../data/phase5Articles");

const BANNED_PATTERNS = [
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\btestament to\b/i,
  /\bbustling\b/i,
  /\bvibrant\b/i,
  /\bpicturesque\b/i,
  /\bhaven\b/i,
  /\boasis\b/i,
  /\bplethora\b/i,
  /\bbeacon of\b/i,
  /\bjourney into the heart of\b/i,
  /\bnestled\b/i,
  /\bseamlessly\b/i,
  /\brealm of\b/i,
  /\bembark on a journey\b/i,
  /\bin conclusion\b/i,
  /\bit goes without saying\b/i,
  /\bneedless to say\b/i,
];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function getNGrams(words, n = 6) {
  const ngrams = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

function runAudit() {
  console.log(`[Audit] Auditing ${canonicalArticles.length} canonical articles...`);

  // 1. Paragraph maps
  const exactParagraphMap = new Map();
  const normalizedParagraphMap = new Map();
  const exactDuplicates = [];
  const normalizedDuplicates = [];

  // 4. Headings map
  const headingMap = new Map();
  const repeatedHeadings = [];

  // 5 & 6. Intros & Conclusions
  const intros = [];
  const conclusions = [];

  // 7. Boilerplate phrases
  const BOILERPLATE_PHRASES = [
    "whether you are",
    "it is important to remember",
    "at the end of the day",
    "in today's fast-paced world",
    "in modern society",
    "takes your breath away",
    "a sight to behold",
    "something for everyone",
  ];
  const boilerplateFindings = {};
  for (const p of BOILERPLATE_PHRASES) boilerplateFindings[p] = [];

  // 8. Lists and Tables
  const listItemsMap = new Map();
  const repeatedListItems = [];
  const tableRowsMap = new Map();
  const repeatedTableRows = [];

  // 9. Banned pattern findings
  const bannedFindings = [];

  // Article n-grams for pairwise similarity
  const articleNGrams = [];

  for (const article of canonicalArticles) {
    const blocks = article.structuredBlocks || [];
    const paragraphs = [];

    for (const b of blocks) {
      // Banned patterns check
      if (b.text) {
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(b.text)) {
            bannedFindings.push({
              slug: article.slug,
              pattern: pattern.toString(),
              snippet: b.text.slice(0, 100) + "...",
            });
          }
        }
        for (const bp of BOILERPLATE_PHRASES) {
          if (b.text.toLowerCase().includes(bp)) {
            boilerplateFindings[bp].push({
              slug: article.slug,
              snippet: b.text.slice(0, 80) + "...",
            });
          }
        }
      }

      if (b.type === "paragraph" && b.text) {
        paragraphs.push(b.text);
        const exact = b.text.trim();
        const norm = normalize(b.text);

        // Exact duplicates
        if (exactParagraphMap.has(exact)) {
          const prior = exactParagraphMap.get(exact);
          if (prior !== article.slug) {
            exactDuplicates.push({ text: exact.slice(0, 80), article1: prior, article2: article.slug });
          }
        } else {
          exactParagraphMap.set(exact, article.slug);
        }

        // Normalized duplicates (> 40 chars)
        if (norm.length > 40) {
          if (normalizedParagraphMap.has(norm)) {
            const prior = normalizedParagraphMap.get(norm);
            if (prior !== article.slug) {
              normalizedDuplicates.push({ text: norm.slice(0, 80), article1: prior, article2: article.slug });
            }
          } else {
            normalizedParagraphMap.set(norm, article.slug);
          }
        }
      }

      if (b.type === "heading" && b.text) {
        const normH = normalize(b.text);
        if (normH.length > 10) {
          if (headingMap.has(normH)) {
            headingMap.get(normH).push(article.slug);
          } else {
            headingMap.set(normH, [article.slug]);
          }
        }
      }

      if (b.type === "list" && Array.isArray(b.items)) {
        for (const item of b.items) {
          const normI = normalize(item);
          if (normI.length > 30) {
            if (listItemsMap.has(normI)) {
              const prior = listItemsMap.get(normI);
              if (prior !== article.slug) {
                repeatedListItems.push({ item: normI.slice(0, 60), article1: prior, article2: article.slug });
              }
            } else {
              listItemsMap.set(normI, article.slug);
            }
          }
        }
      }

      if (b.type === "table" && Array.isArray(b.tableRows)) {
        for (const row of b.tableRows) {
          const rowKey = normalize(row.join(" | "));
          if (rowKey.length > 30) {
            if (tableRowsMap.has(rowKey)) {
              const prior = tableRowsMap.get(rowKey);
              if (prior !== article.slug) {
                repeatedTableRows.push({ row: rowKey.slice(0, 60), article1: prior, article2: article.slug });
              }
            } else {
              tableRowsMap.set(rowKey, article.slug);
            }
          }
        }
      }
    }

    if (paragraphs.length > 0) {
      intros.push({ slug: article.slug, text: paragraphs[0] });
      conclusions.push({ slug: article.slug, text: paragraphs[paragraphs.length - 1] });
    }

    const allWords = paragraphs.join(" ").toLowerCase().split(/\s+/);
    articleNGrams.push({ slug: article.slug, ngrams: getNGrams(allWords, 6) });
  }

  // Check repeated headings
  for (const [heading, slugs] of headingMap.entries()) {
    if (slugs.length > 1) {
      repeatedHeadings.push({ heading, count: slugs.length, slugs });
    }
  }

  // Check 3. Suspicious n-gram similarity across article pairs
  const highSimilarityPairs = [];
  for (let i = 0; i < articleNGrams.length; i++) {
    for (let j = i + 1; j < articleNGrams.length; j++) {
      const sim = jaccardSimilarity(articleNGrams[i].ngrams, articleNGrams[j].ngrams);
      if (sim > 0.15) {
        highSimilarityPairs.push({
          article1: articleNGrams[i].slug,
          article2: articleNGrams[j].slug,
          similarity: (sim * 100).toFixed(2) + "%",
        });
      }
    }
  }

  // Check intro similarity
  const introPairs = [];
  for (let i = 0; i < intros.length; i++) {
    const wordsI = intros[i].text.toLowerCase().split(/\s+/);
    const ngI = getNGrams(wordsI, 4);
    for (let j = i + 1; j < intros.length; j++) {
      const wordsJ = intros[j].text.toLowerCase().split(/\s+/);
      const ngJ = getNGrams(wordsJ, 4);
      const sim = jaccardSimilarity(ngI, ngJ);
      if (sim > 0.25) {
        introPairs.push({
          article1: intros[i].slug,
          article2: intros[j].slug,
          similarity: (sim * 100).toFixed(2) + "%",
        });
      }
    }
  }

  // Check conclusion similarity
  const conclusionPairs = [];
  for (let i = 0; i < conclusions.length; i++) {
    const wordsI = conclusions[i].text.toLowerCase().split(/\s+/);
    const ngI = getNGrams(wordsI, 4);
    for (let j = i + 1; j < conclusions.length; j++) {
      const wordsJ = conclusions[j].text.toLowerCase().split(/\s+/);
      const ngJ = getNGrams(wordsJ, 4);
      const sim = jaccardSimilarity(ngI, ngJ);
      if (sim > 0.25) {
        conclusionPairs.push({
          article1: conclusions[i].slug,
          article2: conclusions[j].slug,
          similarity: (sim * 100).toFixed(2) + "%",
        });
      }
    }
  }

  const report = {
    totalArticles: canonicalArticles.length,
    exactDuplicateParagraphs: exactDuplicates.length,
    exactDuplicateDetails: exactDuplicates,
    normalizedDuplicateParagraphs: normalizedDuplicates.length,
    normalizedDuplicateDetails: normalizedDuplicates,
    suspiciousNGramSimilarityPairs: highSimilarityPairs.length,
    suspiciousNGramPairs: highSimilarityPairs,
    repeatedSectionHeadingsCount: repeatedHeadings.length,
    repeatedSectionHeadings: repeatedHeadings,
    repeatedIntroPatternsCount: introPairs.length,
    repeatedIntroPatterns: introPairs,
    repeatedConclusionPatternsCount: conclusionPairs.length,
    repeatedConclusionPatterns: conclusionPairs,
    boilerplatePhraseFindings: Object.entries(boilerplateFindings).map(([phrase, occurrences]) => ({
      phrase,
      count: occurrences.length,
      occurrences: occurrences.slice(0, 3),
    })),
    repeatedListItemsCount: repeatedListItems.length,
    repeatedListItems: repeatedListItems.slice(0, 5),
    repeatedTableRowsCount: repeatedTableRows.length,
    repeatedTableRows: repeatedTableRows.slice(0, 5),
    antiBoilerplateBannedPatternFindingsCount: bannedFindings.length,
    bannedPatternFindings: bannedFindings,
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (require.main === module) {
  runAudit();
}

module.exports = { runAudit };
