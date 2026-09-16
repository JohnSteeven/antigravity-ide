import React from "react";

const hasHtmlMarkup = (value = "") => /<[a-z][\s\S]*>/i.test(String(value));

export const sanitizeStoryHtml = (value = "") => {
  if (typeof document === "undefined") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
  }
  const template = document.createElement("template");
  template.innerHTML = String(value);
  template.content.querySelectorAll("script,style,object,embed,meta,link,base,form,input,button,svg,math").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const raw = attribute.value.trim();
      if (name.startsWith("on") || ["style", "srcdoc"].includes(name)) node.removeAttribute(attribute.name);
      if (["href", "src"].includes(name) && /^(?:javascript|data|vbscript):/i.test(raw)) node.removeAttribute(attribute.name);
    });
    if (node.tagName === "IFRAME") {
      try {
        const url = new URL(node.getAttribute("src"), window.location.origin);
        if (!["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"].includes(url.hostname)) node.remove();
      } catch (_error) {
        node.remove();
      }
    }
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  return template.innerHTML;
};

const renderParagraphWithDropCap = (text, key) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Match optional leading quote/punctuation followed by first alphabetic character
  const match = trimmed.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9])(.*)$/s);
  if (!match) {
    return <p key={key}>{trimmed}</p>;
  }

  const [, leadingPunct, firstChar, remainder] = match;
  return (
    <p key={key} className="story-prose__paragraph--lead">
      <span className="story-dropcap">
        {leadingPunct}{firstChar}
      </span>
      {remainder}
    </p>
  );
};

export default function StoryProse({
  body,
  dropCap = false,
  className = "",
}) {
  if (!body) return null;

  if (hasHtmlMarkup(body)) {
    return (
      <div
        className={`story-reader__prose story-prose ${dropCap ? "story-prose--has-dropcap" : ""} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(body) }}
      />
    );
  }

  const paragraphs = String(body).split(/\n{2,}/).filter(Boolean);

  return (
    <div className={`story-reader__prose story-prose ${dropCap ? "story-prose--has-dropcap" : ""} ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => {
        if (dropCap && index === 0) {
          return renderParagraphWithDropCap(paragraph, `p-${index}`);
        }
        return <p key={`p-${index}`}>{paragraph}</p>;
      })}
    </div>
  );
}

