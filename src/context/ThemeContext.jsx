/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ThemeContext.jsx  —  Live Design System Theme Provider
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Fetches the active theme from /api/themes/active, dynamically injects
 *  CSS variable tokens into a <style id="cms-active-theme"> element in <head>,
 *  and supports instant live theme preview without page reloads.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import apiService from '../services/apiService';
import { buildThemeCss, resolveThemeMode } from '../utils/themeSafety';

export const ThemeContext = createContext({
  activeTheme: null,
  cssVariables: '',
  loading: true,
  activateTheme: async (themeId) => { },
  previewThemeTokens: (tokens, customCSS) => { },
  resetThemePreview: () => { },
});

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(null);
  const [cssVariables, setCssVariables] = useState('');
  const [loading, setLoading] = useState(true);

  const applyCSSToHead = useCallback((cssString) => {
    // Remove old style element first so we can re-append to the very bottom of <head>
    const existing = document.getElementById('cms-active-theme');
    if (existing) existing.remove();
    if (!cssString) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'cms-active-theme';
    styleEl.textContent = cssString;
    // Append at the END of <head> so it has highest specificity over index.css
    document.head.appendChild(styleEl);
  }, []);

  const applyTheme = useCallback((themeObj, modeOverride) => {
    const mode = modeOverride || resolveThemeMode(themeObj?.mode);
    const css = themeObj ? buildThemeCss(themeObj, mode) : '';
    applyCSSToHead(css);
    document.body.classList.toggle('theme-dark', mode === 'dark');
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    setCssVariables(css);
    return css;
  }, [applyCSSToHead]);

  const fetchActiveTheme = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/themes/active');
      if (res?.data) {
        setActiveTheme(res.data);
        applyTheme(res.data);
      }
    } catch (err) {
      console.warn('[ThemeContext] Failed to load active theme:', err.message);
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  useEffect(() => {
    fetchActiveTheme();
  }, [fetchActiveTheme]);

  const activateTheme = async (themeId) => {
    try {
      const res = await apiService.post(`/api/themes/${themeId}/publish`);
      if (res?.data) {
        setActiveTheme(res.data);
        applyTheme(res.data);
      }
      return res;
    } catch (err) {
      console.error('[ThemeContext] Activate theme error:', err);
      throw err;
    }
  };

  const previewThemeTokens = useCallback((themeObj, modeOverride) => {
    if (!themeObj || !themeObj.tokens) return;
    applyTheme(themeObj, modeOverride);
  }, [applyTheme]);

  const resetThemePreview = useCallback(() => {
    applyTheme(activeTheme);
  }, [activeTheme, applyTheme]);

  useEffect(() => {
    const onPreferenceChange = (event) => applyTheme(activeTheme, event.detail?.mode);
    window.addEventListener('myjourney-theme-change', onPreferenceChange);
    return () => window.removeEventListener('myjourney-theme-change', onPreferenceChange);
  }, [activeTheme, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        cssVariables,
        loading,
        activateTheme,
        previewThemeTokens,
        resetThemePreview,
        refreshTheme: fetchActiveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
