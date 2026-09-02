const slugify = (value = "") => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 90);

const uniqueStrings = (values, maxItems = 20) => [...new Set((Array.isArray(values) ? values : [])
  .map((value) => String(value || "").trim())
  .filter(Boolean))].slice(0, maxItems);

const safePublicLinks = (links, maxItems = 12) => (Array.isArray(links) ? links : [])
  .slice(0, maxItems)
  .map((link) => {
    try {
      const url = new URL(String(link?.url || ""));
      if (!["http:", "https:"].includes(url.protocol)) return null;
      return { label: String(link?.label || "Link").trim().slice(0, 60), url: url.toString() };
    } catch (error) {
      return null;
    }
  })
  .filter(Boolean);

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { escapeRegex, safePublicLinks, slugify, uniqueStrings };
