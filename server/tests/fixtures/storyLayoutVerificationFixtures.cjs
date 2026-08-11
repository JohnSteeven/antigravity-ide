const { STORY_LAYOUT_IDS } = require("../../../src/stories/storyLayoutCatalog.cjs");

const image = (index) => ({
  image: `/verification/story-image-${index}.jpg`,
  alt: `Verification image ${index}`,
  caption: `Supporting moment ${index}`,
  imageSize: index % 3 === 0 ? "portrait" : index % 2 === 0 ? "square" : "landscape",
});

const createLayoutVerificationStory = (layoutId, imageCount = 5) => {
  const available = Array.from({ length: Math.max(0, imageCount) }, (_, index) => image(index + 1));
  const withImage = (index) => available[index] || {};

  return {
    id: `layout-verification-${layoutId}`,
    title: `Layout verification: ${layoutId}`,
    slug: `layout-verification-${layoutId}`,
    description: "The same development-only Story content is used to compare layout composition.",
    contentType: "story",
    status: "draft",
    storyLayout: layoutId,
    coverImage: imageCount === 1 ? "/verification/story-image-1.jpg" : "",
    coverImageAlt: imageCount === 1 ? "Verification listing cover" : "",
    storySections: [
      { id: "opening", type: "text-image-right", heading: "Opening", body: "A substantial opening passage keeps the Story text primary while a supporting image remains attached to this exact narrative section.", ...withImage(0) },
      { id: "prose-one", type: "text", heading: "Prose", body: "A prose passage separates visual moments and preserves the semantic order of the development Story." },
      { id: "turn", type: "image-left-text", heading: "The turn", body: "The second narrative passage carries its own image reference without permitting the preset to reorder this text.", ...withImage(1) },
      { id: "quote", type: "quote", quote: "Images support the Story; they do not become the Story.", attribution: "Verification contract" },
      { id: "chapter", type: "chapter", chapterNumber: "03", chapterTitle: "A chapter moment", body: "This chapter remains in its original sequence while the selected preset determines its visual placement.", ...withImage(2) },
      { id: "reflection", type: "reflection", heading: "Reflection", body: "A reflective passage provides a quieter textual beat within the same reusable verification content.", ...withImage(3) },
      { id: "break", type: "scene-break" },
      { id: "ending", type: "text-image-right", heading: "Ending", body: "The final passage closes the Story without grouping images together or introducing a gallery-like reading flow.", ...withImage(4) },
      ...available.slice(5).map((media, index) => ({
        id: `extra-${index + 6}`,
        type: index % 2 ? "image-left-text" : "text-image-right",
        heading: `Supporting passage ${index + 6}`,
        body: "An additional supporting passage ensures high image counts remain distributed through narrative text.",
        ...media,
      })),
    ],
  };
};

const allLayoutVerificationStories = STORY_LAYOUT_IDS.map((layoutId) => createLayoutVerificationStory(layoutId, 5));

module.exports = {
  createLayoutVerificationStory,
  allLayoutVerificationStories,
};
