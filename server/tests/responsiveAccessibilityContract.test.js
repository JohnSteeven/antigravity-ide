const fs = require("fs");
const path = require("path");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("responsive and accessibility contracts", () => {
  test("the application shell exposes a keyboard-visible skip target", () => {
    const app = read("src", "App.js");
    const css = read("index.css");
    expect(app).toContain('className="skip-link" href="#main-content"');
    expect(app).toContain('id="main-content" tabIndex="-1"');
    expect(css).toContain(".skip-link:focus");
  });

  test("shared modal focus management traps Tab, closes on Escape, locks scroll, and restores focus", () => {
    const hook = read("src", "hooks", "useDialogFocus.js");
    expect(hook).toContain('event.key === "Escape"');
    expect(hook).toContain('event.key !== "Tab"');
    expect(hook).toContain('document.body.style.overflow = "hidden"');
    expect(hook).toContain("previousFocusRef.current?.focus?.()");

    [
      ["src", "components", "Header.js"],
      ["src", "components", "LoginRequiredModal.js"],
      ["src", "components", "SubscriptionDashboard.jsx"],
      ["src", "components", "security", "ConfirmationModal.jsx"],
      ["src", "components", "cms", "ThemeBuilderModule.js"],
    ].forEach((parts) => expect(read(...parts)).toContain("useDialogFocus"));
  });

  test("the public mobile drawer remains in the accessibility tree and is Admin-honest", () => {
    const header = read("src", "components", "Header.js");
    expect(header).toContain('aria-controls="mobile-navigation-drawer"');
    expect(header).toContain('aria-modal="true"');
    expect(header).toContain('role="dialog"');
    expect(header).not.toMatch(/mobile-drawer-backdrop[\s\S]{0,160}aria-hidden="true"/);
    expect(header).toContain('user?.role === "Admin"');
    expect(header).not.toContain('user?.role === "Editor"');
    expect(header).toContain('className="header-logo-text"');
    expect(header).not.toMatch(/<h[12]>\{data\?\.site\?\.brand/);
  });

  test("the Home mobile composition keeps one representative card and removes decorative stack height", () => {
    const css = read("index.css");
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.hero-glass-card\.stack-card\.back-card-1,[\s\S]*?display: none !important/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.hero-card-stack \{[\s\S]*?min-height: 238px/);
    expect(css).toMatch(/\.mobile-menu-btn \{[\s\S]*?width: 44px !important;[\s\S]*?height: 44px !important/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("the Coding landing uses one compact top gutter instead of stacking page and hero padding", () => {
    const css = read("index.css");
    expect(css).toMatch(/\.coding-landing-page\s*\{[\s\S]*?padding-top:\s*clamp\(16px, 2vw, 28px\) !important/);
    expect(css).toMatch(/\.coding-landing-page \.coding-landing-hero\s*\{[\s\S]*?margin:\s*0 auto 30px !important;[\s\S]*?padding-top:\s*0 !important/);
    expect(css).not.toMatch(/\.coding-landing-page,\s*\.coding-landing-hero,[\s\S]*?padding-top:\s*50px !important/);
  });

  test("Coding article details do not stack hero and terminal top offsets", () => {
    const css = read("index.css");
    expect(css).toMatch(/\[data-experience="coding"\] \.coding-hero\s*\{[^}]*padding:\s*clamp\(16px, 2vw, 28px\) 24px 60px !important;[^}]*margin-top:\s*0 !important/);
    expect(css).toMatch(/\[data-experience="coding"\] \.coding-hero-container\s*\{[^}]*margin:\s*0 auto !important/);
    expect(css).not.toMatch(/\[data-experience="coding"\] \.coding-hero\s*\{[^}]*margin-top:\s*20px !important/);
  });

  test("the Coding comment submit action owns scoped interaction and mobile states", () => {
    const comments = read("src", "experiences", "shared", "widgets", "CommentsSection.js");
    const css = read("index.css");
    expect(comments).toMatch(/className="coding-submit-btn"\s+type="submit"\s*>/);
    expect(css).toMatch(/\[data-experience="coding"\] \.coding-comments-section \.comment-form\s*\{[^}]*background:\s*transparent !important/);
    expect(css).toContain('[data-experience="coding"] .coding-comments-section .coding-submit-btn:hover');
    expect(css).toContain('[data-experience="coding"] .coding-comments-section .coding-submit-btn:focus-visible');
    expect(css).toContain('[data-experience="coding"] .coding-comments-section .coding-submit-btn:disabled');
    expect(css).toMatch(/@media \(max-width: 480px\)\s*\{[\s\S]*?\.coding-submit-btn\s*\{[^}]*width:\s*100% !important/);
  });

  test("all Experience-category aliases use the compact responsive article banner", () => {
    const resolver = read("src", "experiences", "ExperienceResolver.js");
    const css = read("index.css");
    expect(resolver).toContain("experiences: IncidentsExperience");
    expect(resolver).toContain("experience: IncidentsExperience");
    expect(resolver).toContain('"real-life": IncidentsExperience');
    expect(css).toMatch(/\[data-experience="incidents"\] \.incidents-hero\.experience-hero\s*\{[^}]*min-height:\s*440px !important;[^}]*padding:\s*clamp\(28px, 3vw, 40px\) 0 !important/);
    expect(css).toMatch(/\[data-experience="incidents"\] \.experience-snapshot-strip\s*\{[^}]*display:\s*grid !important;[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\) !important/);
    expect(css).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.incidents-hero\.experience-hero\s*\{[^}]*min-height:\s*0 !important/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.experience-snapshot-strip\s*\{[^}]*grid-template-columns:\s*1fr !important/);
  });

  test("major feature styles define intentional desktop/tablet/mobile tiers", () => {
    const contracts = [
      [read("src", "features", "learn", "learn.css"), ["@media (min-width: 2400px)", "@media (max-width: 1023px)", "@media (max-width: 430px)"]],
      [read("src", "features", "creators", "creators.css"), ["@media (min-width: 2100px)", "@media (max-width: 820px)", "@media (max-width: 430px)"]],
      [read("src", "features", "life", "life.css"), ["@media (max-width: 960px)", "@media (max-width: 520px)"]],
      [read("src", "features", "premium", "premium.css"), ["@media (max-width: 820px)", "@media (max-width: 430px)"]],
      [read("src", "features", "agent", "agent.css"), ["@media (max-width: 960px)", "@media (max-width: 768px)"]],
      [read("src", "stories", "stories.css"), ["@media (max-width: 1024px)", "@media (max-width: 430px)"]],
      [read("src", "stories", "story-reader.css"), ["@media (max-width: 900px)", "@media (max-width: 640px)"]],
    ];

    contracts.forEach(([source, markers]) => markers.forEach((marker) => expect(source).toContain(marker)));
  });
});
