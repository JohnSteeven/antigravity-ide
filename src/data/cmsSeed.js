import { categoryBlueprints } from "../domain/knowledgeArchitecture";

export const cmsSeed = {
  site: {
    brand: "MyJourney",
    hero: {
      eyebrow: "Stories from a life in motion",
      title: "Stories, Thoughts & Experiences.",
      description:
        "A personal journal for honest lessons, meaningful projects, and moments that shaped the way I see the world.",
      primaryLabel: "Start Reading",
      secondaryLabel: "Read My Story",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    },
    storyIntro: {
      subtitle: "A place for stories",
      text:
        "This is my corner of the internet where I share life experiences, lessons, memorable incidents, and thoughts that shaped my journey.",
      cta: "Read My Story",
    },
    quote: {
      text:
        "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
      author: "A reminder I keep close",
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
    },
    footer:
      "Thank you for being a part of my journey. Let's grow, learn, and build meaningful things together.",
    socials: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "mailto:hello@myjourney.com",
    },
  },
  story: {
    hero: {
      title: "Read My Story",
      description:
        "Every experience, every lesson, and every moment has shaped who I am today. This is my journey.",
      image:
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80",
    },
    about: {
      eyebrow: "About my journey",
      title: "It All Started With A Dream",
      text:
        "I have always been curious, passionate, and driven to learn new things. My journey has not been a straight path. It has been full of lessons, failures, growth, and unforgettable moments that shaped my purpose.",
      image:
        "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
    },
    values: [
      {
        title: "Authenticity",
        text: "Being real in everything I create and share.",
      },
      {
        title: "Growth",
        text: "Learning, evolving, and improving daily.",
      },
      {
        title: "Creativity",
        text: "Turning ideas into meaningful experiences.",
      },
      {
        title: "Impact",
        text: "Creating work that inspires and helps.",
      },
    ],
  },
  articles: [
    {
      id: "article-1",
      title: "The Day I Learned To Start Again",
      slug: "the-day-i-learned-to-start-again",
      description:
        "A reflection on rebuilding confidence after a season that did not go as planned.",
      coverImage:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>The quiet beginning</h2><p>Starting again rarely feels heroic at first. It usually feels small, private, and a little uncertain. But every meaningful change I have made began with one honest decision: I can still move.</p><blockquote>Progress became easier when I stopped demanding proof before I began.</blockquote><p>That lesson changed how I write, build, and show up for people. I learned to treat consistency as a kind of courage.</p>",
      category: "Lessons",
      subcategory: "Life Lessons",
      tags: ["growth", "mindset", "reflection"],
      author: "Noble John Steeven",
      publishedAt: "2026-01-12",
      updatedAt: "2026-02-03",
      readingTime: "4 min read",
      views: 1284,
      likes: 312,
      bookmarks: 74,
      rating: 4.8,
      featured: true,
      mustRead: true,
      trending: true,
      pinned: true,
      status: "published",
      comments: [
        {
          id: "comment-1",
          name: "Ananya",
          text: "This felt honest and useful. The part about consistency stayed with me.",
          status: "approved",
          createdAt: "2026-02-05",
        },
        {
          id: "comment-2",
          name: "Rahul",
          text: "Please write more about rebuilding routines.",
          status: "pending",
          createdAt: "2026-02-07",
        },
      ],
    },
    {
      id: "article-2",
      title: "Finding Focus In A Noisy Season",
      slug: "finding-focus-in-a-noisy-season",
      description:
        "How I simplified my days, protected attention, and learned to finish what mattered.",
      coverImage:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>Attention is a home</h2><p>When everything was asking for a response, I began by choosing what deserved one. Focus was not about doing more. It was about refusing to spend my best energy on every passing urgency.</p><p>I built a simple rule: one important task before noise. That small habit changed the shape of my mornings.</p>",
      category: "Life",
      subcategory: "Habits",
      tags: ["focus", "habits", "life"],
      author: "Noble John Steeven",
      publishedAt: "2026-02-18",
      updatedAt: "2026-02-18",
      readingTime: "5 min read",
      views: 940,
      likes: 201,
      bookmarks: 48,
      rating: 4.6,
      featured: true,
      mustRead: true,
      trending: false,
      pinned: false,
      status: "published",
      comments: [
        {
          id: "comment-3",
          name: "Meera",
          text: "The one-task-before-noise rule is simple enough to try tomorrow.",
          status: "approved",
          createdAt: "2026-02-21",
        },
      ],
    },
    {
      id: "article-3",
      title: "What Travel Taught Me About Patience",
      slug: "what-travel-taught-me-about-patience",
      description:
        "A mountain trip, a missed plan, and the unexpected gift of slowing down.",
      coverImage:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>Plans changed. The day opened.</h2><p>The best part of the trip began after the schedule failed. I stopped rushing from viewpoint to viewpoint and started noticing the road, the tea stalls, the weather, and the people.</p><p>Patience made the journey larger than the destination.</p>",
      category: "Travel",
      subcategory: "Trips",
      tags: ["travel", "patience", "memory"],
      author: "Noble John Steeven",
      publishedAt: "2026-03-09",
      updatedAt: "2026-03-10",
      readingTime: "3 min read",
      views: 721,
      likes: 155,
      bookmarks: 34,
      rating: 4.3,
      featured: true,
      mustRead: false,
      trending: true,
      pinned: false,
      status: "published",
      comments: [],
    },
    {
      id: "article-4",
      title: "Building A Personal Blog With Purpose",
      slug: "building-a-personal-blog-with-purpose",
      description:
        "Notes from designing a writing space that feels personal, useful, and easy to maintain.",
      coverImage:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>A site should feel like a room</h2><p>I wanted the blog to feel warm without becoming decorative, useful without losing personality, and structured without feeling heavy.</p><p>The real goal was simple: make publishing easier, so the writing has a place to live.</p>",
      category: "Coding",
      subcategory: "Projects",
      tags: ["web", "portfolio", "cms"],
      author: "Noble John Steeven",
      publishedAt: "2026-04-02",
      updatedAt: "2026-04-05",
      readingTime: "6 min read",
      views: 1630,
      likes: 426,
      bookmarks: 119,
      rating: 4.9,
      featured: true,
      mustRead: true,
      trending: true,
      pinned: false,
      status: "published",
      comments: [
        {
          id: "comment-4",
          name: "Divya",
          text: "The room metaphor helped me think differently about personal websites.",
          status: "approved",
          createdAt: "2026-04-06",
        },
      ],
    },
    {
      id: "article-5",
      title: "A Draft About Quiet Confidence",
      slug: "a-draft-about-quiet-confidence",
      description:
        "A working draft about confidence that grows through practice instead of performance.",
      coverImage:
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
      body:
        "<p>Quiet confidence is built in private, usually while nobody is watching. This draft is still being shaped.</p>",
      category: "Reflections",
      subcategory: "Thoughts",
      tags: ["draft", "confidence"],
      author: "Noble John Steeven",
      publishedAt: "2026-05-11",
      updatedAt: "2026-05-11",
      readingTime: "2 min read",
      views: 0,
      likes: 0,
      bookmarks: 0,
      rating: 3.9,
      featured: false,
      mustRead: false,
      trending: false,
      pinned: false,
      status: "draft",
      comments: [],
    },
    {
      id: "article-6",
      title: "The Office Incident That Changed My Checklist",
      slug: "the-office-incident-that-changed-my-checklist",
      description:
        "A small production mistake, a tense afternoon, and the checklist that made future releases calmer.",
      coverImage:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>The moment everything became visible</h2><p>The issue was not dramatic from the outside, but it exposed a gap in how I prepared. I learned that calm systems are built before pressure arrives.</p><p>That afternoon became the reason I started writing clearer release notes and rollback steps.</p>",
      category: "Incidents",
      subcategory: "Work Experiences",
      tags: ["work", "learning", "process"],
      author: "Noble John Steeven",
      publishedAt: "2026-04-20",
      updatedAt: "2026-04-21",
      readingTime: "5 min read",
      views: 856,
      likes: 178,
      bookmarks: 39,
      rating: 4.5,
      featured: true,
      mustRead: false,
      trending: true,
      pinned: false,
      status: "published",
      comments: [
        {
          id: "comment-5",
          name: "Joel",
          text: "The release checklist idea is practical. I am borrowing it.",
          status: "approved",
          createdAt: "2026-04-23",
        },
      ],
    },
    {
      id: "article-7",
      title: "A Morning Reflection On Finishing Well",
      slug: "a-morning-reflection-on-finishing-well",
      description:
        "Thoughts on patience, discipline, and the quiet value of completing the work already in your hands.",
      coverImage:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      body:
        "<h2>Finishing has a different rhythm</h2><p>Starting is often exciting. Finishing asks for steadiness. I am learning to respect the quiet part of the work where nobody is clapping yet.</p><blockquote>Faithfulness often looks like continuing with care.</blockquote>",
      category: "Reflections",
      subcategory: "Daily Reflection",
      tags: ["reflection", "faith", "discipline"],
      author: "Noble John Steeven",
      publishedAt: "2026-05-04",
      updatedAt: "2026-05-04",
      readingTime: "4 min read",
      views: 689,
      likes: 147,
      bookmarks: 31,
      rating: 4.4,
      featured: true,
      mustRead: true,
      trending: false,
      pinned: false,
      status: "published",
      comments: [],
    },
  ],
  categories: categoryBlueprints,
  tags: [
    {
      id: "tag-growth",
      name: "growth",
      slug: "growth",
      description: "Personal development, maturity, and change.",
      color: "#426c67",
      createdAt: "2026-01-01",
    },
    {
      id: "tag-reflection",
      name: "reflection",
      slug: "reflection",
      description: "Thoughtful essays and slower observations.",
      color: "#8f6b48",
      createdAt: "2026-01-01",
    },
    {
      id: "tag-travel",
      name: "travel",
      slug: "travel",
      description: "Trips, places, movement, and travel memories.",
      color: "#4d6478",
      createdAt: "2026-01-01",
    },
    {
      id: "tag-cms",
      name: "cms",
      slug: "cms",
      description: "Content systems, publishing, and web tooling.",
      color: "#a85f49",
      createdAt: "2026-01-01",
    },
  ],
  media: [
    {
      id: "media-writing-desk",
      name: "Writing desk",
      fileName: "writing-desk.jpg",
      type: "image",
      url:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      folder: "Articles",
      alt: "Notebook and laptop on a writing desk",
      size: "420 KB",
      uploadedAt: "2026-02-01",
      provider: "local",
      usedIn: ["article-1"],
    },
    {
      id: "media-mountain-road",
      name: "Mountain road",
      fileName: "mountain-road.jpg",
      type: "image",
      url:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
      folder: "Travel",
      alt: "Road through mountain landscape",
      size: "512 KB",
      uploadedAt: "2026-03-10",
      provider: "local",
      usedIn: ["article-3"],
    },
    {
      id: "media-code-workspace",
      name: "Code workspace",
      fileName: "code-workspace.jpg",
      type: "image",
      url:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      folder: "Coding",
      alt: "Laptop showing code editor",
      size: "488 KB",
      uploadedAt: "2026-04-02",
      provider: "local",
      usedIn: ["article-4"],
    },
  ],
  projects: [
    {
      id: "project-1",
      title: "Personal Blog",
      category: "Writing Platform",
      description: "A calm space for long-form stories, lessons, and reflections.",
      image:
        "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1200&q=80",
      status: "Live",
    },
    {
      id: "project-2",
      title: "Web Applications",
      category: "Full Stack",
      description: "Functional and modern apps built for real-world use.",
      image:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      status: "Ongoing",
    },
    {
      id: "project-3",
      title: "Photography Journal",
      category: "Creative",
      description: "Capturing moments that speak beyond words.",
      image:
        "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1200&q=80",
      status: "Curated",
    },
    {
      id: "project-4",
      title: "UI/UX Designs",
      category: "Design",
      description: "Thoughtful interfaces that stay readable and user-focused.",
      image:
        "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
      status: "Selected",
    },
  ],
  skills: [
    { id: "skill-1", name: "Web Development", level: 90 },
    { id: "skill-2", name: "UI/UX Design", level: 85 },
    { id: "skill-3", name: "Photography", level: 75 },
    { id: "skill-4", name: "Content Writing", level: 80 },
  ],
  timeline: [
    {
      id: "timeline-1",
      year: "2019",
      title: "The Beginning",
      description:
        "Every journey begins with a single step. Mine began with curiosity and a dream.",
    },
    {
      id: "timeline-2",
      year: "2021",
      title: "The Growth",
      description:
        "Challenges came, lessons were learned, and I kept growing every day.",
    },
    {
      id: "timeline-3",
      year: "2024",
      title: "The Purpose",
      description:
        "Today, I create, explore, and inspire through my work and stories.",
    },
  ],
  stats: [
    { id: "stat-1", label: "Years of Experience", value: "3+" },
    { id: "stat-2", label: "Projects Completed", value: "20+" },
    { id: "stat-3", label: "Happy Clients", value: "10+" },
    { id: "stat-4", label: "Awards Received", value: "5+" },
  ],
  subscribers: [
    { id: "sub-1", email: "reader@myjourney.com", joinedAt: "2026-02-01" },
    { id: "sub-2", email: "hello@myjourney.com", joinedAt: "2026-03-15" },
  ],
};
