import React from "react";
import { FiMap, FiSmile, FiFlag, FiList, FiBookmark } from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const DEFAULT_JOURNEY_TIMELINE = [
  { chapter: "Chapter 1", title: "Beginning", hash: "#beginning" },
  { chapter: "Chapter 2", title: "Conflict", hash: "#conflict" },
  { chapter: "Chapter 3", title: "Lowest Point", hash: "#lowest-point" },
  { chapter: "Chapter 4", title: "Turning Point", hash: "#turning-point" },
  { chapter: "Chapter 5", title: "Growth", hash: "#growth" },
  { chapter: "Chapter 6", title: "Today", hash: "#today" },
];

const DEFAULT_EMOTIONAL_JOURNEY = [
  { emotion: "Excited", emoji: "😊" },
  { emotion: "Confused", emoji: "😕" },
  { emotion: "Down", emoji: "😞" },
  { emotion: "Frustrated", emoji: "😤" },
  { emotion: "Recovering", emoji: "🙂" },
  { emotion: "Confident", emoji: "😁" },
  { emotion: "Grateful", emoji: "🙏" },
];

const DEFAULT_MILESTONES = [
  { title: "First Warning", desc: "Subtle indicators that a shift was coming." },
  { title: "Biggest Mistake", desc: "The painful misstep that forced reality to set in." },
  { title: "Unexpected Help", desc: "A key conversation that opened a new perspective." },
  { title: "Final Decision", desc: "Committing fully to a new path." },
  { title: "New Beginning", desc: "Standing on firmer ground with renewed focus." },
];

const IncidentsLeftSidebar = ({
  article = {},
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  // Dynamic story-aware emotional journey generator matching story topic
  const getDynamicEmotionalJourney = (art) => {
    if (art.emotionalJourney && art.emotionalJourney.length > 0) {
      return art.emotionalJourney;
    }
    const text = `${art.title || ""} ${art.mood || ""} ${art.category || ""} ${art.subcategory || ""}`.toLowerCase();
    if (text.includes("flight") || text.includes("travel") || text.includes("airport") || text.includes("delay")) {
      return [
        { emotion: "Rushed", emoji: "🏃" },
        { emotion: "Frustrated", emoji: "😤" },
        { emotion: "Resigned", emoji: "😮‍💨" },
        { emotion: "Curious", emoji: "🤔" },
        { emotion: "Inspired", emoji: "💡" },
        { emotion: "Grateful", emoji: "🙏" },
      ];
    }
    if (text.includes("fail") || text.includes("launch") || text.includes("product") || text.includes("mistake")) {
      return [
        { emotion: "Ambitious", emoji: "🚀" },
        { emotion: "Focused", emoji: "💻" },
        { emotion: "Nervous", emoji: "😰" },
        { emotion: "Disappointed", emoji: "😞" },
        { emotion: "Humble", emoji: "🧘" },
        { emotion: "Determined", emoji: "💪" },
      ];
    }
    if (text.includes("job") || text.includes("layoff") || text.includes("career") || text.includes("work")) {
      return [
        { emotion: "Comfortable", emoji: "🛋️" },
        { emotion: "Shocked", emoji: "⚡" },
        { emotion: "Anxious", emoji: "😰" },
        { emotion: "Hopeful", emoji: "🌤️" },
        { emotion: "Empowered", emoji: "💪" },
        { emotion: "Fulfilled", emoji: "🌟" },
      ];
    }
    if (text.includes("conversation") || text.includes("mentor") || text.includes("leader") || text.includes("advice")) {
      return [
        { emotion: "Eager", emoji: "⚡" },
        { emotion: "Defensive", emoji: "🛡️" },
        { emotion: "Surprised", emoji: "😮" },
        { emotion: "Reflective", emoji: "🤔" },
        { emotion: "Inspired", emoji: "💡" },
        { emotion: "Grateful", emoji: "🙏" },
      ];
    }
    return [
      { emotion: "Overworked", emoji: "⚡" },
      { emotion: "Exhausted", emoji: "🛑" },
      { emotion: "Reflective", emoji: "🧘" },
      { emotion: "Epiphany", emoji: "💡" },
      { emotion: "Renewed", emoji: "🌱" },
      { emotion: "Peaceful", emoji: "🙏" },
    ];
  };

  const journeyTimeline = (article.journeyTimeline && article.journeyTimeline.length > 0)
    ? article.journeyTimeline
    : headings && headings.length > 0
      ? headings.map((h, idx) => ({
          chapter: `Chapter ${idx + 1}`,
          title: h.text,
          hash: `#${h.id}`,
        }))
      : DEFAULT_JOURNEY_TIMELINE;

  const emotionalJourney = getDynamicEmotionalJourney(article);
  const milestones = article.milestones || article.turningMoments || DEFAULT_MILESTONES;
  const quickNote = article.quickNote || article.quoteNote || article.heroQuote || "Growth begins when comfort ends.";

  const showTimeline = article.journeyTimeline !== false;
  const showEmotional = article.emotionalJourney !== false;
  const showMilestones = article.milestones !== false;
  const showQuickNote = article.quickNote !== false;
  const toRoman = (num) => {
    const map = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" };
    return map[num] || num;
  };

  return (
    <aside className="incidents-left-sidebar experience-left-sidebar">
      <div className="incidents-sticky-box">
        {/* 1. Book Chapters & Apple Vertical Timeline */}
        {showTimeline && journeyTimeline && journeyTimeline.length > 0 && (
          <div className="incidents-sidebar-panel journey-timeline-panel magazine-chapters-panel">
            <h3 className="sidebar-section-title">
              <FiMap className="icon" /> Story Chapters
            </h3>
            <div className="apple-vertical-timeline">
              {journeyTimeline.map((item, idx) => (
                <a
                  key={idx}
                  href={item.hash || `#heading-${idx}`}
                  className="apple-timeline-node"
                >
                  <div className="apple-node-indicator">
                    <span className="apple-dot">●</span>
                    {idx < journeyTimeline.length - 1 && <span className="apple-line"></span>}
                  </div>
                  <div className="apple-node-text">
                    <span className="chapter-roman">CHAPTER {toRoman(idx + 1)}</span>
                    <span className="step-title">{item.title}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 2. Emotional Journey (Vertical Flow with Emoji Nodes) */}
        {showEmotional && emotionalJourney && emotionalJourney.length > 0 && (
          <div className="incidents-sidebar-panel emotional-journey-panel magazine-emotional-panel">
            <h3 className="sidebar-section-title">
              <FiSmile className="icon" /> Emotional Progression
            </h3>
            <div className="emotional-steps-vertical-flow">
              {emotionalJourney.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="emotional-glass-node">
                    <span className="emotion-emoji">{step.emoji || "🙂"}</span>
                    <span className="emotion-name">{step.emotion}</span>
                  </div>
                  {idx < emotionalJourney.length - 1 && (
                    <div className="emotional-flow-arrow">↓</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 3. Milestones (Magazine Index Style 01, 02, 03) */}
        {showMilestones && milestones && milestones.length > 0 && (
          <div className="incidents-sidebar-panel milestones-panel magazine-milestones-panel">
            <h3 className="sidebar-section-title">
              <FiFlag className="icon" /> Turning Milestones
            </h3>
            <div className="magazine-milestones-list">
              {milestones.map((m, idx) => (
                <div key={idx} className="magazine-milestone-row">
                  <div className="magazine-num-col">
                    <span className="magazine-num">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                    {idx < milestones.length - 1 && <span className="milestone-line"></span>}
                  </div>
                  <div className="magazine-milestone-body">
                    <h4>{m.title}</h4>
                    {m.desc && <p>{m.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Story Navigation (TOC) */}
        {headings && headings.length > 0 && (
          <div className="incidents-sidebar-panel story-nav-panel">
            <h3>
              <FiList className="icon" /> Story Navigation
            </h3>
            <nav className="incidents-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`incidents-toc-link ${activeHeading === h.id ? "active" : ""}`}
                >
                  <span className="toc-bullet">•</span>
                  <span className="toc-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* 5. Reading Progress */}
        <ReadingProgress scrollProgress={scrollProgress} />

        {/* 6. Quick Notes */}
        {showQuickNote && quickNote && (
          <div className="incidents-sidebar-panel quick-note-panel">
            <h3>
              <FiBookmark className="icon" /> Quick Note
            </h3>
            <blockquote className="quick-note-quote">
              "{quickNote}"
            </blockquote>
          </div>
        )}
      </div>
    </aside>
  );
};

export default IncidentsLeftSidebar;
