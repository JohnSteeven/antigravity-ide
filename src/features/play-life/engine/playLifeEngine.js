const { moods, moodSceneMap, movementPlans, recipes } = require("../content/catalogs");
const { scenes } = require("../content/scenes");
const { assessSafety } = require("../safety/safety");

const STATE_VERSION = 1;

const timestamp = () => new Date().toISOString();
const createId = (prefix = "pl") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createInitialState = (user = {}) => {
  const now = timestamp();
  return {
    version: STATE_VERSION,
    user: {
      id: user.id || null,
      displayName: user.displayName || "there",
      lifeStage: user.lifeStage || null,
    },
    journey: {
      startedAt: now,
      sessionCount: 1,
    },
    currentMood: null,
    previousMood: null,
    moodHistory: [],
    currentSceneId: "intro",
    currentMoment: "arrival",
    currentPath: [],
    currentNeed: null,
    energy: null,
    tone: "balanced",
    foodPreference: null,
    moodShift: null,
    scenarioPerspective: null,
    session: {
      id: createId("session"),
      startedAt: now,
      startingMood: null,
      endingMood: null,
      completedAt: null,
    },
    choices: [],
    actionsTaken: [],
    actionFeedback: [],
    savedMoments: [],
    preferences: {
      tone: "balanced",
      jokeAffinity: 0,
      reducedMotion: false,
    },
    soundSettings: {
      music: true,
      ambient: true,
      volume: 0.65,
    },
    interactionHistory: [],
    safetyLevel: "normal",
    lastUpdatedAt: now,
  };
};

const resolveValue = (value, state) => (typeof value === "function" ? value(state) : value);

const getScene = (state) => {
  const source = scenes[state?.currentSceneId] || scenes["safe-fallback"];
  const resolved = {
    ...source,
    atmosphere: resolveValue(source.atmosphere, state) || "neutral",
    message: resolveValue(source.message, state) || "Take a breath. The next moment is still here.",
    secondaryMessage: resolveValue(source.secondaryMessage, state) || "",
    story: resolveValue(source.story, state) || null,
    actionPlan: resolveValue(source.actionPlan, state) || null,
    duration: Number(resolveValue(source.duration, state) || 0),
    choices: Array.isArray(source.choices) ? source.choices : [],
  };
  return resolved;
};

const moodById = (moodId) => moods.find((mood) => mood.id === moodId) || moods.find((mood) => mood.id === "unknown");

const withMood = (state, mood, source = "selection") => {
  const now = timestamp();
  const nextMood = typeof mood === "string" ? moodById(mood) : mood;
  const firstMood = state.session.startingMood || nextMood;
  return {
    ...state,
    previousMood: state.currentMood,
    currentMood: nextMood,
    moodHistory: [...state.moodHistory, { ...nextMood, at: now, source }],
    session: { ...state.session, startingMood: firstMood },
    lastUpdatedAt: now,
  };
};

const selectMood = (state, moodId, options = {}) => {
  const nextMood = moodById(moodId);
  const updated = withMood(state, nextMood, options.source || "selection");
  const sceneId = moodSceneMap[moodId] || "mood-generic";
  return {
    ...updated,
    currentSceneId: options.preserveScene ? state.currentSceneId : sceneId,
    currentMoment: "mood",
    interactionHistory: [
      ...state.interactionHistory,
      { id: createId("interaction"), type: "mood-change", moodId, at: timestamp() },
    ],
  };
};

const startAction = (state, action) => {
  const item = {
    id: createId("action"),
    type: action.type,
    label: action.label,
    status: action.status || "started",
    at: timestamp(),
  };
  return { ...state, actionsTaken: [...state.actionsTaken, item] };
};

const completeLatestAction = (state) => {
  if (!state.actionsTaken.length) return state;
  const actionsTaken = state.actionsTaken.map((action, index) =>
    index === state.actionsTaken.length - 1
      ? { ...action, status: "completed", completedAt: timestamp() }
      : action
  );
  return { ...state, actionsTaken };
};

const dynamicAction = (state, type) => {
  if (type === "movement") {
    const plan = movementPlans[state.energy || "low"];
    return { type: "move", label: plan.title, status: "completed" };
  }
  if (type === "food") {
    const recipe = recipes.find((item) => item.preference === state.foodPreference) || recipes[0];
    return { type: "eat", label: `Prepare ${recipe.title}`, status: "started" };
  }
  return null;
};

const applyChoice = (state, choiceId) => {
  const scene = getScene(state);
  const selected = scene.choices.find((item) => item.id === choiceId);
  if (!selected) {
    return { ...state, currentSceneId: "safe-fallback", lastUpdatedAt: timestamp() };
  }

  const effect = selected.effect || {};
  const now = timestamp();
  let next = {
    ...state,
    currentSceneId: selected.next || "safe-fallback",
    currentMoment: scene.type,
    choices: [...state.choices, { sceneId: scene.id, choiceId, at: now }],
    interactionHistory: [
      ...state.interactionHistory,
      { id: createId("interaction"), type: "choice", sceneId: scene.id, choiceId, at: now },
    ],
    lastUpdatedAt: now,
  };

  if (effect.path) next.currentPath = [...next.currentPath, effect.path];
  if (effect.need) next.currentNeed = effect.need;
  if (effect.energy) next.energy = effect.energy;
  if (effect.foodPreference) next.foodPreference = effect.foodPreference;
  if (effect.moodShift) next.moodShift = effect.moodShift;
  if (effect.scenarioPerspective) next.scenarioPerspective = effect.scenarioPerspective;

  if (effect.jokeResponse) {
    const adjustment = effect.jokeResponse === "positive" ? 1 : -1;
    next.preferences = {
      ...next.preferences,
      jokeAffinity: Math.max(-3, Math.min(3, next.preferences.jokeAffinity + adjustment)),
    };
  }

  if (effect.saveMoment) {
    next.savedMoments = [
      ...next.savedMoments,
      { id: createId("moment"), ...effect.saveMoment, at: now, mood: next.currentMood?.id || null },
    ];
  }

  if (effect.action) next = startAction(next, effect.action);
  if (effect.dynamicAction) {
    const action = dynamicAction(next, effect.dynamicAction);
    if (action) next = startAction(next, action);
  }
  if (effect.completeLatestAction) next = completeLatestAction(next);

  if (effect.feedback) {
    const latestAction = next.actionsTaken[next.actionsTaken.length - 1] || null;
    next.actionFeedback = [
      ...next.actionFeedback,
      { id: createId("feedback"), actionId: latestAction?.id || null, value: effect.feedback, at: now },
    ];
  }

  if (effect.endingMood) {
    next.session = {
      ...next.session,
      endingMood: effect.endingMood,
      completedAt: now,
    };
  }

  if (effect.restartSession) {
    next = restartSession(next);
  }

  return next;
};

const restartSession = (state) => {
  const now = timestamp();
  return {
    ...state,
    currentSceneId: "mood-select",
    currentMoment: "mood",
    currentMood: null,
    previousMood: state.currentMood,
    currentPath: [],
    currentNeed: null,
    energy: null,
    foodPreference: null,
    moodShift: null,
    scenarioPerspective: null,
    journey: { ...state.journey, sessionCount: state.journey.sessionCount + 1 },
    session: {
      id: createId("session"),
      startedAt: now,
      startingMood: null,
      endingMood: null,
      completedAt: null,
    },
    lastUpdatedAt: now,
  };
};

const submitText = (state, text) => {
  const safety = assessSafety(text);
  const now = timestamp();
  return {
    ...state,
    currentSceneId: safety.level === "urgent" ? "support-scene" : "custom-response",
    safetyLevel: safety.level,
    interactionHistory: [
      ...state.interactionHistory,
      { id: createId("interaction"), type: "private-text-submitted", safetyLevel: safety.level, at: now },
    ],
    lastUpdatedAt: now,
  };
};

const updateSound = (state, patch) => ({
  ...state,
  soundSettings: { ...state.soundSettings, ...patch },
  lastUpdatedAt: timestamp(),
});

const updateUser = (state, user = {}) => ({
  ...state,
  user: {
    ...state.user,
    id: user.id || state.user.id,
    displayName: user.displayName || state.user.displayName,
  },
});

const getMotionProfile = (reduceMotion) => ({
  duration: reduceMotion ? 0 : 0.55,
  distance: reduceMotion ? 0 : 18,
});

module.exports = {
  STATE_VERSION,
  applyChoice,
  createInitialState,
  getMotionProfile,
  getScene,
  restartSession,
  selectMood,
  submitText,
  updateSound,
  updateUser,
};
