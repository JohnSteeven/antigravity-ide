import React from "react";

export default function StoryChapterHeader({
  chapterNumber,
  chapterTitle,
  heading,
  subtitle,
  kicker,
  headingLevel = 2,
  className = "",
  id,
}) {
  const HeadingTag = `h${headingLevel}`;
  const title = chapterTitle || heading;
  if (!title && !chapterNumber && !kicker) return null;

  return (
    <header className={`story-chapter-header ${className}`.trim()} id={id}>
      {kicker && <div className="story-chapter-header__kicker">{kicker}</div>}
      {chapterNumber && (
        <span className="story-chapter-header__number">
          {/^chapter/i.test(chapterNumber) ? chapterNumber : `Chapter ${chapterNumber}`}
        </span>
      )}
      {title && <HeadingTag className="story-chapter-header__title">{title}</HeadingTag>}
      {subtitle && <p className="story-chapter-header__subtitle">{subtitle}</p>}
    </header>
  );
}

