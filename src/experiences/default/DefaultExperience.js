import React from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiCompass, FiActivity, FiStar, FiCalendar } from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrlHelper";
import Breadcrumbs from "../../components/shared/Breadcrumbs";

// Shared Widgets
import EngagementBar from "../shared/widgets/EngagementBar";
import ReadingProgress from "../shared/widgets/ReadingProgress";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";
import CommentsSection from "../shared/widgets/CommentsSection";
import AuthorCard from "../shared/widgets/AuthorCard";
import ShareButtons from "../shared/widgets/ShareButtons";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const DefaultExperience = ({
  article,
  processedBody,
  headings,
  activeHeading,
  scrollProgress,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
  relatedArticles,
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  return (
    <main className="premium-article-page" data-experience="default">
      <header
        className="premium-article-hero"
        style={{ backgroundImage: `url("${getImageUrl(article.coverImage, article.category)}")` }}
      >
        <div className="premium-article-hero-overlay"></div>
        <div className="premium-article-hero-content">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: article.category, to: `/category/${article.category.toLowerCase()}` },
              { label: article.title },
            ]}
          />
          <div className="premium-article-tags-row">
            <span className="premium-badge category-badge">{article.category}</span>
            {article.difficulty && (
              <span className="premium-badge difficulty-badge">{article.difficulty}</span>
            )}
          </div>
          <h1 className="premium-article-title">{article.title}</h1>
          <p className="premium-article-subtitle">{article.description}</p>

          <div className="premium-author-block">
            <div className="author-avatar-placeholder">
              {article.author ? article.author.charAt(0) : "A"}
            </div>
            <div className="author-info">
              <span className="author-name">
                {article.author} <FiCheckCircle className="verified-badge-icon" title="Verified Author" />
              </span>
              <span className="publish-dates">
                Published {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Recently"}
                {article.updatedAt && ` • Updated ${new Date(article.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}`}
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

      <div className="premium-article-layout">
        {/* Left Sidebar - Table of Contents */}
        <aside className="premium-left-sidebar">
          <div className="sticky-sidebar-box">
            {headings.length > 0 && (
              <>
                <h3>Table of Contents</h3>
                <nav className="toc-nav">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`toc-link ${activeHeading === h.id ? "active" : ""}`}
                      style={h.level === 3 ? { paddingLeft: "35px", fontSize: "0.85rem", opacity: 0.8 } : undefined}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </>
            )}

            <ReadingProgress scrollProgress={scrollProgress} article={article} />
          </div>
        </aside>

        {/* Center Column - Article Body */}
        <article className="premium-center-content">
          <ArticleProseRenderer processedBody={processedBody} category={article.category} />

          {/* Travel specific metadata cards (rendered if location/weather fields exist) */}
          {(article.location || article.budget || article.weather) && (
            <section className="travel-details-section">
              <h3>Travel Quick Facts</h3>
              <div className="travel-meta-grid">
                {article.location && (
                  <div className="meta-card">
                    <FiCompass />
                    <strong>Location</strong>
                    <span>{article.location}</span>
                  </div>
                )}
                {article.weather && (
                  <div className="meta-card">
                    <FiActivity />
                    <strong>Weather</strong>
                    <span>{article.weather}</span>
                  </div>
                )}
                {article.budget && (
                  <div className="meta-card">
                    <FiStar />
                    <strong>Est. Budget</strong>
                    <span>{article.budget}</span>
                  </div>
                )}
                {article.bestTime && (
                  <div className="meta-card">
                    <FiCalendar />
                    <strong>Best Time to Visit</strong>
                    <span>{article.bestTime}</span>
                  </div>
                )}
              </div>
              {article.tips && (
                <div className="travel-tips-box">
                  <strong>Local Tips:</strong>
                  <p>{article.tips}</p>
                </div>
              )}
            </section>
          )}

          <CommentsSection
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
          />
        </article>

        {/* Right Sidebar - Author Bio & Related Stories */}
        <aside className="premium-right-sidebar">
          <div className="sticky-sidebar-box">
            <AuthorCard article={article} />

            <ShareButtons article={article} handleCopyLink={handleCopyLink} />

            {relatedArticles.length > 0 && (
              <div className="right-sidebar-panel">
                <h3>Related Stories</h3>
                <div className="related-stories-list">
                  {relatedArticles.map((item) => (
                    <Link to={`/articles/${item.slug}`} className="related-story-row" key={item.id}>
                      <div className="related-story-meta">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.readingTime || "5 min read"}</span>
                      </div>
                      <strong>{item.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <NewsletterPanel
              newsletterEmail={newsletterEmail}
              setNewsletterEmail={setNewsletterEmail}
              handleNewsletterSubmit={handleNewsletterSubmit}
              newsletterMsg={newsletterMsg}
            />
          </div>
        </aside>
      </div>
    </main>
  );
};

export default DefaultExperience;
