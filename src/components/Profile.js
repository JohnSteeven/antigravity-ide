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

  const renderArticleList = (items, emptyText) =>
    items.length ? (
      items.map((article) => (
        <Link className="profile-article-row" to={`/articles/${article.slug}`} key={article.id || article._id}>
          <strong>{article.title}</strong>
          <span>{article.category}</span>
        </Link>
      ))
    ) : (
      <p className="empty-state compact">{emptyText}</p>
    );

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

            <label className="settings-toggle">
              <span>
                <FiBell />
                Notifications
              </span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={() => updateSetting("notificationsEnabled")}
              />
            </label>

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
          {renderArticleList(bookmarked, "No bookmarks yet.")}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2>Liked Articles</h2>
          {renderArticleList(liked, "No liked articles yet.")}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2><FiBookOpen /> Saved Articles</h2>
          {renderArticleList(saved, "No saved articles yet.")}
        </section>

        <section className="profile-panel profile-list-panel">
          <h2>Comments</h2>
          {(profile.comments || []).length ? (
            profile.comments.map((comment) => (
              <article className="profile-comment" key={comment.id || comment._id}>
                <strong>{comment.articleTitle}</strong>
                <p>{comment.text}</p>
              </article>
            ))
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

        <section className="profile-panel profile-list-panel" id="notifications">
          <h2>
            <FiBell /> Notifications
          </h2>

          {/* Preferences Section */}
          <div className="notification-preferences-block" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "25px", marginBottom: "25px" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", color: "var(--color-primary-light, #a5855f)" }}>Preferences</h3>
            
            <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="pref-row" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                  <input
                    type="checkbox"
                    checked={prefDailyQuote}
                    onChange={(e) => setPrefDailyQuote(e.target.checked)}
                  />
                  Daily Inspirational Quotes (Recommended)
                </label>
                {prefDailyQuote && (
                  <div style={{ marginLeft: "25px", display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                    <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>Preferred Time:</span>
                    <select
                      value={prefDailyHour}
                      onChange={(e) => setPrefDailyHour(Number(e.target.value))}
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
                />
                New Articles Published
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                <input
                  type="checkbox"
                  checked={prefReadingReminders}
                  onChange={(e) => setPrefReadingReminders(e.target.checked)}
                />
                Reading Reminders
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "500" }}>
                <input
                  type="checkbox"
                  checked={prefWeeklySummary}
                  onChange={(e) => setPrefWeeklySummary(e.target.checked)}
                />
                Weekly Reading Summary
              </label>

              <div style={{ marginTop: "5px" }}>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                >
                  Save Preferences
                </button>
              </div>
            </form>

            {saveSuccessMessage && (
              <div className="success-toast" style={{ marginTop: "15px", color: "#2e7d32", fontWeight: "bold" }}>
                {saveSuccessMessage}
              </div>
            )}
            {saveErrorMessage && (
              <div className="error-toast" style={{ marginTop: "15px", color: "#c62828", fontWeight: "bold" }}>
                {saveErrorMessage}
              </div>
            )}
          </div>
          {notifications.length ? (
            notifications.map((item) => (
              <article
                className="notification-row"
                key={item.id || item._id}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.02)",
                  marginBottom: "10px",
                  borderLeft: item.status === "unread" ? "3px solid #a5855f" : "3px solid transparent",
                  opacity: item.status === "read" ? 0.6 : 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>{item.title}</strong>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}>{item.message}</p>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{formatDate(item.createdAt)}</span>
                </div>
                {item.status !== "read" && (
                  <button
                    className="compact-btn"
                    onClick={() => handleMarkAsRead(item._id || item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#a5855f",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      padding: "5px"
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </article>
            ))
          ) : (
            <p className="empty-state compact">No notifications yet.</p>
          )}
        </section>
      </section>
    </main>
  );
};

export default Profile;
