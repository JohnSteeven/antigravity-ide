import { useEffect, useState } from "react";
import {
  FiActivity,
  FiArchive,
  FiBookmark,
  FiBookOpen,
  FiClock,
  FiEye,
  FiEyeOff,
  FiFolder,
  FiMessageCircle,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { logApi } from "../../services/apiService";

const MetricCard = ({ icon, label, value }) => (
  <div className="metric-card">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const DashboardOverview = ({ analytics, articles = [] }) => {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    logApi
      .list()
      .then((res) => {
        if (Array.isArray(res.logs)) {
          setLogs(res.logs.slice(0, 5));
        }
      })
      .catch((err) => console.warn("Failed to fetch activity logs:", err))
      .finally(() => setLoadingLogs(false));
  }, []);

  // Most Viewed
  const mostViewed = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  // Most Liked
  const mostLiked = [...articles]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3);

  // Most Recent
  const mostRecent = [...articles]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3);

  const formatLogAction = (log) => {
    const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const user = log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "System";
    return `[${time}] ${user} - ${log.action} (${log.entityType})`;
  };

  return (
    <div className="dashboard-overview-layout">
      {/* Metrics Row 1 */}
      <div className="cms-panel wide">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Analytics</span>
            <h2>Performance Snapshot</h2>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard icon={<FiEye />} label="Total Views" value={(analytics.views || 0).toLocaleString()} />
          <MetricCard icon={<FiActivity />} label="Total Likes" value={(analytics.likes || 0).toLocaleString()} />
          <MetricCard icon={<FiBookmark />} label="Bookmarks" value={(analytics.bookmarks || 0).toLocaleString()} />
          <MetricCard icon={<FiBookOpen />} label="Total Articles" value={analytics.articleCount || 0} />
          <MetricCard icon={<FiBookOpen />} label="Published" value={analytics.publishedCount || 0} />
          <MetricCard icon={<FiEyeOff />} label="Drafts" value={analytics.draftCount || 0} />
          <MetricCard icon={<FiClock />} label="Scheduled" value={analytics.scheduledCount || 0} />
          <MetricCard icon={<FiArchive />} label="Archived" value={analytics.archivedCount || 0} />
          <MetricCard icon={<FiFolder />} label="Categories" value={analytics.categoryCount || 0} />
          <MetricCard icon={<FiTag />} label="Tags" value={analytics.tagCount || 0} />
          <MetricCard icon={<FiMessageCircle />} label="Comments" value={(analytics.comments || []).length} />
          <MetricCard icon={<FiUsers />} label="Subscribers" value={analytics.subscribers || 0} />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="cms-grid-two" style={{ marginTop: "2rem" }}>
        {/* Leaderboards */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Leaderboards</span>
              <h2>Article Rankings</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#426c67", fontWeight: "bold" }}>Most Viewed</h4>
              <div className="compact-list">
                {mostViewed.map((art) => (
                  <div key={art.id || art._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span>{art.title}</span>
                    <strong style={{ color: "#426c67" }}>{art.views || 0} views</strong>
                  </div>
                ))}
                {mostViewed.length === 0 && <p className="empty-state">No articles.</p>}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#426c67", fontWeight: "bold" }}>Most Liked</h4>
              <div className="compact-list">
                {mostLiked.map((art) => (
                  <div key={art.id || art._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span>{art.title}</span>
                    <strong style={{ color: "#426c67" }}>{art.likes || 0} likes</strong>
                  </div>
                ))}
                {mostLiked.length === 0 && <p className="empty-state">No articles.</p>}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#426c67", fontWeight: "bold" }}>Most Recent</h4>
              <div className="compact-list">
                {mostRecent.map((art) => (
                  <div key={art.id || art._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span>{art.title}</span>
                    <span style={{ fontSize: "0.8rem", color: "#777" }}>{new Date(art.updatedAt || art.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {mostRecent.length === 0 && <p className="empty-state">No articles.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Audit Trail</span>
              <h2>Recent Activities</h2>
            </div>
          </div>

          <div className="compact-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loadingLogs ? (
              <p>Loading activity logs...</p>
            ) : logs.map((log) => (
              <div key={log._id || log.id} style={{ fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid #f2f2f2" }}>
                {formatLogAction(log)}
              </div>
            ))}
            {!loadingLogs && logs.length === 0 && (
              <p className="empty-state">No recent activities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
