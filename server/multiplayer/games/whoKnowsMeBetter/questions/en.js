const VERSION = 1;

const CATEGORY_SEEDS = {
  everyday: [
    ["ideal-morning", "My ideal slow morning starts with...", ["Coffee and quiet", "Music and movement", "A long breakfast", "Sleeping in"]],
    ["late-snack", "My go-to late-night snack is...", ["Something sweet", "Something salty", "Fruit", "Whatever is nearby"]],
    ["weekend", "A perfect free Saturday looks like...", ["Out exploring", "Home recharging", "Meeting friends", "Learning something new"]],
    ["weather", "The weather that lifts my mood most is...", ["Bright sunshine", "Gentle rain", "Cold and crisp", "Cloudy and calm"]],
    ["message", "I am most likely to reply fastest to...", ["A funny meme", "A thoughtful question", "An urgent plan", "A voice note"]],
  ],
  comfort: [
    ["comfort-watch", "When I need comfort, I would rather watch...", ["A familiar comedy", "A gripping thriller", "A warm drama", "A documentary"]],
    ["reset-place", "My favorite place to reset is...", ["Somewhere in nature", "My own room", "A busy cafe", "A place of worship"]],
    ["bad-day", "After a difficult day, I usually want...", ["Space alone", "Someone to listen", "A distraction", "A practical plan"]],
    ["comfort-food", "My comfort food is usually...", ["Homemade", "Spicy", "Sweet", "Fast and familiar"]],
    ["quiet", "The kind of quiet I enjoy most is...", ["Early morning", "Late at night", "During travel", "I rarely enjoy quiet"]],
  ],
  dreams: [
    ["dream-skill", "If I could instantly master one kind of skill, it would be...", ["Creative", "Technical", "Social", "Physical"]],
    ["year-off", "With a completely free year, I would mostly...", ["Travel", "Build something", "Study deeply", "Rest and reconnect"]],
    ["future-home", "My dream home would be closest to...", ["A lively city", "The ocean", "Mountains or forest", "Family and friends"]],
    ["legacy", "I most want to be remembered for...", ["Kindness", "Courage", "Creativity", "Wisdom"]],
    ["big-win", "A major personal win would feel best if it brought...", ["Freedom", "Recognition", "Security", "Impact"]],
  ],
  friendship: [
    ["friendship-love", "I feel most cared for when a friend...", ["Checks in", "Makes time", "Helps practically", "Makes me laugh"]],
    ["group-role", "In a friend group, I am usually the...", ["Planner", "Listener", "Comedian", "Adventurer"]],
    ["conflict", "When tension appears, I tend to...", ["Talk immediately", "Take time first", "Use humor", "Focus on a solution"]],
    ["surprise", "The surprise I would appreciate most is...", ["A handwritten note", "A planned outing", "A useful gift", "A favorite meal"]],
    ["trust", "What builds trust with me fastest?", ["Consistency", "Honesty", "Kindness", "Shared experiences"]],
  ],
  personality: [
    ["decision", "For a big decision, I rely most on...", ["Facts", "Instinct", "Trusted advice", "Time to reflect"]],
    ["energy", "I regain energy best by...", ["Being alone", "Seeing close friends", "Doing something active", "Changing scenery"]],
    ["risk", "My relationship with risk is...", ["Careful", "Calculated", "Spontaneous", "It depends entirely"]],
    ["compliment", "The compliment that means most to me is about my...", ["Character", "Work", "Style", "Growth"]],
    ["plan-change", "When plans change suddenly, I usually...", ["Adapt quickly", "Need a moment", "Take charge", "Feel relieved"]],
  ],
  memories: [
    ["photo", "The photos I treasure most usually capture...", ["People", "Places", "Milestones", "Ordinary moments"]],
    ["school", "At school, I was most likely known for...", ["Good grades", "Making people laugh", "Creative work", "Being dependable"]],
    ["nostalgia", "What triggers nostalgia for me fastest?", ["Music", "Food", "A place", "An old message"]],
    ["souvenir", "I am most likely to keep...", ["Tickets and notes", "Photos only", "A practical souvenir", "Almost nothing"]],
    ["celebration", "My favorite celebrations are...", ["Small and personal", "Big and lively", "Spontaneous", "Tradition-filled"]],
  ],
  choices: [
    ["trip", "For a short trip, I would pick...", ["Beach", "Mountains", "Historic city", "Countryside"]],
    ["gift", "I would rather receive...", ["An experience", "Something handmade", "Something useful", "A total surprise"]],
    ["evening", "Choose my ideal evening plan...", ["Dinner out", "Movie at home", "A long walk", "Games with friends"]],
    ["learn", "I learn best by...", ["Trying it", "Reading", "Watching", "Talking it through"]],
    ["extra-hour", "With one extra hour today, I would...", ["Rest", "Call someone", "Create something", "Finish a task"]],
  ],
  motivation: [
    ["momentum", "What gets me moving when I feel stuck?", ["A tiny first step", "A deadline", "Encouragement", "A fresh environment"]],
    ["challenge", "A challenge feels worthwhile when it...", ["Teaches me", "Helps someone", "Tests my courage", "Creates opportunity"]],
    ["feedback", "I prefer feedback that is...", ["Direct", "Gentle", "Detailed", "Focused on next steps"]],
    ["progress", "I notice progress most through...", ["Visible results", "Daily habits", "Other people's feedback", "How I feel"]],
    ["focus", "I focus best with...", ["Complete silence", "Background music", "A little pressure", "Someone alongside me"]],
  ],
  playful: [
    ["superpower", "My most useful imaginary superpower would be...", ["Teleportation", "Mind reading", "Time control", "Perfect memory"]],
    ["karaoke", "At karaoke, I am most likely to...", ["Sing loudly", "Join the chorus", "Cheer everyone on", "Avoid the microphone"]],
    ["competition", "During a friendly competition, I become...", ["Very strategic", "Playfully dramatic", "Calm and steady", "Mostly social"]],
    ["fiction", "I would rather live for a week in a...", ["Fantasy world", "Sci-fi future", "Mystery story", "Cozy comedy"]],
    ["unexpected", "Which harmless chaos sounds most like me?", ["Missing an exit", "Overpacking", "Changing the plan", "Starting too many ideas"]],
  ],
  values: [
    ["respect", "I feel most respected when people...", ["Keep their word", "Hear me fully", "Give me autonomy", "Recognize my effort"]],
    ["success", "Success feels most real to me when I have...", ["Freedom", "Helped others", "Built mastery", "Created stability"]],
    ["hard-choice", "In a hard choice, I protect first...", ["People", "Principles", "Long-term goals", "Peace of mind"]],
    ["admire", "I admire people most for their...", ["Integrity", "Resilience", "Curiosity", "Generosity"]],
    ["meaning", "A meaningful life needs plenty of...", ["Love", "Purpose", "Growth", "Wonder"]],
  ],
  favorites: [
    ["sound", "Which sound would I choose right now?", ["Ocean waves", "Rain", "A busy street", "A favorite song"]],
    ["meal", "For a celebratory meal, I prefer...", ["A favorite classic", "Something new", "Home cooking", "A shared feast"]],
    ["story", "The stories that stay with me are usually...", ["Hopeful", "Funny", "Intense", "Thought-provoking"]],
    ["season", "My favorite kind of season is...", ["Fresh spring", "Bright summer", "Cozy autumn", "Cool winter"]],
    ["keepsake", "I would value this keepsake most...", ["A letter", "A photograph", "A book", "A handmade object"]],
  ],
  growth: [
    ["lesson", "A lesson I value more with time is...", ["Patience", "Boundaries", "Consistency", "Asking for help"]],
    ["bravery", "Being brave most often means...", ["Speaking honestly", "Trying again", "Walking away", "Beginning before ready"]],
    ["mistake", "After a mistake, my healthiest next move is...", ["Own it", "Understand it", "Repair it", "Try differently"]],
    ["change", "When life changes, I look first for...", ["A new routine", "People I trust", "The opportunity", "Time to process"]],
    ["future-self", "My future self would thank me most for...", ["Taking care of health", "Staying curious", "Saving wisely", "Choosing good people"]],
  ],
  connection: [
    ["conversation", "The conversation I enjoy most goes...", ["Deep", "Funny", "Imaginative", "Practical"]],
    ["remember", "I am touched when someone remembers...", ["Small details", "Important dates", "My preferences", "What I was worried about"]],
    ["together", "Quality time feels best when we...", ["Talk", "Make something", "Explore", "Simply share space"]],
    ["welcome", "I make people feel welcome by...", ["Asking questions", "Offering food", "Including them", "Keeping things relaxed"]],
    ["distance", "To stay close across distance, I prefer...", ["Quick messages", "Long calls", "Shared plans", "Sending little updates"]],
  ],
};

const questions = Object.entries(CATEGORY_SEEDS).flatMap(([category, seeds]) =>
  seeds.map(([slug, prompt, choices]) => ({
    id: `wkm-${VERSION}-${category}-${slug}`,
    version: VERSION,
    locale: "en",
    category,
    prompt,
    choices: choices.map((label, index) => ({ id: `${index + 1}`, label })),
    active: true,
  }))
);

module.exports = { locale: "en", questions, version: VERSION };
