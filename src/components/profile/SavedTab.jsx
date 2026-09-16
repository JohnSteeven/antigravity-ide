import { useState } from "react";
import { Link } from "react-router";
import { FiBookOpen, FiBookmark, FiHeart } from "react-icons/fi";
import { useReader } from "../../hooks/useReader";

const ArticleItem = ({ article }) => (
  <Link className="rp-article-row" to={`/${article.contentType === "story" ? "stories" : "articles"}/${article.slug}`}>
    <div className="rp-article-body">
      <div className="rp-article-title">{article.title}</div>
      <div className="rp-article-meta"><span className="rp-article-cat">{article.category || "Article"}</span></div>
    </div>
  </Link>
);

const EmptyState = ({ title, description }) => (
  <div className="rp-empty">
    <span className="rp-empty-icon">📖</span>
    <div className="rp-empty-title">{title}</div>
    <div className="rp-empty-desc">{description}</div>
  </div>
);

const SavedTab = () => {
  const { library, loading, error } = useReader();
  const [activeSubtab, setActiveSubtab] = useState("saved");
  const tabs = [
    { id: "saved", label: "Saved Articles", icon: <FiBookOpen />, items: library.saved },
    { id: "savedStories", label: "Saved Stories", icon: <FiBookOpen />, items: library.savedStories || [] },
    { id: "bookmarked", label: "Bookmarks", icon: <FiBookmark />, items: library.bookmarked },
    { id: "liked", label: "Likes", icon: <FiHeart />, items: library.liked },
  ];
  const active = tabs.find((tab) => tab.id === activeSubtab) || tabs[0];

  if (loading && !active.items.length) return <div className="rp-empty">Loading your reading library…</div>;
  if (error && !active.items.length) return <EmptyState title="Reading library is unavailable" description={error} />;

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
            {tab.icon} {tab.label}<span className="rp-count-badge">{tab.items.length}</span>
          </button>
        ))}
      </div>

      <div className="rp-card">
        <h3 className="rp-section-title">{active.icon} {active.label} ({active.items.length})</h3>
        {active.items.length ? active.items.map((article) => <ArticleItem key={article.id} article={article} />) : (
          <EmptyState
            title={`No ${active.label.toLowerCase()} yet`}
            description="Save something to read later and find it here."
          />
        )}
      </div>
    </div>
  );
};

export default SavedTab;
