const STORY_SECTION_TYPES = Object.freeze([
  "text",
  "text-image-right",
  "image-left-text",
  "chapter",
  "quote",
  "reflection",
  "scene-break",
  "image",
  "wide-image",
]);

const {
  STORY_LAYOUT_IDS,
  normalizeStoryLayoutId,
} = require("../../src/stories/storyLayoutCatalog.cjs");

const TYPE_ALIASES = Object.freeze({
  prose: "text",
  "text-image": "text-image-right",
  "split-right": "text-image-right",
  text_image_right: "text-image-right",
  "text-with-image-right": "text-image-right",
  "image-text": "image-left-text",
  "split-left": "image-left-text",
  image_left_text: "image-left-text",
  "image-left-with-text": "image-left-text",
  scene_break: "scene-break",
  divider: "scene-break",
  wide_image: "wide-image",
});

const cleanString = (value) => (value === undefined || value === null ? "" : String(value));

const stripHtml = (value = "") => cleanString(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&[a-z0-9#]+;/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

const normalizeStoryLayout = (layoutId) => {
  return normalizeStoryLayoutId(layoutId);
};

const normalizeSectionType = (type) => {
  const normalized = cleanString(type || "text").trim().toLowerCase();
  if (STORY_SECTION_TYPES.includes(normalized)) return normalized;
  return TYPE_ALIASES[normalized] || "text";
};

const normalizeImageSize = (size) => {
  const normalized = cleanString(size || "medium").trim().toLowerCase();
  return ["small", "medium", "portrait"].includes(normalized) ? normalized : "medium";
};

const normalizeStorySections = (sections) => {
  if (!Array.isArray(sections)) return [];

  return sections.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const type = normalizeSectionType(raw.type);
    const sourceImages = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
    const firstLegacyImage = sourceImages[0];
    const image = cleanString(raw.image || firstLegacyImage?.url || firstLegacyImage?.src || firstLegacyImage);
    const section = {
      id: cleanString(raw.id) || `story-section-${index + 1}`,
      type,
      heading: cleanString(raw.heading),
      body: cleanString(raw.body),
      image,
      alt: cleanString(raw.alt || raw.altText || firstLegacyImage?.alt || firstLegacyImage?.altText),
      caption: cleanString(raw.caption || firstLegacyImage?.caption),
      imageSize: normalizeImageSize(raw.imageSize || raw.size),
      imageWidth: Number(raw.imageWidth) || undefined,
      imageHeight: Number(raw.imageHeight) || undefined,
      chapterNumber: cleanString(raw.chapterNumber),
      chapterTitle: cleanString(raw.chapterTitle || (type === "chapter" ? raw.heading || raw.title : "")),
      imageSide: (raw.imageSide || raw.imagePosition) === "left" ? "left" : "right",
      quote: cleanString(raw.quote),
      attribution: cleanString(raw.attribution),
    };

    // Historical three-column/multi-image sections are always linearized.
    const extras = sourceImages.slice(image ? 1 : 0).map((item, extraIndex) => ({
      id: `${section.id}-image-${extraIndex + 2}`,
      type: "image",
      heading: "",
      body: "",
      image: cleanString(item?.url || item?.src || item),
      alt: cleanString(item?.alt),
      caption: cleanString(item?.caption),
      imageSize: normalizeImageSize(item?.imageSize || item?.size),
      imageWidth: Number(item?.imageWidth) || undefined,
      imageHeight: Number(item?.imageHeight) || undefined,
      chapterNumber: "",
      chapterTitle: "",
      imageSide: "right",
      quote: "",
      attribution: "",
    }));

    return [section, ...extras];
  });
};

const getStoryWordCount = (story = {}) => {
  const sections = Array.isArray(story.storySections) ? normalizeStorySections(story.storySections) : [];
  const content = sections.length
    ? sections.map((section) => [section.heading, section.chapterTitle, section.body, section.quote, section.attribution].join(" ")).join(" ")
    : story.body || "";
  return stripHtml([story.title, story.description, story.reflection, content].join(" "))
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

const calculateStoryReadingTime = (story = {}) => Math.max(1, Math.ceil(getStoryWordCount(story) / 200));

const validateStorySections = (sections, { publishing = false } = {}) => {
  const errors = [];
  const normalized = normalizeStorySections(sections);

  normalized.forEach((section, index) => {
    const label = `Section ${index + 1}`;
    const body = stripHtml(section.body);
    const isSplit = ["text-image-right", "image-left-text"].includes(section.type);
    if (publishing && isSplit) {
      if (body.length < 20) errors.push(`${label}: paired image sections need meaningful body text.`);
      if (!section.image.trim()) errors.push(`${label}: an image is required.`);
      if (!section.alt.trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && section.type === "chapter") {
      if (!section.chapterTitle.trim()) errors.push(`${label}: chapter title is required.`);
      if (body.length < 20) errors.push(`${label}: chapter body needs meaningful text.`);
      if (section.image && !section.alt.trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && ["image", "wide-image"].includes(section.type)) {
      if (!section.image.trim()) errors.push(`${label}: an image is required.`);
      if (!section.alt.trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && section.type === "quote" && !stripHtml(section.quote)) errors.push(`${label}: quote text is required.`);
    if (publishing && section.type === "reflection" && body.length < 10) errors.push(`${label}: reflection text is required.`);
    if (publishing && section.type === "reflection" && section.image && !section.alt.trim()) errors.push(`${label}: image alt text is required.`);
  });

  return errors;
};

module.exports = {
  STORY_LAYOUT_IDS,
  STORY_SECTION_TYPES,
  stripHtml,
  normalizeStoryLayout,
  normalizeStorySections,
  getStoryWordCount,
  calculateStoryReadingTime,
  validateStorySections,
};
