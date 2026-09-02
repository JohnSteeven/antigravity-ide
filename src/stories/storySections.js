export const STORY_SECTION_TYPES = Object.freeze({
  TEXT: "text",
  TEXT_IMAGE_RIGHT: "text-image-right",
  IMAGE_LEFT_TEXT: "image-left-text",
  CHAPTER: "chapter",
  QUOTE: "quote",
  REFLECTION: "reflection",
  SCENE_BREAK: "scene-break",
  IMAGE: "image",
  WIDE_IMAGE: "wide-image",
});

export const STORY_IMAGE_SIZES = Object.freeze(["small", "medium", "portrait"]);

export const STORY_SECTION_OPTIONS = Object.freeze([
  { type: STORY_SECTION_TYPES.TEXT, label: "Text", description: "A normal reading-width passage." },
  { type: STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, label: "Text + Image Right", description: "Text-led split with one supporting image." },
  { type: STORY_SECTION_TYPES.IMAGE_LEFT_TEXT, label: "Image Left + Text", description: "One supporting image followed by text." },
  { type: STORY_SECTION_TYPES.CHAPTER, label: "Chapter", description: "A numbered chapter with optional modest media." },
  { type: STORY_SECTION_TYPES.QUOTE, label: "Quote", description: "An editorial quotation with optional attribution." },
  { type: STORY_SECTION_TYPES.REFLECTION, label: "Reflection", description: "A quiet reflective aside." },
  { type: STORY_SECTION_TYPES.SCENE_BREAK, label: "Scene Break", description: "A subtle pause between scenes." },
]);

const TYPE_ALIASES = Object.freeze({
  prose: STORY_SECTION_TYPES.TEXT,
  "text-image": STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT,
  "split-right": STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT,
  "text_image_right": STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT,
  "text-with-image-right": STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT,
  "image-text": STORY_SECTION_TYPES.IMAGE_LEFT_TEXT,
  "split-left": STORY_SECTION_TYPES.IMAGE_LEFT_TEXT,
  "image_left_text": STORY_SECTION_TYPES.IMAGE_LEFT_TEXT,
  "image-left-with-text": STORY_SECTION_TYPES.IMAGE_LEFT_TEXT,
  "scene_break": STORY_SECTION_TYPES.SCENE_BREAK,
  divider: STORY_SECTION_TYPES.SCENE_BREAK,
  "wide_image": STORY_SECTION_TYPES.WIDE_IMAGE,
});

export const normalizeSectionType = (type) => {
  const normalized = String(type || STORY_SECTION_TYPES.TEXT).trim().toLowerCase();
  if (Object.values(STORY_SECTION_TYPES).includes(normalized)) return normalized;
  return TYPE_ALIASES[normalized] || STORY_SECTION_TYPES.TEXT;
};

export const makeStorySectionId = () =>
  `story-section-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const createStorySection = (type = STORY_SECTION_TYPES.TEXT) => {
  const normalizedType = normalizeSectionType(type);
  const common = { id: makeStorySectionId(), type: normalizedType };

  if (normalizedType === STORY_SECTION_TYPES.QUOTE) {
    return { ...common, quote: "", attribution: "", quoteSource: "", quoteStyle: "classic" };
  }
  if (normalizedType === STORY_SECTION_TYPES.REFLECTION) {
    return { ...common, heading: "", body: "" };
  }
  if (normalizedType === STORY_SECTION_TYPES.SCENE_BREAK) return common;
  if (normalizedType === STORY_SECTION_TYPES.CHAPTER) {
    return {
      ...common,
      chapterNumber: "",
      chapterTitle: "",
      body: "",
      image: "",
      alt: "",
      caption: "",
      imageSize: "medium",
      imageSide: "right",
    };
  }
  if ([STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT].includes(normalizedType)) {
    return { ...common, heading: "", body: "", image: "", alt: "", caption: "", imageSize: "medium" };
  }
  if ([STORY_SECTION_TYPES.IMAGE, STORY_SECTION_TYPES.WIDE_IMAGE].includes(normalizedType)) {
    return { ...common, image: "", alt: "", caption: "", imageSize: "medium" };
  }
  return { ...common, heading: "", body: "" };
};

export const stripStoryHtml = (value = "") =>
  String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getStorySectionText = (section = {}) =>
  [section.heading, section.chapterTitle, section.body, section.quote, section.attribution, section.quoteSource]
    .map(stripStoryHtml)
    .filter(Boolean)
    .join(" ");

export const calculateStoryReadingTime = (story = {}) => {
  const structuredText = Array.isArray(story.storySections) && story.storySections.length
    ? story.storySections.map(getStorySectionText).join(" ")
    : stripStoryHtml(story.body || "");
  const supportingText = [story.title, story.description, story.reflection]
    .map(stripStoryHtml)
    .filter(Boolean)
    .join(" ");
  const words = `${structuredText} ${supportingText}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const normalizeImageSize = (size) => {
  const normalized = String(size || "medium").toLowerCase();
  if (STORY_IMAGE_SIZES.includes(normalized)) return normalized;
  // Legacy wide/large options are capped by the renderer instead of propagated.
  return "medium";
};

const normalizeOneSection = (section, index) => {
  const type = normalizeSectionType(section?.type);
  const normalized = {
    ...section,
    id: section?.id || `story-section-${index + 1}`,
    type,
    imageSize: normalizeImageSize(section?.imageSize || section?.size),
    alt: section?.alt || section?.altText || "",
  };
  delete normalized.images;

  if (type === STORY_SECTION_TYPES.CHAPTER) {
    normalized.chapterTitle = section.chapterTitle || section.heading || section.title || "";
    normalized.imageSide = (section.imageSide || section.imagePosition) === "left" ? "left" : "right";
  }
  if (type === STORY_SECTION_TYPES.QUOTE) {
    normalized.quoteSource = section.quoteSource || section.source || "";
    normalized.quoteStyle = ["classic", "pull-quote", "aside"].includes(section.quoteStyle || section.stylePreset)
      ? (section.quoteStyle || section.stylePreset)
      : "classic";
  }
  return normalized;
};

export const normalizeStorySections = (sections = []) => {
  if (!Array.isArray(sections)) return [];

  return sections.flatMap((rawSection, index) => {
    if (!rawSection || typeof rawSection !== "object") return [];
    const section = normalizeOneSection(rawSection, index);
    const extraImages = Array.isArray(rawSection.images)
      ? rawSection.images.filter(Boolean).slice(section.image ? 0 : 1)
      : [];

    if (!section.image && Array.isArray(rawSection.images) && rawSection.images[0]) {
      section.image = rawSection.images[0].url || rawSection.images[0].src || rawSection.images[0];
      section.alt = rawSection.images[0].alt || section.alt || "";
    }

    // Historical multi-image rows are linearized. No renderer path receives
    // more than one image for a visual row.
    const supplemental = extraImages.map((item, extraIndex) => ({
      id: `${section.id}-image-${extraIndex + 2}`,
      type: STORY_SECTION_TYPES.IMAGE,
      image: item.url || item.src || item,
      alt: item.alt || "",
      caption: item.caption || "",
      imageSize: normalizeImageSize(item.imageSize || item.size),
    }));

    return [section, ...supplemental];
  });
};

export const validateStorySections = (sections = [], { publishing = false } = {}) => {
  const errors = [];
  const normalized = normalizeStorySections(sections);

  normalized.forEach((section, index) => {
    const label = `Section ${index + 1}`;
    const body = stripStoryHtml(section.body || "");
    const isSplit = [STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT].includes(section.type);

    if (publishing && isSplit) {
      if (body.length < 20) errors.push(`${label}: paired image sections need meaningful body text.`);
      if (!String(section.image || "").trim()) errors.push(`${label}: an image is required.`);
      if (!String(section.alt || "").trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && section.type === STORY_SECTION_TYPES.CHAPTER) {
      if (!String(section.chapterTitle || "").trim()) errors.push(`${label}: chapter title is required.`);
      if (body.length < 20) errors.push(`${label}: chapter body needs meaningful text.`);
      if (section.image && !String(section.alt || "").trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && [STORY_SECTION_TYPES.IMAGE, STORY_SECTION_TYPES.WIDE_IMAGE].includes(section.type)) {
      if (!String(section.image || "").trim()) errors.push(`${label}: an image is required.`);
      if (!String(section.alt || "").trim()) errors.push(`${label}: image alt text is required.`);
    }
    if (publishing && section.type === STORY_SECTION_TYPES.QUOTE && !stripStoryHtml(section.quote || "")) {
      errors.push(`${label}: quote text is required.`);
    }
    if (publishing && section.type === STORY_SECTION_TYPES.REFLECTION && body.length < 10) {
      errors.push(`${label}: reflection text is required.`);
    }
    if (publishing && section.type === STORY_SECTION_TYPES.REFLECTION && section.image && !String(section.alt || "").trim()) {
      errors.push(`${label}: image alt text is required.`);
    }
  });

  return errors;
};
