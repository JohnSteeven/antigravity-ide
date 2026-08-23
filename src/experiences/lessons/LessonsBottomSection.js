import React, { useState } from "react";
import { Link } from "react-router";
import { FiFeather, FiBookOpen, FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const formatReadingTime = (val) => {
  if (!val) return "5 min read";
  const num = String(val).replace(/read/gi, "").replace(/min/gi, "").trim();
  return num ? `${num} min read` : "5 min read";
};

const LessonsBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const [showAll, setShowAll] = useState(false);

  const takeaways = article.takeaways || [
    "Growth is cumulative — small adjustments yield enormous compounds.",
    "Rest is active recovery, not wasted time.",
    "Habits stick when they are tied to identity, not just outcomes.",
  ];

  const visibleArticles = showAll ? relatedArticles : relatedArticles.slice(0, 2);

  return (
    <footer className="lessons-bottom-section">
      {/* Principles Summary Card */}
      <div className="lessons-summary-card">
        <h3>
          <FiFeather /> Core Wisdom Takeaways
        </h3>
        <div className="takeaways-list">
          {takeaways.map((item, idx) => (
            <div key={idx} className="takeaway-row">
              <span className="takeaway-num">0{idx + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        approvedComments={approvedComments}
        comment={comment}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
      />

      {/* Related Wisdom & Reflections Grid */}
      {relatedArticles.length > 0 && (
        <div className="lessons-suggested-reads">
          <h3>
            <FiBookOpen /> Related Reflections & Guides
          </h3>
          <div className="lessons-reads-grid">
            {visibleArticles.map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="lessons-read-card"
              >
                <div className="card-top">
                  <span className="card-cat">{rel.subcategory || rel.category || "Lessons"}</span>
                  <span className="card-time">{formatReadingTime(rel.readingTime)}</span>
                </div>
                <h4>{rel.title}</h4>
                <p>{rel.excerpt}</p>
                <span className="read-more-btn">
                  Read Contemplation <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>

          {relatedArticles.length > 2 && (
            <div className="view-more-container">
              <button
                type="button"
                className="view-more-btn"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? (
                  <>Show Less <FiChevronUp /></>
                ) : (
                  <>View More Reflections ({relatedArticles.length - 2} more) <FiChevronDown /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </footer>
  );
};

export default LessonsBottomSection;
