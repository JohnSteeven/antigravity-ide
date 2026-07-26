const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Category = require("../models/Category");

const categoryBlueprints = [
  {
    name: "Life",
    slug: "life",
    description: "Personal notes on habits, relationships, and ordinary days.",
    longDescription: "Daily journals, growth notes, goals, habits, health, relationships, productivity, faith, and memories gathered into one calm personal archive.",
    icon: "heart",
    sortOrder: 1,
    heroImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1800&q=85",
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
    name: "Reflections",
    slug: "reflections",
    description: "Slower essays about meaning, change, and self-awareness.",
    longDescription: "Thoughts, meditations, Bible reflections, life reflections, career reflections, and daily reflection entries for deeper review.",
    icon: "feather",
    sortOrder: 2,
    heroImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85",
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
    name: "Incidents",
    slug: "incidents",
    description: "Memorable moments and turning points from real experience.",
    longDescription: "Real life events, work experiences, failures, success stories, office incidents, funny moments, and learning experiences preserved with context.",
    icon: "book",
    sortOrder: 3,
    heroImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1800&q=85",
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
    name: "Lessons",
    slug: "lessons",
    description: "Practical lessons learned through wins, mistakes, and repair.",
    longDescription: "Life lessons, books, leadership, business, technology, spiritual lessons, and career advice shaped into reusable knowledge.",
    icon: "award",
    sortOrder: 4,
    heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85",
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
    name: "Travel",
    slug: "travel",
    description: "Places, movement, and what the road teaches.",
    longDescription: "Countries, cities, trips, travel guides, budgets, food, hotels, and photography notes from journeys worth remembering.",
    icon: "send",
    sortOrder: 5,
    heroImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
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
    name: "News",
    slug: "news",
    description: "Live world news and global updates.",
    longDescription: "Real-time updates and breaking news coverage from reputable international sources covering world events, culture, science, and technology.",
    icon: "globe",
    sortOrder: 6,
    heroImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1800&q=85",
    subcategories: [
      "World News",
      "Technology",
      "Science",
      "Business",
      "Culture",
    ],
  },
  {
    name: "Coding",
    slug: "coding",
    description: "Projects, systems, and the craft of building software.",
    longDescription: "JavaScript, TypeScript, React, NextJS, NodeJS, Java, Python, SAP, SQL, system design, interview questions, DevOps, cloud, AI, coding tips, and projects.",
    icon: "code",
    sortOrder: 7,
    heroImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85",
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

async function seed() {
  console.log("Starting Category Seeding Script...");
  await connectDb();
  console.log("Connected to MongoDB.");

  try {
    for (const blueprint of categoryBlueprints) {
      const existing = await Category.findOne({ slug: blueprint.slug });
      if (existing) {
        console.log(`Category "${blueprint.name}" already exists. Skipping.`);
        continue;
      }

      await Category.create(blueprint);
      console.log(`Created Category "${blueprint.name}".`);
    }
    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
