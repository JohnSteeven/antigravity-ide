import React from "react";
import { FiShield, FiCheckSquare, FiActivity, FiGlobe, FiTerminal } from "react-icons/fi";
import AuthorCard from "../shared/widgets/AuthorCard";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const IncidentsRightSidebar = ({
  article,
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  const actionItems = article.actionItems || [
    "Implement automated circuit breakers for auth service",
    "Increase DB pool connection size limits",
    "Add alerting threshold for thread pool exhaustion",
    "Conduct failover drill in staging environment",
  ];

  return (
    <aside className="incidents-right-sidebar">
      <div className="incidents-sticky-box">
        {/* Commander Profile Card */}
        <AuthorCard article={article} />

        {/* Action Items & Preventative Measures */}
        <div className="incidents-sidebar-panel">
          <h3>
            <FiShield className="icon" /> Action Items & Remediation
          </h3>
          <div className="action-items-list">
            {actionItems.map((item, idx) => (
              <div key={idx} className="action-item">
                <FiCheckSquare className="check-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA & Regional Impact Radius */}
        <div className="incidents-sidebar-panel impact-box">
          <h3>
            <FiActivity className="icon" /> Impact Radius Specs
          </h3>
          <div className="impact-specs">
            <div className="spec-row">
              <span className="label">Availability SLA Impact:</span>
              <span className="val text-amber">99.94%</span>
            </div>
            <div className="spec-row">
              <span className="label">Affected Regions:</span>
              <span className="val">US-East, EU-West</span>
            </div>
            <div className="spec-row">
              <span className="label">Detection Source:</span>
              <span className="val">Datadog / Prometheus</span>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
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
