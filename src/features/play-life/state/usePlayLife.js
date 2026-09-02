import { useCallback, useEffect, useState } from "react";
import playLifeEngine from "../engine/playLifeEngine";
import persistence from "./persistence";

const {
  applyChoice,
  createInitialState,
  getScene,
  selectMood,
  submitText,
  updateSound,
  updateUser,
} = playLifeEngine;
const { loadPlayLifeState, savePlayLifeState } = persistence;

const usePlayLife = ({ user, reduceMotion = false }) => {
  const [state, setState] = useState(() => {
    const stored = loadPlayLifeState();
    return stored || createInitialState(user);
  });

  useEffect(() => {
    setState((current) => updateUser(current, user));
  }, [user?.displayName, user?.id]);

  useEffect(() => {
    setState((current) => ({
      ...current,
      preferences: { ...current.preferences, reducedMotion: Boolean(reduceMotion) },
    }));
  }, [reduceMotion]);

  useEffect(() => {
    savePlayLifeState(state);
  }, [state]);

  const choose = useCallback((choiceId) => {
    setState((current) => applyChoice(current, choiceId));
  }, []);

  const changeMood = useCallback((moodId) => {
    setState((current) => selectMood(current, moodId, { source: "mood-control" }));
  }, []);

  const chooseInitialMood = useCallback((moodId) => {
    setState((current) => selectMood(current, moodId, { source: "selection" }));
  }, []);

  const sendText = useCallback((text) => {
    setState((current) => submitText(current, text));
  }, []);

  const setSound = useCallback((patch) => {
    setState((current) => updateSound(current, patch));
  }, []);

  const goToScene = useCallback((sceneId) => {
    setState((current) => ({
      ...current,
      currentSceneId: sceneId,
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  return {
    state,
    scene: getScene(state),
    choose,
    changeMood,
    chooseInitialMood,
    sendText,
    setSound,
    goToScene,
  };
};

export default usePlayLife;
