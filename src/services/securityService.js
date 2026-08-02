import { apiRequest } from "./authService";

export const securityService = {
  async getOverview() {
    return apiRequest("/api/security/overview");
  },

  async getSessions() {
    return apiRequest("/api/security/sessions");
  },

  async revokeSession(sessionId) {
    return apiRequest(`/api/security/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async revokeAllOtherSessions() {
    return apiRequest("/api/security/sessions", {
      method: "DELETE",
    });
  },

  async getLoginHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/security/login-history?${query}`);
  },

  async getDevices() {
    return apiRequest("/api/security/devices");
  },

  async renameDevice(deviceId, name) {
    return apiRequest(`/api/security/devices/${deviceId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  async removeDevice(deviceId) {
    return apiRequest(`/api/security/devices/${deviceId}`, {
      method: "DELETE",
    });
  },
};
