#!/usr/bin/env node
const launchStories = require("../data/launchStories");
const {
  getStoryWordCount,
  calculateStoryReadingTime,
  STORY_SECTION_TYPES,
  STORY_LAYOUT_IDS,
} = require("../utils/storyContent");

function runAudit() {
  console.log("================================================================================");
  console.log("                MYJOURNEY V1 — STORY EDITORIAL QUALITY AUDIT                   ");
  console.log("================================================================================");

  let totalWords = 0;
  let totalSections = 0;
  const errors = [];
  const allParagraphs = new Map();

  console.log(
    "| # | Title                          | Layout               | Words | Time   | Access  | Sections |"
  );
  console.log(
    "|---|--------------------------------|----------------------|-------|--------|---------|----------|"
  );

  launchStories.forEach((story, index) => {
    const wc = getStoryWordCount(story);
    const rt = calculateStoryReadingTime(story);
    const sections = story.storySections || [];
    totalWords += wc;
    totalSections += sections.length;

    const num = String(index + 1).padEnd(1);
    const title = story.title.padEnd(30).slice(0, 30);
    const layout = story.storyLayout.padEnd(20).slice(0, 20);
    const words = String(wc).padStart(5);
    const time = (rt + " min").padStart(6);
    const access = story.accessLevel.padEnd(7);
    const secCount = String(sections.length).padStart(8);

    console.log(`| ${num} | ${title} | ${layout} | ${words} | ${time} | ${access} | ${secCount} |`);

    // Verify sections
    sections.forEach((sec) => {
      if (!STORY_SECTION_TYPES.includes(sec.type)) {
        errors.push(`Story "${story.title}": Invalid section type "${sec.type}"`);
      }
      const text = (sec.body || "").trim();
      if (text.length > 50) {
        const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 50);
        paragraphs.forEach((p) => {
          if (allParagraphs.has(p)) {
            errors.push(`Duplicate paragraph between "${story.title}" and "${allParagraphs.get(p)}"`);
          }
          allParagraphs.set(p, story.title);
        });
      }
    });

    if (wc < 3500) {
      errors.push(`Story "${story.title}" has only ${wc} words (< 3500 word threshold for ~18-20 min editorial range)`);
    }
  });

  console.log("================================================================================");
  console.log(`Total Stories: ${launchStories.length}`);
  console.log(`Total Words:   ${totalWords.toLocaleString()} words`);
  console.log(`Total Sections: ${totalSections}`);
  console.log(`Average Words:  ${Math.round(totalWords / launchStories.length).toLocaleString()} words / story`);
  const anchorStory = launchStories.find((s) => s.slug === "the-report-card-in-the-drawer") || launchStories[0];
  const premiumStory = launchStories.find((s) => s.accessLevel === "premium") || launchStories[0];
  if (anchorStory) {
    console.log(`Anchor Read:     "${anchorStory.title}" (${getStoryWordCount(anchorStory)} words, ${calculateStoryReadingTime(anchorStory)} min read)`);
  }
  if (premiumStory) {
    console.log(`Premium Story:   "${premiumStory.title}" (${getStoryWordCount(premiumStory)} words, ${calculateStoryReadingTime(premiumStory)} min read)`);
  }

  if (errors.length > 0) {
    console.error("\nAUDIT FAILURES DETECTED:");
    errors.forEach((err) => console.error("  - " + err));
    process.exit(1);
  } else {
    console.log("\n>>> EDITORIAL QUALITY AUDIT: 100% PASS (Zero errors, zero duplication)");
  }
}

if (require.main === module) {
  runAudit();
}

module.exports = runAudit;
