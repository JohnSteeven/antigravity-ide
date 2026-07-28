import React from "react";
import { Link } from "react-router-dom";
import { FiShield, FiAlertTriangle, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const IncidentsBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const actionItems = article.actionItems || [
    "Implement automated circuit breakers for auth service",
    "Increase DB pool connection size limits",
    "Add alerting threshold for thread pool exhaustion",
  ];

  return (
    <footer className="incidents-bottom-section">
      {/* Remediation Summary Card */}
      <div className="incidents-summary-card">
        <h3>
          <FiShield /> Post-Mortem Remediation Summary
        </h3>
        <div className="summary-list">
          {actionItems.map((item, idx) => (
            <div key={idx} className="summary-row">
              <span className="step-badge">ITEM 0{idx + 1}</span>
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

      {/* Related Incident Reports Grid */}
      {relatedArticles.length > 0 && (
        <div className="incidents-suggested-reports">
          <h3>
            <FiAlertTriangle /> Related Incident Reports
          </h3>
          <div className="incidents-reports-grid">
            {relatedArticles.slice(0, 3).map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="incidents-report-card"
              >
                <div className="card-header-bar">
                  <span className="card-sev">{rel.severity || "SEV-2"}</span>
                  <span className="card-time">{rel.outageDuration || "30m"}</span>
                </div>
                <h4>{rel.title}</h4>
                <p>{rel.excerpt}</p>
                <span className="read-report-btn">
                  Inspect RCA <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </footer>
  );
};

export default IncidentsBottomSection;
