import React from "react";
import { FiFeather, FiTarget, FiCompass, FiBookmark } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";
import AuthorHeroCard from "../shared/widgets/AuthorHeroCard";

const LifeHero = ({
  article = {},
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const categoryName = article.category || "Life";
  const imageUrl = getImageUrl(article.coverImage || article.image, categoryName.toLowerCase());
  const mood = article.mood || "Peaceful 🌿";
  const subtitle = article.subtitle || article.description;
  const heroQuote = article.heroQuote && article.heroQuote !== subtitle ? article.heroQuote : null;

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
            { label: article.title || "Story" },
          ]}
        />

        <h1 className="life-title">{article.title}</h1>
        {subtitle && <p className="life-subtitle">{subtitle}</p>}

        {heroQuote && (
          <div className="life-hero-quote-box">
            <span className="quote-mark">“</span>
            <p className="life-hero-quote">{heroQuote}</p>
          </div>
        )}

        {/* Category Highlights Strip (Fills Space Below Quote) */}
        <div className="hero-category-highlights">
          <span className="highlight-chip"><FiTarget style={{ color: '#f59e0b' }} /> <strong>Key Theme:</strong> {article.theme || "Intentional Living"}</span>
          <span className="highlight-chip"><FiCompass style={{ color: '#38bdf8' }} /> <strong>Mindset:</strong> {article.mindset || "Clarity & Purpose"}</span>
          <span className="highlight-chip"><FiBookmark style={{ color: '#4ade80' }} /> <strong>Edition:</strong> {article.edition || "Editorial Choice"}</span>
        </div>

        <AuthorHeroCard article={article} />

        {/* Bottom Full-Width Bar (Topic Tags on Left + Engagement Buttons on Right) */}
        <div className="hero-bottom-bar">
          <div className="hero-bottom-tags">
            {(article.tags && article.tags.length > 0
              ? article.tags
              : ["#intentional-living", "#clarity", "#mindfulness"]
            ).map((tag, idx) => (
              <span key={idx} className="hero-tag-pill">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
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
      </div>
    </header>
  );
};

export default LifeHero;
