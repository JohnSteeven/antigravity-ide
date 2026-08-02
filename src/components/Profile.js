import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiActivity,
  FiBell,
  FiBookmark,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCornerDownRight,
  FiEdit2,
  FiEdit3,
  FiGlobe,
  FiHeart,
  FiLayers,
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
import SecuritySection from "./security/SecuritySection";
import "./security/SecurityCenter.css";

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

const getArticleReadingMinutes = (article) => {
  if (!article) return 1;
  if (typeof article.readTimeMinutes === "number") return article.readTimeMinutes;
  const text = (article.content || article.excerpt || article.description || article.title || "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatArticleReadingTime = (article) => {
  if (article?.readTime) return article.readTime;
  if (article?.readingTime) return article.readingTime;
  const mins = getArticleReadingMinutes(article);
  return `${mins} min read`;
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
  const [libraryTab, setLibraryTab] = useState("overview");
  const [communityTab, setCommunityTab] = useState("comments");
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  const [isCommunityExpanded, setIsCommunityExpanded] = useState(true);
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

  const totalReadingTimeMins = useMemo(() => {
    const uniqueMap = new Map();
    [...bookmarked, ...liked, ...saved].forEach((art) => {
      const key = art.id || art._id || art.slug;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, art);
      }
    });
    let sum = 0;
    uniqueMap.forEach((art) => {
      sum += getArticleReadingMinutes(art);
    });
    return sum;
  }, [bookmarked, liked, saved]);

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
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
              <strong>{article.title}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>
                <span>{article.category || "Article"}</span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--clay, #a5855f)", fontWeight: 600 }}>
                  <FiClock style={{ fontSize: "0.78rem" }} /> {formatArticleReadingTime(article)}
                </span>
              </div>
            </div>
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

        <section className="profile-panel my-library-panel" aria-label="My Library">
          <button
            className="sec-header-button settings-action"
            type="button"
            onClick={() => setIsLibraryExpanded((prev) => !prev)}
            style={{ width: "100%" }}
          >
            <span className="sec-action-label">
              <FiBookOpen style={{ fontSize: "1.1rem" }} /> My Library
            </span>

            <span className="sec-expand-indicator">
              {isLibraryExpanded ? <><FiChevronUp /> Collapse Library</> : <><FiChevronDown /> View My Library</>}
            </span>
          </button>

          <div className={`sec-section-wrap ${isLibraryExpanded ? "is-expanded" : ""}`}>
            {/* Sub-navigation Tabs */}
            <div className="profile-tab-nav">
              <button
                type="button"
                className={`profile-subtab-btn ${libraryTab === "overview" ? "is-active" : ""}`}
                onClick={() => setLibraryTab("overview")}
              >
                <FiLayers /> Overview
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${libraryTab === "saved" ? "is-active" : ""}`}
                onClick={() => setLibraryTab("saved")}
              >
                <FiBookOpen /> Saved Articles ({saved.length})
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${libraryTab === "bookmarks" ? "is-active" : ""}`}
                onClick={() => setLibraryTab("bookmarks")}
              >
                <FiBookmark /> Bookmarks ({bookmarked.length})
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${libraryTab === "liked" ? "is-active" : ""}`}
                onClick={() => setLibraryTab("liked")}
              >
                <FiHeart /> Liked Articles ({liked.length})
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${libraryTab === "history" ? "is-active" : ""}`}
                onClick={() => setLibraryTab("history")}
              >
                <FiClock /> Reading History
              </button>
            </div>

            {/* Tab 1: Overview */}
            {libraryTab === "overview" && (
              <>
                <div className="library-stats-header" style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  background: "var(--surface-variant, rgba(66, 108, 103, 0.06))",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "1px solid var(--line, rgba(66, 108, 103, 0.15))"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 700, color: "var(--ink, #1e293b)" }}>
                    <FiClock style={{ color: "var(--clay, #a5855f)", fontSize: "1.1rem" }} />
                    <span>Total Estimated Reading Time: <strong style={{ color: "var(--teal, #426c67)" }}>{totalReadingTimeMins} mins</strong></span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>
                    <strong style={{ color: "var(--ink, #1e293b)" }}>{bookmarked.length + liked.length + saved.length}</strong> Saved Items
                  </div>
                </div>

                <div className="my-library-grid" style={{ marginTop: "16px" }}>
                  <div className="library-card">
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--ink, #1e293b)" }}>
                      <FiBookOpen style={{ color: "var(--teal, #426c67)" }} /> Saved Articles
                    </h3>
                    {renderArticleList(saved, "No saved articles yet.", false, () => setLibraryTab("saved"))}
                  </div>

                  <div className="library-card">
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--ink, #1e293b)" }}>
                      <FiBookmark style={{ color: "var(--clay, #a5855f)" }} /> Bookmarks
                    </h3>
                    {renderArticleList(bookmarked, "No bookmarks yet.", false, () => setLibraryTab("bookmarks"))}
                  </div>
                </div>
              </>
            )}

            {/* Tab 2: Saved Articles */}
            {libraryTab === "saved" && (
              <div className="library-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <FiBookOpen style={{ color: "var(--teal, #426c67)" }} /> Saved Articles ({saved.length})
                </h3>
                {renderArticleList(saved, "No saved articles in your library.", true, () => {})}
              </div>
            )}

            {/* Tab 3: Bookmarks */}
            {libraryTab === "bookmarks" && (
              <div className="library-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <FiBookmark style={{ color: "var(--clay, #a5855f)" }} /> Bookmarked Articles ({bookmarked.length})
                </h3>
                {renderArticleList(bookmarked, "No bookmarks saved.", true, () => {})}
              </div>
            )}

            {/* Tab 4: Liked Articles */}
            {libraryTab === "liked" && (
              <div className="library-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <FiHeart style={{ color: "#ef4444" }} /> Liked Articles ({liked.length})
                </h3>
                {renderArticleList(liked, "No liked articles yet.", true, () => {})}
              </div>
            )}

            {/* Tab 5: Reading History */}
            {libraryTab === "history" && (
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "8px" }}>📜 Reading History</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--muted, #64748b)", maxWidth: "340px", margin: "0 0 16px 0" }}>
                  Track your reading journey, article progress, and finish rates across all devices.
                </p>
                <button type="button" className="secondary-btn" disabled style={{ opacity: 0.6, fontSize: "0.85rem", padding: "6px 14px" }}>
                  Feature In Development
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 💬 Community Section */}
        <section className="profile-panel community-panel" aria-label="Community">
          <button
            className="sec-header-button settings-action"
            type="button"
            onClick={() => setIsCommunityExpanded((prev) => !prev)}
            style={{ width: "100%" }}
          >
            <span className="sec-action-label">
              <FiMessageCircle style={{ fontSize: "1.1rem" }} /> Community Activity
            </span>

            <span className="sec-expand-indicator">
              {isCommunityExpanded ? <><FiChevronUp /> Collapse Community</> : <><FiChevronDown /> View Community</>}
            </span>
          </button>

          <div className={`sec-section-wrap ${isCommunityExpanded ? "is-expanded" : ""}`}>
            {/* Sub-navigation Tabs */}
            <div className="profile-tab-nav">
              <button
                type="button"
                className={`profile-subtab-btn ${communityTab === "comments" ? "is-active" : ""}`}
                onClick={() => setCommunityTab("comments")}
              >
                <FiMessageCircle /> Comments ({(profile.comments || []).length})
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${communityTab === "replies" ? "is-active" : ""}`}
                onClick={() => setCommunityTab("replies")}
              >
                <FiCornerDownRight /> Replies
              </button>
              <button
                type="button"
                className={`profile-subtab-btn ${communityTab === "drafts" ? "is-active" : ""}`}
                onClick={() => setCommunityTab("drafts")}
              >
                <FiEdit2 /> Draft Comments
              </button>
            </div>

            {/* Tab 1: Comments */}
            {communityTab === "comments" && (
              <div className="library-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <FiMessageCircle style={{ color: "var(--teal, #426c67)" }} /> My Article Comments
                </h3>
                {(profile.comments || []).length ? (
                  <>
                    {(expandedComments ? profile.comments : profile.comments.slice(0, 3)).map((comment) => (
                      <article className="profile-comment" key={comment.id || comment._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                          <strong>{comment.articleTitle}</strong>
                          <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p>{comment.text}</p>
                      </article>
                    ))}
                    {(profile.comments || []).length > 3 && (
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
                        {expandedComments ? "Show Less" : `Show More (${profile.comments.length - 3} more)`}
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
                    padding: "30px 15px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    marginTop: "5px",
                    minHeight: "160px"
                  }}>
                    <span style={{ fontSize: "2rem", marginBottom: "10px" }} role="img" aria-label="comments">💬</span>
                    <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "6px", color: "var(--color-primary-light, #a5855f)" }}>No comments yet</h4>
                    <p style={{ fontSize: "0.85rem", opacity: 0.7, maxWidth: "240px", lineHeight: "1.4", marginBottom: "12px" }}>
                      Engage with stories and articles across MyJourney to see your comments listed here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Replies */}
            {communityTab === "replies" && (
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "8px" }}>↩️ Replies to your Comments</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--muted, #64748b)", maxWidth: "340px", margin: "0 0 16px 0" }}>
                  Get real-time updates and view responses from authors and fellow readers on your comments.
                </p>
                <button type="button" className="secondary-btn" disabled style={{ opacity: 0.6, fontSize: "0.85rem", padding: "6px 14px" }}>
                  Feature In Development
                </button>
              </div>
            )}

            {/* Tab 3: Draft Comments */}
            {communityTab === "drafts" && (
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "8px" }}>✍️ Draft Comments</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--muted, #64748b)", maxWidth: "340px", margin: "0 0 16px 0" }}>
                  Auto-save unfinished thoughts and article responses to publish whenever you're ready.
                </p>
                <button type="button" className="secondary-btn" disabled style={{ opacity: 0.6, fontSize: "0.85rem", padding: "6px 14px" }}>
                  Feature In Development
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="profile-panel account-settings-panel">
          <div className="profile-panel-heading">
            <span className="section-kicker">Account settings</span>
            <h2>Preferences</h2>
          </div>

          <div className="settings-list">
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

            <SecuritySection user={user} />

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
