const fs = require("fs");
const path = require("path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", "..", relative), "utf8");

describe("Life rendering, responsive, and accessibility contract", () => {
  const app = read("src/features/life/LifeApp.jsx");
  const css = read("src/features/life/life.css");
  const ui = read("src/features/life/components/LifeUI.jsx");

  test("exposes one protected Life surface with all core sections", () => {
    const root = read("src/App.js");
    expect(root).toContain('path: "life/*"');
    expect(root).toMatch(/<ProtectedRoute>[\s\S]*<LifeApp/);
    ["today", "habits", "goals", "health", "money", "insights", "journal", "settings"].forEach((route) => expect(app).toContain(`path="${route}"`));
  });

  test("Life CSS is scoped and covers desktop, tablet, mobile, and narrow phones", () => {
    expect(css).toContain(".life-app");
    ["1180px", "960px", "760px", "520px", "360px"].forEach((width) => expect(css).toContain(`max-width: ${width}`));
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("grid-template-columns: repeat(5, 1fr)");
  });

  test("the authenticated header compacts before its mobile switch", () => {
    const globalCss = read("index.css");
    expect(globalCss).toContain("(min-width: 901px) and (max-width: 1120px)");
    expect(globalCss).toContain(".header-user-name");
  });

  test("reduced motion, keyboard focus, semantic dialogs, and live status are explicit", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(":focus-visible");
    expect(ui).toContain('role="dialog"');
    expect(ui).toContain('aria-modal="true"');
    expect(ui).toContain('event.key === "Escape"');
    expect(ui).toContain('event.key !== "Tab"');
    expect(ui).toContain('aria-live="polite"');
  });

  test("every functional screen supplies loading, error, or empty-state primitives", () => {
    ["TodayPage", "HabitsPage", "GoalsPage", "HealthPage", "MoneyPage", "JournalPage", "InsightsPage"].forEach((name) => {
      const source = read(`src/features/life/pages/${name}.jsx`);
      expect(source).toMatch(/LifeLoading|LifeEmpty/);
      expect(source).toMatch(/LifeError|LifeNotice/);
    });
  });

  test("health and money surfaces state their non-advisory boundaries", () => {
    const health = read("src/features/life/pages/HealthPage.jsx");
    expect(health).toContain("does not diagnose");
    expect(health).toContain("never recommend, alter, or infer medication instructions");
    expect(read("src/features/life/pages/MoneyPage.jsx")).toContain("not financial advice");
  });
});
