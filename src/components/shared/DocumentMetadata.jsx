import { useEffect } from "react";

const cleanText = (value, maxLength) => String(value || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, maxLength);

const safeUrl = (value, fallback = "") => {
  try {
    const url = new URL(String(value || fallback), window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
};

const updateElement = (selector, tagName, attributes) => {
  let element = document.head.querySelector(selector);
  const created = !element;
  if (!element) {
    element = document.createElement(tagName);
    document.head.appendChild(element);
  }

  const previous = {};
  Object.entries(attributes).forEach(([name, value]) => {
    previous[name] = element.getAttribute(name);
    element.setAttribute(name, value);
  });

  return () => {
    if (created) {
      element.remove();
      return;
    }
    Object.entries(previous).forEach(([name, value]) => {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    });
  };
};

const DocumentMetadata = ({ content, kind = "Article" }) => {
  const seo = content?.seo || {};
  const title = cleanText(seo.title || content?.title || kind, 120);
  const description = cleanText(seo.description || content?.description || content?.excerpt, 200);
  const canonicalUrl = safeUrl(seo.canonicalUrl, window.location.href);
  const imageUrl = safeUrl(seo.openGraphImage || content?.coverImage);
  const robots = /^(?:index|noindex),(?:follow|nofollow)$/i.test(seo.metaRobots || "")
    ? seo.metaRobots.toLowerCase()
    : "index,follow";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | MyJourney` : "MyJourney";

    const restore = [
      updateElement('meta[name="description"]', "meta", { name: "description", content: description }),
      updateElement('meta[name="robots"]', "meta", { name: "robots", content: robots }),
      updateElement('link[rel="canonical"]', "link", { rel: "canonical", href: canonicalUrl }),
      updateElement('meta[property="og:title"]', "meta", { property: "og:title", content: title }),
      updateElement('meta[property="og:description"]', "meta", { property: "og:description", content: description }),
      updateElement('meta[property="og:type"]', "meta", { property: "og:type", content: "article" }),
      updateElement('meta[property="og:url"]', "meta", { property: "og:url", content: canonicalUrl }),
      updateElement('meta[name="twitter:card"]', "meta", { name: "twitter:card", content: imageUrl ? "summary_large_image" : "summary" }),
      updateElement('meta[name="twitter:title"]', "meta", { name: "twitter:title", content: title }),
      updateElement('meta[name="twitter:description"]', "meta", { name: "twitter:description", content: description }),
    ];

    if (imageUrl) {
      restore.push(updateElement('meta[property="og:image"]', "meta", { property: "og:image", content: imageUrl }));
      restore.push(updateElement('meta[name="twitter:image"]', "meta", { name: "twitter:image", content: imageUrl }));
    }

    return () => {
      document.title = previousTitle;
      restore.reverse().forEach((restoreElement) => restoreElement());
    };
  }, [canonicalUrl, description, imageUrl, robots, title]);

  return null;
};

export default DocumentMetadata;
