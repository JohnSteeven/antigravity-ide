import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiClock, FiBookmark, FiList } from "react-icons/fi";
import StoryActions from "../StoryActions";

export default function StorySidebar({
  story,
  chapters = [],
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
  mode = "public",
  saved = false,
  copied = false,
  saving = false,
  saveDisabled = false,
  feedback = null,
  onSave = () => {},
  onShare = () => {},
  className = "",
}) {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleScroll = () => {
      const el = document.documentElement;
      const total = (el.scrollHeight || 0) - (el.clientHeight || 0);
      if (total > 0) {
        setReadingProgress(Math.min(100, Math.max(0, Math.round((window.scrollY / total) * 100))));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !chapters.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapterId(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
    );

    chapters.forEach((chapter) => {
      const el = document.getElementById(chapter.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  return (
    <aside className={`story-editorial-sidebar ${className}`.trim()} aria-label="Story Navigation and Details">
      <div className="story-editorial-sidebar__sticky">
        {showBackLink && (
          <nav className="story-editorial-sidebar__back" aria-label="Breadcrumb">
            <Link to={backHref}>
              <FiArrowLeft aria-hidden="true" /> Back to Stories
            </Link>
          </nav>
        )}

        <div className="story-editorial-sidebar__header">
          {story.category && (
            <span className="story-editorial-sidebar__category">{story.category}</span>
          )}
          <h2 className="story-editorial-sidebar__title">{story.title}</h2>
          {story.description && (
            <p className="story-editorial-sidebar__deck">{story.description}</p>
          )}
        </div>

        <div className="story-editorial-sidebar__meta">
          <span className="story-editorial-sidebar__time">
            <FiClock aria-hidden="true" /> {readingMinutes} min read
          </span>
          <span className="story-editorial-sidebar__progress-val">
            {readingProgress}% complete
          </span>
        </div>

        <div className="story-editorial-sidebar__meter" role="progressbar" aria-valuenow={readingProgress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${readingProgress}%` }} />
        </div>

        {chapters.length >= 2 && (
          <nav className="story-editorial-sidebar__chapters" aria-label="Chapters">
            <div className="story-editorial-sidebar__chapters-label">
              <FiList aria-hidden="true" /> Chapters
            </div>
            <ol className="story-editorial-sidebar__chapter-list">
              {chapters.map((chapter, index) => {
                const isActive = activeChapterId === chapter.id || (!activeChapterId && index === 0);
                const title = chapter.chapterTitle || chapter.heading || `Chapter ${index + 1}`;
                const number = chapter.chapterNumber || String(index + 1).padStart(2, "0");

                return (
                  <li key={chapter.id || index} className={isActive ? "is-active" : ""}>
                    <a href={`#${chapter.id}`}>
                      <span className="story-editorial-sidebar__chapter-num">{number}</span>
                      <span className="story-editorial-sidebar__chapter-text">{title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {story.excerpt && (
          <div className="story-editorial-sidebar__motif">
            <p>"{story.excerpt}"</p>
          </div>
        )}

        {mode === "public" && (
          <div className="story-editorial-sidebar__actions">
            <StoryActions
              rail
              {...{ saved, copied, saving, saveDisabled, feedback, onSave, onShare }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

