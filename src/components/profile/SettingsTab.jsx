import { useEffect, useState } from "react";
import {
  FiUser,
  FiBell,
  FiMoon,
  FiShield,
  FiSun,
  FiMail,
  FiLock,
  FiSmartphone,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import SecurityCenter from "../security/SecurityCenter";

const SettingsTab = () => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile || {};

  const [activeSection, setActiveSection] = useState("account");

  // Appearance state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return Boolean(profile.darkMode);
    return window.localStorage.getItem("myjourney-theme") === "dark" || Boolean(profile.darkMode);
  });

  // Notifications state
  const [prefDailyQuote, setPrefDailyQuote]               = useState(user?.notificationPreferences?.dailyQuote?.enabled ?? true);
  const [prefDailyHour, setPrefDailyHour]                 = useState(user?.notificationPreferences?.dailyQuote?.time?.hour ?? 9);
  const [prefNewArticles, setPrefNewArticles]             = useState(user?.notificationPreferences?.newArticles?.enabled ?? false);
  const [prefReadingReminders, setPrefReadingReminders]   = useState(user?.notificationPreferences?.readingReminders?.enabled ?? false);
  const [prefWeeklySummary, setPrefWeeklySummary]         = useState(user?.notificationPreferences?.weeklySummary?.enabled ?? false);

  const [saveSuccessMsg, setSaveSuccessMsg]               = useState("");
  const [saveErrorMsg, setSaveErrorMsg]                   = useState("");

  // Dark mode side-effect
  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("myjourney-theme", darkMode ? "dark" : "light");
    }
  }, [darkMode]);

  const handleToggleDarkMode = async () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    try {
      await updateProfile({
        profile: {
          darkMode: nextVal,
        },
      });
    } catch (e) {
      console.warn("Dark mode preference update failed:", e);
    }
  };

  const handleSaveNotificationPreferences = async (e) => {
    if (e) e.preventDefault();
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      await updateProfile({
        notificationPreferences: {
          dailyQuote: {
            enabled: prefDailyQuote,
            time: {
              hour: Number(prefDailyHour),
              minute: 0,
            },
          },
          newArticles: { enabled: prefNewArticles },
          readingReminders: { enabled: prefReadingReminders },
          weeklySummary: { enabled: prefWeeklySummary },
        },
      });
      setSaveSuccessMsg("✓ Notification preferences saved.");
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    } catch (err) {
      setSaveErrorMsg(err.message || "Failed to update notification preferences.");
    }
  };

  return (
    <div className="rp-settings-layout">
      {/* Settings section navigation sidebar */}
      <div className="rp-settings-sidebar">
        <nav className="rp-settings-nav" aria-label="Settings section menu">
          <button
            type="button"
            className={`rp-settings-nav-item${activeSection === "account" ? " is-active" : ""}`}
            onClick={() => setActiveSection("account")}
          >
            <FiUser /> Account
          </button>

          <button
            type="button"
            className={`rp-settings-nav-item${activeSection === "notifications" ? " is-active" : ""}`}
            onClick={() => setActiveSection("notifications")}
          >
            <FiBell /> Notifications
          </button>

          <button
            type="button"
            className={`rp-settings-nav-item${activeSection === "appearance" ? " is-active" : ""}`}
            onClick={() => setActiveSection("appearance")}
          >
            <FiMoon /> Appearance
          </button>

          <button
            type="button"
            className={`rp-settings-nav-item${activeSection === "security" ? " is-active" : ""}`}
            onClick={() => setActiveSection("security")}
          >
            <FiShield /> Security
          </button>
        </nav>
      </div>

      {/* Settings Section Content */}
      <div className="rp-settings-section">
        {/* ── SECTION 1: ACCOUNT ────────────────────────────────────────── */}
        {activeSection === "account" && (
          <div className="rp-card">
            <h3 className="rp-settings-section-title">
              <FiUser style={{ color: "var(--teal, #426c67)" }} /> Account Settings
            </h3>

            <div className="rp-toggle-row">
              <div className="rp-toggle-info">
                <div className="rp-toggle-title">
                  <FiMail /> Primary Email Address
                </div>
                <div className="rp-toggle-desc">{user.email}</div>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: user.verified?.email ? "#10b981" : "#f59e0b" }}>
                {user.verified?.email ? "✓ Verified" : "Unverified"}
              </div>
            </div>

            <div className="rp-toggle-row">
              <div className="rp-toggle-info">
                <div className="rp-toggle-title">
                  <FiSmartphone /> Registered Mobile Number
                </div>
                <div className="rp-toggle-desc">
                  {user.mobile ? `${user.countryCode || "+91"} ${user.mobile}` : "Not provided"}
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: user.verified?.mobile ? "#10b981" : "#f59e0b" }}>
                {user.verified?.mobile ? "✓ Verified" : "Unverified"}
              </div>
            </div>

            <div className="rp-toggle-row">
              <div className="rp-toggle-info">
                <div className="rp-toggle-title">
                  <FiMail /> Newsletter Subscription
                </div>
                <div className="rp-toggle-desc">
                  Receive story digests and platform updates via email
                </div>
              </div>
              <label className="rp-toggle-switch">
                <input
                  type="checkbox"
                  checked={user.newsletter !== false}
                  onChange={async (e) => {
                    try {
                      await updateProfile({ newsletter: e.target.checked });
                    } catch (err) {
                      console.warn("Newsletter preference update error:", err);
                    }
                  }}
                />
                <span className="rp-toggle-slider" />
              </label>
            </div>

            {/* Danger Zone: Delete Account placed at bottom of Account section */}
            <div style={{ marginTop: 32 }}>
              <div className="rp-danger-zone">
                <h4 className="rp-danger-title">
                  <FiTrash2 /> Danger Zone: Delete Account
                </h4>
                <p className="rp-danger-desc">
                  Requesting account deletion will initiate a 7-day grace window during which you can cancel deletion anytime. Permanently deletes your profile, comments, reading history, and saved bookmarks.
                </p>
                <SecurityCenter user={user} standaloneDeleteOnly />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 2: NOTIFICATIONS ──────────────────────────────────── */}
        {activeSection === "notifications" && (
          <div className="rp-card">
            <h3 className="rp-settings-section-title">
              <FiBell style={{ color: "var(--teal, #426c67)" }} /> Notification Preferences
            </h3>

            {saveSuccessMsg && <div className="rp-alert-success" style={{ marginBottom: 16 }}>{saveSuccessMsg}</div>}
            {saveErrorMsg && <div className="rp-alert-error" style={{ marginBottom: 16 }}>{saveErrorMsg}</div>}

            <form onSubmit={handleSaveNotificationPreferences}>
              <div className="rp-toggle-row">
                <div className="rp-toggle-info">
                  <div className="rp-toggle-title">Daily Motivational Quote</div>
                  <div className="rp-toggle-desc">Receive an inspiring quote push notification every morning</div>
                </div>
                <label className="rp-toggle-switch">
                  <input
                    type="checkbox"
                    checked={prefDailyQuote}
                    onChange={(e) => setPrefDailyQuote(e.target.checked)}
                  />
                  <span className="rp-toggle-slider" />
                </label>
              </div>

              {prefDailyQuote && (
                <div style={{ padding: "10px 14px", background: "rgba(66, 108, 103, 0.05)", borderRadius: 8, margin: "8px 0 16px 0" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink, #1e293b)", display: "block", marginBottom: 6 }}>
                    Preferred Daily Delivery Time
                  </label>
                  <select
                    className="rp-draft-select"
                    value={prefDailyHour}
                    onChange={(e) => setPrefDailyHour(Number(e.target.value))}
                    style={{ maxWidth: 220 }}
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

              <div className="rp-toggle-row">
                <div className="rp-toggle-info">
                  <div className="rp-toggle-title">New Article Alerts</div>
                  <div className="rp-toggle-desc">Notifications when new articles are published in favorite categories</div>
                </div>
                <label className="rp-toggle-switch">
                  <input
                    type="checkbox"
                    checked={prefNewArticles}
                    onChange={(e) => setPrefNewArticles(e.target.checked)}
                  />
                  <span className="rp-toggle-slider" />
                </label>
              </div>

              <div className="rp-toggle-row">
                <div className="rp-toggle-info">
                  <div className="rp-toggle-title">Reading Reminders</div>
                  <div className="rp-toggle-desc">Gentle reminders to finish articles saved in your queue</div>
                </div>
                <label className="rp-toggle-switch">
                  <input
                    type="checkbox"
                    checked={prefReadingReminders}
                    onChange={(e) => setPrefReadingReminders(e.target.checked)}
                  />
                  <span className="rp-toggle-slider" />
                </label>
              </div>

              <div className="rp-toggle-row">
                <div className="rp-toggle-info">
                  <div className="rp-toggle-title">Weekly Reading Digest</div>
                  <div className="rp-toggle-desc">A weekly email summary of your reading streak and stats</div>
                </div>
                <label className="rp-toggle-switch">
                  <input
                    type="checkbox"
                    checked={prefWeeklySummary}
                    onChange={(e) => setPrefWeeklySummary(e.target.checked)}
                  />
                  <span className="rp-toggle-slider" />
                </label>
              </div>

              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="primary-btn" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SECTION 3: APPEARANCE ─────────────────────────────────────── */}
        {activeSection === "appearance" && (
          <div className="rp-card">
            <h3 className="rp-section-title">
              <FiMoon style={{ color: "var(--teal, #426c67)" }} /> Appearance Settings
            </h3>

            <div className="rp-toggle-row">
              <div className="rp-toggle-info">
                <div className="rp-toggle-title">
                  {darkMode ? <FiMoon style={{ color: "#8b5cf6" }} /> : <FiSun style={{ color: "#f59e0b" }} />}
                  Dark Theme Mode
                </div>
                <div className="rp-toggle-desc">
                  Switch between MyJourney Signature Cream mode and Night mode
                </div>
              </div>
              <label className="rp-toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={handleToggleDarkMode}
                />
                <span className="rp-toggle-slider" />
              </label>
            </div>
          </div>
        )}

        {/* ── SECTION 4: SECURITY ───────────────────────────────────────── */}
        {activeSection === "security" && (
          <div className="rp-security-inline">
            <SecurityCenter user={user} embedFull />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
