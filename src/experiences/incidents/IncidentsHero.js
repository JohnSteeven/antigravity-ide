import React from "react";
import { FiBookOpen, FiCompass, FiHeart, FiTarget, FiZap, FiMessageSquare, FiTag } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";
import AuthorHeroCard from "../shared/widgets/AuthorHeroCard";

const IncidentsHero = ({
  article = {},
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const categoryName = article.category || "Experiences";
  const coverImg = article.coverImage || article.image || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80";
  const imageUrl = getImageUrl(coverImg, "experiences");
  
  const subtitle = article.subtitle || article.description;
  const heroQuote = article.quote || article.heroQuote;

  // Experience metadata highlights
  const coreLesson = article.coreLesson || article.theme;
  const turningPoint = article.turningPoint || article.subcategory;
  const keyInsight = article.keyInsight || (article.takeaways && article.takeaways[0]);
  const mood = article.mood;
  const theme = article.theme;

  return (
    <header
      className="incidents-hero experience-hero"
      style={{ backgroundImage: `url("${imageUrl}")` }}
    >
      <div className="incidents-hero-overlay"></div>
      <div className="incidents-hero-body">
        <Breadcrumbs
          items={[
            { label: categoryName, to: `/category/${article.categorySlug || "incidents"}` },
            { label: article.title || "The Day Everything Changed" },
          ]}
        />

        {/* Story Category Badge & Snapshot Metadata Chips */}
        <div className="experience-hero-meta-bar">
          <span className="experience-category-pill">
            <FiCompass /> {categoryName}
          </span>
          {mood && <span className="experience-mood-pill">
            <FiHeart /> {mood}
          </span>}
          {theme && <span className="experience-theme-pill">
            <FiBookOpen /> {theme}
          </span>}
        </div>

        {/* Title */}
        <h1 className="incidents-title experience-hero-title">
          {article.title || "The Day Everything Changed"}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="incidents-subtitle experience-hero-subtitle">{subtitle}</p>
        )}

        {/* Quote Box */}
        {heroQuote && (
          <div className="life-hero-quote-box experience-hero-quote-card">
            <span className="quote-mark">“</span>
            <p className="life-hero-quote">{heroQuote}</p>
          </div>
        )}

        {/* Story Snapshot Details (Experience-Relevant Metadata) */}
        <div className="hero-category-highlights experience-snapshot-strip">
          {coreLesson && <span className="highlight-chip">
            <FiTarget style={{ color: "#f43f5e" }} /> <strong>Core Lesson:</strong> {coreLesson}
          </span>}
          {turningPoint && <span className="highlight-chip">
            <FiZap style={{ color: "#f59e0b" }} /> <strong>Turning Point:</strong> {turningPoint}
          </span>}
          {keyInsight && <span className="highlight-chip">
            <FiMessageSquare style={{ color: "#3b82f6" }} /> <strong>Key Insight:</strong> {keyInsight}
          </span>}
        </div>

        {/* Author Card */}
        <AuthorHeroCard article={article} />

        {/* Bottom Bar: Tags & Engagement */}
        <div className="hero-bottom-bar">
          <div className="hero-bottom-tags">
            {(article.tags && article.tags.length > 0
              ? article.tags
              : ["career", "growth", "life-lessons", "resilience", "turning-point"]
            ).map((tag, idx) => (
              <span key={idx} className="hero-tag-pill">
                <FiTag className="tag-icon" /> {tag.startsWith("#") ? tag : `#${tag}`}
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

export default IncidentsHero;
