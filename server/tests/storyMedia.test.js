const {
  resolveStoryPrimaryImage,
} = require("../../src/stories/storyMedia.cjs");
const { composeStoryLayout } = require("../../src/stories/storyComposition.cjs");
const { getStoryLayoutConfig } = require("../../src/stories/storyLayoutCatalog.cjs");

const compose = (story, sections, layoutId) => composeStoryLayout(story, sections, getStoryLayoutConfig(layoutId));

describe("Story image compatibility", () => {
  test("Case A: resolves a legacy cover with existing alt metadata", () => {
    const media = resolveStoryPrimaryImage({
      body: "<p>Legacy prose.</p>",
      coverImage: "/uploads/legacy.jpg",
      coverImageAlt: "Existing author-provided alt",
      storySections: [],
    });

    expect(media).toMatchObject({
      src: "/uploads/legacy.jpg",
      alt: "Existing author-provided alt",
      source: "cover",
      field: "coverImage",
      altMissing: false,
    });
  });

  test("Case B: returns no media for a text-only legacy Story", () => {
    expect(resolveStoryPrimaryImage({ body: "<p>Pure prose.</p>", storySections: [] })).toBeNull();
  });

  test("Case C: explicit structured media remains authoritative", () => {
    const sections = [{ type: "text-image-right", body: "A sufficiently long opening passage for the split layout.", image: "/section.jpg", alt: "Section alt" }];
    const story = { coverImage: "/cover.jpg", storySections: sections };

    expect(resolveStoryPrimaryImage(story)).toMatchObject({ src: "/section.jpg", source: "section" });
    expect(compose(story, sections, "reader-image-right").sections).toEqual(sections.map((section) => expect.objectContaining({ image: section.image })));
    expect(resolveStoryPrimaryImage(story, { preferCover: true })).toMatchObject({ src: "/cover.jpg", source: "cover" });
  });

  test("Case D: uses one cover in the first suitable text section without mutating input", () => {
    const sections = [
      { id: "pause", type: "scene-break" },
      { id: "opening", type: "text", heading: "Opening", body: "A sufficiently long opening passage for a safe editorial split." },
      { id: "after", type: "text", body: "The remaining passage continues without an image." },
    ];
    const before = JSON.parse(JSON.stringify(sections));
    const result = compose({ coverImage: "/cover.jpg", coverImageAlt: "Author alt" }, sections, "reader-image-right").sections;

    expect(result).not.toBe(sections);
    expect(result[1]).toMatchObject({
      type: "text",
      image: "/cover.jpg",
      alt: "Author alt",
      _storyPlacement: "right",
      _storyMediaFallback: true,
    });
    expect(result.filter((section) => section.image)).toHaveLength(1);
    expect(sections).toEqual(before);
  });

  test("Case E: suppresses a rail cover when the same source is already in a section", () => {
    const story = {
      coverImage: "/same.jpg",
      storySections: [{ type: "text-image-right", image: "/same.jpg", body: "A sufficiently long paired passage." }],
    };

    expect(resolveStoryPrimaryImage(story, {
      includeSectionImages: false,
      preferCover: true,
      excludeCoverIfUsedInSections: true,
    })).toBeNull();
    const result = compose(story, story.storySections, "reader-image-right");
    expect(result.sections.filter((section) => section.image)).toHaveLength(1);
    expect(result.sections.some((section) => section._storyMediaFallback)).toBe(false);
  });

  test("Case F: preserves multiple section images in their original sections", () => {
    const sections = [
      { type: "text-image-right", image: "/one.jpg", body: "First sufficiently long paired passage." },
      { type: "image-left-text", image: "/two.jpg", body: "Second sufficiently long paired passage." },
      { type: "chapter", image: "/three.jpg", body: "Third sufficiently long paired passage." },
    ];
    const story = { coverImage: "/cover.jpg", storySections: sections };

    const result = compose(story, sections, "visual-story");
    expect(result.sections.map((section) => section.image)).toEqual(["/one.jpg", "/two.jpg", "/three.jpg"]);
  });

  test("historical section images resolve altText without inventing alt copy", () => {
    expect(resolveStoryPrimaryImage({
      storySections: [{ image: "/historical.jpg", altText: "Stored historical alt" }],
    })).toMatchObject({ alt: "Stored historical alt", altMissing: false });

    expect(resolveStoryPrimaryImage({ coverImage: "/no-alt.jpg" })).toMatchObject({ alt: "", altMissing: true });
  });
});
