export const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

export const createToken = (prefix) =>
  `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;

export const createOtp = (length = 6) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

export const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const normalizeIdentifier = (value) =>
  String(value || "").trim().toLowerCase();

export const normalizeMobile = (countryCode, mobile) =>
  `${String(countryCode || "").trim()}${String(mobile || "").trim()}`.replace(
    /\s+/g,
    ""
  );

export const maskIdentifier = (identifier) => {
  const value = String(identifier || "");
  const [name, domain] = value.split("@");

  if (domain) {
    return `${name.slice(0, 2)}***@${domain}`;
  }

  return value.length > 4
    ? `${value.slice(0, 3)}***${value.slice(-2)}`
    : value;
};

export const getToday = () => new Date().toISOString().slice(0, 10);

export const stripSensitiveUserFields = (user) => {
  if (!user) return null;
  const { password, passwordHash, passwordSalt, resetToken, ...safeUser } = user;
  return safeUser;
};

export const readStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
};

export const writeStorage = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeStorage = (key) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

export const clearAuthCookies = () => {
  if (typeof document === "undefined") return;
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
};

export const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.username ||
  "Reader";

const LEGACY_PLACEHOLDER_IMAGE_MARKERS = [
  "photo-1500648767791-00dcc994a43e",
  "photo-1470770841072-f978cf4d019e",
];

export const isLegacyPlaceholderImage = (value) =>
  LEGACY_PLACEHOLDER_IMAGE_MARKERS.some((marker) =>
    String(value || "").includes(marker)
  );

export const getInitialAvatarLabel = (user) => {
  const firstName = String(user?.firstName || "").trim();
  const fallback = String(user?.username || user?.email || "Reader").trim();
  return (firstName || fallback).charAt(0).toUpperCase() || "R";
};

export const getProfilePhoto = (profile = {}) => {
  const avatar = String(profile.avatar || "").trim();
  return avatar && !isLegacyPlaceholderImage(avatar) ? avatar : "";
};

export const getProfileCover = (profile = {}) => {
  const coverImage = String(profile.coverImage || "").trim();
  return coverImage && !isLegacyPlaceholderImage(coverImage) ? coverImage : "";
};

export const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
};

export const toCsv = (items) => {
  if (!items.length) return "";
  const keys = Object.keys(items[0]);
  const rows = items.map((item) =>
    keys
      .map((key) => `"${String(item[key] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [keys.join(","), ...rows].join("\n");
};

export const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("/uploads")) {
    return `http://localhost:5000${url}`;
  }
  return url;
};
