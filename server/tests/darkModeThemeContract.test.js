const fs = require("fs");
const path = require("path");
const { contrastRatio } = require("../services/themeSafety");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const read = (...parts) => fs.readFileSync(workspaceFile(...parts), "utf8");

describe("Dark Mode surface-authority contract", () => {
  const indexCss = read("index.css");
  const learnCss = read("src", "features", "learn", "learn.css");
  const creatorCss = read("src", "features", "creators", "creators.css");
  const creatorStudio = read("src", "features", "creators", "CreatorStudio.jsx");
  const storiesCss = read("src", "stories", "stories.css");
  const storyReaderCss = read("src", "stories", "story-reader.css");

  test("fixed Light and Dark surfaces expose explicit semantic foregrounds", () => {
    expect(indexCss).toContain("--surface-light-fixed: #faf8f5");
    expect(indexCss).toContain("--surface-dark-fixed: #131716");
    expect(indexCss).toContain("--text-on-light: #2f3133");
    expect(indexCss).toContain("--text-on-dark: #f8f4ed");

    expect(contrastRatio("#2f3133", "#faf8f5")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#555956", "#faf8f5")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#f8f4ed", "#131716")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#c3ccc8", "#131716")).toBeGreaterThanOrEqual(4.5);
  });

  test("the warm home hero keeps Dark Mode text and actions tied to its Light surface", () => {
    expect(indexCss).toMatch(/body\.theme-dark \.hero\s*\{[\s\S]*?--hero-surface-text:\s*var\(--text-on-light/);
    expect(indexCss).toMatch(/body\.theme-dark \.hero \.hero-title\s*\{[\s\S]*?color:\s*var\(--hero-surface-text\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.hero \.hero-description\s*\{[\s\S]*?color:\s*var\(--hero-surface-muted\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.hero \.primary-btn\s*\{[\s\S]*?background:\s*var\(--hero-surface-text\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.hero \.secondary-btn\s*\{[\s\S]*?color:\s*var\(--hero-surface-text\)/);
  });

  test("category headings and the navigation mega-menu follow their owning surfaces", () => {
    expect(indexCss).toMatch(/body\.theme-dark \.categories-section \.categories-heading\s*\{[\s\S]*?--text-on-dark/);
    expect(indexCss).toMatch(/body\.theme-dark \.categories-section \.categories-subheading\s*\{[\s\S]*?--text-on-dark-muted/);
    expect(indexCss).toContain("--mega-menu-surface:");
    expect(indexCss).toContain("--mega-menu-text:");
    expect(indexCss).toContain("--mega-menu-muted:");
    expect(indexCss).toMatch(/body\.theme-dark \.categories-mega-menu\s*\{[\s\S]*?--mega-menu-surface:\s*var\(--surface-light-fixed/);
    expect(indexCss).toMatch(/body\.theme-dark \.categories-mega-menu\s*\{[\s\S]*?--mega-menu-text:\s*var\(--text-on-light/);
    expect(indexCss).toMatch(/body\.theme-dark \.mega-menu-item-icon\s*\{[\s\S]*?color:\s*var\(--mega-menu-icon-text\)/);
    expect(indexCss).toMatch(/\.categories-mega-menu \.mega-menu-item-desc[\s\S]*?color:\s*var\(--mega-menu-muted\)/);
    expect(indexCss).toMatch(/\.categories-mega-menu \.mega-menu-all-link\s*\{[^}]*color:\s*var\(--mega-menu-accent\) !important/);
    expect(indexCss).toContain("body.theme-dark .desktop-nav .nav-links > li > a");
    expect(indexCss).not.toContain("body.theme-dark .desktop-nav .nav-links a,");
    expect(contrastRatio("#2f3133", "#faf8f5")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#555956", "#faf8f5")).toBeGreaterThanOrEqual(4.5);
  });

  test("one Article card hierarchy covers DefaultCard and the specialized LifeCard", () => {
    const resolver = read("src", "components", "cards", "CardResolver.js");
    const lifeCard = read("src", "components", "cards", "life", "LifeCard.js");

    expect(resolver).toContain("const CARD_MAP");
    expect(resolver).toContain("life: LifeCard");
    expect(resolver).toContain("CARD_MAP[slug] || DefaultCard");
    expect(lifeCard).toContain('className="article-card life-card"');
    expect(indexCss).toMatch(/body\.theme-dark \.article-card\.life-card[\s\S]*?--article-card-surface/);
    expect(indexCss).toContain(".life-card-title a");
    expect(indexCss).toContain(".life-card-excerpt");
    expect(indexCss).toContain(".life-author-meta .author-name");
    expect(indexCss).toContain(".life-read-btn");
    expect(contrastRatio("#f8f4ed", "#1d2422")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#b8c2be", "#1d2422")).toBeGreaterThanOrEqual(4.5);
  });

  test("Coding keeps blue identity without overriding the common Dark Article body", () => {
    expect(indexCss).toMatch(/body:not\(\.theme-dark\) \.coding-landing-page:not\(\.dark-mode\) \.article-card\s*\{[^}]*--article-card-surface:\s*#f7faff !important;[^}]*--article-card-accent:\s*#2563eb !important/);
    const codingDarkRule = indexCss.match(/\.coding-landing-page\.dark-mode \.article-card,\s*body\.theme-dark \.coding-landing-page \.article-card\s*\{([^}]*)\}/)?.[1] || "";
    expect(codingDarkRule).toContain("--article-card-accent: #58a6ff !important");
    expect(codingDarkRule).not.toMatch(/--article-card-(?:surface|text|secondary|muted|border):/);
    expect(indexCss).toMatch(/\.coding-landing-page \.article-card :is\(\.article-tag, \.article-tags span\)[^}]*color:\s*var\(--article-card-accent\) !important/);
    expect(indexCss).toMatch(/\.coding-comments-section \.coding-submit-btn\s*\{[^}]*background:\s*linear-gradient\(135deg, #0969da 0%, #2563eb 100%\) !important/);
    expect(contrastRatio("#0f172a", "#f7faff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#58a6ff", "#1d2422")).toBeGreaterThanOrEqual(4.5);
  });

  test("all category Article-card variants resolve through the common Dark hierarchy", () => {
    const resolver = read("src", "components", "cards", "CardResolver.js");
    const defaultBackedVariants = ["coding", "experiences", "reflections", "lessons", "travel", "news"];

    expect(resolver).toContain("incidents: ExperiencesCard");
    defaultBackedVariants.forEach((variant) => {
      const componentName = `${variant[0].toUpperCase()}${variant.slice(1)}Card.js`;
      expect(read("src", "components", "cards", variant, componentName)).toContain("DefaultCard");
    });
    expect(indexCss).toMatch(/body\.theme-dark \.article-card,[\s\S]*?background:\s*var\(--article-card-surface/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-card :is\(\.article-text, \.life-card-excerpt\)[\s\S]*?var\(--article-card-secondary/);
  });

  test("legacy Life and editorial selectors cannot outrank the shared Dark Article-card contract", () => {
    const sharedContractIndex = indexCss.indexOf("/* 2. Article cards use one Dark Mode surface contract.");
    expect(sharedContractIndex).toBeGreaterThan(indexCss.lastIndexOf(".life-card {", sharedContractIndex));
    expect(sharedContractIndex).toBeGreaterThan(indexCss.lastIndexOf(".article-card {", sharedContractIndex));
    expect(indexCss.slice(sharedContractIndex)).not.toMatch(/body\.theme-dark[^{}]*(?:life|incidents|lessons|editorial)[^{}]*\.article-card[^{}]*\{[^}]*--article-card-(?:surface|text|secondary|muted):/i);
  });

  test("reusable Dark detail cards bind both surface and hierarchy to Dark tokens", () => {
    const authorCard = read("src", "experiences", "shared", "widgets", "AuthorCard.js");
    const shareButtons = read("src", "experiences", "shared", "widgets", "ShareButtons.js");
    const newsletter = read("src", "experiences", "shared", "widgets", "NewsletterPanel.js");

    [authorCard, shareButtons, newsletter].forEach((source) => {
      expect(source).toContain("detail-card--dark");
    });
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--dark\s*\{[^}]*background:\s*var\(--surface-card\) !important;[^}]*color:\s*var\(--text-primary\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--dark :is\(h2, h3, h4, strong\)\s*\{[^}]*var\(--text-primary\)/);
  });

  test("fixed-Light exceptions and Dark story rails bind to their own foregrounds", () => {
    const lifeSidebar = read("src", "experiences", "life", "LifeRightSidebar.js");
    const incidentsLeft = read("src", "experiences", "incidents", "IncidentsLeftSidebar.js");
    const incidentsRight = read("src", "experiences", "incidents", "IncidentsRightSidebar.js");

    expect(lifeSidebar).toContain("detail-card--light related-reflections-panel");
    expect(incidentsLeft).toContain("incidents-sticky-box detail-dark-sidebar");
    expect(incidentsRight).toContain("incidents-sticky-box detail-dark-sidebar");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--light\s*\{[^}]*background:\s*var\(--surface-light-fixed\)[^}]*color:\s*var\(--text-on-light\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-dark-sidebar \.incidents-sidebar-panel\s*\{[^}]*background:\s*var\(--surface-card\)[^}]*color:\s*var\(--text-primary\)/);
  });

  test("Dark comments use matching textarea, placeholder, card, and submit contracts", () => {
    const comments = read("src", "experiences", "shared", "widgets", "CommentsSection.js");

    expect(comments).toContain("premium-comments-section detail-comments");
    expect(comments).toContain("coding-comments-section detail-comments");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-comments \.comment-form textarea\s*\{[^}]*background:\s*var\(--surface-dark-fixed\)[^}]*color:\s*var\(--text-on-dark\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-comments \.comment-form textarea::placeholder\s*\{[^}]*color:\s*var\(--text-on-dark-muted\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-comments \.comment-form \.detail-primary-action\s*\{[^}]*background:\s*var\(--article-detail-action\)[^}]*color:\s*var\(--article-detail-action-text\)/);
  });

  test("Related Reflections keeps a fixed-Light surface with dark foregrounds", () => {
    const lifeSidebar = read("src", "experiences", "life", "LifeRightSidebar.js");

    expect(lifeSidebar).toContain("Related Reflections");
    expect(lifeSidebar).toContain("related-reflections-panel");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--light :is\(h2, h3, h4, strong, \.related-story-row strong\)\s*\{[^}]*color:\s*var\(--text-on-light\)/);
  });

  test("Experience chapter, summary, milestone, and navigation items use readable Dark-card foregrounds", () => {
    const incidentsLeft = read("src", "experiences", "incidents", "IncidentsLeftSidebar.js");
    const incidentsRight = read("src", "experiences", "incidents", "IncidentsRightSidebar.js");
    const darkRailContract = indexCss.slice(indexCss.indexOf("body.theme-dark .article-detail-theme--standard .detail-dark-sidebar .incidents-sidebar-panel :is("));

    expect(incidentsLeft).toContain("Story Chapters");
    expect(incidentsLeft).toContain('aria-current={isCurrent ? "location" : undefined}');
    expect(incidentsRight).toContain("Story Summary");
    expect(incidentsLeft).toContain("Turning Milestones");
    expect(incidentsLeft).toContain("Story Navigation");
    [".step-title", ".summary-bullets-list li", ".magazine-milestone-body h4", ".incidents-toc-link"].forEach((selector) => {
      expect(darkRailContract).toContain(selector);
    });
    expect(darkRailContract).toContain("color: var(--text-primary) !important");
    expect(darkRailContract).toContain("color: var(--text-secondary) !important");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-dark-sidebar \.apple-timeline-node:is\(:hover, :focus-visible, \.active\) \.step-title\s*\{[^}]*color:\s*var\(--text-primary\)/);
  });

  test("Experience collection names, Topics, and Core Insight retain readable local contracts", () => {
    const incidentsRight = read("src", "experiences", "incidents", "IncidentsRightSidebar.js");

    expect(incidentsRight).toContain("Core Insight");
    expect(incidentsRight).toContain("Related Topics");
    expect(incidentsRight).toContain("Curated Collections");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-dark-sidebar \.incidents-sidebar-panel :is\([\s\S]*?\.collection-name,[\s\S]*?\)\s*\{[\s\S]*?color:\s*var\(--text-primary\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-dark-sidebar :is\(\.topic-tag-pill, \.collection-item, \.emotional-glass-node\)\s*\{[^}]*background:\s*var\(--surface-dark-fixed\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-dark-sidebar \.soft-gradient-quote-widget :is\(blockquote p, blockquote cite\)\s*\{[^}]*color:\s*var\(--text-secondary\)/);
    expect(contrastRatio("#c3ccc8", "#1d2422")).toBeGreaterThanOrEqual(4.5);
  });

  test("Incident, Life, and Travel detail canvases replace fixed Light local tokens in Dark Mode", () => {
    ["incidents", "life", "travel"].forEach((experience) => {
      expect(indexCss).toMatch(new RegExp(`body\\.theme-dark \\[data-experience="${experience}"\\]\\s*\\{[\\s\\S]*?background-color:\\s*var\\(--${experience}-bg\\) !important`));
    });

    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="incidents"\]\s*\{[^}]*--incidents-bg:\s*var\(--article-detail-page\) !important;[^}]*--incidents-card-bg:\s*var\(--article-detail-card\) !important;[^}]*--incidents-text:\s*var\(--article-detail-text\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="life"\]\s*\{[^}]*--life-bg:\s*var\(--article-detail-page\) !important;[^}]*--life-card-bg:\s*var\(--article-detail-card\) !important;[^}]*--life-text:\s*var\(--article-detail-text\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="travel"\]\s*\{[^}]*--travel-bg:\s*var\(--article-detail-page\) !important;[^}]*--travel-card-bg:\s*var\(--article-detail-card\) !important;[^}]*--travel-text:\s*var\(--article-detail-text\) !important/);
  });

  test("every non-Coding Article renderer opts into one standard root while Coding owns a separate boundary", () => {
    const standardRoots = [
      ["default", "DefaultExperience.js"],
      ["life", "LifeExperience.js"],
      ["travel", "TravelExperience.js"],
      ["incidents", "IncidentsExperience.js"],
    ];

    standardRoots.forEach(([folder, file]) => {
      expect(read("src", "experiences", folder, file)).toContain("article-detail-theme--standard");
    });
    expect(read("src", "experiences", "coding", "CodingExperience.js")).toContain("article-detail-theme--coding");
    expect(read("src", "experiences", "lessons", "LessonsExperience.js")).toContain("LifeExperience");
    expect(indexCss).toMatch(/body\.theme-dark:has\(\.article-detail-theme--standard\)\s*\{[^}]*background:\s*var\(--surface-page\)/);
    expect(indexCss).not.toMatch(/\.article-detail-theme--standard[^{}]*\.article-detail-theme--coding/);
  });

  test("the standard root centralizes page, card, text, input, placeholder, border, and action roles", () => {
    const standardRoot = indexCss.match(/body\.theme-dark \.article-detail-theme--standard\s*\{([^}]*)\}/)?.[1] || "";
    [
      "--article-detail-page: var(--surface-page)",
      "--article-detail-card: var(--surface-card)",
      "--article-detail-card-subtle: var(--surface-subtle)",
      "--article-detail-text: var(--text-primary)",
      "--article-detail-secondary: var(--text-secondary)",
      "--article-detail-muted: var(--text-muted)",
      "--article-detail-border: var(--border-subtle)",
      "--article-detail-input: var(--surface-dark-fixed)",
      "--article-detail-input-text: var(--text-on-dark)",
      "--article-detail-placeholder: var(--text-on-dark-muted)",
      "--article-detail-action: var(--accent-primary)",
      "--article-detail-action-text: var(--accent-contrast)",
    ].forEach((contract) => expect(standardRoot).toContain(contract));
  });

  test("Reflection Note, author history, Watch/Audio resources, and Related Reflections declare fixed-Light ownership", () => {
    const lifeLeft = read("src", "experiences", "life", "LifeLeftSidebar.js");
    const lifeRight = read("src", "experiences", "life", "LifeRightSidebar.js");
    const lifeBottom = read("src", "experiences", "life", "LifeBottomSection.js");

    expect(lifeLeft).toContain("life-sidebar-quote-panel detail-card detail-card--light");
    expect(lifeRight).toContain("life-author-journey-box detail-card detail-card--light");
    expect(lifeRight).toContain("related-reflections-panel");
    expect(lifeBottom.match(/media-box detail-card detail-card--light/g)).toHaveLength(2);
    expect(indexCss).toMatch(/article-detail-theme--standard\[data-experience="life"\][\s\S]*?\.life-sidebar-quote-panel,[\s\S]*?\.life-author-journey-box,[\s\S]*?\.life-media-strip \.media-box,[\s\S]*?\.related-reflections-panel[\s\S]*?color:\s*var\(--text-on-light-muted\)/);
  });

  test("normal nested TOC items are not faded in Dark Mode and no longer use inline opacity", () => {
    const defaultExperience = read("src", "experiences", "default", "DefaultExperience.js");
    const lifeLeft = read("src", "experiences", "life", "LifeLeftSidebar.js");

    expect(defaultExperience).toContain("toc-link--nested");
    expect(lifeLeft).toContain("life-toc-link--nested");
    expect(defaultExperience).not.toContain("opacity: 0.8");
    expect(lifeLeft).not.toContain("opacity: 0.8");
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard :is\(\.toc-link--nested, \.life-toc-link--nested\)\s*\{[^}]*color:\s*var\(--article-detail-secondary\)[^}]*opacity:\s*1 !important/);
  });

  test("Newsletter, Comments, notes, and share-story controls use the standard action/form roles", () => {
    const newsletter = read("src", "experiences", "shared", "widgets", "NewsletterPanel.js");
    const comments = read("src", "experiences", "shared", "widgets", "CommentsSection.js");
    const lifeLeft = read("src", "experiences", "life", "LifeLeftSidebar.js");
    const incidentsBottom = read("src", "experiences", "incidents", "IncidentsBottomSection.js");

    [newsletter, comments, lifeLeft, incidentsBottom].forEach((source) => {
      expect(source).toContain("detail-primary-action");
    });
    expect(indexCss).toMatch(/article-detail-theme--standard \.detail-primary-action\s*\{[^}]*background:\s*var\(--article-detail-action\)[^}]*color:\s*var\(--article-detail-action-text\)/);
    expect(indexCss).toMatch(/article-detail-theme--standard \.newsletter-panel input\[type="email"\][\s\S]*?background:\s*var\(--article-detail-input\)[\s\S]*?color:\s*var\(--article-detail-input-text\)/);
    expect(indexCss).toMatch(/article-detail-theme--standard\[data-experience="incidents"\] \.user-story-form-box textarea[\s\S]*?background:\s*var\(--article-detail-input\)/);
  });

  test("Default, Incident, Life, and Travel module families expose explicit Dark foreground contracts", () => {
    const requestedAreas = [
      "data-experience=\"default\"",
      ".premium-article-prose",
      ".detail-dark-sidebar",
      ".step-title",
      ".summary-bullets-list li",
      ".magazine-milestone-body h4",
      ".incidents-toc-link",
      ".soft-gradient-quote-widget",
      ".collection-item",
      ".life-sidebar-quote-panel",
      ".life-author-journey-box",
      ".life-media-strip .media-box",
      ".newsletter-panel",
      ".detail-comments",
      ".detail-primary-action",
      ".toc-link--nested",
      ".life-takeaways-card",
      ".travel-summary-card",
    ];

    expect(requestedAreas).toHaveLength(18);
    requestedAreas.forEach((selector) => expect(indexCss).toContain(selector));
  });

  test("representative standard detail text, input, placeholder, action, and fixed-Light pairs meet WCAG text contrast", () => {
    [
      ["#f8f4ed", "#131716"],
      ["#c3ccc8", "#131716"],
      ["#f8f4ed", "#1d2422"],
      ["#c3ccc8", "#1d2422"],
      ["#f8f4ed", "#151b1a"],
      ["#c3ccc8", "#151b1a"],
      ["#111827", "#7bb8b2"],
      ["#2f3133", "#faf8f5"],
      ["#555956", "#faf8f5"],
    ].forEach(([foreground, background]) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
  });

  test("standard detail overrides are Dark-scoped so Light-Dark-Light cannot retain local Dark aliases", () => {
    expect(indexCss).not.toMatch(/:root\s*\{[^}]*--article-detail-page/);
    expect(indexCss).not.toMatch(/body:not\(\.theme-dark\)[^{]*--article-detail-(?:page|card|text|input|action)/);
    expect(indexCss).toContain("body.theme-dark .article-detail-theme--standard {");
    expect(indexCss).toMatch(/:root\s*\{[^}]*--paper:\s*#fbfaf7/);
    expect(indexCss).toMatch(/\[data-experience="life"\]\s*\{[^}]*--life-card-bg:\s*#ffffff !important/);
  });

  test("late fixed-Light Experience editorial rules receive scoped Dark foreground repairs", () => {
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="incidents"\] :is\([\s\S]*?\.memoir-callout-card,[\s\S]*?\.experience-bottom-card,[\s\S]*?\.reflection-question-item[\s\S]*?\)\s*\{[^}]*background:\s*var\(--incidents-card-bg\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="incidents"\] :is\([\s\S]*?\.share-text-box p,[\s\S]*?\.impact-progress-label \.trait-name,[\s\S]*?\.medium-editorial-quote p[\s\S]*?\)\s*\{[^}]*color:\s*var\(--incidents-muted\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="life"\] :is\([\s\S]*?\.life-sidebar-panel:not\(\.detail-card--light\),[\s\S]*?\.life-read-card[\s\S]*?\)\s*\{[^}]*background:\s*var\(--life-card-bg\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \[data-experience="travel"\] :is\([\s\S]*?\.travel-sidebar-panel,[\s\S]*?\.travel-summary-card,[\s\S]*?\.travel-read-card[\s\S]*?\)\s*\{[^}]*background:\s*var\(--travel-card-bg\) !important/);
  });

  test("Experience prose and comments sit on the same Dark canvas hierarchy", () => {
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.premium-article-prose\s*\{[^}]*color:\s*var\(--article-detail-text\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-comments :is\(h2, \.premium-comment-card strong\)\s*\{[^}]*color:\s*var\(--text-primary\) !important/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-comments \.premium-comment-card\s*\{[^}]*background:\s*var\(--surface-card\) !important/);
  });

  test("Most Popular and Topics remain on the adaptive Dark category-side surface", () => {
    const categoryLanding = read("src", "features", "categories", "CategoryLanding.js");

    expect(categoryLanding).toContain('className="popular-list"');
    expect(categoryLanding).toContain('className="topic-chip-grid"');
    expect(indexCss).toMatch(/body\.theme-dark \.category-side-panel\s*\{[^}]*background:\s*var\(--surface-card\)[^}]*color:\s*var\(--text-primary\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.category-side-panel \.topic-chip-grid button\s*\{[^}]*background:\s*var\(--surface-dark-fixed\)[^}]*color:\s*var\(--text-on-dark\)/);
  });

  test("author interactions and Newsletter controls remain readable on Dark detail cards", () => {
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--dark \.author-socials a\s*\{[^}]*color:\s*var\(--text-secondary\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--dark input\s*\{[^}]*background:\s*var\(--surface-dark-fixed\)[^}]*color:\s*var\(--text-on-dark\)/);
    expect(indexCss).toMatch(/body\.theme-dark \.article-detail-theme--standard \.detail-card--dark input::placeholder\s*\{[^}]*color:\s*var\(--text-on-dark-muted\)/);
  });

  test("approved Light Mode detail selectors remain intact", () => {
    expect(indexCss).toMatch(/\[data-experience="life"\]\s*\{[^}]*--life-card-bg:\s*#ffffff !important;[^}]*--life-text:\s*#2c2a29 !important/);
    expect(indexCss).toMatch(/\.lessons-sidebar-panel\s*\{[^}]*background:\s*#ffffff !important/);
    expect(indexCss).toMatch(/\.lessons-sidebar-panel h3\s*\{[^}]*color:\s*#2e1065 !important/);
    expect(indexCss).toMatch(/body:not\(\.theme-dark\) \.coding-landing-page:not\(\.dark-mode\) \.article-card\s*\{[^}]*--article-card-surface:\s*#f7faff !important/);
  });

  test("Learn switches its entire local token set without changing layout", () => {
    expect(learnCss).toMatch(/body\.theme-dark \.learn-shell,\s*body\.theme-dark \.learn-page\s*\{[\s\S]*?--learn-ink:\s*#f8f4ed/);
    expect(learnCss).toContain("--learn-surface: #232d2a");
    expect(learnCss).toContain("--learn-action-text: #17201e");
    expect(learnCss).toMatch(/\.learn-format-detail > header h1/);
    expect(learnCss).toMatch(/\.learn-breadcrumbs\s*\{[\s\S]*?color:\s*var\(--learn-muted\)/);
    expect(contrastRatio("#f8f4ed", "#232d2a")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#c3ccc8", "#1b2321")).toBeGreaterThanOrEqual(4.5);
  });

  test("Creator Studio switches one local surface contract without changing its Light palette", () => {
    expect(creatorCss).toMatch(/\.creator-page,\s*\.creator-studio\s*\{[\s\S]*?--creator-ink:\s*#211d19;[\s\S]*?--creator-paper:\s*#fbf8f3;/);
    expect(creatorCss).toMatch(/--creator-control-bg:\s*#fff;[\s\S]*?--creator-action:\s*var\(--creator-ink\);[\s\S]*?--creator-action-text:\s*#fff;/);

    const darkContract = creatorCss.match(/body\.theme-dark \.creator-page,\s*body\.theme-dark \.creator-studio\s*\{([^}]*)\}/)?.[1] || "";
    [
      "--creator-ink: var(--text-primary)",
      "--creator-muted: var(--text-secondary)",
      "--creator-paper: var(--surface-card)",
      "--creator-paper-raised: var(--surface-elevated)",
      "--creator-control-bg: var(--control-bg)",
      "--creator-control-border: var(--border-strong)",
      "--creator-control-text: var(--text-on-dark)",
      "--creator-placeholder: var(--text-on-dark-muted)",
      "--creator-chip-surface: var(--surface-subtle)",
      "--creator-avatar-surface: var(--surface-subtle)",
      "background: var(--surface-page)",
    ].forEach((contract) => expect(darkContract).toContain(contract));
  });

  test("Creator Studio covers the real tabs and does not invent absent workspace systems", () => {
    ["overview", "create", "content", "analytics", "earnings", "profile"].forEach((tab) => {
      expect(creatorStudio).toContain(`"${tab}"`);
    });
    expect(creatorStudio).toContain('className="creator-studio__status"');
    expect(creatorStudio).toContain('className="creator-content-list"');
    expect(creatorStudio).toContain('className="creator-analytics-list"');
    expect(creatorStudio).toContain("Creator Earnings Program — not yet activated");
    expect(creatorStudio).toContain("No payout, currency amount, KYC, or bank connection is currently active");
    expect(creatorStudio).not.toMatch(/creator-(?:sidebar|table|modal|dialog|pagination|dropdown|toast)/);
  });

  test("Creator cards, metrics, metadata, empty states, and dividers own readable Dark roles", () => {
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\([\s\S]*?\.creator-content-list h3,[\s\S]*?\.creator-analytics-list h3,[\s\S]*?\)\s*\{\s*color:\s*var\(--creator-ink\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\([\s\S]*?\.creator-content-list article > div > p:not\(\.creator-kicker\),[\s\S]*?\.creator-analytics-list article p,[\s\S]*?\.creator-empty > p,[\s\S]*?\)\s*\{\s*color:\s*var\(--creator-muted\);\s*opacity:\s*1/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\([\s\S]*?\.creator-studio__status div,[\s\S]*?\.creator-content-list article,[\s\S]*?\.creator-analytics-list article,[\s\S]*?\)\s*\{\s*border-color:\s*var\(--creator-line\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio__status dt,[\s\S]*?color:\s*var\(--creator-muted\);\s*opacity:\s*1/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio__status dd,[\s\S]*?color:\s*var\(--creator-ink\)/);
  });

  test("Creator forms, native selects, autofill, focus, and action states have explicit Dark contracts", () => {
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\(input, select, textarea\)\s*\{[\s\S]*?background:\s*var\(--creator-control-bg\);[\s\S]*?border-color:\s*var\(--creator-control-border\);[\s\S]*?color:\s*var\(--creator-control-text\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\(input, textarea\)::placeholder\s*\{[^}]*color:\s*var\(--creator-placeholder\);[^}]*opacity:\s*1/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio select option\s*\{[^}]*background:\s*var\(--creator-control-bg\);[^}]*color:\s*var\(--creator-control-text\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio input:-webkit-autofill\s*\{[^}]*-webkit-text-fill-color:\s*var\(--creator-control-text\)/);
    expect(creatorCss).toContain("outline-color: var(--creator-focus)");
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-primary-action,[\s\S]*?background:\s*var\(--creator-action\);[\s\S]*?color:\s*var\(--creator-action-text\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-primary-action:not\(:disabled\):hover,[\s\S]*?background:\s*var\(--creator-action-hover\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-primary-action:disabled,[\s\S]*?color:\s*var\(--creator-action-text\)/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-studio :is\([\s\S]*?\.creator-content-list button,[\s\S]*?\.creator-curriculum button[\s\S]*?\):not\(\.creator-primary-action\):not\(\[aria-pressed="true"\]\)\s*\{[^}]*border-color:\s*var\(--creator-control-border\);[^}]*color:\s*var\(--creator-ink\)/);
  });

  test("Creator alerts and statuses distinguish meaning without losing contrast", () => {
    expect(creatorStudio).toContain('className="creator-notice" role="alert"');
    expect(creatorStudio).toContain('className="creator-notice" role="status"');
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-notice\[role="alert"\]\s*\{[^}]*background:\s*#381f1f;[^}]*color:\s*#ffd4cc/);
    expect(creatorCss).toMatch(/body\.theme-dark \.creator-notice\[role="status"\]\s*\{[^}]*background:\s*#183027;[^}]*color:\s*#c9f1dd/);
  });

  test("Creator Dark Mode keeps its warm identity and avoids wildcard or Coding leakage", () => {
    expect(creatorCss).not.toMatch(/(?:#58a6ff|#0969da|coding-)/i);
    expect(creatorCss).not.toMatch(/body\.theme-dark[^{}]*\.creator[^{}]*\*[^{}]*\{[^}]*color:/i);
    [
      ["#f8f4ed", "#1d2422"],
      ["#c3ccc8", "#1d2422"],
      ["#f8f4ed", "#151b1a"],
      ["#c3ccc8", "#151b1a"],
      ["#17120e", "#d7ad7f"],
      ["#17120e", "#e4c29b"],
      ["#d7ad7f", "#1d2422"],
      ["#f3d6b8", "#34271d"],
      ["#ffd4cc", "#381f1f"],
      ["#c9f1dd", "#183027"],
    ].forEach(([foreground, background]) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
  });

  test("Creator Studio keeps the existing responsive shell at required viewport tiers", () => {
    expect(creatorCss).toContain("max-width: 1180px");
    expect(creatorCss).toMatch(/\.creator-studio__tabs,[\s\S]*?overflow-x:\s*auto/);
    expect(creatorCss).toMatch(/@media \(max-width: 820px\)[\s\S]*?\.creator-studio__status\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
    expect(creatorCss).toMatch(/@media \(max-width: 430px\)[\s\S]*?\.creator-content-list article,[\s\S]*?\.creator-studio__header\s*\{[^}]*flex-direction:\s*column/);
    expect(creatorCss).toMatch(/@media \(max-width: 430px\)[\s\S]*?\.creator-form__grid\s*\{\s*grid-template-columns:\s*1fr/);
  });

  test("Story landing and every shared reader engine recognize body.theme-dark", () => {
    expect(storiesCss).toMatch(/body\.theme-dark \.stories-page,\s*body\.theme-dark \.story-detail-route/);
    expect(storyReaderCss).toMatch(/body\.theme-dark \.story-reader\s*\{[\s\S]*?--story-reader-bg:\s*#141211/);
    expect(storyReaderCss).toContain("Preset differentiation stays within the six stable engines.");
  });

  test("Dark Mode does not rely on a global color override", () => {
    expect(indexCss).not.toMatch(/body\.theme-dark,\s*\.dark-mode,\s*\.category-detail-page\.dark-mode,\s*\[data-theme="dark"\]/);
    expect(indexCss).not.toMatch(/theme-dark[^\{]*\*[^\{]*\{[^}]*color:\s*(?:white|#fff(?:fff)?)/i);
  });
});
