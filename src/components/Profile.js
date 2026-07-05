import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
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
  const { user, updateProfile } = useAuth();
  const { data } = useCms();
  const profile = user.profile || {};
  const coverImage = getProfileCover(profile);
  const [settings, setSettings] = useState({
    darkMode: getThemePreference(profile),
    notificationsEnabled: profile.notificationsEnabled !== false,
    privateProfile: Boolean(profile.privateProfile),
  });
  const [settingsMessage, setSettingsMessage] = useState("");

  const fullName = getFullName(user);
  const authoredArticles = useMemo(
    () =>
      data.articles.filter(
        (article) =>
          article.status === "published" &&
          article.author?.toLowerCase() === fullName.toLowerCase()
      ),
    [data.articles, fullName]
  );
  const bookmarked = data.articles.filter((article) =>
    (profile.bookmarks || []).includes(article.id)
  );
  const liked = data.articles.filter((article) =>
    (profile.likedArticles || []).includes(article.id)
  );
  const notifications = profile.notifications || [];

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

  const renderArticleList = (items, emptyText) =>
    items.length ? (
      items.map((article) => (
        <Link className="profile-article-row" to={`/articles/${article.slug}`} key={article.id}>
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
        className={`profile-hero account-profile-hero ${coverImage ? "has-cover" : ""}`}
        style={coverImage ? { backgroundImage: `url("${coverImage}")` } : undefined}
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
          <h2>Comments</h2>
          {(profile.comments || []).length ? (
            profile.comments.map((comment) => (
              <article className="profile-comment" key={comment.id}>
                <strong>{comment.articleTitle}</strong>
                <p>{comment.text}</p>
              </article>
            ))
          ) : (
            <p className="empty-state compact">No profile comments yet.</p>
          )}
        </section>

        <section className="profile-panel profile-list-panel" id="notifications">
          <h2>
            <FiBell /> Notifications
          </h2>
          {notifications.length ? (
            notifications.map((item) => (
              <article className="notification-row" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <span>{item.createdAt}</span>
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
