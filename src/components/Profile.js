import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiBookOpen,
  FiEdit3,
  FiGlobe,
  FiHeart,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMoon,
  FiPhone,
  FiShield,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useCms } from "../context/CmsContext";
import { articleApi, userApi } from "../services/apiService";
import { getFullName, getProfileCover } from "../utils/helpers";
import UserAvatar from "./shared/UserAvatar";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getThemePreference = (profile) => {
  if (typeof window === "undefined") return Boolean(profile.darkMode);
  return window.localStorage.getItem("myjourney-theme") === "dark" || Boolean(profile.darkMode);
};

const Profile = () => {
  const location = useLocation();
  const { user, updateProfile, refreshSession } = useAuth();
  const { data } = useCms();
  const profile = user.profile || {};
  const coverImage = getProfileCover(profile);
  const [settings, setSettings] = useState({
    darkMode: getThemePreference(profile),
    notificationsEnabled: profile.notificationsEnabled !== false,
    privateProfile: Boolean(profile.privateProfile),
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [expandedBookmarks, setExpandedBookmarks] = useState(false);
  const [expandedLiked, setExpandedLiked] = useState(false);
  const [expandedSaved, setExpandedSaved] = useState(false);
  const [expandedComments, setExpandedComments] = useState(false);

  const [prefDailyQuote, setPrefDailyQuote] = useState(user.notificationPreferences?.dailyQuote?.enabled ?? true);
  const [prefDailyHour, setPrefDailyHour] = useState(user.notificationPreferences?.dailyQuote?.time?.hour ?? 9);
  const [prefNewArticles, setPrefNewArticles] = useState(user.notificationPreferences?.newArticles?.enabled ?? false);
  const [prefReadingReminders, setPrefReadingReminders] = useState(user.notificationPreferences?.readingReminders?.enabled ?? false);
  const [prefWeeklySummary, setPrefWeeklySummary] = useState(user.notificationPreferences?.weeklySummary?.enabled ?? false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefDailyQuote(user.notificationPreferences.dailyQuote?.enabled ?? true);
      setPrefDailyHour(user.notificationPreferences.dailyQuote?.time?.hour ?? 9);
      setPrefNewArticles(user.notificationPreferences.newArticles?.enabled ?? false);
      setPrefReadingReminders(user.notificationPreferences.readingReminders?.enabled ?? false);
      setPrefWeeklySummary(user.notificationPreferences.weeklySummary?.enabled ?? false);
    }
  }, [user]);

  const fullName = getFullName(user);
  const [bookmarked, setBookmarked] = useState([]);
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const authoredArticles = useMemo(
    () =>
      data.articles.filter(
        (article) =>
          article.status === "published" &&
          article.author?.toLowerCase() === fullName.toLowerCase()
      ),
    [data.articles, fullName]
  );
  const notifications = profile.notifications || [];

  // Fetch bookmarked / liked / saved articles from server by ID to avoid
  // pagination gaps in the general article list.
  useEffect(() => {
    const bookmarkIds = profile.bookmarks || [];
    if (bookmarkIds.length === 0) { setBookmarked([]); return; }
    articleApi.list({ ids: bookmarkIds.join(","), limit: bookmarkIds.length })
      .then((res) => setBookmarked(res.articles || []))
      .catch(() => {
        const local = data.articles.filter(a => bookmarkIds.includes(a.id) || bookmarkIds.includes(a._id));
        setBookmarked(local);
      });
  }, [profile.bookmarks, data.articles]);

  useEffect(() => {
    const likedIds = profile.likedArticles || [];
    if (likedIds.length === 0) { setLiked([]); return; }
    articleApi.list({ ids: likedIds.join(","), limit: likedIds.length })
      .then((res) => setLiked(res.articles || []))
      .catch(() => {
        const local = data.articles.filter(a => likedIds.includes(a.id) || likedIds.includes(a._id));
        setLiked(local);
      });
  }, [profile.likedArticles, data.articles]);

  useEffect(() => {
    const savedIds = profile.savedArticles || [];
    if (savedIds.length === 0) { setSaved([]); return; }
    articleApi.list({ ids: savedIds.join(","), limit: savedIds.length })
      .then((res) => setSaved(res.articles || []))
      .catch(() => {
        const local = data.articles.filter(a => savedIds.includes(a.id) || savedIds.includes(a._id));
        setSaved(local);
      });
  }, [profile.savedArticles, data.articles]);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", settings.darkMode);
    window.localStorage.setItem("myjourney-theme", settings.darkMode ? "dark" : "light");
  }, [settings.darkMode]);

  const updateSetting = async (field) => {
    const nextValue = !settings[field];
    setSettings((current) => ({ ...current, [field]: nextValue }));
    setSettingsMessage("");

    try {
      await updateProfile({
        profile: {
          [field]: nextValue,
        },
      });
    } catch (error) {
      setSettings((current) => ({ ...current, [field]: !nextValue }));
      setSettingsMessage(error.message || "Setting could not be updated.");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaveSuccessMessage("");
    setSaveErrorMessage("");
    try {
      await updateProfile({
        notificationPreferences: {
          dailyQuote: {
            enabled: prefDailyQuote,
            time: {
              hour: Number(prefDailyHour),
              minute: 0
            }
          },
          newArticles: { enabled: prefNewArticles },
          readingReminders: { enabled: prefReadingReminders },
          weeklySummary: { enabled: prefWeeklySummary }
        }
      });
      setSaveSuccessMessage("✓ Notification preferences updated successfully.");
      setTimeout(() => setSaveSuccessMessage(""), 4000);
    } catch (err) {
      setSaveErrorMessage(err.message || "Failed to update notification preferences.");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await userApi.markNotificationAsRead(id);
      await refreshSession();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const renderArticleList = (items, emptyText, isExpanded, setIsExpanded) => {
    if (!items.length) {
      return <p className="empty-state compact">{emptyText}</p>;
    }

    const visibleItems = isExpanded ? items : items.slice(0, 2);

    return (
      <>
        {visibleItems.map((article) => (
          <Link className="profile-article-row" to={`/articles/${article.slug}`} key={article.id || article._id}>
            <strong>{article.title}</strong>
            <span>{article.category}</span>
          </Link>
        ))}
        {items.length > 2 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary-light, #a5855f)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginTop: "10px",
              padding: "5px 0",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              textDecoration: "underline"
            }}
          >
            {isExpanded ? "Show Less" : `Show More (${items.length - 2} more)`}
          </button>
        )}
      </>
    );
  };

  const profileFacts = [
    { label: "First Name", value: user.firstName || "Not provided" },
    { label: "Last Name", value: user.lastName || "Not provided" },
    { label: "Email", value: user.email || "Not provided", icon: <FiMail /> },
    { label: "Phone", value: user.mobile || "Not provided", icon: <FiPhone /> },
    { label: "Location", value: profile.location || "Not provided", icon: <FiMapPin /> },
    { label: "Website", value: profile.website || "Not provided", icon: <FiGlobe /> },
    { label: "Bio", value: profile.bio || "No bio added yet." },
  ];

  return (
    <main className="profile-page account-profile-page">
      <section
        className={`profile-hero account-profile-hero ${coverImage?.trim() ? "has-cover" : ""}`}
        style={coverImage?.trim() ? { backgroundImage: `url("${coverImage}")` } : undefined}
      >
        <div className="profile-hero-overlay"></div>
        <div className="profile-hero-content account-profile-hero-content">
          <UserAvatar user={user} className="profile-avatar" />
          <div>
            <span className="section-kicker">Account profile</span>
            <h1>{fullName}</h1>
            <p>{profile.bio || "Keep your saved stories, comments, and account details in one place."}</p>
            <div className="profile-identity-row">
              <span>
                <FiUser /> @{user.username}
              </span>
              <span>
                <FiMail /> {user.email}
              </span>
            </div>
            {location.state?.message && <span className="profile-toast">{location.state.message}</span>}
          </div>
          <Link className="primary-btn" to="/edit-profile">
            <FiEdit3 /> Edit Profile
          </Link>
        </div>
      </section>

      <section className="account-profile-summary" aria-label="Account summary">
        <div>
          <span>Full Name</span>
          <strong>{fullName}</strong>
        </div>
        <div>
          <span>Username</span>
          <strong>@{user.username}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div>
          <span>Member Since</span>
          <strong>{formatDate(user.createdAt)}</strong>
        </div>
      </section>

      <section className="profile-grid account-profile-grid">
        <section className="profile-panel metric-panel account-stat-panel" aria-label="Statistics">
          <div>
            <FiEdit3 />
            <strong>{authoredArticles.length}</strong>
            <span>Articles Published</span>
          </div>
          <div>
            <FiBookmark />
            <strong>{bookmarked.length}</strong>
            <span>Bookmarks</span>
          </div>
          <div>
            <FiHeart />
            <strong>{liked.length}</strong>
            <span>Likes</span>
          </div>
          <div>
            <FiMessageCircle />
            <strong>{(profile.comments || []).length}</strong>
            <span>Comments</span>
          </div>
        </section>

        <section className="profile-panel profile-info-panel">
          <div className="profile-panel-heading">
            <span className="section-kicker">Profile information</span>
            <h2>Details</h2>
          </div>
          <dl className="profile-info-list">
            {profileFacts.map((fact) => (
              <div key={fact.label}>
                <dt>
                  {fact.icon}
                  {fact.label}
                </dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="profile-panel account-settings-panel">
          <div className="profile-panel-heading">
            <span className="section-kicker">Account settings</span>
            <h2>Preferences</h2>
          </div>

          <div className="settings-list">
            <button
              className="settings-action"
              type="button"
              onClick={() => setSettingsMessage("Use the secure password reset flow from the login screen.")}
            >
              <span>
                <FiLock />
                Change Password
              </span>
            </button>

            <label className="settings-toggle">
              <span>
                <FiMoon />
                Dark Mode
              </span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => updateSetting("darkMode")}
              />
            </label>

            <button
              className="settings-action"
              type="button"
              onClick={() => setShowNotificationModal(true)}
            >
              <span>
                <FiBell />
                Notification Settings
              </span>
            </button>

            <label className="settings-toggle">
              <span>
                <FiShield />
                Privacy
              </span>
              <input
                type="checkbox"
                checked={settings.privateProfile}
                onChange={() => updateSetting("privateProfile")}
              />
            </label>

            <button
              className="settings-action danger-text"
              type="button"
              onClick={() => setSettingsMessage("Delete Account requires confirmed account ownership.")}
            >
              <span>
                <FiTrash2 />
                Delete Account
              </span>
            </button>
          </div>

          {settingsMessage && <span className="profile-settings-note">{settingsMessage}</span>}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2>Bookmarks</h2>
          {renderArticleList(bookmarked, "No bookmarks yet.", expandedBookmarks, setExpandedBookmarks)}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2>Liked Articles</h2>
          {renderArticleList(liked, "No liked articles yet.", expandedLiked, setExpandedLiked)}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2><FiBookOpen /> Saved Articles</h2>
          {renderArticleList(saved, "No saved articles yet.", expandedSaved, setExpandedSaved)}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2>Comments</h2>
          {(profile.comments || []).length ? (
            <>
              {(expandedComments ? profile.comments : profile.comments.slice(0, 2)).map((comment) => (
                <article className="profile-comment" key={comment.id || comment._id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <strong>{comment.articleTitle}</strong>
                    <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{formatDate(comment.createdAt)}</span>
                  </div>
                  <p>{comment.text}</p>
                </article>
              ))}
              {(profile.comments || []).length > 2 && (
                <button
                  type="button"
                  onClick={() => setExpandedComments(!expandedComments)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary-light, #a5855f)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    marginTop: "10px",
                    padding: "5px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    textDecoration: "underline"
                  }}
                >
                  {expandedComments ? "Show Less" : `Show More (${profile.comments.length - 2} more)`}
                </button>
              )}
            </>
          ) : (
            <div className="empty-state-container" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "40px 20px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              marginTop: "10px",
              minHeight: "220px"
            }}>
              <span style={{ fontSize: "2.5rem", marginBottom: "15px" }} role="img" aria-label="comments">💬</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "8px", color: "var(--color-primary-light, #a5855f)" }}>No comments yet</h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.7, maxWidth: "260px", lineHeight: "1.4", marginBottom: "20px" }}>
                Once readers start engaging with your stories, their comments will appear here.
              </p>
              <Link to="/articles" className="primary-btn" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>
                Explore Articles
              </Link>
            </div>
          )}
        </section>

      </section>

      {showNotificationModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "var(--color-bg-panel, #151b1a)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "460px",
            padding: "25px 30px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            position: "relative",
            color: "var(--color-text-main, #f8f4ed)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "15px"
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "var(--color-primary-light, #a5855f)", display: "flex", alignItems: "center", gap: "10px" }}>
                <FiBell /> Notification Preferences
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationModal(false);
                  setSaveSuccessMessage("");
                  setSaveErrorMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  opacity: 0.6,
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", marginBottom: "15px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "12px" }}>
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={() => updateSetting("notificationsEnabled")}
                />
                Enable System Notifications
              </label>

              <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "15px", opacity: settings.notificationsEnabled ? 1 : 0.5, pointerEvents: settings.notificationsEnabled ? "auto" : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                    <input
                      type="checkbox"
                      checked={prefDailyQuote}
                      onChange={(e) => setPrefDailyQuote(e.target.checked)}
                      disabled={!settings.notificationsEnabled}
                    />
                    Daily Inspirational Quotes (Recommended)
                  </label>
                  {prefDailyQuote && (
                    <div style={{ marginLeft: "25px", display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Preferred Time:</span>
                      <select
                        value={prefDailyHour}
                        onChange={(e) => setPrefDailyHour(Number(e.target.value))}
                        disabled={!settings.notificationsEnabled}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "inherit",
                          outline: "none"
                        }}
                      >
                        <option value="8">08:00 AM</option>
                        <option value="9">09:00 AM</option>
                        <option value="18">06:00 PM</option>
                        <option value="21">09:00 PM</option>
                      </select>
                    </div>
                  )}
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                  <input
                    type="checkbox"
                    checked={prefNewArticles}
                    onChange={(e) => setPrefNewArticles(e.target.checked)}
                    disabled={!settings.notificationsEnabled}
                  />
                  New Articles Published
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                  <input
                    type="checkbox"
                    checked={prefReadingReminders}
                    onChange={(e) => setPrefReadingReminders(e.target.checked)}
                    disabled={!settings.notificationsEnabled}
                  />
                  Reading Reminders
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                  <input
                    type="checkbox"
                    checked={prefWeeklySummary}
                    onChange={(e) => setPrefWeeklySummary(e.target.checked)}
                    disabled={!settings.notificationsEnabled}
                  />
                  Weekly Reading Summary
                </label>

                <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={!settings.notificationsEnabled}
                    style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                  >
                    Save Preferences
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setShowNotificationModal(false);
                      setSaveSuccessMessage("");
                      setSaveErrorMessage("");
                    }}
                    style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {saveSuccessMessage && (
              <div className="success-toast" style={{ marginTop: "15px", color: "#2e7d32", fontWeight: "bold", fontSize: "0.9rem" }}>
                {saveSuccessMessage}
              </div>
            )}
            {saveErrorMessage && (
              <div className="error-toast" style={{ marginTop: "15px", color: "#c62828", fontWeight: "bold", fontSize: "0.9rem" }}>
                {saveErrorMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
