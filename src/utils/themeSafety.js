export const THEME_COLOR_DEFAULTS = Object.freeze({
  light: Object.freeze({
    primary: "#426c67", secondary: "#4d6478", accent: "#2f4e4a", gold: "#8f6b48",
    success: "#2e7d5a", warning: "#8f6b48", danger: "#9d3e32", info: "#4d6478",
    surface: "#ffffff", panel: "#fdfbf7", background: "#fbfaf7", text: "#2f3133",
    muted: "#666d6d", border: "#d7cec3",
  }),
  dark: Object.freeze({
    primary: "#7bb8b2", secondary: "#9fb5c7", accent: "#9bd0ca", gold: "#d7ad7f",
    success: "#76c69d", warning: "#e3bb86", danger: "#f09a8f", info: "#9fbad2",
    surface: "#1d2422", panel: "#26302d", background: "#131716", text: "#f8f4ed",
    muted: "#c3ccc8", border: "rgba(255, 255, 255, 0.18)",
  }),
});

const safeColor = (value) => {
  const input = String(value || "").trim();
  return input.length <= 80 && (
    /^#[0-9a-f]{3,8}$/i.test(input)
    || /^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(input)
    || /^(?:transparent|currentColor)$/i.test(input)
  );
};

const safeValue = (value, fallback) => {
  const input = String(value || "").trim();
  return input
    && input.length <= 240
    && !/[;{}<>\r\n]/.test(input)
    && !/(?:url\s*\(|expression\s*\(|@import|javascript:|!important)/i.test(input)
    ? input
    : fallback;
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
  return rgb ? rgb.slice(1, 4).map((part) => Math.max(0, Math.min(255, Number(part)))) : null;
};

const luminance = (value) => {
  const rgb = parseColor(value);
  if (!rgb) return null;
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

export const contrastRatio = (foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return null;
  return Number(((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toFixed(2));
};

export const suggestedForeground = (background) =>
  (contrastRatio("#111827", background) || 0) >= (contrastRatio("#f8fafc", background) || 0)
    ? "#111827"
    : "#f8fafc";

const effectiveColors = (theme = {}, modeOverride) => {
  const sourceMode = theme.mode === "dark" ? "dark" : "light";
  const mode = modeOverride === "dark" ? "dark" : "light";
  const defaults = THEME_COLOR_DEFAULTS[mode];
  const source = theme.tokens?.colors || {};
  const retain = sourceMode === mode
    ? Object.keys(defaults)
    : ["primary", "secondary", "accent", "gold", "success", "warning", "danger", "info"];
  return retain.reduce((colors, key) => {
    colors[key] = safeColor(source[key]) ? String(source[key]).trim() : defaults[key];
    return colors;
  }, { ...defaults });
};

export const analyzeThemeAccessibility = (theme = {}, modeOverride) => {
  const mode = modeOverride || (theme.mode === "dark" ? "dark" : "light");
  const colors = effectiveColors(theme, mode);
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
      pair, foreground, background, required, critical,
      ratio,
      pass: ratio !== null && ratio >= required,
      suggestedForeground: suggestedForeground(background),
    };
  });
  return { pass: pairs.every((item) => !item.critical || item.pass), pairs, warnings: pairs.filter((item) => !item.pass) };
};

export const resolveThemeMode = (themeMode = "light") => {
  if (typeof window === "undefined") return themeMode === "dark" ? "dark" : "light";
  const preference = window.localStorage.getItem("myjourney-theme");
  if (preference === "dark" || preference === "light") return preference;
  if (themeMode === "dark") return "dark";
  if (themeMode === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
};

export const buildThemeCss = (theme = {}, modeOverride) => {
  const mode = modeOverride || resolveThemeMode(theme.mode);
  const colors = effectiveColors(theme, mode);
  const typography = theme.tokens?.typography || {};
  const radii = theme.tokens?.radii || {};
  const shadows = theme.tokens?.shadows || {};
  const accentContrast = suggestedForeground(colors.primary);
  const selector = mode === "dark" ? "body.theme-dark" : ":root";
  return `${selector} {
    --paper: ${colors.background}; --surface: ${colors.surface}; --panel: ${colors.panel};
    --ink: ${colors.text}; --muted: ${colors.muted}; --line: ${colors.border};
    --teal: ${colors.primary}; --gold: ${colors.gold}; --blue: ${colors.secondary}; --soft: ${colors.panel};
    --surface-page: ${colors.background}; --surface-subtle: ${colors.panel};
    --surface-card: ${colors.surface}; --surface-elevated: ${colors.surface};
    --surface-inverse: ${colors.text}; --surface-light-fixed: #faf8f5; --surface-dark-fixed: #131716;
    --text-primary: ${colors.text}; --text-secondary: ${colors.muted}; --text-muted: ${colors.muted};
    --text-inverse: ${accentContrast}; --text-on-light: #2f3133; --text-on-light-muted: #555956;
    --text-on-dark: #f8f4ed; --text-on-dark-muted: #c3ccc8;
    --border-subtle: ${colors.border}; --border-strong: ${colors.muted};
    --accent-primary: ${colors.primary}; --accent-secondary: ${colors.secondary};
    --accent-contrast: ${accentContrast}; --link: ${colors.primary};
    --success: ${colors.success}; --warning: ${colors.warning}; --danger: ${colors.danger}; --info: ${colors.info};
    --cms-accent: ${colors.primary}; --cms-accent-hover: ${colors.accent}; --cms-bg: ${colors.background};
    --control-bg: ${colors.surface}; --control-border: ${colors.border};
    --article-card-surface: ${colors.surface}; --article-card-text: ${colors.text};
    --article-card-secondary: ${colors.muted}; --article-card-muted: ${colors.muted};
    --article-card-border: ${colors.border}; --article-card-accent: ${colors.gold};
    --font-heading: ${safeValue(typography.headingFont, "Outfit, sans-serif")};
    --font-body: ${safeValue(typography.bodyFont, "Plus Jakarta Sans, sans-serif")};
    --radius-sm: ${safeValue(radii.small, "4px")}; --radius-md: ${safeValue(radii.medium, "8px")};
    --radius-lg: ${safeValue(radii.large, "14px")}; --radius-pill: ${safeValue(radii.pill, "100px")};
    --shadow-sm: ${safeValue(shadows.sm, "0 1px 4px rgba(0,0,0,0.06)")};
    --shadow-md: ${safeValue(shadows.md, "0 4px 16px rgba(0,0,0,0.09)")};
    --shadow-lg: ${safeValue(shadows.lg, "0 18px 45px rgba(0,0,0,0.12)")};
  }
  body { background: var(--surface-page); color: var(--text-primary); font-family: var(--font-body); }
  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }`;
};
