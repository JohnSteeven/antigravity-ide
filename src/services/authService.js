import { otpService } from "./otpService";
import { userService } from "./userService";
import {
  AUTH_API_URL,
  AUTH_PROVIDERS,
  AUTH_STORAGE_KEYS,
  DEFAULT_PROFILE,
  VERIFICATION_PURPOSES,
} from "../utils/constants";
import {
  clearAuthCookies,
  createId,
  createToken,
  getToday,
  normalizeIdentifier,
  normalizeMobile,
  readStorage,
  removeStorage,
  stripSensitiveUserFields,
  writeStorage,
} from "../utils/helpers";
import { detectIdentifierType } from "../utils/validators";

const getUsers = () => readStorage(AUTH_STORAGE_KEYS.users, []);
const saveUsers = (users) => writeStorage(AUTH_STORAGE_KEYS.users, users);
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
    csrfTokenRequest = fetchWithTimeout(`${AUTH_API_URL || ""}/api/auth/csrf-token`, {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Could not start a secure session.");
        }
        csrfToken = data.csrfToken || readCookie("csrfToken") || "";
        return csrfToken;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
};

const apiRequest = async (path, options = {}) => {
  const baseUrl = AUTH_API_URL || "";
  const { headers: optionHeaders = {}, ...fetchOptions } = options;
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...optionHeaders,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await getCsrfToken().catch(() => "");
    if (token) headers["x-csrf-token"] = token;
  }

  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    credentials: "include",
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Authentication request failed.");
    error.code = data.code;
    error.status = response.status;
    throw error;
  }

  return data;
};

const textHash = async (value) => {
  const text = String(value || "");

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(text);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return btoa(text);
};

const hashPassword = async (password, salt) => textHash(`${salt}:${password}`);

const createSession = (user, remember = false) => {
  const session = {
    userId: user.id,
    accessToken: createToken("jwt"),
    refreshToken: createToken("refresh"),
    remember,
    createdAt: Date.now(),
    expiresAt: remember
      ? Date.now() + 1000 * 60 * 60 * 24 * 30
      : Date.now() + 1000 * 60 * 60 * 8,
  };

  writeStorage(AUTH_STORAGE_KEYS.session, session);

  if (typeof document !== "undefined") {
    document.cookie = `myjourney_session=${session.accessToken}; path=/; SameSite=Lax`;
  }

  return session;
};

const getSessionWithUser = () => {
  const session = readStorage(AUTH_STORAGE_KEYS.session, null);

  if (!session || session.expiresAt < Date.now()) {
    removeStorage(AUTH_STORAGE_KEYS.session);
    return { session: null, user: null };
  }

  const user = userService.getPublicUser(session.userId);

  if (!user) {
    removeStorage(AUTH_STORAGE_KEYS.session);
    return { session: null, user: null };
  }

  return { session, user };
};

const createUserRecord = async (form) => {
  const salt = createToken("salt");
  const passwordHash = await hashPassword(form.password, salt);
  const mobile = normalizeMobile(form.countryCode, form.mobile);
  const today = getToday();

  return {
    id: createId("user"),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    username: form.username.trim(),
    email: normalizeIdentifier(form.email),
    countryCode: form.countryCode.trim(),
    mobile,
    passwordSalt: salt,
    passwordHash,
    role: "reader",
    verified: {
      email: false,
      mobile: false,
    },
    failedLoginAttempts: 0,
    lockUntil: null,
    newsletter: Boolean(form.newsletter),
    provider: "password",
    profile: {
      ...DEFAULT_PROFILE,
    },
    createdAt: today,
    updatedAt: today,
  };
};

export const authService = {
  async getSession() {
    try {
      const storedSession = readStorage(AUTH_STORAGE_KEYS.session, null);
      let sessionError = null;
      let api = await apiRequest("/api/auth/me").catch((err) => {
        sessionError = err;
        return null;
      });

      if (!api?.user && storedSession && (!sessionError || sessionError.status === 401)) {
        api = await apiRequest("/api/auth/refresh-token", { method: "POST" }).catch(
          () => null
        );
      }

      if (api?.user) {
        // Keep in sync with local storage for compat
        const session = api.session || { authenticated: true };
        writeStorage(AUTH_STORAGE_KEYS.session, {
          userId: api.user.id || api.user._id,
          accessToken: session.accessToken,
          expiresAt: Date.now() + 1000 * 60 * 60 * 8,
        });
        return { session, user: api.user };
      }
    } catch (err) {
      console.warn("Failed to get live session, checking storage:", err);
    }

    return getSessionWithUser();
  },

  async register(form) {
    // Attempt REST call first
    try {
      const api = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (api) return api;
    } catch (err) {
      // If server returned a validation error or conflict, throw it immediately
      if (err.status) throw err;
    }

    // Storage fallback
    const users = getUsers();
    const normalizedEmail = normalizeIdentifier(form.email);
    const mobile = normalizeMobile(form.countryCode, form.mobile);

    if (
      users.some(
        (user) =>
          user.email === normalizedEmail ||
          user.mobile === mobile ||
          user.username.toLowerCase() === form.username.trim().toLowerCase()
      )
    ) {
      throw new Error("An account already exists with this email, mobile, or username.");
    }

    const user = await createUserRecord(form);
    saveUsers([user, ...users]);

    return {
      user: stripSensitiveUserFields(user),
      verificationOptions: {
        email: user.email,
        mobile: user.mobile,
      },
      message: "Account created. Choose how you want to verify it.",
    };
  },

  async sendRegistrationOtp({ userId, channel }) {
    try {
      const dbUser = await userService.findById(userId);
      const identifier = channel === "mobile" ? dbUser?.mobile : dbUser?.email;
      const api = await apiRequest("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          channel,
          purpose: VERIFICATION_PURPOSES.register,
          userId,
        }),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    const user = userService.findById(userId);
    if (!user) throw new Error("User not found.");
    const identifier = channel === "mobile" ? user.mobile : user.email;

    return otpService.createChallenge({
      identifier,
      channel,
      purpose: VERIFICATION_PURPOSES.register,
      userId,
    });
  },

  async verifyOtp({ challengeId, code, purpose }) {
    try {
      const api = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ challengeId, code, purpose }),
      });

      if (api) {
        if (api.session) {
          writeStorage(AUTH_STORAGE_KEYS.session, {
            userId: api.user.id || api.user._id,
            accessToken: api.session.accessToken,
            expiresAt: Date.now() + 1000 * 60 * 60 * 8,
          });
        }
        return api;
      }
    } catch (err) {
      if (err.status) throw err;
    }

    const challenge = otpService.verifyChallenge({ challengeId, code, purpose });
    const user = userService.findById(challenge.userId);

    if (!user) throw new Error("User not found.");

    if (purpose === VERIFICATION_PURPOSES.passwordReset) {
      const resetToken = createToken("reset");
      writeStorage(AUTH_STORAGE_KEYS.passwordReset, {
        userId: user.id,
        resetToken,
        expiresAt: Date.now() + 1000 * 60 * 10,
      });

      return {
        user: stripSensitiveUserFields(user),
        resetToken,
        message: "OTP verified. You can now set a new password.",
      };
    }

    const verifiedUser = {
      ...user,
      verified: {
        ...user.verified,
        [challenge.channel]: true,
      },
      updatedAt: getToday(),
    };

    userService.replaceUser(verifiedUser);
    const session = createSession(verifiedUser, true);

    return {
      session,
      user: stripSensitiveUserFields(verifiedUser),
      message:
        purpose === VERIFICATION_PURPOSES.loginOtp
          ? "Logged in successfully."
          : "Account verified successfully.",
    };
  },

  async resendOtp({ challengeId }) {
    try {
      const api = await apiRequest("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ challengeId }),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    return otpService.resendChallenge(challengeId);
  },

  async loginWithPassword({ identifier, password, remember }) {
    try {
      const api = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password, remember }),
      });

      if (api) {
        if (api.session) {
          writeStorage(AUTH_STORAGE_KEYS.session, {
            userId: api.user.id || api.user._id,
            accessToken: api.session.accessToken,
            expiresAt: Date.now() + 1000 * 60 * 60 * 8,
          });
        }
        return api;
      }
    } catch (err) {
      if (err.status) throw err;
    }

    const user = userService.findByIdentifier(identifier);

    if (!user) {
      throw new Error("Invalid email/mobile or password.");
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const error = new Error("Too many failed attempts. Please try again later.");
      error.code = "ACCOUNT_LOCKED";
      throw error;
    }

    const matches = user.passwordHash === (await hashPassword(password, user.passwordSalt));

    if (!matches) {
      const updated = {
        ...user,
        failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
      };

      if (updated.failedLoginAttempts >= 5) {
        updated.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      userService.replaceUser(updated);

      const error = new Error(
        updated.lockUntil ? "Too many failed attempts. Please try again later." : "Incorrect password."
      );
      error.code = "INCORRECT_PASSWORD";
      throw error;
    }

    if (!user.verified.email && !user.verified.mobile) {
      throw new Error("Please verify your account before logging in.");
    }

    const updatedUser = {
      ...user,
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLoginAt: getToday(),
    };
    userService.replaceUser(updatedUser);

    const session = createSession(updatedUser, remember);

    return {
      session,
      user: stripSensitiveUserFields(updatedUser),
      message: "Welcome back.",
    };
  },

  async requestLoginOtp({ identifier, channel }) {
    try {
      const api = await apiRequest("/api/auth/login/otp/request", {
        method: "POST",
        body: JSON.stringify({ identifier, channel }),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    const user = userService.findByIdentifier(identifier);
    if (!user) throw new Error("No account exists for this email or mobile number.");

    const target = channel === "mobile" ? user.mobile : user.email;

    return otpService.createChallenge({
      identifier: target,
      channel,
      purpose: VERIFICATION_PURPOSES.loginOtp,
      userId: user.id,
    });
  },

  async requestPasswordReset({ identifier, channel }) {
    try {
      const api = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier, channel }),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    const user = userService.findByIdentifier(identifier);
    if (!user) throw new Error("No account exists for this email or mobile number.");

    const target = channel === "mobile" ? user.mobile : user.email;

    return otpService.createChallenge({
      identifier: target,
      channel,
      purpose: VERIFICATION_PURPOSES.passwordReset,
      userId: user.id,
    });
  },

  async resetPassword({ resetToken, password }) {
    try {
      const api = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, password }),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    const resetState = readStorage(AUTH_STORAGE_KEYS.passwordReset, null);

    if (
      !resetState ||
      resetState.resetToken !== resetToken ||
      resetState.expiresAt < Date.now()
    ) {
      throw new Error("Password reset link expired. Please request a fresh OTP.");
    }

    const user = userService.findById(resetState.userId);
    if (!user) throw new Error("User not found.");

    const salt = createToken("salt");
    const passwordHash = await hashPassword(password, salt);

    userService.replaceUser({
      ...user,
      passwordSalt: salt,
      passwordHash,
      updatedAt: getToday(),
    });

    removeStorage(AUTH_STORAGE_KEYS.passwordReset);

    return {
      message: "Password updated successfully. Please login again.",
    };
  },

  async socialLogin(provider) {
    const providerName = AUTH_PROVIDERS[provider] || "Social";
    const email = `${provider}@myjourney.local`;
    const users = getUsers();
    let user = users.find((item) => item.provider === provider);

    if (!user) {
      const now = getToday();
      user = {
        id: createId("user"),
        firstName: providerName,
        lastName: "Reader",
        username: `${provider}-reader`,
        email,
        countryCode: "+91",
        mobile: `+91000000${provider === "google" ? "100" : "200"}`,
        passwordSalt: "",
        passwordHash: "",
        role: "reader",
        verified: { email: true, mobile: true },
        newsletter: false,
        provider,
        profile: {
          ...DEFAULT_PROFILE,
        },
        createdAt: now,
        updatedAt: now,
      };
      saveUsers([user, ...users]);
    }

    const session = createSession(user, true);

    return {
      session,
      user: stripSensitiveUserFields(user),
      message: `Signed in with ${providerName}.`,
    };
  },

  async updateProfile(userId, updates) {
    try {
      const api = await apiRequest("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      if (api) return api;
    } catch (err) {
      if (err.status) throw err;
    }

    const user = userService.updateProfile(userId, updates);
    return { user, message: "Profile updated successfully." };
  },

  async logout() {
    const session = readStorage(AUTH_STORAGE_KEYS.session, null);
    await apiRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session?.refreshToken }),
    }).catch(() => null);
    removeStorage(AUTH_STORAGE_KEYS.session);
    removeStorage(AUTH_STORAGE_KEYS.currentChallenge);
    removeStorage(AUTH_STORAGE_KEYS.passwordReset);
    clearAuthCookies();
    return { message: "Logged out." };
  },
};
