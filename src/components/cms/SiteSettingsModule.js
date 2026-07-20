import React, { useState, useEffect } from "react";
import { FiSave, FiRefreshCw, FiImage, FiSettings, FiGlobe, FiMail, FiShare2, FiMonitor } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function SiteSettingsModule() {
  const { getSetting, updateSetting } = useCms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState({
    siteName: "MyJourney",
    siteDescription: "A personal space for thoughts, projects, and experiences.",
    logo: "",
    favicon: "",
    primaryColor: "#426c67",
    secondaryColor: "#e3b87e",
    theme: "Auto",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    defaultLanguage: "en",
    contactEmail: "hello@myjourney.com",
    supportEmail: "support@myjourney.com",
    socials: {
      instagram: "https://www.instagram.com/j.steeven_?igsh=MWh6aHFyNmIxZTV6Mg==",
      linkedin: "https://www.linkedin.com/in/noblejohnsteeven/",
      twitter: "https://twitter.com",
      github: "https://github.com",
    },
    seo: {
      title: "MyJourney - Personal Story & Lessons",
      description: "Read my journey, personal stories, and professional portfolio projects.",
      keywords: "blog, portfolio, resume, developer, logs, life, journey",
    }
  });

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const val = await getSetting("site");
      if (val) {
        setSettings((prev) => ({
          ...prev,
          ...val,
          socials: { ...prev.socials, ...(val.socials || {}) },
          seo: { ...prev.seo, ...(val.seo || {}) },
        }));
      }
    } catch (err) {
      setError("Failed to load site settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save these site settings?")) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSetting("site", settings);
      setSuccess("Site settings saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update site settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSocialChange = (key, val) => {
    setSettings((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [key]: val,
      }
    }));
  };

  const handleSeoChange = (key, val) => {
    setSettings((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [key]: val,
      }
    }));
  };

  if (loading) {
    return (
      <div className="cms-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Loading site settings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={handleSave}>
        {/* Success/Error Alerts */}
        {success && (
          <div className="cms-alert cms-alert-success" style={{ marginBottom: "1rem" }}>
            {success}
          </div>
        )}
        {error && (
          <div className="cms-alert cms-alert-danger" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div className="cms-grid-two">
          {/* General Brand Details */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Core Identity</span>
                <h2>Site & Brand Profile</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                Site Name *
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="form-input"
                />
              </label>
              <label>
                Site Description *
                <textarea
                  rows="3"
                  required
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="form-input"
                />
              </label>
              <label>
                Logo Image URL
                <input
                  type="text"
                  value={settings.logo}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com/logo.png"
                />
              </label>
              <label>
                Favicon URL
                <input
                  type="text"
                  value={settings.favicon}
                  onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com/favicon.ico"
                />
              </label>
            </div>
          </div>

          {/* Localization & Themes */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Localization & Color System</span>
                <h2>Style & Preferences</h2>
              </div>
            </div>
            <div className="form-grid layout-2-col" style={{ marginTop: "1rem" }}>
              <label>
                Primary Brand Color
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  style={{ height: "42px", padding: "2px", width: "100%" }}
                  className="form-input"
                />
              </label>
              <label>
                Secondary Accent Color
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  style={{ height: "42px", padding: "2px", width: "100%" }}
                  className="form-input"
                />
              </label>
              <label>
                Theme Style
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="form-input"
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="Auto">Auto (System Default)</option>
                </select>
              </label>
              <label>
                Timezone
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="form-input"
                >
                  <option value="UTC">UTC</option>
                  <option value="GMT">GMT</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (BST)</option>
                </select>
              </label>
              <label>
                Date Format
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="form-input"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                </select>
              </label>
              <label>
                Default Language
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="form-input"
                >
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="cms-grid-two" style={{ marginTop: "1.5rem" }}>
          {/* Contact Details & Socials */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Communication Links</span>
                <h2>Contact & Socials</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Contact Email
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="form-input"
                  />
                </label>
                <label>
                  Support Email
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="form-input"
                  />
                </label>
              </div>
              <h3 style={{ margin: "1rem 0 0.5rem 0", fontSize: "1rem" }}>Social Media Links</h3>
              {Object.keys(settings.socials).map((network) => (
                <label key={network} style={{ textTransform: "capitalize" }}>
                  {network}
                  <input
                    type="url"
                    value={settings.socials[network] || ""}
                    onChange={(e) => handleSocialChange(network, e.target.value)}
                    className="form-input"
                    placeholder={`https://${network}.com/username`}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* SEO Metadata Defaults */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">SEO & Optimization</span>
                <h2>Default Metadata</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                SEO Page Title Prefix/Suffix
                <input
                  type="text"
                  value={settings.seo.title}
                  onChange={(e) => handleSeoChange("title", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                SEO Page Description
                <textarea
                  rows="3"
                  value={settings.seo.description}
                  onChange={(e) => handleSeoChange("description", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Keywords (comma separated)
                <input
                  type="text"
                  value={settings.seo.keywords}
                  onChange={(e) => handleSeoChange("keywords", e.target.value)}
                  className="form-input"
                  placeholder="blog, portfolio, resume"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} disabled={saving}>
            {saving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
