import React from "react";
import { Link } from "react-router-dom";
import { FiCode, FiTerminal, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const CodingBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const cliCommands = article.cliCommands || [
    "git clone " + (article.githubUrl || "https://github.com"),
    "npm install",
    "npm start",
  ];

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
            {relatedArticles.slice(0, 3).map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="coding-read-card"
              >
                <div className="card-top-bar">
                  <span className="card-lang">{rel.subcategory || rel.category || "Tech"}</span>
                  <span className="card-time">{rel.readingTime || 5} min</span>
                </div>
                <h4>{rel.title}</h4>
                <p>{rel.excerpt}</p>
                <span className="read-more-btn">
                  Explore Guide <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </footer>
  );
};

export default CodingBottomSection;
