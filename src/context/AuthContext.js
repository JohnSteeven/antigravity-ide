import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.getSession();
      setUser(result.user);
      setSession(result.session);
      return result;
    } catch (error) {
      console.warn("Failed to refresh session", error);
      setUser(null);
      setSession(null);
      return { user: null, session: null };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const applyAuthResult = useCallback((result) => {
    if (result?.user) setUser(result.user);
    if (result?.session) setSession(result.session);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user && session),

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

      async socialLogin(provider) {
        return applyAuthResult(await authService.socialLogin(provider));
      },

      async updateProfile(updates) {
        const result = await authService.updateProfile(user.id, updates);
        if (result?.user) setUser(result.user);
        return result;
      },

      async logout() {
        const result = await authService.logout();
        setUser(null);
        setSession(null);
        return result;
      },

      refreshSession,
    }),
    [applyAuthResult, loading, refreshSession, session, user]
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
