const { test, expect } = require("@playwright/test");
const path = require("path");
const { fixtures } = require("./support/environment.cjs");

const artifactDir = "C:/Users/NOBLE JOHN STEEVEN/.gemini/antigravity/brain/80429e96-d1cf-4afa-8593-b9b56d1c0c20";

test.describe.configure({ mode: "serial", timeout: 90_000 });

test("Capture 18 Coding CMS Screenshots for Visual Review", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });

  // Step 1: Real Admin Login
  await page.goto("/login");
  await page.locator("#login-identifier").fill(fixtures.adminEmail);
  await page.locator("#login-password").fill(fixtures.password);
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/auth/login") && response.request().method() === "POST"),
    page.locator('button[type="submit"]').click(),
  ]);

  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });

  // Step 2: Navigate to Coding CMS
  await page.goto("/cms/coding");
  await page.waitForSelector("text=Coding Curriculum & Platform Management", { timeout: 15000 });
  await page.waitForTimeout(1000);

  // ─── Screenshot 01: Overview Tab ───
  await page.screenshot({
    path: path.join(artifactDir, "01_cms_coding_overview_tab.png"),
    fullPage: false,
  });

  // ─── Screenshot 02: Tracks Tab ───
  await page.locator("button:has-text('Tracks')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifactDir, "02_cms_coding_tracks_tab.png"),
    fullPage: false,
  });

  // ─── Screenshot 03: New Track Form ───
  await page.locator("button:has-text('New Track')").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(artifactDir, "03_cms_coding_new_track_form.png"),
    fullPage: false,
  });
  await page.locator("button:has-text('Cancel')").first().click();
  await page.waitForTimeout(300);

  // ─── Screenshot 04: Edit Track Metadata ───
  await page.locator("button:has-text('Metadata')").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(artifactDir, "04_cms_coding_edit_track_metadata.png"),
    fullPage: false,
  });
  await page.locator("button:has-text('Cancel')").first().click();
  await page.waitForTimeout(300);

  // ─── Screenshot 05: Curriculum Tab ───
  await page.locator("button:has-text('Curriculum')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifactDir, "05_cms_coding_curriculum_tab_modules.png"),
    fullPage: false,
  });

  // ─── Screenshot 06: Add Module Form ───
  await page.locator("button:has-text('Add Module')").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(artifactDir, "06_cms_coding_add_module_form.png"),
    fullPage: false,
  });
  await page.locator("button:has-text('Cancel')").first().click();
  await page.waitForTimeout(300);

  // ─── Screenshot 07: Edit Module Inline ───
  const editModBtns = page.locator('button[title="Edit module metadata"]');
  if (await editModBtns.count() > 0) {
    await editModBtns.first().click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(artifactDir, "07_cms_coding_edit_module_inline.png"),
      fullPage: false,
    });
    await page.locator("button:has-text('Cancel')").first().click();
    await page.waitForTimeout(300);
  }

  // ─── Screenshot 08: Add Lesson Form ───
  const addLessonBtns = page.locator("button:has-text('Add Lesson')");
  if (await addLessonBtns.count() > 0) {
    await addLessonBtns.first().click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(artifactDir, "08_cms_coding_add_lesson_form.png"),
      fullPage: false,
    });
    await page.locator("button:has-text('Cancel')").first().click();
    await page.waitForTimeout(300);
  }

  // Open Lesson Editor on first lesson
  const editLessonBtns = page.locator('button[title="Open full lesson editor"]');
  if (await editLessonBtns.count() > 0) {
    await editLessonBtns.first().click();
    await page.waitForTimeout(800);

    // ─── Screenshot 09: Lesson Editor Metadata ───
    await page.screenshot({
      path: path.join(artifactDir, "09_cms_coding_lesson_editor_metadata.png"),
      fullPage: false,
    });

    // ─── Screenshot 10: Concept Explanation ───
    const conceptHeader = page.getByRole("heading", { name: /2. Concept Explanation/i });
    if (await conceptHeader.count() > 0) {
      await conceptHeader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactDir, "10_cms_coding_lesson_editor_concept.png"),
        fullPage: false,
      });
    }

    // ─── Screenshot 11: Coding Blocks ───
    const codingBlockHeader = page.getByRole("heading", { name: /3. Interactive Coding Blocks/i });
    if (await codingBlockHeader.count() > 0) {
      await codingBlockHeader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactDir, "11_cms_coding_lesson_editor_coding_block.png"),
        fullPage: false,
      });
    }

    // ─── Screenshot 12: Solution Code ───
    const solutionNotice = page.locator("text=Official Solution Code is server-protected");
    if (await solutionNotice.count() > 0) {
      await solutionNotice.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactDir, "12_cms_coding_lesson_editor_solution_code.png"),
        fullPage: false,
      });
    }

    // ─── Screenshot 13: Progressive Hints ───
    const hintsSection = page.locator("text=Progressive Hints");
    if (await hintsSection.count() > 0) {
      await hintsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactDir, "13_cms_coding_lesson_editor_hints.png"),
        fullPage: false,
      });
    }

    // ─── Screenshot 14: Validation Rules ───
    const rulesSection = page.locator("text=Validation Rules (").first();
    if (await rulesSection.count() > 0) {
      await rulesSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const selectorInput = page.locator('input[placeholder*="e.g. h1, main"]').first();
      if (await selectorInput.count() > 0) {
        await selectorInput.fill("h1.hero-title");
        const msgInput = page.locator('input[placeholder*="e.g. Add an <h1>"]').first();
        if (await msgInput.count() > 0) {
          await msgInput.fill("Add a top-level heading with class hero-title.");
        }
        const addBtn = page.locator("button:has-text('Add Rule to Block')").first();
        if (await addBtn.count() > 0) {
          await addBtn.click();
          await page.waitForTimeout(400);
        }
      }

      await page.screenshot({
        path: path.join(artifactDir, "14_cms_coding_lesson_editor_validation_rules.png"),
        fullPage: false,
      });
    }

    // ─── Screenshot 15: Quiz Questions ───
    const quizHeader = page.getByRole("heading", { name: /4. Lesson Quiz Questions/i });
    if (await quizHeader.count() > 0) {
      await quizHeader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactDir, "15_cms_coding_lesson_editor_quiz_builder.png"),
        fullPage: false,
      });
    }

    // Back to modules
    await page.locator("button:has-text('Back to Modules')").first().click();
    await page.waitForTimeout(400);
  }

  // ─── Screenshot 16: Practice Tab ───
  await page.locator("button:has-text('Practice')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifactDir, "16_cms_coding_practice_tab.png"),
    fullPage: false,
  });

  // ─── Screenshot 17: Projects Tab ───
  await page.locator("button:has-text('Projects')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifactDir, "17_cms_coding_projects_tab.png"),
    fullPage: false,
  });

  // ─── Screenshot 18: Materials & Publishing ───
  await page.locator("button:has-text('Materials')").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifactDir, "18_cms_coding_materials_and_publishing.png"),
    fullPage: false,
  });
});
