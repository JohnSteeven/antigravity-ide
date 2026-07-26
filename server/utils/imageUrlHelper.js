const env = require("../config/env");

/**
 * Formats image URLs so relative /uploads/ paths become absolute URLs pointing to the backend server.
 * Handles HTTPS, HTTP, relative paths, null, and empty strings.
 */
function formatImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const baseUrl = env.serverUrl || "http://localhost:5000";
  return `${baseUrl}${cleanPath}`;
}

/**
 * Normalizes all image fields on an article document
 */
function formatArticleImageUrls(article) {
  if (!article) return article;
  const doc = article.toObject ? article.toObject({ virtuals: true }) : { ...article };

  doc.coverImage = formatImageUrl(doc.coverImage);
  if (Array.isArray(doc.gallery)) {
    doc.gallery = doc.gallery.map(formatImageUrl);
  }
  if (doc.seo && doc.seo.openGraphImage) {
    doc.seo.openGraphImage = formatImageUrl(doc.seo.openGraphImage);
  }

  if (doc._id && !doc.id) {
    doc.id = doc._id.toString();
  }

  return doc;
}

module.exports = {
  formatImageUrl,
  formatArticleImageUrls,
};
