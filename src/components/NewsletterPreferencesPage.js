import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { subscriberApi } from "../services/apiService";
import { FiSliders, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

export default function NewsletterPreferencesPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [preferences, setPreferences] = useState({
    weeklyDigest: true,
    newArticles: true,
    featuredArticles: true,
    mustRead: true,
    announcements: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Preferences access token is missing.");
      return;
    }

    const loadPrefs = async () => {
      try {
        const res = await subscriberApi.getPreferences(token);
        setEmail(res.email);
        setStatus(res.status);
        if (res.preferences) {
          setPreferences({ ...preferences, ...res.preferences });
        }
      } catch (err) {
        setError(err.message || "Invalid preferences access link.");
      } finally {
        setLoading(false);
      }
    };

    loadPrefs();
  }, [token]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await subscriberApi.updatePreferences(token, preferences);
      setMessage("Your email notification preferences have been saved.");
    } catch (err) {
      setError(err.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    const reason = window.prompt(
      "Optional: Please let us know why you are unsubscribing:\n1. Too many emails\n2. Content is not relevant\n3. I never signed up\n4. Other",
      "Too many emails"
    );
    if (reason === null) return; // User cancelled

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await subscriberApi.unsubscribeByToken(token, reason || "No reason specified");
      setStatus("unsubscribed");
      setMessage("You have been unsubscribed successfully.");
    } catch (err) {
      setError(err.message || "Failed to unsubscribe.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <FiLoader className="spinner" style={{ fontSize: "2.5rem", color: "#426c67" }} />
          <p>Loading email preferences...</p>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "2.5rem", maxWidth: "480px", textAlign: "center" }}>
          <FiXCircle style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "1rem" }} />
          <h3>Invalid Access Link</h3>
          <p style={{ color: "#64748b", margin: "1rem 0" }}>{error}</p>
          <Link to="/" className="btn btn-primary" style={{ display: "inline-block", background: "#426c67", color: "#fff", padding: "0.5rem 1rem", textDecoration: "none", borderRadius: "6px" }}>Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "75vh", padding: "3rem 1rem", display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid #e4ded4", borderRadius: "12px", padding: "2.5rem", maxWidth: "600px", width: "100%", height: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <FiSliders style={{ fontSize: "1.8rem", color: "#426c67" }} />
          <div>
            <h2 style={{ margin: 0, fontFamily: "Georgia, serif" }}>Email Preferences</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Manage notifications for <strong>{email}</strong></p>
          </div>
        </div>

        {message && <div className="cms-alert cms-alert-success" style={{ marginBottom: "1rem" }}>{message}</div>}
        {error && <div className="cms-alert cms-alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

        {status === "unsubscribed" ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <FiCheckCircle style={{ fontSize: "3rem", color: "#22c55e", marginBottom: "0.5rem" }} />
            <h3>Unsubscribed</h3>
            <p style={{ color: "#64748b" }}>You will no longer receive newsletter notifications from MyJourney.</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid #edf2f7", borderRadius: "8px", cursor: "pointer" }}>
                <div>
                  <strong style={{ display: "block" }}>New Article Alerts</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Receive emails whenever a new story or post is published.</span>
                </div>
                <input type="checkbox" checked={preferences.newArticles} onChange={() => handleToggle("newArticles")} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid #edf2f7", borderRadius: "8px", cursor: "pointer" }}>
                <div>
                  <strong style={{ display: "block" }}>Weekly Digest</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Weekly roundup of top-performing stories.</span>
                </div>
                <input type="checkbox" checked={preferences.weeklyDigest} onChange={() => handleToggle("weeklyDigest")} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid #edf2f7", borderRadius: "8px", cursor: "pointer" }}>
                <div>
                  <strong style={{ display: "block" }}>Featured & Must Read Stories</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Curated highlights and essential readings.</span>
                </div>
                <input type="checkbox" checked={preferences.featuredArticles} onChange={() => handleToggle("featuredArticles")} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid #edf2f7", borderRadius: "8px", cursor: "pointer" }}>
                <div>
                  <strong style={{ display: "block" }}>Announcements & Updates</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Site updates, new project announcements, and news.</span>
                </div>
                <input type="checkbox" checked={preferences.announcements} onChange={() => handleToggle("announcements")} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ background: "#426c67", color: "#fff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "6px", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Preferences"}
              </button>
              <button type="button" onClick={handleUnsubscribe} disabled={saving} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>
                Unsubscribe from all
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
