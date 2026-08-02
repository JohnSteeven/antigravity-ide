import React from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiFileText,
  FiBook,
  FiHeart,
  FiTag,
  FiFolder,
  FiArrowRight,
} from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";
import AuthorCard from "../shared/widgets/AuthorCard";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const DEFAULT_STORY_SUMMARY = [
  "Faced an unexpected career setback that tested my core beliefs",
  "Pivoted by focusing on foundational skills and honest self-reflection",
  "Built momentum through small, consistent daily actions",
  "Emerged with greater clarity, stronger purpose, and deeper resilience",
];

const DEFAULT_LIFE_SKILLS = [
  "Patience",
  "Leadership",
  "Communication",
  "Resilience",
  "Decision Making",
];

const DEFAULT_RELATED_TOPICS = [
  "Career",
  "Failure",
  "Growth",
  "Success",
  "Mindset",
  "Habits",
];

const DEFAULT_READING_COLLECTIONS = [
  { title: "Personal Growth", count: "14 stories" },
  { title: "Career Journey", count: "9 stories" },
  { title: "Life Lessons", count: "11 stories" },
  { title: "Overcoming Failure", count: "6 stories" },
];

const IncidentsRightSidebar = ({
  article = {},
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  // Support CMS metadata with clean defaults or optional hiding
  const summaryTitle = article.summaryTitle || (article.tldr ? "TL;DR" : "Story Summary");
  const storySummary = article.storySummary || article.tldr || DEFAULT_STORY_SUMMARY;
  const lifeSkills = article.lifeSkills || DEFAULT_LIFE_SKILLS;
  const inspirationalQuote = article.inspirationalQuote || {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
  };
  const mood = article.mood || "Reflective & Hopeful";
  const relatedTopics = article.relatedTopics || article.tags || DEFAULT_RELATED_TOPICS;
  const readingCollections = article.readingCollection || DEFAULT_READING_COLLECTIONS;

  const showSummary = article.storySummary !== false && article.tldr !== false;
  const showLifeSkills = article.lifeSkills !== false;
  const showQuote = article.inspirationalQuote !== false;
  const showMood = article.mood !== false;
  const showTopics = article.relatedTopics !== false;
  const showCollections = article.readingCollection !== false;

  return (
    <aside className="incidents-right-sidebar experience-right-sidebar">
      <div className="incidents-sticky-box">
        {/* 1. Author Card (Dark Luxury Styling) */}
        <div className="sidebar-rhythm-wrapper dark-author-widget">
          <AuthorCard article={article} />
        </div>

        {/* 2. Story Summary (Glass Card Styling) */}
        {showSummary && storySummary && storySummary.length > 0 && (
          <div className="incidents-sidebar-panel story-summary-panel glass-summary-widget">
            <h3>
              <FiFileText className="icon" /> {summaryTitle}
            </h3>
            <ul className="summary-bullets-list">
              {storySummary.map((item, idx) => (
                <li key={idx}>
                  <span className="bullet-dot">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Life Skills Gained (Soft Neutral Card) */}
        {showLifeSkills && lifeSkills && lifeSkills.length > 0 && (
          <div className="incidents-sidebar-panel life-skills-panel soft-neutral-widget">
            <h3>
              <FiCheckCircle className="icon" /> Life Skills Gained
            </h3>
            <div className="skills-pill-grid">
              {lifeSkills.map((skill, idx) => (
                <span key={idx} className="skill-chip">
                  <FiCheckCircle className="check-icon" /> {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Inspirational Quote (Soft Warm Gradient Styling) */}
        {showQuote && inspirationalQuote && inspirationalQuote.quote && (
          <div className="incidents-sidebar-panel inspirational-quote-panel soft-gradient-quote-widget">
            <h3>
              <FaQuoteLeft className="icon" /> Core Insight
            </h3>
            <blockquote className="side-inspirational-quote">
              <p>"{inspirationalQuote.quote}"</p>
              {inspirationalQuote.author && <cite>— {inspirationalQuote.author}</cite>}
            </blockquote>
          </div>
        )}

        {/* 6. Mood */}
        {showMood && mood && (
          <div className="incidents-sidebar-panel mood-panel">
            <h3>
              <FiHeart className="icon" /> Story Mood
            </h3>
            <div className="mood-badge-display">
              <span className="mood-tag">{mood}</span>
            </div>
          </div>
        )}

        {/* 7. Related Topics */}
        {showTopics && relatedTopics && relatedTopics.length > 0 && (
          <div className="incidents-sidebar-panel related-topics-panel">
            <h3>
              <FiTag className="icon" /> Related Topics
            </h3>
            <div className="topics-cloud">
              {relatedTopics.map((topic, idx) => (
                <span key={idx} className="topic-tag-pill">
                  #{typeof topic === "string" ? topic.replace(/^#/, "") : topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 8. Reading Collections */}
        {showCollections && readingCollections && readingCollections.length > 0 && (
          <div className="incidents-sidebar-panel reading-collection-panel">
            <h3>
              <FiFolder className="icon" /> Curated Collections
            </h3>
            <div className="collections-list">
              {readingCollections.map((col, idx) => (
                <div key={idx} className="collection-item">
                  <span className="collection-name">
                    {typeof col === "string" ? col : col.title}
                  </span>
                  {col.count && <span className="collection-count">{col.count}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Newsletter Panel */}
        <NewsletterPanel
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          handleNewsletterSubmit={handleNewsletterSubmit}
          newsletterMsg={newsletterMsg}
        />
      </div>
    </aside>
  );
};

export default IncidentsRightSidebar;
