const {
  getStoryMediaInventory,
  resolveStoryPrimaryImage,
} = require("./storyMedia.cjs");

const NARRATIVE_TYPES = new Set([
  "text",
  "text-image-right",
  "image-left-text",
  "chapter",
  "reflection",
]);

const CHAPTER_COMPANION_TYPES = new Set([
  "text",
  "text-image-right",
  "image-left-text",
]);

const cleanText = (value) => String(value || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const isSuitableMediaSection = (section = {}) => (
  NARRATIVE_TYPES.has(section.type)
  && cleanText(section.body || section.heading || section.chapterTitle).length >= 20
);

const placementForImage = (layout = {}, imageIndex = 0, section = {}) => {
  if (layout.reflectionMedia && section.type === "reflection") return "right";
  const configuredPattern = Array.isArray(layout.imagePattern) ? layout.imagePattern : [];
  const directionalChapterPattern = layout.chapterMediaOnly
    ? configuredPattern.filter((placement) => ["chapter-right", "chapter-left"].includes(placement))
    : [];
  const pattern = directionalChapterPattern.length ? directionalChapterPattern : configuredPattern;
  if (!pattern.length) return layout.manual ? null : "inline";

  let placement;
  if (imageIndex < pattern.length) placement = pattern[imageIndex];
  else if (layout.patternRepeat) placement = pattern[imageIndex % pattern.length];
  else placement = layout.overflowPlacement || "inline";

  if (placement === "chapter-right") return "right";
  if (placement === "chapter-left") return "left";
  return ["right", "left", "inline"].includes(placement) ? placement : "inline";
};

const getChapterCompanionMap = (sections = [], layout = {}) => {
  const companions = new Map();
  if (layout.engine !== "chapter-flow" || !layout.chapterMediaOnly) return companions;

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex === 0 || !section || !CHAPTER_COMPANION_TYPES.has(section.type)) return;
    if (!String(section.image || "").trim() || !isSuitableMediaSection(section)) return;

    const chapterIndex = sectionIndex - 1;
    const chapter = sections[chapterIndex];
    if (chapter?.type !== "chapter" || String(chapter.image || "").trim()) return;

    companions.set(sectionIndex, chapterIndex);
  });

  return companions;
};

const attachCoverFallback = (story, sections, layout) => {
  const inventory = getStoryMediaInventory({ ...story, storySections: sections });
  if (inventory.sectionImages.length || !inventory.cover) return { sections, fallbackIndex: -1 };

  const fallbackIndex = sections.findIndex(isSuitableMediaSection);
  if (fallbackIndex < 0) return { sections, fallbackIndex: -1 };

  const fallbackPlacement = layout.manual
    ? "right"
    : placementForImage(layout, 0, sections[fallbackIndex]);
  return {
    fallbackIndex,
    sections: sections.map((section, index) => index === fallbackIndex ? {
      ...section,
      image: inventory.cover.src,
      alt: inventory.cover.alt,
      caption: inventory.cover.caption,
      imageSize: section.imageSize || "medium",
      _storyMediaFallback: true,
      _storyPlacement: fallbackPlacement,
    } : section),
  };
};

const composeStoryLayout = (story = {}, inputSections = [], layout = {}) => {
  const originalSections = Array.isArray(inputSections) ? inputSections : [];
  const initialInventory = getStoryMediaInventory({ ...story, storySections: originalSections });
  const isRailLayout = layout.engine === "side-rail" || layout.railMedia;
  const railMedia = isRailLayout
    ? resolveStoryPrimaryImage({ ...story, storySections: originalSections }, { preferCover: true })
    : null;

  const fallback = isRailLayout
    ? { sections: originalSections, fallbackIndex: -1 }
    : attachCoverFallback(story, originalSections, layout);
  const chapterCompanions = getChapterCompanionMap(fallback.sections, layout);
  const chaptersWithCompanions = new Set(chapterCompanions.values());

  if (layout.manual && fallback.fallbackIndex < 0) {
    return {
      sections: originalSections,
      railMedia,
      diagnostics: {
        preset: layout.id || "classic-reader",
        engine: layout.engine || "prose",
        sectionCount: originalSections.length,
        imageCount: initialInventory.imageCount,
        sectionImageCount: initialInventory.sectionImageCount,
        placements: originalSections.map((section) => section.type),
        manual: true,
      },
    };
  }

  let imageIndex = 0;
  let mediaMoment = 0;
  let consumedRailSection = false;
  const sections = fallback.sections.map((section, sectionIndex) => {
    if (!section || typeof section !== "object") return section;
    const composable = NARRATIVE_TYPES.has(section.type) || ["image", "wide-image"].includes(section.type);
    if (!composable) return section;
    const hasImage = Boolean(String(section.image || "").trim());
    const railMatchesSection = Boolean(
      railMedia
      && hasImage
      && !consumedRailSection
      && String(railMedia.src).trim() === String(section.image).trim()
    );

    let placement = section._storyPlacement || null;
    if (railMatchesSection) {
      placement = "rail";
      consumedRailSection = true;
    } else if (hasImage && !layout.manual) {
      if (layout.chapterMediaOnly && section.type !== "chapter" && !chapterCompanions.has(sectionIndex)) {
        placement = "inline";
      } else {
        placement = placementForImage(layout, imageIndex, section);
        imageIndex += 1;
      }
    }

    if (!placement && !layout.manual) placement = "prose";
    if (!placement) return section;
    const storyMediaMoment = hasImage && placement !== "rail" ? ++mediaMoment : null;

    return {
      ...section,
      _storyPlacement: placement,
      _storyMediaStyle: layout.mediaStyle || (placement === "inline" ? "inline" : "supporting"),
      _storyPresetId: layout.id || "classic-reader",
      _storySectionIndex: sectionIndex,
      _storyMediaMoment: storyMediaMoment,
      ...(chapterCompanions.has(sectionIndex) ? { _storyChapterOwnerIndex: chapterCompanions.get(sectionIndex) } : {}),
      ...(chaptersWithCompanions.has(sectionIndex) ? { _storyHasCompanion: true } : {}),
    };
  });

  const finalInventory = getStoryMediaInventory({ ...story, storySections: sections });
  return {
    sections,
    railMedia,
    diagnostics: {
      preset: layout.id || "classic-reader",
      engine: layout.engine || "prose",
      sectionCount: sections.length,
      imageCount: finalInventory.imageCount,
      sectionImageCount: finalInventory.sectionImageCount,
      placements: sections.map((section) => section?._storyPlacement || section?.type || "unknown"),
      manual: Boolean(layout.manual),
    },
  };
};

const getStoryResponsiveContract = (viewportWidth) => {
  const width = Math.max(0, Number(viewportWidth) || 0);
  const shellGutter = Math.max(32, Math.min(width * 0.07, 112));
  const shellWidth = Math.min(Math.max(0, width - shellGutter), 1240);
  return {
    viewportWidth: width,
    shellWidth: Math.round(shellWidth),
    splitColumns: width > 900 && shellWidth > 839,
    bookColumns: shellWidth > 1019,
    sideRail: shellWidth > 1139,
    maxSupportingImageWidth: 400,
  };
};

module.exports = {
  composeStoryLayout,
  getStoryResponsiveContract,
  isSuitableMediaSection,
  placementForImage,
};
