import React, { useState } from "react";
import { Link } from "react-router";
import { FiBook, FiAward, FiCheckCircle, FiVideo, FiHeadphones } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const LifeBottomSection = ({
  article = {},
  approvedComments = [],
  comment = "",
  setComment,
  handleCommentSubmit,
  commentMessage = "",
  relatedArticles = [],
}) => {
  const [showAll, setShowAll] = useState(false);
  const reflectionQuestions = (Array.isArray(article.reflectionQuestions) && article.reflectionQuestions.length > 0)
    ? article.reflectionQuestions
    : [
        "What small habit could you change today to align better with your long-term vision?",
        "How do you currently find moments of calm in a busy week?",
      ];

  const takeaways = (Array.isArray(article.takeaways) && article.takeaways.length > 0)
    ? article.takeaways
    : [
        "Growth is cumulative — small adjustments yield enormous compounds.",
        "Rest is active recovery, not wasted time.",
        "Habits stick when they are tied to identity, not just outcomes.",
      ];

  return (
    <footer className="life-bottom-section">
      <div className="life-bottom-grid">
        {/* Key Takeaways */}
        <div className="life-takeaways-card">
          <h3><FiAward /> Life Lessons & Key Takeaways</h3>
          <ul>
            {takeaways.map((item, index) => (
              <li key={index}>
                <FiCheckCircle className="check-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reflection Prompts */}
        <div className="life-reflection-card">
          <h3><FiBook /> Reflection Questions</h3>
          <div className="reflection-prompts-list">
            {reflectionQuestions.map((q, index) => (
              <div key={index} className="prompt-item">
                <span className="prompt-number">0{index + 1}</span>
                <p>{q}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Media Strip */}
      <div className="life-media-strip">
        <div className="media-box detail-card detail-card--light">
          <FiVideo className="media-icon" />
          <div>
            <strong>Watch: The Power of Tiny Habits</strong>
            <p>12-minute TED presentation on habit compounding.</p>
          </div>
        </div>
        <div className="media-box detail-card detail-card--light">
          <FiHeadphones className="media-icon" />
          <div>
            <strong>Audio: Mindful Morning Reflections</strong>
            <p>Guided 8-minute audio meditation for focus.</p>
          </div>
        </div>
      </div>

      {/* Suggested Reads Grid */}
      {relatedArticles.length > 0 && (
        <section className="life-suggested-reads">
          <h3>Continue Reading in Life</h3>
          <div className="life-reads-grid">
            {(showAll ? relatedArticles : relatedArticles.slice(0, 2)).map((item) => (
              <Link to={`/articles/${item.slug}`} className="life-read-card" key={item.id || item._id || item.slug}>
                <span className="card-category">{item.subcategory || "Personal Growth"}</span>
                <h4>{item.title}</h4>
                <p>{item.description || item.excerpt}</p>
                <span className="read-more-btn">Read Entry →</span>
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
                {showAll ? "Show Less" : `View More Entries (${relatedArticles.length - 2} more)`}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Comments */}
      <CommentsSection
        approvedComments={approvedComments}
        comment={comment}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
      />
    </footer>
  );
};

export default LifeBottomSection;
