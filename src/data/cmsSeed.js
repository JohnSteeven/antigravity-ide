import { categoryBlueprints } from "../domain/knowledgeArchitecture";
import premiumArticles from "./premiumArticles.json";

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
      instagram: "https://www.instagram.com/j.steeven_?igsh=MWh6aHFyNmIxZTV6Mg==",
      linkedin: "https://www.linkedin.com/in/noblejohnsteeven/",
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
  articles: premiumArticles,
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
