const moods = [
  { id: "happy", label: "Happy", emoji: "😄", atmosphere: "happy", primary: true },
  { id: "sad", label: "Sad", emoji: "😔", atmosphere: "sad", primary: true },
  { id: "bored", label: "Bored", emoji: "🥱", atmosphere: "bored", primary: true },
  { id: "stressed", label: "Stressed", emoji: "😫", atmosphere: "stressed", primary: true },
  { id: "calm", label: "Calm", emoji: "😌", atmosphere: "calm", primary: true },
  { id: "excited", label: "Excited", emoji: "🤩", atmosphere: "excited", primary: true },
  { id: "low", label: "Feeling low", emoji: "", atmosphere: "sad" },
  { id: "angry", label: "Angry", emoji: "", atmosphere: "stressed" },
  { id: "lonely", label: "Lonely", emoji: "", atmosphere: "night" },
  { id: "tired", label: "Tired", emoji: "", atmosphere: "night" },
  { id: "confused", label: "Confused", emoji: "", atmosphere: "neutral" },
  { id: "motivated", label: "Motivated", emoji: "", atmosphere: "excited" },
  { id: "hopeful", label: "Hopeful", emoji: "", atmosphere: "happy" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "", atmosphere: "stressed" },
  { id: "normal", label: "Just normal", emoji: "🙂", atmosphere: "neutral" },
  { id: "unknown", label: "I don't know", emoji: "🤷", atmosphere: "neutral" },
  { id: "something-else", label: "Something else", emoji: "", atmosphere: "neutral" },
];

const moodSceneMap = {
  happy: "happy-entry",
  sad: "sad-entry",
  bored: "bored-entry",
  stressed: "stressed-entry",
  calm: "calm-entry",
  excited: "excited-entry",
  unknown: "unknown-entry",
  "something-else": "something-else-entry",
};

const moodGuidance = {
  low: {
    message: "Low days can make every step feel heavier.",
    secondaryMessage: "We do not need to solve the whole day. Just find one kind next move.",
  },
  angry: {
    message: "There is some heat here.",
    secondaryMessage: "Let us give it room without letting it drive.",
  },
  lonely: {
    message: "Lonely can feel loud, even in a crowded room.",
    secondaryMessage: "We can look for one honest point of connection.",
  },
  tired: {
    message: "You sound spent.",
    secondaryMessage: "Rest is allowed to be the useful next step.",
  },
  confused: {
    message: "Too many threads at once?",
    secondaryMessage: "We can pick up one thread. The rest can wait.",
  },
  motivated: {
    message: "Good. There is energy in the room.",
    secondaryMessage: "Let us point it somewhere that matters.",
  },
  hopeful: {
    message: "Hope is here. Quiet, but real.",
    secondaryMessage: "What would help you protect it today?",
  },
  overwhelmed: {
    message: "Everything is arriving at the same time.",
    secondaryMessage: "We only need to make the next five minutes manageable.",
  },
  normal: {
    message: "A regular day. No dramatic soundtrack required.",
    secondaryMessage: "Ordinary moments still have room for something good.",
  },
};

const jokes = [
  {
    id: "calendar",
    setup: "My calendar said I had free time today.",
    payoff: "So naturally, I scheduled a meeting to discuss it.",
  },
  {
    id: "brain-tabs",
    setup: "My brain has 47 tabs open.",
    payoff: "Three are frozen, and I cannot find where the music is coming from.",
  },
  {
    id: "snack",
    setup: "I opened the fridge for inspiration.",
    payoff: "The fridge said, 'We just did this five minutes ago.'",
  },
];

const microStories = [
  {
    id: "glasses",
    tone: "playful",
    lines: [
      "A man searched the whole house for his glasses.",
      "Bedroom. Kitchen. Even the fridge.",
      "His wife finally started laughing.",
      "They had been on his head the whole time.",
    ],
  },
  {
    id: "bus-stop",
    tone: "quiet",
    lines: [
      "A woman missed her usual bus by ten seconds.",
      "Annoyed, she took the next one.",
      "There she met the person who later offered her first job.",
      "A bad ten seconds. Not a bad life.",
    ],
  },
  {
    id: "seed",
    tone: "gentle",
    lines: [
      "For weeks, the soil looked unchanged.",
      "Underneath, a seed was building roots.",
      "Nothing visible did not mean nothing was happening.",
    ],
  },
];

const recipes = [
  {
    id: "poha",
    title: "Vegetable poha",
    preference: "quick",
    time: "15 min",
    note: "Poha, onion, peas or any vegetables you have, lemon, and peanuts if available.",
  },
  {
    id: "khichdi",
    title: "Simple dal khichdi",
    preference: "warm",
    time: "30 min",
    note: "Rice, dal, turmeric, and vegetables in one comforting pot.",
  },
  {
    id: "egg-roti",
    title: "Egg bhurji with roti",
    preference: "protein",
    time: "15 min",
    note: "Eggs, onion, tomato, and spices with roti or toast.",
  },
  {
    id: "curd-rice",
    title: "Curd rice with vegetables",
    preference: "light",
    time: "10 min",
    note: "Cooked rice, curd, cucumber or carrot, and a little seasoning.",
  },
  {
    id: "banana-oats",
    title: "Banana oats bowl",
    preference: "sweet",
    time: "8 min",
    note: "Oats, banana, milk or water, with nuts if you have them.",
  },
  {
    id: "roasted-chana",
    title: "Roasted chana mix",
    preference: "crunchy",
    time: "5 min",
    note: "Roasted chana, chopped onion, tomato, lemon, and a pinch of spice.",
  },
];

const movementPlans = {
  low: {
    title: "Loosen the day",
    duration: 120,
    steps: ["Roll your shoulders slowly", "Reach up without straining", "Walk to the nearest window and back"],
  },
  medium: {
    title: "Five-minute reset walk",
    duration: 300,
    steps: ["Stand and take one full breath", "Walk at an easy, steady pace", "Notice three things you usually miss"],
  },
  high: {
    title: "Move the energy",
    duration: 300,
    steps: ["20 bodyweight squats", "20 seconds of fast feet", "Rest, then repeat once if it feels good"],
  },
};

const randomMoments = [
  {
    id: "old-message",
    title: "A message from the past",
    prompt: "Someone you once knew well sends: 'Hey. I was thinking about you.'",
    choices: [
      { id: "reply-now", label: "Reply now", perspective: "You choose openness, knowing it may restart an unfinished conversation." },
      { id: "wait", label: "Wait before replying", perspective: "You make space to decide what contact means to you now." },
      { id: "leave-it", label: "Leave it unopened", perspective: "A boundary can be a decision, even when nobody applauds it." },
    ],
  },
];

module.exports = {
  jokes,
  microStories,
  moodGuidance,
  moodSceneMap,
  moods,
  movementPlans,
  randomMoments,
  recipes,
};
