const { test, expect } = require("@playwright/test");

test.describe("Coding lesson sections", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("CSS concept, hint navigation, and graded quiz feedback stay in the lesson panel", async ({ page }) => {
    await page.goto("/coding/css");
    await page.locator(".coding-lesson-item a").first().click();

    await expect(page.locator(".cd-zone-center__title")).toContainText("What CSS Is");
    await expect(page.locator(".cd-zone-sidebar")).toBeHidden();
    await expect(page.getByRole("tab", { name: /Concept/ }).first()).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".cd-zone-center__content")).toContainText("Cascading Style Sheets");
    await expect(page.locator(".cd-output-tabs [role='tab']")).toHaveCount(3);
    await expect(page.locator(".cd-output-tabs")).not.toContainText("Quiz");

    const tabStrip = page.locator(".cd-zone-center__tabs");
    const beforeScroll = await tabStrip.evaluate((element) => element.scrollLeft);
    await page.getByRole("button", { name: "Scroll lesson tabs right" }).click();
    await expect.poll(() => tabStrip.evaluate((element) => element.scrollLeft)).toBeGreaterThan(beforeScroll);
    await page.getByRole("tab", { name: /Hints/ }).click();
    await expect(page.getByRole("button", { name: /Open Hint Guide/ })).toBeVisible();
    await page.getByRole("button", { name: /Open Hint Guide/ }).click();
    await expect(page.getByRole("dialog", { name: /Hint 1 of/ })).toBeVisible();
    await page.getByRole("button", { name: "Close hint modal" }).click();

    await page.getByRole("tab", { name: "Quiz" }).click();
    const firstOption = page.locator(".cd-lesson-quiz .learn-quiz__option").first();
    await firstOption.click();
    const selectedQuestionId = await page.locator(".cd-lesson-quiz input:checked").first().getAttribute("name");
    const questionId = selectedQuestionId.replace("quiz-q-", "");
    // Exercise the browser's grading feedback; server grading is covered by Learn Jest tests.
    await page.route("**/quiz/evaluate", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          passed: true,
          score: 100,
          bestScore: 100,
          attempts: 1,
          results: [{ questionId, correct: true, correctOptionIndex: 0, explanation: "Correct." }],
        },
      }),
    }));
    await page.getByRole("button", { name: "Submit Quiz" }).click();
    await expect(page.locator(".learn-quiz__question-result")).toContainText("Correct");
    await expect(page.locator(".learn-quiz__option-check")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Quiz passed/i })).toBeVisible();
    await page.locator(".learn-quiz__result-summary").scrollIntoViewIfNeeded();
    await expect(page.locator(".learn-quiz__result-summary")).toBeInViewport();
    await page.screenshot({ path: ".tmp/coding-css-quiz-mobile.png" });

    await page.getByRole("tab", { name: "Concept", exact: true }).click();
    await expect.poll(() => page.locator(".cd-zone-center__content").evaluate((element) => element.scrollTop)).toBe(0);
    await page.screenshot({ path: ".tmp/coding-css-concept-mobile.png" });
    await page.getByRole("tab", { name: /Quiz passed/i }).click();
    await expect(page.locator(".learn-quiz__question-result")).toContainText("Correct");
    await expect(page.locator(".cd-lesson-quiz input:checked")).toHaveCount(1);
  });
});

test.describe("Coding lesson desktop layout", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("keeps the lesson quiz and hints in the learning pane", async ({ page }) => {
    await page.goto("/coding/css");
    await page.locator(".coding-lesson-item a").first().click();

    await expect(page.locator(".cd-zone-center")).toBeVisible();
    await expect(page.locator(".cd-zone-sidebar")).toBeVisible();
    await expect(page.locator(".cd-zone-center__content")).toContainText("Cascading Style Sheets");
    await page.getByRole("button", { name: "Scroll lesson tabs right" }).click();
    await page.getByRole("tab", { name: /Hints/ }).click();
    await expect(page.getByRole("button", { name: /Open Hint Guide/ })).toBeVisible();
    await page.getByRole("tab", { name: "Quiz" }).click();
    await expect(page.locator(".cd-lesson-quiz .learn-quiz__question")).toBeVisible();
    await expect(page.locator(".cd-output-tabs")).not.toContainText("Quiz");
    await page.screenshot({ path: ".tmp/coding-css-quiz-desktop.png" });
  });
});
