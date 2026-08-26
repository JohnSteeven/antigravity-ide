"use strict";

const MODES = Object.freeze(["light", "dark", "system", "high-contrast", "sepia"]);
const STATUSES = Object.freeze(["draft", "published", "archived"]);

const COLOR_DEFAULTS = Object.freeze({
  light: Object.freeze({
    primary: "#426c67",
    secondary: "#4d6478",
    accent: "#2f4e4a",
    gold: "#8f6b48",
    success: "#2e7d5a",
    warning: "#8f6b48",
    danger: "#9d3e32",
    info: "#4d6478",
    surface: "#ffffff",
    panel: "#fdfbf7",
    background: "#fbfaf7",
    text: "#2f3133",
    muted: "#666d6d",
    border: "#d7cec3",
  }),
  dark: Object.freeze({
    primary: "#7bb8b2",
    secondary: "#9fb5c7",
    accent: "#9bd0ca",
    gold: "#d7ad7f",
    success: "#76c69d",
    warning: "#e3bb86",
    danger: "#f09a8f",
    info: "#9fbad2",
    surface: "#1d2422",
    panel: "#26302d",
    background: "#131716",
    text: "#f8f4ed",
    muted: "#c3ccc8",
    border: "rgba(255, 255, 255, 0.18)",
  }),
});

const TOKEN_KEYS = Object.freeze({
  colors: Object.keys(COLOR_DEFAULTS.light),
  typography: ["headingFont", "bodyFont", "codeFont", "baseSize", "lineHeight"],
  spacing: ["xs", "sm", "md", "lg", "xl"],
  radii: ["small", "medium", "large", "pill"],
  shadows: ["sm", "md", "lg"],
});

const safeCssColor = (value) => {
  const input = String(value || "").trim();
  return input.length <= 80 && (
    /^#[0-9a-f]{3,8}$/i.test(input)
    || /^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(input)
    || /^(?:transparent|currentColor)$/i.test(input)
  );
};

const safeCssValue = (value, maxLength = 240) => {
  const input = String(value || "").trim();
  return input.length > 0
    && input.length <= maxLength
    && !/[;{}<>\r\n]/.test(input)
    && !/(?:url\s*\(|expression\s*\(|@import|javascript:|!important)/i.test(input);
};

const assertSafeTokenValue = (group, key, value) => {
  const valid = group === "colors"
    ? safeCssColor(value)
    : safeCssValue(value, group === "typography" ? 160 : 240);
  if (!valid) {
    const error = new Error(`Theme token '${group}.${key}' is not an allowed CSS value.`);
    error.status = 400;
    error.code = "THEME_TOKEN_INVALID";
    throw error;
  }
  return String(value).trim();
};

const sanitizeThemeTokens = (tokens = {}) => {
  if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) {
    const error = new Error("Theme tokens must be an object.");
    error.status = 400;
    error.code = "THEME_TOKENS_INVALID";
    throw error;
  }

  const clean = {};
  for (const [group, values] of Object.entries(tokens)) {
    if (!TOKEN_KEYS[group] || !values || typeof values !== "object" || Array.isArray(values)) {
      const error = new Error(`Theme token group '${group}' is not supported.`);
      error.status = 400;
      error.code = "THEME_TOKEN_GROUP_INVALID";
      throw error;
    }
    clean[group] = {};
    for (const [key, value] of Object.entries(values)) {
      if (!TOKEN_KEYS[group].includes(key)) {
        const error = new Error(`Theme token '${group}.${key}' is not supported.`);
        error.status = 400;
        error.code = "THEME_TOKEN_UNKNOWN";
        throw error;
      }
      clean[group][key] = assertSafeTokenValue(group, key, value);
    }
  }
  return clean;
};

const safeStoredTokens = (tokens = {}, mode = "light") => {
  const palette = mode === "dark" ? COLOR_DEFAULTS.dark : COLOR_DEFAULTS.light;
  const clean = { colors: { ...palette }, typography: {}, spacing: {}, radii: {}, shadows: {} };
  for (const [group, keys] of Object.entries(TOKEN_KEYS)) {
    for (const key of keys) {
      const value = tokens?.[group]?.[key];
      if (value === undefined || value === null || value === "") continue;
      try {
        clean[group][key] = assertSafeTokenValue(group, key, value);
      } catch (_error) {
        // Legacy unsafe values are ignored, never interpolated into generated CSS.
      }
    }
  }
  return clean;
};

const parseColor = (value) => {
  const input = String(value || "").trim();
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? hex[1].split("").map((char) => char + char).join("")
      : hex[1];
    return [0, 2, 4].map((offset) => Number.parseInt(raw.slice(offset, offset + 2), 16));
  }
  const rgb = input.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  if (!rgb) return null;
  return rgb.slice(1, 4).map((part) => Math.max(0, Math.min(255, Number(part))));
};

const luminance = (color) => {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return null;
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

const suggestedForeground = (background) => {
  const dark = contrastRatio("#111827", background) || 0;
  const light = contrastRatio("#f8fafc", background) || 0;
  return dark >= light ? "#111827" : "#f8fafc";
};

const analyzeThemeAccessibility = (theme = {}) => {
  const mode = theme.mode === "dark" ? "dark" : "light";
  const colors = safeStoredTokens(theme.tokens, mode).colors;
  const pairs = [
    ["text/background", colors.text, colors.background, 4.5, true],
    ["text/surface", colors.text, colors.surface, 4.5, true],
    ["text/panel", colors.text, colors.panel, 4.5, true],
    ["muted/background", colors.muted, colors.background, 4.5, true],
    ["muted/surface", colors.muted, colors.surface, 4.5, true],
    ["muted/panel", colors.muted, colors.panel, 4.5, true],
    ["primary/background", colors.primary, colors.background, 3, false],
  ].map(([pair, foreground, background, required, critical]) => {
    const ratio = contrastRatio(foreground, background);
    return {
      pair,
      foreground,
      background,
      ratio,
      required,
      critical,
      pass: ratio !== null && ratio >= required,
      suggestedForeground: suggestedForeground(background),
    };
  });
  return {
    pass: pairs.every((pair) => !pair.critical || pair.pass),
    pairs,
    warnings: pairs.filter((pair) => !pair.pass),
  };
};

const assertThemePayload = (payload = {}) => {
  if (payload.customCSS !== undefined || payload.customJS !== undefined) {
    const error = new Error("Raw theme CSS and JavaScript are not accepted. Use approved design tokens.");
    error.status = 400;
    error.code = "THEME_CUSTOM_CODE_FORBIDDEN";
    throw error;
  }
  if (payload.mode !== undefined && !MODES.includes(payload.mode)) {
    const error = new Error("Unsupported theme mode.");
    error.status = 400;
    error.code = "THEME_MODE_INVALID";
    throw error;
  }
  if (payload.status !== undefined && !STATUSES.includes(payload.status)) {
    const error = new Error("Unsupported theme status.");
    error.status = 400;
    error.code = "THEME_STATUS_INVALID";
    throw error;
  }
  if (payload.tokens !== undefined) sanitizeThemeTokens(payload.tokens);
};

module.exports = {
  COLOR_DEFAULTS,
  MODES,
  STATUSES,
  analyzeThemeAccessibility,
  assertThemePayload,
  contrastRatio,
  safeCssColor,
  safeStoredTokens,
  sanitizeThemeTokens,
  suggestedForeground,
};
