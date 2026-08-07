import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiBookmark,
  FiHeart,
  FiFolder,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useCms } from "../../context/CmsContext";
import { articleApi } from "../../services/apiService";

const getReadingMins = (article) => {
  if (!article) return 1;
  if (typeof article.readTimeMinutes === "number") return article.readTimeMinutes;
  const text = (article.content || article.excerpt || article.description || article.title || "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatReadTime = (article) => {
  if (article?.readTime) return article.readTime;
  if (article?.readingTime) return article.readingTime;
  return `${getReadingMins(article)} min read`;
};

const ArticleItem = ({ article }) => (
  <Link className="rp-article-row" to={`/articles/${article.slug}`}>
    <div className="rp-article-body">
      <div className="rp-article-title">{article.title}</div>
      <div className="rp-article-meta">
        <span className="rp-article-cat">{article.category || "Article"}</span>
        <span>·</span>
        <span className="rp-article-time">
          <FiClock style={{ fontSize: "0.75rem" }} />
          {formatReadTime(article)}
        </span>
      </div>
    </div>
  </Link>
);

const SavedTab = () => {
  const { user } = useAuth();
  const { data } = useCms();
  const profile = user?.profile || {};

  const [activeSubtab, setActiveSubtab] = useState("saved");
  const [saved, setSaved] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  const [liked, setLiked] = useState([]);
  const [collections, setCollections] = useState([
    { id: "col-1", title: "Must Reads", count: 3, icon: "📌" },
    { id: "col-2", title: "Tech & Coding", count: 2, icon: "💻" },
    { id: "col-3", title: "Personal Growth", count: 4, icon: "🌱" },
  ]);

  useEffect(() => {
    const ids = profile.savedArticles || [];
    if (!ids.length) { setSaved([]); return; }
    articleApi.list({ ids: ids.join(","), limit: ids.length })
      .then((r) => setSaved(r.articles || []))
      .catch(() => setSaved(data.articles.filter((a) => ids.includes(a.id) || ids.includes(a._id))));
  }, [profile.savedArticles, data.articles]);

  useEffect(() => {
    const ids = profile.bookmarks || [];
    if (!ids.length) { setBookmarked([]); return; }
    articleApi.list({ ids: ids.join(","), limit: ids.length })
      .then((r) => setBookmarked(r.articles || []))
      .catch(() => setBookmarked(data.articles.filter((a) => ids.includes(a.id) || ids.includes(a._id))));
  }, [profile.bookmarks, data.articles]);

  useEffect(() => {
    const ids = profile.likedArticles || [];
    if (!ids.length) { setLiked([]); return; }
    articleApi.list({ ids: ids.join(","), limit: ids.length })
      .then((r) => setLiked(r.articles || []))
      .catch(() => setLiked(data.articles.filter((a) => ids.includes(a.id) || ids.includes(a._id))));
  }, [profile.likedArticles, data.articles]);

  return (
    <div>
      {/* Subtab navigation */}
      <div className="rp-saved-subtabs" role="tablist">
        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "saved" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("saved")}
        >
          <FiBookOpen /> Saved Articles
          <span className="rp-count-badge">{saved.length}</span>
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "bookmarks" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("bookmarks")}
        >
          <FiBookmark /> Bookmarks
          <span className="rp-count-badge">{bookmarked.length}</span>
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "liked" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("liked")}
        >
          <FiHeart /> Likes
          <span className="rp-count-badge">{liked.length}</span>
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "collections" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("collections")}
        >
          <FiFolder /> Collections
          <span className="rp-count-badge">{collections.length}</span>
        </button>
      </div>

      {/* Subtab 1: Saved Articles */}
      {activeSubtab === "saved" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiBookOpen style={{ color: "var(--teal, #426c67)" }} /> Saved Articles ({saved.length})
          </h3>
          {saved.length > 0 ? (
            <div>
              {saved.map((art) => (
                <ArticleItem key={art.id || art._id} article={art} />
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">📖</span>
              <div className="rp-empty-title">No saved articles yet</div>
              <div className="rp-empty-desc">
                Save stories while reading to build your personal reading list.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Bookmarks */}
      {activeSubtab === "bookmarks" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiBookmark style={{ color: "var(--clay, #a5855f)" }} /> Bookmarks ({bookmarked.length})
          </h3>
          {bookmarked.length > 0 ? (
            <div>
              {bookmarked.map((art) => (
                <ArticleItem key={art.id || art._id} article={art} />
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">🔖</span>
              <div className="rp-empty-title">No bookmarks saved</div>
              <div className="rp-empty-desc">
                Bookmark articles to quickly find them later.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Likes */}
      {activeSubtab === "liked" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiHeart style={{ color: "#ef4444" }} /> Liked Articles ({liked.length})
          </h3>
          {liked.length > 0 ? (
            <div>
              {liked.map((art) => (
                <ArticleItem key={art.id || art._id} article={art} />
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">❤️</span>
              <div className="rp-empty-title">No liked articles yet</div>
              <div className="rp-empty-desc">
                Like stories across MyJourney to collect your favorites here.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Collections */}
      {activeSubtab === "collections" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiFolder style={{ color: "var(--teal, #426c67)" }} /> Custom Collections ({collections.length})
          </h3>
          <div className="rp-collections-grid">
            {collections.map((col) => (
              <div key={col.id} className="rp-collection-card">
                <div className="rp-collection-icon">{col.icon}</div>
                <div className="rp-collection-title">{col.title}</div>
                <div className="rp-collection-count">{col.count} items</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedTab;
