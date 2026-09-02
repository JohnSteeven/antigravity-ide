import React from "react";
import { FiBookmark, FiShare2 } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import { calculateStoryReadingTime } from "../storySections";
import storyMedia from "../storyMedia.cjs";
import { getStoryLayoutConfig } from "../storyLayoutConfig";
import { StoryHeader } from "./StoryEngine";
import "../story-reader.css";

const { resolveStoryPrimaryImage } = storyMedia;

export default function LegacyStoryReader({ story, saved, copied, onSave, onShare, mode = "public", showBackLink = true }) {
  const readingMinutes = calculateStoryReadingTime(story);
  const layout = getStoryLayoutConfig(story.storyLayout);
  const media = resolveStoryPrimaryImage(story, { includeSectionImages: false });
  const imageUrl = getImageUrl(media?.src);
  const openingText = story.description || story.excerpt || story.storyOrigin || story.title || "";
  const isSplitLegacyLayout = layout.engine === "split-right" || layout.engine === "split-left";
  const isRailLegacyLayout = layout.engine === "side-rail";
  const moveDescriptionToOpening = Boolean(isSplitLegacyLayout && imageUrl && openingText && openingText === story.description);
  const openingImageLeft = layout.engine === "split-left" || (isSplitLegacyLayout && layout.imagePattern?.[0] === "left");
  const bodyMarkup = story.body || "<p></p>";
  const legacyFigure = imageUrl ? (
    <figure className="story-reader__legacy-media">
      <img src={imageUrl} alt={media?.alt || ""} loading="eager" decoding="async" width="800" height="600" />
      {media?.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  ) : null;

  return (
    <article
      className={`story-reader story-reader--legacy story-reader--${layout.engine} story-reader--preset-${layout.id} story-reader--${mode}`}
      data-story-layout={layout.id}
      data-story-engine={layout.engine}
      data-story-mode="legacy"
      data-story-preset={layout.id}
    >
      <div className="story-reader__shell">
        <StoryHeader story={story} readingMinutes={readingMinutes} showBackLink={showBackLink} showDescription={!moveDescriptionToOpening} />
        <div className={`story-reader__legacy-flow${isRailLegacyLayout ? " story-reader__legacy-flow--rail" : ""}`}>
          {imageUrl && isSplitLegacyLayout && (
            <section className={`story-reader__legacy-opening${openingImageLeft ? " story-reader__legacy-opening--image-left" : ""}`} aria-label="Story opening">
              <div className="story-reader__legacy-opening-copy">
                <p>{openingText}</p>
              </div>
              {legacyFigure}
            </section>
          )}
          {imageUrl && !isSplitLegacyLayout && !isRailLegacyLayout && (
            <div className="story-reader__legacy-inline-media" aria-label="Story image">{legacyFigure}</div>
          )}
          {isRailLegacyLayout ? (
            <div className="story-reader__legacy-rail-layout">
              <div className="story-reader__legacy-body" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
              <aside className={`story-reader__rail story-reader__rail--${layout.railStyle || "standard"}`} aria-label="Story information">
                {legacyFigure && (
                  <figure className={`story-reader__rail-image story-reader__rail-image--${layout.mediaStyle || "supporting"}`}>
                    <img src={imageUrl} alt={media?.alt || ""} loading="eager" decoding="async" width="560" height="720" />
                    {media?.caption && <figcaption>{media.caption}</figcaption>}
                  </figure>
                )}
              </aside>
            </div>
          ) : (
            <div className="story-reader__legacy-body" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
          )}
        </div>

        {story.reflection && (
          <aside className="story-reader__reflection story-reader__reflection--ending">
            <span>A thought to carry with you</span>
            <p>{story.reflection}</p>
          </aside>
        )}

        {mode === "public" && <div className="story-reader__actions" aria-label="Story actions">
          <button type="button" onClick={onSave} aria-pressed={saved}><FiBookmark aria-hidden="true" />{saved ? "Saved to reading list" : "Save story"}</button>
          <button type="button" onClick={onShare}><FiShare2 aria-hidden="true" />{copied ? "Link copied" : "Share story"}</button>
        </div>}
      </div>
    </article>
  );
}
