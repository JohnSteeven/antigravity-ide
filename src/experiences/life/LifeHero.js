import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";

const LifeHero = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const imageUrl = getImageUrl(article.coverImage, "life");
  const mood = article.mood || "Peaceful 🌿";
  const heroQuote = article.heroQuote || article.excerpt || "Seek peace in the ordinary moments of today.";

  return (
    <header
      className="life-hero"
      style={{ backgroundImage: `url("${imageUrl}")` }}
    >
      <div className="life-hero-overlay"></div>
      <div className="life-hero-content">
        <Breadcrumbs
          items={[
            { label: article.category || "Life", to: "/category/life" },
            { label: article.title },
          ]}
        />
        
        <div className="life-badge-row">
          <span className="life-category-badge">🌱 {article.category || "Life"}</span>
          <span className="life-mood-badge">{mood}</span>
        </div>

        <h1 className="life-title">{article.title}</h1>
        <p className="life-subtitle">{article.description || article.excerpt}</p>

        {heroQuote && (
          <div className="life-hero-quote-box">
            <span className="quote-mark">“</span>
            <p className="life-hero-quote">{heroQuote}</p>
          </div>
        )}

        <div className="life-author-row">
          <div className="life-avatar">
            {article.author ? article.author.charAt(0) : "L"}
          </div>
          <div className="life-author-meta">
            <span className="life-author-name">
              {article.author} <FiCheckCircle className="life-verified-icon" title="Verified Author" />
            </span>
            <span className="life-dates">
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Recently"}
              {article.updatedAt && ` (Updated ${new Date(article.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })})`}
              {` • ${article.readingTime || "5 min read"}`}
            </span>
          </div>
        </div>

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

export default LifeHero;
