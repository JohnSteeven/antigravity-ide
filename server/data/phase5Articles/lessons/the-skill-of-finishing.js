"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "The Skill of Finishing",
  "slug": "the-skill-of-finishing",
  "category": "Lessons",
  "categorySlug": "lessons",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A clinical dissection of project execution: overcoming the last ten percent paradox, defeating perfectionistic sabotage, pruning scope creep, and mastering the discipline of shipping.",
  "description": "A clinical dissection of project execution: overcoming the last ten percent paradox, defeating perfectionistic sabotage, pruning scope creep, and mastering the discipline of shipping.",
  "coverImage": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Dramatic soaring suspension bridge spanning a deep harbor at sunset, with cables anchored in solid granite",
  "coverImageCaption": "The highest discipline of professional craftsmanship is driving ambitious undertakings across the finish line.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Cemetery of the Ninety Percent: Why Starting Is Cheap and Finishing Is Rare",
      "id": "block-1",
      "order": 1
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "The world is saturated with brilliant starters who possess ten unfinished masterpieces; the highest commercial and cultural premium accrues entirely to the finisher.",
      "id": "block-2",
      "order": 2
    },
    {
      "type": "paragraph",
      "text": "In human creative, entrepreneurial, and intellectual pursuits, starting is intoxicatingly cheap. When an individual conceives a new idea—a novel software architecture, an ambitious non-fiction book, a revolutionary startup, or a new academic thesis—the brain is flooded with dopamine. The vision lives in the imagination as an immaculate, unblemished ideal: devoid of technical debt, immune to market friction, free of tedious administrative bugs, and radiant with latent glory. Starting requires nothing more than a blank notebook, a burst of optimism, and an afternoon of enthusiasm.",
      "id": "block-3",
      "order": 3
    },
    {
      "type": "paragraph",
      "text": "Finishing, by contrast, is one of the rarest, most grueling disciplines in human civilization. In every hard drive, desk drawer, and corporate repository, there exists a vast, silent cemetery of projects that reached eighty or ninety percent completion and were quietly abandoned. The half-finished manuscripts, the ninety-percent-coded mobile applications, the eighty-five-percent-negotiated partnerships—they sit gathering digital dust, monuments to human cognitive exhaustion.",
      "id": "block-4",
      "order": 4
    },
    {
      "type": "paragraph",
      "text": "The tragedy of the unfinished project is that in the unforgiving mathematics of reality, a ninety-percent-finished project yields zero percent of its value. A bridge that spans ninety percent of a river carries zero traffic; a commercial airliner whose avionics software is ninety percent complete cannot be certified for flight; a book that lacks its final three chapters cannot be published. Until a deliverable crosses the threshold of completion and is released into the world, all the preceding labor, sweat, and capital represent stranded inventory.",
      "id": "block-5",
      "order": 5
    },
    {
      "type": "paragraph",
      "text": "Finishing is not merely the final chronological phase of a project; it is a distinct, specialized cognitive and psychological capability that must be studied, trained, and practiced as an independent discipline. Many of humanity's most brilliant minds remain perpetually impoverished and obscure because they never mastered the skill of finishing, while less gifted operators build generational empires simply because they know how to ship.",
      "id": "block-6",
      "order": 6
    },
    {
      "type": "paragraph",
      "text": "To become a finisher, you must undergo a fundamental identity shift. You must stop identifying as an imaginative dreamer who loves ideas, and begin identifying as a relentless closer who lives for the clean, irrevocable satisfaction of the final deliverable.",
      "id": "block-7",
      "order": 7
    },
    {
      "type": "quote",
      "quote": "Real artists ship.",
      "attribution": "Steve Jobs",
      "id": "block-8",
      "order": 8
    },
    {
      "type": "divider",
      "id": "block-9",
      "order": 9
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Last Ten Percent Paradox: Asymmetric Friction at the Finish Line",
      "id": "block-10",
      "order": 10
    },
    {
      "type": "paragraph",
      "text": "In project management theory, the difficulty curve of an ambitious undertaking is widely assumed to be linear: completing the first ten percent of the work should require roughly the same energy and time as completing the final ten percent. Every experienced operator knows that this linear model is an absurd delusion.",
      "id": "block-11",
      "order": 11
    },
    {
      "type": "paragraph",
      "text": "The reality of execution is governed by what software engineers call the 'Ninety-Ninety Rule,' coined by Bell Labs computer scientist Tom Cargill: 'The first ninety percent of the code accounts for the first ninety percent of the development time. The remaining ten percent of the code accounts for the other ninety percent of the development time.'",
      "id": "block-12",
      "order": 12
    },
    {
      "type": "paragraph",
      "text": "Why does the final ten percent consume disproportionate energy? Because the final ten percent is where all the deferred complexities, hidden edge cases, and painful compromises concentrate. In the first ninety percent, you build the broad, glorious structural features under ideal assumptions. In the final ten percent, you must make the system actually work under real-world hostility: fixing memory leaks, handling edge-case validation errors, reconciling accounting discrepancies, writing compliance documentation, and resolving conflicting stakeholder revisions.",
      "id": "block-13",
      "order": 13
    },
    {
      "type": "paragraph",
      "text": "The final ten percent is completely devoid of creative glamour. It is the unglamorous, tedious labor of sanding down rough joints, proofreading bibliographic citations, fixing CSS layout bugs on obscure mobile viewports, and negotiating legal indemnification clauses. To a brain addicted to novel conceptual leaps, this phase feels like wading through wet cement.",
      "id": "block-14",
      "order": 14
    },
    {
      "type": "paragraph",
      "text": "Finishing requires anticipating this asymmetric friction in advance. When you reach the ninety percent milestone, do not celebrate as though the journey is concluded. Take a deep breath, gird your emotional loins, and recognize that your real marathon has just begun. The final ten percent is the toll booth that separates amateur dreamers from sovereign masters.",
      "id": "block-15",
      "order": 15
    },
    {
      "type": "table",
      "tableHeaders": [
        "Phase of Project",
        "Cognitive Nature",
        "Characteristic Vulnerability"
      ],
      "tableRows": [
        [
          "Initial 0% - 30%",
          "Dopamine-rich ideation, broad architecture, excitement.",
          "Premature over-engineering and ungrounded optimism."
        ],
        [
          "Middle 30% - 80%",
          "Steady production, rhythmic habit, incremental progress.",
          "Mid-project boredom, distraction by shiny new ideas."
        ],
        [
          "Final 80% - 99%",
          "Edge cases, unglamorous polish, conflict resolution.",
          "Perfectionistic paralysis and fear of public judgment."
        ],
        [
          "Delivery (100%)",
          "Release, distribution, operational handover, post-mortem.",
          "Post-launch vulnerability and emotional letdown."
        ]
      ],
      "id": "block-16",
      "order": 16
    },
    {
      "type": "divider",
      "id": "block-17",
      "order": 17
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Perfectionism as Cowardice: The Psychology of Endless Refinement",
      "id": "block-18",
      "order": 18
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85",
      "alt": "A focused craftsman completing the delicate final joinery and polishing on an intricate wooden cabinet",
      "caption": "The skill of finishing requires navigating the asymmetric friction of the final ten percent with surgical focus.",
      "id": "block-19",
      "order": 19
    },
    {
      "type": "paragraph",
      "text": "In professional culture, perfectionism is frequently brandished as a humble-brag: 'My greatest weakness is that I care too much about perfection!' We imagine that the perfectionist is a noble, uncompromising artist holding out for transcendent beauty against a vulgar, compromising world.",
      "id": "block-20",
      "order": 20
    },
    {
      "type": "paragraph",
      "text": "In reality, neurotic perfectionism is almost never about quality; it is an unconscious act of psychological cowardice. Perfectionism is a sophisticated defense mechanism designed to insulate the fragile ego from the terrifying vulnerability of external judgment. As long as the book remains in draft form on your laptop, it is potentially a masterpiece; the moment it is printed and sold on Amazon, it is an imperfect, vulnerable object that can be mocked, criticized, or ignored.",
      "id": "block-21",
      "order": 21
    },
    {
      "type": "paragraph",
      "text": "By continuously finding 'just one more chapter that needs rewriting' or 'one more algorithmic efficiency that needs optimization,' the perfectionist keeps the project safely locked in the private womb of creation. They trade the risk of real-world failure for the safe, perpetual fantasy of unrealized potential.",
      "id": "block-22",
      "order": 22
    },
    {
      "type": "paragraph",
      "text": "Author and entrepreneur Seth Godin terms this dynamic 'thrashing at the end.' Amateurs thrash at the finish line, introducing radical architectural overhauls, second-guessing core premises, and panicking as the shipping date approaches. True masters do their thrashing at the beginning: debating fiercely during the design phase, establishing firm specifications, and executing the final delivery with calm, unflinching detachment.",
      "id": "block-23",
      "order": 23
    },
    {
      "type": "paragraph",
      "text": "Recognize perfectionism for the insidious saboteur that it is. An imperfect deliverable released into the real world will teach you ten times more about your craft than a 'perfect' deliverable that dies in your private drafts. Ship the work, let reality deliver its verdict, and do better on the next iteration.",
      "id": "block-24",
      "order": 24
    },
    {
      "type": "divider",
      "id": "block-25",
      "order": 25
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Scope Creep Disease: Radical Pruning and the Minimum Lovable Product",
      "id": "block-26",
      "order": 26
    },
    {
      "type": "callout",
      "calloutType": "tip",
      "text": "Finishing is an act of ruthless subtraction; a master finisher is defined not by what they add, but by what they have the courage to cut.",
      "id": "block-27",
      "order": 27
    },
    {
      "type": "paragraph",
      "text": "The primary mechanical killer of projects in technology, construction, and creative industries is Scope Creep. Scope creep is the insidious, gradual expansion of a project's requirements, features, and ambitions beyond the original baseline. It rarely arrives as a single, dramatic catastrophe; it arrives as a thousand reasonable suggestions: 'While we're in the codebase, wouldn't it be great to add dark mode? Wouldn't it be wonderful to translate the guide into three additional languages?'",
      "id": "block-28",
      "order": 28
    },
    {
      "type": "paragraph",
      "text": "Each individual addition seems harmless and logical; collectively, they push the project past its delivery horizon, drain financial runways, and drown the team in combinatorial complexity. A three-month project metastasizes into an eighteen-month quagmire.",
      "id": "block-29",
      "order": 29
    },
    {
      "type": "paragraph",
      "text": "Finishing requires adopting the discipline of radical pruning. When a project begins to stumble under its own weight, the solution is never to add more resources, extend the timeline, or work sixteen-hour days. The solution is to take a machete to the feature list.",
      "id": "block-30",
      "order": 30
    },
    {
      "type": "paragraph",
      "text": "Adopt the framework of the Minimum Lovable Product (MLP): what is the absolute smallest, tightest core of functionality or narrative that delivers undeniable, transformative value to the user? Everything else—the secondary bells and whistles, the speculative edge-case features, the cosmetic flourishes—must be ruthlessly excised and deferred to Version 2.0.",
      "id": "block-31",
      "order": 31
    },
    {
      "type": "paragraph",
      "text": "Learn to say 'No' to your own good ideas. A good idea arriving at the eighty percent mark of a project is not an opportunity; it is an existential threat to completion. Write the idea in an external backlog, close the door, and finish the core deliverable.",
      "id": "block-32",
      "order": 32
    },
    {
      "type": "divider",
      "id": "block-33",
      "order": 33
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Definition of Done: Establishing Unambiguous Acceptance Criteria",
      "id": "block-34",
      "order": 34
    },
    {
      "type": "paragraph",
      "text": "Why do projects drift aimlessly into the sunset? In most instances, projects fail to finish because the team never established an explicit, measurable, and unambiguous Definition of Done. When completion is defined vaguely—'Build a world-class analytics dashboard' or 'Write an authoritative guide to systems design'—the team has no idea when they have arrived at the destination.",
      "id": "block-35",
      "order": 35
    },
    {
      "type": "paragraph",
      "text": "Without an unambiguous finish line, psychological goalposts shift continuously. An engineer finishes the primary query pipeline, only to feel that the visualization charts look slightly plain; the designer polishes the charts, only to feel that the export functionality is suboptimal. The project wanders in an infinite hall of mirrors.",
      "id": "block-36",
      "order": 36
    },
    {
      "type": "paragraph",
      "text": "A professional Definition of Done is a binary, verifiable checklist established before the first line of code is written or the first paragraph is drafted. The criteria must be so concrete that a detached third-party auditor could review the deliverable and say 'Yes' or 'No' with zero subjective ambiguity.",
      "id": "block-37",
      "order": 37
    },
    {
      "type": "paragraph",
      "text": "For a software module, the Definition of Done might state: 'All unit test suites pass with greater than eighty-five percent code coverage; end-to-end load tests sustain ten thousand concurrent requests below two hundred milliseconds latency; zero open Severity 1 security vulnerabilities; staging sign-off approved by QA lead.'",
      "id": "block-38",
      "order": 38
    },
    {
      "type": "paragraph",
      "text": "When the final checkbox on the Definition of Done is ticked, the work is complete. The deliberation terminates, the polish ceases, and the deliverable is pushed to production. Guard the Definition of Done like a sacred treaty: once established, it cannot be expanded without formal, board-level re-chartering.",
      "id": "block-39",
      "order": 39
    },
    {
      "type": "divider",
      "id": "block-40",
      "order": 40
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Anatomy of Resistance: Pressfield's Law of Terminal Sabotage",
      "id": "block-41",
      "order": 41
    },
    {
      "type": "paragraph",
      "text": "In his classic treatise on creative discipline, 'The War of Art,' author Steven Pressfield gives a name to the universal, invisible psychological force that seeks to sabotage human achievement: Resistance. Resistance is the toxic voice of procrastination, distraction, self-doubt, and rationalization that whispers in your ear whenever you attempt to evolve from a lower ethical or operational plane to a higher one.",
      "id": "block-42",
      "order": 42
    },
    {
      "type": "paragraph",
      "text": "Pressfield articulates a critical, profound observation about Resistance that every finisher must memorize: Resistance is most intense at the finish line. When you are standing at the five percent mark of a project, Resistance is relatively calm; it knows the finish line is distant. But when you reach the ninety-five percent mark—when the book is about to be sent to the printer, when the startup is about to launch publicly, when the merger contract is about to be signed—Resistance enters a state of absolute, frantic panic.",
      "id": "block-43",
      "order": 43
    },
    {
      "type": "paragraph",
      "text": "At the finish line, Resistance deploys its most monstrous weapons. You will suddenly experience an overwhelming urge to clean your entire garage; you will pick an irrational fight with your spouse; you will convince yourself that the entire project is an embarrassing failure that must be burned; or you will suddenly be struck by an 'irresistible, genius idea' for a completely different project that you simply must start today.",
      "id": "block-44",
      "order": 44
    },
    {
      "type": "paragraph",
      "text": "Recognize these late-stage panic reactions for what they are: the dying gasps of Resistance realizing that you are about to defeat it. When your internal voice begins screaming that you are a fraud and that your work is trash, do not surrender to despair. Smile quietly to yourself and say: 'Resistance is screaming because the finish line is in sight. I am thirty yards from the tape. Step forward.'",
      "id": "block-45",
      "order": 45
    },
    {
      "type": "divider",
      "id": "block-46",
      "order": 46
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Temporal Hard Stops: Forcing Functions and the Economics of Constraints",
      "id": "block-47",
      "order": 47
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85",
      "alt": "A senior software engineering team verifying automated deployment pipelines and production checklists",
      "caption": "An explicit Definition of Done establishes an objective, tamper-proof finish line that eliminates endless scope drift.",
      "id": "block-48",
      "order": 48
    },
    {
      "type": "callout",
      "calloutType": "tip",
      "text": "Parkinson's Law dictates that work expands to fill the time available for its completion; artificial temporal constraints are the only antidote to eternal drift.",
      "id": "block-49",
      "order": 49
    },
    {
      "type": "paragraph",
      "text": "In 1955, British historian C. Northcote Parkinson published his famous adage in The Economist: 'Work expands so as to fill the time available for its completion.' If you give an engineering team or an author six months to complete a deliverable, it will take six months. If you give them six years, it will take six years, and the final quality will almost certainly be worse.",
      "id": "block-50",
      "order": 50
    },
    {
      "type": "paragraph",
      "text": "Finishing requires the intentional engineering of hard temporal constraints—what project management scientists call 'Forcing Functions.' A forcing function is an external, irrevocable commitment that makes delay excruciatingly expensive or socially impossible.",
      "id": "block-51",
      "order": 51
    },
    {
      "type": "paragraph",
      "text": "Consider how elite performers use forcing functions: an author books a massive public auditorium and sells non-refundable tickets for a book launch lecture six months in advance, before chapter three is finished; a software founder commits to a live product demonstration at a major industry conference on October 15th; an architectural firm enters a binding municipal competition with an unbending submission deadline enforced by a timestamped server.",
      "id": "block-52",
      "order": 52
    },
    {
      "type": "paragraph",
      "text": "A hard temporal stop concentrates the human intellect with extraordinary power. It burns away trivial debates, silences perfectionistic dithering, and forces the team to focus exclusively on the core essentials. When the clock is ticking down to zero, participants stop arguing about aesthetic trivialities and ask the only question that matters: 'Does this meet the Definition of Done?'",
      "id": "block-53",
      "order": 53
    },
    {
      "type": "paragraph",
      "text": "Never embark on an important project with an open-ended timeline. Anchor your mission to an immutable hard stop. Announce the deadline publicly, create irreversible accountability, and let the pressure of the clock forge your raw effort into finished steel.",
      "id": "block-54",
      "order": 54
    },
    {
      "type": "divider",
      "id": "block-55",
      "order": 55
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Emotional Hangover of Completion: Navigating the Post-Launch Void",
      "id": "block-56",
      "order": 56
    },
    {
      "type": "paragraph",
      "text": "One of the least discussed and most disorienting dimensions of the finishing discipline is the profound emotional depression that frequently follows the completion of a major, multi-year endeavor. Modern culture teaches us that when we finally ship our masterpiece, we will experience an enduring state of transcendent ecstasy, triumph, and eternal fulfillment.",
      "id": "block-57",
      "order": 57
    },
    {
      "type": "paragraph",
      "text": "In psychological reality, the moment of completion is often followed by acute anti-climax, emptiness, and emotional exhaustion—a condition clinical psychologists term the 'Arrival Fallacy' or 'Post-Launch Depression.' For three years, your life possessed total narrative clarity: you woke up every morning with an unmistakable mission, a defined enemy, and an obsessive focus. Your nervous system was sustained by high levels of dopaminergic arousal.",
      "id": "block-58",
      "order": 58
    },
    {
      "type": "paragraph",
      "text": "The day after the launch, the operational noise falls silent. The deliverable is out of your hands. The market's response is often slower and more muted than your fantasies imagined. You wake up on Monday morning, look at your empty workstation, and are gripped by a terrifying void: 'Who am I now? What is my purpose? Was all that sacrifice worth it?'",
      "id": "block-59",
      "order": 59
    },
    {
      "type": "paragraph",
      "text": "Navigating this post-launch void requires preparing for the emotional hangover in advance. Recognize that the depression is not a sign of failure; it is the natural biological comedown of an exhausted nervous system discharging three years of stress hormones. Do not make radical life decisions or launch new speculative ventures during this vulnerable window.",
      "id": "block-60",
      "order": 60
    },
    {
      "type": "paragraph",
      "text": "Schedule a mandatory three-week quarantine following a major completion: rest your body, reconnect with loved ones, engage in mindless physical labor, and allow your cognitive soil to lie fallow. Accept the quiet emptiness as a holy interval of rest before the next grand journey begins.",
      "id": "block-61",
      "order": 61
    },
    {
      "type": "divider",
      "id": "block-62",
      "order": 62
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Institutional Case Studies: Great Finishers in History and Industry",
      "id": "block-63",
      "order": 63
    },
    {
      "type": "paragraph",
      "text": "Throughout the history of human achievement, the defining characteristic of elite operators has not been the fertility of their imaginations, but their unbending, ruthless capacity to drive complex initiatives across the finish line.",
      "id": "block-64",
      "order": 64
    },
    {
      "type": "paragraph",
      "text": "Consider the monumental triumph of the Empire State Building in New York City. Designed during the height of the Great Depression and constructed under the leadership of general contractors Starrett Brothers and Eken, this colossal one-hundred-and-two-story skyscraper was completed in exactly one year and forty-five days—ahead of schedule and under budget. The construction team operated on an unbending, clockwork logistics system: steel girders forged in Pittsburgh arrived at the Manhattan construction site eighty hours later, still warm from the blast furnaces, and were riveted into the superstructure within two hours of arrival. The builders maintained absolute scope boundaries, refused to permit architectural alterations during construction, and finished the greatest architectural monument of the twentieth century in record time.",
      "id": "block-65",
      "order": 65
    },
    {
      "type": "paragraph",
      "text": "Contrast this with the tragic cautionary tale of Duke University's legendary medical informatics system in the 1990s, or the infamous British National Health Service IT overhaul: projects that spanned decades, burned billions of dollars, and were eventually scrapped entirely because leadership allowed requirements to mutate continuously, endlessly deferring the finish line.",
      "id": "block-66",
      "order": 66
    },
    {
      "type": "paragraph",
      "text": "In creative craft, consider the contrasting legacies of Leonardo da Vinci and Michelangelo Buonarroti. Leonardo was unquestionably one of history's greatest polymaths, possessing an imagination of astronomical genius. Yet Leonardo was an erratic, tragic non-finisher: he spent decades dreaming, experimenting with novel varnishes, and abandoning commissions mid-execution, leaving behind only a handful of completed paintings and hundreds of unfinished sketches. Michelangelo, by contrast, was a ferocious, unstoppable closer: he locked himself inside the Sistine Chapel for four grueling years, painting twelve thousand square feet of ceiling plaster while sleeping in his clothes, driving the project to completion through sheer, unyielding will.",
      "id": "block-67",
      "order": 67
    },
    {
      "type": "paragraph",
      "text": "The world marvels at Leonardo's sketches, but it worships before Michelangelo's Sistine Chapel. Aspire to the discipline of Michelangelo: take your transcendent vision, endure the physical agony of execution, and drive the chisel until the statue stands free.",
      "id": "block-68",
      "order": 68
    },
    {
      "type": "divider",
      "id": "block-69",
      "order": 69
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Polish Trap: Distinguishing Structural Integrity from Surface Cosmetics",
      "id": "block-70",
      "order": 70
    },
    {
      "type": "paragraph",
      "text": "When a project approaches the finish line, amateur operators frequently fall into the Polish Trap: spending eighty percent of their remaining time and emotional energy agonizing over cosmetic micro-details that provide virtually zero incremental value to the end user, while neglecting the core functional integrity of the deliverable.",
      "id": "block-71",
      "order": 71
    },
    {
      "type": "paragraph",
      "text": "An author spends three weeks debating whether a secondary character's shirt should be maroon or navy blue, while ignoring a massive structural plot hole in chapter eight. A software founder spends five days adjusting the border radius of a button from four pixels to six pixels, while the checkout payment gateway crashes on edge-case currency conversions.",
      "id": "block-72",
      "order": 72
    },
    {
      "type": "paragraph",
      "text": "Cosmetic polishing is seductive because it is easy, comfortable, and low-risk. Tinkering with font choices or color palettes does not require heavy intellectual lifting, and it allows the creator to feel like they are 'working hard' while safely avoiding the painful, difficult labor of testing structural integrity.",
      "id": "block-73",
      "order": 73
    },
    {
      "type": "paragraph",
      "text": "To escape the polish trap, apply the 'Structural Audit Hierarchy.' Evaluate your deliverable across three strict layers: Foundation (Does it work reliably under load?), Architecture (Is the argument or user flow coherent and clear?), and Cosmetics (Is the visual or stylistic presentation clean?).",
      "id": "block-74",
      "order": 74
    },
    {
      "type": "paragraph",
      "text": "Never spend an hour on cosmetics until the foundation and architecture are bulletproof. Once the core deliverable is durable, functional, and clear, establish a strict, forty-eight-hour time-box for final cosmetic polish. When the timer expires, put down the sandpaper and ship the work.",
      "id": "block-75",
      "order": 75
    },
    {
      "type": "divider",
      "id": "block-76",
      "order": 76
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Public Arena: Handling the Vulnerability of Exposure",
      "id": "block-77",
      "order": 77
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85",
      "alt": "An executive leadership team reviewing the final binding documentation and contract signatures in a bright boardroom",
      "caption": "True authority in the marketplace accrues entirely to the finisher who transforms ideas into completed assets.",
      "id": "block-78",
      "order": 78
    },
    {
      "type": "callout",
      "calloutType": "warning",
      "text": "Shipping is an act of supreme emotional exposure; you are placing your unvarnished abilities before an indifferent or critical world without the protection of excuses.",
      "id": "block-79",
      "order": 79
    },
    {
      "type": "paragraph",
      "text": "At its deepest emotional core, the inability to finish is not a failure of time management, project planning, or technical skill; it is an existential terror of exposure. To finish and release a piece of work into the public arena is to say to the world: 'Here is what I made. This is the absolute limit of my current intelligence, skill, and taste. Judge it.'",
      "id": "block-80",
      "order": 80
    },
    {
      "type": "paragraph",
      "text": "In the public arena, you cannot add a polite verbal asterisk explaining that you were tired, that your budget was limited, or that you had brilliant ideas that you didn't have time to implement. The deliverable must stand alone, naked before the crowd. It will be evaluated by critics who know nothing of your sacrifices, by competitors eager to spot your flaws, and by an indifferent public that will scroll past it in three seconds.",
      "id": "block-81",
      "order": 81
    },
    {
      "type": "paragraph",
      "text": "The terror of this exposure drives many talented individuals into lifelong hiding. They prefer the safe, tragic obscurity of the unrecognized genius: complaining over drinks that the world doesn't appreciate true art, while secretly terrified of ever testing their abilities against real market friction.",
      "id": "block-82",
      "order": 82
    },
    {
      "type": "paragraph",
      "text": "Mastering the skill of finishing requires developing what Theodore Roosevelt celebrated as the spirit of 'The Man in the Arena': the willingness to step onto the blood-stained, dusty battlefield, knowing that you will make mistakes, stumble, and incur criticism, but choosing that glorious struggle over the cold, timid lives of those who know neither victory nor defeat.",
      "id": "block-83",
      "order": 83
    },
    {
      "type": "paragraph",
      "text": "Have the courage to be judged. Have the courage to ship an imperfect deliverable. Let the critics sneer from their safe seats in the stands; you are the warrior in the arena, building civilization with your own hands.",
      "id": "block-84",
      "order": 84
    },
    {
      "type": "divider",
      "id": "block-85",
      "order": 85
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Sunk-Cost Razor: Knowing When to Decapitate an Unviable Project",
      "id": "block-86",
      "order": 86
    },
    {
      "type": "paragraph",
      "text": "While finishing is a supreme virtue, you must never confuse the noble discipline of finishing with the irrational obstinacy of dragging an unviable corpse across an arbitrary finish line. A master finisher possesses not only the stamina to close projects that work, but the razor-sharp discernment to ruthlessly terminate projects that are structurally dead.",
      "id": "block-87",
      "order": 87
    },
    {
      "type": "paragraph",
      "text": "How do you distinguish between the temporary friction of the last ten percent and a project that should be terminated? The distinction lies in evaluating the fundamental premise versus the execution details.",
      "id": "block-88",
      "order": 88
    },
    {
      "type": "paragraph",
      "text": "If the fundamental strategic premise is sound—market demand is proven, the technology is viable, and the value proposition is clear—but the team is suffering from operational exhaustion, messy bugs, or perfectionistic fear, you must enforce discipline, prune scope, and drive the deliverable across the finish line.",
      "id": "block-89",
      "order": 89
    },
    {
      "type": "paragraph",
      "text": "If, however, the fundamental premise has been definitively invalidated—the underlying regulatory landscape has outlawed the business model, the core mathematical algorithm has been proven theoretically impossible, or the customer problem has dissolved—then continuing to pour capital and energy into 'finishing' is an act of grotesque vanity. You are spending thousands of hours polishing a tombstone.",
      "id": "block-90",
      "order": 90
    },
    {
      "type": "paragraph",
      "text": "Apply the Sunk-Cost Razor: evaluate the project as if you arrived on earth this morning with zero historic investment in it. If the forward-looking expected value is negative, decapitate the project immediately. Archive the code, write an unvarnished post-mortem, celebrate the lessons learned, and reallocate your precious life energy to an endeavor that can actually fly.",
      "id": "block-91",
      "order": 91
    },
    {
      "type": "divider",
      "id": "block-92",
      "order": 92
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Tooling of Closure: Checklists, Staging, and Release Pipelines",
      "id": "block-93",
      "order": 93
    },
    {
      "type": "paragraph",
      "text": "In modern professional operations, finishing cannot rely on heroic, late-night memory. When human beings are tired, anxious, and rushing toward a deadline, cognitive bandwidth collapses, and critical operational details are forgotten. You ship the software without updating the production database credentials; you print the book with an unindexed table of contents; you submit the legal brief with a missing signature page.",
      "id": "block-94",
      "order": 94
    },
    {
      "type": "paragraph",
      "text": "Finishing requires industrializing closure through standardized release tooling: Checklists, Staging Environments, and Automated Release Pipelines. In his landmark work 'The Checklist Manifesto,' surgeon Atul Gawande demonstrated that even elite, world-class specialists routinely commit catastrophic errors during routine procedures if they rely on memory alone.",
      "id": "block-95",
      "order": 95
    },
    {
      "type": "paragraph",
      "text": "A Release Checklist is an immutable, step-by-step protocol that must be physically executed and signed off before any deliverable is pushed to the public. For a digital publication, the checklist might include: verify all external citations and URLs; run automated spelling and grammar static analysis; test responsive layout on iOS and Android viewports; verify image compression and metadata tags; confirm SEO title and canonical link integrity.",
      "id": "block-96",
      "order": 96
    },
    {
      "type": "paragraph",
      "text": "Second, utilize staging environments that mirror production reality with total fidelity. Never test in production, and never ship directly from a local development sandbox. By testing the deliverable in a sterile staging environment that replicates real-world constraints, you flush out the final hidden bugs before your users ever see them.",
      "id": "block-97",
      "order": 97
    },
    {
      "type": "paragraph",
      "text": "Standardize the mechanics of closure. Make the release sequence so automated, procedural, and predictable that shipping ceases to be a terrifying, chaotic crisis and becomes a routine, celebratory ceremony of excellence.",
      "id": "block-98",
      "order": 98
    },
    {
      "type": "divider",
      "id": "block-99",
      "order": 99
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Compounding Power of the Portfolio: The Finisher's Moat",
      "id": "block-100",
      "order": 100
    },
    {
      "type": "paragraph",
      "text": "In the economic marketplace, trust, authority, and pricing power do not accrue to the person who talks about what they plan to do; they accrue entirely to the person who can point to a massive, undeniable portfolio of completed deliverables.",
      "id": "block-101",
      "order": 101
    },
    {
      "type": "paragraph",
      "text": "Consider the immense competitive moat built by a finisher over a decade. While their peers spent ten years chasing five different grand, unfinished dreams, the finisher published four authoritative books, deployed six working software products, and built two profitable enterprises. Each completed deliverable acts as an independent, permanent asset that generates revenue, attracts inbound opportunities, and builds reputational gravity around the clock.",
      "id": "block-102",
      "order": 102
    },
    {
      "type": "paragraph",
      "text": "Furthermore, each completed project provides an empirical foundation for the next. The finisher learns how to handle distributors, how to negotiate contracts, how to manage QA cycles, and how to weather public criticism. Their execution velocity accelerates exponentially. While the novice spends six months agonizing over how to format a deliverable, the veteran finisher executes the sequence in four days with their eyes closed.",
      "id": "block-103",
      "order": 103
    },
    {
      "type": "paragraph",
      "text": "A completed portfolio is an unarguable fact in an ocean of theoretical noise. When a client, investor, or partner evaluates your capabilities, they do not need to decipher your potential; they simply look upon the shelf of your finished works. The volume, quality, and durability of what you have shipped speaks with sovereign, undeniable authority.",
      "id": "block-104",
      "order": 104
    },
    {
      "type": "paragraph",
      "text": "Stop debating your potential. Build your portfolio. Ship one clean, durable masterpiece after another, and let the cumulative weight of your finished works bury the competition.",
      "id": "block-105",
      "order": 105
    },
    {
      "type": "divider",
      "id": "block-106",
      "order": 106
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Psychology of Version 1.0: Shipping as the Beginning of Dialogue",
      "id": "block-107",
      "order": 107
    },
    {
      "type": "paragraph",
      "text": "A primary mental block that paralyzes finishers is the subconscious belief that the deliverable they are about to release represents their final, eternal, and irreversible statement on the subject. The author writes chapter twelve feeling that if this paragraph is not immortal, their entire soul will be judged a failure; the product team designs Version 1.0 as if it must solve every human problem for the next century.",
      "id": "block-108",
      "order": 108
    },
    {
      "type": "paragraph",
      "text": "This grandiose framing is an intellectual disease. In reality, Version 1.0 is not the conclusion of the conversation; Version 1.0 is merely the admission ticket that allows you to join the conversation.",
      "id": "block-109",
      "order": 109
    },
    {
      "type": "paragraph",
      "text": "Until you ship Version 1.0, you are operating entirely in a vacuum of your own fantasies and assumptions. You do not know how real humans will interact with your software, which chapters of your book will touch readers' hearts, or what features of your service will generate genuine economic value. Reality only begins to speak after the deliverable is in the user's hands.",
      "id": "block-110",
      "order": 110
    },
    {
      "type": "paragraph",
      "text": "Re-frame your launch: Version 1.0 is simply the opening question in a lifelong dialogue with reality. It does not need to be perfect; it needs to be coherent, useful, and structurally sound. Once it is in the world, the market will return immense, invaluable telemetry: showing you what to fix, what to expand, and what to discard in Version 2.0.",
      "id": "block-111",
      "order": 111
    },
    {
      "type": "paragraph",
      "text": "Release Version 1.0 with humble confidence. Step out of your private workshop, hand your work to the world, listen closely to the feedback, and let the magnificent dialogue of craftsmanship begin.",
      "id": "block-112",
      "order": 112
    },
    {
      "type": "divider",
      "id": "block-113",
      "order": 113
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Moral Obligation of Delivery: Honoring the Sacrifices Made",
      "id": "block-114",
      "order": 114
    },
    {
      "type": "paragraph",
      "text": "At its deepest philosophical level, finishing an ambitious undertaking is not merely a tactical professional discipline; it is a profound moral obligation to all who supported you along the journey.",
      "id": "block-115",
      "order": 115
    },
    {
      "type": "paragraph",
      "text": "When you undertake a multi-year endeavor—a startup, a research monograph, an artistic creation, or an institutional reform—you do not labor in an isolated vacuum. You consume the finite resources of family members who endured your late nights and emotional distraction; of investors who trusted you with their capital; of colleagues who poured their sweat into your vision; and of mentors who staked their reputations on your integrity.",
      "id": "block-116",
      "order": 116
    },
    {
      "type": "paragraph",
      "text": "To abandon a project at the ninety percent mark because you are bored, because the final polish is unglamorous, or because you are terrified of public criticism is a profound betrayal of that collective sacrifice. You have consumed the time, faith, and resources of others, and returned nothing to the human treasury.",
      "id": "block-117",
      "order": 117
    },
    {
      "type": "paragraph",
      "text": "When the temptation to abandon your project arrives in the dark midnight hours of the final ten percent, remember the debt you owe. Look upon the names of the people who believed in you, who funded your runway, and who covered your shifts. Pick up your tools, grit your teeth, and drive the deliverable across the finish line—not for your own vanity, but to honor the sacred trust that was placed in your hands.",
      "id": "block-118",
      "order": 118
    },
    {
      "type": "paragraph",
      "text": "Finishing is an act of moral closure. It fulfills your covenants, pays your debts, and proves that you are an adult worthy of bearing responsibility in the human enterprise.",
      "id": "block-119",
      "order": 119
    },
    {
      "type": "divider",
      "id": "block-120",
      "order": 120
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Finisher's Protocol: A Step-by-Step Closing Checklist",
      "id": "block-121",
      "order": 121
    },
    {
      "type": "callout",
      "calloutType": "tip",
      "text": "Closing is an industrial operational sequence; execute the checklist mechanically to prevent late-stage cognitive drift.",
      "id": "block-122",
      "order": 122
    },
    {
      "type": "paragraph",
      "text": "When a project reaches the eighty-five percent mark, shift from creative development to the Finisher's Protocol. This repeatable checklist provides the structural guardrails needed to navigate the final stretch with surgical precision.",
      "id": "block-123",
      "order": 123
    },
    {
      "type": "paragraph",
      "text": "Step One: Scope Freeze. Declare an absolute, immutable freeze on all new features, requirements, and narrative additions. Create a 'Version 2.0 Backlog' document; every new idea that arises is immediately routed to that backlog with zero debate.",
      "id": "block-124",
      "order": 124
    },
    {
      "type": "paragraph",
      "text": "Step Two: The Triage Matrix. Review all remaining open tasks and bugs. Categorize each into: Blockers (Must fix to ship), High (Fix if time permits), and Low (Ignore for Version 1.0). Ruthlessly close or defer all High and Low items.",
      "id": "block-125",
      "order": 125
    },
    {
      "type": "paragraph",
      "text": "Step Three: The Final 48-Hour Timebox. Establish a strict, non-negotiable deadline for final cosmetic polish and proofreading. When the forty-eight hours conclude, tools down.",
      "id": "block-126",
      "order": 126
    },
    {
      "type": "paragraph",
      "text": "Step Four: The Pre-Flight Validation. Execute the objective Definition of Done checklist in a clean staging environment. Verify all links, dependencies, credentials, and compliance sign-offs.",
      "id": "block-127",
      "order": 127
    },
    {
      "type": "paragraph",
      "text": "Step Five: The Irrevocable Release. Push the deploy button, deliver the manuscript, or sign the closing documents. Do not look back, do not hover over real-time analytics, and step into mandatory post-launch decompression.",
      "id": "block-128",
      "order": 128
    },
    {
      "type": "list",
      "items": [
        "Step 1: Scope Freeze — Enforce total prohibition on new feature requests; route all new ideas to Version 2.0 backlog.",
        "Step 2: Triage Matrix — Classify all remaining issues into Blockers, High, and Low; close or defer all non-blockers.",
        "Step 3: 48-Hour Timebox — Establish an unbending temporal boundary for final cosmetic and stylistic polish.",
        "Step 4: Pre-Flight Validation — Execute the objective Definition of Done in a sterile staging environment.",
        "Step 5: Irrevocable Release — Deploy the deliverable to production and transition into structured decompression."
      ],
      "id": "block-129",
      "order": 129
    },
    {
      "type": "divider",
      "id": "block-130",
      "order": 130
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Synthesis: The Unbroken Glory of the Finished Work",
      "id": "block-131",
      "order": 131
    },
    {
      "type": "paragraph",
      "text": "At the conclusion of a life spent in the relentless pursuit of finishing, an individual stands amidst an extraordinary landscape of their own making. While others leave behind only a trail of vague intentions, broken promises, and dusty notebooks filled with half-formed dreams, the finisher leaves behind a magnificent, enduring city of finished monuments.",
      "id": "block-132",
      "order": 132
    },
    {
      "type": "paragraph",
      "text": "Each finished work—each book published, each bridge erected, each company launched, each system deployed—is an indestructible victory over entropy, procrastination, and fear. It is proof that a mortal human being can look upon a blank canvas, endure the agony of the latent plateau, defeat the terror of the finish line, and bring something beautiful, durable, and true into the light of day.",
      "id": "block-133",
      "order": 133
    },
    {
      "type": "paragraph",
      "text": "The finisher sleeps with a clean conscience and a light heart. They know that when their time comes to lay down their tools forever, they will not look back with the bitter agony of unfulfilled potential. They will look back upon a life poured out completely, honorable in its execution, and sealed with the triumphant words: 'It is finished.'",
      "id": "block-134",
      "order": 134
    },
    {
      "type": "paragraph",
      "text": "Step up to the edge of your canvas today. Strip away the excuses, prune the scope, silence the voice of fear, and push the deliverable across the line. Ship the work, and claim the sovereign freedom that belongs only to those who finish.",
      "id": "block-135",
      "order": 135
    },
    {
      "type": "divider",
      "id": "block-136",
      "order": 136
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Architecture of Iterative Releases: Shipping Small to Ship Often",
      "id": "block-137",
      "order": 137
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "De-risking monumental projects requires shrinking the release horizon from multi-year marathons into two-week finish lines.",
      "id": "block-138",
      "order": 138
    },
    {
      "type": "paragraph",
      "text": "In industrial software engineering and Agile methodology, the most transformative breakthrough of the past three decades was the dismantling of the 'Waterfall' model. Under the traditional waterfall approach, organizations spent two years gathering requirements, two years designing architecture, two years writing code, and then attempted a catastrophic 'Big Bang' deployment. Because the finish line was six years in the distance, teams drifted into massive scope creep, missed market shifts, and suffered catastrophic integration failures.",
      "id": "block-139",
      "order": 139
    },
    {
      "type": "paragraph",
      "text": "Modern continuous delivery inverted this paradigm: instead of shipping once every five years, elite engineering organizations ship code to production fifty times a day. By decomposing a massive system into microscopic, independently deployable units, the emotional and technical risk of finishing is reduced by orders of magnitude.",
      "id": "block-140",
      "order": 140
    },
    {
      "type": "paragraph",
      "text": "This release architecture applies with equal power to individual intellectual and creative pursuits. If you attempt to write a massive four-volume history of Western philosophy as your first writing project, you will almost certainly perish in the cemetery of the ninety percent. The finish line is too distant, the cognitive load is too heavy, and the feedback loop is too long.",
      "id": "block-141",
      "order": 141
    },
    {
      "type": "paragraph",
      "text": "Decompose your monumental vision into a series of standalone, self-contained deliverables. Write a tightly argued thirty-page monograph; publish a five-part essay series; release a standalone command-line tool before building the full enterprise dashboard. Each small release gives you the exhilaration of crossing a real finish line, provides hard empirical feedback from users, and builds the psychological muscle of shipping.",
      "id": "block-142",
      "order": 142
    },
    {
      "type": "paragraph",
      "text": "Ship small, and ship often. Make finishing a weekly habit rather than a once-in-a-decade crisis. Let the compounding momentum of dozens of small, completed deliverables carry you effortlessly to the summit of your grandest ambitions.",
      "id": "block-143",
      "order": 143
    },
    {
      "type": "divider",
      "id": "block-144",
      "order": 144
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Burnout Defense at the Finish Line: Somatic Stamina for the Final Sprint",
      "id": "block-145",
      "order": 145
    },
    {
      "type": "paragraph",
      "text": "The final two weeks of an ambitious project present an intense bioenergetic challenge. As the hard deadline approaches and the unglamorous friction of edge cases, bug fixes, and stakeholder alignments peaks, the temptation to abandon all physical self-care and enter manic, sleepless heroics becomes overwhelming.",
      "id": "block-146",
      "order": 146
    },
    {
      "type": "paragraph",
      "text": "This late-stage exhaustion is where catastrophic errors are born. When an engineer or team works forty-eight consecutive hours on adrenaline and caffeine to hit a launch deadline, their cognitive error rate spikes by three hundred percent. In that sleep-deprived haze, developers introduce subtle race conditions, delete production data, and authorize broken configurations that turn what should have been a triumphant launch into a public relations disaster.",
      "id": "block-147",
      "order": 147
    },
    {
      "type": "paragraph",
      "text": "Protecting your biological engine during the final sprint requires disciplined physical pacing. The first rule is preserving the sleep floor: no matter how tight the deadline, maintain seven hours of sleep. A well-rested brain can solve in thirty minutes a baffling configuration bug that a sleep-deprived brain will chase for eight hours in circles.",
      "id": "block-148",
      "order": 148
    },
    {
      "type": "paragraph",
      "text": "The second rule is physiological punctuation: every ninety minutes of intense focus, force yourself to step physically away from the screen for five minutes. Do ten air squats, drink twenty ounces of water, and look at distant natural light. These micro-breaks prevent ocular strain, release muscle tension, and reset working memory.",
      "id": "block-149",
      "order": 149
    },
    {
      "type": "paragraph",
      "text": "Furthermore, maintain strict emotional equanimity within the team. Late-stage pressure naturally amplifies irritability and interpersonal friction. As a leader, your posture must be calm, steady, and reassuring. Lower your voice, refuse to panic, and remind the team: 'We are thirty yards from the tape. Stay focused on your mechanics, execute the checklist, and we will cross together in safety.'",
      "id": "block-150",
      "order": 150
    },
    {
      "type": "divider",
      "id": "block-151",
      "order": 151
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Post-Mortem Crucible: Learning Why Projects Stalled",
      "id": "block-152",
      "order": 152
    },
    {
      "type": "paragraph",
      "text": "Even for experienced finishers, there will inevitably be projects that stumbled, suffered significant delays, or had to be ruthlessly amputated to cross the line. The true master does not sweep these execution scars under the rug; they conduct a rigorous, dispassionate operational post-mortem.",
      "id": "block-153",
      "order": 153
    },
    {
      "type": "paragraph",
      "text": "A finishing post-mortem is held within seven days of release, examining the execution mechanics with clinical precision. It asks three forensic questions: First, where was our estimation error widest? Did we underestimate QA testing by a factor of four? Did we fail to anticipate regulatory compliance hurdles? Second, what was the primary vector of scope creep? Who introduced the auxiliary features that threatened the timeline, and why was our Scope Freeze protocol breached? Third, which operational tools performed flawlessly, and which tools added unnecessary friction?",
      "id": "block-154",
      "order": 154
    },
    {
      "type": "paragraph",
      "text": "The findings of the post-mortem must be codified into permanent institutional heuristics. If the post-mortem reveals that testing in staging took three times longer than planned, update your standard project planning formula to mandate a thirty-percent testing buffer on all future roadmaps.",
      "id": "block-155",
      "order": 155
    },
    {
      "type": "paragraph",
      "text": "By closing the project with an analytical post-mortem, you ensure that every drop of sweat, frustration, and anxiety endured during the final ten percent is converted into permanent operational competence. You build an organization that never makes the same execution mistake twice.",
      "id": "block-156",
      "order": 156
    },
    {
      "type": "paragraph",
      "text": "Embrace the post-mortem with humility and gratitude. It is the final, essential step that transforms a single completed project into a generational capability for relentless, flawless delivery.",
      "id": "block-157",
      "order": 157
    }
  ],
  "tags": [
    "finishing",
    "execution",
    "productivity",
    "shipping",
    "discipline",
    "project-management"
  ],
  "references": [
    {
      "title": "The War of Art: Break Through the Blocks and Win Your Inner Creative Battles (Steven Pressfield)",
      "url": "https://stevenpressfield.com/books/the-war-of-art/"
    },
    {
      "title": "The Checklist Manifesto: How to Get Things Right (Atul Gawande)",
      "url": "https://atulgawande.com/book/the-checklist-manifesto/"
    },
    {
      "title": "Linchpin: Are You Indispensable? (Seth Godin)",
      "url": "https://www.sethgodin.com/"
    },
    {
      "title": "Making Ideas Happen: Overcoming the Obstacles Between Vision and Reality (Scott Belsky)",
      "url": "https://scottbelsky.com/books/"
    }
  ]
};

module.exports = buildCanonicalArticle(articleConfig);
