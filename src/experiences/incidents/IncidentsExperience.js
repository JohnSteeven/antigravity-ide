import React from "react";
import IncidentsHero from "./IncidentsHero";
import IncidentsLeftSidebar from "./IncidentsLeftSidebar";
import IncidentsRightSidebar from "./IncidentsRightSidebar";
import IncidentsBottomSection from "./IncidentsBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";
import {
  FiAlertCircle,
  FiRepeat,
  FiZap,
  FiStar,
  FiRotateCcw,
  FiCheckCircle,
} from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";

const DEFAULT_MISTAKES_MADE = [
  "Didn't ask for help soon enough",
  "Ignored subtle warning signs in the early stages",
  "Waited too long to make the uncomfortable decision",
];

const DEFAULT_BEFORE_AFTER = {
  before: ["Fear & Uncertainty", "Stress & Confusion", "Overwhelm"],
  after: ["Purpose & Clarity", "Confidence & Peace", "Growth Mindset"],
};

const DEFAULT_WHAT_CHANGED_ME = [
  "One honest conversation with a trusted mentor",
  "One pivotal realization that comfort blocks growth",
  "One bold decision to pivot direction",
  "One transformative book on personal resilience",
];

const DEFAULT_MEMORABLE_QUOTES = [
  "I honestly thought everything was over, but it was actually just beginning.",
  "Sometimes failure is the only language clear enough to force real change.",
  "Growth starts exact point where your comfort zone ends.",
];

const DEFAULT_STORY_IMPACT = [
  { trait: "Confidence", rating: 5 },
  { trait: "Leadership", rating: 4 },
  { trait: "Patience", rating: 5 },
  { trait: "Communication", rating: 4 },
];

const DEFAULT_IF_I_COULD_DO_IT_AGAIN =
  "Knowing what I know now, I would have spoken up sooner, embraced the ambiguity, and trusted that setbacks are simply steering us towards our true strength.";

const DEFAULT_READER_TAKEAWAYS = [
  "Failure isn't final—it is feedback.",
  "Ask for help before you hit rock bottom.",
  "Keep moving forward, even when the path is unclear.",
];

const IncidentsExperience = (props) => {
  const {
    article = {},
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
  } = props;

  // Dynamic CMS metadata props & optional hiding
  const mistakesMade = article.mistakesMade || DEFAULT_MISTAKES_MADE;
  const beforeAfter = article.beforeAfter || DEFAULT_BEFORE_AFTER;
  const whatChangedMe = article.whatChangedMe || DEFAULT_WHAT_CHANGED_ME;
  const memorableQuotes = article.memorableQuotes || DEFAULT_MEMORABLE_QUOTES;
  const storyImpact = article.storyImpact || DEFAULT_STORY_IMPACT;
  const ifICouldDoItAgain = article.ifICouldDoItAgain || DEFAULT_IF_I_COULD_DO_IT_AGAIN;
  const readerTakeaways = article.readerTakeaways || DEFAULT_READER_TAKEAWAYS;

  const showMistakes = article.mistakesMade !== false;
  const showBeforeAfter = article.beforeAfter !== false;
  const showWhatChangedMe = article.whatChangedMe !== false;
  const showQuotes = article.memorableQuotes !== false;
  const showStoryImpact = article.storyImpact !== false;
  const showIfICouldDoItAgain = article.ifICouldDoItAgain !== false;
  const showReaderTakeaways = article.readerTakeaways !== false;

  const renderStars = (rating = 5) => {
    return Array.from({ length: 5 }, (_, idx) => (
      <FiStar
        key={idx}
        className={`star-icon ${idx < rating ? "filled" : "empty"}`}
      />
    ));
  };

  const categorySlug = String(article?.category || article?.categorySlug || "").toLowerCase().trim();

  return (
    <main
      className="incidents-experience-page experience-page-container article-detail-theme article-detail-theme--standard"
      data-experience="incidents"
      data-category={categorySlug || "incidents"}
    >
      {/* 1. Full-Bleed 100% Width Hero Section */}
      <IncidentsHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      {/* 2. Inner Centered Content Container */}
      <div className="experience-container-inner">
        <div className="incidents-article-layout experience-layout-grid">
          {/* Left Sidebar */}
          <IncidentsLeftSidebar
            article={article}
            headings={headings}
            activeHeading={activeHeading}
            scrollProgress={scrollProgress}
          />

          {/* Main Center Editorial Content */}
          <article className="incidents-center-content experience-center-prose">
            {/* Primary Story Body Renderer */}
            <ArticleProseRenderer processedBody={processedBody} category="incidents" />

            {/* Memoir Storytelling Widgets (Rendered within article flow) */}
            <div className="experience-story-callouts">
              {/* Mistakes I Made */}
              {showMistakes && mistakesMade && mistakesMade.length > 0 && (
                <section className="memoir-callout-card mistakes-card">
                  <h3>
                    <FiAlertCircle className="icon" /> Mistakes I Made
                  </h3>
                  <ul className="mistakes-list">
                    {mistakesMade.map((mistake, idx) => (
                      <li key={idx}>
                        <span className="bullet-warning">⚠</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Before vs After Glass Panels */}
              {showBeforeAfter && beforeAfter && (beforeAfter.before || beforeAfter.after) && (
                <section className="memoir-callout-card before-after-card">
                  <h3>
                    <FiRepeat className="icon" /> Mindset Shift: Before vs After
                  </h3>
                  <div className="before-after-glass-grid">
                    <div className="ba-glass-panel before-panel">
                      <div className="ba-panel-header">
                        <span className="ba-emoji">😞</span>
                        <span className="ba-title">BEFORE</span>
                      </div>
                      <ul>
                        {(beforeAfter.before || []).map((item, idx) => (
                          <li key={idx}>
                            <span className="ba-cross">✕</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="ba-center-arrow">➜</div>
                    <div className="ba-glass-panel after-panel">
                      <div className="ba-panel-header">
                        <span className="ba-emoji">😊</span>
                        <span className="ba-title">AFTER</span>
                      </div>
                      <ul>
                        {(beforeAfter.after || []).map((item, idx) => (
                          <li key={idx}>
                            <span className="ba-check">✓</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* What Changed Me Icon Grid */}
              {showWhatChangedMe && whatChangedMe && whatChangedMe.length > 0 && (
                <section className="memoir-callout-card what-changed-card">
                  <h3>
                    <FiZap className="icon" /> Turning Points & Catalysts
                  </h3>
                  <div className="what-changed-icon-grid">
                    {whatChangedMe.map((item, idx) => {
                      const iconList = ["💬", "📖", "👤", "🚀", "⚡", "🌱"];
                      const icon = iconList[idx % iconList.length];
                      return (
                        <div key={idx} className="what-changed-icon-card">
                          <div className="changed-icon-badge">{icon}</div>
                          <span className="changed-text">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Memorable Quotes (Medium-Style Editorial Quote) */}
              {showQuotes && memorableQuotes && memorableQuotes.length > 0 && (
                <section className="memoir-callout-card memorable-quotes-card">
                  <h3>
                    <FaQuoteLeft className="icon" /> Core Realizations
                  </h3>
                  <div className="medium-quotes-list">
                    {memorableQuotes.map((q, idx) => (
                      <blockquote key={idx} className="medium-editorial-quote">
                        <span className="huge-quote-mark">“</span>
                        <p>{q}</p>
                      </blockquote>
                    ))}
                  </div>
                </section>
              )}

              {/* Story Impact: Animated Percentage Progress Bars */}
              {showStoryImpact && storyImpact && storyImpact.length > 0 && (
                <section className="memoir-callout-card story-impact-card">
                  <h3>
                    <FiStar className="icon" /> Story Impact & Growth Metrics
                  </h3>
                  <div className="impact-progress-grid">
                    {storyImpact.map((item, idx) => {
                      const percentage = item.percentage || (item.rating ? Math.min(100, item.rating * 20) : 88);
                      return (
                        <div key={idx} className="impact-progress-row">
                          <div className="impact-progress-label">
                            <span className="trait-name">{item.trait}</span>
                            <span className="trait-percent">{percentage}%</span>
                          </div>
                          <div className="impact-progress-track">
                            <div
                              className="impact-progress-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* If I Could Do It Again */}
              {showIfICouldDoItAgain && ifICouldDoItAgain && (
                <section className="memoir-callout-card repeat-again-card">
                  <h3>
                    <FiRotateCcw className="icon" /> If I Could Do It Again
                  </h3>
                  <p className="repeat-again-text">"{ifICouldDoItAgain}"</p>
                </section>
              )}

              {/* Reader Takeaways */}
              {showReaderTakeaways && readerTakeaways && readerTakeaways.length > 0 && (
                <section className="memoir-callout-card reader-takeaways-card">
                  <h3>
                    <FiCheckCircle className="icon" /> Reader Takeaways: What You Should Remember
                  </h3>
                  <ul className="takeaways-list">
                    {readerTakeaways.map((item, idx) => (
                      <li key={idx}>
                        <FiCheckCircle className="check-icon" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Bottom Section */}
            <IncidentsBottomSection
              article={article}
              approvedComments={approvedComments}
              comment={comment}
              setComment={setComment}
              handleCommentSubmit={handleCommentSubmit}
              commentMessage={commentMessage}
              relatedArticles={relatedArticles}
            />
          </article>

          {/* Right Sidebar */}
          <IncidentsRightSidebar
            article={article}
            handleCopyLink={handleCopyLink}
            relatedArticles={relatedArticles}
            newsletterEmail={newsletterEmail}
            setNewsletterEmail={setNewsletterEmail}
            handleNewsletterSubmit={handleNewsletterSubmit}
            newsletterMsg={newsletterMsg}
          />
        </div>
      </div>
    </main>
  );
};

export default IncidentsExperience;
