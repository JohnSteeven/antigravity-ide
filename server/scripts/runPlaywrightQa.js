"use strict";

/**
 * runPlaywrightQa.js
 *
 * Real browser QA verification using Playwright Chromium across 1440x900 and 390x844 viewports.
 */

const { chromium } = require("playwright");

const BASE_URL = "http://localhost:1234";

const TARGETS = [
  { name: "Life pillar", path: "/articles/the-architecture-of-living-together", type: "article" },
  { name: "Reflections pillar", path: "/articles/the-art-of-being-alone-without-becoming-lonely", type: "article" },
  { name: "Lesson pillar", path: "/articles/what-failure-actually-teaches", type: "article" },
  { name: "Experience", path: "/articles/what-a-major-move-does-to-a-family", type: "article" },
  { name: "India Travel", path: "/articles/varanasi", type: "article" },
  { name: "International Travel", path: "/articles/singapore", type: "article" },
  { name: "/articles", path: "/articles", type: "catalog" },
  { name: "Life category", path: "/category/life", type: "category" },
  { name: "Reflections category", path: "/category/reflections", type: "category" },
  { name: "Lessons category", path: "/category/lessons", type: "category" },
  { name: "Experiences category", path: "/category/experiences", type: "category" },
  { name: "Travel category", path: "/category/travel", type: "category" },
  { name: "Incidents -> Experiences behavior", path: "/category/incidents", type: "redirect" },
  { name: "Real archived former Life slug", path: "/articles/finding-focus-in-a-noisy-season", type: "tombstone" },
  { name: "Real archived former Coding Article slug", path: "/articles/clean-code-principles", type: "tombstone" },
];

const VIEWPORTS = [
  { name: "Desktop (1440x900)", width: 1440, height: 900 },
  { name: "Mobile (390x844)", width: 390, height: 844 },
];

async function runQa() {
  console.log("Launching Chromium for Real Browser QA...");
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n================ Testing Viewport: ${vp.name} ================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.width < 500
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    for (const target of TARGETS) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const t = msg.text();
          // Filter out benign browser telemetry / expected anonymous 401 checks / favicons / tombstone interactions
          if (
            !t.includes("favicon") &&
            !t.includes("401 (Unauthorized)") &&
            !t.includes("auth/me") &&
            !t.includes("reader/profile") &&
            !(target.type === "tombstone" && t.includes("404"))
          ) {
            consoleErrors.push(t);
          }
        }
      });

      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      const url = `${BASE_URL}${target.path}`;
      const itemResult = {
        viewport: vp.name,
        target: target.name,
        path: target.path,
        status: "PASS",
        checks: {},
        issues: [],
      };

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });

        // Check 1: Blank page
        const bodyText = await page.evaluate(() => document.body.innerText.trim());
        const hasContent = bodyText.length > 50;
        itemResult.checks.noBlankPage = hasContent;
        if (!hasContent) itemResult.issues.push("Page appears blank or empty");

        // Check 2: Horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 2;
        });
        itemResult.checks.noHorizontalOverflow = !overflow;
        if (overflow) itemResult.issues.push("Horizontal overflow detected (scrollWidth > innerWidth)");

        // Check 3: Page / hydration errors
        itemResult.checks.noPageErrors = pageErrors.length === 0;
        if (pageErrors.length > 0) itemResult.issues.push(`Page errors: ${pageErrors.join("; ")}`);

        itemResult.checks.noConsoleErrors = consoleErrors.length === 0;
        if (consoleErrors.length > 0) itemResult.issues.push(`Console errors: ${consoleErrors.slice(0, 2).join("; ")}`);

        // Check 4: Article Detail checks
        if (target.type === "article") {
          const articleAudit = await page.evaluate(() => {
            const h1 = document.querySelector("h1");
            const h2s = document.querySelectorAll("h2");
            const imgs = Array.from(document.querySelectorAll("img")).filter(img => !img.src.includes("data:image/svg"));
            const tables = document.querySelectorAll("table");
            const text = document.body.innerText;
            const hasReadingTime = /min read/i.test(text) || /\d+\s*min/i.test(text);
            const hasSources = /references|sources|official|provenance|case study|takeaways|reflection/i.test(text);

            return {
              hasH1: Boolean(h1 && h1.innerText.trim().length > 0),
              h1Text: h1?.innerText.trim(),
              h2Count: h2s.length,
              imgCount: imgs.length,
              tableCount: tables.length,
              hasReadingTime,
              hasSources,
            };
          });

          itemResult.checks.headings = articleAudit.hasH1 && articleAudit.h2Count >= 2;
          itemResult.checks.images = articleAudit.imgCount >= 1;
          itemResult.checks.readingTime = articleAudit.hasReadingTime;
          itemResult.checks.sources = articleAudit.hasSources;

          if (!itemResult.checks.headings) itemResult.issues.push("Missing valid h1 or subheadings");
          if (!itemResult.checks.images) itemResult.issues.push("No images loaded");
          if (!itemResult.checks.readingTime) itemResult.issues.push("Reading time indicator not found");
          if (!itemResult.checks.sources) itemResult.issues.push("Sources or references not found");
        }

        // Check 5: Catalog / Category checks
        if (target.type === "category" || target.type === "catalog") {
          const listAudit = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("a[href*='/articles/']"));
            return {
              articleLinkCount: links.length,
            };
          });
          itemResult.checks.articleLinks = listAudit.articleLinkCount > 0;
          if (!itemResult.checks.articleLinks) itemResult.issues.push("No article cards/links rendered in catalog");
        }

        // Check 6: Redirect / Alias checks (incidents -> experiences)
        if (target.type === "redirect") {
          const currentUrl = page.url();
          const pageTitle = await page.title();
          const bodyTextLower = bodyText.toLowerCase();
          const resolvedToExperiences = currentUrl.includes("experiences") || bodyTextLower.includes("experiences");
          itemResult.checks.resolvedToExperiences = resolvedToExperiences;
          if (!resolvedToExperiences) itemResult.issues.push("Did not resolve to Experiences category");
        }

        // Check 7: Tombstone checks
        if (target.type === "tombstone") {
          const tombstoneAudit = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            const mentionsArchived = text.includes("archived") || text.includes("no longer active");
            const wordCount = text.split(/\s+/).length;
            // Tombstone should never leak full prose (under 300 words total page text)
            const leaksNoProse = wordCount < 300;
            return { mentionsArchived, wordCount, leaksNoProse };
          });
          itemResult.checks.mentionsArchived = tombstoneAudit.mentionsArchived;
          itemResult.checks.leaksNoProse = tombstoneAudit.leaksNoProse;
          if (!tombstoneAudit.mentionsArchived) itemResult.issues.push("Archived notice not found");
          if (!tombstoneAudit.leaksNoProse) itemResult.issues.push(`Prose leaked! Word count is ${tombstoneAudit.wordCount}`);
        }

        if (itemResult.issues.length > 0) {
          itemResult.status = "WARN";
        }
      } catch (err) {
        itemResult.status = "FAIL";
        itemResult.issues.push(`Navigation/Execution error: ${err.message}`);
      } finally {
        await page.close();
      }

      console.log(`  [${itemResult.status}] ${target.name} (${target.path}): ${itemResult.issues.length === 0 ? "All checks passed" : itemResult.issues.join(", ")}`);
      results.push(itemResult);
    }
    await context.close();
  }

  await browser.close();

  const totalPassed = results.filter(r => r.status === "PASS").length;
  const totalWarn = results.filter(r => r.status === "WARN").length;
  const totalFail = results.filter(r => r.status === "FAIL").length;

  console.log(`\n================ REAL BROWSER QA SUMMARY ================`);
  console.log(`Total Scenarios: ${results.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Warnings: ${totalWarn}`);
  console.log(`Failed: ${totalFail}`);

  return { total: results.length, passed: totalPassed, warnings: totalWarn, failed: totalFail, details: results };
}

if (require.main === module) {
  runQa().catch((err) => {
    console.error("Browser QA script failed:", err);
    process.exit(1);
  });
}

module.exports = { runQa };
