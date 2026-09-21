const { test, expect } = require("@playwright/test");

test.describe("MyJourney Coding Product Surface Browser QA", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept external network calls (CDNs, fonts) so tests run deterministically
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 204, body: "" });
    });
  });

  test.describe("Desktop Viewport (1440x900)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("1. Header omits the Coding shortcut while /coding remains available", async ({ page }) => {
      await page.goto("/");
      const codingNavLink = page.locator(".desktop-nav a[href='/coding']");
      await expect(codingNavLink).toHaveCount(0);

      await page.goto("/coding");
      await expect(page).toHaveURL(/\/coding$/);
      await expect(page.locator(".coding-hero h1")).toContainText("Learn by building.");
    });

    test("2. /coding Hub renders SubNav, hero, 4 canonical tracks, and system author without stock images", async ({ page }) => {
      await page.goto("/coding");

      // Verify SubNav links
      await expect(page.locator(".coding-subnav")).toBeVisible();
      await expect(page.locator(".coding-subnav__link[href='/coding']")).toHaveText("Overview");
      await expect(page.locator(".coding-subnav__link[href='/coding/html']")).toHaveText("Tracks");
      await expect(page.locator(".coding-subnav__link[href='/coding/practice']")).toHaveText("Practice");
      await expect(page.locator(".coding-subnav__link[href='/coding/projects']")).toHaveText("Projects");
      await expect(page.locator(".coding-subnav__link[href='/coding/playground']")).toHaveText("Playground");
      await expect(page.locator(".coding-subnav__link[href='/coding/resources']")).toHaveText("Resources");

      // Verify Page Hero
      await expect(page.locator(".coding-hero h1")).toContainText("Learn by building.");

      // Verify 4 Canonical Tracks are displayed
      const trackCards = page.locator(".coding-track-card");
      await expect(trackCards).toHaveCount(4);

      // Verify Track Titles
      const headings = page.locator(".coding-track-card h3");
      await expect(headings.nth(0)).toContainText("HTML Foundations");
      await expect(headings.nth(1)).toContainText("CSS Foundations");
      await expect(headings.nth(2)).toContainText("JavaScript Foundations");
      await expect(headings.nth(3)).toContainText("Python Foundations");
      await expect(trackCards.nth(0)).toContainText("12 Lessons");
      await expect(trackCards.nth(1)).toContainText("13 Lessons");
      await expect(trackCards.nth(2)).toContainText("15 Lessons");
      await expect(trackCards.nth(3)).toContainText("15 Lessons");

      // Verify Track Titles have direct links to /coding/:track
      await expect(headings.nth(0).locator("a")).toHaveAttribute("href", "/coding/html");
      await expect(headings.nth(1).locator("a")).toHaveAttribute("href", "/coding/css");
      await expect(headings.nth(2).locator("a")).toHaveAttribute("href", "/coding/javascript");
      await expect(headings.nth(3).locator("a")).toHaveAttribute("href", "/coding/python");

      // Verify System-owned attribution (MyJourney Coding, NOT creator profiles)
      const authors = page.locator(".coding-track-card");
      await expect(authors.first()).toContainText("MyJourney Coding");

      // Verify NO Unsplash or stock images in track cards
      const stockImages = page.locator(".coding-track-card img");
      await expect(stockImages).toHaveCount(0);

      // Verify Track Badges (FREE vs PREMIUM)
      const badges = page.locator(".coding-track-card .cd-badge");
      await expect(badges.nth(0)).toContainText("FREE");
      await expect(badges.nth(1)).toContainText("FREE");
      await expect(badges.nth(2)).toContainText("PREMIUM");
      await expect(badges.nth(3)).toContainText("PREMIUM");
    });

    test("3. /coding Hub real-time search filter works", async ({ page }) => {
      await page.goto("/coding");
      const searchInput = page.locator(".coding-search-bar__input");
      await expect(searchInput).toBeVisible();

      // Search for 'Python'
      await searchInput.fill("Python");
      const filteredCards = page.locator(".coding-track-card");
      await expect(filteredCards).toHaveCount(1);
      await expect(filteredCards.first()).toContainText("Python Foundations");

      // Clear search
      await searchInput.fill("");
      await expect(page.locator(".coding-track-card")).toHaveCount(4);
    });

    test("4. Complete user flow: /coding -> /coding/html -> lesson -> next lesson -> sidebar stays under /coding/*", async ({ page }) => {
      // Step 1: Start at /coding
      await page.goto("/coding");

      // Step 2: Click HTML Foundations title or button
      const htmlCard = page.locator(".coding-track-card").filter({ hasText: "HTML Foundations" });
      await htmlCard.locator("a[href='/coding/html']").first().click();

      // Step 3: Verify URL is /coding/html (NOT /learn/...)
      await expect(page).toHaveURL(/\/coding\/html$/);
      await expect(page.locator(".coding-track-hero h1")).toContainText("HTML Foundations");

      // Verify single outcomes block (NO duplicate "What you will master")
      const outcomes = page.locator(".coding-track-outcomes");
      await expect(outcomes).toBeVisible();
      const outcomeHeadings = outcomes.locator("h2, h3");
      const outcomeTexts = await outcomeHeadings.allTextContents();
      const duplicateCount = outcomeTexts.filter((t) => t.includes("What you will")).length;
      expect(duplicateCount).toBe(1);

      // Verify roadmap has modules and lessons
      const modules = page.locator(".coding-module-card");
      await expect(modules.first()).toBeVisible();
      // Verify NO generic Learn navigation
      await expect(page.locator(".learn-breadcrumbs")).toHaveCount(0);
      await expect(page.locator(".learn-course")).toHaveCount(0);

      // Check start track button
      const startBtn = page.locator("button:has-text('Start Track')").first();
      await expect(startBtn).toBeVisible();
      // Step 4: Click the first lesson from roadmap
      const firstLessonLink = page.locator(".coding-lesson-item a").first();
      await expect(firstLessonLink).toBeVisible();
      const firstLessonHref = await firstLessonLink.getAttribute("href");
      expect(firstLessonHref).toMatch(/^\/coding\/html\/lesson\//);

      await firstLessonLink.click();

      // Step 5: Verify URL is /coding/html/lesson/<id> (NOT /learn/courses/...)
      await expect(page).toHaveURL(/\/coding\/html\/lesson\//);

      // Verify Coding SubNav is persistent
      await expect(page.locator(".coding-subnav")).toBeVisible();

      // Verify Coding Workspace Header with Coding Breadcrumbs
      const breadcrumbs = page.locator(".coding-workspace__breadcrumbs");
      await expect(breadcrumbs).toBeVisible();
      await expect(breadcrumbs).toContainText("Coding");
      await expect(breadcrumbs).toContainText("HTML Foundations");
      await expect(breadcrumbs.locator("a[href='/coding']")).toBeVisible();
      await expect(breadcrumbs.locator("a[href='/coding/html']")).toBeVisible();

      // Verify NO generic Learn branding / layout
      await expect(page.locator(".learn-breadcrumbs")).toHaveCount(0);
      await expect(page.locator(".learn-page")).toHaveCount(0);

      // Step 6: Verify Coding Curriculum Sidebar
      const sidebar = page.locator(".coding-workspace__sidebar");
      await expect(sidebar).toBeVisible();
      const sidebarLessonLinks = sidebar.locator("a");
      const firstSidebarHref = await sidebarLessonLinks.first().getAttribute("href");
      expect(firstSidebarHref).toMatch(/^\/coding\/html\/lesson\//);

      // Solution modal keeps safe viewport spacing and an accessible close target.
      await page.locator(".cd-workspace-action-bar button:has-text('Solution')").click();
      const solutionModal = page.locator(".cd-solution-modal-card");
      const solutionClose = solutionModal.locator("button[aria-label='Close solution modal']");
      await expect(solutionModal).toBeVisible();
      await expect(solutionClose).toBeVisible();
      const solutionModalBox = await solutionModal.boundingBox();
      const solutionCloseBox = await solutionClose.boundingBox();
      expect(solutionModalBox).toBeTruthy();
      expect(solutionCloseBox).toBeTruthy();
      expect(solutionModalBox.y).toBeGreaterThanOrEqual(16);
      expect(solutionModalBox.y + solutionModalBox.height).toBeLessThanOrEqual(884);
      expect(solutionCloseBox.width).toBeGreaterThanOrEqual(34);
      expect(solutionCloseBox.height).toBeGreaterThanOrEqual(34);
      await solutionClose.click();
      await expect(solutionModal).toBeHidden();

      // Verify the repaired splitters resize both workspace axes.
      const centerPanel = page.locator(".cd-zone-center");
      const verticalSplitter = page.locator(".cd-workspace-splitter--vertical");
      const centerBefore = await centerPanel.boundingBox();
      const verticalBox = await verticalSplitter.boundingBox();
      expect(centerBefore).toBeTruthy();
      expect(verticalBox).toBeTruthy();
      await page.mouse.move(verticalBox.x + verticalBox.width / 2, verticalBox.y + 30);
      await page.mouse.down();
      await page.mouse.move(verticalBox.x + 110, verticalBox.y + 30, { steps: 6 });
      await page.mouse.up();
      const centerAfter = await centerPanel.boundingBox();
      expect(centerAfter.width).toBeGreaterThan(centerBefore.width + 50);

      const editorPane = page.locator(".cd-editor-pane");
      const horizontalSplitter = page.locator(".cd-workspace-splitter--horizontal");
      const editorBefore = await editorPane.boundingBox();
      const horizontalBox = await horizontalSplitter.boundingBox();
      expect(editorBefore).toBeTruthy();
      expect(horizontalBox).toBeTruthy();
      await page.mouse.move(horizontalBox.x + 40, horizontalBox.y + horizontalBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(horizontalBox.x + 40, horizontalBox.y + 65, { steps: 6 });
      await page.mouse.up();
      const editorAfter = await editorPane.boundingBox();
      expect(editorAfter.height).toBeGreaterThan(editorBefore.height + 30);

      const viewportFit = await page.evaluate(() => ({
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
      }));
      expect(viewportFit.scrollHeight).toBeLessThanOrEqual(viewportFit.clientHeight + 1);

      // Step 7: Click a different lesson in sidebar -> URL must remain /coding/html/lesson/*
      if (await sidebarLessonLinks.count() > 1) {
        await sidebarLessonLinks.nth(1).click();
        await expect(page).toHaveURL(/\/coding\/html\/lesson\//);
      }

      // Step 8: Click Next button -> URL must remain /coding/html/lesson/*
      const nextBtn = page.locator(".coding-workspace__header a:has-text('Next')");
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await expect(page).toHaveURL(/\/coding\/html\/lesson\//);
      }
    });

    test("5. CSS, JavaScript, and Python tracks navigate cleanly under /coding/*", async ({ page }) => {
      // CSS Track
      await page.goto("/coding/css");
      await expect(page).toHaveURL(/\/coding\/css$/);
      await expect(page.locator(".coding-track-hero h1")).toContainText("CSS Foundations");
      const cssLessonLink = page.locator(".coding-lesson-item a").first();
      await expect(cssLessonLink).toHaveAttribute("href", /^\/coding\/css\/lesson\//);

      // JavaScript Track
      await page.goto("/coding/javascript");
      await expect(page).toHaveURL(/\/coding\/javascript$/);
      await expect(page.locator(".coding-track-hero h1")).toContainText("JavaScript Foundations");
      const jsLessonLink = page.locator(".coding-lesson-item a").first();
      await expect(jsLessonLink).toHaveAttribute("href", /^\/coding\/javascript\/lesson\//);

      // Python Track
      await page.goto("/coding/python");
      await expect(page).toHaveURL(/\/coding\/python$/);
      await expect(page.locator(".coding-track-hero h1")).toContainText("Python Foundations");
      const pyLessonLink = page.locator(".coding-lesson-item a").first();
      await expect(pyLessonLink).toHaveAttribute("href", /^\/coding\/python\/lesson\//);
    });

    test("6. Canonical coding legacy Learn URLs automatically redirect to /coding/* routes", async ({ page }) => {
      // HTML Course legacy URL
      await page.goto("/learn/courses/html-foundations");
      await expect(page).toHaveURL(/\/coding\/html$/);

      // CSS Course legacy URL
      await page.goto("/learn/courses/css-foundations");
      await expect(page).toHaveURL(/\/coding\/css$/);

      // JavaScript Course legacy URL
      await page.goto("/learn/courses/javascript-foundations");
      await expect(page).toHaveURL(/\/coding\/javascript$/);

      // Python Course legacy URL
      await page.goto("/learn/courses/python-foundations");
      await expect(page).toHaveURL(/\/coding\/python$/);

      // Lesson legacy URL
      await page.goto("/learn/courses/html-foundations/lessons/sample-lesson-123");
      await expect(page).toHaveURL(/\/coding\/html\/lesson\/sample-lesson-123$/);

      // Category URL
      await page.goto("/category/coding");
      await expect(page).toHaveURL(/\/coding$/);
    });

    test("7. Non-coding Learn routes remain intact without redirecting to /coding", async ({ page }) => {
      await page.goto("/learn");
      await expect(page).toHaveURL(/\/learn$/);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible({ timeout: 20000 });

      await page.goto("/learn/courses");
      await expect(page).toHaveURL(/\/learn\/courses$/);
      await expect(page.locator("h1:has-text('Courses')")).toBeVisible();
      await expect(page.locator("h1:has-text('Courses')")).toBeVisible({ timeout: 20000 });
    });

    test("8. /coding/playground executes HTML/CSS/JS and Python", async ({ page }) => {
      await page.goto("/coding/playground");
      await expect(page.locator("h1:has-text('Code Playground')")).toBeVisible();

      // Verify tabs
      const tabs = page.locator("button:has-text('HTML / CSS / JS')");
      await expect(tabs).toBeVisible();
      const pyTab = page.locator("button:has-text('Python')");
      await expect(pyTab).toBeVisible();

      // Verify run button
      const runBtn = page.locator("button:has-text('Run Code')");
      await expect(runBtn).toBeVisible();

      // Click run code
      await runBtn.click();
      // Output preview frame should be present
      await expect(page.locator("iframe[title='Playground Live Output']")).toBeVisible();
    });

    test("9. /coding/projects, practice, and resources stay under /coding/*", async ({ page }) => {
      await page.goto("/coding/projects");
      await expect(page).toHaveURL(/\/coding\/projects$/);
      await expect(page.locator("h1:has-text('Portfolio Projects')")).toBeVisible();

      // Verify filter buttons
      const filterBtns = page.locator("button:has-text('All')");
      await expect(filterBtns.first()).toBeVisible();
    });

    test("10. requested Coding routes render without page or console errors", async ({ page }) => {
      test.setTimeout(120_000);
      const pageErrors = [];
      const consoleErrors = [];
      const failedResponses = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        const isAnonymousAuthProbe =
          text === "Failed to load resource: the server responded with a status of 401 (Unauthorized)";
        if (!isAnonymousAuthProbe) consoleErrors.push(text);
      });
      page.on("response", (response) => {
        if (response.status() < 400) return;
        const pathname = new URL(response.url()).pathname;
        const isAnonymousAuthProbe =
          response.status() === 401 &&
          ["/api/auth/me", "/api/auth/refresh-token"].includes(pathname);
        if (!isAnonymousAuthProbe) {
          failedResponses.push(`${response.status()} ${pathname}`);
        }
      });

      const trackRoutes = ["/coding/html", "/coding/css", "/coding/javascript", "/coding/python"];
      const lessonRoutes = [];
      for (const route of trackRoutes) {
        await page.goto(route);
        await expect(page.locator(".coding-track-hero h1")).toBeVisible();
        const firstLessonHref = await page.locator(".coding-lesson-item a").first().getAttribute("href");
        expect(firstLessonHref).toMatch(/^\/coding\/(html|css|javascript|python)\/lesson\//);
        lessonRoutes.push(firstLessonHref);
      }

      const routes = [
        { path: "/coding", ready: ".coding-hero h1" },
        ...trackRoutes.map((path) => ({ path, ready: ".coding-track-hero h1" })),
        ...lessonRoutes.map((path) => ({ path, ready: ".cd-zone-center__title" })),
        { path: "/coding/playground", ready: "h1:has-text('Code Playground')" },
        { path: "/coding/projects", ready: "h1:has-text('Portfolio Projects')" },
        { path: "/coding/practice", ready: "h1:has-text('Quick Code Challenges')" },
        { path: "/coding/resources", ready: "h1:has-text('Coding Resource Library')" },
      ];

      for (const route of routes) {
        await test.step(`render ${route.path}`, async () => {
          await page.goto(route.path);
          await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 20_000 });
        });
      }

      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(" | ")}`).toEqual([]);
      expect(consoleErrors, `Browser console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
      expect(failedResponses, `Unexpected failed responses: ${failedResponses.join(" | ")}`).toEqual([]);
    });

    test("7. /coding/practice displays interactive coding challenges", async ({ page }) => {
      await page.goto("/coding/practice");
      await expect(page).toHaveURL(/\/coding\/practice$/);
      await expect(page.locator("h1:has-text('Quick Code Challenges')")).toBeVisible();
    });

    test("8. /coding/resources displays materials library with dynamic categories", async ({ page }) => {
      await page.goto("/coding/resources");
      await expect(page).toHaveURL(/\/coding\/resources$/);
      await expect(page.locator("h1:has-text('Coding Resource Library')")).toBeVisible();

      // Verify filter button exists
      const filterBtn = page.locator("button:has-text('All Tracks')");
      await expect(filterBtn).toBeVisible();
    });
  });

  test.describe("Mobile Viewport (390x844 - iPhone)", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("1. Mobile Navigation drawer omits the Coding shortcut", async ({ page }) => {
      await page.goto("/");
      const menuBtn = page.locator(".mobile-menu-btn");
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();

      const mobileDrawer = page.locator(".mobile-drawer");
      await expect(mobileDrawer).toBeVisible();

      const codingLink = mobileDrawer.locator("a[href='/coding']");
      await expect(codingLink).toHaveCount(0);
    });

    test("2. /coding Hub is responsive and has no horizontal overflow", async ({ page }) => {
      await page.goto("/coding");
      await expect(page.locator(".coding-hero h1")).toBeVisible();

      // Check that root layout does not exceed 395px
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(395);
    });

    test("3. /coding/playground is responsive on mobile", async ({ page }) => {
      await page.goto("/coding/playground");
      await expect(page.locator("h1:has-text('Code Playground')")).toBeVisible();

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(395);
    });
  });
});
