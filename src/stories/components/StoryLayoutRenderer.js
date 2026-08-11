import React from "react";
import { FiBookmark, FiClock, FiShare2 } from "react-icons/fi";
import StorySectionRenderer from "./StorySectionRenderer";
import { STORY_ENGINES } from "../storyLayoutConfig";
import { STORY_SECTION_TYPES } from "../storySections";
import { getImageUrl } from "../../utils/imageUrlHelper";

const isBookPairCandidate = (section) => (
  [STORY_SECTION_TYPES.TEXT, STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT, STORY_SECTION_TYPES.CHAPTER].includes(section.type)
  && !["right", "left", "rail"].includes(section._storyPlacement)
);

const renderStandardFlow = (sections, mode) => (
  <div className="story-reader__main-flow">
    {sections.map((section, index) => (
      <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
    ))}
  </div>
);

const renderBookFlow = (sections, mode) => {
  const nodes = [];
  let index = 0;

  while (index < sections.length) {
    const first = sections[index];
    const second = sections[index + 1];
    if (isBookPairCandidate(first) && isBookPairCandidate(second)) {
      nodes.push(
        <div className="story-reader__book-pair" key={`book-pair-${first.id || index}`}>
          <StorySectionRenderer section={first} index={index} mode={mode} bookCell />
          <StorySectionRenderer section={second} index={index + 1} mode={mode} bookCell />
        </div>
      );
      index += 2;
    } else {
      nodes.push(<StorySectionRenderer key={first.id || index} section={first} index={index} mode={mode} />);
      index += 1;
    }
  }

  return <div className="story-reader__main-flow story-reader__main-flow--book">{nodes}</div>;
};

const ChapterNavigation = ({ sections }) => {
  const chapters = sections.filter((section) => section.type === STORY_SECTION_TYPES.CHAPTER && section.chapterTitle);
  if (chapters.length < 3) return null;

  return (
    <nav className="story-reader__chapter-nav" aria-label="Story chapters">
      <span>Chapters</span>
      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id || index}>
            <a href={`#${chapter.id}`}>{chapter.chapterNumber || String(index + 1).padStart(2, "0")} {chapter.chapterTitle}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

const StoryRail = ({ media, layout, readingMinutes, saved, copied, onSave, onShare, mode }) => {
  return (
    <aside className={`story-reader__rail story-reader__rail--${layout.railStyle || "standard"}`} aria-label="Story information">
    {media && (
      <figure className={`story-reader__rail-image story-reader__rail-image--${layout.mediaStyle || "supporting"}`}>
        <img src={getImageUrl(media.src)} alt={media.alt || ""} loading={mode === "public" ? "eager" : "lazy"} width="560" height="720" />
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    )}
    <div className="story-reader__rail-meta"><FiClock aria-hidden="true" /> {readingMinutes} min read</div>
    {mode === "public" && (
      <div className="story-reader__rail-actions">
        <button type="button" onClick={onSave} aria-pressed={saved}><FiBookmark aria-hidden="true" />{saved ? "Saved" : "Save story"}</button>
        <button type="button" onClick={onShare}><FiShare2 aria-hidden="true" />{copied ? "Link copied" : "Share story"}</button>
      </div>
    )}
    </aside>
  );
};

export default function StoryLayoutRenderer({ sections, layout, mode, readingMinutes, saved, copied, onSave, onShare, railMedia }) {
  const showChapterNavigation = layout.engine === STORY_ENGINES.CHAPTER_FLOW && readingMinutes >= 15;
  const content = layout.engine === STORY_ENGINES.BOOK_COLUMNS
    ? renderBookFlow(sections, mode)
    : renderStandardFlow(sections, mode);

  if (layout.engine === STORY_ENGINES.SIDE_RAIL) {
    return (
      <div className="story-reader__layout story-reader__layout--rail">
        <div>
          {showChapterNavigation && <ChapterNavigation sections={sections} />}
          {content}
        </div>
        <StoryRail media={railMedia} {...{ layout, readingMinutes, saved, copied, onSave, onShare, mode }} />
      </div>
    );
  }

  return (
    <div className="story-reader__layout">
      {showChapterNavigation && <ChapterNavigation sections={sections} />}
      {content}
    </div>
  );
}
