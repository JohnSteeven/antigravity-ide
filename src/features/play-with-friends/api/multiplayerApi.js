import apiService from "../../../services/apiService";

export const multiplayerApi = {
  games: () => apiService.get("/api/multiplayer/games"),
  createRoom: (payload) => apiService.post("/api/multiplayer/rooms", payload),
  joinRoom: (code, payload) => apiService.post(`/api/multiplayer/rooms/${encodeURIComponent(code)}/join`, payload),
  resumeRoom: (code, token) => apiService.post(`/api/multiplayer/rooms/${encodeURIComponent(code)}/resume`, { token }),
  inviteQrUrl: (code) => `/api/multiplayer/rooms/${encodeURIComponent(code)}/invite-qr`,
};
