import React from "react";
import { FiMapPin, FiNavigation, FiCalendar, FiGlobe, FiInfo, FiLayers, FiCompass } from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const TravelLeftSidebar = ({
  article,
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const itinerary = article.itinerary || [
    "Day 1: Arrival & Exploring Historic Streets",
    "Day 2: Morning Temples & Bamboo Forest Walk",
    "Day 3: Culinary Market Tour & Evening Tea",
    "Day 4: Mountain Scenic Railway Expedition",
  ];

  const location = article.location || "Kyoto, Japan";

  return (
    <aside className="travel-left-sidebar">
      <div className="travel-sticky-box">
        {/* Day-by-Day Itinerary Timeline */}
        <div className="travel-sidebar-panel">
          <h3>
            <FiCalendar className="icon" /> Expedition Itinerary
          </h3>
          <div className="itinerary-timeline">
            {itinerary.map((dayText, idx) => (
              <div key={idx} className="timeline-node">
                <div className="node-dot">0{idx + 1}</div>
                <div className="node-text">{dayText}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Article Sections TOC */}
        {headings.length > 0 && (
          <div className="travel-sidebar-panel">
            <h3>
              <FiLayers className="icon" /> Chapters & Sections
            </h3>
            <nav className="travel-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`travel-toc-link ${activeHeading === h.id ? "active" : ""}`}
                >
                  <span className="toc-bullet">✦</span>
                  <span className="toc-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Location Quick Facts */}
        <div className="travel-sidebar-panel">
          <h3>
            <FiGlobe className="icon" /> Location Quick Facts
          </h3>
          <div className="quick-facts-list">
            <div className="fact-item">
              <span className="fact-label">Region:</span>
              <span className="fact-val">{location}</span>
            </div>
            <div className="fact-item">
              <span className="fact-label">Currency:</span>
              <span className="fact-val">Japanese Yen (JPY ¥)</span>
            </div>
            <div className="fact-item">
              <span className="fact-label">Language:</span>
              <span className="fact-val">Japanese</span>
            </div>
            <div className="fact-item">
              <span className="fact-label">Time Zone:</span>
              <span className="fact-val">GMT+9 (JST)</span>
            </div>
          </div>
        </div>

        {/* Essential Travel Tips */}
        {article.tips && (
          <div className="travel-sidebar-panel tips-panel">
            <h3>
              <FiInfo className="icon" /> Essential Tips
            </h3>
            <p className="tips-text">{article.tips}</p>
          </div>
        )}

        {/* Reading Progress */}
        <ReadingProgress scrollProgress={scrollProgress} />
      </div>
    </aside>
  );
};

export default TravelLeftSidebar;
