const API_BASE = "http://localhost:5000";

// Category Fallback Image Registry (Curated High-Res Unsplash Images)
const CATEGORY_FALLBACKS = {
  life: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
  incidents: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  travel: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  writing: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  philosophy: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Returns a guaranteed valid image URL for any image property on an article
 * @param {string} rawUrl - Image URL from API/DB
 * @param {string} category - Article category string for curated fallbacks
 * @returns {string} - Formatted image URL
 */
export function getImageUrl(rawUrl, category = "") {
  if (!rawUrl || typeof rawUrl !== "string") {
    return getCategoryFallback(category);
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return getCategoryFallback(category);
  }

  // Absolute URLs (http/https/data:)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Relative upload paths
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Returns curated fallback image for a category
 */
export function getCategoryFallback(category = "") {
  const catKey = (category || "").toLowerCase().trim();
  return CATEGORY_FALLBACKS[catKey] || CATEGORY_FALLBACKS.default;
}

/**
 * Global onError image event handler to prevent broken image icon boxes
 */
export function handleImageError(event, category = "") {
  const fallback = getCategoryFallback(category);
  if (event && event.target && event.target.src !== fallback) {
    event.target.onerror = null; // Prevent infinite fallback loops
    event.target.src = fallback;
  }
}
