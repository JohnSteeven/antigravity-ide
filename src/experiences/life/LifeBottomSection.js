import React from "react";
import { Link } from "react-router-dom";
import { FiBook, FiAward, FiCheckCircle } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const LifeBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  // Reflection prompts and takeaways can be configured or use smart fallbacks
  const reflectionQuestions = article.reflectionQuestions || [
    "What small habit could you change today to align better with your long-term vision?",
    "How do you currently find moments of calm in a busy week?",
  ];

  const takeaways = article.takeaways || [
    "Growth is cumulative — small adjustments yield enormous compounds.",
    "Rest is active recovery, not wasted time.",
    "Habits stick when they are tied to identity, not just outcomes.",
  ];

  return (
    <footer className="life-bottom-section">
      <div className="life-bottom-grid">
        {/* Key Takeaways */}
        <div className="life-takeaways-card">
          <h3><FiAward /> Key Takeaways</h3>
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
          <h3><FiBook /> Reflection Prompts</h3>
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

      {/* Suggested Reads Grid */}
      {relatedArticles.length > 0 && (
        <section className="life-suggested-reads">
          <h3>Continue Reading in Life</h3>
          <div className="life-reads-grid">
            {relatedArticles.slice(0, 3).map((item) => (
              <Link to={`/articles/${item.slug}`} className="life-read-card" key={item.id}>
                <span className="card-category">{item.subcategory || "Personal Growth"}</span>
                <h4>{item.title}</h4>
                <p>{item.description || item.excerpt}</p>
                <span className="read-more-btn">Read Entry →</span>
              </Link>
            ))}
          </div>
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
