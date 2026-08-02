import React from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiEye, FiHeart, FiStar, FiExternalLink } from "react-icons/fi";
import { getImageUrl, handleImageError } from "../../../utils/imageUrlHelper";
import { newsApi } from "../../../services/apiService";

const DefaultCard = ({ articleData }) => {
  if (!articleData) return null;

  const {
    title,
    slug,
    description,
    coverImage,
    image,
    publishedAt,
    category,
    tags = [],
    readingTime,
    views = 0,
    likes = 0,
    rating = 5.0,
    source,
    author,
  } = articleData;

  const isExternal = Boolean(articleData.isExternal || articleData.externalUrl || articleData.url?.startsWith("http"));
  const externalUrl = articleData.externalUrl || articleData.url;
  const imageUrl = getImageUrl(image || coverImage, category);
  const publisher = source || author || "Global Press";

  const handleExternalClick = () => {
    if (isExternal && externalUrl) {
      newsApi.trackClick({
        articleId: articleData.id || articleData._id || externalUrl,
        title,
        publisher,
        category,
        url: externalUrl
      }).catch((err) => console.warn("Failed to log external click analytics:", err.message));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <article className="article-card default-card">
      {isExternal ? (
        <a 
          href={externalUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="article-image-link"
          onClick={handleExternalClick}
          style={{ position: "relative", display: "block" }}
        >
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            onError={(e) => handleImageError(e, category)}
            className="article-image"
          />
          <span className="news-source-tag">{publisher}</span>
        </a>
      ) : (
        <Link to={`/articles/${slug}`} className="article-image-link">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            onError={(e) => handleImageError(e, category)}
            className="article-image"
          />
        </Link>
      )}

      <div className="article-details">
        <div className="article-meta-row">
          <span className="article-tag">{category}</span>
          <span>{readingTime}</span>
        </div>

        <h3 className="article-title">
          {isExternal ? (
            <a 
              href={externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleExternalClick}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {title} <FiExternalLink className="external-icon" style={{ fontSize: "1rem", flexShrink: 0 }} />
            </a>
          ) : (
            <Link to={`/articles/${slug}`}>{title}</Link>
          )}
        </h3>

        <p className="article-text">{description}</p>

        <div className="article-tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        <div className="article-card-footer">
          <span>{formatDate(publishedAt)}</span>
          {!isExternal && (
            <>
              <span>
                <FiEye /> {views}
              </span>
              <span>
                <FiHeart /> {likes}
              </span>
              <span>
                <FiStar /> {rating}
              </span>
            </>
          )}
        </div>

        {isExternal ? (
          <a 
            href={externalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="article-read-link"
            onClick={handleExternalClick}
          >
            Read Source <FiBookmark />
          </a>
        ) : (
          <Link to={`/articles/${slug}`} className="article-read-link">
            Read article <FiBookmark />
          </Link>
        )}
      </div>
    </article>
  );
};

export default DefaultCard;
