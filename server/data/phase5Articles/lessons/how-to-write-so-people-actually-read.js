"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "How to Write So People Actually Read",
  "slug": "how-to-write-so-people-actually-read",
  "category": "Lessons",
  "categorySlug": "lessons",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A masterclass in high-impact communication: utilizing the Minto Pyramid Principle, active voice, cognitive formatting, and ruthless editing to capture attention and inspire action.",
  "description": "A masterclass in high-impact communication: utilizing the Minto Pyramid Principle, active voice, cognitive formatting, and ruthless editing to capture attention and inspire action.",
  "coverImage": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "A vintage fountain pen resting on an open journal filled with clean, deliberate cursive notes",
  "coverImageCaption": "Clear writing is the outward manifestation of clear thinking; front-load your argument to command attention.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Modern Attention Crisis: The Reader as an Impatient Skeptic",
      "id": "block-1",
      "order": 1
    },
    {
      "type": "paragraph",
      "text": "Every piece of writing created today enters an arena characterized by brutal, unprecedented cognitive competition. Your reader is not sitting in a quiet, wood-paneled library with a cup of tea, eager to savor your elegant subordinate clauses and leisurely introductory musings.",
      "id": "block-2",
      "order": 2
    },
    {
      "type": "paragraph",
      "text": "Your reader is standing on a crowded commuter train, glancing at their smartphone screen while balancing a coffee cup, with twelve unread Slack notifications, three urgent client emails, and a breaking news alert competing for their divided attention.",
      "id": "block-3",
      "order": 3
    },
    {
      "type": "paragraph",
      "text": "Most business, technical, and analytical writing fails because it is authored for a mythical, captive audience. Writers compose leisurely chronological narratives: they explain background history for three paragraphs, detail their research methodology for two pages, discuss caveats and edge cases, and finally reveal their core recommendation in the final paragraph.",
      "id": "block-4",
      "order": 4
    },
    {
      "type": "paragraph",
      "text": "By the time the writer arrives at their punchline, the modern reader has long since abandoned the text. If you want people to read your words, you must fundamentally reverse your architecture: put the conclusion first, eliminate cognitive friction, and treat the reader's time as the most sacred currency on earth.",
      "id": "block-5",
      "order": 5
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "The reader does not owe you their attention. You must earn every sentence through relentless clarity, forward momentum, and immediate relevance.",
      "id": "block-6",
      "order": 6
    },
    {
      "type": "divider",
      "id": "block-7",
      "order": 7
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Minto Pyramid and BLUF: Front-Loading the Core Argument",
      "id": "block-8",
      "order": 8
    },
    {
      "type": "paragraph",
      "text": "In the 1960s, Barbara Minto, the first female MBA hire at McKinsey & Company, developed a revolutionary framework that became the gold standard for executive communication: The Minto Pyramid Principle.",
      "id": "block-9",
      "order": 9
    },
    {
      "type": "paragraph",
      "text": "Minto's foundational insight is that the human brain absorbs complex information most efficiently when the overarching conclusion is presented first, followed by supporting logical pillars, which are in turn backed by detailed data.",
      "id": "block-10",
      "order": 10
    },
    {
      "type": "paragraph",
      "text": "In military and intelligence operations, this doctrine is codified as BLUF: Bottom Line Up Front. Before writing a single sentence of context, state your core conclusion or recommendation with absolute, unhedged clarity.",
      "id": "block-11",
      "order": 11
    },
    {
      "type": "paragraph",
      "text": "Instead of writing: 'Given that server costs increased by 40% in Q3 due to unoptimized database indexing, and after reviewing several architectural proposals, we believe migrating to managed serverless compute might be advantageous,' write: 'Recommendation: Migrate core billing workloads to managed serverless by November 15. This will reduce infrastructure expenditure by $180,000 annually while improving peak query latency.'",
      "id": "block-12",
      "order": 12
    },
    {
      "type": "paragraph",
      "text": "When the bottom line is placed at the very top, the reader immediately understands the stakes, the framework, and the context, allowing them to evaluate your supporting arguments with heightened cognitive comprehension.",
      "id": "block-13",
      "order": 13
    },
    {
      "type": "table",
      "tableHeaders": [
        "Communication Element",
        "Traditional Academic / Flawed Style",
        "Executive / High-Impact Style"
      ],
      "tableRows": [
        [
          "Opening Structure",
          "Leisurely background history and contextual preamble",
          "Bottom Line Up Front (BLUF): core finding & recommendation"
        ],
        [
          "Sentence Voice",
          "Passive voice ('Mistakes were made by the team')",
          "Direct active voice ('The engineering team failed to index the database')"
        ],
        [
          "Paragraph Architecture",
          "Dense, unbroken blocks of 200+ words",
          "Snappy, cohesive units of 40-75 words with clear topic sentences"
        ],
        [
          "Formatting for Scannability",
          "Monolithic walls of uniform gray text",
          "Bold lead-ins, bulleted logical hierarchies, and diagnostic tables"
        ]
      ],
      "id": "block-14",
      "order": 14
    },
    {
      "type": "divider",
      "id": "block-15",
      "order": 15
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Mechanics of Active Voice: Ruthless Elimination of Passive Inertia",
      "id": "block-16",
      "order": 16
    },
    {
      "type": "paragraph",
      "text": "The single fastest way to inject vitality, authority, and velocity into your prose is the ruthless eradication of the passive voice. Passive voice occurs when the subject of the sentence has an action performed upon it, rather than performing the action itself.",
      "id": "block-17",
      "order": 17
    },
    {
      "type": "paragraph",
      "text": "Consider the passive corporate sentence: 'It was decided by the executive committee that marketing expenditures should be reduced by fifteen percent.' The sentence is flabby, cowardly, and evasive. Who decided? Who is responsible?",
      "id": "block-18",
      "order": 18
    },
    {
      "type": "paragraph",
      "text": "Rewrite it in active voice: 'The executive committee reduced the marketing budget by fifteen percent.' The active sentence is four words shorter, hits the ear with rhythmic authority, and assigns clear human accountability.",
      "id": "block-19",
      "order": 19
    },
    {
      "type": "paragraph",
      "text": "Passive voice is frequently used as a bureaucratic shield by writers who want to avoid taking responsibility for unpopular decisions. But readers intuitively smell evasion. When you write in active voice—putting living agents at the front of your verbs—your prose crackles with confidence and moral courage.",
      "id": "block-20",
      "order": 20
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",
      "alt": "A writer's hand editing a draft on crisp paper with a fountain pen in sharp focus",
      "caption": "High-impact writing requires ruthless editing: cutting adjectives, passive verbs, and unnecessary jargon.",
      "id": "block-21",
      "order": 21
    },
    {
      "type": "divider",
      "id": "block-22",
      "order": 22
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Formatting for the Scanner: Visual Hierarchy and Cognitive White Space",
      "id": "block-23",
      "order": 23
    },
    {
      "type": "paragraph",
      "text": "Usability research by the Nielsen Norman Group confirms that seventy-nine percent of digital readers do not read word-for-word; they scan. They scan headings, bold lead-ins, bulleted lists, and diagrams before deciding whether any section warrants deep reading.",
      "id": "block-24",
      "order": 24
    },
    {
      "type": "paragraph",
      "text": "If your document presents a monolithic wall of unbroken gray text, the scanner's eye slides off the page in despair. Formatting is not mere visual ornamentation; it is the cognitive scaffolding that guides the reader's attention.",
      "id": "block-25",
      "order": 25
    },
    {
      "type": "paragraph",
      "text": "Utilize descriptive, informative headings rather than generic labels. Instead of 'Market Overview,' write 'Market Shifts: Legacy Vendors Lose 30% Share to Cloud Natives.' A busy executive should be able to read only your headings and grasp the entire logical arc of your memo.",
      "id": "block-26",
      "order": 26
    },
    {
      "type": "paragraph",
      "text": "Incorporate short paragraphs of three to four sentences. White space is breathing room for the eye. Use bulleted lists for three or more parallel items, and deploy diagnostic tables for complex comparative data.",
      "id": "block-27",
      "order": 27
    },
    {
      "type": "paragraph",
      "text": "By designing your text for scannability, you respect the reality of modern human attention, ensuring your core message penetrates even the most distracted mind.",
      "id": "block-28",
      "order": 28
    },
    {
      "type": "list",
      "items": [
        "Write action-oriented, descriptive section headings that convey conclusions, not topics.",
        "Keep paragraphs between 40 and 80 words; break complex thoughts into discrete units.",
        "Deploy bulleted lists for logical groupings, but restrict lists to 3–5 items to prevent fatigue.",
        "Bold the critical two or three words in key paragraphs to anchor the scanner's gaze."
      ],
      "id": "block-29",
      "order": 29
    },
    {
      "type": "divider",
      "id": "block-30",
      "order": 30
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Second Draft is the Scalpel: Stephen King's 10% Rule",
      "id": "block-31",
      "order": 31
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",
      "alt": "A focused writer editing a manuscript draft with a fountain pen and notebook",
      "caption": "Ruthless line editing and structural clarity transform dense drafts into compelling prose."
    },
    {
      "type": "paragraph",
      "text": "In his essential memoir *On Writing*, Stephen King offers an unyielding formula for editorial excellence: Second Draft = First Draft - 10%.",
      "id": "block-32",
      "order": 32
    },
    {
      "type": "paragraph",
      "text": "The first draft is where you tell the story or formulate the argument to yourself. It is naturally messy, repetitive, and laden with throat-clearing preambles and self-indulgent digressions. The second draft is where you wield the scalpel on behalf of the reader.",
      "id": "block-33",
      "order": 33
    },
    {
      "type": "paragraph",
      "text": "Hunt down and eliminate zombie adverbs: words like 'very,' 'extremely,' 'essentially,' 'basically,' and 'literally' add zero information and dilute the punch of your verbs. If you write 'he ran quickly,' replace it with 'he sprinted.'",
      "id": "block-34",
      "order": 34
    },
    {
      "type": "paragraph",
      "text": "Excise bloated bureaucratic clichés: change 'in order to' to 'to'; change 'at this point in time' to 'now'; change 'utilize' to 'use.' Every syllable you trim increases the density and velocity of your thought.",
      "id": "block-35",
      "order": 35
    },
    {
      "type": "paragraph",
      "text": "Read your prose aloud. If your breath catches, if your tongue trips over a cumbersome clause, or if a sentence sounds unnatural, that sentence is broken. Rewrite it until it rolls off the tongue like natural speech.",
      "id": "block-36",
      "order": 36
    },
    {
      "type": "quote",
      "quote": "Kill your darlings, kill your darlings, even when it breaks your egocentric little scribbler's heart, kill your darlings.",
      "attribution": "Stephen King, 'On Writing: A Memoir of the Craft'",
      "id": "block-37",
      "order": 37
    },
    {
      "type": "divider",
      "id": "block-38",
      "order": 38
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Ultimate Objective: Moving Minds and Driving Action",
      "id": "block-39",
      "order": 39
    },
    {
      "type": "paragraph",
      "text": "Writing is not an act of self-expression for an imaginary museum; it is a tool for transferring clarity from one mind to another to inspire action. Whether you are drafting a board memo, a pitch deck, an essay, or a technical architecture document, your goal is to change how your reader thinks and acts.",
      "id": "block-40",
      "order": 40
    },
    {
      "type": "paragraph",
      "text": "When you master the discipline of front-loading your thesis, writing in active voice, formatting for scannability, and editing with a scalpel, you become an extraordinary force multiplier in any organization.",
      "id": "block-41",
      "order": 41
    },
    {
      "type": "paragraph",
      "text": "In a world drowning in verbose, murky corporate nonsense, a clear, concise, and compelling writer stands out like a beacon of light. Cultivate this craft with devotion, and the world will listen when you speak.",
      "id": "block-42",
      "order": 42
    },
    {
      "type": "divider",
      "id": "block-43",
      "order": 43
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Power of Concrete Examples: Grounding Abstraction in Reality",
      "id": "block-44",
      "order": 44
    },
    {
      "type": "paragraph",
      "text": "Abstract principles are easily forgotten; concrete sensory examples stick to human memory like burrs. When you introduce a complex concept—such as technical debt, customer friction, or market positioning—always immediately anchor the principle in a tangible real-world narrative.",
      "id": "block-45",
      "order": 45
    },
    {
      "type": "paragraph",
      "text": "Instead of writing abstractly: 'Our user onboarding experience exhibits significant interface friction resulting in elevated drop-off rates,' write: 'Last Tuesday, a physician trying to sign up on her iPad spent six minutes trying to click a microscopic submit button that was hidden behind our cookie consent banner. She gave up and closed the app.'",
      "id": "block-46",
      "order": 46
    },
    {
      "type": "paragraph",
      "text": "The concrete story instantly engages the reader's visual imagination, transforming a dry operational metric into an urgent, emotionally compelling problem that commands executive action.",
      "id": "block-47",
      "order": 47
    },
    {
      "type": "paragraph",
      "text": "In addition, always tailor your vocabulary and technical altitude to your specific target audience. A document intended for software architects should dive straight into latency benchmarks and API contracts, while a memo intended for board directors must translate those technical realities into business risk and capital allocation.",
      "id": "block-48",
      "order": 48
    },
    {
      "type": "paragraph",
      "text": "Mastering the craft of writing is the highest-leverage career investment you can make. The ability to articulate complex thoughts with clarity, precision, and velocity will set you apart in any field, granting your ideas the influence they truly deserve.",
      "id": "block-49",
      "order": 49
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Lessons",
    "Writing",
    "Communication",
    "Productivity",
    "Leadership",
    "Clarity",
    "Editing",
    "Business"
  ],
  "references": [
    {
      "title": "The Minto Pyramid Principle: Logic in Writing, Thinking, and Problem Solving",
      "url": "https://www.barbaraminto.com/"
    },
    {
      "title": "On Writing: A Memoir of the Craft by Stephen King",
      "url": "https://www.simonandschuster.com/books/On-Writing/Stephen-King/9781982159375"
    },
    {
      "title": "Nielsen Norman Group: How Users Read on the Web",
      "url": "https://www.nngroup.com/articles/how-users-read-on-the-web/"
    }
  ],
  "sources": [],
  "relatedArticleSlugs": [
    "how-to-read-a-financial-statement-when-you-are-not-an-accountant",
    "the-craft-of-difficult-conversations",
    "how-to-build-a-personal-knowledge-system"
  ],
  "publishedAt": "2025-01-15T08:00:00.000Z",
  "seo": {
    "title": "How to Write So People Actually Read | MyJourney",
    "description": "A masterclass in high-impact communication: utilizing the Minto Pyramid Principle, active voice, cognitive formatting, and ruthless editing to capture attention and inspire action.",
    "keywords": [
      "Lessons",
      "Writing",
      "Communication",
      "Productivity",
      "Leadership",
      "Clarity",
      "Editing",
      "Business"
    ]
  }
};

module.exports = buildCanonicalArticle(articleConfig);
