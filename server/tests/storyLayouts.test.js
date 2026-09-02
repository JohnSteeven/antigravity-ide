const fs = require("fs");
const path = require("path");
const layoutIdsManifest = require("../../src/stories/storyLayoutIds.json");
const {
  STORY_ENGINES,
  STORY_LAYOUT_FAMILIES,
  STORY_LAYOUT_IDS,
  STORY_LAYOUT_PRESETS,
  getStoryLayoutConfig,
  getRecommendedStoryLayouts,
  normalizeStoryLayoutId,
} = require("../../src/stories/storyLayoutCatalog.cjs");
const { composeStoryLayout } = require("../../src/stories/storyComposition.cjs");
const { getStoryMediaInventory } = require("../../src/stories/storyMedia.cjs");
const { normalizeStorySections } = require("../utils/storyContent");
const storyController = require("../controllers/storyController");
const articleService = require("../services/articleService");
const {
  createLayoutVerificationStory,
  allLayoutVerificationStories,
} = require("./fixtures/storyLayoutVerificationFixtures.cjs");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const layout = (id) => getStoryLayoutConfig(id);
const compose = (story) => composeStoryLayout(story, normalizeStorySections(story.storySections), layout(story.storyLayout));
const imagePlacements = (composition) => composition.sections.filter((section) => section.image).map((section) => section._storyPlacement || section.type);

const ORIGINAL_LAYOUT_IDS = [
  "classic-reader", "reader-image-right", "reader-image-left", "editorial-sidebar", "alternating-editorial",
  "alternating-wide-moment", "wide-banner-reader", "magazine-feature", "visual-story", "minimal-longform",
  "book-page", "book-spread", "chapter-journey", "immersive-moments", "mixed-editorial",
];

const EXPECTED_ENGINES = {
  "classic-reader": STORY_ENGINES.PROSE,
  "reader-image-right": STORY_ENGINES.SPLIT_RIGHT,
  "reader-image-left": STORY_ENGINES.SPLIT_LEFT,
  "editorial-sidebar": STORY_ENGINES.SIDE_RAIL,
  "alternating-editorial": STORY_ENGINES.SPLIT_RIGHT,
  "alternating-wide-moment": STORY_ENGINES.SPLIT_RIGHT,
  "wide-banner-reader": STORY_ENGINES.SPLIT_RIGHT,
  "magazine-feature": STORY_ENGINES.SPLIT_RIGHT,
  "visual-story": STORY_ENGINES.SPLIT_RIGHT,
  "minimal-longform": STORY_ENGINES.PROSE,
  "book-page": STORY_ENGINES.PROSE,
  "book-spread": STORY_ENGINES.BOOK_COLUMNS,
  "chapter-journey": STORY_ENGINES.CHAPTER_FLOW,
  "immersive-moments": STORY_ENGINES.CHAPTER_FLOW,
  "mixed-editorial": STORY_ENGINES.CHAPTER_FLOW,
  "portrait-companion-right": STORY_ENGINES.SPLIT_RIGHT,
  "portrait-companion-left": STORY_ENGINES.SPLIT_LEFT,
  "double-rhythm": STORY_ENGINES.SPLIT_RIGHT,
  "triple-rhythm": STORY_ENGINES.SPLIT_RIGHT,
  "five-moment-journey": STORY_ENGINES.SPLIT_RIGHT,
  "chapter-image-right": STORY_ENGINES.CHAPTER_FLOW,
  "chapter-image-left": STORY_ENGINES.CHAPTER_FLOW,
  "chapter-alternating": STORY_ENGINES.CHAPTER_FLOW,
  "image-notes-rail": STORY_ENGINES.SIDE_RAIL,
  "editorial-portrait-rail": STORY_ENGINES.SIDE_RAIL,
  "reflection-with-image": STORY_ENGINES.SPLIT_RIGHT,
  "letter-memory": STORY_ENGINES.PROSE,
  "scene-by-scene": STORY_ENGINES.CHAPTER_FLOW,
  "journal-reader": STORY_ENGINES.PROSE,
  "cinematic-rhythm": STORY_ENGINES.SPLIT_RIGHT,
};

describe("Story layout catalog", () => {
  test("preserves the original fifteen IDs and adds fifteen stable IDs", () => {
    expect(STORY_LAYOUT_IDS).toHaveLength(30);
    expect(STORY_LAYOUT_IDS.slice(0, 15)).toEqual(ORIGINAL_LAYOUT_IDS);
    expect(layoutIdsManifest).toEqual(STORY_LAYOUT_IDS);
    expect(new Set(STORY_LAYOUT_IDS).size).toBe(30);
  });

  test.each(Object.entries(EXPECTED_ENGINES))("%s resolves to %s", (presetId, engine) => {
    expect(normalizeStoryLayoutId(presetId)).toBe(presetId);
    expect(layout(presetId).engine).toBe(engine);
  });

  test("every preset has author-facing metadata and a meaningful preview signature", () => {
    const familyIds = new Set(STORY_LAYOUT_FAMILIES.map((family) => family.id));
    const signatures = STORY_LAYOUT_PRESETS.map((preset) => JSON.stringify({
      engine: preset.engine,
      family: preset.family,
      preview: preset.preview,
      imagePattern: preset.imagePattern,
      overflowPlacement: preset.overflowPlacement,
      mediaStyle: preset.mediaStyle,
      railStyle: preset.railStyle,
      rhythm: preset.editorialRhythm,
      minimal: preset.minimal,
      book: preset.bookTypography,
      manual: preset.manual,
    }));

    STORY_LAYOUT_PRESETS.forEach((preset) => {
      expect(familyIds.has(preset.family)).toBe(true);
      expect(preset.description).toBeTruthy();
      expect(Array.isArray(preset.recommendedImageCount)).toBe(true);
      expect(preset.preview.length).toBeGreaterThan(0);
    });
    expect(new Set(signatures).size).toBe(STORY_LAYOUT_PRESETS.length);
  });

  test("CMS preview diagrams communicate directional, rail, and book composition", () => {
    const mediaCells = new Set(["image", "portrait", "landscape", "small-image", "rail-image"]);
    const firstDirectionalRow = (presetId) => layout(presetId).preview.find((row) => row.some((cell) => mediaCells.has(cell)) && row.some((cell) => ["text", "chapter", "reflection"].includes(cell)));

    expect(firstDirectionalRow("reader-image-right")).toEqual(["text", "image"]);
    expect(firstDirectionalRow("reader-image-left")).toEqual(["image", "text"]);
    expect(firstDirectionalRow("portrait-companion-right")).toEqual(["text", "portrait"]);
    expect(firstDirectionalRow("portrait-companion-left")).toEqual(["portrait", "text"]);
    expect(layout("editorial-sidebar").preview.flat()).toContain("rail");
    expect(layout("image-notes-rail").preview.flat()).toContain("rail-image");
    expect(layout("book-spread").preview.every((row) => row.length === 2)).toBe(true);
  });

  test("image-count recommendations guide without changing selection", () => {
    const recommended = (count) => getRecommendedStoryLayouts(count).map((preset) => preset.id);
    expect(recommended(0)).toEqual(expect.arrayContaining(["classic-reader", "minimal-longform", "book-page", "book-spread"]));
    expect(recommended(1)).toEqual(expect.arrayContaining(["reader-image-right", "reader-image-left", "portrait-companion-right", "editorial-sidebar"]));
    expect(recommended(3)).toEqual(expect.arrayContaining(["alternating-editorial", "triple-rhythm", "chapter-alternating"]));
    expect(recommended(5)).toEqual(expect.arrayContaining(["five-moment-journey", "visual-story", "mixed-editorial"]));
  });
});

describe("Story preset composition precedence", () => {
  test("normal presets override section-side hints without moving attached media", () => {
    const story = createLayoutVerificationStory("classic-reader", 1);
    const [opening] = normalizeStorySections(story.storySections);
    expect(opening.type).toBe("text-image-right");

    expect(compose(story).sections[0]).toMatchObject({ image: opening.image, _storyPlacement: "inline" });
    expect(compose({ ...story, storyLayout: "reader-image-right", storySections: [{ ...opening, type: "image-left-text" }] }).sections[0]._storyPlacement).toBe("right");
    expect(compose({ ...story, storyLayout: "reader-image-left", storySections: [{ ...opening, type: "text-image-right" }] }).sections[0]._storyPlacement).toBe("left");
  });

  test("Mixed Editorial preserves manual section composition", () => {
    const story = createLayoutVerificationStory("mixed-editorial", 5);
    const normalized = normalizeStorySections(story.storySections);
    const result = composeStoryLayout(story, normalized, layout("mixed-editorial"));
    expect(result.sections).toBe(normalized);
    expect(result.diagnostics.manual).toBe(true);
    expect(result.sections.map((section) => section.type)).toEqual(normalized.map((section) => section.type));
  });

  test("cover fallback follows the selected preset and never forces right globally", () => {
    const base = {
      title: "Cover fallback",
      coverImage: "/cover.jpg",
      coverImageAlt: "Stored cover alt",
      storySections: [{ id: "opening", type: "text", body: "A sufficiently substantial opening passage for a safe supporting image." }],
    };
    const placement = (presetId) => compose({ ...base, storyLayout: presetId }).sections[0]._storyPlacement;

    expect(placement("classic-reader")).toBe("inline");
    expect(placement("reader-image-right")).toBe("right");
    expect(placement("reader-image-left")).toBe("left");
    const rail = compose({ ...base, storyLayout: "editorial-sidebar" });
    expect(rail.railMedia).toMatchObject({ src: "/cover.jpg" });
    expect(rail.sections[0].image).toBeFalsy();
  });

  test("zero-image Stories retain text flow with no media or empty rail image", () => {
    STORY_LAYOUT_IDS.forEach((presetId) => {
      const result = compose(createLayoutVerificationStory(presetId, 0));
      expect(result.sections.every((section) => !section.image)).toBe(true);
      expect(result.railMedia).toBeNull();
    });
  });

  test.each([0, 1, 2, 3, 5, 8])("preserves the %i-image verification matrix", (count) => {
    const story = createLayoutVerificationStory("visual-story", count);
    expect(getStoryMediaInventory(story).imageCount).toBe(count);
    expect(compose(story).diagnostics.imageCount).toBe(count);
  });

  test("two, three, and five-moment patterns are distinct and restrained", () => {
    expect(imagePlacements(compose(createLayoutVerificationStory("double-rhythm", 5)))).toEqual(["right", "left", "inline", "inline", "inline"]);
    expect(imagePlacements(compose(createLayoutVerificationStory("triple-rhythm", 5)))).toEqual(["right", "left", "right", "inline", "inline"]);
    expect(imagePlacements(compose(createLayoutVerificationStory("five-moment-journey", 5)))).toEqual(["right", "left", "right", "left", "right"]);
  });

  test("Chapter Journey keeps every chapter image in a restrained directional rhythm", () => {
    const storySections = [1, 2, 3].map((number) => ({
      id: `chapter-${number}`,
      type: "chapter",
      chapterNumber: String(number).padStart(2, "0"),
      chapterTitle: `Chapter ${number}`,
      body: "A substantial chapter passage keeps its attached image connected to this exact text.",
      image: `/chapter-${number}.jpg`,
      alt: `Chapter ${number}`,
    }));
    const base = { title: "Chapter comparison", storySections };
    expect(imagePlacements(compose({ ...base, storyLayout: "chapter-journey" }))).toEqual(["right", "left", "right"]);
    expect(imagePlacements(compose({ ...base, storyLayout: "chapter-alternating" }))).toEqual(["right", "left", "right"]);
  });

  test.each([0, 1, 3, 5])("Chapter Journey composes %i historical chapter companion images without changing section order", (imageCount) => {
    const storySections = Array.from({ length: Math.max(1, imageCount) }, (_, index) => {
      const chapter = {
        id: `historical-chapter-${index + 1}`,
        type: "chapter",
        chapterNumber: String(index + 1).padStart(2, "0"),
        chapterTitle: `Historical chapter ${index + 1}`,
        body: "A substantial chapter opening remains in its persisted position and introduces the passage that follows.",
      };
      if (index >= imageCount) return [chapter];
      return [chapter, {
        id: `historical-companion-${index + 1}`,
        type: "text-image",
        heading: `Chapter passage ${index + 1}`,
        body: "This historical passage and its supporting image belong to the chapter immediately before it.",
        image: `/historical-companion-${index + 1}.jpg`,
        alt: `Historical companion ${index + 1}`,
        caption: `Chapter moment ${index + 1}`,
      }];
    }).flat();
    const normalized = normalizeStorySections(storySections);
    const result = composeStoryLayout(
      { title: "Historical chapter companions", storyLayout: "chapter-journey", storySections },
      normalized,
      layout("chapter-journey")
    );

    expect(result.sections.map((section) => section.id)).toEqual(normalized.map((section) => section.id));
    expect(imagePlacements(result)).toEqual(["right", "left", "right", "left", "right"].slice(0, imageCount));
    result.sections.filter((section) => section.image).forEach((section, index) => {
      expect(section._storyChapterOwnerIndex).toBe(index * 2);
      expect(result.sections[index * 2]._storyHasCompanion).toBe(true);
    });
  });

  test("historical chapter companions retain right, left, and alternating sibling preset contracts", () => {
    const storySections = [1, 2, 3].flatMap((number) => ([
      {
        id: `chapter-${number}`,
        type: "chapter",
        chapterNumber: String(number).padStart(2, "0"),
        chapterTitle: `Chapter ${number}`,
        body: "A substantial chapter opening introduces the image-bearing passage that follows it.",
      },
      {
        id: `companion-${number}`,
        type: "text-image-right",
        heading: `Passage ${number}`,
        body: "A substantial companion passage keeps its image tied to this chapter without moving persisted data.",
        image: `/companion-${number}.jpg`,
        alt: `Companion ${number}`,
      },
    ]));
    const placements = (presetId) => imagePlacements(compose({ title: "Sibling chapter presets", storyLayout: presetId, storySections }));

    expect(placements("chapter-image-right")).toEqual(["right", "right", "right"]);
    expect(placements("chapter-image-left")).toEqual(["left", "left", "left"]);
    expect(placements("chapter-alternating")).toEqual(["right", "left", "right"]);
    expect(placements("immersive-moments")).toEqual(["right", "left", "right"]);
    expect(placements("scene-by-scene")).toEqual(["right", "left", "right"]);
  });

  test("same five-image content produces distinct editorial contracts", () => {
    const ids = ["alternating-editorial", "five-moment-journey", "visual-story", "chapter-alternating", "magazine-feature", "mixed-editorial"];
    const signatures = ids.map((presetId) => {
      const result = compose(createLayoutVerificationStory(presetId, 5));
      return JSON.stringify({ engine: result.diagnostics.engine, placements: imagePlacements(result), rhythm: layout(presetId).editorialRhythm, manual: result.diagnostics.manual });
    });
    expect(new Set(signatures).size).toBe(ids.length);
  });

  test("same one-image content differentiates prose, left, right, portrait, and rail layouts", () => {
    const ids = ["classic-reader", "reader-image-right", "reader-image-left", "portrait-companion-right", "editorial-sidebar"];
    const signatures = ids.map((presetId) => {
      const result = compose(createLayoutVerificationStory(presetId, 1));
      const mediaSection = result.sections.find((section) => section.image);
      return JSON.stringify({
        engine: result.diagnostics.engine,
        placement: mediaSection?._storyPlacement || (result.railMedia ? "rail" : "none"),
        mediaStyle: mediaSection?._storyMediaStyle || layout(presetId).mediaStyle,
        rail: Boolean(result.railMedia),
      });
    });
    expect(new Set(signatures).size).toBe(ids.length);
  });

  test("all thirty development records resolve their selected preset and engine", () => {
    allLayoutVerificationStories.forEach((story) => {
      const result = compose(story);
      expect(result.diagnostics.preset).toBe(story.storyLayout);
      expect(result.diagnostics.engine).toBe(EXPECTED_ENGINES[story.storyLayout]);
      expect(result.diagnostics.sectionCount).toBe(story.storySections.length);
    });
  });
});

describe("Story layout persistence contract", () => {
  test.each(STORY_LAYOUT_IDS)("CMS/API normalization preserves %s", (presetId) => {
    const prepared = storyController.prepareStory({
      title: `Persist ${presetId}`,
      slug: `persist-${presetId}`,
      status: "draft",
      storyLayout: presetId,
      storySections: createLayoutVerificationStory(presetId, 1).storySections,
    });
    const response = storyController.withStoryRuntimeMetadata(prepared);
    expect(prepared.storyLayout).toBe(presetId);
    expect(response.storyLayout).toBe(presetId);
  });

  test("Classic → Right → Left survives repeated prepare/reload cycles", () => {
    const story = createLayoutVerificationStory("classic-reader", 1);
    let stored = storyController.prepareStory(story);
    expect(stored.storyLayout).toBe("classic-reader");
    stored = { ...stored, ...storyController.prepareStory({ storyLayout: "reader-image-right" }, stored) };
    expect(stored.storyLayout).toBe("reader-image-right");
    stored = { ...stored, ...storyController.prepareStory({ storyLayout: "reader-image-left" }, stored) };
    expect(storyController.withStoryRuntimeMetadata(stored).storyLayout).toBe("reader-image-left");
  });

  test("Story list API preserves every selected layout ID", async () => {
    const articles = allLayoutVerificationStories.map((story) => ({ ...story, status: "published" }));
    const service = jest.spyOn(articleService, "getArticles").mockResolvedValue({
      articles,
      pagination: { page: 1, limit: 1000, total: articles.length, pages: 1 },
    });
    const res = { json: jest.fn() };

    await storyController.getStories({ query: {} }, res, jest.fn());
    const response = res.json.mock.calls[0][0];
    expect(response.articles.map((story) => story.storyLayout)).toEqual(STORY_LAYOUT_IDS);
    expect(response.articles.every((story) => /^\d+ min read$/.test(story.readingTime))).toBe(true);
    service.mockRestore();
  });

  test("Story API runtime metadata derives reading time from actual text", () => {
    const body = Array.from({ length: 401 }, (_, index) => `word${index}`).join(" ");
    const response = storyController.withStoryRuntimeMetadata({
      title: "Measured runtime Story",
      storyLayout: "classic-reader",
      storySections: [{ type: "text", body }],
      readingTimeMin: 99,
      readingTime: "99 min read",
    });
    expect(response.readingTimeMin).toBe(3);
    expect(response.readingTime).toBe("3 min read");
  });

  test("CMS uses normalized selected IDs, grouped recommendations, and real draft preview", () => {
    const cms = fs.readFileSync(workspaceFile("src", "components", "cms", "panels", "StoryCmsPanel.js"), "utf8");
    expect(cms).toContain("storyLayout: normalizeStoryLayoutId(story.storyLayout)");
    expect(cms).toContain("STORY_LAYOUT_FAMILIES.map");
    expect(cms).toContain("getRecommendedStoryLayouts(storyImageCount)");
    expect(cms).toContain("This legacy record had no stored layout");
    expect(cms).toContain("<StoryEngine story={draft}");
    expect(cms).toMatch(/current\.storySections\.length \|\| stripStoryHtml\(current\.body/);
  });
});

describe("Story renderer safety contracts", () => {
  test("renderer exposes development diagnostics without public debug UI", () => {
    const engine = fs.readFileSync(workspaceFile("src", "stories", "components", "StoryEngine.js"), "utf8");
    const legacy = fs.readFileSync(workspaceFile("src", "stories", "components", "LegacyStoryReader.js"), "utf8");
    expect(engine).toContain("process.env.NODE_ENV !== \"production\"");
    expect(engine).toContain("data-story-layout={layout.id}");
    expect(engine).toContain("data-story-preset={layout.id}");
    expect(engine).toContain("data-story-mode=\"structured\"");
    expect(legacy).toContain("data-story-layout={layout.id}");
    expect(legacy).toContain("data-story-mode=\"legacy\"");
    expect(engine).not.toContain("story-reader__debug");
    expect(legacy).not.toContain("story-reader__debug");
  });

  test("no three-column, giant-image, or slug-specific Story rules are introduced", () => {
    const css = fs.readFileSync(workspaceFile("src", "stories", "story-reader.css"), "utf8");
    expect(css).not.toMatch(/grid-template-columns:\s*repeat\(3/);
    expect(css).not.toMatch(/height:\s*(?:600|100vh)px?/);
    expect(css).not.toMatch(/\.kyoto|\.silence-between|\.story-\d+/i);
    expect(css).toContain("max-width: 400px");
  });
});
