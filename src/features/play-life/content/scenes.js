const {
  jokes,
  microStories,
  moodGuidance,
  movementPlans,
  randomMoments,
  recipes,
} = require("./catalogs");

const choices = (...items) => items;
const choice = (id, label, next, effect = {}) => ({ id, label, next, effect });

const scenes = {
  intro: {
    id: "intro",
    type: "arrival",
    atmosphere: "dawn",
    eyebrow: "Play Life",
    message: "Every day feels a little different.",
    secondaryMessage: ({ user }) => `Hey, ${user?.displayName || "there"}. Where are you today?`,
    choices: choices(choice("begin", "Step into today", "mood-select")),
  },
  "mood-select": {
    id: "mood-select",
    type: "mood",
    atmosphere: "dawn",
    eyebrow: "Right now",
    message: "Where are you today?",
    secondaryMessage: "No need to make it sound better than it is.",
    choices: [],
  },
  "happy-entry": {
    id: "happy-entry",
    type: "celebration",
    atmosphere: "happy",
    eyebrow: "Let the good in",
    message: "Okayyy... someone's having a good day.",
    secondaryMessage: "What brought the light?",
    choices: choices(
      choice("someone", "Someone made me happy", "happy-preserve", { path: "someone" }),
      choice("achievement", "An achievement", "happy-achievement", { path: "achievement" }),
      choice("good-news", "Good news", "happy-preserve", { path: "good-news" }),
      choice("family", "Family", "happy-preserve", { path: "family" }),
      choice("helped", "I helped someone", "happy-preserve", { path: "helped-someone" }),
      choice("funny", "Something funny", "joke-scene", { path: "funny" }),
      choice("no-reason", "Honestly, no reason", "happy-no-reason", { path: "no-reason" })
    ),
  },
  "happy-no-reason": {
    id: "happy-no-reason",
    type: "pause",
    atmosphere: "happy",
    eyebrow: "Best kind",
    message: "No explanation required.",
    secondaryMessage: "Let's not ruin it by analysing everything.",
    choices: choices(
      choice("enjoy", "Just enjoy this", "happy-preserve"),
      choice("remember", "Remember this moment", "moment-saved", {
        saveMoment: { kind: "joy", title: "A good day that did not need a reason." },
      })
    ),
  },
  "happy-achievement": {
    id: "happy-achievement",
    type: "celebration",
    atmosphere: "excited",
    eyebrow: "You did that",
    message: "Pause before racing to the next thing.",
    secondaryMessage: "This version of you deserves to notice what happened.",
    choices: choices(
      choice("remember", "Keep this memory", "moment-saved", {
        saveMoment: { kind: "achievement", title: "An achievement worth remembering." },
      }),
      choice("share", "Use the energy for someone else", "action-complete", {
        action: { type: "connect", label: "Celebrate with or encourage someone", status: "started" },
      }),
      choice("enjoy", "Stay in the moment", "happy-preserve")
    ),
  },
  "happy-preserve": {
    id: "happy-preserve",
    type: "path",
    atmosphere: "happy",
    eyebrow: "Keep a little of it",
    message: "Good moments do not need homework.",
    secondaryMessage: "But you can carry one piece of this forward.",
    choices: choices(
      choice("remember", "Remember this", "moment-saved", {
        saveMoment: { kind: "joy", title: "A bright moment in Play Life." },
      }),
      choice("kindness", "Do one kind thing", "action-complete", {
        action: { type: "connect", label: "Turn good energy into one kind action", status: "started" },
      }),
      choice("keep-playing", "Give me a surprise", "random-moment"),
      choice("finish", "End on this note", "session-checkout")
    ),
  },
  "sad-entry": {
    id: "sad-entry",
    type: "path",
    atmosphere: "sad",
    eyebrow: "We can take this slowly",
    message: "What's weighing on you?",
    secondaryMessage: "You can keep it broad. You do not owe the whole story.",
    choices: choices(
      choice("relationship", "Relationship", "relationship-empathy", { path: "relationship" }),
      choice("family", "Family", "sad-understand", { path: "family" }),
      choice("career", "Career", "sad-understand", { path: "career" }),
      choice("money", "Money", "sad-understand", { path: "money" }),
      choice("friendship", "Friendship", "sad-understand", { path: "friendship" }),
      choice("health", "Health", "sad-understand", { path: "health" }),
      choice("something-i-did", "Something I did", "sad-understand", { path: "something-i-did" }),
      choice("someone-did", "Something someone did", "sad-understand", { path: "someone-did" }),
      choice("unknown", "I don't know", "sad-understand", { path: "unknown" }),
      choice("private", "I'd rather not say", "sad-understand", { path: "private" })
    ),
  },
  "sad-understand": {
    id: "sad-understand",
    type: "pause",
    atmosphere: "sad",
    eyebrow: "No tidy explanation needed",
    message: "Some things hurt before they make sense.",
    secondaryMessage: "We can work with what you need, even without every detail.",
    choices: choices(choice("continue", "Find what might help", "sad-need")),
  },
  "relationship-empathy": {
    id: "relationship-empathy",
    type: "pause",
    atmosphere: "sad",
    eyebrow: "Someone matters",
    message: "Yeah... when someone matters, what happens between you matters too.",
    secondaryMessage: "What happened?",
    choices: choices(
      choice("fought", "We fought", "relationship-fight", { path: "fight" }),
      choice("ignoring", "They're ignoring me", "relationship-understand", { path: "ignored" }),
      choice("breakup", "We broke up", "relationship-understand", { path: "breakup" }),
      choice("miss", "I miss them", "relationship-understand", { path: "missing" }),
      choice("hurt", "They hurt me", "relationship-understand", { path: "hurt" }),
      choice("trust", "Trust issue", "relationship-understand", { path: "trust" }),
      choice("i-hurt", "I hurt them", "relationship-understand", { path: "repair" }),
      choice("changed", "Things aren't the same", "relationship-understand", { path: "changed" }),
      choice("losing", "I'm afraid of losing them", "relationship-understand", { path: "fear" }),
      choice("complicated", "It's complicated", "relationship-understand", { path: "complicated" }),
      choice("private", "I'd rather not explain", "relationship-understand", { path: "private" })
    ),
  },
  "relationship-fight": {
    id: "relationship-fight",
    type: "path",
    atmosphere: "sad",
    eyebrow: "Under the argument",
    message: "Fights are loud. The actual hurt is often quieter.",
    secondaryMessage: "What is still sitting with you?",
    choices: choices(
      choice("their-words", "What they said", "relationship-need", { path: "their-words" }),
      choice("my-words", "What I said", "relationship-need", { path: "my-words" }),
      choice("both", "Both", "relationship-need", { path: "both-words" }),
      choice("repeating", "The same issue keeps repeating", "relationship-need", { path: "repeating" }),
      choice("ending", "I'm scared this will end things", "relationship-need", { path: "fear-of-ending" }),
      choice("unknown", "I don't know", "relationship-need", { path: "unknown-hurt" })
    ),
  },
  "relationship-understand": {
    id: "relationship-understand",
    type: "pause",
    atmosphere: "sad",
    eyebrow: "Let it land",
    message: "That can leave a lot unsaid inside you.",
    secondaryMessage: "We will not rush into advice. First, what would help right now?",
    choices: choices(choice("continue", "Let me choose", "relationship-need")),
  },
  "relationship-need": {
    id: "relationship-need",
    type: "need",
    atmosphere: "sad",
    eyebrow: "Right now",
    message: "What do you need?",
    secondaryMessage: "Not forever. Just for this moment.",
    choices: choices(
      choice("understand", "Understand what happened", "relationship-perspective", { need: "understand" }),
      choice("fix", "Try to fix things", "relationship-repair", { need: "repair" }),
      choice("calm", "Calm myself first", "breathing-reset", { need: "calm" }),
      choice("space", "Take some space", "relationship-space", { need: "space" }),
      choice("pause-thinking", "Stop thinking about it for now", "action-hub", { need: "pause" }),
      choice("talk", "Talk more", "something-else-entry", { need: "talk" }),
      choice("motivation", "Get motivation", "smile-invite", { need: "motivation" }),
      choice("action", "Do something", "action-hub", { need: "action" }),
      choice("unknown", "I don't know", "breathing-reset", { need: "unknown" })
    ),
  },
  "relationship-perspective": {
    id: "relationship-perspective",
    type: "reflection",
    atmosphere: "night",
    eyebrow: "One honest lens",
    message: "Two things can be true: you can care about them and still dislike what happened.",
    secondaryMessage: "Understanding is not the same as excusing. It is how you decide your next step with clearer eyes.",
    choices: choices(
      choice("repair", "Think about repair", "relationship-repair"),
      choice("space", "Give it space", "relationship-space"),
      choice("finish", "That is enough for now", "session-checkout")
    ),
  },
  "relationship-repair": {
    id: "relationship-repair",
    type: "reflection",
    atmosphere: "calm",
    eyebrow: "Repair without a script",
    message: "A useful conversation can name the moment, your part, and what you hope changes.",
    secondaryMessage: "You still get to choose the timing. You do not have to force a resolution tonight.",
    choices: choices(
      choice("plan", "Plan one calm sentence", "action-complete", {
        action: { type: "talk", label: "Plan one calm, honest sentence", status: "started" },
      }),
      choice("calm-first", "Calm down first", "breathing-reset"),
      choice("finish", "Leave it here for now", "session-checkout")
    ),
  },
  "relationship-space": {
    id: "relationship-space",
    type: "pause",
    atmosphere: "night",
    eyebrow: "Space can be active",
    message: "A pause is not a punishment when you use it to settle and think.",
    secondaryMessage: "Choose what the space is for: rest, clarity, or preventing another hurtful round.",
    choices: choices(
      choice("move", "Move for a few minutes", "movement-energy"),
      choice("story", "Give me a tiny story", "micro-story"),
      choice("finish", "Quiet is enough", "session-checkout")
    ),
  },
  "smile-invite": {
    id: "smile-invite",
    type: "playful",
    atmosphere: "bored",
    eyebrow: "Tiny experiment",
    message: "Hey... why that face? Give me at least a tiny smile.",
    secondaryMessage: "No pressure. I can handle rejection.",
    choices: choices(
      choice("smiled", "I smiled", "smile-found", { jokeResponse: "positive", moodShift: "lighter" }),
      choice("nope", "Nope", "smile-nope", { jokeResponse: "negative" })
    ),
  },
  "smile-found": {
    id: "smile-found",
    type: "celebration",
    atmosphere: "happy",
    eyebrow: "Caught it",
    message: "There it is.",
    secondaryMessage: "Tiny counts. Especially today.",
    choices: choices(
      choice("story", "Give me a tiny story", "micro-story"),
      choice("action", "Help me do one thing", "action-hub"),
      choice("finish", "End with that", "session-checkout")
    ),
  },
  "smile-nope": {
    id: "smile-nope",
    type: "playful",
    atmosphere: "night",
    eyebrow: "Tough audience",
    message: "Okay. No forced smiles.",
    secondaryMessage: "You choose the temperature from here.",
    choices: choices(
      choice("funny", "Tell me something funny", "joke-scene"),
      choice("story", "Tiny story", "micro-story"),
      choice("surprise", "Surprise me", "random-moment"),
      choice("talk", "Let me talk", "something-else-entry"),
      choice("no-jokes", "No jokes today", "quiet-pause", { jokeResponse: "negative" })
    ),
  },
  "bored-entry": {
    id: "bored-entry",
    type: "bored",
    atmosphere: "bored",
    eyebrow: "Boredom emergency",
    message: "Oh no. We need to disturb the furniture in your brain.",
    secondaryMessage: "Pick a doorway. I will handle the weird bit.",
    choices: choices(
      choice("surprise", "Surprise me", "random-moment"),
      choice("laugh", "Make me laugh", "joke-scene"),
      choice("challenge", "60-second challenge", "bored-challenge"),
      choice("play", "Play something", "mini-decision"),
      choice("strange", "Teach me something strange", "micro-story"),
      choice("situation", "Give me a life situation", "random-moment"),
      choice("decision", "Mini decision", "mini-decision")
    ),
  },
  "bored-challenge": {
    id: "bored-challenge",
    type: "action",
    atmosphere: "excited",
    eyebrow: "One minute. Go.",
    message: "Find three objects near you that could survive in a terrible spy movie.",
    secondaryMessage: "Bonus point for giving each one a dramatic code name.",
    duration: 60,
    choices: choices(
      choice("done", "Mission complete", "action-feedback", {
        moodShift: "curious",
        action: { type: "play", label: "60-second spy-object challenge", status: "completed" },
      }),
      choice("skip", "Abort mission", "bored-entry")
    ),
  },
  "joke-scene": {
    id: "joke-scene",
    type: "story",
    atmosphere: "bored",
    eyebrow: "Unnecessary comedy break",
    message: ({ interactionHistory }) => jokes[(interactionHistory?.length || 0) % jokes.length].setup,
    secondaryMessage: ({ interactionHistory }) => jokes[(interactionHistory?.length || 0) % jokes.length].payoff,
    choices: choices(
      choice("laughed", "Okay, that got me", "smile-found", { jokeResponse: "positive", moodShift: "lighter" }),
      choice("nope", "Still not funny", "smile-nope", { jokeResponse: "negative" })
    ),
  },
  "micro-story": {
    id: "micro-story",
    type: "micro-story",
    atmosphere: "night",
    eyebrow: "A small story",
    story: ({ interactionHistory }) => microStories[(interactionHistory?.length || 0) % microStories.length],
    message: "Sometimes perspective arrives sideways.",
    choices: choices(
      choice("landed", "That landed", "action-hub"),
      choice("another", "One more", "micro-story"),
      choice("finish", "Keep that thought", "session-checkout")
    ),
  },
  "stressed-entry": {
    id: "stressed-entry",
    type: "path",
    atmosphere: "stressed",
    eyebrow: "Shrink the frame",
    message: "Everything is asking at once.",
    secondaryMessage: "We can make the next few minutes smaller.",
    choices: choices(
      choice("settle", "Settle my body", "breathing-reset", { need: "calm" }),
      choice("control", "Find what I can control", "stressed-next-step", { need: "clarity" }),
      choice("move", "Move the tension", "movement-energy", { need: "movement" }),
      choice("quiet", "No questions", "quiet-pause", { need: "quiet" })
    ),
  },
  "stressed-next-step": {
    id: "stressed-next-step",
    type: "reflection",
    atmosphere: "calm",
    eyebrow: "Only the movable piece",
    message: "Name the smallest part you can influence today.",
    secondaryMessage: "Not the whole problem. One email, one page, one conversation, one pause.",
    choices: choices(
      choice("plan", "Plan one useful step", "action-complete", {
        action: { type: "plan", label: "Choose one controllable next step", status: "started" },
      }),
      choice("rest", "Rest before deciding", "quiet-pause"),
      choice("finish", "I know my next step", "session-checkout")
    ),
  },
  "calm-entry": {
    id: "calm-entry",
    type: "reflection",
    atmosphere: "calm",
    eyebrow: "Nothing to fix",
    message: "Calm is here. Let it have some room.",
    secondaryMessage: "You can notice it, save it, or spend it on something meaningful.",
    choices: choices(
      choice("gratitude", "Notice one good thing", "moment-saved", {
        saveMoment: { kind: "gratitude", title: "A quiet thing I was grateful for." },
      }),
      choice("story", "Read a tiny story", "micro-story"),
      choice("action", "Use the calm", "action-hub"),
      choice("finish", "Just stay here", "session-checkout")
    ),
  },
  "excited-entry": {
    id: "excited-entry",
    type: "celebration",
    atmosphere: "excited",
    eyebrow: "Good energy detected",
    message: "Okay, this room has momentum.",
    secondaryMessage: "Celebrate it, share it, or point it at something you care about.",
    choices: choices(
      choice("celebrate", "Celebrate properly", "happy-preserve"),
      choice("create", "Make something", "action-complete", {
        action: { type: "create", label: "Use ten minutes to make something", status: "started" },
      }),
      choice("share", "Tell someone", "action-complete", {
        action: { type: "connect", label: "Share the good news with someone", status: "started" },
      }),
      choice("surprise", "Give me a curveball", "random-moment")
    ),
  },
  "unknown-entry": {
    id: "unknown-entry",
    type: "pause",
    atmosphere: "neutral",
    eyebrow: "Not knowing is an answer",
    message: "We do not have to label it.",
    secondaryMessage: "Choose what feels easiest to enter.",
    choices: choices(
      choice("quiet", "A quiet minute", "quiet-pause"),
      choice("body", "Check my energy", "movement-energy"),
      choice("random", "Give me something random", "random-moment"),
      choice("moods", "Show feelings again", "mood-select")
    ),
  },
  "something-else-entry": {
    id: "something-else-entry",
    type: "text",
    atmosphere: "neutral",
    eyebrow: "Your words",
    message: "Say as much or as little as you want.",
    secondaryMessage: "Your words can stay unfinished. Start wherever they are.",
    textPrompt: "What is here right now?",
    choices: [],
  },
  "custom-response": {
    id: "custom-response",
    type: "pause",
    atmosphere: "night",
    eyebrow: "I hear you",
    message: "Thank you for putting words to it.",
    secondaryMessage: "You do not need the whole answer tonight. Just the next useful step.",
    choices: choices(
      choice("action", "Find a small action", "action-hub"),
      choice("calm", "Settle first", "breathing-reset"),
      choice("story", "Give me perspective", "micro-story"),
      choice("finish", "That was enough", "session-checkout")
    ),
  },
  "support-scene": {
    id: "support-scene",
    type: "support",
    atmosphere: "support",
    eyebrow: "Pause Play Life",
    message: "Your immediate safety matters more than this game.",
    secondaryMessage: "If you may act now or are in danger, call your local emergency number or go to the nearest emergency department. Stay with someone you trust if you can.",
    choices: choices(
      choice("safe-now", "I am safe for the moment", "support-next"),
      choice("leave", "Return to MyJourney", "external-about")
    ),
  },
  "support-next": {
    id: "support-next",
    type: "support",
    atmosphere: "support",
    eyebrow: "Keep it simple",
    message: "Please reach a real person who can stay with you through this moment.",
    secondaryMessage: "A trusted person, local crisis service, emergency service, or healthcare professional can help with the next step. Play Life is not emergency support.",
    choices: choices(choice("finish", "End this session", "session-checkout")),
  },
  "breathing-reset": {
    id: "breathing-reset",
    type: "action",
    atmosphere: "calm",
    eyebrow: "Thirty quiet seconds",
    message: "Let your shoulders drop before you ask your mind for answers.",
    secondaryMessage: "Breathe normally. Follow the light only if it feels comfortable.",
    duration: 30,
    breath: true,
    choices: choices(
      choice("done", "I am ready", "action-feedback", {
        moodShift: "settled",
        action: { type: "relax", label: "30-second breathing reset", status: "completed" },
      }),
      choice("skip", "Skip this", "action-hub")
    ),
  },
  "quiet-pause": {
    id: "quiet-pause",
    type: "pause",
    atmosphere: "night",
    eyebrow: "No performance needed",
    message: "Deal. No questions.",
    secondaryMessage: "Stay for one breath, then leave whenever you want.",
    choices: choices(
      choice("continue", "One small thing", "action-hub"),
      choice("finish", "I am done for now", "session-checkout")
    ),
  },
  "action-hub": {
    id: "action-hub",
    type: "action-hub",
    atmosphere: "neutral",
    eyebrow: "Change the texture of the moment",
    message: "What might help now?",
    secondaryMessage: "Choose by energy, not by what sounds impressive.",
    choices: choices(
      choice("move", "Move", "movement-energy"),
      choice("eat", "Eat", "food-reason"),
      choice("talk", "Talk", "action-complete", { action: { type: "talk", label: "Reach out to someone safe", status: "started" } }),
      choice("relax", "Relax", "breathing-reset"),
      choice("laugh", "Laugh", "joke-scene"),
      choice("learn", "Learn", "micro-story"),
      choice("create", "Create", "action-complete", { action: { type: "create", label: "Create something small for ten minutes", status: "started" } }),
      choice("play", "Play", "bored-challenge"),
      choice("think", "Think", "think-moment"),
      choice("plan", "Plan", "action-complete", { action: { type: "plan", label: "Write the next useful step", status: "started" } }),
      choice("rest", "Rest", "action-complete", { action: { type: "rest", label: "Take a real ten-minute pause", status: "started" } }),
      choice("journal", "Journal", "action-complete", { action: { type: "journal", label: "Write three honest lines", status: "started" } }),
      choice("surprise", "Surprise me", "random-moment")
    ),
  },
  "think-moment": {
    id: "think-moment",
    type: "reflection",
    atmosphere: "night",
    eyebrow: "Clear one patch of ground",
    message: "Put the situation into one honest sentence.",
    secondaryMessage: "Then ask: what is true, what am I assuming, and what can I influence?",
    choices: choices(
      choice("plan", "I found a next step", "action-complete", {
        action: { type: "think", label: "Separate facts, assumptions, and control", status: "started" },
      }),
      choice("quiet", "Let it sit", "quiet-pause"),
      choice("finish", "That is enough", "session-checkout")
    ),
  },
  "movement-energy": {
    id: "movement-energy",
    type: "energy",
    atmosphere: "calm",
    eyebrow: "Meet your body where it is",
    message: "How much energy is actually available?",
    secondaryMessage: "Low is not a wrong answer.",
    choices: choices(
      choice("low", "Low", "movement-plan", { energy: "low" }),
      choice("medium", "Medium", "movement-plan", { energy: "medium" }),
      choice("high", "High", "movement-plan", { energy: "high" })
    ),
  },
  "movement-plan": {
    id: "movement-plan",
    type: "action",
    atmosphere: "excited",
    eyebrow: "Move",
    message: ({ energy }) => movementPlans[energy || "low"].title,
    secondaryMessage: "Nothing heroic. Just enough motion to change the moment.",
    actionPlan: ({ energy }) => movementPlans[energy || "low"],
    duration: ({ energy }) => movementPlans[energy || "low"].duration,
    choices: choices(
      choice("done", "Done", "action-feedback", {
        moodShift: "lighter",
        dynamicAction: "movement",
      }),
      choice("later", "Not now", "action-hub")
    ),
  },
  "food-reason": {
    id: "food-reason",
    type: "path",
    atmosphere: "happy",
    eyebrow: "Food, when food is actually the need",
    message: "What makes eating sound helpful?",
    secondaryMessage: "A feeling does not automatically mean food.",
    choices: choices(
      choice("hungry", "I am hungry", "food-preference", { path: "hungry" }),
      choice("missed-meal", "I haven't eaten", "food-preference", { path: "missed-meal" }),
      choice("cook", "I want to cook", "food-preference", { path: "cook" }),
      choice("healthy", "I want something healthy", "food-preference", { path: "healthy" }),
      choice("helpful", "Eating sounds helpful", "food-preference", { path: "food-helpful" }),
      choice("not-food", "Actually, not food", "action-hub")
    ),
  },
  "food-preference": {
    id: "food-preference",
    type: "need",
    atmosphere: "happy",
    eyebrow: "Keep it realistic",
    message: "What sounds possible?",
    secondaryMessage: "Simple ingredients. No wellness performance.",
    choices: choices(
      choice("light", "Light", "recipe-result", { foodPreference: "light" }),
      choice("filling", "Filling", "recipe-result", { foodPreference: "warm" }),
      choice("warm", "Warm", "recipe-result", { foodPreference: "warm" }),
      choice("quick", "Quick", "recipe-result", { foodPreference: "quick" }),
      choice("protein", "High protein", "recipe-result", { foodPreference: "protein" }),
      choice("sweet", "Something sweet", "recipe-result", { foodPreference: "sweet" }),
      choice("crunchy", "Something crunchy", "recipe-result", { foodPreference: "crunchy" }),
      choice("surprise", "Surprise me", "recipe-result", { foodPreference: "quick" })
    ),
  },
  "recipe-result": {
    id: "recipe-result",
    type: "recipe",
    atmosphere: "happy",
    eyebrow: "A practical option",
    message: ({ foodPreference }) => {
      const recipe = recipes.find((item) => item.preference === foodPreference) || recipes[0];
      return recipe.title;
    },
    secondaryMessage: ({ foodPreference }) => {
      const recipe = recipes.find((item) => item.preference === foodPreference) || recipes[0];
      return `${recipe.time}. ${recipe.note}`;
    },
    choices: choices(
      choice("make-it", "That works", "action-complete", {
        dynamicAction: "food",
      }),
      choice("another", "Choose another", "food-preference"),
      choice("skip", "Not today", "action-hub")
    ),
  },
  "action-complete": {
    id: "action-complete",
    type: "action",
    atmosphere: "calm",
    eyebrow: "Bring it into real life",
    message: "Keep it small enough to begin.",
    secondaryMessage: "The next useful step beats the perfect plan.",
    choices: choices(
      choice("done", "I did it", "action-feedback", { completeLatestAction: true }),
      choice("later", "I will do it later", "session-checkout")
    ),
  },
  "action-feedback": {
    id: "action-feedback",
    type: "feedback",
    atmosphere: "calm",
    eyebrow: "A small feedback loop",
    message: "Did that help?",
    secondaryMessage: "No need to give the action a good review.",
    choices: choices(
      choice("yes", "Yes", "post-feedback", { feedback: "yes", moodShift: "better" }),
      choice("little", "A little", "post-feedback", { feedback: "a-little", moodShift: "lighter" }),
      choice("no", "No", "post-feedback", { feedback: "no" }),
      choice("unsure", "Not sure", "post-feedback", { feedback: "not-sure" })
    ),
  },
  "post-feedback": {
    id: "post-feedback",
    type: "pause",
    atmosphere: "calm",
    eyebrow: "Useful information, not a verdict",
    message: "Noted.",
    secondaryMessage: "Over time, your own reports can help MyJourney notice what tends to be useful without pretending to know more than you do.",
    choices: choices(
      choice("more", "Try something else", "action-hub"),
      choice("finish", "Finish for now", "session-checkout")
    ),
  },
  "moment-saved": {
    id: "moment-saved",
    type: "celebration",
    atmosphere: "happy",
    eyebrow: "Remember this moment",
    message: "Saved for your journey.",
    secondaryMessage: "Small moments are still part of a life.",
    choices: choices(
      choice("continue", "Keep playing", "random-moment"),
      choice("finish", "Leave it here", "session-checkout")
    ),
  },
  "random-moment": {
    id: "random-moment",
    type: "scenario",
    atmosphere: "neutral",
    eyebrow: "A life moment appears",
    message: randomMoments[0].title,
    secondaryMessage: randomMoments[0].prompt,
    scenario: randomMoments[0],
    choices: randomMoments[0].choices.map((item) =>
      choice(item.id, item.label, "scenario-outcome", { scenarioPerspective: item.perspective, moodShift: "curious" })
    ),
  },
  "mini-decision": {
    id: "mini-decision",
    type: "scenario",
    atmosphere: "bored",
    eyebrow: "No correct answer",
    message: "You find an unmarked envelope with enough money to change your month.",
    secondaryMessage: "A name and phone number are written faintly inside.",
    choices: choices(
      choice("call", "Call the number", "scenario-outcome", { scenarioPerspective: "You value returning control to the person who lost it, even before knowing the outcome.", moodShift: "curious" }),
      choice("wait", "Keep it safe and think", "scenario-outcome", { scenarioPerspective: "You slow the decision down. Caution can be a value, not just hesitation.", moodShift: "curious" }),
      choice("use", "Use what I need", "scenario-outcome", { scenarioPerspective: "Need can make choices feel different. The phone number still leaves a consequence you would have to carry.", moodShift: "curious" })
    ),
  },
  "scenario-outcome": {
    id: "scenario-outcome",
    type: "reflection",
    atmosphere: "calm",
    eyebrow: "A consequence, not a score",
    message: ({ scenarioPerspective }) => scenarioPerspective || "Your choice changes what happens next, and what you learn about yourself.",
    secondaryMessage: "Life rarely stamps an answer correct or wrong. Values, timing, and consequences all matter.",
    choices: choices(
      choice("again", "Another moment", "random-moment"),
      choice("real", "Turn this into a real action", "action-hub"),
      choice("finish", "Leave the story here", "session-checkout")
    ),
  },
  "mood-generic": {
    id: "mood-generic",
    type: "path",
    atmosphere: ({ currentMood }) => currentMood?.atmosphere || "neutral",
    eyebrow: "Start where you are",
    message: ({ currentMood }) => moodGuidance[currentMood?.id]?.message || "This moment does not need a perfect label.",
    secondaryMessage: ({ currentMood }) => moodGuidance[currentMood?.id]?.secondaryMessage || "We can still find one useful next step.",
    choices: choices(
      choice("action", "One useful step", "action-hub"),
      choice("settle", "Settle first", "breathing-reset"),
      choice("story", "A tiny story", "micro-story"),
      choice("move", "Move", "movement-energy"),
      choice("finish", "Just check in", "session-checkout")
    ),
  },
  "session-checkout": {
    id: "session-checkout",
    type: "checkout",
    atmosphere: "dawn",
    eyebrow: "Before you go",
    message: ({ session }) => `You started today feeling ${session?.startingMood?.label || "something"}.`,
    secondaryMessage: "How are you leaving?",
    choices: choices(
      choice("same", "Still the same", "session-summary", { endingMood: "same" }),
      choice("little", "A little better", "session-summary", { endingMood: "a-little-better" }),
      choice("much", "Much better", "session-summary", { endingMood: "much-better" }),
      choice("different", "Different", "session-summary", { endingMood: "different" }),
      choice("worse", "Worse", "session-summary", { endingMood: "worse" })
    ),
  },
  "session-summary": {
    id: "session-summary",
    type: "summary",
    atmosphere: "night",
    eyebrow: "This session can end here",
    message: ({ session }) => session?.endingMood === "a-little-better"
      ? "I'll take a little better."
      : session?.endingMood === "worse"
        ? "Thank you for being honest. Do not carry a worse moment alone if you need support."
        : "You checked in. That counts.",
    secondaryMessage: ({ session }) => session?.endingMood === "a-little-better"
      ? "Not every day needs a perfect ending."
      : "Your journey stays here for next time.",
    choices: choices(
      choice("again", "Start another moment", "mood-select", { restartSession: true }),
      choice("about", "Return to About Me", "external-about")
    ),
  },
  "safe-fallback": {
    id: "safe-fallback",
    type: "pause",
    atmosphere: "neutral",
    eyebrow: "The path shifted",
    message: "That moment is not available, but your journey is still here.",
    secondaryMessage: "Choose a new place to continue.",
    choices: choices(
      choice("moods", "Choose a mood", "mood-select"),
      choice("actions", "Choose an action", "action-hub"),
      choice("finish", "Finish", "session-checkout")
    ),
  },
};

module.exports = { scenes };
