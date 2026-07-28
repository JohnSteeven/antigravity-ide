import React, { useState } from "react";
import { FiBookOpen, FiBookmark, FiShare2, FiCheck, FiHeart, FiFeather, FiSun, FiCompass } from "react-icons/fi";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";

const LessonsHero = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const quote =
    article.favoriteQuote ||
    article.heroQuote ||
    "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.";

  const categoryLabel = article.category || "Lessons";
  const subcategory = article.subcategory || "Mindset & Growth";
  const readingTime = article.readingTime || 5;

  return (
    <header className="lessons-hero">
      <div className="lessons-hero-container">
        <Breadcrumbs
          items={[
            { label: categoryLabel, to: `/category/${categoryLabel.toLowerCase()}` },
            { label: article.title },
          ]}
        />

        {/* Badges */}
        <div className="lessons-badge-row">
          <span className="lessons-badge category">
            <FiFeather /> {categoryLabel}
          </span>
          <span className="lessons-badge subcategory">
            <FiSun /> {subcategory}
          </span>
          <span className="lessons-badge time">
            <FiCompass /> {readingTime} min reflection
          </span>
        </div>

        <h1 className="lessons-title">{article.title}</h1>

        {article.subtitle && (
          <p className="lessons-subtitle">{article.subtitle}</p>
        )}

        {/* Core Wisdom Quote Card */}
        <div className="lessons-quote-card">
          <span className="quote-mark">“</span>
          <p className="quote-text">{quote}</p>
          {article.author?.name && (
            <span className="quote-author">— {article.author.name}</span>
          )}
        </div>

        {/* Author Meta */}
        <div className="lessons-author-row">
          <img
            src={
              article.author?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
            }
            alt={article.author?.name || "Author"}
            className="lessons-avatar"
          />
          <div className="lessons-author-meta">
            <span className="lessons-author-name">
              {article.author?.name || "Noble John Steeven"}
            </span>
            <span className="lessons-dates">
              Contemplation Published {article.publishedAt || "Recently"} • {readingTime} min read
            </span>
          </div>
        </div>

        {/* Engagement Bar */}
        <EngagementBar
          article={article}
          isLiked={isLiked}
          handleLikeToggle={handleLikeToggle}
          isBookmarked={isBookmarked}
          handleBookmarkToggle={handleBookmarkToggle}
          isSaved={isSaved}
          handleSaveToggle={handleSaveToggle}
          handleCopyLink={handleCopyLink}
        />
      </div>
    </header>
  );
};

export default LessonsHero;
