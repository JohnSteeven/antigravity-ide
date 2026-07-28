import React, { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiActivity, FiCopy, FiCheck, FiDownload, FiShare2, FiShield } from "react-icons/fi";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";

const IncidentsHero = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  const severity = article.severity || "SEV-1 Critical";
  const incidentStatus = article.incidentStatus || "Mitigated & Resolved";
  const outageDuration = article.outageDuration || "42 Minutes";
  const impactedUsers = article.estimatedTime || "12.4% Traffic Impacted";

  const handleCopyTimeline = () => {
    const timelineText = (article.chronology || []).join("\n");
    navigator.clipboard.writeText(timelineText || "Incident timeline copied.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="incidents-hero">
      <div className="incidents-hero-container">
        {/* Status Alert Banner */}
        <div className="incidents-status-bar">
          <div className="status-badge-pulse">
            <span className="pulse-dot"></span>
            <span className="status-text">{incidentStatus}</span>
          </div>
          <div className="severity-badge">{severity}</div>
        </div>

        {/* Hero Body */}
        <div className="incidents-hero-body">
          <Breadcrumbs
            items={[
              { label: article.category || "Incidents", to: "/category/incidents" },
              { label: article.title },
            ]}
          />

          <h1 className="incidents-title">
            <FiAlertTriangle className="title-icon" /> {article.title}
          </h1>

          {article.subtitle && (
            <p className="incidents-subtitle">{article.subtitle}</p>
          )}

          {/* Incident Metrics Strip */}
          <div className="incidents-metrics-strip">
            <div className="metric-box">
              <span className="metric-label">Outage Duration</span>
              <span className="metric-val">{outageDuration}</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Severity Level</span>
              <span className="metric-val text-red">{severity}</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Impact Scope</span>
              <span className="metric-val">{impactedUsers}</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Resolution Status</span>
              <span className="metric-val text-green">{incidentStatus}</span>
            </div>
          </div>

          {/* Author / Incident Commander Row */}
          <div className="incidents-author-row">
            <div className="commander-avatar">
              <FiShield />
            </div>
            <div className="incidents-author-meta">
              <span className="incidents-author-name">
                {article.author?.name || "Noble John Steeven (SRE Lead)"}
              </span>
              <span className="incidents-dates">
                Post-Mortem Published {article.publishedAt || "Recently"} • {article.readingTime || 7} min read
              </span>
            </div>

            <button className="copy-timeline-btn" onClick={handleCopyTimeline}>
              {copied ? <FiCheck /> : <FiCopy />}
              <span>{copied ? "Timeline Copied!" : "Copy Chronology"}</span>
            </button>
          </div>

          {/* Engagement Bar */}
          <EngagementBar
            article={article}
            isLiked={isLiked}
            handleLikeToggle={handleLikeToggle}
            isBookmarked={isBookmarked}
            handleBookmarkToggle={handleBookmarkToggle}
            isSaved={isSaved}
            handleSaveToggle={handleSaveToggle}
            handleCopyLink={handleCopyLink}
          />
        </div>
      </div>
    </header>
  );
};

export default IncidentsHero;
