const DEVELOPMENT_FIXTURES = Object.freeze({
  personas: [
    {
      key: "experienced-writer",
      applicationStatus: "active",
      displayName: "Maya Sen",
      headline: "Long-form writer on work, identity, and meaningful change",
      biography: "Maya turns lived experience and careful reporting into practical essays for people navigating work and personal change.",
      creatorTypes: ["writer"],
      specialties: ["Writing", "Career transitions", "Reflection"],
      languages: ["English"],
      intendedFormats: ["article", "story"],
    },
    {
      key: "practical-educator",
      applicationStatus: "active",
      displayName: "Arun Das",
      headline: "Educator building calm, structured paths into difficult ideas",
      biography: "Arun designs compact Courses with durable Lesson structure, clear outcomes, and practical exercises for independent learners.",
      creatorTypes: ["educator"],
      specialties: ["Learning design", "Productivity", "Critical thinking"],
      languages: ["English", "Hindi"],
      intendedFormats: ["course", "resource"],
    },
    {
      key: "multi-format-creator",
      applicationStatus: "approved",
      displayName: "Leena Morgan",
      headline: "Storyteller exploring relationships, cities, and second chances",
      biography: "Leena works across narrative writing, audio conversations, and short visual explainers while keeping every format editorially distinct.",
      creatorTypes: ["storyteller", "podcaster"],
      specialties: ["Relationships", "Cities", "Story craft"],
      languages: ["English"],
      intendedFormats: ["story", "video", "podcast"],
    },
    {
      key: "application-needs-information",
      applicationStatus: "more_info_required",
      displayName: "Dev Rao",
      headline: "Software practitioner sharing responsible engineering lessons",
      biography: "Dev documents software decisions and the operational lessons behind them, with an emphasis on evidence and responsible claims.",
      creatorTypes: ["specialist"],
      specialties: ["Software engineering", "Operations"],
      languages: ["English"],
      intendedFormats: ["article", "course"],
    },
  ],
  topics: [
    { name: "Personal Growth", slug: "personal-growth", description: "Practical reflection and sustainable change." },
    { name: "Creative Practice", slug: "creative-practice", description: "Writing, making, and building a body of work." },
    { name: "Technology", slug: "technology", description: "Responsible technical knowledge and practice." },
    { name: "Relationships", slug: "relationships", description: "Communication, connection, and human experience." },
  ],
  content: [
    { key: "writer-article", owner: "experienced-writer", contentType: "article", title: "The Quiet Work of Beginning Again", accessLevel: "free", workflowStatus: "published" },
    { key: "writer-story", owner: "experienced-writer", contentType: "story", title: "The Train I Almost Did Not Take", accessLevel: "premium", workflowStatus: "published", storyLayout: "chapter-journey" },
    { key: "educator-course", owner: "practical-educator", contentType: "course", title: "A Practical System for Clearer Thinking", accessLevel: "premium", workflowStatus: "published", moduleCount: 2, lessonCount: 4 },
    { key: "educator-resource", owner: "practical-educator", contentType: "resource", title: "Weekly Reflection Worksheet", accessLevel: "free", workflowStatus: "submitted", providerAssetAvailable: false },
    { key: "multiformat-video", owner: "multi-format-creator", contentType: "video", title: "How a Scene Changes Meaning", accessLevel: "free", workflowStatus: "draft", providerAssetAvailable: false },
    { key: "multiformat-podcast", owner: "multi-format-creator", contentType: "podcast", title: "The Conversations We Postpone", accessLevel: "premium", workflowStatus: "draft", providerAssetAvailable: false },
  ],
  economy: { active: false, earningsAmount: null, payoutAvailable: false },
});

const assertFixtureEnvironment = (environment = process.env.NODE_ENV) => {
  if (environment === "production") throw Object.assign(new Error("Creator + Learn fixtures cannot run in production."), { code: "PRODUCTION_FIXTURES_DISABLED" });
  return true;
};

const buildCreatorLearnFixtures = ({ environment = process.env.NODE_ENV } = {}) => {
  assertFixtureEnvironment(environment);
  return JSON.parse(JSON.stringify(DEVELOPMENT_FIXTURES));
};

module.exports = { DEVELOPMENT_FIXTURES, assertFixtureEnvironment, buildCreatorLearnFixtures };
