const STORY_ENGINES = Object.freeze({
  PROSE: "prose",
  SPLIT_RIGHT: "split-right",
  SPLIT_LEFT: "split-left",
  SIDE_RAIL: "side-rail",
  BOOK_COLUMNS: "book-columns",
  CHAPTER_FLOW: "chapter-flow",
});

const STORY_LAYOUT_FAMILIES = Object.freeze([
  { id: "text-focused", name: "Text-focused", description: "Typography-led reading with restrained or optional media." },
  { id: "one-image", name: "One image", description: "A single supporting image with a deliberate editorial role." },
  { id: "multi-image", name: "Multi-image", description: "Several image moments distributed through Story text." },
  { id: "chapter-longform", name: "Chapter / longform", description: "Chapter rhythm for longer, structured Stories." },
  { id: "editorial-special", name: "Editorial / special", description: "Distinct rails, reflections, scenes, and author-led composition." },
]);

const preset = (id, name, engine, description, preview, options = {}) => Object.freeze({
  id,
  name,
  engine,
  description,
  preview,
  family: "editorial-special",
  recommendedImageCount: [],
  longformSuitable: false,
  imagePattern: [],
  overflowPlacement: "inline",
  patternRepeat: false,
  ...options,
});

const STORY_LAYOUT_PRESETS = Object.freeze([
  preset("classic-reader", "Classic Reader", STORY_ENGINES.PROSE, "A calm, text-led reading page.", [["text"], ["small-image"], ["text"]], {
    family: "text-focused", recommendedImageCount: [0, 1], longformSuitable: true, imagePattern: ["inline"], patternRepeat: true,
  }),
  preset("reader-image-right", "Reader + Image Right", STORY_ENGINES.SPLIT_RIGHT, "Opening prose with modest supporting media.", [["text", "image"], ["text"]], {
    family: "one-image", recommendedImageCount: [1], imagePattern: ["right"], overflowPlacement: "inline",
  }),
  preset("reader-image-left", "Reader + Image Left", STORY_ENGINES.SPLIT_LEFT, "Supporting media leads into opening prose.", [["image", "text"], ["text"]], {
    family: "one-image", recommendedImageCount: [1], imagePattern: ["left"], overflowPlacement: "inline",
  }),
  preset("editorial-sidebar", "Editorial Sidebar", STORY_ENGINES.SIDE_RAIL, "Reading column with a quiet metadata rail.", [["text", "rail"], ["text", "rail"]], {
    family: "one-image", recommendedImageCount: [0, 1], longformSuitable: true, railMedia: true, imagePattern: ["inline"], patternRepeat: true,
  }),
  preset("alternating-editorial", "Alternating Editorial", STORY_ENGINES.SPLIT_RIGHT, "Alternating text and image passages.", [["text", "image"], ["image", "text"], ["text", "image"]], {
    family: "multi-image", recommendedImageCount: [2, 3, 4], imagePattern: ["right", "left", "right"], overflowPlacement: "inline",
  }),
  preset("alternating-wide-moment", "Alternating Wide Moment", STORY_ENGINES.SPLIT_RIGHT, "Alternating passages with a restrained editorial pause.", [["text", "image"], ["quote"], ["image", "text"]], {
    family: "multi-image", recommendedImageCount: [2, 3, 4], longformSuitable: true, imagePattern: ["right", "left"], overflowPlacement: "inline", emphasis: "moment",
  }),
  preset("wide-banner-reader", "Wide Banner Reader", STORY_ENGINES.SPLIT_RIGHT, "A compact landscape opening followed by prose.", [["text", "landscape"], ["text"]], {
    family: "one-image", recommendedImageCount: [1], imagePattern: ["right"], mediaStyle: "landscape", compactOpening: true,
  }),
  preset("magazine-feature", "Magazine Feature", STORY_ENGINES.SPLIT_RIGHT, "A varied feature rhythm without oversized media.", [["text", "image"], ["text"], ["quote"], ["image", "text"]], {
    family: "multi-image", recommendedImageCount: [2, 3], longformSuitable: true, imagePattern: ["right", "left"], overflowPlacement: "inline", editorialRhythm: "magazine",
  }),
  preset("visual-story", "Visual Story", STORY_ENGINES.SPLIT_RIGHT, "Frequent paired media, always attached to Story text.", [["text", "image"], ["image", "text"], ["text", "image"], ["image", "text"]], {
    family: "multi-image", recommendedImageCount: [4, 5, 6, 7, 8], imagePattern: ["right", "left"], patternRepeat: true, editorialRhythm: "visual",
  }),
  preset("minimal-longform", "Minimal Longform", STORY_ENGINES.PROSE, "Distraction-free typography for long reads.", [["text"], ["text"], ["text"]], {
    family: "text-focused", recommendedImageCount: [0, 1], longformSuitable: true, imagePattern: ["inline"], patternRepeat: true, minimal: true,
  }),
  preset("book-page", "Book Page", STORY_ENGINES.PROSE, "Book-like typography and chapter spacing.", [["chapter"], ["text"], ["small-image"], ["text"]], {
    family: "text-focused", recommendedImageCount: [0, 1], longformSuitable: true, imagePattern: ["inline"], patternRepeat: true, bookTypography: true,
  }),
  preset("book-spread", "Book Spread", STORY_ENGINES.BOOK_COLUMNS, "Two comfortable reading columns on wide screens only.", [["text", "text"], ["text", "text"]], {
    family: "text-focused", recommendedImageCount: [0, 1], longformSuitable: true, imagePattern: ["inline"], patternRepeat: true, bookTypography: true,
  }),
  preset("chapter-journey", "Chapter Journey", STORY_ENGINES.CHAPTER_FLOW, "Numbered chapters with varied supporting layouts.", [["chapter", "image"], ["chapter"], ["image", "chapter"]], {
    family: "chapter-longform", recommendedImageCount: [0, 1, 2, 3], longformSuitable: true, imagePattern: ["chapter-right", "inline", "chapter-left"], patternRepeat: true, chapterMediaOnly: true,
  }),
  preset("immersive-moments", "Immersive Moments", STORY_ENGINES.CHAPTER_FLOW, "Chapter rhythm, gentle tone changes, and modest media.", [["chapter", "image"], ["quote"], ["image", "chapter"]], {
    family: "chapter-longform", recommendedImageCount: [3, 4, 5], longformSuitable: true, imagePattern: ["chapter-right", "chapter-left"], patternRepeat: true, chapterMediaOnly: true, tonal: true,
  }),
  preset("mixed-editorial", "Mixed Editorial", STORY_ENGINES.CHAPTER_FLOW, "Manual composition from every stable Story primitive.", [["text", "image"], ["chapter"], ["quote"], ["image", "text"]], {
    family: "editorial-special", recommendedImageCount: [2, 3, 4, 5, 6, 7, 8], longformSuitable: true, manual: true,
  }),

  preset("portrait-companion-right", "Portrait Companion Right", STORY_ENGINES.SPLIT_RIGHT, "A narrow portrait supports opening text from the right.", [["text", "portrait"], ["text"]], {
    family: "one-image", recommendedImageCount: [1], imagePattern: ["right"], mediaStyle: "portrait",
  }),
  preset("portrait-companion-left", "Portrait Companion Left", STORY_ENGINES.SPLIT_LEFT, "A narrow portrait leads into opening text from the left.", [["portrait", "text"], ["text"]], {
    family: "one-image", recommendedImageCount: [1], imagePattern: ["left"], mediaStyle: "portrait",
  }),
  preset("double-rhythm", "Double Rhythm", STORY_ENGINES.SPLIT_RIGHT, "Two supporting image moments alternate around a prose pause.", [["text", "image"], ["text"], ["image", "text"], ["text"]], {
    family: "multi-image", recommendedImageCount: [2], imagePattern: ["right", "left"], overflowPlacement: "inline",
  }),
  preset("triple-rhythm", "Triple Rhythm", STORY_ENGINES.SPLIT_RIGHT, "Three image moments form a measured magazine narrative.", [["text", "image"], ["image", "text"], ["text"], ["text", "image"]], {
    family: "multi-image", recommendedImageCount: [3], imagePattern: ["right", "left", "right"], overflowPlacement: "inline", editorialRhythm: "triple",
  }),
  preset("five-moment-journey", "Five-Moment Journey", STORY_ENGINES.SPLIT_RIGHT, "Four or five modest images punctuate prose and reflection.", [["text", "image"], ["text"], ["image", "text"], ["quote"], ["text", "image"], ["image", "text"]], {
    family: "multi-image", recommendedImageCount: [4, 5], longformSuitable: true, imagePattern: ["right", "left", "right", "left", "right"], overflowPlacement: "inline",
  }),
  preset("chapter-image-right", "Chapter Image Right", STORY_ENGINES.CHAPTER_FLOW, "Chapter images consistently support text from the right.", [["chapter", "image"], ["chapter"], ["chapter", "image"]], {
    family: "chapter-longform", recommendedImageCount: [1, 2, 3], longformSuitable: true, imagePattern: ["chapter-right"], patternRepeat: true, chapterMediaOnly: true,
  }),
  preset("chapter-image-left", "Chapter Image Left", STORY_ENGINES.CHAPTER_FLOW, "Chapter images consistently lead from the left.", [["image", "chapter"], ["chapter"], ["image", "chapter"]], {
    family: "chapter-longform", recommendedImageCount: [1, 2, 3], longformSuitable: true, imagePattern: ["chapter-left"], patternRepeat: true, chapterMediaOnly: true,
  }),
  preset("chapter-alternating", "Chapter Alternating", STORY_ENGINES.CHAPTER_FLOW, "Longform chapters alternate restrained right and left media.", [["chapter", "image"], ["chapter"], ["image", "chapter"], ["chapter"]], {
    family: "chapter-longform", recommendedImageCount: [3, 4, 5, 6, 7, 8], longformSuitable: true, imagePattern: ["chapter-right", "chapter-left"], patternRepeat: true, chapterMediaOnly: true,
  }),
  preset("image-notes-rail", "Image Notes Rail", STORY_ENGINES.SIDE_RAIL, "A supporting image, caption, and metadata sit in a quiet rail.", [["text", "rail-image"], ["text", "rail"], ["small-image", "text"]], {
    family: "editorial-special", recommendedImageCount: [1, 2], longformSuitable: true, railMedia: true, railStyle: "notes", imagePattern: ["inline"], patternRepeat: true,
  }),
  preset("editorial-portrait-rail", "Editorial Portrait Rail", STORY_ENGINES.SIDE_RAIL, "A tall portrait anchors a narrow secondary rail.", [["text", "portrait"], ["text", "rail"]], {
    family: "one-image", recommendedImageCount: [1], longformSuitable: true, railMedia: true, railStyle: "portrait", mediaStyle: "portrait", imagePattern: ["inline"], patternRepeat: true,
  }),
  preset("reflection-with-image", "Reflection with Image", STORY_ENGINES.SPLIT_RIGHT, "A reflective passage shares space with one supporting image.", [["text"], ["reflection", "image"], ["text"]], {
    family: "editorial-special", recommendedImageCount: [1], longformSuitable: true, imagePattern: ["inline"], patternRepeat: true, reflectionMedia: true,
  }),
  preset("letter-memory", "Letter / Memory", STORY_ENGINES.PROSE, "Book-like prose, a small image, and a letter or quotation rhythm.", [["text"], ["small-image"], ["quote"], ["image", "text"]], {
    family: "text-focused", recommendedImageCount: [0, 1, 2], longformSuitable: true, imagePattern: ["inline", "left"], overflowPlacement: "inline", bookTypography: true, editorialRhythm: "letter",
  }),
  preset("scene-by-scene", "Scene-by-Scene", STORY_ENGINES.CHAPTER_FLOW, "Alternating narrative scenes separated by subtle editorial pauses.", [["chapter", "image"], ["divider"], ["image", "chapter"], ["divider"], ["chapter", "image"]], {
    family: "chapter-longform", recommendedImageCount: [3, 4, 5, 6, 7, 8], longformSuitable: true, imagePattern: ["chapter-right", "chapter-left"], patternRepeat: true, editorialRhythm: "scenes",
  }),
  preset("journal-reader", "Journal Reader", STORY_ENGINES.PROSE, "Intimate prose with small alternating image notes and reflection.", [["text"], ["text", "small-image"], ["chapter"], ["small-image", "text"], ["reflection"]], {
    family: "text-focused", recommendedImageCount: [0, 1, 2, 3], longformSuitable: true, imagePattern: ["right", "left"], overflowPlacement: "inline", mediaStyle: "small", editorialRhythm: "journal",
  }),
  preset("cinematic-rhythm", "Cinematic Rhythm", STORY_ENGINES.SPLIT_RIGHT, "Atmosphere through spacing, captions, and restrained alternating media.", [["text"], ["text", "landscape"], ["text"], ["portrait", "text"], ["quote"]], {
    family: "multi-image", recommendedImageCount: [2, 3, 4], longformSuitable: true, imagePattern: ["right", "left"], overflowPlacement: "inline", editorialRhythm: "cinematic",
  }),
]);

const STORY_LAYOUT_IDS = Object.freeze(STORY_LAYOUT_PRESETS.map((item) => item.id));
const PRESET_BY_ID = new Map(STORY_LAYOUT_PRESETS.map((item) => [item.id, item]));

const LEGACY_LAYOUT_ALIASES = Object.freeze({
  classic: "classic-reader",
  standard: "classic-reader",
  "split-right": "reader-image-right",
  "split-left": "reader-image-left",
  sidebar: "editorial-sidebar",
  alternating: "alternating-editorial",
  "wide-banner": "wide-banner-reader",
  magazine: "magazine-feature",
  visual: "visual-story",
  book: "book-page",
  chapters: "chapter-journey",
  immersive: "immersive-moments",
  mixed: "mixed-editorial",
});

const normalizeStoryLayoutId = (layoutId) => {
  const requested = String(layoutId || "").trim().toLowerCase();
  if (PRESET_BY_ID.has(requested)) return requested;
  return LEGACY_LAYOUT_ALIASES[requested] || "classic-reader";
};

const getStoryLayoutConfig = (layoutId) => PRESET_BY_ID.get(normalizeStoryLayoutId(layoutId)) || STORY_LAYOUT_PRESETS[0];

const getRecommendedStoryLayouts = (imageCount) => {
  const count = Math.max(0, Number(imageCount) || 0);
  return STORY_LAYOUT_PRESETS.filter((layout) => layout.recommendedImageCount.includes(count));
};

module.exports = {
  STORY_ENGINES,
  STORY_LAYOUT_FAMILIES,
  STORY_LAYOUT_PRESETS,
  STORY_LAYOUT_IDS,
  LEGACY_LAYOUT_ALIASES,
  normalizeStoryLayoutId,
  getStoryLayoutConfig,
  getRecommendedStoryLayouts,
};
