import React from "react";
import { Link } from "react-router-dom";
import { FiFeather, FiBookOpen, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const LessonsBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const takeaways = article.takeaways || [
    "Growth is cumulative — small adjustments yield enormous compounds.",
    "Rest is active recovery, not wasted time.",
    "Habits stick when they are tied to identity, not just outcomes.",
  ];

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
            {relatedArticles.slice(0, 3).map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="lessons-read-card"
              >
                <div className="card-top">
                  <span className="card-cat">{rel.subcategory || rel.category || "Lessons"}</span>
                  <span className="card-time">{rel.readingTime || 5} min</span>
                </div>
                <h4>{rel.title}</h4>
                <p>{rel.excerpt}</p>
                <span className="read-more-btn">
                  Read Contemplation <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </footer>
  );
};

export default LessonsBottomSection;
