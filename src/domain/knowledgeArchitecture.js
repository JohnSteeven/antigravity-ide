export const categoryBlueprints = [
  {
    id: "cat-life",
    name: "Life",
    slug: "life",
    description: "Personal notes on habits, relationships, and ordinary days.",
    longDescription:
      "Daily journals, growth notes, goals, habits, health, relationships, productivity, faith, and memories gathered into one calm personal archive.",
    icon: "heart",
    heroImage:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "Daily Journals",
      "Personal Growth",
      "Goals",
      "Habits",
      "Health",
      "Relationships",
      "Productivity",
      "Faith",
      "Memories",
    ],
  },
  {
    id: "cat-incidents",
    name: "Incidents",
    slug: "incidents",
    description: "Memorable moments and turning points from real experience.",
    longDescription:
      "Real life events, work experiences, failures, success stories, office incidents, funny moments, and learning experiences preserved with context.",
    icon: "book",
    heroImage:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "Real Life Events",
      "Work Experiences",
      "Failures",
      "Success Stories",
      "Office Incidents",
      "Funny Moments",
      "Learning Experiences",
    ],
  },
  {
    id: "cat-reflections",
    name: "Reflections",
    slug: "reflections",
    description: "Slower essays about meaning, change, and self-awareness.",
    longDescription:
      "Thoughts, meditations, Bible reflections, life reflections, career reflections, and daily reflection entries for deeper review.",
    icon: "feather",
    heroImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "Thoughts",
      "Meditations",
      "Bible Reflections",
      "Life Reflections",
      "Career Reflections",
      "Daily Reflection",
    ],
  },
  {
    id: "cat-lessons",
    name: "Lessons",
    slug: "lessons",
    description: "Practical lessons learned through wins, mistakes, and repair.",
    longDescription:
      "Life lessons, books, leadership, business, technology, spiritual lessons, and career advice shaped into reusable knowledge.",
    icon: "award",
    heroImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "Life Lessons",
      "Books",
      "Leadership",
      "Business",
      "Technology",
      "Spiritual Lessons",
      "Career Advice",
    ],
  },
  {
    id: "cat-travel",
    name: "Travel",
    slug: "travel",
    description: "Places, movement, and what the road teaches.",
    longDescription:
      "Countries, cities, trips, travel guides, budgets, food, hotels, and photography notes from journeys worth remembering.",
    icon: "send",
    heroImage:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "Countries",
      "Cities",
      "Trips",
      "Travel Guides",
      "Budget",
      "Food",
      "Hotels",
      "Photography",
    ],
  },
  {
    id: "cat-coding",
    name: "Coding",
    slug: "coding",
    description: "Projects, systems, and the craft of building software.",
    longDescription:
      "JavaScript, TypeScript, React, NextJS, NodeJS, Java, Python, SAP, SQL, system design, interview questions, DevOps, cloud, AI, coding tips, and projects.",
    icon: "code",
    heroImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "JavaScript",
      "TypeScript",
      "React",
      "NextJS",
      "NodeJS",
      "Java",
      "Python",
      "SAP",
      "SQL",
      "System Design",
      "Interview Questions",
      "DevOps",
      "Cloud",
      "AI",
      "Coding Tips",
      "Projects",
    ],
  },
];

export const categoryBlueprintBySlug = categoryBlueprints.reduce(
  (map, category) => ({
    ...map,
    [category.slug]: category,
  }),
  {}
);

export const getCategoryBlueprint = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return categoryBlueprints.find(
    (category) =>
      category.slug === normalized || category.name.toLowerCase() === normalized
  );
};

export const articleCapabilityGroups = [
  {
    name: "Content",
    fields: [
      "title",
      "slug",
      "featuredImage",
      "gallery",
      "markdown",
      "richText",
      "codeBlocks",
      "video",
      "audio",
      "pdfAttachment",
    ],
  },
  {
    name: "Publishing",
    fields: [
      "draft",
      "published",
      "archived",
      "featured",
      "pinned",
      "scheduledPublish",
      "versionHistory",
    ],
  },
  {
    name: "SEO",
    fields: [
      "seoTitle",
      "seoDescription",
      "seoKeywords",
      "canonicalUrl",
      "openGraphImage",
      "metaRobots",
    ],
  },
  {
    name: "Engagement",
    fields: [
      "readingTime",
      "relatedPosts",
      "views",
      "likes",
      "bookmarks",
      "comments",
    ],
  },
];

export const cmsNavigation = [
  {
    group: "Publishing",
    items: [
      { id: "overview", label: "Dashboard", icon: "dashboard" },
      { id: "articles", label: "Articles", icon: "edit" },
      { id: "categories", label: "Categories", icon: "folder" },
      { id: "subcategories", label: "Sub Categories", icon: "layers" },
      { id: "tags", label: "Tags", icon: "tag" },
      { id: "media", label: "Media Library", icon: "image" },
      { id: "comments", label: "Comments", icon: "message" },
    ],
  },
  {
    group: "Access",
    items: [
      { id: "users", label: "Users", icon: "users" },
      { id: "roles", label: "Roles", icon: "shield" },
      { id: "permissions", label: "Permissions", icon: "lock" },
    ],
  },
  {
    group: "Experience",
    items: [
      { id: "analytics", label: "Analytics", icon: "analytics" },
      { id: "seo", label: "SEO", icon: "search" },
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "navigation", label: "Navigation Menu", icon: "navigation" },
      { id: "footer", label: "Footer", icon: "footer" },
      { id: "hero", label: "Homepage", icon: "home" },
      { id: "testimonials", label: "Testimonials", icon: "star" },
      { id: "quotes", label: "Quotes", icon: "book" },
      { id: "gallery", label: "Gallery", icon: "grid" },
      { id: "timeline", label: "Timeline", icon: "clock" },
      { id: "projects", label: "Projects", icon: "briefcase" },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "newsletters", label: "Newsletters", icon: "send" },
      { id: "contact", label: "Contact Messages", icon: "mail" },
      { id: "backups", label: "Backups", icon: "archive" },
      { id: "logs", label: "Logs", icon: "activity" },
      { id: "profile", label: "Profile", icon: "profile" },
    ],
  },
];

export const publicRoutes = [
  { path: "/", label: "Home", module: "marketing.home" },
  { path: "/articles", label: "Articles", module: "articles.index" },
  { path: "/articles/:slug", label: "Article Detail", module: "articles.detail" },
  { path: "/category/:slug", label: "Category Detail", module: "categories.detail" },
];

export const protectedRoutes = [
  { path: "/cms", label: "CMS Dashboard", role: "Editor" },
  { path: "/profile", label: "Profile", role: "Viewer" },
  { path: "/edit-profile", label: "Edit Profile", role: "Viewer" },
];
