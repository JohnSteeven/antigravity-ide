import React, { useState, useEffect } from "react";
import { FiSave, FiUser, FiLock, FiActivity, FiBarChart2, FiShield, FiUpload } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function ProfileModule() {
  const { getMe, updateProfile, data } = useCms();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Statistics Calculation
  const stats = React.useMemo(() => {
    if (!user) return { published: 0, drafts: 0, views: 0, likes: 0, comments: 0 };
    const articles = data.articles || [];
    const userArticles = articles.filter(a => a.authorId === user._id || a.authorId === user.id);
    const comments = data.comments || [];

    const published = userArticles.filter(a => a.status === "published").length;
    const drafts = userArticles.filter(a => a.status === "draft").length;
    const views = userArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const likes = userArticles.reduce((sum, a) => sum + (a.likes || 0), 0);

    // Comments on user's articles
    const articleIds = userArticles.map(a => a.id || a._id);
    const commentsOnUserArticles = comments.filter(c => articleIds.includes(c.articleId?._id || c.articleId?.id || c.articleId)).length;

    return {
      published,
      drafts,
      views,
      likes,
      comments: commentsOnUserArticles,
    };
  }, [user, data.articles, data.comments]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const resUser = await getMe();
      if (resUser) {
        setUser(resUser);
        setFirstName(resUser.firstName || "");
        setLastName(resUser.lastName || "");
        setUsername(resUser.username || "");
        setEmail(resUser.email || "");
        setMobile(resUser.mobile || "");
        setAvatar(resUser.profile?.avatar || "");
        setBio(resUser.profile?.bio || "");
        setTwitter(resUser.profile?.socialLinks?.twitter || "");
        setGithub(resUser.profile?.socialLinks?.github || "");
        setWebsite(resUser.profile?.socialLinks?.website || "");
      }
    } catch (err) {
      setError(err.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        firstName,
        lastName,
        username,
        email,
        mobile,
        profile: {
          avatar,
          bio,
          socialLinks: {
            twitter,
            github,
            website,
          },
        },
      };
      const updated = await updateProfile(payload);
      setUser(updated);
      setSuccess("Profile details updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to change password.");
      }
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "profile");

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Upload failed.");
      setAvatar(resData.media.url);
      setSuccess("Profile picture uploaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to upload avatar picture.");
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header">
        <h2 style={{ margin: 0 }}>My Personal Profile</h2>
        <p className="kicker">Inspect statistics and configure account preferences</p>
      </div>

      {error && (
        <div className="cms-alert cms-alert-danger" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} className="close-btn" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}
      {success && (
        <div className="cms-alert cms-alert-success" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="close-btn" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading profile information...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", marginTop: "1.5rem" }}>
          
          {/* Left Column - Stats & Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
              <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 1rem auto" }}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "bold" }}>
                    {firstName[0]}
                  </div>
                )}
                <label style={{ position: "absolute", bottom: 0, right: 0, background: "#1a73e8", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}>
                  <FiUpload size={14} />
                  <input type="file" onChange={handleAvatarUpload} style={{ display: "none" }} accept="image/*" />
                </label>
              </div>
              <h3 style={{ margin: "0 0 0.25rem 0" }}>{firstName} {lastName}</h3>
              <p style={{ color: "#666", margin: "0 0 1rem 0" }}>@{username}</p>
              <div style={{ background: "#f8f9fa", padding: "0.5rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold", color: "#1a73e8" }}>
                Role: {user?.role}
              </div>
            </div>

            {/* Publishing Statistics */}
            <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "1.5rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiBarChart2 /> Publishing Statistics</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
                <div style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>Published</div>
                  <strong style={{ fontSize: "1.2rem", color: "#137333" }}>{stats.published}</strong>
                </div>
                <div style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>Drafts</div>
                  <strong style={{ fontSize: "1.2rem", color: "#5f6368" }}>{stats.drafts}</strong>
                </div>
                <div style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>Total Views</div>
                  <strong style={{ fontSize: "1.2rem", color: "#1a73e8" }}>{stats.views}</strong>
                </div>
                <div style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>Likes Received</div>
                  <strong style={{ fontSize: "1.2rem", color: "#c5221f" }}>{stats.likes}</strong>
                </div>
              </div>
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", textAlign: "center", fontSize: "0.9rem" }}>
                <div style={{ color: "#666", fontSize: "0.75rem" }}>Comments Received</div>
                <strong style={{ fontSize: "1.2rem", color: "#b06000" }}>{stats.comments}</strong>
              </div>
            </div>

            {/* Security MFA Placeholder */}
            <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "1.5rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiShield /> Two-Factor Auth (2FA)</h4>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
                <span style={{ fontSize: "0.9rem" }}>Status: Disabled</span>
                <button disabled className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "not-allowed" }}>Enable</button>
              </div>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.7rem", color: "#888" }}>Two-factor authentication adds an extra layer of security to your admin account (planned future integration).</p>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Personal Information Form */}
            <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiUser /> Personal Information</h3>
              <form onSubmit={handleProfileSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Biography (Bio)</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="form-input" rows="3" placeholder="Tell readers about yourself..." />
                </div>

                <div style={{ gridColumn: "1/-1", borderTop: "1px solid #eee", marginTop: "1rem", paddingTop: "1rem" }}>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Social Profile Links</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Twitter handle</label>
                      <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className="form-input" placeholder="e.g. twitter_username" />
                    </div>
                    <div className="form-group">
                      <label>GitHub username</label>
                      <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} className="form-input" placeholder="e.g. github_username" />
                    </div>
                    <div className="form-group" style={{ gridColumn: "1/-1" }}>
                      <label>Personal Website URL</label>
                      <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="form-input" placeholder="e.g. https://mywebsite.com" />
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="submit" disabled={updating} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FiSave /> {updating ? "Saving Details..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiLock /> Change Account Password</h3>
              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" required />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
