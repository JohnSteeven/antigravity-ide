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
  FiPlusCircle,
  FiSend,
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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [isCommunityExpanded, setIsCommunityExpanded] = useState(false);
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

  // ── Draft Comments State & Handlers ──────────────────────────────────────────
  const [draftComments, setDraftComments] = useState(() => {
    try {
      const saved = localStorage.getItem("myjourney_draft_comments");
      return saved ? JSON.parse(saved) : (user?.profile?.draftComments || [
        {
          id: "draft-sample-1",
          articleSlug: "building-a-personal-blog-with-purpose",
          articleTitle: "Building A Personal Blog With Purpose",
          text: "Great insights on blog architecture! I was wondering if you plan to cover newsletter integration in part 2?",
          createdAt: "2026-08-01",
        }
      ]);
    } catch {
      return user?.profile?.draftComments || [];
    }
  });

  const [newDraftText, setNewDraftText] = useState("");
  const [newDraftArticleId, setNewDraftArticleId] = useState("");
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingDraftText, setEditingDraftText] = useState("");
  const [draftSuccessMsg, setDraftSuccessMsg] = useState("");

  const saveDraftsToStorage = (updated) => {
    setDraftComments(updated);
    try {
      localStorage.setItem("myjourney_draft_comments", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save draft comments to localStorage:", e);
    }
  };

  const handleCreateDraft = (e) => {
    e.preventDefault();
    if (!newDraftText.trim()) return;
    const targetArt = data.articles.find((a) => String(a.id || a._id) === String(newDraftArticleId)) || data.articles[0];
    const newDraft = {
      id: `draft-${Date.now()}`,
      articleId: targetArt?.id || targetArt?._id || "1",
      articleSlug: targetArt?.slug || "building-a-personal-blog-with-purpose",
      articleTitle: targetArt?.title || "Building A Personal Blog With Purpose",
      text: newDraftText.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextDrafts = [newDraft, ...draftComments];
    saveDraftsToStorage(nextDrafts);
    setNewDraftText("");
    setDraftSuccessMsg("✓ Draft comment saved successfully!");
    setTimeout(() => setDraftSuccessMsg(""), 3000);
  };

  const handlePublishDraft = async (draft) => {
    try {
      const newComment = {
        id: `profile-comment-${Date.now()}`,
        articleId: draft.articleId,
        articleTitle: draft.articleTitle,
        text: draft.text,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      await updateProfile({
        profile: {
          ...(user?.profile || {}),
          comments: [newComment, ...(user?.profile?.comments || [])],
        },
      });
      const remaining = draftComments.filter((d) => d.id !== draft.id);
      saveDraftsToStorage(remaining);
      setDraftSuccessMsg("✓ Draft published as live comment!");
      setTimeout(() => setDraftSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to publish draft comment:", err);
    }
  };

  const handleDeleteDraft = (draftId) => {
    const remaining = draftComments.filter((d) => d.id !== draftId);
    saveDraftsToStorage(remaining);
  };

  const handleSaveEditedDraft = (draftId) => {
    const updated = draftComments.map((d) =>
      d.id === draftId ? { ...d, text: editingDraftText, createdAt: new Date().toISOString().slice(0, 10) } : d
    );
    saveDraftsToStorage(updated);
    setEditingDraftId(null);
    setEditingDraftText("");
  };

  // Sample or loaded Replies
  const userReplies = profile.replies || [
    {
      id: "reply-1",
      articleTitle: "Building A Personal Blog With Purpose",
      articleSlug: "building-a-personal-blog-with-purpose",
      parentComment: "nice one",
      authorName: "Sarah Jenkins",
      authorRole: "Author",
      text: "Thank you so much! Really glad you found this article helpful.",
      createdAt: "2026-07-31",
    },
    {
      id: "reply-2",
      articleTitle: "Building A Personal Blog With Purpose",
      articleSlug: "building-a-personal-blog-with-purpose",
      parentComment: "nice one",
      authorName: "Alex Rivera",
      authorRole: "Reader",
      text: "Agreed! The section on content structure was super clear.",
      createdAt: "2026-08-01",
    }
  ];

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
        {/* Statistics Panel */}
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

        {/* ── MASTER UNIFIED ACCOUNT CARD ── */}
        <section className="profile-panel master-account-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 1. Profile Information */}
          <div className="unified-section-block">
            <button
              className="sec-header-button settings-action"
              type="button"
              onClick={() => setIsDetailsExpanded((prev) => !prev)}
              style={{ width: "100%" }}
            >
              <span className="sec-action-label">
                <FiUser style={{ fontSize: "1.1rem" }} /> Profile Information
              </span>
              <span className="sec-expand-indicator">
                {isDetailsExpanded ? <><FiChevronUp /> Collapse Details</> : <><FiChevronDown /> View Details</>}
              </span>
            </button>

            <div className={`sec-section-wrap ${isDetailsExpanded ? "is-expanded" : ""}`}>
              <dl className="profile-info-list" style={{ marginTop: "14px" }}>
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
            </div>
          </div>

          {/* 2. My Library */}
          <div className="unified-section-block">
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

              {libraryTab === "saved" && (
                <div className="library-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <FiBookOpen style={{ color: "var(--teal, #426c67)" }} /> Saved Articles ({saved.length})
                  </h3>
                  {renderArticleList(saved, "No saved articles in your library.", true, () => {})}
                </div>
              )}

              {libraryTab === "bookmarks" && (
                <div className="library-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <FiBookmark style={{ color: "var(--clay, #a5855f)" }} /> Bookmarked Articles ({bookmarked.length})
                  </h3>
                  {renderArticleList(bookmarked, "No bookmarks saved.", true, () => {})}
                </div>
              )}

              {libraryTab === "liked" && (
                <div className="library-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <FiHeart style={{ color: "#ef4444" }} /> Liked Articles ({liked.length})
                  </h3>
                  {renderArticleList(liked, "No liked articles yet.", true, () => {})}
                </div>
              )}

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
          </div>

          {/* 3. Community Activity */}
          <div className="unified-section-block">
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
                  <FiCornerDownRight /> Replies ({userReplies.length})
                </button>
                <button
                  type="button"
                  className={`profile-subtab-btn ${communityTab === "drafts" ? "is-active" : ""}`}
                  onClick={() => setCommunityTab("drafts")}
                >
                  <FiEdit2 /> Draft Comments ({draftComments.length})
                </button>
              </div>

              {/* Subtab 1: Comments */}
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

              {/* Subtab 2: Replies */}
              {communityTab === "replies" && (
                <div className="library-card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <FiCornerDownRight style={{ color: "var(--clay, #a5855f)" }} /> Replies to Your Comments ({userReplies.length})
                  </h3>

                  {userReplies.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {userReplies.map((reply) => (
                        <article key={reply.id} style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                            <div>
                              <Link to={`/articles/${reply.articleSlug}`} style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal, #426c67)", textDecoration: "none" }}>
                                {reply.articleTitle}
                              </Link>
                              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                                Replying to your comment: <em style={{ color: "#334155" }}>"{reply.parentComment}"</em>
                              </div>
                            </div>
                            <span style={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 500 }}>
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>

                          <div style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            padding: "12px 14px"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{reply.authorName}</strong>
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "99px",
                                background: reply.authorRole === "Author" ? "rgba(66, 108, 103, 0.12)" : "#f1f5f9",
                                color: reply.authorRole === "Author" ? "#426c67" : "#64748b"
                              }}>
                                {reply.authorRole}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.86rem", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                              {reply.text}
                            </p>
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Link to={`/articles/${reply.articleSlug}`} className="secondary-btn" style={{ fontSize: "0.78rem", padding: "4px 12px", textDecoration: "none" }}>
                              View Discussion →
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
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
                      minHeight: "160px"
                    }}>
                      <span style={{ fontSize: "2rem", marginBottom: "10px" }}>↩️</span>
                      <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "6px", color: "var(--color-primary-light, #a5855f)" }}>No replies yet</h4>
                      <p style={{ fontSize: "0.85rem", opacity: 0.7, maxWidth: "300px", lineHeight: "1.4" }}>
                        When authors or fellow readers reply to your comments on articles, they will show up here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 3: Draft Comments */}
              {communityTab === "drafts" && (
                <div className="library-card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      <FiEdit2 style={{ color: "var(--teal, #426c67)" }} /> Saved Draft Comments ({draftComments.length})
                    </h3>
                  </div>

                  {draftSuccessMsg && (
                    <div className="auth-alert success" style={{ marginBottom: "14px", padding: "8px 12px", fontSize: "0.82rem" }}>
                      {draftSuccessMsg}
                    </div>
                  )}

                  {/* Create New Draft Box */}
                  <form onSubmit={handleCreateDraft} style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    <strong style={{ fontSize: "0.88rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FiPlusCircle style={{ color: "#426c67" }} /> Compose New Draft Comment
                    </strong>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <select
                        value={newDraftArticleId}
                        onChange={(e) => setNewDraftArticleId(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.85rem",
                          backgroundColor: "#ffffff",
                          outline: "none"
                        }}
                      >
                        <option value="">Select Article to Draft Comment For...</option>
                        {data.articles.map((art) => (
                          <option key={art.id || art._id} value={art.id || art._id}>
                            {art.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      placeholder="Write your draft thoughts or comment response..."
                      value={newDraftText}
                      onChange={(e) => setNewDraftText(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "70px",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.86rem",
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" className="primary-btn" disabled={!newDraftText.trim()} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                        <FiSend /> Save Draft
                      </button>
                    </div>
                  </form>

                  {/* List of Saved Drafts */}
                  {draftComments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {draftComments.map((draft) => (
                        <article key={draft.id} style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                            <Link to={`/articles/${draft.articleSlug}`} style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal, #426c67)", textDecoration: "none" }}>
                              {draft.articleTitle}
                            </Link>
                            <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>{formatDate(draft.createdAt)}</span>
                          </div>

                          {editingDraftId === draft.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                              <textarea
                                value={editingDraftText}
                                onChange={(e) => setEditingDraftText(e.target.value)}
                                style={{
                                  width: "100%",
                                  minHeight: "70px",
                                  padding: "10px",
                                  borderRadius: "6px",
                                  border: "1px solid #426c67",
                                  fontSize: "0.86rem",
                                  outline: "none",
                                  boxSizing: "border-box"
                                }}
                              />
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button type="button" className="secondary-btn" onClick={() => setEditingDraftId(null)} style={{ fontSize: "0.78rem", padding: "4px 10px" }}>
                                  Cancel
                                </button>
                                <button type="button" className="primary-btn" onClick={() => handleSaveEditedDraft(draft.id)} style={{ fontSize: "0.78rem", padding: "4px 12px" }}>
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p style={{ fontSize: "0.86rem", color: "#334155", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                                {draft.text}
                              </p>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={() => handleDeleteDraft(draft.id)}
                                  style={{ fontSize: "0.76rem", padding: "4px 10px", color: "#dc2626" }}
                                >
                                  <FiTrash2 /> Discard
                                </button>
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={() => {
                                    setEditingDraftId(draft.id);
                                    setEditingDraftText(draft.text);
                                  }}
                                  style={{ fontSize: "0.76rem", padding: "4px 10px" }}
                                >
                                  <FiEdit2 /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="primary-btn"
                                  onClick={() => handlePublishDraft(draft)}
                                  style={{ fontSize: "0.76rem", padding: "4px 12px" }}
                                >
                                  <FiSend /> Publish Live
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-container" style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "24px 15px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px"
                    }}>
                      <span style={{ fontSize: "2rem", marginBottom: "8px" }}>✍️</span>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "4px", color: "var(--color-primary-light, #a5855f)" }}>No draft comments</h4>
                      <p style={{ fontSize: "0.82rem", opacity: 0.7, maxWidth: "280px" }}>
                        Unpublished comment drafts will be saved here so you can finish and publish them anytime.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Preferences & Security */}
          <div className="unified-section-block">
            <div className="profile-panel-heading" style={{ marginBottom: "12px" }}>
              <span className="section-kicker">Account settings</span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Preferences</h2>
            </div>

            <div className="settings-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label className="settings-toggle">
                <span>
                  <FiMoon /> Dark Mode
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
                  <FiBell /> Notification Settings
                </span>
              </button>

              <SecuritySection user={user} />
            </div>
          </div>
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
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiBell style={{ color: "var(--color-primary-light, #a5855f)" }} /> Notification Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted, #a0a5a4)",
                  cursor: "pointer",
                  fontSize: "1.2rem"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>Daily Motivational Quote</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #a0a5a4)" }}>Receive a daily inspiring quote push notification</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefDailyQuote}
                  onChange={(e) => setPrefDailyQuote(e.target.checked)}
                  style={{ transform: "scale(1.2)", cursor: "pointer" }}
                />
              </div>

              {prefDailyQuote && (
                <div style={{ paddingLeft: "10px", borderLeft: "2px solid var(--color-primary-light, #a5855f)" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #a0a5a4)", display: "block", marginBottom: "5px" }}>Preferred Delivery Time</label>
                  <select
                    value={prefDailyHour}
                    onChange={(e) => setPrefDailyHour(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--color-bg-main, #0f1312)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--color-text-main, #f8f4ed)",
                      fontSize: "0.9rem"
                    }}
                  >
                    <option value={7}>7:00 AM</option>
                    <option value={8}>8:00 AM</option>
                    <option value={9}>9:00 AM (Default)</option>
                    <option value={10}>10:00 AM</option>
                    <option value={18}>6:00 PM</option>
                    <option value={20}>8:00 PM</option>
                  </select>
                </div>
              )}

              <hr style={{ border: 0, borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "5px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>New Article Alerts</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #a0a5a4)" }}>Notifications when new stories are published</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefNewArticles}
                  onChange={(e) => setPrefNewArticles(e.target.checked)}
                  style={{ transform: "scale(1.2)", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>Reading Reminders</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #a0a5a4)" }}>Gentle reminders for saved articles in library</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefReadingReminders}
                  onChange={(e) => setPrefReadingReminders(e.target.checked)}
                  style={{ transform: "scale(1.2)", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>Weekly Reading Summary</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #a0a5a4)" }}>Weekly email digest of your reading progress</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefWeeklySummary}
                  onChange={(e) => setPrefWeeklySummary(e.target.checked)}
                  style={{ transform: "scale(1.2)", cursor: "pointer" }}
                />
              </div>

              {saveSuccessMessage && (
                <div style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: "600" }}>{saveSuccessMessage}</div>
              )}
              {saveErrorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{saveErrorMessage}</div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="secondary-btn"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ padding: "8px 18px", fontSize: "0.85rem" }}
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
