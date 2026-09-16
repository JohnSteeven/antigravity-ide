import React from "react";

export default function StoryPullQuote({
  quote,
  attribution,
  source,
  style = "editorial", // 'editorial' | 'banner' | 'aside'
  className = "",
}) {
  if (!quote) return null;

  return (
    <blockquote className={`story-pull-quote story-pull-quote--${style} ${className}`.trim()}>
      <p className="story-pull-quote__text">{quote}</p>
      {(attribution || source) && (
        <cite className="story-pull-quote__cite">
          {attribution && <span className="story-pull-quote__author">{attribution}</span>}
          {source && <span className="story-pull-quote__source">{source}</span>}
        </cite>
      )}
    </blockquote>
  );
}

