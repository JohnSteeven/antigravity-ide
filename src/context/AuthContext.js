import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "../services/authService";
import { creatorApi, membershipApi } from "../services/apiService";
import { purgePrivateBrowserData } from "../utils/privateBrowserData";

const FREE_ACCESS = Object.freeze({
  plan: "free",
  subscriptionStatus: null,
  billingPeriodMonths: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  entitlements: {},
});
const NO_CREATOR_ACCESS = Object.freeze({ studioAvailable: false, creatorStatus: null, applicationStatus: null, applicationMessage: "", creatorSlug: null });

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const accountBoundaryRef = useRef("");
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountAccess, setAccountAccess] = useState(FREE_ACCESS);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [creatorAccess, setCreatorAccess] = useState(NO_CREATOR_ACCESS);

  const refreshEntitlements = useCallback(async (authenticatedUser) => {
    if (!authenticatedUser) {
      setAccountAccess(FREE_ACCESS);
      setAccessError("");
      return FREE_ACCESS;
    }
    setAccessLoading(true);
    try {
      const response = await membershipApi.me();
      const next = response?.data || FREE_ACCESS;
      setAccountAccess(next);
      setAccessError("");
      return next;
    } catch (error) {
      setAccountAccess(FREE_ACCESS);
      setAccessError(error.message || "Subscription status is unavailable.");
      return FREE_ACCESS;
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const refreshCreatorAccess = useCallback(async (authenticatedUser) => {
    if (!authenticatedUser) {
      setCreatorAccess(NO_CREATOR_ACCESS);
      return NO_CREATOR_ACCESS;
    }
    try {
      const response = await creatorApi.capability();
      const next = response?.data || NO_CREATOR_ACCESS;
      setCreatorAccess(next);
      return next;
    } catch (error) {
      setCreatorAccess(NO_CREATOR_ACCESS);
      return NO_CREATOR_ACCESS;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.getSession();
      setUser(result.user);
      setSession(result.session);
      await Promise.all([refreshEntitlements(result.user), refreshCreatorAccess(result.user)]);
      return result;
    } catch (error) {
      console.warn("Failed to refresh session", error);
      setUser(null);
      setSession(null);
      setAccountAccess(FREE_ACCESS);
      setCreatorAccess(NO_CREATOR_ACCESS);
      await purgePrivateBrowserData("session_expired");
      return { user: null, session: null };
    } finally {
      setLoading(false);
    }
  }, [refreshCreatorAccess, refreshEntitlements]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const nextBoundary = user ? `${user.id || user._id}:${user.role || ""}:${user.status || ""}` : "";
    if (accountBoundaryRef.current && nextBoundary && accountBoundaryRef.current !== nextBoundary) {
      purgePrivateBrowserData("account_or_role_change").catch(() => {});
    }
    accountBoundaryRef.current = nextBoundary;
  }, [user]);

  useEffect(() => {
    const clearInvalidSession = () => {
      purgePrivateBrowserData("session_invalidated").catch(() => {});
      setUser(null);
      setSession(null);
      setAccountAccess(FREE_ACCESS);
      setAccessError("");
      setCreatorAccess(NO_CREATOR_ACCESS);
    };
    window.addEventListener("myjourney:auth-invalidated", clearInvalidSession);
    return () => window.removeEventListener("myjourney:auth-invalidated", clearInvalidSession);
  }, []);

  const applyAuthResult = useCallback(async (result) => {
    if (result?.user) {
      setUser(null);
      setSession(null);
      setAccountAccess(FREE_ACCESS);
      setCreatorAccess(NO_CREATOR_ACCESS);
      await purgePrivateBrowserData("account_change");
      setUser(result.user);
    }
    if (result?.session) setSession(result.session);
    await Promise.all([refreshEntitlements(result?.user || null), refreshCreatorAccess(result?.user || null)]);
    return result;
  }, [refreshCreatorAccess, refreshEntitlements]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user && session),
      accountAccess,
      accessLoading,
      accessError,
      hasEntitlement: (entitlement) => Boolean(accountAccess?.entitlements?.[entitlement]),
      refreshEntitlements: () => refreshEntitlements(user),
      creatorAccess,
      refreshCreatorAccess: () => refreshCreatorAccess(user),

      async register(form) {
        return authService.register(form);
      },

      async sendRegistrationOtp(payload) {
        return authService.sendRegistrationOtp(payload);
      },

      async verifyOtp(payload) {
        return applyAuthResult(await authService.verifyOtp(payload));
      },

      async resendOtp(payload) {
        return authService.resendOtp(payload);
      },

      async loginWithPassword(payload) {
        return applyAuthResult(await authService.loginWithPassword(payload));
      },

      async requestLoginOtp(payload) {
        return authService.requestLoginOtp(payload);
      },

      async requestPasswordReset(payload) {
        return authService.requestPasswordReset(payload);
      },

      async resetPassword(payload) {
        return authService.resetPassword(payload);
      },

      async changePassword(payload) {
        return authService.changePassword(payload);
      },

      async socialLogin(provider) {
        return applyAuthResult(await authService.socialLogin(provider));
      },

      async updateProfile(updates) {
        const result = await authService.updateProfile(user.id, updates);
        if (result?.user) {
          setUser(result.user);
        }
        return result;
      },

      async startIdentityChange(payload) {
        return authService.startIdentityChange(payload);
      },

      async resendIdentityChange(challengeId) {
        return authService.resendIdentityChange(challengeId);
      },

      async cancelIdentityChange(challengeId) {
        return authService.cancelIdentityChange(challengeId);
      },

      async verifyIdentityChange(challengeId, code) {
        const result = await authService.verifyIdentityChange(challengeId, code);
        if (result?.user) setUser(result.user);
        if (result?.session) setSession(result.session);
        await Promise.all([
          refreshEntitlements(result?.user || user),
          refreshCreatorAccess(result?.user || user),
        ]);
        return result;
      },

      async logout() {
        const result = await authService.logout();
        setUser(null);
        setSession(null);
        setAccountAccess(FREE_ACCESS);
        setAccessError("");
        setCreatorAccess(NO_CREATOR_ACCESS);
        await purgePrivateBrowserData("logout");
        return result;
      },

      refreshSession,
    }),
    [accessError, accessLoading, accountAccess, applyAuthResult, creatorAccess, loading, refreshCreatorAccess, refreshEntitlements, refreshSession, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
