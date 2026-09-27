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
            { label: article.category || "Life", to: `/category/${article.categorySlug || String(article.category || "life").toLowerCase()}` },
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
          {article.theme && <span className="highlight-chip"><FiTarget /> {article.theme}</span>}
          {article.mindset && <span className="highlight-chip"><FiCompass /> {article.mindset}</span>}
          {article.edition && <span className="highlight-chip"><FiBookmark /> {article.edition}</span>}
        </div>

        <AuthorHeroCard article={article} />

        {/* Bottom Full-Width Bar (Topic Tags on Left + Engagement Buttons on Right) */}
        <div className="hero-bottom-bar">
          <div className="hero-bottom-tags">
            {(article.tags && article.tags.length > 0
              ? article.tags
              : []
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
