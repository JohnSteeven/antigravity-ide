import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import storyMedia from "../storyMedia.cjs";

const { resolveStoryPrimaryImage } = storyMedia;

export default function FeaturedStory({ story }) {
  if (!story) return null;

  const media = resolveStoryPrimaryImage(story, { preferCover: true });
  const imageUrl = getImageUrl(media?.src);
  const readingTime = story.readingTime || `${story.readingTimeMin || 8} min read`;
  const title = story.title || "Untitled Story";
  const teaser = story.description || story.excerpt || "";

  const formattedDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }).toUpperCase()
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }).toUpperCase();

  return (
    <section className="todays-story-section" aria-label="Today's Story">
      <div className={`todays-story-layout${imageUrl ? "" : " todays-story-layout--text-only"}`}>
        {/* Content first in DOM — CSS order:1 keeps it visually left */}
        <div className="todays-story-content">
          <div className="todays-story-badge">
            <span className="todays-story-kicker">TODAY'S STORY</span>
            <span className="todays-story-date-sep">•</span>
            <span className="todays-story-date">{formattedDate}</span>
          </div>

          <Link to={`/stories/${story.slug}`} className="todays-story-title">
            {title}
          </Link>

          {teaser && <p className="todays-story-teaser">{teaser}</p>}

          <div className="todays-story-footer">
            <span className="story-meta-time">{readingTime}</span>
            <Link to={`/stories/${story.slug}`} className="story-cta-link">
              Read today's story <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Image second in DOM — CSS order:2 keeps it visually right */}
        {imageUrl && (
          <Link to={`/stories/${story.slug}`} className="todays-story-image-wrap" aria-label={title}>
            <img
              src={imageUrl}
              alt={media?.alt || ""}
              className="todays-story-image"
              width="720"
              height="540"
            />
          </Link>
        )}
      </div>
    </section>
  );
}
