/* Read-only browser presentation checks. Private Life states use intercepted
 * browser fixtures; they do not create sessions, entitlements, or database data.
 * Run against a built preview connected to the normal Mongo-backed API. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.UI_REVIEW_URL || "http://localhost:1240";
const output = path.resolve(".tmp/ui-presentation");
const pages = [
  ["home", "/", ".hero-title"],
  ["articles", "/articles", ".articles-hero"],
  ["life-category", "/category/life", "main h1"],
  ["travel-category", "/category/travel", "main h1"],
  ["stories", "/stories", "main h1"],
  ["creators", "/creators", ".creator-hero"],
  ["contact", "/contact", ".contact-title"],
  ["about", "/about", "main h1"],
  ["login", "/login", ".login-card-title"],
  ["learn", "/learn", ".learn-hero"],
  ["english", "/learn/courses?topic=english", ".learn-card"],
  ["course", "/learn/courses/everyday-professional-english", ".learn-course__header"],
  ["life-reader", "/articles/the-architecture-of-living-together", ".premium-article-prose"],
  ["travel-reader", "/articles/gokarna-and-the-north-karnataka-coast", ".premium-article-prose"],
  ["experience-reader", "/articles/changing-careers-in-midlife", ".premium-article-prose"],
  ["reflections-reader", "/articles/when-your-old-definition-of-success-stops-working", ".premium-article-prose"],
  ["lessons-reader", "/articles/the-skill-of-finishing", ".premium-article-prose"],
];

async function checkViewport(page, name, width, dark = false) {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.evaluate((dark) => document.body.classList.toggle("theme-dark", dark), dark);
  // Finish the app's color transitions before measuring contrast or capturing.
  await page.evaluate(async () => { await document.fonts.ready; document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${name}: horizontal overflow at ${width}`);
  await page.screenshot({ path: path.join(output, `${name}-${width}${dark ? "-dark" : ""}.png`), animations: "disabled" });
}

async function installLifeFixtures(page) {
  // Unauthenticated ancillary profile reads must not expire the browser-only
  // fixture identity. Preserve all other responses from the real API.
  await page.route("**/api/**", async (route) => {
    const response = await route.fetch();
    return response.status() === 401
      ? route.fulfill({ json: { data: {}, items: [] } })
      : route.fulfill({ response });
  });
  await page.route("**/api/auth/me", (r) => r.fulfill({ json: { user: { id: "ui-fixture", name: "Alex Reader", firstName: "Alex", role: "User" }, session: { authenticated: true } } }));
  await page.route("**/api/creators/capability", (r) => r.fulfill({ json: { data: { studioAvailable: false } } }));
  await page.route("**/api/reader/**", (r) => r.fulfill({ json: { data: {}, items: [] } }));
  await page.route("**/api/membership/me/entitlements", (r) => r.fulfill({ json: { data: { active: true, plan: "premium", entitlements: { life_access: true } } } }));
  await page.route("**/api/life/**", (r) => {
    const endpoint = new URL(r.request().url()).pathname;
    const modules = ["habits", "water", "sleep", "workouts", "money", "goals", "journal"];
    let data = { items: [] };
    if (endpoint.endsWith("/profile")) data = { timezone: "Asia/Kolkata", currency: "INR", unitSystem: "metric", waterUnit: "ml", weekStart: 1, visibleModules: modules, notifications: {}, onboarding: { completedAt: "2026-09-01" } };
    if (endpoint.endsWith("/today")) data = { isToday: true, localNow: { hour: 10 }, visibleModules: modules, summary: { planned: 0, completed: 0, partial: 0, water: { currentMl: 0, targetMl: 2000 }, sleep: {}, exercise: {}, spending: {}, goals: [] }, timeline: { total: 0, groups: {} }, reflection: { saved: false } };
    if (endpoint.endsWith("/reports")) data = { habits: {}, health: {}, money: {}, goals: [], insights: [], start: "2026-09-18", end: "2026-09-24" };
    return r.fulfill({ json: { success: true, data } });
  });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, route, selector] of pages) {
      await page.goto(base + route);
      await page.locator(selector).first().waitFor();
      await checkViewport(page, name, 1440);
      await checkViewport(page, name, 390);
      if (name.endsWith("reader")) {
        const tools = page.locator(".article-reading-tools details");
        assert.equal(await tools.getAttribute("open"), null, "Mobile reading tools should begin collapsed");
        await tools.locator("summary").click();
        assert.notEqual(await tools.getAttribute("open"), null);
        await tools.locator("summary").click();
        await checkViewport(page, name, 1440, true);
      }
      console.log(`PASS ${name}: desktop and mobile`);
    }
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(base + "/learn");
    const opener = page.getByRole("button", { name: /Explore Topics/ });
    await opener.click();
    const drawer = page.getByRole("dialog", { name: "Explore Topics" });
    await drawer.getByRole("searchbox", { name: "Search topics" }).fill("Coding");
    await drawer.getByRole("link", { name: "Coding", exact: true }).click();
    await page.waitForURL("**/learn/courses?topic=coding");
    await drawer.waitFor({ state: "hidden" });
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
    await opener.click();
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    assert.equal(await opener.evaluate((el) => el === document.activeElement), true);
    await checkViewport(page, "learn-narrow", 320);

    // A public preview lesson exercises the non-coding reader without enrollment.
    await page.goto(base + "/learn/courses/everyday-professional-english");
    await page.locator(".learn-module a").first().click();
    await page.locator(".learn-lesson__reader").waitFor();
    await checkViewport(page, "lesson", 1440);
    await checkViewport(page, "lesson", 390);
    assert.equal(await page.locator('.learn-reading-outline a[aria-current="page"]').count(), 1);

    await installLifeFixtures(page);
    for (const name of ["today", "habits", "goals", "health", "money", "journal", "insights", "settings"]) {
      await page.goto(base + "/life/" + name);
      await page.locator(".life-page-header h1").waitFor();
      await checkViewport(page, "life-" + name, 1440);
      await checkViewport(page, "life-" + name, 390);
      await checkViewport(page, "life-" + name, 1440, true);
      if (await page.locator(".life-card").count()) {
        assert.equal(await page.locator(".life-card").first().evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(32, 47, 38)", "Life cards must use the dark surface");
      }
      console.log(`PASS Life ${name}: desktop, mobile, dark (browser fixture)`);
    }
    await page.goto(base + "/life/habits");
    const newHabit = page.getByRole("button", { name: "New habit", exact: true });
    await newHabit.click();
    await page.getByRole("dialog").waitFor();
    await checkViewport(page, "life-dialog", 390, true);
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await newHabit.evaluate((el) => el === document.activeElement), true);
    await page.unroute("**/api/membership/me/entitlements");
    await page.route("**/api/membership/me/entitlements", (r) => r.fulfill({ json: { data: { active: false, entitlements: {} } } }));
    await page.goto(base + "/life");
    await page.locator(".premium-life-intro").waitFor();
    await checkViewport(page, "life-intro", 1440);
    await checkViewport(page, "life-intro", 390);
    await checkViewport(page, "life-intro", 1440, true);
    assert.deepEqual(errors, [], "Unexpected browser errors");
    console.log(`PASS presentation smoke; screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
