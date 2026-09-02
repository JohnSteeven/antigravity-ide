const STORAGE_KEY = "myjourney-play-life-v1";
const { STATE_VERSION } = require("../engine/playLifeEngine");

const getDefaultStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

const loadPlayLifeState = (storage = getDefaultStorage()) => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STATE_VERSION || !parsed?.session || !parsed?.journey) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
};

const savePlayLifeState = (state, storage = getDefaultStorage()) => {
  if (!storage || !state) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (_error) {
    return false;
  }
};

const clearPlayLifeState = (storage = getDefaultStorage()) => {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch (_error) {
    return false;
  }
};

module.exports = { STORAGE_KEY, clearPlayLifeState, loadPlayLifeState, savePlayLifeState };
