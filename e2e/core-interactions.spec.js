const { test, expect } = require("@playwright/test");
const { fixtures } = require("./support/environment.cjs");

const login = async (page, email) => {
  await page.goto("/login");
  await page.locator("#login-identifier").fill(email);
  await page.locator("#login-password").fill(fixtures.password);
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => (
      candidate.url().endsWith("/api/auth/login") && candidate.request().method() === "POST"
    )),
    page.getByRole("button", { name: "Start Reading" }).click(),
  ]);
  if (response.status() !== 200) {
    throw new Error(`Login failed: ${response.status()} ${response.url()} ${await response.text()}`);
  }
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
};

const interactionResponse = (page, action) => page.waitForResponse((candidate) => (
  candidate.url().endsWith(`/api/articles/${fixtures.articleId}/${action}`)
    && candidate.request().method() === "POST"
));

const openFixtureArticle = async (page) => {
  await page.goto("/articles");
  await page.getByRole("link").filter({ hasText: fixtures.articleTitle }).first().click();
  await expect(page).toHaveURL(new RegExp(`/articles/${fixtures.articleSlug}`));
  await expect(page.getByRole("heading", { name: fixtures.articleTitle })).toBeVisible();
};

test.describe("core authenticated Article journey", () => {
  test("login, Article actions, persistence, Profile sync, progress, account isolation, and logout", async ({ page }) => {
    test.setTimeout(180_000);
    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            window.__e2eCopiedUrl = value;
          },
        },
      });
    });

    await login(page, fixtures.primaryEmail);
    await page.goto("/");
    const categoriesButton = page.getByRole("button", { name: "Categories", exact: true });
    await categoriesButton.click();
    await expect(page.getByRole("region", { name: "Categories navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(categoriesButton).toHaveAttribute("aria-expanded", "false");
    await openFixtureArticle(page);

    let likeButton = page.getByRole("button", { name: "Like article" });
    await expect(likeButton).toHaveAttribute("aria-pressed", "false");
    const [likeResponse] = await Promise.all([
      interactionResponse(page, "like"),
      likeButton.click(),
    ]);
    expect(likeResponse.status()).toBe(200);
    expect(await likeResponse.json()).toMatchObject({
      articleId: fixtures.articleId,
      metric: "likes",
      isActive: true,
      count: 1,
      libraryItem: { id: fixtures.articleId },
    });
    likeButton = page.getByRole("button", { name: "Unlike article" });
    await expect(likeButton).toHaveAttribute("aria-pressed", "true");
    await expect(likeButton).toHaveClass(/\bactive\b/);
    await expect(likeButton).toHaveCSS("color", "rgb(255, 77, 79)");
    await expect(likeButton.locator("span")).toHaveText("1");

    await page.reload();
    likeButton = page.getByRole("button", { name: "Unlike article" });
    await expect(likeButton).toHaveAttribute("aria-pressed", "true");
    const [unlikeResponse] = await Promise.all([
      interactionResponse(page, "like"),
      likeButton.click(),
    ]);
    expect(await unlikeResponse.json()).toMatchObject({ metric: "likes", isActive: false, count: 0 });
    await page.reload();
    await expect(page.getByRole("button", { name: "Like article" })).toHaveAttribute("aria-pressed", "false");

    let bookmarkButton = page.getByRole("button", { name: "Bookmark article" });
    const [bookmarkResponse] = await Promise.all([
      interactionResponse(page, "bookmark"),
      bookmarkButton.click(),
    ]);
    expect(await bookmarkResponse.json()).toMatchObject({
      metric: "bookmarks",
      isActive: true,
      count: 1,
    });
    bookmarkButton = page.getByRole("button", { name: "Remove article bookmark" });
    await expect(bookmarkButton).toHaveAttribute("aria-pressed", "true");
    await expect(bookmarkButton).toHaveCSS("color", "rgb(181, 139, 95)");
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove article bookmark" })).toBeVisible();

    let saveButton = page.getByRole("button", { name: "Save article" });
    const [saveResponse] = await Promise.all([
      interactionResponse(page, "save"),
      saveButton.click(),
    ]);
    expect(await saveResponse.json()).toMatchObject({ metric: "saved", isActive: true, count: 1 });
    saveButton = page.getByRole("button", { name: "Remove article from saved articles" });
    await expect(saveButton).toHaveAttribute("aria-pressed", "true");
    await expect(saveButton.locator("span")).toHaveText("Saved ✓");
    await expect(saveButton).toHaveCSS("color", "rgb(66, 108, 103)");
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove article from saved articles" })).toBeVisible();

    await page.evaluate(() => {
      history.replaceState(null, "", `${location.pathname}?utm=e2e#share`);
    });
    await page.getByRole("button", { name: "Share article" }).click();
    await expect(page.getByRole("status")).toContainText("Link copied.");
    expect(await page.evaluate(() => window.__e2eCopiedUrl)).toBe(
      `${new URL(page.url()).origin}/articles/${fixtures.articleSlug}`
    );

    await page.goto("/profile?tab=saved");
    await expect(page.getByRole("tab", { name: /Saved Articles/ })).toContainText("1");
    await expect(page.getByRole("tabpanel")).toContainText(fixtures.articleTitle);
    await page.getByRole("tab", { name: /Bookmarks/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText(fixtures.articleTitle);
    await page.getByRole("tab", { name: /Likes/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText("No likes yet");

    await openFixtureArticle(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const [progressResponse] = await Promise.all([
      page.waitForResponse((candidate) => (
        candidate.url().endsWith("/api/reader/progress") && candidate.request().method() === "POST"
      )),
      page.getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Articles", exact: true })
        .click(),
    ]);
    expect(progressResponse.status()).toBe(200);
    expect((await progressResponse.json()).data.furthestProgressPercent).toBeGreaterThan(0);
    await page.goto("/profile?tab=reading");
    await page.getByRole("tab", { name: /Completed \(1\)/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText(fixtures.articleTitle);

    await page.goto(`/articles/${fixtures.articleSlug}`);
    await page.evaluate(() => localStorage.setItem("myjourney-theme", "dark"));
    await page.reload();
    await expect(page.locator("body")).toHaveClass(/theme-dark/);
    await expect(page.getByRole("button", { name: "Remove article bookmark" })).toHaveCSS(
      "color",
      "rgb(181, 139, 95)"
    );
    await page.evaluate(() => localStorage.setItem("myjourney-theme", "light"));
    await page.reload();
    await expect(page.locator("body")).not.toHaveClass(/theme-dark/);
    await expect(page.getByRole("button", { name: "Remove article from saved articles" })).toHaveCSS(
      "color",
      "rgb(66, 108, 103)"
    );

    await page.getByRole("button", { name: /Open account menu/ }).click();
    const [logoutResponse] = await Promise.all([
      page.waitForResponse((candidate) => (
        candidate.url().endsWith("/api/auth/logout") && candidate.request().method() === "POST"
      )),
      page.getByRole("button", { name: "Sign Out" }).click(),
    ]);
    expect(logoutResponse.status()).toBe(200);
    await expect(page).toHaveURL("http://127.0.0.1:1235/");

    await login(page, fixtures.secondaryEmail);
    await page.goto(`/articles/${fixtures.articleSlug}`);
    await expect(page.getByRole("button", { name: "Like article" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Bookmark article" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Save article" })).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: /Open account menu/ }).click();
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("link", { name: /Sign In/i })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open mobile navigation drawer" }).click();
    const mobileDrawer = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(mobileDrawer).toBeVisible();
    const mobileCategories = mobileDrawer.getByRole("button", { name: "Categories", exact: true });
    await expect(mobileCategories).toBeVisible();
    await mobileCategories.click();
    await expect(mobileCategories).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "Close mobile menu" }).click();
    await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toHaveCount(0);

    expect(pageErrors).toEqual([]);
    const unexpectedFailures = failedResponses.filter((entry) => !(
      entry.includes("401 GET") && entry.includes("/api/auth/me")
      || entry.includes("401 POST") && entry.includes("/api/auth/refresh-token")
    ));
    const unexpectedConsoleErrors = consoleErrors.filter(
      (message) => !message.startsWith("Failed to load resource: the server responded with a status of")
    );
    expect({ unexpectedConsoleErrors, unexpectedFailures }).toEqual({
      unexpectedConsoleErrors: [],
      unexpectedFailures: [],
    });
  });
});
