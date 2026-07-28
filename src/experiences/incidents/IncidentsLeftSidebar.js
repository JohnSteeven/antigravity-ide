import React from "react";
import { FiClock, FiServer, FiUsers, FiLayers, FiAlertCircle } from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const IncidentsLeftSidebar = ({
  article,
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const chronology = article.chronology || [
    "14:02 UTC - Elevated Error Rate & Latency Spike",
    "14:08 UTC - Automated PagerDuty Alert Triggered",
    "14:15 UTC - Incident Commander Identified Root Cause",
    "14:28 UTC - Database Failover & Hotfix Deployed",
    "14:44 UTC - System Fully Restored & Verified",
  ];

  const affectedServices = article.affectedServices || [
    "Authentication API",
    "Primary DB Cluster",
    "Session Cache",
  ];

  return (
    <aside className="incidents-left-sidebar">
      <div className="incidents-sticky-box">
        {/* Incident Chronology Timeline */}
        <div className="incidents-sidebar-panel">
          <h3>
            <FiClock className="icon" /> Incident Chronology
          </h3>
          <div className="chronology-timeline">
            {chronology.map((eventText, idx) => {
              const parts = eventText.split(" - ");
              const timestamp = parts[0] || `T+${idx * 10}m`;
              const detail = parts[1] || eventText;

              return (
                <div key={idx} className="chrono-item">
                  <div className="chrono-time">{timestamp}</div>
                  <div className="chrono-desc">{detail}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Affected Systems & Microservices */}
        <div className="incidents-sidebar-panel">
          <h3>
            <FiServer className="icon" /> Affected Systems
          </h3>
          <div className="systems-list">
            {affectedServices.map((svc, idx) => (
              <div key={idx} className="system-badge">
                <span className="dot red"></span>
                <span>{svc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section TOC */}
        {headings.length > 0 && (
          <div className="incidents-sidebar-panel">
            <h3>
              <FiLayers className="icon" /> Report Sections
            </h3>
            <nav className="incidents-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`incidents-toc-link ${activeHeading === h.id ? "active" : ""}`}
                >
                  <span className="toc-bullet">&gt;</span>
                  <span className="toc-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Reading Progress */}
        <ReadingProgress scrollProgress={scrollProgress} />
      </div>
    </aside>
  );
};

export default IncidentsLeftSidebar;
