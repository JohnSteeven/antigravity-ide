import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { membershipApi } from "../services/apiService";

const FREE_ACCESS = Object.freeze({
  plan: "free",
  subscriptionStatus: null,
  billingPeriodMonths: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  entitlements: {},
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountAccess, setAccountAccess] = useState(FREE_ACCESS);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");

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

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.getSession();
      setUser(result.user);
      setSession(result.session);
      await refreshEntitlements(result.user);
      return result;
    } catch (error) {
      console.warn("Failed to refresh session", error);
      setUser(null);
      setSession(null);
      setAccountAccess(FREE_ACCESS);
      return { user: null, session: null };
    } finally {
      setLoading(false);
    }
  }, [refreshEntitlements]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const applyAuthResult = useCallback(async (result) => {
    if (result?.user) setUser(result.user);
    if (result?.session) setSession(result.session);
    await refreshEntitlements(result?.user || null);
    return result;
  }, [refreshEntitlements]);

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
          if (user && user.profile && user.profile.notifications && (!result.user.profile || !result.user.profile.notifications)) {
            result.user.profile = {
              ...(result.user.profile || {}),
              notifications: user.profile.notifications,
            };
          }
          setUser(result.user);
        }
        return result;
      },

      async logout() {
        const result = await authService.logout();
        setUser(null);
        setSession(null);
        setAccountAccess(FREE_ACCESS);
        setAccessError("");
        return result;
      },

      refreshSession,
    }),
    [accessError, accessLoading, accountAccess, applyAuthResult, loading, refreshEntitlements, refreshSession, session, user]
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
