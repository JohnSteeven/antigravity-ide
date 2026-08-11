const {
  STORY_LAYOUT_IDS,
  normalizeStoryLayout,
  normalizeStorySections,
  calculateStoryReadingTime,
  validateStorySections,
} = require("../utils/storyContent");

describe("Story content architecture", () => {
  test("keeps thirty CMS presets mapped to stable IDs", () => {
    expect(STORY_LAYOUT_IDS).toHaveLength(30);
    expect(new Set(STORY_LAYOUT_IDS).size).toBe(30);
    expect(normalizeStoryLayout("wide-banner")).toBe("wide-banner-reader");
    expect(normalizeStoryLayout("unknown-experiment")).toBe("classic-reader");
  });

  test("linearizes a historical multi-image row into sequential sections", () => {
    const sections = normalizeStorySections([{
      id: "opening",
      type: "split-right",
      heading: "Opening",
      body: "A meaningful opening passage with enough words to be paired safely.",
      images: [
        { url: "/uploads/one.jpg", alt: "First scene" },
        { url: "/uploads/two.jpg", alt: "Second scene" },
        { url: "/uploads/three.jpg", alt: "Third scene" },
      ],
    }]);

    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({ type: "text-image-right", image: "/uploads/one.jpg" });
    expect(sections.slice(1).every((section) => section.type === "image")).toBe(true);
    expect(sections.every((section) => !Array.isArray(section.images))).toBe(true);
  });

  test("maps production historical text-image types and alt fields", () => {
    const sections = normalizeStorySections([
      {
        type: "text-image",
        body: "A meaningful passage paired with an image on the right.",
        image: "/uploads/right.jpg",
        altText: "Stored right image alt",
        imagePosition: "right",
      },
      {
        type: "image-text",
        body: "A meaningful passage paired with an image on the left.",
        image: "/uploads/left.jpg",
        altText: "Stored left image alt",
        imagePosition: "left",
      },
    ]);

    expect(sections[0]).toMatchObject({ type: "text-image-right", alt: "Stored right image alt" });
    expect(sections[1]).toMatchObject({ type: "image-left-text", alt: "Stored left image alt" });
  });

  test("rejects empty publishable split sections and missing alt text", () => {
    const errors = validateStorySections([{
      type: "text-image-right",
      body: "Short",
      image: "/uploads/scene.jpg",
      alt: "",
    }], { publishing: true });

    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("meaningful body text"),
      expect.stringContaining("alt text"),
    ]));
  });

  test("derives reading time from structured content instead of a stored label", () => {
    const twoHundredWords = Array.from({ length: 200 }, (_, index) => `word${index}`).join(" ");
    const story = {
      title: "Measured Story",
      readingTime: "30 min read",
      body: Array.from({ length: 3000 }, () => "legacy").join(" "),
      storySections: [{ type: "text", heading: "Chapter", body: twoHundredWords }],
    };

    expect(calculateStoryReadingTime(story)).toBe(2);
  });

  test("keeps legacy body-only reading time available", () => {
    const story = { body: Array.from({ length: 410 }, () => "legacy").join(" ") };
    expect(calculateStoryReadingTime(story)).toBe(3);
  });

  test("caps legacy wide image sizing at the safe medium policy", () => {
    const [section] = normalizeStorySections([{ type: "wide-image", image: "/wide.jpg", alt: "Wide scene", imageSize: "wide" }]);
    expect(section.imageSize).toBe("medium");
  });
});
