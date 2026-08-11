/* Development-only Story fixtures. They are imported by the local seed and
 * browser fallback; no migration or production deployment runs automatically. */

const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=900&q=82",
];

const PARAGRAPHS = [
  "The morning began without ceremony, the way important days often do. Light moved slowly across the floorboards while the kettle clicked off in the kitchen, and for a few minutes nothing seemed capable of changing. I remember noticing the ordinary details because they felt dependable: the folded coat by the door, the unfinished note on the table, and the familiar sound of traffic waking beyond the window.",
  "For months I had treated movement as proof that I was making progress. Every open hour became another task, another promise, another reason not to sit still long enough to ask whether the direction was right. Busyness gave the days a clean outline, but beneath it was a quieter feeling I could not schedule away. It waited patiently until the rest of the noise began to thin.",
  "There was no cinematic revelation. The change arrived through a small interruption, almost easy to dismiss, and asked only that I pay attention. I had expected clarity to announce itself with certainty. Instead it appeared as a question that stayed after every practical answer had been exhausted, following me through the afternoon like a line from a letter I could not stop rereading.",
  "The person beside me did not offer advice. They listened without trying to turn the moment into a lesson, leaving enough silence for an honest answer to surface. That restraint was its own kind of generosity. It reminded me that being seen is often less about receiving the perfect words and more about finding someone willing to remain present while the unfinished words take shape.",
  "Outside, the weather kept changing its mind. A brief wash of rain darkened the pavement, then sunlight returned and made every window flare. I watched strangers adjust their coats and continue on, each carrying a private destination. The scene was ordinary, yet it loosened something in me. A disrupted plan did not have to become a ruined day; it could simply become a different route.",
  "I began with the next manageable choice. It was not impressive enough to share and not dramatic enough to feel like a new beginning, but it belonged to me. The choice led to another, and the repetition slowly became trust. Momentum returned without the old urgency. I could move forward without pretending that uncertainty had disappeared or that courage meant never looking back.",
  "Later, I wrote down what I was afraid to forget. The page filled with fragments rather than conclusions: a place, a sentence, the expression on someone's face, the exact color of the evening sky. Memory is rarely an orderly archive. It keeps what carries feeling, and those fragments became a map I could follow when the larger meaning was still beyond reach.",
  "The difficult part was accepting that two truths could live together. I could be grateful for what the old life had given me and still admit that it no longer fit. I could miss the certainty of familiar routines while choosing an unfamiliar future. Holding both truths softened the need to label one chapter a success and the other a failure.",
  "Weeks passed before anyone else noticed a difference. From the outside, my schedule looked nearly the same, but the center of it had shifted. I protected quiet mornings, answered fewer invitations out of obligation, and stopped treating rest as a reward that had to be earned. The changes were small enough to survive real life, which made them more useful than the grand promises I had made before.",
  "At the edge of town, the road narrowed between tall trees and the signal disappeared. I had no choice but to stop checking for updates. Wind moved through the branches in long waves, and the sound gave the afternoon a slower measure. With nothing new arriving, I could finally hear the thought that had been waiting beneath every notification: this pace was not the only pace available.",
  "We met again near the end of the season. The conversation did not resolve every question, but it no longer needed to. Some relationships recover through explanation; others recover through a series of modest returns. A shared meal, an unguarded laugh, and the decision to call the next week were enough to begin rebuilding what pride had once made seem impossible.",
  "Looking back, the turning point is easy to name and difficult to isolate. It was one event, but it was also every choice made afterward. A door can open in a second, yet walking through it remains daily work. The lasting change came from choosing the new direction when it felt hopeful, when it felt inconvenient, and when no one was watching.",
  "I used to believe that certainty had to come first. Experience taught me that understanding often follows action, arriving only after we have tested a direction with our own feet. The first step did not settle the future. It simply gave the future somewhere to begin, and that was enough to turn hesitation into a path.",
  "By evening, the landscape had become almost monochrome, all soft blue distances and dark lines of trees. A single window glowed on the far side of the valley. I thought about how little light is required to change the feeling of a place. Hope can work that way too: not erasing the dark, but giving the eye a point toward which it can travel.",
  "The story did not end with everything repaired. Real endings are rarely so obedient. There were still apologies to make, habits to unlearn, and mornings when the old fear returned before I was fully awake. What changed was my willingness to meet those moments without mistaking them for defeat. Progress became a practice instead of a verdict.",
  "On the final day, I packed slowly and left room in the bag. That empty space felt symbolic without needing to become a symbol. I had arrived carrying plans for every hour and left with fewer answers, a handful of names, and an unexpected confidence in what could not be planned. The unknown no longer looked like an absence. It looked like room.",
];

const takeParagraphs = (offset, count, opening = "") => {
  const paragraphs = opening ? [opening] : [];
  for (let index = 0; index < count; index += 1) {
    paragraphs.push(PARAGRAPHS[(offset + index) % PARAGRAPHS.length]);
  }
  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
};

const text = (id, heading, offset, count, opening) => ({ id, type: "text", heading, body: takeParagraphs(offset, count, opening) });
const splitRight = (id, heading, offset, count, imageIndex, alt, opening) => ({
  id, type: "text-image-right", heading, body: takeParagraphs(offset, count, opening), image: IMAGE_URLS[imageIndex], alt, imageSize: "medium",
});
const splitLeft = (id, heading, offset, count, imageIndex, alt, opening) => ({
  id, type: "image-left-text", heading, body: takeParagraphs(offset, count, opening), image: IMAGE_URLS[imageIndex], alt, imageSize: "medium",
});
const chapter = (id, number, title, offset, count, imageIndex, side = "right") => ({
  id, type: "chapter", chapterNumber: number, chapterTitle: title, body: takeParagraphs(offset, count),
  ...(imageIndex === undefined ? {} : { image: IMAGE_URLS[imageIndex], alt: `${title} landscape`, imageSize: imageIndex % 3 === 0 ? "portrait" : "medium", imageSide: side }),
});
const quote = (id, value, attribution = "") => ({ id, type: "quote", quote: value, attribution });
const reflection = (id, heading, body) => ({ id, type: "reflection", heading, body });
const breakSection = (id) => ({ id, type: "scene-break" });

const wordCount = (story) => [story.title, story.description, story.reflection]
  .concat(story.storySections.flatMap((section) => [section.heading, section.chapterTitle, section.body, section.quote, section.attribution]))
  .join(" ")
  .replace(/<[^>]+>/g, " ")
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .length;

const makeStory = (story) => {
  const words = wordCount(story);
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));
  return {
    category: "Stories",
    subcategory: "",
    tags: [],
    author: "Noble John Steeven",
    status: "published",
    contentType: "story",
    featured: false,
    mustRead: false,
    trending: false,
    pinned: false,
    views: 0,
    likes: 0,
    bookmarks: 0,
    reflection: "",
    body: story.storySections.map((section) => `${section.heading || section.chapterTitle ? `<h2>${section.heading || section.chapterTitle}</h2>` : ""}${section.body || ""}`).join(""),
    ...story,
    readingTimeMin,
    readingTime: `${readingTimeMin} min read`,
  };
};

module.exports = [
  makeStory({
    id: "story-fixture-0-images",
    title: "The Second Chance Rainstorm",
    slug: "the-second-chance-rainstorm",
    description: "A quiet story about the weather that brought two brothers back into the same conversation.",
    coverImage: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=900&q=82",
    coverImageAlt: "Rain falling along a quiet city street",
    publishedAt: "2026-04-18",
    storyLayout: "classic-reader",
    storySections: [
      text("rain-1", "Four Years of Silence", 0, 5),
      text("rain-2", "The Sky Opens", 4, 5),
      quote("rain-quote", "Some doors do not close. They wait for the right kind of rain."),
      text("rain-3", "The Walk Home", 9, 4),
    ],
    reflection: "Reconciliation rarely arrives as a perfect speech. Sometimes it begins by choosing to remain beside someone while the rain passes.",
  }),
  makeStory({
    id: "story-fixture-1-image",
    title: "The Midnight Train to Kyoto",
    slug: "the-midnight-train-to-kyoto",
    description: "A winter journey and an unexpected act of warmth at a station between destinations.",
    coverImage: IMAGE_URLS[0],
    coverImageAlt: "A quiet Kyoto street at dusk",
    publishedAt: "2026-04-15",
    storyLayout: "reader-image-right",
    storySections: [
      splitRight("kyoto-1", "Snow Across the Tracks", 1, 6, 0, "A quiet Kyoto street glowing in the evening", "The local train from Osaka to Kyoto was nearly empty near midnight. Outside the frost-rimmed windows, cedar forests passed in a silence broken by the steady rhythm of wheels on steel."),
      text("kyoto-2", "Tea at the Rural Platform", 7, 5),
      quote("kyoto-quote", "Warm hands, quiet mind.", "The station master"),
      text("kyoto-3", "What Needed No Translation", 11, 3),
    ],
    reflection: "A small gesture can cross distances that language cannot. Attention is often the most generous form of hospitality.",
  }),
  makeStory({
    id: "story-fixture-2-images",
    title: "Missing My Flight Changed My Life",
    slug: "missing-my-flight-changed-my-life",
    description: "How a closed gate created the unplanned hours in which a new direction could begin.",
    coverImage: IMAGE_URLS[1],
    coverImageAlt: "A traveler waiting beside an airport window",
    publishedAt: "2026-04-25",
    storyLayout: "alternating-editorial",
    storySections: [
      splitRight("flight-1", "The Mad Dash Through Terminal 5", 0, 10, 1, "A traveler moving through an airport terminal", "I arrived at the airport with forty minutes to spare. Forty minutes, I thought, was plenty—until the security line folded around the terminal and every minute began to feel borrowed."),
      text("flight-2", "The Red Warning Light", 3, 8),
      splitLeft("flight-3", "A Stranded Seat in a Crowded Cafe", 6, 9, 2, "Morning light through a busy cafe window"),
      quote("flight-quote", "The interruption was not empty time. It was the first open space I had allowed in years."),
      text("flight-4", "The Napkin Blueprint", 10, 8),
      text("flight-5", "Why Detours Are Invitations", 13, 9),
    ],
    reflection: "The plan failed, but the day did not. The difference changed everything that followed.",
  }),
  makeStory({
    id: "story-fixture-3-images",
    title: "The Day Everything Changed",
    slug: "the-day-everything-changed",
    description: "A single interruption that revealed how much of life had been running on momentum alone.",
    coverImage: IMAGE_URLS[2],
    coverImageAlt: "A road leading toward distant morning light",
    publishedAt: "2026-04-10",
    storyLayout: "chapter-journey",
    storySections: [
      chapter("changed-1", "01", "The Quiet Before the Storm", 0, 8, 2, "right"),
      chapter("changed-2", "02", "The Sudden Disruption", 4, 8),
      chapter("changed-3", "03", "Facing the Quiet Room", 8, 8, 3, "left"),
      quote("changed-quote", "When the familiar rhythm stopped, I could finally hear what it had been covering."),
      chapter("changed-4", "04", "The Conversation", 12, 8),
      chapter("changed-5", "05", "Rebuilding at Human Speed", 2, 13, 4, "right"),
      reflection("changed-reflection", "What remained", "The work still mattered, but it no longer had to carry the full weight of identity. A sustainable life could hold ambition without being consumed by it."),
    ],
  }),
  makeStory({
    id: "story-fixture-5-images",
    title: "The Lanterns We Left Behind",
    slug: "the-lanterns-we-left-behind",
    description: "Five remembered places, one long return, and the quiet work of making peace with a former home.",
    coverImage: IMAGE_URLS[3],
    coverImageAlt: "Sunlight moving through a forest path",
    publishedAt: "2026-05-03",
    storyLayout: "immersive-moments",
    storySections: [
      chapter("lantern-1", "01", "The Road Back", 0, 9, 3, "right"),
      chapter("lantern-2", "02", "Rooms That Remember", 3, 9, 4, "left"),
      text("lantern-3", "The Name in the Guest Book", 6, 8),
      chapter("lantern-4", "03", "Across the Valley", 9, 9, 5, "right"),
      breakSection("lantern-break"),
      chapter("lantern-5", "04", "The Evening Table", 12, 9, 6, "left"),
      quote("lantern-quote", "Returning did not make the past smaller. It made room around it."),
      chapter("lantern-6", "05", "A Light in the Window", 1, 9, 7, "right"),
      text("lantern-7", "Leaving with Less", 5, 8),
      reflection("lantern-reflection", "A gentler ending", "Home was no longer a place I needed to recover exactly. It could be something carried forward without asking the present to become the past."),
    ],
  }),
  makeStory({
    id: "story-fixture-8-images",
    title: "Thirty Days North",
    slug: "thirty-days-north",
    description: "A month-long journey through remote towns, changing weather, and the slower questions that distance makes possible.",
    coverImage: IMAGE_URLS[4],
    coverImageAlt: "Mountain ridges above a still northern lake",
    publishedAt: "2026-05-12",
    storyLayout: "mixed-editorial",
    storySections: [
      chapter("north-1", "01", "The First Mile", 0, 9, 4, "right"),
      chapter("north-2", "02", "Rain Beyond the Pass", 2, 9, 5, "left"),
      text("north-3", "A Town Without a Signal", 4, 8),
      chapter("north-4", "03", "The Ferry at Dawn", 6, 8, 6, "right"),
      chapter("north-5", "04", "Names on the Map", 8, 8, 7, "left"),
      quote("north-quote-1", "Distance did not answer the question. It made the question honest."),
      chapter("north-6", "05", "The Long Interior Road", 10, 8, 0, "right"),
      text("north-7", "What the Weather Changed", 12, 8),
      chapter("north-8", "06", "A Table for Strangers", 14, 8, 1, "left"),
      breakSection("north-break"),
      chapter("north-9", "07", "The Mountain Window", 1, 8, 2, "right"),
      chapter("north-10", "08", "Turning South", 3, 8, 3, "left"),
      text("north-11", "The Last Week", 5, 8),
      reflection("north-reflection", "Room for the unknown", "The journey ended without a single final answer. What returned with me was more useful: patience for the questions, trust in the next step, and enough quiet to recognize both."),
    ],
  }),
];
