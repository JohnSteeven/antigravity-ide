import React from "react";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const LifeLeftSidebar = ({
  article,
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const favoriteQuote = article.favoriteQuote || "In the middle of difficulty lies opportunity.";

  return (
    <aside className="life-left-sidebar">
      <div className="life-sticky-box">
        {headings.length > 0 && (
          <div className="life-toc-panel">
            <h3>Chapters & Sections</h3>
            <nav className="life-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`life-toc-link ${activeHeading === h.id ? "active" : ""}`}
                  style={h.level === 3 ? { paddingLeft: "20px", fontSize: "0.85rem", opacity: 0.8 } : undefined}
                >
                  <span className="bullet">✦</span> {h.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        <div className="life-progress-panel">
          <ReadingProgress scrollProgress={scrollProgress} article={article} />
        </div>

        {favoriteQuote && (
          <div className="life-sidebar-quote-panel">
            <h4>Reflection Quote</h4>
            <p>"{favoriteQuote}"</p>
          </div>
        )}

        <div className="life-streak-panel">
          <div className="streak-icon">🔥</div>
          <div>
            <h5>Reading Streak</h5>
            <p>3 Days Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LifeLeftSidebar;
