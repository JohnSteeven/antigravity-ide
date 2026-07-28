import React, { useState } from "react";
import { FiMapPin, FiCalendar, FiDollarSign, FiClock, FiSun, FiCompass, FiBookmark, FiShare2, FiCheck, FiHeart } from "react-icons/fi";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";

const TravelHero = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  const location = article.location || "Kyoto, Japan 🇯🇵";
  const season = article.season || "Autumn / Spring 🍂";
  const duration = article.duration || "7 Days Trip";
  const budget = article.budget || "$120 / Day";

  const heroImage =
    article.imageUrl ||
    article.featuredImage ||
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
            { label: article.title },
          ]}
        />

        {/* Badges */}
        <div className="travel-badge-row">
          <span className="travel-badge location">
            <FiMapPin /> {location}
          </span>
          <span className="travel-badge season">
            <FiSun /> {season}
          </span>
          <span className="travel-badge duration">
            <FiClock /> {duration}
          </span>
        </div>

        <h1 className="travel-title">{article.title}</h1>

        {article.subtitle && (
          <p className="travel-subtitle">{article.subtitle}</p>
        )}

        {/* Travel Stats Bar */}
        <div className="travel-stats-strip">
          <div className="stat-item">
            <FiMapPin className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Destination</span>
              <span className="stat-val">{location}</span>
            </div>
          </div>

          <div className="stat-item">
            <FiDollarSign className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Est. Budget</span>
              <span className="stat-val">{budget}</span>
            </div>
          </div>

          <div className="stat-item">
            <FiCompass className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Ideal Season</span>
              <span className="stat-val">{season}</span>
            </div>
          </div>

          <div className="stat-item">
            <FiCalendar className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Trip Length</span>
              <span className="stat-val">{duration}</span>
            </div>
          </div>
        </div>

        {/* Author Meta */}
        <div className="travel-author-row">
          <img
            src={
              article.author?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
            }
            alt={article.author?.name || "Author"}
            className="travel-avatar"
          />
          <div className="travel-author-meta">
            <span className="travel-author-name">
              {article.author?.name || "Noble John Steeven"}
            </span>
            <span className="travel-dates">
              Expedition Published {article.publishedAt || "Recently"} • {article.readingTime || 6} min read
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

export default TravelHero;
