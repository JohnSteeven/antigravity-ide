import React, { useState, useEffect } from "react";
import { FiSave, FiRefreshCw, FiInfo } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function FooterModule() {
  const { getSetting, updateSetting } = useCms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [footerData, setFooterData] = useState({
    footerText: "Thank you for being a part of my journey. Let's grow, learn, and build meaningful things together.",
    copyright: "© {year} MyJourney. All rights reserved.",
    privacyPolicyLink: "/privacy",
    termsLink: "/terms",
    contactDetails: {
      address: "San Francisco, CA",
      phone: "+1 (555) 019-2834",
      email: "hello@myjourney.com",
    },
    socialLinks: {
      instagram: "https://www.instagram.com/j.steeven_?utm_source=qr&igsh=MWh6aHFyNmIxZTV6Mg%3D%3D",
      linkedin: "https://www.linkedin.com/in/noblejohnsteeven/",
      twitter: "https://twitter.com",
      github: "https://github.com",
    },
    newsletter: {
      show: true,
      text: "Stay updated with my monthly recap of posts and projects.",
    }
  });

  const loadFooter = async () => {
    setLoading(true);
    setError("");
    try {
      const val = await getSetting("footer");
      if (val) {
        setFooterData((prev) => ({
          ...prev,
          ...val,
          contactDetails: { ...prev.contactDetails, ...(val.contactDetails || {}) },
          socialLinks: { ...prev.socialLinks, ...(val.socialLinks || {}) },
          newsletter: { ...prev.newsletter, ...(val.newsletter || {}) },
        }));
      }
    } catch (err) {
      setError("Failed to load footer settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFooter();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save footer content configuration?")) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSetting("footer", footerData);
      setSuccess("Footer configurations saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update footer configurations.");
    } finally {
      setSaving(false);
    }
  };

  const handleContactChange = (key, val) => {
    setFooterData((prev) => ({
      ...prev,
      contactDetails: {
        ...prev.contactDetails,
        [key]: val,
      }
    }));
  };

  const handleSocialChange = (key, val) => {
    setFooterData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: val,
      }
    }));
  };

  if (loading) {
    return (
      <div className="cms-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Loading footer configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={handleSave}>
        {success && <div className="cms-alert cms-alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}
        {error && <div className="cms-alert cms-alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="cms-grid-two">
          {/* Copyright & Core Footer Text */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Brand Ending</span>
                <h2>Footer Identity & Text</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                Footer Intro Text *
                <textarea
                  rows="3"
                  required
                  value={footerData.footerText}
                  onChange={(e) => setFooterData({ ...footerData, footerText: e.target.value })}
                  className="form-input"
                />
              </label>
              <label>
                Copyright Template *
                <input
                  type="text"
                  required
                  value={footerData.copyright}
                  onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                  className="form-input"
                  placeholder="e.g. © {year} MyJourney. All rights reserved."
                />
                <span style={{ fontSize: "0.75rem", color: "#a0aec0", marginTop: "2px" }}>
                  Use <code>{`{year}`}</code> to dynamically insert the current calendar year.
                </span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Privacy Policy Link
                  <input
                    type="text"
                    value={footerData.privacyPolicyLink}
                    onChange={(e) => setFooterData({ ...footerData, privacyPolicyLink: e.target.value })}
                    className="form-input"
                  />
                </label>
                <label>
                  Terms of Service Link
                  <input
                    type="text"
                    value={footerData.termsLink}
                    onChange={(e) => setFooterData({ ...footerData, termsLink: e.target.value })}
                    className="form-input"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Engagement Links</span>
                <h2>Social Media Handles</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              {Object.keys(footerData.socialLinks).map((network) => (
                <label key={network} style={{ textTransform: "capitalize" }}>
                  {network} URL
                  <input
                    type="url"
                    value={footerData.socialLinks[network] || ""}
                    onChange={(e) => handleSocialChange(network, e.target.value)}
                    className="form-input"
                    placeholder={`https://${network}.com/`}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="cms-grid-two" style={{ marginTop: "1.5rem" }}>
          {/* Contact Details */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Communication Details</span>
                <h2>Contact Information</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                Office/Location Address
                <input
                  type="text"
                  value={footerData.contactDetails.address}
                  onChange={(e) => handleContactChange("address", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Contact Phone Number
                <input
                  type="text"
                  value={footerData.contactDetails.phone}
                  onChange={(e) => handleContactChange("phone", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Inquiries Email
                <input
                  type="email"
                  value={footerData.contactDetails.email}
                  onChange={(e) => handleContactChange("email", e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
          </div>

          {/* Footer Newsletter widget toggle */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Footer Utilities</span>
                <h2>Newsletter Widget</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={footerData.newsletter.show}
                  onChange={(e) => {
                    const nextNews = { ...footerData.newsletter, show: e.target.checked };
                    setFooterData({ ...footerData, newsletter: nextNews });
                  }}
                />
                Show Newsletter input in site Footer
              </label>
              {footerData.newsletter.show && (
                <label>
                  Newsletter Callout Subtext
                  <textarea
                    rows="3"
                    value={footerData.newsletter.text}
                    onChange={(e) => {
                      const nextNews = { ...footerData.newsletter, text: e.target.value };
                      setFooterData({ ...footerData, newsletter: nextNews });
                    }}
                    className="form-input"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} disabled={saving}>
            {saving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {saving ? "Saving Changes..." : "Save Footer Configurations"}
          </button>
        </div>
      </form>
    </div>
  );
}
