import {
  AUTH_API_URL,
  AUTH_STORAGE_KEYS,
} from "../utils/constants";
import {
  clearAuthCookies,
  removeStorage,
} from "../utils/helpers";
let csrfToken = "";
let csrfTokenRequest = null;
const REQUEST_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (url, options = {}) => {
  if (typeof AbortController === "undefined") {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: options.signal || controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const readCookie = (name) => {
  if (typeof document === "undefined") return "";

  return (
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
};

const getCsrfToken = async () => {
  const cookieToken = readCookie("csrfToken");
  if (cookieToken) {
    csrfToken = decodeURIComponent(cookieToken);
    return csrfToken;
  }

  if (csrfToken) return csrfToken;

  if (!csrfTokenRequest) {
    csrfTokenRequest = apiRequest("/api/auth/csrf-token")
      .then((data) => {
        csrfToken = data.csrfToken || readCookie("csrfToken") || "";
        return csrfToken;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
};

const sanitizeError = (error, status) => {
  if (status === 401) {
    return "Your session has expired or is invalid. Please log in again.";
  }
  if (status === 403) {
    return error.message || "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "The requested resource could not be found.";
  }
  if (status === 429) {
    return "Too many requests. Please try again later.";
  }
  if (status >= 500) {
    return "Our servers are experiencing issues. Please try again later.";
  }
  if (error.name === "TimeoutError" || error.isTimeout) {
    return "The request timed out. Please check your connection and try again.";
  }
  return error.message || "An unexpected error occurred. Please try again.";
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = AUTH_API_URL || "";
  const { headers: optionHeaders = {}, ...fetchOptions } = options;
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...optionHeaders,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await getCsrfToken();
    if (token) headers["x-csrf-token"] = token;
  }

  let response;
  try {
    response = await fetchWithTimeout(`${baseUrl}${path}`, {
      credentials: "include",
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    if (err && err.name === "AbortError") {
      const timeout = new Error("The request timed out. Please check your connection and try again.");
      timeout.isTimeout = true;
      timeout.name = "TimeoutError";
      timeout.status = 408;
      throw timeout;
    }
    const netErr = new Error("Unable to connect to the server. Please check your internet connection.");
    netErr.status = 0;
    throw netErr;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const rawMsg = data.message || "Authentication request failed.";
    const status = response.status;
    const friendlyMsg = sanitizeError(new Error(rawMsg), status);
    const error = new Error(friendlyMsg);
    error.code = data.code;
    error.status = status;
    throw error;
  }

  return data;
};

export const authService = {
  async getSession() {
    try {
      const api = await apiRequest("/api/auth/me");
      return { session: api.session || { authenticated: true }, user: api.user };
    } catch (error) {
      if (error.status !== 401) throw error;
      try {
        const refreshed = await apiRequest("/api/auth/refresh-token", { method: "POST" });
        return { session: refreshed.session || { authenticated: true }, user: refreshed.user };
      } catch (refreshError) {
        if (refreshError.status !== 401) throw refreshError;
      }
    }
    removeStorage(AUTH_STORAGE_KEYS.session);
    clearAuthCookies();
    return { session: null, user: null };
  },

  async register(form) {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
  },

  async sendRegistrationOtp({ userId, channel }) {
    return apiRequest("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ userId, channel, purpose: "register" }),
    });
  },

  async verifyOtp({ challengeId, code, purpose }) {
    return apiRequest("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ challengeId, code, purpose }),
    });
  },

  async resendOtp({ challengeId }) {
    return apiRequest("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    });
  },

  async loginWithPassword({ identifier, password, remember }) {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, remember }),
    });
  },

  async requestLoginOtp({ identifier, channel }) {
    return apiRequest("/api/auth/login/otp/request", {
      method: "POST",
      body: JSON.stringify({ identifier, channel }),
    });
  },

  async requestPasswordReset({ email, identifier }) {
    const target = (email || identifier || "").trim();
    return apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: target, identifier: target, channel: "email" }),
    });
  },

  async validateResetToken(token) {
    if (!token) return { valid: false, reason: "invalid", message: "Token is missing." };
    return apiRequest(`/api/auth/reset-password/validate/${token}`, { method: "GET" });
  },

  async resetPassword({ resetToken, token, password, confirmPassword }) {
    const activeToken = token || resetToken;
    return apiRequest(`/api/auth/reset-password/${activeToken}`, {
      method: "POST",
      body: JSON.stringify({ token: activeToken, password, confirmPassword }),
    });
  },

  async socialLogin() {
    const error = new Error("Social sign-in is not configured.");
    error.code = "AUTH_PROVIDER_UNAVAILABLE";
    error.status = 503;
    throw error;
  },

  async changePassword({ currentPassword, newPassword }) {
    return apiRequest("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateProfile(userId, updates) {
    return apiRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async logout() {
    await apiRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    }).catch(() => null);
    removeStorage(AUTH_STORAGE_KEYS.users);
    removeStorage(AUTH_STORAGE_KEYS.session);
    removeStorage(AUTH_STORAGE_KEYS.otps);
    removeStorage(AUTH_STORAGE_KEYS.currentChallenge);
    removeStorage(AUTH_STORAGE_KEYS.passwordReset);
    removeStorage("myjourney-access-data");
    removeStorage("myjourney-site-data");
    removeStorage("myjourney-engagement-data");
    clearAuthCookies();
    return { message: "Logged out." };
  },
};

export default authService;
