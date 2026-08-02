import React from "react";
import { FiFeather, FiSun, FiCompass, FiCheckCircle, FiTarget, FiBookmark } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";
import AuthorHeroCard from "../shared/widgets/AuthorHeroCard";

const LessonsHero = ({
  article = {},
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const subtitle = article.subtitle || article.description;
  const rawQuote = article.favoriteQuote || article.heroQuote;
  const quote = rawQuote && rawQuote !== subtitle ? rawQuote : null;

  const categoryLabel = article.category || "Reflections";
  const subcategory = article.subcategory || "Mindset & Growth";
  const rawReadingTime = String(article.readingTime || "5");
  const cleanReadingTime = rawReadingTime.replace(/min.*$/i, "").trim() || "5";
  const imageUrl = getImageUrl(article.coverImage || article.image, categoryLabel.toLowerCase());

  const authorName = typeof article.author === "object" ? article.author?.name : (article.author || "Noble John Steeven");
  const authorAvatar = (typeof article.author === "object" && article.author?.avatar)
    ? article.author.avatar
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <header
      className="lessons-hero"
      style={{ backgroundImage: `url("${imageUrl}")` }}
    >
      <div className="lessons-hero-overlay"></div>
      <div className="lessons-hero-container">
        <Breadcrumbs
          items={[
            { label: categoryLabel, to: `/category/${categoryLabel.toLowerCase()}` },
            { label: article.title || "Reflection" },
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
            <FiCompass /> {cleanReadingTime} min read
          </span>
        </div>

        <h1 className="lessons-title">{article.title}</h1>

        {article.subtitle || article.description ? (
          <p className="lessons-subtitle">{article.subtitle || article.description}</p>
        ) : null}

        {/* Core Wisdom Quote Card */}
        {quote && (
          <div className="life-hero-quote-box">
            <span className="quote-mark">“</span>
            <p className="life-hero-quote">{quote}</p>
          </div>
        )}

        {/* Category Highlights Strip */}
        <div className="hero-category-highlights">
          <span className="highlight-chip"><FiTarget style={{ color: '#f59e0b' }} /> <strong>Core Focus:</strong> {article.theme || "Wisdom & Growth"}</span>
          <span className="highlight-chip"><FiCompass style={{ color: '#38bdf8' }} /> <strong>Mindset:</strong> {article.mindset || "Lifelong Reflection"}</span>
          <span className="highlight-chip"><FiBookmark style={{ color: '#4ade80' }} /> <strong>Category:</strong> {categoryLabel}</span>
        </div>

        <AuthorHeroCard article={article} />

        {/* Bottom Full-Width Bar (Topic Tags on Left + Engagement Buttons on Right) */}
        <div className="hero-bottom-bar">
          <div className="hero-bottom-tags">
            {(article.tags && article.tags.length > 0
              ? article.tags
              : ["#growth", "#life-lessons", "#reflections"]
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

export default LessonsHero;
