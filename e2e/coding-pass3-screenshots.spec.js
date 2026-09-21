const { test, expect } = require("@playwright/test");
const path = require("path");

const artifactDir = "C:/Users/NOBLE JOHN STEEVEN/.gemini/antigravity/brain/80429e96-d1cf-4afa-8593-b9b56d1c0c20";

test.describe("MyJourney Coding Pass 3 Visual Review Screenshots (21 Targets)", () => {
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

  test("Capture Lesson Workspace & Submission Screenshots (1-10)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to canonical HTML course and first lesson
    await page.goto("/coding/html");
    await page.waitForSelector(".coding-lesson-item a");
    const firstLessonLink = page.locator(".coding-lesson-item a").first();
    const href = await firstLessonLink.getAttribute("href");
    await page.goto(href);

    await page.waitForSelector(".coding-workspace-3zone");
    await page.waitForSelector(".cd-zone-center");
    await page.waitForSelector(".cd-zone-workspace");
    await page.waitForSelector(".cd-workspace-splitter--vertical");
    await page.waitForSelector(".cd-workspace-splitter--horizontal");
    await page.waitForTimeout(1000);

    // 1. Workspace default split (36/64)
    await page.screenshot({
      path: path.join(artifactDir, "1_workspace_default_split.png"),
      fullPage: false,
    });

    // 2. Instructions panel widened (drag vertical splitter right)
    const vSplitter = page.locator(".cd-workspace-splitter--vertical");
    const vBox = await vSplitter.boundingBox();
    if (vBox) {
      await page.mouse.move(vBox.x + vBox.width / 2, vBox.y + vBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(vBox.x + 120, vBox.y + vBox.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: path.join(artifactDir, "2_instructions_panel_widened.png"),
      fullPage: false,
    });

    // 3. Editor panel widened / resized (drag horizontal splitter down)
    const hSplitter = page.locator(".cd-workspace-splitter--horizontal");
    const hBox = await hSplitter.boundingBox();
    if (hBox) {
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + 80, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: path.join(artifactDir, "3_editor_panel_widened.png"),
      fullPage: false,
    });

    // 4. Submit button and Action Toolbar
    const toolbar = page.locator(".cd-workspace-action-bar");
    await toolbar.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactDir, "4_submit_button_toolbar.png"),
      fullPage: false,
    });

    // 5. Accepted submission result
    // Trigger submit with the starter code (or valid code)
    const submitBtn = page.locator(".cd-workspace-action-bar button:has-text('Submit')");
    await submitBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(artifactDir, "5_accepted_submission_result.png"),
      fullPage: false,
    });

    // 6. Failed submission result
    // Type failing code and submit
    const editor = page.locator(".cd-workspace-editor__textarea, textarea").first();
    if (await editor.isVisible()) {
      await editor.fill("<h1>Invalid Code</h1>");
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: path.join(artifactDir, "6_failed_submission_result.png"),
      fullPage: false,
    });

    // 7. Submissions drawer history list
    const historyBtn = page.locator(".cd-workspace-action-bar button:has-text('Submissions')");
    await historyBtn.click();
    await page.waitForSelector(".cd-submissions-drawer");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(artifactDir, "7_submissions_history.png"),
      fullPage: false,
    });

    // 8. Submission details view
    const firstSubItem = page.locator(".cd-submission-item").first();
    if (await firstSubItem.isVisible()) {
      await firstSubItem.click();
      await page.waitForSelector(".cd-submission-detail");
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: path.join(artifactDir, "8_submission_details.png"),
      fullPage: false,
    });

    // Close submissions drawer
    const closeDrawerBtn = page.locator(".cd-submissions-drawer button[aria-label='Close']");
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.click();
      await page.waitForTimeout(300);
    }

    // 9. Full preview page (/coding/preview/:sessionId)
    await page.evaluate(() => {
      sessionStorage.setItem(
        "coding_preview_demo_lsn",
        JSON.stringify({
          sourceType: "lesson",
          code: "<div style='padding:2rem;text-align:center;'><h1>Lesson Full Preview</h1><p>Running isolated in standalone viewport.</p><button style='background:#0284c7;color:#fff;border:none;padding:8px 16px;border-radius:4px;'>Click Me</button></div>",
          language: "html",
          title: "Introduction to HTML",
        })
      );
    });
    await page.goto("/coding/preview/demo_lsn");
    await page.waitForSelector(".cd-full-preview-nav");
    await page.waitForSelector(".cd-full-preview-iframe");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(artifactDir, "9_full_preview_new_tab.png"),
      fullPage: false,
    });

    // 10. Mobile layout (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(href);
    await page.waitForSelector(".cd-mobile-tabs");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(artifactDir, "10_mobile_layout.png"),
      fullPage: false,
    });
  });

  test("Capture Playground & SubNav Fixed Screenshots (11-21)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 11. Playground Default Web Mode
    await page.goto("/coding/playground");
    await page.waitForSelector("h1:has-text('Code Playground')");
    await page.waitForSelector(".cd-editor-pane");
    await page.waitForSelector(".cd-output-pane");
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(artifactDir, "11_playground_default.png"),
      fullPage: false,
    });

    // 12. Playground index.html tab active
    const htmlTab = page.locator(".cd-output-tab-btn:has-text('index.html')");
    await htmlTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactDir, "12_playground_html_tab.png"),
      fullPage: false,
    });

    // 13. Playground styles.css tab active
    const cssTab = page.locator(".cd-output-tab-btn:has-text('styles.css')");
    await cssTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactDir, "13_playground_css_tab.png"),
      fullPage: false,
    });

    // 14. Playground script.js tab active
    const jsTab = page.locator(".cd-output-tab-btn:has-text('script.js')");
    await jsTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactDir, "14_playground_js_tab.png"),
      fullPage: false,
    });

    // 15. Playground Live Preview
    const previewTab = page.locator(".cd-output-tabs .cd-output-tab-btn:has-text('Live Preview')");
    await previewTab.click();
    await page.locator("button:has-text('Run Code')").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(artifactDir, "15_playground_live_preview.png"),
      fullPage: false,
    });

    // 16. Playground Console Output
    const consoleTab = page.locator(".cd-output-tabs .cd-output-tab-btn:has-text('Console')");
    await consoleTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactDir, "16_playground_console_output.png"),
      fullPage: false,
    });

    // 17. Playground Open Preview Standalone
    await page.evaluate(() => {
      sessionStorage.setItem(
        "coding_preview_demo_pg",
        JSON.stringify({
          sourceType: "playground_web",
          code: "<div style='padding:2rem;'><h1 style='color:#0284c7;'>Playground App</h1><p>Full-screen interactive web sandbox.</p></div>",
          styles: "body { font-family: sans-serif; background: #f0fdf4; }",
          script: "console.log('App started');",
          title: "Playground Project",
        })
      );
    });
    await page.goto("/coding/preview/demo_pg");
    await page.waitForSelector(".cd-full-preview-nav");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(artifactDir, "17_playground_full_preview.png"),
      fullPage: false,
    });

    // Return to playground
    await page.goto("/coding/playground");
    await page.waitForSelector("h1:has-text('Code Playground')");

    // 18. Playground Python Mode
    const pythonModeBtn = page.locator("button:has-text('Python (Pyodide)')");
    await pythonModeBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(artifactDir, "18_playground_python_mode.png"),
      fullPage: false,
    });

    // 19. Playground Python Console
    const runPythonBtn = page.locator("button:has-text('Run Code')");
    await runPythonBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(artifactDir, "19_playground_python_console.png"),
      fullPage: false,
    });

    // 20. Playground Reset Confirmation Modal
    const resetBtn = page.locator("button:has-text('Reset')");
    await resetBtn.click();
    await page.waitForSelector(".cd-confirm-dialog");
    await page.screenshot({
      path: path.join(artifactDir, "20_playground_reset_confirm.png"),
      fullPage: false,
    });

    // Close reset modal
    await page.locator(".cd-confirm-dialog button:has-text('Cancel')").click();
    await page.waitForTimeout(300);

    // 21. SubNav Trailing Control Fixed (Overview / Tracks / Practice / Projects / Playground / Resources)
    await page.goto("/coding");
    await page.waitForSelector(".coding-subnav");
    const subnav = page.locator(".coding-subnav");
    await page.screenshot({
      path: path.join(artifactDir, "21_subnav_trailing_control_fixed.png"),
      fullPage: false,
    });
  });
});

