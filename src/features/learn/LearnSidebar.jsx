import React, { useId } from "react";
import { Link, useSearchParams } from "react-router";
import { FiSearch, FiX, FiArrowRight, FiBookOpen, FiCode, FiBriefcase, FiMessageCircle, FiTrendingUp, FiPenTool, FiCompass, FiGrid } from "react-icons/fi";

const TOPIC_ICONS = {
  coding: FiCode, business: FiBriefcase, career: FiBriefcase,
  communication: FiMessageCircle, english: FiMessageCircle,
  "data-analytics": FiTrendingUp, "finance-systems": FiTrendingUp,
  design: FiPenTool, "creative-practice": FiPenTool,
  entrepreneurship: FiCompass, education: FiBookOpen,
};

/**
 * LearnSidebar
 *
 * Desktop left discovery rail.
 *
 * Props
 * ─────
 * topics        – array of topic objects from the Learn home API response
 * search        – current topic search string (controlled)
 * onSearch      – (value: string) => void — updates search string in parent
 * activeTopicId – topic _id or slug currently active from URL params
 */
export default function LearnSidebar({ topics = [], search, onSearch, activeTopicId }) {
  const searchInputId = useId();
  const [searchParams] = useSearchParams();

  // Derive active topic id from URL if not passed explicitly
  const activeTopic = activeTopicId || searchParams.get("topic") || "";

  const filtered = React.useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase().trim();
    return topics.filter((t) => t.name?.toLowerCase().includes(q));
  }, [topics, search]);

  return (
    <aside className="learn-sidebar" aria-label="Explore Topics">
      {/* Header */}
      <div className="learn-sidebar-header">
        <p className="learn-sidebar-kicker">Explore</p>
        <h2 className="learn-sidebar-heading">Topics</h2>
        <p className="learn-sidebar-description">Follow your curiosity.</p>
      </div>

      {/* Search */}
      <div className="learn-sidebar-search-wrap">
        <label htmlFor={searchInputId} className="learn-sidebar-search-label">
          Search topics
        </label>
        <div className="learn-sidebar-search-field">
          <FiSearch className="learn-sidebar-search-icon" aria-hidden="true" />
          <input
            id={searchInputId}
            type="search"
            className="learn-sidebar-search-input"
            placeholder="Search topics…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search topics"
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              className="learn-sidebar-search-clear"
              onClick={() => onSearch("")}
              aria-label="Clear topic search"
            >
              <FiX aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Topic list */}
      <nav className="learn-sidebar-nav" aria-label="Topic navigation">
        <Link to="/learn/courses" className={`learn-sidebar-topic learn-sidebar-all${!activeTopic ? " is-active" : ""}`} aria-current={!activeTopic ? "page" : undefined}>
          <FiGrid aria-hidden="true" /><span>All courses</span><FiArrowRight className="learn-sidebar-all-arrow" aria-hidden="true" />
        </Link>
        <p className="learn-sidebar-list-label">Browse by topic <span>{filtered.length}</span></p>
        {filtered.length > 0 ? (
          <ul className="learn-sidebar-list" role="list">
            {filtered.map((topic) => {
              const topicSlug = topic.slug || (topic.name ? topic.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : String(topic._id));
              const isActive = activeTopic === topicSlug || activeTopic === topic.slug || activeTopic === String(topic._id);
              const Icon = TOPIC_ICONS[topicSlug] || FiBookOpen;
              return (
                <li key={topic._id || topicSlug}>
                  <Link
                    to={`/learn/courses?topic=${encodeURIComponent(topicSlug)}`}
                    className={`learn-sidebar-topic${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{topic.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="learn-sidebar-empty">
            No topics matching &ldquo;{search}&rdquo;
          </p>
        )}
      </nav>

      {/* Footer link */}
      <div className="learn-sidebar-footer">
        <Link to="/learn/courses" className="learn-sidebar-browse-all">
          Browse all Courses <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
