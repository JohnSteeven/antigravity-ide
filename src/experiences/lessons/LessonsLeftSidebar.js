import React from "react";
import { FiBookOpen, FiCheckCircle, FiSun, FiLayers, FiCompass } from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const LessonsLeftSidebar = ({
  article,
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const principles = article.principles || [
    "01. Master Attention Over Intention",
    "02. Embrace Radical Acceptance & Stillness",
    "03. Build Habit Systems That Align With Identity",
    "04. Reflect Daily & Measure What Truly Matters",
  ];

  const habits = article.reflectionHabits || [
    "Morning 10-Min Journaling",
    "Daily Unplugged Walk",
    "Evening Gratitude Audit",
  ];

  return (
    <aside className="lessons-left-sidebar">
      <div className="lessons-sticky-box">
        {/* Core Principles Index */}
        <div className="lessons-sidebar-panel">
          <h3>
            <FiBookOpen className="icon" /> Core Principles
          </h3>
          <div className="principles-index">
            {principles.map((item, idx) => (
              <div key={idx} className="principle-node">
                <span className="node-num">P{idx + 1}</span>
                <span className="node-title">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section TOC */}
        {headings.length > 0 && (
          <div className="lessons-sidebar-panel">
            <h3>
              <FiLayers className="icon" /> Reflection Chapters
            </h3>
            <nav className="lessons-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`lessons-toc-link ${activeHeading === h.id ? "active" : ""}`}
                >
                  <span className="toc-bullet">✦</span>
                  <span className="toc-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Daily Reflection Habits */}
        <div className="lessons-sidebar-panel habits-panel">
          <h3>
            <FiSun className="icon" /> Daily Mindset Habits
          </h3>
          <div className="habits-list">
            {habits.map((habit, idx) => (
              <div key={idx} className="habit-item">
                <FiCheckCircle className="check-icon" />
                <span>{habit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Progress */}
        <ReadingProgress scrollProgress={scrollProgress} />
      </div>
    </aside>
  );
};

export default LessonsLeftSidebar;
