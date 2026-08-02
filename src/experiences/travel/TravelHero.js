import React from "react";
import { FiMapPin, FiCalendar, FiDollarSign, FiClock, FiSun, FiCompass } from "react-icons/fi";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";
import AuthorHeroCard from "../shared/widgets/AuthorHeroCard";

const TravelHero = ({
  article = {},
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const location = article.location || "Kyoto, Japan 🇯🇵";
  const season = article.season || "Autumn / Spring 🍂";
  const duration = article.duration || "7 Days Trip";
  const budget = article.budget || "$120 / Day";
  const subtitle = article.subtitle || article.description;
  const heroQuote = article.heroQuote && article.heroQuote !== subtitle ? article.heroQuote : null;

  const heroImage =
    article.imageUrl ||
    article.featuredImage ||
    article.coverImage ||
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80";

  return (
    <header
      className="travel-hero"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="travel-hero-overlay"></div>

      <div className="travel-hero-content">
        <Breadcrumbs
          items={[
            { label: article.category || "Travel", to: "/category/travel" },
            { label: article.title || "Expedition" },
          ]}
        />

        <h1 className="travel-title">{article.title}</h1>

        {subtitle && <p className="travel-subtitle">{subtitle}</p>}

        {heroQuote && (
          <div className="life-hero-quote-box">
            <span className="quote-mark">“</span>
            <p className="life-hero-quote">{heroQuote}</p>
          </div>
        )}

        {/* Travel Highlights Strip */}
        <div className="hero-category-highlights">
          <span className="highlight-chip"><FiMapPin style={{ color: '#f59e0b' }} /> <strong>Destination:</strong> {location}</span>
          <span className="highlight-chip"><FiCompass style={{ color: '#38bdf8' }} /> <strong>Season:</strong> {season}</span>
          <span className="highlight-chip"><FiClock style={{ color: '#4ade80' }} /> <strong>Length:</strong> {duration}</span>
          <span className="highlight-chip"><FiDollarSign style={{ color: '#f43f5e' }} /> <strong>Budget:</strong> {budget}</span>
        </div>

        <AuthorHeroCard article={article} />

        {/* Bottom Full-Width Bar (Topic Tags on Left + Social Actions on Right) */}
        <div className="hero-bottom-bar">
          <div className="hero-bottom-tags">
            {(article.tags && article.tags.length > 0
              ? article.tags
              : ["#travel", "#japan", "#expedition", "#hidden-gems"]
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

export default TravelHero;
