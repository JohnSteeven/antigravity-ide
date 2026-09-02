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
    expect(css).toContain("grid-template-columns: repeat(6, 1fr)");
    expect(app).toContain('className="life-mobile-capture"');
    expect(app).toContain("LifeCommandPalette");
    expect(app).toContain("LifeOfflineStatus");
  });

  test("the authenticated header compacts before its mobile switch", () => {
    const globalCss = read("index.css");
    expect(globalCss).toContain("(min-width: 1024px) and (max-width: 1120px)");
    expect(globalCss).toContain("@media (max-width: 1023px)");
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

  test("Today keeps one responsive surface for calm empty and active-day states", () => {
    const today = read("src/features/life/pages/TodayPage.jsx");
    expect(today).toContain('className="life-today-header"');
    expect(today).toContain('role="group" aria-label="Choose day"');
    expect(today).toContain('aria-current={today.isToday ? "date" : undefined}');
    expect(today).toContain('className="life-today-empty"');
    expect(today).toContain("Add today&apos;s action");
    expect(today).toMatch(/today\.timeline\.total === 0[\s\S]*periods\.map/);
    expect(today).toContain("summary.goals.length > 0");
    expect(today).toContain('aria-pressed={item.status === "completed"}');
    expect(css).toContain(".life-today-header .life-page-header h1");
    expect(css).toContain(".life-today-empty");
    expect(css).toContain("@media (max-width: 1100px)");
    expect(css).toContain("scroll-snap-type: x proximity");
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
