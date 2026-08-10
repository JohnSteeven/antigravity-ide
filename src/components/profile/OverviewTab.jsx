import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookmark,
  FiHeart,
  FiMessageCircle,
  FiEdit3,
  FiZap,
  FiTarget,
  FiClock,
  FiAward,
  FiActivity,
  FiBookOpen,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useCms } from "../../context/CmsContext";
import { articleApi } from "../../services/apiService";
import { getFullName } from "../../utils/helpers";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

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

const ArticleRow = ({ article }) => (
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

const SectionCard = ({ title, icon, children }) => (
  <div className="rp-card" style={{ marginBottom: 16 }}>
    <h3 className="rp-section-title" style={{ marginBottom: 14 }}>
      {icon} {title}
    </h3>
    {children}
  </div>
);

const DEFAULT_BADGES = [
  { emoji: "📚", title: "Bookworm", desc: "Saved 5+ articles" },
  { emoji: "🔥", title: "Streak Starter", desc: "7-day reading streak" },
  { emoji: "💬", title: "Commentator", desc: "Left first comment" },
];

const OverviewTab = () => {
  const { user } = useAuth();
  const { data } = useCms();
  const profile  = user?.profile || {};
  const fullName = getFullName(user);

  const [bookmarked, setBookmarked] = useState([]);
  const [liked, setLiked]           = useState([]);
  const [saved, setSaved]           = useState([]);

  const isAuthorOrAdmin = ["admin", "author"].includes((user?.role || "").toLowerCase());

  const authoredArticles = useMemo(
    () => data.articles.filter(
      (a) => a.status === "published" &&
             a.author?.toLowerCase() === fullName.toLowerCase()
    ),
    [data.articles, fullName]
  );

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

  useEffect(() => {
    const ids = profile.savedArticles || [];
    if (!ids.length) { setSaved([]); return; }
    articleApi.list({ ids: ids.join(","), limit: ids.length })
      .then((r) => setSaved(r.articles || []))
      .catch(() => setSaved(data.articles.filter((a) => ids.includes(a.id) || ids.includes(a._id))));
  }, [profile.savedArticles, data.articles]);

  // Reading stats
  const totalReadingMins = useMemo(() => {
    const seen = new Set();
    let sum = 0;
    [...bookmarked, ...liked, ...saved].forEach((art) => {
      const key = art.id || art._id || art.slug;
      if (key && !seen.has(key)) { seen.add(key); sum += getReadingMins(art); }
    });
    return sum;
  }, [bookmarked, liked, saved]);

  const streak         = profile.currentStreakDays || 0;
  const weeklyGoal     = profile.readingGoal || { articlesPerWeekTarget: 5, articlesReadThisWeek: 0 };
  const goalPct        = Math.min(Math.round((weeklyGoal.articlesReadThisWeek / (weeklyGoal.articlesPerWeekTarget || 1)) * 100), 100);
  const totalComments  = (profile.comments || []).length;
  const recentActivity = [
    ...(bookmarked.slice(0, 1).map((a) => ({ type: "bookmark", text: `Bookmarked "${a.title}"`, date: "", dot: "gold" }))),
    ...(liked.slice(0, 1).map((a) => ({ type: "like", text: `Liked "${a.title}"`, date: "", dot: "rose" }))),
    ...((profile.comments || []).slice(0, 1).map((c) => ({ type: "comment", text: `Commented on "${c.articleTitle}"`, date: formatDate(c.createdAt), dot: "teal" }))),
  ];

  const badges = profile.achievements?.length
    ? profile.achievements.map((b, i) => ({ emoji: b.emoji || "🏅", title: b.title, desc: b.description }))
    : DEFAULT_BADGES;

  return (
    <div>
      {/* ── Stats Row ── */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon teal"><FiBookmark /></div>
          <div className="rp-stat-value">{bookmarked.length}</div>
          <div className="rp-stat-label">Bookmarks</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon rose"><FiHeart /></div>
          <div className="rp-stat-value">{liked.length}</div>
          <div className="rp-stat-label">Liked</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon gold"><FiMessageCircle /></div>
          <div className="rp-stat-value">{totalComments}</div>
          <div className="rp-stat-label">Comments</div>
        </div>
        {isAuthorOrAdmin ? (
          <div className="rp-stat-card">
            <div className="rp-stat-icon purple"><FiEdit3 /></div>
            <div className="rp-stat-value">{authoredArticles.length}</div>
            <div className="rp-stat-label">Published</div>
          </div>
        ) : (
          <div className="rp-stat-card">
            <div className="rp-stat-icon amber"><FiClock /></div>
            <div className="rp-stat-value">{totalReadingMins}</div>
            <div className="rp-stat-label">Mins Saved</div>
          </div>
        )}
      </div>

      <div className="rp-overview-grid">
        {/* ── Main column ── */}
        <div>
          {/* Streak */}
          <div className={`rp-streak-card${streak === 0 ? " is-zero" : ""}`} style={{ marginBottom: 16 }}>
            <span className="rp-streak-icon">⚡</span>
            <div>
              <div className="rp-streak-value">{streak} Days</div>
              <div className="rp-streak-label">Current Reading Streak</div>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="rp-goal-card">
            <div className="rp-goal-header">
              <div className="rp-goal-title">
                <FiTarget style={{ color: "#a5855f" }} />
                Weekly Reading Goal
              </div>
              <div className="rp-goal-pct">{goalPct}%</div>
            </div>
            <div className="rp-goal-track">
              <div className="rp-goal-bar" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="rp-goal-sub">
              {weeklyGoal.articlesReadThisWeek} / {weeklyGoal.articlesPerWeekTarget} articles this week
            </div>
          </div>

          {/* Continue Reading Preview */}
          {saved.length > 0 && (
            <SectionCard title="Continue Reading" icon={<FiBookOpen />}>
              {saved.slice(0, 3).map((a) => <ArticleRow key={a.id || a._id} article={a} />)}
              {saved.length > 3 && (
                <div style={{ marginTop: 10 }}>
                  <Link to="/profile?tab=reading" className="rp-show-more-btn">
                    See all {saved.length} articles →
                  </Link>
                </div>
              )}
            </SectionCard>
          )}

          {/* Bookmarks preview */}
          {bookmarked.length > 0 && (
            <SectionCard title="Recent Bookmarks" icon={<FiBookmark />}>
              {bookmarked.slice(0, 3).map((a) => <ArticleRow key={a.id || a._id} article={a} />)}
              {bookmarked.length > 3 && (
                <div style={{ marginTop: 10 }}>
                  <Link to="/profile?tab=saved" className="rp-show-more-btn">
                    View all bookmarks →
                  </Link>
                </div>
              )}
            </SectionCard>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <SectionCard title="Recent Activity" icon={<FiActivity />}>
              <div className="rp-activity-list">
                {recentActivity.map((item, i) => (
                  <div key={i} className="rp-activity-item">
                    <div className={`rp-activity-dot ${item.dot}`} />
                    <div style={{ flex: 1 }}>{item.text}</div>
                    {item.date && <div className="rp-activity-date">{item.date}</div>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="rp-sidebar">
          {/* Badges */}
          <SectionCard title="Badges" icon={<FiAward />}>
            <div className="rp-badges-grid">
              {badges.map((b, i) => (
                <div key={i} className="rp-badge-item">
                  <div className="rp-badge-emoji">{b.emoji}</div>
                  <div className="rp-badge-title">{b.title}</div>
                  {b.desc && <div className="rp-badge-desc">{b.desc}</div>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Total reading time */}
          <div className="rp-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="rp-stat-icon teal" style={{ width: 44, height: 44, borderRadius: 12, fontSize: "1.2rem" }}>
              <FiClock />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800, color: "#a5855f" }}>
                Total Reading Time
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--ink, #1e293b)" }}>
                {totalReadingMins} mins
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--muted, #64748b)" }}>
                across {bookmarked.length + liked.length + saved.length} saved items
              </div>
            </div>
          </div>

          {/* Author stats (role-gated) */}
          {isAuthorOrAdmin && authoredArticles.length > 0 && (
            <SectionCard title="Articles Published" icon={<FiTrendingUp />}>
              {authoredArticles.slice(0, 3).map((a) => (
                <ArticleRow key={a.id || a._id} article={a} />
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
