const { test, expect } = require("@playwright/test");
const path = require("path");

const artifactDir = "C:/Users/NOBLE JOHN STEEVEN/.gemini/antigravity/brain/80429e96-d1cf-4afa-8593-b9b56d1c0c20";

test.describe("MyJourney Coding QA Screenshots Capture", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 204, body: "" });
    });
  });

  test("Desktop Screenshots (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Coding Hub Desktop
    await page.goto("/coding");
    await page.waitForSelector(".coding-hero h1");
    await page.waitForSelector(".cd-hub-stats-row");
    await page.waitForSelector(".coding-tracks-grid");
    await page.screenshot({
      path: path.join(artifactDir, "1_coding_hub_desktop.png"),
      fullPage: false,
    });

    // 2. Coding Track CSS Desktop
    await page.goto("/coding/css");
    await page.waitForSelector(".coding-track-hero h1");
    await page.waitForSelector(".coding-lesson-item");
    await page.screenshot({
      path: path.join(artifactDir, "2_coding_track_css_desktop.png"),
      fullPage: false,
    });

    // 3. Coding Track HTML Desktop
    await page.goto("/coding/html");
    await page.waitForSelector(".coding-track-hero h1");
    await page.waitForSelector(".coding-lesson-item");
    await page.screenshot({
      path: path.join(artifactDir, "3_coding_track_html_desktop.png"),
      fullPage: false,
    });

    // 4. Coding Lesson CSS Desktop (3-Zone Workspace)
    // 4. Coding Lesson HTML Desktop (3-Zone Workspace)
    await page.goto("/coding/html");
    await page.waitForSelector(".coding-lesson-item a");
    const firstLessonLink = page.locator(".coding-lesson-item a").first();
    const href = await firstLessonLink.getAttribute("href");
    await page.goto(href);
    await page.waitForSelector(".coding-workspace-3zone");
    await page.waitForSelector(".cd-zone-sidebar");
    await page.waitForSelector(".cd-zone-center");
    await page.waitForSelector(".cd-zone-workspace");
    await page.waitForTimeout(1000); // Allow preview render
    await page.screenshot({
      path: path.join(artifactDir, "4_coding_lesson_css_desktop.png"),
      fullPage: false,
    });

    // 5. Progressive Hint Modal
    const hintBtn = page.locator(".cd-workspace-action-bar button:has-text('Hint')");
    if (await hintBtn.isVisible()) {
      await hintBtn.click();
      await page.waitForSelector(".cd-hint-modal-card");
      await page.screenshot({
        path: path.join(artifactDir, "5_coding_lesson_hint_modal.png"),
        fullPage: false,
      });
      // Close hint modal
      await page.locator(".cd-modal-close-btn").click();
      await page.waitForTimeout(300);
    }

    // 6. Solution Comparison Modal
    const solutionBtn = page.locator(".cd-workspace-action-bar button:has-text('Solution')");
    if (await solutionBtn.isVisible()) {
      await solutionBtn.click();
      await page.waitForSelector(".cd-solution-modal-card");
      await page.screenshot({
        path: path.join(artifactDir, "6_coding_lesson_solution_modal.png"),
        fullPage: false,
      });
      // Close solution modal
      await page.locator(".cd-modal-close-btn").click();
      await page.waitForTimeout(300);
    }

    // 7. Output Panel - Console Tab
    const consoleTabBtn = page.locator(".cd-output-tab-btn:has-text('Console')");
    await consoleTabBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactDir, "7_coding_lesson_console_desktop.png"),
      fullPage: false,
    });

    // 8. Output Panel - Tests / Validation Tab
    const testsTabBtn = page.locator(".cd-output-tab-btn:has-text('Tests')");
    await testsTabBtn.click();
    const checkBtn = page.locator(".cd-workspace-action-bar button:has-text('Check')");
    await checkBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(artifactDir, "8_coding_lesson_tests_desktop.png"),
      fullPage: false,
    });

    // 9. Coding Playground Desktop
    await page.goto("/coding/playground");
    await page.waitForSelector("h1:has-text('Code Playground')");
    await page.screenshot({
      path: path.join(artifactDir, "9_coding_playground_desktop.png"),
      fullPage: false,
    });
  });

  test("Mobile Screenshots (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 10. Coding Hub Mobile
    await page.goto("/coding");
    await page.waitForSelector(".coding-hero h1");
    await page.screenshot({
      path: path.join(artifactDir, "10_coding_hub_mobile.png"),
      fullPage: false,
    });

    // 11. Coding Lesson Mobile View
    await page.goto("/coding/css");
    const firstLessonLink = page.locator(".coding-lesson-item a").first();
    const href = await firstLessonLink.getAttribute("href");
    await page.goto(href);
    await page.waitForSelector(".cd-mobile-tabs");
    await page.screenshot({
      path: path.join(artifactDir, "11_coding_lesson_mobile.png"),
      fullPage: false,
    });
  });
});
