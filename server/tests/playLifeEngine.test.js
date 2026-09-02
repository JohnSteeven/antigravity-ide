const engine = require("../../src/features/play-life/engine/playLifeEngine");
const persistence = require("../../src/features/play-life/state/persistence");

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe("Play Life scene engine", () => {
  test("mood changes preserve the active journey and session", () => {
    const initial = engine.createInitialState({ id: "reader-1", displayName: "Noble" });
    const sad = engine.selectMood(initial, "sad");
    const progressed = engine.applyChoice(sad, "relationship");
    const changed = engine.selectMood(progressed, "happy", { source: "mood-control" });

    expect(changed.session.id).toBe(initial.session.id);
    expect(changed.currentPath).toContain("relationship");
    expect(changed.previousMood.id).toBe("sad");
    expect(changed.currentMood.id).toBe("happy");
    expect(changed.moodHistory).toHaveLength(2);
  });

  test("the Sad path never locks the user into a Sad route", () => {
    const sad = engine.selectMood(engine.createInitialState(), "sad");
    const relationship = engine.applyChoice(sad, "relationship");
    const calm = engine.selectMood(relationship, "calm", { source: "mood-control" });

    expect(calm.currentSceneId).toBe("calm-entry");
    expect(calm.currentMood.id).toBe("calm");
    expect(calm.currentPath).toEqual(["relationship"]);
  });

  test("the Bored challenge can move the emotional state toward curiosity", () => {
    const bored = engine.selectMood(engine.createInitialState(), "bored");
    const challenge = engine.applyChoice(bored, "challenge");
    const completed = engine.applyChoice(challenge, "done");

    expect(completed.currentSceneId).toBe("action-feedback");
    expect(completed.moodShift).toBe("curious");
    expect(completed.actionsTaken[0].status).toBe("completed");
  });

  test("current session state persists and restores", () => {
    const storage = memoryStorage();
    const state = engine.selectMood(engine.createInitialState({ displayName: "Asha" }), "stressed");

    expect(persistence.savePlayLifeState(state, storage)).toBe(true);
    expect(persistence.loadPlayLifeState(storage)).toEqual(state);
  });

  test("smiling and declining the smile create different flows", () => {
    const base = { ...engine.createInitialState(), currentSceneId: "smile-invite" };
    const smiled = engine.applyChoice(base, "smiled");
    const declined = engine.applyChoice(base, "nope");

    expect(smiled.currentSceneId).toBe("smile-found");
    expect(smiled.preferences.jokeAffinity).toBe(1);
    expect(declined.currentSceneId).toBe("smile-nope");
    expect(declined.preferences.jokeAffinity).toBe(-1);
  });

  test("action feedback is linked to the most recent action", () => {
    const challenge = { ...engine.createInitialState(), currentSceneId: "bored-challenge" };
    const completed = engine.applyChoice(challenge, "done");
    const feedback = engine.applyChoice(completed, "little");

    expect(feedback.actionFeedback).toHaveLength(1);
    expect(feedback.actionFeedback[0].value).toBe("a-little");
    expect(feedback.actionFeedback[0].actionId).toBe(feedback.actionsTaken[0].id);
  });

  test("session ending records both starting and reported ending mood", () => {
    const started = engine.selectMood(engine.createInitialState(), "sad");
    const checkout = { ...started, currentSceneId: "session-checkout" };
    const ended = engine.applyChoice(checkout, "little");

    expect(ended.session.startingMood.id).toBe("sad");
    expect(ended.session.endingMood).toBe("a-little-better");
    expect(ended.session.completedAt).toBeTruthy();
  });

  test("missing scene and optional content fall back without crashing", () => {
    const state = { ...engine.createInitialState(), currentSceneId: "missing-scene", interactionHistory: null };
    const scene = engine.getScene(state);

    expect(scene.id).toBe("safe-fallback");
    expect(scene.message).toBeTruthy();
    expect(Array.isArray(scene.choices)).toBe(true);
  });

  test("reduced motion produces a zero-distance transition profile", () => {
    expect(engine.getMotionProfile(true)).toEqual({ duration: 0, distance: 0 });
    expect(engine.getMotionProfile(false).duration).toBeGreaterThan(0);
  });

  test("urgent free text switches out of game-like scenes", () => {
    const state = engine.submitText(engine.createInitialState(), "I want to hurt myself");
    expect(state.safetyLevel).toBe("urgent");
    expect(state.currentSceneId).toBe("support-scene");
  });
});
