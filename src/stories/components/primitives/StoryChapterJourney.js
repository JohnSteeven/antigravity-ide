import React, { useEffect, useState } from "react";

export default function StoryChapterJourney({
  chapters = [],
  activeChapterId = null,
  className = "",
}) {
  const [activeId, setActiveId] = useState(activeChapterId || chapters[0]?.id);

  useEffect(() => {
    if (activeChapterId) {
      setActiveId(activeChapterId);
    }
  }, [activeChapterId]);

  useEffect(() => {
    if (typeof window === "undefined" || !chapters.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-10% 0px -65% 0px", threshold: 0 }
    );

    chapters.forEach((chapter) => {
      const el = document.getElementById(chapter.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  if (!chapters.length || chapters.length < 2) return null;

  const activeIndex = chapters.findIndex((c) => c.id === activeId);
  const activeLabel = activeIndex >= 0 ? ` — Chapter ${activeIndex + 1} of ${chapters.length}` : "";

  return (
    <nav
      className={`story-chapter-journey ${className}`.trim()}
      aria-label={`Story chapters${activeLabel}`}
    >
      <div className="story-chapter-journey__track">
        {chapters.map((chapter, index) => {
          const isActive = activeId === chapter.id || (!activeId && index === 0);
          const isPast = !isActive && activeIndex > index;
          const displayNumber = chapter.chapterNumber || String(index + 1).padStart(2, "0");
          const title = chapter.chapterTitle || chapter.heading || `Chapter ${index + 1}`;

          return (
            <React.Fragment key={chapter.id || index}>
              {index > 0 && (
                <span
                  className={`story-chapter-journey__connector ${isPast ? "is-past" : ""}`}
                  aria-hidden="true"
                />
              )}
              <a
                href={`#${chapter.id}`}
                className={`story-chapter-journey__node ${isActive ? "is-active" : ""} ${isPast ? "is-past" : ""}`}
                aria-current={isActive ? "step" : undefined}
                title={title}
              >
                <span className="story-chapter-journey__marker" />
                <span className="story-chapter-journey__number">{displayNumber}</span>
                <span className="story-chapter-journey__title">{title}</span>
              </a>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}


