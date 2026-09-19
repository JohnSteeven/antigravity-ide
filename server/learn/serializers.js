const metadataBase = (source) => ({
  id: String(source._id || source.id || ""),
  title: source.title,
  slug: source.slug,
  description: source.description,
  creator: source.creatorId?.displayName ? {
    slug: source.creatorId.slug,
    displayName: source.creatorId.displayName,
    headline: source.creatorId.headline,
    profileImage: source.creatorId.profileImage,
  } : undefined,
  topics: Array.isArray(source.topicIds) ? source.topicIds.map((topic) => topic?.name ? { name: topic.name, slug: topic.slug } : topic) : [],
  language: source.language,
  accessLevel: source.accessLevel || "free",
  publicationStatus: source.publicationStatus,
  publishedAt: source.publishedAt,
});

const serializeCourse = (source, { curriculum = [], enrollment = null } = {}) => ({
  ...metadataBase(source),
  subtitle: source.subtitle,
  monetizationType: source.monetizationType || (source.accessLevel === "premium" ? "PREMIUM_INCLUDED" : "FREE"),
  coverImage: source.coverImage,
  coverImageAlt: source.coverImageAlt,
  level: source.level,
  estimatedDurationMinutes: source.estimatedDurationMinutes,
  learningOutcomes: source.learningOutcomes || [],
  prerequisites: source.prerequisites || [],
  moduleCount: source.moduleCount || curriculum.length,
  lessonCount: source.lessonCount || curriculum.reduce((count, module) => count + (module.lessons?.length || 0), 0),
  curriculum,
  enrollment,
  premiumRequired: source.accessLevel === "premium",
});

const serializeLessonMetadata = (source) => ({
  id: String(source._id || source.id || ""),
  stableKey: source.stableKey,
  title: source.title,
  description: source.description,
  lessonType: source.lessonType,
  durationSeconds: source.durationSeconds || 0,
  order: source.order,
  isPreview: Boolean(source.isPreview),
});

const serializeLesson = (source, { allowed = false } = {}) => ({
  ...serializeLessonMetadata(source),
  locked: !allowed,
  ...(allowed ? {
    body: source.body || "",
    transcript: source.transcript || "",
    captions: source.captions || [],
    mediaAssetId: source.mediaAssetId || null,
    resourceIds: source.resourceIds || [],
    completionMode: source.completionMode,
    contentVersion: source.contentVersion,
    codingBlocks: Array.isArray(source.codingBlocks) ? source.codingBlocks.map((b) => ({
      id: String(b.id || ""),
      blockType: b.blockType || "explanation",
      title: b.title || "",
      content: b.content || "",
      language: b.language || "javascript",
      starterCode: b.starterCode || "",
      instructions: b.instructions || "",
      expectedOutput: b.expectedOutput || "",
      hints: Array.isArray(b.hints) ? b.hints : [],
      validationRules: b.validationRules || null,
      order: b.order || 0,
    })) : [],
    quizQuestions: Array.isArray(source.quizQuestions) ? source.quizQuestions.map((q) => ({
      id: String(q.id || ""),
      question: q.question,
      options: Array.isArray(q.options) ? q.options.map((o) => ({ id: String(o.id || ""), text: o.text })) : [],
      order: q.order || 0,
    })) : [],
  } : {}),
});

const serializeVideo = (source, { allowed = false } = {}) => ({
  ...metadataBase(source),
  durationSeconds: source.durationSeconds || 0,
  thumbnail: source.thumbnail,
  thumbnailAlt: source.thumbnailAlt,
  locked: !allowed,
  ...(allowed ? { transcript: source.transcript || "", captionAssetIds: source.captionAssetIds || [], mediaAssetId: source.mediaAssetId || null } : {}),
});

const serializePodcast = (source, { allowed = false } = {}) => ({
  ...metadataBase(source),
  durationSeconds: source.durationSeconds || 0,
  seasonNumber: source.seasonNumber,
  episodeNumber: source.episodeNumber,
  coverImage: source.coverImage,
  locked: !allowed,
  ...(allowed ? { transcript: source.transcript || "", showNotes: source.showNotes || "", chapters: source.chapters || [], mediaAssetId: source.mediaAssetId || null } : {}),
});

const serializeResource = (source, { allowed = false } = {}) => ({
  ...metadataBase(source),
  resourceType: source.resourceType,
  sizeBytes: source.sizeBytes || 0,
  locked: !allowed,
  ...(allowed ? { assetId: source.assetId || null, externalUrl: source.accessLevel === "free" ? source.externalUrl || "" : "" } : {}),
});

module.exports = { metadataBase, serializeCourse, serializeLesson, serializeLessonMetadata, serializePodcast, serializeResource, serializeVideo };
