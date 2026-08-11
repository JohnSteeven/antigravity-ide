import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiBookmark, FiShare2 } from "react-icons/fi";
import StoryLayoutRenderer from "./StoryLayoutRenderer";
import { calculateStoryReadingTime, normalizeStorySections, STORY_SECTION_TYPES } from "../storySections";
import { getStoryLayoutConfig } from "../storyLayoutConfig";
import storyComposition from "../storyComposition.cjs";
import "../story-reader.css";

const { composeStoryLayout } = storyComposition;

const formatStoryDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export const StoryHeader = ({ story, readingMinutes, backHref = "/stories", showBackLink = true, showDescription = true }) => (
  <>
    {showBackLink && (
      <nav className="story-reader__back" aria-label="Breadcrumb">
        <Link to={backHref}><FiArrowLeft aria-hidden="true" /> Back to Stories</Link>
      </nav>
    )}
    <header className="story-reader__header">
      <div className="story-reader__meta" aria-label="Story details">
        <span>Story</span>
        <span aria-hidden="true">·</span>
        <span>{readingMinutes} min read</span>
        {formatStoryDate(story.publishedAt) && <span aria-hidden="true">·</span>}
        {formatStoryDate(story.publishedAt) && <time dateTime={story.publishedAt}>{formatStoryDate(story.publishedAt)}</time>}
      </div>
      <h1>{story.title || "Untitled Story"}</h1>
      {showDescription && story.description && <p>{story.description}</p>}
    </header>
  </>
);

const ReadingProgress = ({ enabled }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const update = () => {
      const root = document.documentElement;
      const distance = Math.max(1, root.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / distance)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="story-reader__progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>;
};

const BottomActions = ({ saved, copied, onSave, onShare }) => (
  <div className="story-reader__actions" aria-label="Story actions">
    <button type="button" onClick={onSave} aria-pressed={saved}><FiBookmark aria-hidden="true" />{saved ? "Saved to reading list" : "Save story"}</button>
    <button type="button" onClick={onShare}><FiShare2 aria-hidden="true" />{copied ? "Link copied" : "Share story"}</button>
  </div>
);

export default function StoryEngine({
  story,
  mode = "public",
  backHref = "/stories",
  showBackLink = true,
  saved = false,
  copied = false,
  onSave = () => {},
  onShare = () => {},
}) {
  const layout = useMemo(() => getStoryLayoutConfig(story.storyLayout), [story.storyLayout]);
  const normalizedSections = useMemo(() => normalizeStorySections(story.storySections), [story.storySections]);
  const composition = useMemo(() => composeStoryLayout(story, normalizedSections, layout), [layout, normalizedSections, story]);
  const sections = composition.sections;
  const readingMinutes = useMemo(() => calculateStoryReadingTime({ ...story, storySections: sections }), [story, sections]);
  const hasReflectionSection = sections.some((section) => section.type === STORY_SECTION_TYPES.REFLECTION);
  const sideRail = layout.engine === "side-rail";

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[StoryEngine]", { slug: story.slug, ...composition.diagnostics });
    }
  }, [composition.diagnostics, story.slug]);

  return (
    <article
      className={`story-reader story-reader--${layout.engine} story-reader--preset-${layout.id} story-reader--${mode}`}
      data-story-layout={layout.id}
      data-story-engine={layout.engine}
      data-story-mode="structured"
      data-story-preset={layout.id}
    >
      <ReadingProgress enabled={mode === "public" && readingMinutes >= 15} />
      <div className="story-reader__shell">
        <StoryHeader {...{ story, readingMinutes, backHref, showBackLink }} />
        <StoryLayoutRenderer {...{ story, sections, layout, mode, readingMinutes, saved, copied, onSave, onShare }} railMedia={composition.railMedia} />

        {story.reflection && !hasReflectionSection && (
          <aside className="story-reader__reflection story-reader__reflection--ending">
            <span>A thought to carry with you</span>
            <p>{story.reflection}</p>
          </aside>
        )}

        {mode === "public" && !sideRail && <BottomActions {...{ saved, copied, onSave, onShare }} />}
      </div>
    </article>
  );
}
