import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";

export default function StoryCard({ story }) {
  if (!story) return null;

  const imageUrl = getImageUrl(story.coverImage || story.image);
  const readingTime = story.readingTime || `${story.readingTimeMin || 8} min read`;
  const title = story.title || "Untitled Story";
  const teaser = story.description || story.excerpt || "";

  return (
    <article className="story-card">
      {/* Thumbnail — supports atmosphere, title dominates */}
      <Link to={`/stories/${story.slug}`} className="story-card-image-wrap" aria-label={title} tabIndex={-1}>
        <img
          src={imageUrl}
          alt=""
          className="story-card-image"
          loading="lazy"
        />
      </Link>

      <div className="story-card-content">
        <Link to={`/stories/${story.slug}`} className="story-card-title">
          {title}
        </Link>

        {teaser && <p className="story-card-teaser">{teaser}</p>}

        <div className="story-card-footer">
          <span className="story-meta-time">{readingTime}</span>
          <Link to={`/stories/${story.slug}`} className="story-cta-link">
            Read story <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

