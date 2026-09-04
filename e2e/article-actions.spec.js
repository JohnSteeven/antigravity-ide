const { test, expect } = require("@playwright/test");
const { fixtures } = require("./support/environment.cjs");

const login = async (page) => {
  await page.goto("/login");
  await page.locator("#login-identifier").fill(fixtures.primaryEmail);
  await page.locator("#login-password").fill(fixtures.password);
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/auth/login") && response.status() === 200),
    page.getByRole("button", { name: "Start Reading" }).click(),
  ]);
};

const activate = async (page, buttonName, action, metric) => {
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => (
      candidate.url().endsWith(`/api/articles/${fixtures.articleId}/${action}`)
      && candidate.request().method() === "POST"
    )),
    page.getByRole("button", { name: buttonName }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    articleId: fixtures.articleId,
    metric,
    isActive: true,
    libraryItem: { id: fixtures.articleId },
  });
};

const deactivate = async (page, buttonName, action, metric) => {
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => (
      candidate.url().endsWith(`/api/articles/${fixtures.articleId}/${action}`)
      && candidate.request().method() === "POST"
    )),
    page.getByRole("button", { name: buttonName }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    articleId: fixtures.articleId,
    metric,
    isActive: false,
  });
};

test("Article listings exclude Stories and authenticated actions persist", async ({ page }) => {
  const listingResponse = await page.request.get("/api/articles?limit=48");
  expect(listingResponse.status()).toBe(200);
  const listing = await listingResponse.json();
  expect(listing.articles.length).toBeGreaterThan(0);
  expect(listing.articles.every((item) => item.contentType === "article")).toBe(true);

  await login(page);
  await page.goto(`/articles/${fixtures.articleSlug}`);
  await expect(page.getByRole("heading", { name: fixtures.articleTitle })).toBeVisible();

  await activate(page, "Like article", "like", "likes");
  await activate(page, "Bookmark article", "bookmark", "bookmarks");
  await activate(page, "Save article", "save", "saved");

  await expect(page.getByRole("button", { name: "Unlike article" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Remove article bookmark" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Remove article from saved articles" })).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByRole("button", { name: "Unlike article" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove article bookmark" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove article from saved articles" })).toBeVisible();

  // Leave shared deterministic fixtures in their baseline state for the wider journey.
  await deactivate(page, "Unlike article", "like", "likes");
  await deactivate(page, "Remove article bookmark", "bookmark", "bookmarks");
  await deactivate(page, "Remove article from saved articles", "save", "saved");
});
