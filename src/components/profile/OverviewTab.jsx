import { Link } from "react-router";
import {
  FiAward,
  FiBookOpen,
  FiBookmark,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiTarget,
} from "react-icons/fi";
import { useReader } from "../../hooks/useReader";

const ProgressRow = ({ item }) => (
  <Link className="rp-article-row" to={item.continueUrl}>
    <div className="rp-article-body">
      <div className="rp-article-title">{item.article.title}</div>
      <div className="rp-article-meta">
        <span className="rp-article-cat">{item.article.category || "Article"}</span>
        <span>·</span>
        <span>{Math.round(item.furthestProgressPercent)}% read</span>
      </div>
    </div>
  </Link>
);

const SectionCard = ({ title, icon, children }) => (
  <div className="rp-card" style={{ marginBottom: 16 }}>
    <h3 className="rp-section-title" style={{ marginBottom: 14 }}>{icon} {title}</h3>
    {children}
  </div>
);

const OverviewTab = () => {
  const { reader, library, continueReading, loading, error } = useReader();
  const summary = reader?.readingSummary || { articlesRead: 0, activeReadingSeconds: 0 };
  const streak = reader?.streakSummary || { currentDays: 0 };
  const goal = reader?.goals || { articlesPerWeekTarget: 5, articlesReadThisWeek: 0 };
  const achievements = reader?.achievements || [];
  const goalPercent = Math.min(
    100,
    Math.round(((goal.articlesReadThisWeek || 0) / (goal.articlesPerWeekTarget || 1)) * 100)
  );
  const trackedMinutes = Math.floor((summary.activeReadingSeconds || 0) / 60);

  if (loading && !reader) return <div className="rp-empty">Loading your reader data…</div>;
  if (error && !reader) return <div className="rp-empty"><div className="rp-empty-title">Reader data is unavailable</div><div className="rp-empty-desc">{error}</div></div>;

  return (
    <div>
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon teal"><FiBookmark /></div>
          <div className="rp-stat-value">{library.saved.length}</div>
          <div className="rp-stat-label">Saved</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon rose"><FiHeart /></div>
          <div className="rp-stat-value">{library.liked.length}</div>
          <div className="rp-stat-label">Liked</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon gold"><FiCheckCircle /></div>
          <div className="rp-stat-value">{summary.articlesRead || 0}</div>
          <div className="rp-stat-label">Completed</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon amber"><FiClock /></div>
          <div className="rp-stat-value">{trackedMinutes}</div>
          <div className="rp-stat-label">Minutes Read</div>
        </div>
      </div>

      <div className="rp-overview-grid">
        <div>
          <div className={`rp-streak-card${streak.currentDays === 0 ? " is-zero" : ""}`} style={{ marginBottom: 16 }}>
            <span className="rp-streak-icon">⚡</span>
            <div>
              <div className="rp-streak-value">{streak.currentDays || 0} Days</div>
              <div className="rp-streak-label">Current Reading Streak</div>
            </div>
          </div>

          <div className="rp-goal-card">
            <div className="rp-goal-header">
              <div className="rp-goal-title"><FiTarget style={{ color: "#a5855f" }} /> Weekly Reading Goal</div>
              <div className="rp-goal-pct">{goalPercent}%</div>
            </div>
            <div className="rp-goal-track"><div className="rp-goal-bar" style={{ width: `${goalPercent}%` }} /></div>
            <div className="rp-goal-sub">
              {goal.articlesReadThisWeek || 0} / {goal.articlesPerWeekTarget || 0} completed articles this week
            </div>
          </div>

          <SectionCard title="Continue Reading" icon={<FiBookOpen />}>
            {continueReading.length ? (
              <>
                {continueReading.slice(0, 3).map((item) => <ProgressRow key={item.id} item={item} />)}
                {continueReading.length > 3 && <Link to="/profile?tab=reading" className="rp-show-more-btn">See all in-progress articles →</Link>}
              </>
            ) : (
              <div className="rp-empty">
                <div className="rp-empty-title">Nothing in progress</div>
                <div className="rp-empty-desc">Start reading an Article to see your progress here.</div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="rp-sidebar">
          <SectionCard title="Achievements" icon={<FiAward />}>
            {achievements.length ? (
              <div className="rp-badges-grid">
                {achievements.map((achievement) => (
                  <div key={achievement.key} className="rp-badge-item">
                    <div className="rp-badge-emoji">🏅</div>
                    <div className="rp-badge-title">{achievement.title}</div>
                    {achievement.description && <div className="rp-badge-desc">{achievement.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rp-empty">
                <div className="rp-empty-title">No achievements yet</div>
                <div className="rp-empty-desc">Earned achievements will appear here.</div>
              </div>
            )}
          </SectionCard>

          <div className="rp-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="rp-stat-icon teal" style={{ width: 44, height: 44, borderRadius: 12, fontSize: "1.2rem" }}><FiClock /></div>
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800, color: "#a5855f" }}>Total Reading Time</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--ink, #1e293b)" }}>{trackedMinutes} mins</div>
              <div style={{ fontSize: "0.74rem", color: "var(--muted, #64748b)" }}>tracked active Article reading time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
