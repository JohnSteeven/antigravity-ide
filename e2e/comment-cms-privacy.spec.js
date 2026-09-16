const { test, expect } = require("@playwright/test");
const { fixtures } = require("./support/environment.cjs");

const login = async (page, email) => {
  await page.goto("/login");
  await page.locator("#login-identifier").fill(email);
  await page.locator("#login-password").fill(fixtures.password);
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/auth/login") && response.request().method() === "POST"),
    page.locator('button[type="submit"]').click(),
  ]);
};

test.describe.configure({ mode: "serial", timeout: 60_000 });

test("public comments expose only the minimal DTO and submission returns no private identifier", async ({ page }) => {
  const anonymous = await page.request.get(`/api/articles/${fixtures.articleId}/comments`);
  expect(anonymous.status()).toBe(200);
  const anonymousBody = await anonymous.json();
  for (const comment of anonymousBody.comments) {
    expect(Object.keys(comment).sort()).toEqual(["author", "body", "createdAt"]);
    expect(Object.keys(comment.author)).toEqual(["displayName"]);
  }

  await login(page, fixtures.primaryEmail);
  await page.goto(`/articles/${fixtures.articleSlug}`);
  await expect(page.getByRole("heading", { name: fixtures.articleTitle })).toBeVisible();
  await page.getByLabel("Comment").fill(`Browser privacy comment ${Date.now()}`);
  const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/articles/${fixtures.articleId}/comments`) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Submit Comment" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(await response.json()).toEqual({ status: "pending", message: "Comment submitted for moderation." });
  await expect(page.getByRole("status").filter({ hasText: "pending approval" })).toBeVisible();
});

test("protected CMS collections never persist and stale Admin responses cannot restore access after logout or role change", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("myjourney-content-data", JSON.stringify({ articles: [{ body: "private draft marker" }] })));
  await login(page, fixtures.adminEmail);
  await page.goto("/cms/articles");
  await expect(page.getByRole("heading", { name: "Articles & Drafts" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("myjourney-content-data"))).toBeNull();

  await page.route("**/api/articles/admin**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.goto("/");
  await page.getByRole("button", { name: /Open account menu/ }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => localStorage.getItem("myjourney-content-data"))).toBeNull();

  await login(page, fixtures.secondaryEmail);
  await page.goto("/cms/articles");
  await expect(page).not.toHaveURL(/\/cms\/articles/);
  expect(await page.evaluate(() => localStorage.getItem("myjourney-content-data"))).toBeNull();
  await expect(page.getByText("private draft marker")).toHaveCount(0);
});
