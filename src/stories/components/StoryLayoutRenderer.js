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

// ── 4. Alternating Editorial Layout (Story 2) ────────────────────────────────

const AlternatingEditorialLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const coverImage = story.coverImage || sections.find((s) => s.image)?.image;
  let imageMomentIndex = 0;

  return (
    <div className="story-alternating-layout">
      <header className="story-split-editorial-header story-alternating-header">
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

      <div className="story-alternating-flow">
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
              imageMomentIndex++;
              // Asymmetric ratios: 55-45, 45-55, 60-40 alternating
              const proportions = ["55-45", "45-55", "60-40"];
              const proportion = proportions[(imageMomentIndex - 1) % proportions.length];
              const imageSide = (imageMomentIndex % 2 === 1) ? "left" : "right";

              return (
                <StorySplitMoment
                  key={section.id || index}
                  id={section.id}
                  imageSide={imageSide}
                  proportion={proportion}
                  className="story-alternating-moment"
                  text={
                    <div className="story-alternating-text">
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
              <section key={section.id || index} id={section.id} className="story-reader__section story-reader__section--prose story-alternating-prose-section">
                {chapterHeaderNode}
                <StoryProse body={section.body} dropCap={index === 0 || Boolean(section.chapterTitle)} />
              </section>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-editorial-scene-break" aria-hidden="true">
                <span className="story-editorial-scene-break__mark" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <StoryPullQuote
                key={section.id || index}
                quote={section.quote || section.body}
                attribution={section.attribution || section.author}
                style="editorial"
              />
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 5. Scene By Scene Layout (Story 3) ────────────────────────────────────────

const SceneBySceneLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  let sceneIndex = 0;

  return (
    <div className="story-scene-layout">
      <header className="story-scene-header">
        {showBackLink && (
          <nav className="story-scene-header__back" aria-label="Breadcrumb">
            <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
          </nav>
        )}
        <div className="story-scene-header__badge">
          {story.category ? `${story.category.toUpperCase()} · ` : ""}
          NARRATIVE IN SCENES · {readingMinutes} MIN READ
        </div>
        <h1 className="story-scene-header__title">{story.title}</h1>
        {story.description && (
          <p className="story-scene-header__deck">{story.description}</p>
        )}
        <div className="story-scene-header__meta">
          <span>By {story.author || "Noble John Steeven"}</span>
        </div>
      </header>

      <div className="story-scene-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            sceneIndex++;
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;
            const title = section.chapterTitle || section.heading || `Scene ${sceneIndex}`;

            const imageSide = (sceneIndex % 2 === 1) ? "right" : "left";
            const proportion = (sceneIndex % 3 === 0) ? "60-40" : (sceneIndex % 2 === 1 ? "55-45" : "45-55");

            const sceneIndicator = (
              <div className="story-scene-marker">
                <span className="story-scene-marker__pill">SCENE {String(sceneIndex).padStart(2, "0")}</span>
                <h2 className="story-scene-marker__title">{title}</h2>
              </div>
            );

            if (hasImage) {
              return (
                <article key={section.id || index} id={section.id} className="story-scene-item story-scene-item--with-media">
                  <StorySplitMoment
                    imageSide={imageSide}
                    proportion={proportion}
                    className="story-scene-moment"
                    text={
                      <div className="story-scene-text">
                        {sceneIndicator}
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
                </article>
              );
            }

            return (
              <article key={section.id || index} id={section.id} className="story-scene-item story-scene-item--prose-only story-scene-prose-section">
                {sceneIndicator}
                <StoryProse body={section.body} dropCap={true} />
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-scene-break-divider" aria-hidden="true">
                <span className="story-scene-break-divider__line" />
                <span className="story-scene-break-divider__dot" />
                <span className="story-scene-break-divider__line" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <StoryPullQuote
                key={section.id || index}
                quote={section.quote || section.body}
                attribution={section.attribution || section.author}
                style="editorial"
              />
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 6. Book Page Layout (Story 5) ────────────────────────────────────────────

const BookPageLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  let pageCounter = 0;

  return (
    <div className="story-book-layout">
      <header className="story-book-header">
        {showBackLink && (
          <nav className="story-book-header__back" aria-label="Breadcrumb">
            <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
          </nav>
        )}
        <div className="story-book-header__kicker">
          {story.category ? `${story.category.toUpperCase()} · ` : ""}
          {readingMinutes} MIN READ
        </div>
        <h1 className="story-book-header__title">{story.title}</h1>
        <div className="story-book-header__ornament" aria-hidden="true">❦</div>
        {story.description && (
          <p className="story-book-header__deck">{story.description}</p>
        )}
        <div className="story-book-header__byline">
          <span>{story.author || "Noble John Steeven"}</span>
        </div>
      </header>

      <div className="story-book-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            pageCounter++;
            const title = section.chapterTitle || section.heading;
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;

            const bookChapterHeader = (
              <div className="story-book-chapter-header">
                <span className="story-book-chapter-num">CHAPTER {String(pageCounter).padStart(2, "0")}</span>
                {title && <h2 className="story-book-chapter-title">{title}</h2>}
                <div className="story-book-chapter-rule" aria-hidden="true" />
              </div>
            );

            return (
              <article key={section.id || index} id={section.id} className="story-book-chapter">
                {bookChapterHeader}
                {hasImage && (
                  <div className="story-book-bookplate">
                    <StoryFigure
                      image={section.image}
                      alt={section.alt}
                      caption={section.caption}
                      presentation="bookplate"
                      eager={eager}
                    />
                  </div>
                )}
                <StoryProse body={section.body} dropCap={true} />
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-book-scene-break" aria-hidden="true">
                <span className="story-book-scene-break__ornament">❦</span>
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <div key={section.id || index} className="story-book-quote-container">
                <StoryPullQuote
                  quote={section.quote || section.body}
                  attribution={section.attribution || section.author}
                  style="banner"
                />
              </div>
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 7. Letter Memory Layout (Story 7) ────────────────────────────────────────

const LetterMemoryLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  let letterCounter = 0;

  return (
    <div className="story-letter-layout">
      <header className="story-letter-header">
        {showBackLink && (
          <nav className="story-letter-header__back" aria-label="Breadcrumb">
            <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
          </nav>
        )}
        <div className="story-letter-header__postmark">
          <span>CONFIDENTIAL MEMORANDUM · {readingMinutes} MIN READ</span>
        </div>
        <h1 className="story-letter-header__title">{story.title}</h1>
        {story.description && (
          <p className="story-letter-header__deck">{story.description}</p>
        )}
        <div className="story-letter-header__meta">
          <span>From the papers of {story.author || "Noble John Steeven"}</span>
        </div>
        <div className="story-letter-header__seal" aria-hidden="true" />
      </header>

      <div className="story-letter-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            letterCounter++;
            const title = section.chapterTitle || section.heading;
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;

            const letterHeader = (
              <div className="story-letter-chapter-header">
                <div className="story-letter-date-marker">
                  <span className="story-letter-date-marker__num">PART {String(letterCounter).padStart(2, "0")}</span>
                  {title && <span className="story-letter-date-marker__label">{title}</span>}
                </div>
              </div>
            );

            if (hasImage) {
              return (
                <article key={section.id || index} id={section.id} className="story-letter-entry story-letter-entry--with-artifact">
                  <StorySplitMoment
                    imageSide={letterCounter % 2 === 0 ? "left" : "right"}
                    proportion="55-45"
                    className="story-letter-moment"
                    text={
                      <div className="story-letter-text">
                        {letterHeader}
                        <StoryProse body={section.body} dropCap={true} />
                      </div>
                    }
                    figure={
                      <div className="story-letter-artifact-frame">
                        <StoryFigure
                          image={section.image}
                          alt={section.alt}
                          caption={section.caption}
                          presentation="split"
                          eager={eager}
                        />
                      </div>
                    }
                  />
                </article>
              );
            }

            return (
              <article key={section.id || index} id={section.id} className="story-letter-entry story-letter-entry--prose-only story-letter-prose-section">
                {letterHeader}
                <StoryProse body={section.body} dropCap={true} />
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-letter-divider" aria-hidden="true">
                <span className="story-letter-divider__line" />
                <span className="story-letter-divider__stamp">✉</span>
                <span className="story-letter-divider__line" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <div key={section.id || index} className="story-letter-inset-quote">
                <StoryPullQuote
                  quote={section.quote || section.body}
                  attribution={section.attribution || section.author}
                  style="aside"
                />
              </div>
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 8. Triple Rhythm Layout (Story 8) ─────────────────────────────────────────

const TripleRhythmLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const coverImage = story.coverImage || sections.find((s) => s.image)?.image;

  const getMovementInfo = (section, index) => {
    const title = (section.chapterTitle || section.heading || "").toLowerCase();
    if (title.includes("movement three") || title.includes("true ledger") || title.includes("filter coffee")) {
      return { num: 3, label: "Movement III", title: "The True Ledger & Recovery" };
    }
    if (title.includes("movement two") || title.includes("seed check") || title.includes("series a") || title.includes("founder circle") || title.includes("down-round")) {
      return { num: 2, label: "Movement II", title: "The Series A Shift & Escalation" };
    }
    if (title.includes("movement one") || title.includes("terrace of equals") || title.includes("whiteboard") || index === 0) {
      return { num: 1, label: "Movement I", title: "The Terrace of Equals" };
    }
    return null;
  };

  let activeMovement = 1;
  let splitCounter = 0;

  return (
    <div className="story-triple-layout">
      <header className="story-triple-header">
        <div className="story-triple-header__inner">
          {showBackLink && (
            <nav className="story-triple-header__back" aria-label="Breadcrumb">
              <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
            </nav>
          )}
          <div className="story-triple-header__meta-strip">
            <span className="story-triple-header__kicker">
              {story.category ? `${story.category.toUpperCase()} · ` : ""}
              {readingMinutes} MIN READ · THREE MOVEMENTS
            </span>
          </div>
          <h1 className="story-triple-header__title">{story.title}</h1>
          {story.description && (
            <p className="story-triple-header__deck">{story.description}</p>
          )}
          <div className="story-triple-header__author">
            <span>By {story.author || "Noble John Steeven"}</span>
          </div>
        </div>
        {coverImage && (
          <div className="story-triple-header__hero">
            <StoryFigure
              image={coverImage}
              alt={story.coverImageAlt || story.title}
              caption={story.coverImageCaption || (sections[0]?.caption)}
              aspectRatio="16:9"
              presentation="wide"
              eager={true}
            />
          </div>
        )}
      </header>

      <div className="story-triple-flow">
        {sections.map((section, index) => {
          const eager = mode === "public" && index === 0;
          const movementMeta = getMovementInfo(section, index);
          if (movementMeta && movementMeta.num !== activeMovement) {
            activeMovement = movementMeta.num;
          }

          if (section.type === STORY_SECTION_TYPES.CHAPTER) {
            const hasImage = Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;

            const movementHeader = movementMeta && (
              <div className="story-triple-movement-badge">
                <span className="story-triple-movement-badge__num">{movementMeta.label}</span>
                <span className="story-triple-movement-badge__divider">—</span>
                <span className="story-triple-movement-badge__title">{movementMeta.title}</span>
              </div>
            );

            const chapterHeaderNode = (
              <StoryChapterHeader
                chapterNumber={section.chapterNumber}
                chapterTitle={section.chapterTitle || section.heading}
              />
            );

            // Movement 1: Wide establishing moments
            if (activeMovement === 1) {
              if (hasImage) {
                return (
                  <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-1">
                    {movementHeader}
                    <div className="story-triple-prose-container">
                      {chapterHeaderNode}
                      <StoryProse body={section.body} dropCap={true} />
                    </div>
                    <div className="story-triple-wide-visual">
                      <StoryFigure
                        image={section.image}
                        alt={section.alt}
                        caption={section.caption}
                        presentation="wide"
                        eager={eager}
                      />
                    </div>
                  </article>
                );
              }
              return (
                <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-1 story-triple-prose-only">
                  {movementHeader}
                  <div className="story-triple-prose-container">
                    {chapterHeaderNode}
                    <StoryProse body={section.body} dropCap={true} />
                  </div>
                </article>
              );
            }

            // Movement 2: Sharp, tense editorial split moments
            if (activeMovement === 2) {
              if (hasImage) {
                splitCounter++;
                const imageSide = splitCounter % 2 === 1 ? "left" : "right";
                return (
                  <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-2">
                    {movementHeader}
                    <StorySplitMoment
                      imageSide={imageSide}
                      proportion="55-45"
                      className="story-triple-split"
                      text={
                        <div className="story-triple-split-text">
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
                  </article>
                );
              }
              return (
                <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-2 story-triple-prose-only">
                  {movementHeader}
                  <div className="story-triple-prose-container">
                    {chapterHeaderNode}
                    <StoryProse body={section.body} dropCap={true} />
                  </div>
                </article>
              );
            }

            // Movement 3: Contemplative, quiet centered bookplate / reflective resolution
            if (hasImage) {
              return (
                <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-3">
                  {movementHeader}
                  <div className="story-triple-prose-container">
                    {chapterHeaderNode}
                    <StoryProse body={section.body} dropCap={true} />
                    <div className="story-triple-bookplate-visual">
                      <StoryFigure
                        image={section.image}
                        alt={section.alt}
                        caption={section.caption}
                        presentation="bookplate"
                        eager={eager}
                      />
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article key={section.id || index} id={section.id} className="story-triple-section story-triple-section--movement-3 story-triple-prose-only">
                {movementHeader}
                <div className="story-triple-prose-container">
                  {chapterHeaderNode}
                  <StoryProse body={section.body} dropCap={true} />
                </div>
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-triple-divider" aria-hidden="true">
                <span className="story-triple-divider__dot" />
                <span className="story-triple-divider__dot" />
                <span className="story-triple-divider__dot" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <div key={section.id || index} className="story-triple-quote">
                <StoryPullQuote
                  quote={section.quote || section.body}
                  attribution={section.attribution || section.author}
                  style="border"
                />
              </div>
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 9. Mixed Editorial Layout (Story 9) ────────────────────────────────────────

const MixedEditorialLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const coverImage = story.coverImage || sections.find((s) => s.image)?.image;
  let splitIndex = 0;

  return (
    <div className="story-mixed-layout">
      <header className="story-mixed-header">
        <div className="story-mixed-header__meta-column">
          {showBackLink && (
            <nav className="story-mixed-header__back" aria-label="Breadcrumb">
              <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
            </nav>
          )}
          <div className="story-mixed-header__kicker">
            {story.category ? `${story.category.toUpperCase()} · ` : ""}
            {readingMinutes} MIN READ · EDITORIAL ESSAY
          </div>
          <h1 className="story-mixed-header__title">{story.title}</h1>
          {story.description && (
            <p className="story-mixed-header__deck">{story.description}</p>
          )}
          <div className="story-mixed-header__byline">
            <span>By {story.author || "Noble John Steeven"}</span>
          </div>
        </div>
        {coverImage && (
          <div className="story-mixed-header__media-column">
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

      <div className="story-mixed-flow">
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
              // If inline placement or bookplate conclusion (like binoculars on desk)
              if (section.imagePlacement === "inline" || section.id === "sec-wd-15") {
                return (
                  <article key={section.id || index} id={section.id} className="story-mixed-section story-mixed-section--inline">
                    <div className="story-mixed-prose-container">
                      {chapterHeaderNode}
                      <StoryProse body={section.body} dropCap={true} />
                      <div className="story-mixed-inline-plate">
                        <StoryFigure
                          image={section.image}
                          alt={section.alt}
                          caption={section.caption}
                          presentation="bookplate"
                          eager={eager}
                        />
                      </div>
                    </div>
                  </article>
                );
              }

              // Asymmetric split moment with alternating side
              splitIndex++;
              const imageSide = section.imageSide || (splitIndex % 2 === 1 ? "right" : "left");
              const proportion = splitIndex % 2 === 1 ? "55-45" : "45-55";

              return (
                <article key={section.id || index} id={section.id} className="story-mixed-section story-mixed-section--split">
                  <StorySplitMoment
                    imageSide={imageSide}
                    proportion={proportion}
                    className="story-mixed-split-moment"
                    text={
                      <div className="story-mixed-split-text">
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
                </article>
              );
            }

            return (
              <article key={section.id || index} id={section.id} className="story-mixed-section story-mixed-section--prose">
                <div className="story-mixed-prose-container">
                  {chapterHeaderNode}
                  <StoryProse body={section.body} dropCap={true} />
                </div>
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-mixed-divider" aria-hidden="true">
                <span className="story-mixed-divider__ornament">✦</span>
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <div key={section.id || index} className="story-mixed-quote">
                <StoryPullQuote
                  quote={section.quote || section.body}
                  attribution={section.attribution || section.author}
                  style="border"
                />
              </div>
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
    </div>
  );
};

// ── 10. Alternating Wide Moment Layout (Story 10) ──────────────────────────────

const AlternatingWideMomentLayout = ({
  story,
  sections,
  mode,
  readingMinutes,
  backHref = "/stories",
  showBackLink = true,
}) => {
  const coverImage = story.coverImage || sections.find((s) => s.image)?.image;

  return (
    <div className="story-wide-layout">
      <header className="story-wide-header">
        <div className="story-wide-header__content">
          {showBackLink && (
            <nav className="story-wide-header__back" aria-label="Breadcrumb">
              <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
            </nav>
          )}
          <div className="story-wide-header__kicker">
            {story.category ? `${story.category.toUpperCase()} · ` : ""}
            {readingMinutes} MIN READ · ECONOMIC NARRATIVE
          </div>
          <h1 className="story-wide-header__title">{story.title}</h1>
          {story.description && (
            <p className="story-wide-header__deck">{story.description}</p>
          )}
          <div className="story-wide-header__byline">
            <span>By {story.author || "Noble John Steeven"}</span>
          </div>
        </div>
        {coverImage && (
          <div className="story-wide-header__hero">
            <StoryWideMoment
              id="wide-hero-moment"
              figure={
                <StoryFigure
                  image={coverImage}
                  alt={story.coverImageAlt || story.title}
                  caption={story.coverImageCaption || (sections[0]?.caption)}
                  presentation="wide"
                  eager={true}
                />
              }
            />
          </div>
        )}
      </header>

      <div className="story-wide-flow">
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
                <article key={section.id || index} id={section.id} className="story-wide-section story-wide-section--with-moment">
                  <div className="story-wide-prose-container">
                    {chapterHeaderNode}
                    <StoryProse body={section.body} dropCap={true} />
                  </div>
                  <div className="story-wide-moment-breakout">
                    <StoryWideMoment
                      id={`${section.id}-wide`}
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
                  </div>
                </article>
              );
            }

            return (
              <article key={section.id || index} id={section.id} className="story-wide-section story-wide-section--prose-only">
                <div className="story-wide-prose-container">
                  {chapterHeaderNode}
                  <StoryProse body={section.body} dropCap={true} />
                </div>
              </article>
            );
          }

          if (section.type === STORY_SECTION_TYPES.SCENE_BREAK) {
            return (
              <div key={section.id || index} className="story-wide-divider" aria-hidden="true">
                <span className="story-wide-divider__line" />
              </div>
            );
          }

          if (section.type === STORY_SECTION_TYPES.QUOTE || section.quote) {
            return (
              <div key={section.id || index} className="story-wide-quote-wrap">
                <StoryPullQuote
                  quote={section.quote || section.body}
                  attribution={section.attribution || section.author}
                  style="border"
                />
              </div>
            );
          }

          return (
            <StorySectionRenderer key={section.id || index} section={section} index={index} mode={mode} />
          );
        })}
      </div>
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

  // Batch A: Additional dedicated layouts
  if (layout.id === "alternating-editorial") {
    return (
      <AlternatingEditorialLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "scene-by-scene") {
    return (
      <SceneBySceneLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "book-page") {
    return (
      <BookPageLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "letter-memory") {
    return (
      <LetterMemoryLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  // Fallback / Existing implementation for the other 7 layouts (PRESERVED INTACT)
  // Batch B: Final 3 dedicated editorial layouts
  if (layout.id === "triple-rhythm") {
    return (
      <TripleRhythmLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "mixed-editorial") {
    return (
      <MixedEditorialLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  if (layout.id === "alternating-wide-moment") {
    return (
      <AlternatingWideMomentLayout
        story={story}
        sections={sections}
        mode={mode}
        readingMinutes={readingMinutes}
        backHref={backHref}
        showBackLink={showBackLink}
      />
    );
  }

  // Fallback / Existing implementation (PRESERVED INTACT)
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
