const PREFIX = "myjourney.multiplayer.session.";

export const normalizeRoomCode = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/\s+/g, "")
  .replace(/^MJ(?=[A-HJ-NP-Z2-9]{4}$)/, "MJ-")
  .slice(0, 7);

export const saveGameSession = (code, token) => {
  window.sessionStorage.setItem(`${PREFIX}${code}`, token);
};

export const readGameSession = (code) => window.sessionStorage.getItem(`${PREFIX}${code}`) || "";

export const clearGameSession = (code) => window.sessionStorage.removeItem(`${PREFIX}${code}`);
