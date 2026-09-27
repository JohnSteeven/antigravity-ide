const { test, expect } = require("@playwright/test");

test.describe("Coding playground layout", () => {
  test("places code and output side by side on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/coding/playground");

    const workspace = page.locator(".cd-playground-workspace");
    const editor = page.locator(".cd-playground-pane--editor");
    const output = page.locator(".cd-playground-pane--output");
    const splitter = workspace.getByRole("separator");

    await expect(workspace).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(output).toBeVisible();
    await expect(splitter).toHaveAttribute("aria-orientation", "vertical");

    const modeSwitch = page.getByRole("group", { name: "Playground language mode" });
    const webMode = modeSwitch.getByRole("button", { name: "Web (HTML / CSS / JS)" });
    const pythonMode = modeSwitch.getByRole("button", { name: "Python (Pyodide)" });
    await expect(webMode).toHaveAttribute("aria-pressed", "true");
    await expect(pythonMode).toHaveAttribute("aria-pressed", "false");
    expect(await pythonMode.evaluate((button) => getComputedStyle(button).backgroundColor)).not.toBe("rgb(255, 255, 255)");

    const [editorBox, outputBox] = await Promise.all([editor.boundingBox(), output.boundingBox()]);
    expect(editorBox.x).toBeLessThan(outputBox.x);
    expect(Math.abs(editorBox.width - outputBox.width)).toBeLessThan(40);

    await page.getByRole("button", { name: "Maximize editor" }).click();
    await expect(output).toBeHidden();
    await page.getByRole("button", { name: "Restore workspace" }).click();
    await expect(output).toBeVisible();

    await pythonMode.click();
    await expect(pythonMode).toHaveAttribute("aria-pressed", "true");
    await expect(webMode).toHaveAttribute("aria-pressed", "false");
  });

  test("stacks the panes on compact screens without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/coding/playground");

    const workspace = page.locator(".cd-playground-workspace");
    const editor = page.locator(".cd-playground-pane--editor");
    const output = page.locator(".cd-playground-pane--output");
    const splitter = workspace.getByRole("separator");

    await expect(splitter).toHaveAttribute("aria-orientation", "horizontal");
    const [editorBox, outputBox] = await Promise.all([editor.boundingBox(), output.boundingBox()]);
    expect(editorBox.y).toBeLessThan(outputBox.y);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
