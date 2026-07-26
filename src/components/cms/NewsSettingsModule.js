import React, { useState, useEffect } from "react";
import { FiSave, FiRefreshCw, FiTrendingUp, FiGlobe, FiEye, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";
import { newsApi } from "../../services/apiService";

export default function NewsSettingsModule() {
  const { getSetting, updateSetting } = useCms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [settings, setSettings] = useState({
    enabled: true,
    provider: "rss",
    cacheDuration: 15,
    maxHeadlines: 12,
    defaultCategories: ["world", "technology", "science", "business", "politics", "health", "sports"],
    featuredProvider: "rss"
  });

  const loadSettingsAndStats = async () => {
    setLoading(true);
    setStatsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Load News Settings
      const val = await getSetting("news_settings");
      if (val) {
        setSettings((prev) => ({ ...prev, ...val }));
      }

      // Load Analytics Stats
      const statsRes = await newsApi.getStats();
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error("Failed to load settings or stats:", err);
      setError("Failed to fetch settings or analytics data.");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndStats();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Save news integration settings?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateSetting("news_settings", settings);
      setSuccess("News settings saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update news settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshStats = async () => {
    setStatsLoading(true);
    try {
      const statsRes = await newsApi.getStats();
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      setError("Failed to refresh stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cms-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Loading News Settings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Success/Error Alerts */}
      {success && (
        <div className="cms-alert cms-alert-success" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="cms-alert cms-alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <div className="cms-grid-two">
        {/* Settings Panel */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Integration</span>
              <h2>Global News Settings</h2>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ marginTop: "1rem" }}>
            <div className="form-grid one" style={{ gap: "1.2rem" }}>
              <div className="news-toggle-row">
                <div>
                  <h4 style={{ margin: 0, color: "#2F3133" }}>Enable News Module</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#6F6158" }}>
                    Display live global news in MyJourney
                  </p>
                </div>
                <label className="toggle-switch" style={{ display: "inline-block", position: "relative" }}>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    style={{ scale: "1.3", cursor: "pointer" }}
                  />
                </label>
              </div>

              <label>
                News API Provider
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                  className="form-input"
                >
                  <option value="rss">BBC World News (RSS Parser - Keyless)</option>
                  <option value="newsapi">NewsAPI (NEWS_API_KEY)</option>
                  <option value="gnews">GNews (GNEWS_API_KEY)</option>
                  <option value="mediastack">Mediastack (MEDIASTACK_API_KEY)</option>
                  <option value="guardian">The Guardian API (GUARDIAN_API_KEY)</option>
                </select>
              </label>

              <label>
                Cache Expiry Duration (Minutes)
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.cacheDuration}
                  onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) || 15 })}
                  className="form-input"
                />
              </label>

              <label>
                Maximum Displayed Headlines
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxHeadlines}
                  onChange={(e) => setSettings({ ...settings, maxHeadlines: parseInt(e.target.value) || 12 })}
                  className="form-input"
                />
              </label>

              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="stories-btn-premium"
                  style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <FiSave />
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Analytics Dashboard */}
        <div className="cms-panel">
          <div className="cms-panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="section-kicker">Analytics</span>
              <h2>Traffic & Clicks</h2>
            </div>
            <button
              onClick={handleRefreshStats}
              className="news-filter-btn"
              disabled={statsLoading}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.8rem" }}
            >
              <FiRefreshCw className={statsLoading ? "spin-animation" : ""} />
              Reload Stats
            </button>
          </div>

          {statsLoading ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto" }}></div>
              <p style={{ marginTop: "1rem" }}>Gathering analytics data...</p>
            </div>
          ) : stats ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
              {/* Clicks counter widget */}
              <div style={{ display: "flex", gap: "15px" }}>
                <div className="news-stat-box" style={{ flex: 1, background: "#FAF6F0" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#7A6652", textTransform: "uppercase" }}>
                    Total News Clicks
                  </span>
                  <div className="news-stat-value">{stats.totalClicks}</div>
                </div>
              </div>

              {/* Top Clicked Articles */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", color: "#2F3133", borderBottom: "1px solid #EFE7DD", paddingBottom: "6px" }}>
                  Top Clicked Articles
                </h4>
                {stats.topArticles && stats.topArticles.length > 0 ? (
                  <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {stats.topArticles.map((art) => (
                      <li key={art._id} style={{ color: "#6F6158" }}>
                        <strong>{art.clicks} clicks:</strong> "{art.title}" ({art.publisher})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#9c8d83", margin: 0 }}>No clicks recorded yet.</p>
                )}
              </div>

              {/* Top Publishers */}
              <div className="cms-grid-two" style={{ gap: "15px" }}>
                <div>
                  <h4 style={{ margin: "0 0 10px 0", color: "#2F3133", fontSize: "0.9rem" }}>
                    Top Publishers (Clicks)
                  </h4>
                  {stats.topPublishersByClicks && stats.topPublishersByClicks.length > 0 ? (
                    <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                      <tbody>
                        {stats.topPublishersByClicks.map((pub) => (
                          <tr key={pub._id} style={{ borderBottom: "1px solid #FAF6F0" }}>
                            <td style={{ padding: "6px 0", color: "#2F3133" }}>{pub._id}</td>
                            <td style={{ textAlign: "right", color: "#426C67", fontWeight: 700 }}>{pub.clicks} clicks</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: "0.82rem", color: "#9c8d83" }}>No clicks.</p>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: "0 0 10px 0", color: "#2F3133", fontSize: "0.9rem" }}>
                    Top Publishers (Views)
                  </h4>
                  {stats.topPublishersByImpressions && stats.topPublishersByImpressions.length > 0 ? (
                    <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                      <tbody>
                        {stats.topPublishersByImpressions.map((pub) => (
                          <tr key={pub._id} style={{ borderBottom: "1px solid #FAF6F0" }}>
                            <td style={{ padding: "6px 0", color: "#2F3133" }}>{pub._id}</td>
                            <td style={{ textAlign: "right", color: "#C89B6D", fontWeight: 700 }}>{pub.impressions} views</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: "0.82rem", color: "#9c8d83" }}>No views.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ padding: "2rem", color: "#6F6158" }}>No statistics available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
