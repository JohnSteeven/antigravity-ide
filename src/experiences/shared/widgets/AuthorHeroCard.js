import React from "react";
import { FiCheckCircle, FiCalendar, FiClock, FiEye, FiEdit3 } from "react-icons/fi";

const AuthorHeroCard = ({ article = {} }) => {
  const authorName =
    typeof article.author === "object"
      ? article.author?.name
      : article.author || "Noble John Steeven";

  const authorAvatar =
    typeof article.author === "object" && article.author?.avatar
      ? article.author.avatar
      : null;

  const publishedDate = article.publishedAt
    ? isNaN(Date.parse(article.publishedAt))
      ? article.publishedAt
      : new Date(article.publishedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
    : "Recently";

  const updatedDate = article.updatedAt
    ? isNaN(Date.parse(article.updatedAt))
      ? article.updatedAt
      : new Date(article.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })
    : null;

  const rawReadingTime = String(article.readingTime || "5");
  const readingTimeStr = rawReadingTime.includes("min read")
    ? rawReadingTime
    : `${rawReadingTime} min read`;

  const viewsStr = Number(article.views || 0).toLocaleString();
  const mood = article.mood || "Peaceful Read";

  return (
    <div className="hero-author-card">
      {/* Author Header */}
      <div className="author-card-header">
        {authorAvatar ? (
          <img src={authorAvatar} alt={authorName} className="author-card-avatar-img" />
        ) : (
          <div className="author-card-avatar-initial">
            {authorName ? authorName.charAt(0) : "A"}
          </div>
        )}
        <div className="author-card-name-box">
          <h4 className="author-card-name">{authorName}</h4>
          <span className="author-card-verified">
            <FiCheckCircle className="verified-icon" /> Verified Author
          </span>
        </div>
      </div>

      <div className="author-card-divider" />

      {/* 2x2 Meta Grid */}
      <div className="author-card-meta-grid">
        <div className="meta-grid-item">
          <FiCalendar className="meta-icon" />
          <div className="meta-info">
            <span className="meta-label">Published</span>
            <span className="meta-value">{publishedDate}</span>
          </div>
        </div>

        {updatedDate && (
          <div className="meta-grid-item">
            <FiEdit3 className="meta-icon" />
            <div className="meta-info">
              <span className="meta-label">Updated</span>
              <span className="meta-value">{updatedDate}</span>
            </div>
          </div>
        )}

        <div className="meta-grid-item">
          <FiClock className="meta-icon" />
          <div className="meta-info">
            <span className="meta-value">{readingTimeStr}</span>
          </div>
        </div>

        <div className="meta-grid-item">
          <FiEye className="meta-icon" />
          <div className="meta-info">
            <span className="meta-value">{viewsStr} views</span>
          </div>
        </div>
      </div>

      <div className="author-card-divider" />

      {/* Bottom Mood/Category Badge */}
      <div className="author-card-footer">
        <span className="author-card-mood-pill">🌱 {mood}</span>
      </div>
    </div>
  );
};

export default AuthorHeroCard;
