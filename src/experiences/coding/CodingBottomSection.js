import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCode, FiTerminal, FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const formatReadingTime = (val) => {
  if (!val) return "5 min read";
  const num = String(val).replace(/read/gi, "").replace(/min/gi, "").trim();
  return num ? `${num} min read` : "5 min read";
};

const CodingBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const [showAll, setShowAll] = useState(false);

  const cliCommands = article.cliCommands || [
    "git clone " + (article.githubUrl || "https://github.com"),
    "npm install",
    "npm start",
  ];

  const visibleArticles = showAll ? relatedArticles : relatedArticles.slice(0, 2);

  return (
    <footer className="coding-bottom-section">
      {/* CLI Quick Reference Box */}
      <div className="coding-bottom-card">
        <h3>
          <FiTerminal /> Quick Start Commands
        </h3>
        <div className="bottom-cli-list">
          {cliCommands.map((cmd, idx) => (
            <div key={idx} className="cli-row">
              <span className="step-num">0{idx + 1}</span>
              <code>$ {cmd}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        category="coding"
        approvedComments={approvedComments}
        comment={comment}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
      />

      {/* Related Tech Articles Grid */}
      {relatedArticles.length > 0 && (
        <div className="coding-suggested-reads">
          <h3>
            <FiCode /> Recommended Tech Tutorials
          </h3>
          <div className="coding-reads-grid">
            {visibleArticles.map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="coding-read-card"
              >
                <div className="card-top-bar">
                  <span className="card-lang">{rel.subcategory || rel.category || "Tech"}</span>
                  <span className="card-time">{formatReadingTime(rel.readingTime)}</span>
                </div>
                <h4>{rel.title}</h4>
                <p>{rel.excerpt}</p>
                <span className="read-more-btn">
                  Explore Guide <FiArrowRight />
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
                  <>View More Tutorials ({relatedArticles.length - 2} more) <FiChevronDown /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </footer>
  );
};

export default CodingBottomSection;
