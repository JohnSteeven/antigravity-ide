import { useState } from "react";
import { Link } from "react-router";
import { FiBookOpen, FiCheckCircle, FiHeart, FiPlay } from "react-icons/fi";
import { useReader } from "../../hooks/useReader";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const EmptyState = ({ title, description }) => (
  <div className="rp-empty">
    <span className="rp-empty-icon">📖</span>
    <div className="rp-empty-title">{title}</div>
    <div className="rp-empty-desc">{description}</div>
  </div>
);

const LibraryRow = ({ article }) => (
  <Link className="rp-article-row" to={`/articles/${article.slug}`}>
    <div className="rp-article-body">
      <div className="rp-article-title">{article.title}</div>
      <div className="rp-article-meta"><span className="rp-article-cat">{article.category || "Article"}</span></div>
    </div>
  </Link>
);

const ReadingTab = () => {
  const { continueReading, completed, library, loading, error } = useReader();
  const [activeSubtab, setActiveSubtab] = useState("continue");

  if (loading && !continueReading.length && !completed.length) {
    return <div className="rp-empty">Loading reading history…</div>;
  }
  if (error && !continueReading.length && !completed.length) {
    return <EmptyState title="Reading history is unavailable" description={error} />;
  }

  const tabs = [
    { id: "continue", label: "Continue Reading", icon: <FiPlay />, count: continueReading.length },
    { id: "completed", label: "Completed", icon: <FiCheckCircle />, count: completed.length },
    { id: "saved", label: "Saved", icon: <FiBookOpen />, count: library.saved.length },
    { id: "liked", label: "Liked", icon: <FiHeart />, count: library.liked.length },
  ];

  return (
    <div>
      <div className="rp-saved-subtabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rp-subtab-btn${activeSubtab === tab.id ? " is-active" : ""}`}
            onClick={() => setActiveSubtab(tab.id)}
            aria-selected={activeSubtab === tab.id}
            role="tab"
          >
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeSubtab === "continue" && (
        <div className="rp-card">
          <h3 className="rp-section-title"><FiPlay style={{ color: "var(--teal, #426c67)" }} /> Continue Reading</h3>
          {continueReading.length ? (
            <div className="rp-continue-grid">
              {continueReading.map((item) => (
                <Link key={item.id} to={item.continueUrl} className="rp-continue-card">
                  <span style={{ fontSize: "0.72rem", color: "var(--gold-dark, #8f6b48)", fontWeight: 800 }}>{item.article.category || "Article"}</span>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.4 }}>{item.article.title}</div>
                  <div style={{ marginTop: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted, #64748b)", marginBottom: 6 }}>
                      <span>Progress</span><span>{Math.round(item.furthestProgressPercent)}%</span>
                    </div>
                    <div className="rp-progress-bar-wrap"><div className="rp-progress-fill" style={{ width: `${item.furthestProgressPercent}%` }} /></div>
                    {item.lastReadAt && <div style={{ marginTop: 8, fontSize: "0.72rem", color: "var(--muted, #64748b)" }}>Last read {formatDate(item.lastReadAt)}</div>}
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="No articles in progress" description="Start reading an Article to see your progress here." />}
        </div>
      )}

      {activeSubtab === "completed" && (
        <div className="rp-card">
          <h3 className="rp-section-title"><FiCheckCircle style={{ color: "var(--teal, #426c67)" }} /> Completed</h3>
          {completed.length ? completed.map((item) => (
            <Link key={item.id} className="rp-article-row" to={item.continueUrl}>
              <div className="rp-article-body">
                <div className="rp-article-title">{item.article.title}</div>
                <div className="rp-article-meta"><span className="rp-article-cat">{item.article.category || "Article"}</span><span>·</span><span>Completed {formatDate(item.completedAt)}</span></div>
              </div>
            </Link>
          )) : <EmptyState title="No completed Articles yet" description="Articles appear here only after completion is persisted." />}
        </div>
      )}

      {activeSubtab === "saved" && (
        <div className="rp-card">
          <h3 className="rp-section-title"><FiBookOpen style={{ color: "var(--teal, #426c67)" }} /> Saved</h3>
          {library.saved.length ? library.saved.map((article) => <LibraryRow key={article.id} article={article} />) : <EmptyState title="No saved Articles yet" description="Save an Article to add it to your reading list." />}
        </div>
      )}

      {activeSubtab === "liked" && (
        <div className="rp-card">
          <h3 className="rp-section-title"><FiHeart style={{ color: "#ef4444" }} /> Liked</h3>
          {library.liked.length ? library.liked.map((article) => <LibraryRow key={article.id} article={article} />) : <EmptyState title="No liked Articles yet" description="Liked Articles will appear here." />}
        </div>
      )}
    </div>
  );
};

export default ReadingTab;
