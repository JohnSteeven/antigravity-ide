const fs = require("fs");
const path = require("path");
const fixtures = require("../../src/data/storyFixtures.cjs");
const {
  STORY_ENGINES,
  STORY_LAYOUT_IDS,
  STORY_LAYOUT_PRESETS,
} = require("../../src/stories/storyLayoutCatalog.cjs");
const { getStoryResponsiveContract } = require("../../src/stories/storyComposition.cjs");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);

describe("Story rendering contract", () => {
  test("development fixtures cover image-count and reading-length matrices", () => {
    const imageCounts = fixtures.map((story) => story.storySections.filter((section) => section.image).length);
    const readingTimes = fixtures.map((story) => story.readingTimeMin);

    expect(imageCounts).toEqual([0, 1, 2, 3, 5, 8]);
    expect(readingTimes).toEqual([5, 5, 15, 15, 20, 30]);
  });

  test("Kyoto opening keeps its heading, passage, and image in one split section", () => {
    const kyoto = fixtures.find((story) => story.slug === "the-midnight-train-to-kyoto");
    expect(kyoto.storySections[0]).toMatchObject({
      type: "text-image-right",
      heading: "Snow Across the Tracks",
    });
    expect(kyoto.storySections[0].body).toContain("local train from Osaka to Kyoto");
    expect(kyoto.storySections[0].image).toBeTruthy();
    expect(kyoto.storySections[0].alt).toBeTruthy();
  });

  test("all thirty presets compose the same six underlying engines", () => {
    expect(STORY_LAYOUT_PRESETS).toHaveLength(30);
    expect(STORY_LAYOUT_IDS).toHaveLength(30);
    expect(new Set(STORY_LAYOUT_PRESETS.map((layout) => layout.engine))).toEqual(new Set(Object.values(STORY_ENGINES)));
    expect(STORY_LAYOUT_PRESETS.every((layout) => layout.family && Array.isArray(layout.preview))).toBe(true);
  });

  test("responsive CSS stacks early and caps all normal Story images", () => {
    const css = fs.readFileSync(workspaceFile("src", "stories", "story-reader.css"), "utf8");
    expect(css).toContain("@container story-flow (max-width: 839px)");
    expect(css).toContain("@container story-flow (max-width: 1019px)");
    expect(css).toContain("@container story-shell (max-width: 1139px)");
    expect(css).toMatch(/story-reader__section--legacy-image[\s\S]*?max-width:\s*400px/);
    expect(css).not.toMatch(/grid-template-columns:\s*repeat\(3/);
  });

  test("chapter companions use the shared split primitive instead of centered inline media", () => {
    const composition = fs.readFileSync(workspaceFile("src", "stories", "storyComposition.cjs"), "utf8");
    const renderer = fs.readFileSync(workspaceFile("src", "stories", "components", "StorySectionRenderer.js"), "utf8");
    const css = fs.readFileSync(workspaceFile("src", "stories", "story-reader.css"), "utf8");

    expect(composition).toContain("getChapterCompanionMap");
    expect(composition).toContain("_storyChapterOwnerIndex");
    expect(renderer).toContain("story-reader__section--chapter-companion");
    expect(renderer).toContain("story-reader__chapter--has-companion");
    expect(css).toMatch(/\.story-reader__chapter--has-companion\s*\{[\s\S]*?margin-bottom:/);
    expect(css).toContain("@container story-flow (max-width: 839px)");
  });

  test.each([
    [430, false, false, false],
    [820, false, false, false],
    [1024, true, false, false],
    [1440, true, true, true],
    [1920, true, true, true],
  ])("responsive contract at %ipx", (width, splitColumns, bookColumns, sideRail) => {
    expect(getStoryResponsiveContract(width)).toMatchObject({
      splitColumns,
      bookColumns,
      sideRail,
      maxSupportingImageWidth: 400,
    });
  });

  test("legacy media uses a compact opening grid and never restores the old float", () => {
    const css = fs.readFileSync(workspaceFile("src", "stories", "story-reader.css"), "utf8");
    const reader = fs.readFileSync(workspaceFile("src", "stories", "components", "LegacyStoryReader.js"), "utf8");

    expect(css).toMatch(/\.story-reader__legacy-opening\s*\{[\s\S]*?display:\s*grid/);
    expect(css).toMatch(/\.story-reader__legacy-media\s*\{[\s\S]*?width:\s*min\(100%, 400px\)/);
    expect(css).not.toMatch(/\.story-reader__legacy-media\s*\{[\s\S]*?float:\s*right/);
    expect(reader).toContain("resolveStoryPrimaryImage");
    expect(reader).toContain("story-reader__legacy-opening-copy");
  });

  test("legacy cover media follows the selected engine instead of forcing split-right", () => {
    const css = fs.readFileSync(workspaceFile("src", "stories", "story-reader.css"), "utf8");
    const reader = fs.readFileSync(workspaceFile("src", "stories", "components", "LegacyStoryReader.js"), "utf8");

    expect(reader).toContain("isSplitLegacyLayout");
    expect(reader).toContain("isRailLegacyLayout");
    expect(reader).toContain("imageUrl && isSplitLegacyLayout");
    expect(reader).toContain("imageUrl && !isSplitLegacyLayout && !isRailLegacyLayout");
    expect(reader).toContain("story-reader__legacy-rail-layout");
    expect(css).toMatch(/\.story-reader__legacy-inline-media\s*\{[\s\S]*?margin:/);
    expect(css).toMatch(/\.story-reader__legacy-rail-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 820px\) minmax\(220px, 260px\)/);
    expect(css).toMatch(/story-reader--legacy\.story-reader--book-columns \.story-reader__legacy-body\s*\{[\s\S]*?column-count:\s*2/);
  });

  test("CMS identifies an existing body-only cover as a Legacy Story image", () => {
    const source = fs.readFileSync(workspaceFile("src", "components", "cms", "panels", "StoryCmsPanel.js"), "utf8");
    expect(source).toContain("Legacy Story image");
    expect(source).toContain("legacyMedia.altMissing");
  });

  test("CMS and the shared renderer support SEO, legacy body, and structured quote metadata", () => {
    const cms = fs.readFileSync(workspaceFile("src", "components", "cms", "panels", "StoryCmsPanel.js"), "utf8");
    const renderer = fs.readFileSync(workspaceFile("src", "stories", "components", "StorySectionRenderer.js"), "utf8");

    expect(cms).toContain("Legacy Story body");
    expect(cms).toContain("SEO title");
    expect(cms).toContain("Canonical URL");
    expect(cms).toContain("quoteSource");
    expect(cms).toContain("quoteStyle");
    expect(renderer).toContain("sanitizeClientStoryHtml");
    expect(renderer).toContain("story-reader__quote--${section.quoteStyle");
  });

  test("public routing selects structured engine or explicit legacy reader", () => {
    const source = fs.readFileSync(workspaceFile("src", "stories", "StoryDetail.js"), "utf8");
    expect(source).toContain("hasStructuredSections ? <StoryEngine");
    expect(source).toContain(": <LegacyStoryReader");
  });

  test("every Story reader ends with an editorial invitation instead of a dashboard card", () => {
    const css = fs.readFileSync(workspaceFile("src", "stories", "stories.css"), "utf8");
    const detail = fs.readFileSync(workspaceFile("src", "stories", "StoryDetail.js"), "utf8");

    expect(detail).toContain('className="story-daily-footer"');
    expect(detail).toContain('className="story-daily-footer-content"');
    expect(css).toMatch(/\.story-daily-footer-content\s*\{[\s\S]*?padding:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;/);
    expect(css).not.toMatch(/\.story-daily-footer-content\s*\{[\s\S]*?background(?:-color)?:\s*var\(--story-surface-warm\)/);
  });
});
