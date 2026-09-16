import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { FiClock, FiArrowLeft } from "react-icons/fi";
import StoryActions from "./StoryActions";
import StorySectionRenderer from "./StorySectionRenderer";
import {
  StoryFigure,
  StoryProse,
  StoryChapterHeader,
  StorySplitMoment,
  StoryWideMoment,
  StoryPullQuote,
  StoryChapterJourney,
  StorySidebar,
} from "./primitives";
import { STORY_ENGINES } from "../storyLayoutConfig";
import { STORY_SECTION_TYPES, stripStoryHtml } from "../storySections";
import { getImageUrl } from "../../utils/imageUrlHelper";

// ── Legacy / Fallback Support (For the other 7 layouts) ──────────────────────

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

const StoryRail = ({ media, layout, readingMinutes, saved, copied, saving, saveDisabled, feedback, onSave, onShare, mode, sections = [] }) => {
  const chapters = sections.filter((s) => s.type === STORY_SECTION_TYPES.CHAPTER && (s.chapterTitle || s.heading));
  const hasMedia = Boolean(media?.src);
  const hasChapters = chapters.length >= 2;
  const hasContent = hasMedia || hasChapters || mode === "public";

  if (!hasContent) return null;

  return (
    <aside className={`story-reader__rail story-reader__rail--${layout.railStyle || "standard"}`} aria-label="Story information">
      {hasMedia && (
        <figure className={`story-reader__rail-image story-reader__rail-image--${layout.mediaStyle || "supporting"}`}>
          <img src={getImageUrl(media.src)} alt={media.alt || ""} loading={mode === "public" ? "eager" : "lazy"} width="560" height="720" />
          {media.caption && <figcaption>{media.caption}</figcaption>}
        </figure>
      )}
      <div className="story-reader__rail-meta"><FiClock aria-hidden="true" /> {readingMinutes} min read</div>
      {hasChapters && (
        <nav className="story-reader__rail-chapters" aria-label="Chapter quick navigation">
          <span className="story-reader__rail-chapters-title">Chapters</span>
          <ol>
            {chapters.slice(0, 10).map((chapter, index) => (
              <li key={chapter.id || index}>
                <a href={`#${chapter.id}`}>{chapter.chapterNumber || String(index + 1).padStart(2, "0")} {chapter.chapterTitle || chapter.heading}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {mode === "public" && (
        <StoryActions rail {...{ saved, copied, saving, saveDisabled, feedback, onSave, onShare }} />
      )}
    </aside>
  );
};

// ── 1. Gold Standard A: Chapter Journey (Story 1) ────────────────────────────

const ChapterJourneyLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const chapters = sections.filter(
    (s) => s.type === STORY_SECTION_TYPES.CHAPTER && (s.chapterTitle || s.heading)
  );

  const coverImage = story.coverImage || sections.find((s) => s.image)?.image;

  let chapterCounter = 0;

  return (
    <div className="story-journey-layout">
      {/* 1. Split Editorial Header (Gold Standard A) */}
      <header className="story-split-editorial-header">
        <div className="story-split-editorial-header__meta-column">
          {showBackLink && (
            <nav className="story-split-editorial-header__back" aria-label="Breadcrumb">
              <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
            </nav>
          )}
          <div className="story-split-editorial-header__kicker">
            {story.category ? `${story.category.toUpperCase()} · ` : ""}
            {readingMinutes} MIN READ
          </div>
          <h1 className="story-split-editorial-header__title">{story.title}</h1>
          {story.description && (
            <p className="story-split-editorial-header__subtitle">{story.description}</p>
          )}
          <div className="story-split-editorial-header__author">
            <span>By {story.author || "Noble John Steeven"}</span>
          </div>
        </div>
        {coverImage && (
          <div className="story-split-editorial-header__media-column">
            <StoryFigure
              image={coverImage}
              alt={story.coverImageAlt || story.title}
              caption={story.coverImageCaption}
              aspectRatio="4:5"
              presentation="split"
              eager={true}
            />
          </div>
        )}
      </header>

      {chapters.length >= 2 && (
        <StoryChapterJourney chapters={chapters} />
      )}

      <div className="story-journey-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            chapterCounter++;
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;
            // Intentional alternating rhythm for chapters with images: right, left, right...
            const imageSide = section._storyPlacement === "left" || (chapterCounter % 2 === 0) ? "left" : "right";

            const chapterHeaderNode = (
              <StoryChapterHeader
                chapterNumber={section.chapterNumber || String(chapterCounter).padStart(2, "0")}
                chapterTitle={section.chapterTitle || section.heading}
              />
            );

            if (hasImage) {
              return (
                <StorySplitMoment
                  key={section.id || index}
                  id={section.id}
                  imageSide={imageSide}
                  proportion="55-45"
                  className="story-journey-moment"
                  text={
                    <div className="story-journey-text">
                      {chapterHeaderNode}
                      <StoryProse body={section.body} dropCap={true} />
                    </div>
                  }
                  figure={
                    <StoryFigure
                      image={section.image}
                      alt={section.alt}
                      caption={section.caption}
                      presentation="split"
                      eager={eager}
                    />
                  }
                />
              );
            }

            return (
              <section key={section.id || index} id={section.id} className="story-reader__section story-reader__section--prose story-journey-prose-section">
                {chapterHeaderNode}
                <StoryProse body={section.body} dropCap={true} />
              </section>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-reader__scene-break story-reader__scene-break--ornate" role="separator" aria-label="Scene break">
                <span className="story-reader__scene-break-mark">• • •</span>
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE) {
            return (
              <StoryPullQuote
                key={section.id || index}
                quote={section.quote}
                attribution={section.attribution}
                source={section.quoteSource}
              />
            );
          }

          if (section.type === STORY_SECTION_TYPES.CALLOUT) {
            return <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />;
          }

          if (section.type === STORY_SECTION_TYPES.DIALOGUE) {
            return <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />;
          }

          // Plain text or split text sections
          if (section.image && stripStoryHtml(section.body || "").length >= 20) {
            return (
              <StorySplitMoment
                key={section.id || index}
                id={section.id}
                imageSide={section._storyPlacement === "left" ? "left" : "right"}
                text={
                  <div className="story-journey-text">
                    {section.heading && <h3>{section.heading}</h3>}
                    <StoryProse body={section.body} />
                  </div>
                }
                figure={
                  <StoryFigure
                    image={section.image}
                    alt={section.alt}
                    caption={section.caption}
                    presentation="split"
                    eager={eager}
                  />
                }
              />
            );
          }

          return (
            <section key={section.id || index} className="story-reader__section story-reader__section--prose">
              {section.heading && <h3>{section.heading}</h3>}
              <StoryProse body={section.body} />
            </section>
          );
        })}
      </div>
    </div>
  );
};

// ── 2. Gold Standard B: Cinematic Rhythm (Story 6) ───────────────────────────

const CinematicRhythmLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const heroImage = story.coverImage || sections.find((s) => s.image)?.image;
  let imageCounter = 0;

  return (
    <div className="story-cinematic-layout">
      {/* Full/Wide Cinematic Hero */}
      <header className="story-cinematic-hero">
        {heroImage && (
          <div className="story-cinematic-hero__backdrop">
            <img
              src={getImageUrl(heroImage)}
              alt={story.coverImageAlt || ""}
              loading="eager"
            />
            <div className="story-cinematic-hero__overlay" />
          </div>
        )}
        <div className="story-cinematic-hero__content">
          {showBackLink && (
            <nav className="story-cinematic-hero__back" aria-label="Breadcrumb">
              <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
            </nav>
          )}
          <div className="story-cinematic-hero__meta">
            <span>Story</span>
            {story.category && <span aria-hidden="true">·</span>}
            {story.category && <span>{story.category}</span>}
            <span aria-hidden="true">·</span>
            <span>{readingMinutes} min read</span>
          </div>
          <h1 className="story-cinematic-hero__title">{story.title || "Untitled Story"}</h1>
          {story.description && (
            <p className="story-cinematic-hero__subtitle">{story.description}</p>
          )}
          {story.excerpt && (
            <blockquote className="story-cinematic-hero__quote">
              <p>"{story.excerpt}"</p>
            </blockquote>
          )}
        </div>
      </header>

      {/* Cinematic Rhythm Body Flow */}
      <div className="story-cinematic-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index < 2;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;

            if (hasImage) {
              imageCounter++;
              const isLandscape = section.imageSize === "landscape" || section._storyMediaStyle === "landscape";

              if (isLandscape && imageCounter % 2 === 1) {
                // Wide Visual Moment (1180-1300px)
                return (
                  <StoryWideMoment
                    key={section.id || index}
                    id={section.id}
                    introText={
                      <div className="story-cinematic-chapter-header">
                        {section.chapterNumber && <span className="story-cinematic-chapter-num">{section.chapterNumber}</span>}
                        <h2 className="story-cinematic-chapter-title">{section.chapterTitle || section.heading}</h2>
                        <StoryProse body={section.body} dropCap={true} />
                      </div>
                    }
                    figure={
                      <StoryFigure
                        image={section.image}
                        alt={section.alt}
                        caption={section.caption}
                        presentation="wide"
                        eager={eager}
                      />
                    }
                  />
                );
              }

              // Alternating Split: Left or Right
              const imageSide = imageCounter % 2 === 0 ? "left" : "right";
              return (
                <StorySplitMoment
                  key={section.id || index}
                  id={section.id}
                  imageSide={imageSide}
                  proportion="50-50"
                  className="story-cinematic-moment"
                  text={
                    <div className="story-cinematic-text">
                      {section.chapterNumber && <span className="story-cinematic-chapter-num">{section.chapterNumber}</span>}
                      <h2 className="story-cinematic-chapter-title">{section.chapterTitle || section.heading}</h2>
                      <StoryProse body={section.body} dropCap={true} />
                    </div>
                  }
                  figure={
                    <StoryFigure
                      image={section.image}
                      alt={section.alt}
                      caption={section.caption}
                      presentation="split"
                      eager={eager}
                    />
                  }
                />
              );
            }

            // Chapter without image -> Centered narrative intro or section
            return (
              <section key={section.id || index} id={section.id} className="story-reader__section story-reader__section--prose story-cinematic-prose-section">
                {section.chapterNumber && <span className="story-cinematic-chapter-num">{section.chapterNumber}</span>}
                <h2 className="story-cinematic-chapter-title">{section.chapterTitle || section.heading}</h2>
                <StoryProse body={section.body} dropCap={true} />
              </section>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-reader__scene-break story-cinematic-scene-break" role="separator" aria-label="Scene transition">
                <span className="story-cinematic-scene-mark" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE) {
            return (
              <StoryPullQuote
                key={section.id || index}
                quote={section.quote}
                attribution={section.attribution}
                source={section.quoteSource}
                style="banner"
              />
            );
          }

          if (section.type === STORY_SECTION_TYPES.CALLOUT) {
            return <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />;
          }

          if (section.type === STORY_SECTION_TYPES.DIALOGUE) {
            return <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />;
          }

          // Plain text or media text
          if (section.image && stripStoryHtml(section.body || "").length >= 20) {
            imageCounter++;
            const imageSide = imageCounter % 2 === 0 ? "left" : "right";
            return (
              <StorySplitMoment
                key={section.id || index}
                id={section.id}
                imageSide={imageSide}
                text={
                  <div className="story-cinematic-text">
                    {section.heading && <h3>{section.heading}</h3>}
                    <StoryProse body={section.body} />
                  </div>
                }
                figure={
                  <StoryFigure
                    image={section.image}
                    alt={section.alt}
                    caption={section.caption}
                    presentation="split"
                    eager={eager}
                  />
                }
              />
            );
          }

          return (
            <section key={section.id || index} className="story-reader__section story-reader__section--prose">
              {section.heading && <h3>{section.heading}</h3>}
              <StoryProse body={section.body} />
            </section>
          );
        })}
      </div>
    </div>
  );
};

// ── 3. Gold Standard C: Editorial Sidebar (Story 4) ──────────────────────────

const EditorialSidebarLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
  saved,
  copied,
  saving,
  saveDisabled,
  feedback,
  onSave,
  onShare,
}) => {
  const chapters = sections.filter(
    (s) => s.type === STORY_SECTION_TYPES.CHAPTER && (s.chapterTitle || s.heading)
  );

  return (
    <div className="story-editorial-sidebar-layout">
      {/* 280-320px Sticky Story Rail */}
      <StorySidebar
        story={story}
        chapters={chapters}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
        mode={mode}
        saved={saved}
        copied={copied}
        saving={saving}
        saveDisabled={saveDisabled}
        feedback={feedback}
        onSave={onSave}
        onShare={onShare}
      />

      {/* Main Reader Canvas (1050-1200px max) */}
      <main className="story-editorial-sidebar-main">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;

            const chapterHeaderNode = (
              <StoryChapterHeader
                chapterNumber={section.chapterNumber}
                chapterTitle={section.chapterTitle || section.heading}
              />
            );

            if (hasImage) {
              return (
                <StorySplitMoment
                  key={section.id || index}
                  id={section.id}
                  imageSide="right"
                  proportion="55-45"
                  className="story-sidebar-split-moment"
                  text={
                    <div className="story-sidebar-text">
                      {chapterHeaderNode}
                      <StoryProse body={section.body} dropCap={true} />
                    </div>
                  }
                  figure={
                    <StoryFigure
                      image={section.image}
                      alt={section.alt}
                      caption={section.caption}
                      presentation="split"
                      eager={eager}
                    />
                  }
                />
              );
            }

            return (
              <section key={section.id || index} id={section.id} className="story-reader__section story-reader__section--prose story-sidebar-prose-section">
                {chapterHeaderNode}
                <StoryProse body={section.body} dropCap={true} />
              </section>
            );
          }

          if (section.type === STORY_SECTION_TYPES.CALLOUT) {
            return (
              <aside
                key={section.id || index}
                className={`story-reader__callout story-reader__callout--${section.calloutType || "note"}`}
                role="note"
                aria-label={`${section.heading || "Archival Note"}`}
              >
                {section.heading && <h4 className="story-reader__callout-title">{section.heading}</h4>}
                <StoryProse body={section.body} />
              </aside>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE) {
            return (
              <StoryPullQuote
                key={section.id || index}
                quote={section.quote}
                attribution={section.attribution}
                source={section.quoteSource}
              />
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-reader__scene-break" role="separator" aria-label="Scene break">
                • • •
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.DIALOGUE) {
            return <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />;
          }

          // Regular prose / text with optional companion image
          if (section.image && stripStoryHtml(section.body || "").length >= 20) {
            return (
              <StorySplitMoment
                key={section.id || index}
                id={section.id}
                imageSide="right"
                text={
                  <div className="story-sidebar-text">
                    {section.heading && <h3>{section.heading}</h3>}
                    <StoryProse body={section.body} />
                  </div>
                }
                figure={
                  <StoryFigure
                    image={section.image}
                    alt={section.alt}
                    caption={section.caption}
                    presentation="split"
                    eager={eager}
                  />
                }
              />
            );
          }

          return (
            <section key={section.id || index} className="story-reader__section story-reader__section--prose">
              {section.heading && <h3>{section.heading}</h3>}
              <StoryProse body={section.body} />
            </section>
          );
        })}
      </main>
    </div>
  );
};

// ── Main Dispatcher ──────────────────────────────────────────────────────────

export default function StoryLayoutRenderer({
  story,
  sections,
  layout,
  mode,
  readingMinutes,
  saved,
  copied,
  saving,
  saveDisabled,
  feedback,
  onSave,
  onShare,
  railMedia,
  backHref = "/stories",
  showBackLink = true,
}) {
  // Gate 1: Dispatch to dedicated Gold Standard implementations
  if (layout.id === "chapter-journey") {
    return (
      <ChapterJourneyLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "cinematic-rhythm") {
    return (
      <CinematicRhythmLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "editorial-sidebar") {
    return (
      <EditorialSidebarLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
        saved={saved}
        copied={copied}
        saving={saving}
        saveDisabled={saveDisabled}
        feedback={feedback}
        onSave={onSave}
        onShare={onShare}
      />
    );
  }

  // Fallback / Existing implementation for the other 7 layouts (PRESERVED INTACT)
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
        <StoryRail media={railMedia} sections={sections} {...{ layout, readingMinutes, saved, copied, saving, saveDisabled, feedback, onSave, onShare, mode }} />
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
