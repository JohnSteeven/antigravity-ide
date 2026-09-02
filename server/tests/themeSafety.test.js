const {
  analyzeThemeAccessibility,
  assertThemePayload,
  contrastRatio,
} = require("../services/themeSafety");
const fs = require("fs");
const path = require("path");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);

describe("theme safety contract", () => {
  test("rejects raw custom code and CSS token breakout attempts", () => {
    expect(() => assertThemePayload({ customCSS: "body { display: none }" }))
      .toThrow(/Raw theme CSS/);
    expect(() => assertThemePayload({ customJS: "alert(1)" }))
      .toThrow(/Raw theme CSS/);
    expect(() => assertThemePayload({
      tokens: { colors: { text: "red; } body { display:none" } },
    })).toThrow(/not an allowed CSS value/);
    expect(() => assertThemePayload({ status: "active-and-unreviewed" }))
      .toThrow(/Unsupported theme status/);
  });

  test("calculates WCAG contrast and suggests a safe foreground", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    const report = analyzeThemeAccessibility({
      mode: "light",
      tokens: {
        colors: {
          background: "#ffffff",
          surface: "#ffffff",
          text: "#fefefe",
          muted: "#eeeeee",
          primary: "#eeeeee",
        },
      },
    });
    expect(report.pass).toBe(false);
    expect(report.warnings[0]).toMatchObject({
      pair: "text/background",
      pass: false,
      suggestedForeground: "#111827",
    });
  });

  test("treats panel and muted normal-text contrast as activation blockers", () => {
    const report = analyzeThemeAccessibility({
      mode: "light",
      tokens: {
        colors: {
          background: "#ffffff",
          surface: "#ffffff",
          panel: "#ffffff",
          text: "#111827",
          muted: "#eeeeee",
        },
      },
    });

    expect(report.pass).toBe(false);
    expect(report.pairs).toEqual(expect.arrayContaining([
      expect.objectContaining({ pair: "text/panel", critical: true, pass: true }),
      expect.objectContaining({ pair: "muted/background", critical: true, pass: false }),
      expect.objectContaining({ pair: "muted/surface", critical: true, pass: false }),
      expect.objectContaining({ pair: "muted/panel", critical: true, pass: false }),
    ]));
  });
});

describe("theme service hardening", () => {
  const loadService = () => {
    jest.resetModules();
    const Theme = {
      countDocuments: jest.fn(),
      insertMany: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    jest.doMock("../models/Theme", () => Theme);
    return { Theme, ThemeService: require("../services/themeService") };
  };

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test("never emits stored custom CSS or unsafe legacy token values", () => {
    const { ThemeService } = loadService();
    const css = ThemeService.generateCSSVariables({
      mode: "light",
      customCSS: "body { display: none }",
      tokens: { colors: { text: "red; } body { visibility:hidden" } },
    });

    expect(css).not.toContain("display: none");
    expect(css).not.toContain("visibility:hidden");
    expect(css).toContain("--text-primary: #2f3133");
    expect(css).toContain("--surface-page: #fbfaf7");
    expect(css).toContain("--surface-light-fixed: #faf8f5");
    expect(css).toContain("--text-on-dark: #f8f4ed");
    expect(css).toContain("--article-card-surface: #ffffff");
  });

  test("scopes generated Dark tokens to the active body mode", () => {
    const { ThemeService } = loadService();
    const css = ThemeService.generateCSSVariables({ mode: "dark", tokens: {} });

    expect(css).toMatch(/body\.theme-dark\s*\{/);
    expect(css).not.toMatch(/:root\s*,\s*body\.theme-dark/);
  });

  test("does not clear the current default when the requested theme is missing", async () => {
    const { Theme, ThemeService } = loadService();
    Theme.findById.mockResolvedValue(null);

    await expect(ThemeService.setActiveTheme("missing", "admin")).resolves.toBeNull();
    expect(Theme.updateMany).not.toHaveBeenCalled();
  });

  test("blocks activation when critical foreground/background contrast fails", async () => {
    const { Theme, ThemeService } = loadService();
    Theme.findById.mockResolvedValue({
      mode: "light",
      tokens: { colors: { text: "#ffffff", background: "#ffffff", surface: "#ffffff" } },
      save: jest.fn(),
    });

    await expect(ThemeService.setActiveTheme("unsafe", "admin")).rejects.toMatchObject({
      status: 422,
      code: "THEME_CONTRAST_UNSAFE",
    });
    expect(Theme.updateMany).not.toHaveBeenCalled();
  });

  test("activates a safe target before clearing other defaults", async () => {
    const { Theme, ThemeService } = loadService();
    const order = [];
    const theme = {
      _id: "safe-theme",
      mode: "light",
      tokens: { colors: { text: "#111827", background: "#ffffff", surface: "#ffffff" } },
      save: jest.fn(async () => { order.push("save-target"); }),
    };
    Theme.findById.mockResolvedValue(theme);
    Theme.updateMany.mockImplementation(async () => { order.push("clear-others"); });

    await expect(ThemeService.setActiveTheme("safe-theme", "admin")).resolves.toBe(theme);
    expect(order).toEqual(["save-target", "clear-others"]);
    expect(Theme.updateMany).toHaveBeenCalledWith(
      { _id: { $ne: "safe-theme" } },
      { $set: { isDefault: false } }
    );
  });
});

describe("theme client contract", () => {
  test("preview uses textContent, supports Light/Dark, and restores the active theme", () => {
    const context = fs.readFileSync(workspaceFile("src", "context", "ThemeContext.jsx"), "utf8");
    const builder = fs.readFileSync(workspaceFile("src", "components", "cms", "ThemeBuilderModule.js"), "utf8");
    const clientSafety = fs.readFileSync(workspaceFile("src", "utils", "themeSafety.js"), "utf8");
    const css = fs.readFileSync(workspaceFile("index.css"), "utf8");

    expect(context).toContain("styleEl.textContent = cssString");
    expect(context).not.toContain("styleEl.innerHTML");
    expect(context).toContain("resetThemePreview");
    expect(context).toContain("themeObj?.mode");
    expect(context).toContain("classList.toggle('theme-dark'");
    expect(clientSafety).toContain('mode === "dark" ? "body.theme-dark" : ":root"');
    expect(builder).toContain("Preview Light");
    expect(builder).toContain("Preview Dark");
    expect(builder).toContain("Accessibility contrast");
    expect(builder).toContain("'text', 'muted', 'border'");
    expect(builder).toContain("THEME_COLOR_DEFAULTS[editorMode]");
    expect(builder).not.toContain("Custom CSS Overrides");
    expect(css).toContain("--surface-page");
    expect(css).toContain("--text-primary");
    expect(css).toContain("--accent-contrast");
  });
});
