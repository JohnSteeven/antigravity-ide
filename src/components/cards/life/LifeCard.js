import React from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiCalendar, FiEye, FiHeart, FiFeather } from "react-icons/fi";
import { getImageUrl, handleImageError } from "../../../utils/imageUrlHelper";

const LifeCard = ({ articleData }) => {
  if (!articleData) return null;

  const {
    title,
    slug,
    description,
    coverImage,
    image,
    publishedAt,
    category = "Life",
    subcategory,
    tags = [],
    readingTime = "5 min read",
    views = 0,
    likes = 0,
    author,
  } = articleData;

  const imageUrl = getImageUrl(image || coverImage, category);
  const authorName = typeof author === "object" ? author.name : (author || "Noble John Steeven");

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <article className="article-card life-card">
      <Link to={`/articles/${slug}`} className="life-card-image-wrapper">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onError={(e) => handleImageError(e, category)}
          className="life-card-image"
        />
        <span className="life-badge">
          <FiFeather /> {subcategory || "Editorial"}
        </span>
      </Link>

      <div className="life-card-content">
        <div className="life-card-header">
          <span className="life-category-kicker">🌱 Life & Well-Being</span>
          <span className="life-reading-time">{readingTime}</span>
        </div>

        <h3 className="life-card-title">
          <Link to={`/articles/${slug}`}>{title}</Link>
        </h3>

        <p className="life-card-excerpt">{description}</p>

        {tags.length > 0 && (
          <div className="life-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="life-tag-pill">#{tag}</span>
            ))}
          </div>
        )}

        <div className="life-card-footer">
          <div className="life-author-meta">
            <span className="author-name">{authorName}</span>
            <span className="publish-date">
              <FiCalendar /> {formatDate(publishedAt)}
            </span>
          </div>

          <div className="life-card-stats">
            <span>
              <FiEye /> {views}
            </span>
            <span>
              <FiHeart /> {likes}
            </span>
          </div>
        </div>

        <Link to={`/articles/${slug}`} className="life-read-btn">
          Read article <FiBookmark />
        </Link>
      </div>
    </article>
  );
};

export default LifeCard;
