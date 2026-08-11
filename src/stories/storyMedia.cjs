const cleanString = (value) => (
  value === undefined || value === null ? "" : String(value).trim()
);

const normalizeComparableSrc = (value) => cleanString(value).replace(/\/$/, "");

const sectionMediaCandidates = (story = {}) => {
  if (!Array.isArray(story.storySections)) return [];

  return story.storySections.flatMap((section, sectionIndex) => {
    if (!section || typeof section !== "object") return [];

    const candidates = [];
    const directSrc = cleanString(section.image);
    if (directSrc) {
      candidates.push({
        src: directSrc,
        alt: cleanString(section.alt || section.altText),
        caption: cleanString(section.caption),
        source: "section",
        field: `storySections[${sectionIndex}].image`,
        sectionIndex,
      });
    }

    if (Array.isArray(section.images)) {
      section.images.forEach((item, imageIndex) => {
        const isObject = item && typeof item === "object";
        const src = cleanString(isObject ? item.url || item.src : item);
        if (!src) return;
        candidates.push({
          src,
          alt: cleanString(isObject ? item.alt || item.altText : ""),
          caption: cleanString(isObject ? item.caption : ""),
          source: "section",
          field: `storySections[${sectionIndex}].images[${imageIndex}]`,
          sectionIndex,
        });
      });
    }

    return candidates;
  });
};

const coverMediaCandidate = (story = {}) => {
  const src = cleanString(story.coverImage);
  if (!src) return null;
  return {
    src,
    alt: cleanString(story.coverImageAlt),
    caption: "",
    source: "cover",
    field: "coverImage",
    sectionIndex: null,
  };
};

const getStoryMediaInventory = (story = {}) => {
  const sectionImages = sectionMediaCandidates(story);
  const cover = coverMediaCandidate(story);
  const all = [...sectionImages, ...(cover ? [cover] : [])];
  const seen = new Set();
  const unique = all.filter((candidate) => {
    const comparable = normalizeComparableSrc(candidate.src);
    if (!comparable || seen.has(comparable)) return false;
    seen.add(comparable);
    return true;
  });

  return {
    cover,
    sectionImages,
    all,
    unique,
    imageCount: unique.length,
    sectionImageCount: sectionImages.length,
  };
};

/**
 * Resolves Story media from fields that are present in the production schema
 * and existing Story documents: coverImage and storySections image/images.
 */
const resolveStoryPrimaryImage = (story = {}, options = {}) => {
  const {
    includeSectionImages = true,
    includeCoverImage = true,
    preferCover = false,
    excludeCoverIfUsedInSections = false,
    excludeSrc = [],
  } = options;

  const inventory = getStoryMediaInventory(story);
  const sectionCandidates = inventory.sectionImages;
  let coverCandidate = inventory.cover;
  const excluded = new Set(
    (Array.isArray(excludeSrc) ? excludeSrc : [excludeSrc])
      .map(normalizeComparableSrc)
      .filter(Boolean)
  );

  if (
    coverCandidate
    && excludeCoverIfUsedInSections
    && sectionCandidates.some((candidate) => normalizeComparableSrc(candidate.src) === normalizeComparableSrc(coverCandidate.src))
  ) {
    coverCandidate = null;
  }

  const candidates = preferCover
    ? [includeCoverImage && coverCandidate, ...(includeSectionImages ? sectionCandidates : [])]
    : [...(includeSectionImages ? sectionCandidates : []), includeCoverImage && coverCandidate];
  const resolved = candidates.find((candidate) => candidate && !excluded.has(normalizeComparableSrc(candidate.src)));

  return resolved ? { ...resolved, altMissing: !resolved.alt } : null;
};

module.exports = {
  getStoryMediaInventory,
  resolveStoryPrimaryImage,
};
