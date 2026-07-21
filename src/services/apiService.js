/**
 * apiService.js
 * Centralised HTTP client for all content API calls.
 * All functions return plain JS objects (no axios, no extra deps).
 */

// In development, .proxyrc.js forwards /api/* to the backend.
// In production, set PARCEL_API_URL to the backend origin.
const API_BASE =
  typeof process !== "undefined" && process.env && process.env.PARCEL_API_URL
    ? process.env.PARCEL_API_URL
    : "";

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

// ─── CSRF ─────────────────────────────────────────────────────────────────────

let _csrfToken = "";
let _csrfRequest = null;

const readCookie = (name) => {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
};

const getCsrf = async () => {
  const cookie = readCookie("csrfToken");
  if (cookie) { _csrfToken = decodeURIComponent(cookie); return _csrfToken; }
  if (_csrfToken) return _csrfToken;
  if (!_csrfRequest) {
    _csrfRequest = fetchWithTimeout(`${API_BASE}/api/auth/csrf-token`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        _csrfToken = d.csrfToken || readCookie("csrfToken") || "";
        return _csrfToken;
      })
      .catch((err) => {
        // Suppress AbortError (timeout) — callers fall back to empty token
        if (err && err.name === "AbortError") return "";
        throw err;
      })
      .finally(() => { _csrfRequest = null; });
  }
  return _csrfRequest;
};

// ─── Core fetch ───────────────────────────────────────────────────────────────

const request = async (path, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await getCsrf().catch(() => "");
    if (token) headers["x-csrf-token"] = token;
  }

  const url = `${API_BASE}${path}`;
  let response;
  try {
    response = await fetchWithTimeout(url, { credentials: "include", ...options, headers });
  } catch (err) {
    if (err && err.name === "AbortError") {
      const timeout = new Error("Request timed out. Please check your connection and try again.");
      timeout.isTimeout = true;
      timeout.name = "TimeoutError";
      throw timeout;
    }
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.message || "API request failed.");
    err.status = response.status;
    throw err;
  }

  return data;
};

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const postFormData = (path, formData) => request(path, { method: "POST", body: formData });
const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) });
const del = (path) => request(path, { method: "DELETE" });

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articleApi = {
  /** Fetch all published articles — optional query params object */
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/articles${qs ? `?${qs}` : ""}`);
  },

  /** Fetch all articles for admin (any status) */
  adminList: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/articles/admin/all${qs ? `?${qs}` : ""}`);
  },

  /** Get a single article by slug */
  getBySlug: (slug) => get(`/api/articles/${slug}`),

  /** Create article (admin) */
  create: (payload) => post("/api/articles", payload),

  /** Update article (admin) */
  update: (id, payload) => put(`/api/articles/${id}`, payload),

  /** Delete article (admin) */
  delete: (id) => del(`/api/articles/${id}`),

  /** Restore soft-deleted article */
  restore: (id) => post(`/api/articles/${id}/restore`, {}),

  /** Toggle status */
  setStatus: (id, status) => put(`/api/articles/${id}/status`, { status }),

  /** Increment view counter */
  incrementViews: (id) => post(`/api/articles/${id}/views`, {}),

  /** Like article */
  like: (id) => post(`/api/articles/${id}/like`, {}),

  /** Bookmark */
  bookmark: (id) => post(`/api/articles/${id}/bookmark`, {}),

  /** Save */
  save: (id) => post(`/api/articles/${id}/save`, {}),

  /** Get comments for an article */
  getComments: (id) => get(`/api/articles/${id}/comments`),

  /** Submit a comment */
  addComment: (id, body) => post(`/api/articles/${id}/comments`, { body }),

};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoryApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/categories${qs ? `?${qs}` : ""}`);
  },
  getBySlug: (slug) => get(`/api/categories/${slug}`),
  get: (idOrSlug) => get(`/api/categories/${idOrSlug}`),
  create: (payload) => post("/api/categories", payload),
  update: (id, payload) => put(`/api/categories/${id}`, payload),
  delete: (id) => del(`/api/categories/${id}`),
  restore: (id) => post(`/api/categories/${id}/restore`, {}),
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tagApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/tags${qs ? `?${qs}` : ""}`);
  },
  get: (id) => get(`/api/tags/${id}`),
  create: (payload) => post("/api/tags", payload),
  update: (id, payload) => put(`/api/tags/${id}`, payload),
  delete: (id) => del(`/api/tags/${id}`),
  restore: (id) => post(`/api/tags/${id}/restore`, {}),
};

// ─── Media ────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/media${qs ? `?${qs}` : ""}`);
  },
  folders: () => get("/api/media/folders"),
  upload: (formData) => postFormData("/api/media", formData),
  rename: (id, name) => put(`/api/media/${id}/rename`, { name }),
  move: (id, folder) => put(`/api/media/${id}/move`, { folder }),
  delete: (id) => del(`/api/media/${id}`),
  restore: (id) => post(`/api/media/${id}/restore`, {}),
};

export const commentApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/comments${qs ? `?${qs}` : ""}`);
  },
  moderate: (id, status, updates = {}) => put(`/api/comments/${id}`, { status, ...updates }),
  delete: (id) => del(`/api/comments/${id}`),
  restore: (id) => post(`/api/comments/${id}/restore`, {}),
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  get: () => get("/api/stats"),
};

// ─── Subscribers ──────────────────────────────────────────────────────────────

export const subscriberApi = {
  subscribe: (email) => post("/api/subscribers", { email }),
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/subscribers${qs ? `?${qs}` : ""}`);
  },
  delete: (id) => del(`/api/subscribers/${id}`),
};

// ─── SubCategories ────────────────────────────────────────────────────────────
export const subCategoryApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/subcategories${qs ? `?${qs}` : ""}`);
  },
  get: (id) => get(`/api/subcategories/${id}`),
  create: (payload) => post("/api/subcategories", payload),
  update: (id, payload) => put(`/api/subcategories/${id}`, payload),
  delete: (id) => del(`/api/subcategories/${id}`),
  restore: (id) => post(`/api/subcategories/${id}/restore`, {}),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingApi = {
  get: (key) => get(`/api/settings/${key}`),
  update: (key, value) => put(`/api/settings/${key}`, { value }),
};

// ─── Backups ──────────────────────────────────────────────────────────────────
export const backupApi = {
  list: () => get("/api/backups"),
  create: () => post("/api/backups", {}),
  restore: (id) => post(`/api/backups/${id}/restore`, {}),
  downloadUrl: (id) => `${API_BASE}/api/backups/${id}/download`,
  delete: (id) => del(`/api/backups/${id}`),
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
export const testimonialApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/testimonials${qs ? `?${qs}` : ""}`);
  },
  create: (payload) => post("/api/testimonials", payload),
  update: (id, payload) => put(`/api/testimonials/${id}`, payload),
  delete: (id) => del(`/api/testimonials/${id}`),
  restore: (id) => post(`/api/testimonials/${id}/restore`, {}),
};

// ─── Gallery ──────────────────────────────────────────────────────────────────
export const galleryApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/gallery${qs ? `?${qs}` : ""}`);
  },
  create: (payload) => post("/api/gallery", payload),
  update: (id, payload) => put(`/api/gallery/${id}`, payload),
  delete: (id) => del(`/api/gallery/${id}`),
  restore: (id) => post(`/api/gallery/${id}/restore`, {}),
  albums: () => get("/api/gallery/albums"),
};

// ─── Newsletters ──────────────────────────────────────────────────────────────
export const newsletterCampaignApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/newsletter-campaigns${qs ? `?${qs}` : ""}`);
  },
  create: (payload) => post("/api/newsletter-campaigns", payload),
  update: (id, payload) => put(`/api/newsletter-campaigns/${id}`, payload),
  send: (id) => post(`/api/newsletter-campaigns/${id}/send`, {}),
  delete: (id) => del(`/api/newsletter-campaigns/${id}`),
  restore: (id) => post(`/api/newsletter-campaigns/${id}/restore`, {}),
};

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessageApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/contact-messages${qs ? `?${qs}` : ""}`);
  },
  create: (payload) => post("/api/contact-messages", payload),
  update: (id, payload) => put(`/api/contact-messages/${id}`, payload),
  delete: (id) => del(`/api/contact-messages/${id}`),
  restore: (id) => post(`/api/contact-messages/${id}/restore`, {}),
};

// ─── Logs & Activity ──────────────────────────────────────────────────────────
export const logApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/activity-logs${qs ? `?${qs}` : ""}`);
  },
};

export const activityLogApi = logApi;

// ─── Users & Identity ────────────────────────────────────────────────────────
export const userApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/users${qs ? `?${qs}` : ""}`);
  },
  get: (id) => get(`/api/users/${id}`),
  update: (id, payload) => put(`/api/users/${id}`, payload),
  delete: (id) => del(`/api/users/${id}`),
  restore: (id) => post(`/api/users/${id}/restore`, {}),
  suspend: (id) => post(`/api/users/${id}/suspend`, {}),
  forceLogout: (id) => post(`/api/users/${id}/force-logout`, {}),
  resetPassword: (id, password) => post(`/api/users/${id}/reset-password`, { password }),
  getMe: () => get("/api/users/me"),
  updateProfile: (payload) => put("/api/users/me", payload),
};

// ─── Roles ───────────────────────────────────────────────────────────────────
export const roleApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return get(`/api/roles${qs ? `?${qs}` : ""}`);
  },
  create: (payload) => post("/api/roles", payload),
  update: (id, payload) => put(`/api/roles/${id}`, payload),
  delete: (id) => del(`/api/roles/${id}`),
  clone: (id, name) => post(`/api/roles/${id}/clone`, { name }),
};

// ─── Permissions ─────────────────────────────────────────────────────────────
export const permissionApi = {
  list: () => get("/api/permissions"),
  update: (roleId, permissions) => put(`/api/permissions/${roleId}`, { permissions }),
};

