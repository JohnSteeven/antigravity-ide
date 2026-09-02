import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiSave,
  FiSend,
  FiList,
  FiCheckCircle,
  FiUsers,
  FiMail,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";
import { subscriberApi } from "../../services/apiService";

export default function NewsletterModule() {
  const { fetchCampaigns, saveCampaign, sendCampaign, deleteCampaign, restoreCampaign, deleteSubscriber } = useCms();

  const [activeTab, setActiveTab] = useState("campaigns"); // 'campaigns' | 'subscribers'

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Campaign Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Campaign Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formId, setFormId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    body: "<p>Write your newsletter here...</p>",
    status: "draft",
    scheduledAt: "",
  });

  // Delivery Logs Modal
  const [historyItem, setHistoryItem] = useState(null);

  // Subscribers State
  const [subscribers, setSubscribers] = useState([]);
  const [subPagination, setSubPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [subStats, setSubStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    unsubscribed: 0,
    bounced: 0,
    todayCount: 0,
    resubscriptionCount: 0,
    verificationConversionRate: 0,
    deliverySuccessRate: 98.5,
  });
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState("");
  const [subStatus, setSubStatus] = useState("all");
  const [subPage, setSubPage] = useState(1);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchCampaigns({
        page,
        limit: 10,
        search,
        status: status === "all" ? undefined : status,
        includeDeleted: showDeleted,
      });
      if (res && res.campaigns) {
        setCampaigns(res.campaigns);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubscribers = async () => {
    setSubLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        subscriberApi.list({
          page: subPage,
          limit: 10,
          search: subSearch,
          status: subStatus === "all" ? undefined : subStatus,
        }),
        subscriberApi.getStats().catch(() => ({ stats: null })),
      ]);

      if (res && res.subscribers) {
        setSubscribers(res.subscribers);
        setSubPagination(res.pagination);
      }
      if (statsRes && statsRes.stats) {
        setSubStats(statsRes.stats);
      }
    } catch (err) {
      setError(err.message || "Failed to load subscribers.");
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "campaigns") {
      loadCampaigns();
    } else {
      loadSubscribers();
    }
  }, [activeTab, page, status, showDeleted, subPage, subStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadCampaigns();
  };

  const handleSubSearchSubmit = (e) => {
    e.preventDefault();
    setSubPage(1);
    loadSubscribers();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim() || !formData.body.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveCampaign({
        ...formData,
        id: formId,
      });
      setSuccess(formId ? "Newsletter campaign updated." : "Newsletter campaign created as draft.");
      setIsFormOpen(false);
      resetForm();
      loadCampaigns();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setFormId(item._id || item.id);
    setFormData({
      title: item.title || "",
      subject: item.subject || "",
      body: item.body || "",
      status: item.status || "draft",
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormId("");
    setFormData({
      title: "",
      subject: "",
      body: "<p>Write your newsletter here...</p>",
      status: "draft",
      scheduledAt: "",
    });
    setError("");
  };

  const handleSend = async (id, title) => {
    const verifiedSubs = subStats.verified || 0;
    if (!window.confirm(`Are you sure you want to send "${title}" to all ${verifiedSubs} verified subscribers?`)) {
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    try {
      await sendCampaign(id);
      setSuccess(`Newsletter campaign "${title}" dispatched successfully.`);
      loadCampaigns();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Sending failed.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteCampaign = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteCampaign(id);
      setSuccess("Campaign soft deleted.");
      loadCampaigns();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Deletion failed.");
    }
  };

  // SMTP Tester Modal
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpResult, setSmtpResult] = useState(null);

  const handleTestSmtp = async (e) => {
    e.preventDefault();
    setTestingSmtp(true);
    setSmtpResult(null);
    try {
      const { settingApi } = require("../../services/apiService");
      const res = await settingApi.testSmtp(testEmailInput);
      setSmtpResult({ success: true, message: res.message });
    } catch (err) {
      setSmtpResult({ success: false, message: err.message });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleResendVerification = async (subId, email) => {
    setError("");
    setSuccess("");
    try {
      const res = await subscriberApi.resendVerification(subId);
      setSuccess(res.message || `Verification email resent to ${email}`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to resend verification link.");
    }
  };

  const handleDeleteSub = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete subscriber "${email}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteSubscriber(id);
      setSuccess("Subscriber removed.");
      loadSubscribers();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Deletion failed.");
    }
  };

  const exportSubscribersCSV = () => {
    if (!subscribers.length) return;
    const headers = ["ID", "Email", "Status", "Verified", "Source", "Subscribed At", "Verified At"];
    const rows = subscribers.map((s) => [
      s._id || s.id,
      `"${s.email}"`,
      s.status || (s.active ? "verified" : "unsubscribed"),
      s.verified ? "Yes" : "No",
      `"${s.source || "website_footer"}"`,
      new Date(s.createdAt).toISOString(),
      s.verifiedAt ? new Date(s.verifiedAt).toISOString() : "—",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cms-panel">
      {/* Header */}
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Newsletter Management System</h2>
          <p className="kicker">Campaign builder, real-time subscriber management, email verification, and delivery analytics</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setSmtpModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <FiMail /> Test SMTP Connection
          </button>

          {activeTab === "campaigns" && (
            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(!isFormOpen);
              }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <FiPlus /> {isFormOpen ? "Close Panel" : "Create Campaign"}
            </button>
          )}

          {activeTab === "subscribers" && (
            <button onClick={exportSubscribersCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiDownload /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginTop: "1rem" }}>
        <button
          onClick={() => setActiveTab("campaigns")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "campaigns" ? "3px solid #3182ce" : "none",
            fontWeight: activeTab === "campaigns" ? "bold" : "normal",
            color: activeTab === "campaigns" ? "#3182ce" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FiMail /> Campaigns & Broadcasts
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "subscribers" ? "3px solid #3182ce" : "none",
            fontWeight: activeTab === "subscribers" ? "bold" : "normal",
            color: activeTab === "subscribers" ? "#3182ce" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FiUsers /> Subscribers & Analytics
        </button>
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      {/* ─── TAB 1: CAMPAIGNS & BROADCASTS ────────────────────────────────────── */}
      {activeTab === "campaigns" && (
        <>
          {/* Form Editor panel */}
          {isFormOpen && (
            <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "8px", margin: "1.5rem 0" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
                {formId ? "Edit Campaign Details" : "Draft New Campaign"}
              </h3>
              <form onSubmit={handleSave} className="form-grid one">
                <label>
                  Internal Campaign Title *
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                    placeholder="e.g. July 2026 Monthly Recap"
                  />
                </label>
                <label>
                  Email Subject Line *
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="form-input"
                    placeholder="e.g. New stories, project notes, and reflections!"
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label>
                    Status
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-input"
                      disabled={formData.status === "sent"}
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                      {formData.status === "sent" && <option value="sent">Sent</option>}
                    </select>
                  </label>
                  {formData.status === "scheduled" && (
                    <label>
                      Schedule Date & Time
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="form-input"
                      />
                    </label>
                  )}
                </div>
                <label>
                  Email Body Content (HTML or Plain text) *
                  <textarea
                    rows="8"
                    required
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="form-input"
                    placeholder="Write your email here..."
                  />
                </label>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} disabled={saving}>
                    <FiSave />
                    {saving ? "Saving..." : "Save Campaign"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter and Search Bar */}
          <form onSubmit={handleSearchSubmit} className="filters-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Search Campaigns</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                />
                <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem" }}><FiSearch /></button>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Campaign Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input">
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
                />
                View Deleted
              </label>
            </div>
          </form>

          {/* Campaigns list Table */}
          <div className="table-container">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Sent / Scheduled</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                      <div className="spinner" style={{ margin: "0 auto" }}></div>
                      <p>Loading campaigns...</p>
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                      No newsletter campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((item) => (
                    <tr key={item._id || item.id} style={{ opacity: item.isDeleted ? 0.6 : 1 }}>
                      <td><strong>{item.title}</strong></td>
                      <td><span style={{ fontSize: "0.9rem" }}>{item.subject}</span></td>
                      <td>
                        <span className={`badge ${
                          item.status === "sent" ? "badge-success" :
                          item.status === "scheduled" ? "badge-info" :
                          item.status === "archived" ? "badge-secondary" : "badge-warning"
                        }`}>
                          {item.status}
                        </span>
                        {item.isDeleted && <span className="badge badge-danger" style={{ marginLeft: "0.25rem" }}>Deleted</span>}
                      </td>
                      <td>{item.subscriberCount || "—"}</td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#666" }}>
                          {item.status === "sent" && item.sentAt ? new Date(item.sentAt).toLocaleString() :
                           item.status === "scheduled" && item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                          {item.deliveryHistory && item.deliveryHistory.length > 0 && (
                            <button
                              onClick={() => setHistoryItem(item)}
                              className="btn btn-secondary"
                              style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                              title="View Delivery History Logs"
                            >
                              <FiList /> Logs
                            </button>
                          )}
                          
                          {!item.isDeleted && (
                            <button
                              onClick={() => handleSend(item._id || item.id, item.title)}
                              disabled={sending}
                              className="btn btn-primary"
                              style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                              title={item.status === "sent" ? "Resume / Re-send Remaining" : "Send Campaign"}
                            >
                              <FiSend /> {item.status === "sent" ? "Resume Send" : "Send"}
                            </button>
                          )}

                          {!item.isDeleted && (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="btn btn-secondary"
                                style={{ padding: "0.25rem 0.5rem", color: "#3182ce" }}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(item._id || item.id, item.title)}
                                className="btn btn-secondary"
                                style={{ padding: "0.25rem 0.5rem", color: "#e53e3e" }}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── TAB 2: SUBSCRIBERS & ANALYTICS ───────────────────────────────────── */}
      {activeTab === "subscribers" && (
        <>
          {/* Top Analytics Counter Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
            <div style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <FiUsers style={{ fontSize: "1.5rem", color: "#3182ce" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginTop: "0.2rem" }}>{subStats.total || 0}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Subscribers</div>
            </div>
            <div style={{ padding: "1rem", textAlign: "center", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <FiCheckCircle style={{ fontSize: "1.5rem", color: "#22c55e" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#166534", marginTop: "0.2rem" }}>{subStats.verified || 0}</div>
              <div style={{ fontSize: "0.8rem", color: "#166534" }}>Verified</div>
            </div>
            <div style={{ padding: "1rem", textAlign: "center", background: "#fefce8", borderRadius: "8px", border: "1px solid #fef08a" }}>
              <FiClock style={{ fontSize: "1.5rem", color: "#eab308" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#854d0e", marginTop: "0.2rem" }}>{subStats.pending || 0}</div>
              <div style={{ fontSize: "0.8rem", color: "#854d0e" }}>Pending Verification</div>
            </div>
            <div style={{ padding: "1rem", textAlign: "center", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
              <FiTrendingUp style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#1e40af", marginTop: "0.2rem" }}>{subStats.verificationConversionRate || 0}%</div>
              <div style={{ fontSize: "0.8rem", color: "#1e40af" }}>Conversion Rate</div>
            </div>
            <div style={{ padding: "1rem", textAlign: "center", background: "#fdf2f8", borderRadius: "8px", border: "1px solid #fbcfe8" }}>
              <FiAlertCircle style={{ fontSize: "1.5rem", color: "#ec4899" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#9d174d", marginTop: "0.2rem" }}>{subStats.deliverySuccessRate || 98.5}%</div>
              <div style={{ fontSize: "0.8rem", color: "#9d174d" }}>Delivery Success</div>
            </div>
          </div>

          {/* 7-Day Subscriber Growth Trend */}
          {subStats.growthDays && subStats.growthDays.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem" }}>
                <FiTrendingUp style={{ color: "#3182ce" }} /> 7-Day Subscriber Growth Trend
              </h4>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: "100px", paddingTop: "1rem" }}>
                {subStats.growthDays.map((day, idx) => {
                  const maxCount = Math.max(...subStats.growthDays.map((d) => d.count), 1);
                  const barHeight = Math.max((day.count / maxCount) * 70, 8);
                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#3182ce" }}>{day.count}</span>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "32px",
                          height: `${barHeight}px`,
                          background: "#3182ce",
                          borderRadius: "4px 4px 0 0",
                          margin: "0.25rem 0",
                        }}
                      ></div>
                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Status Filters Bar */}
          <form onSubmit={handleSubSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search subscriber email..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: "200px" }}
            />
            <select value={subStatus} onChange={(e) => { setSubStatus(e.target.value); setSubPage(1); }} className="form-input" style={{ width: "150px" }}>
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}><FiSearch /></button>
          </form>

          {/* Subscribers Table */}
          <div className="table-container">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Subscriber Email</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Subscribed Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                      <div className="spinner" style={{ margin: "0 auto" }}></div>
                      <p>Loading subscribers...</p>
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                      No subscribers match the current filter.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub._id || sub.id}>
                      <td><strong>{sub.email}</strong></td>
                      <td>
                        <span className={`badge ${
                          sub.status === "verified" || (sub.verified && sub.active) ? "badge-success" :
                          sub.status === "pending" ? "badge-warning" : "badge-secondary"
                        }`}>
                          {sub.status || (sub.active ? "verified" : "unsubscribed")}
                        </span>
                      </td>
                      <td><span style={{ fontSize: "0.85rem", color: "#64748b" }}>{sub.source || "website_footer"}</span></td>
                      <td><span style={{ fontSize: "0.8rem", color: "#666" }}>{new Date(sub.createdAt).toLocaleDateString()}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                          {sub.status === "pending" && (
                            <button
                              onClick={() => handleResendVerification(sub._id || sub.id, sub.email)}
                              className="btn btn-secondary"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                              title="Resend Verification Email"
                            >
                              <FiRefreshCw /> Resend Link
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSub(sub._id || sub.id, sub.email)}
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", color: "#e53e3e" }}
                            title="Delete Subscriber"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* History Popup overlay */}
      {historyItem && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "600px", width: "90%", maxHeight: "80%", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Delivery History: {historyItem.title}</h3>
            <p>Sent on: {historyItem.sentAt ? new Date(historyItem.sentAt).toLocaleString() : "Processing"}</p>
            <p>Recipients reached: <strong>{historyItem.subscriberCount || 0}</strong></p>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginTop: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead style={{ background: "#f7fafc" }}>
                  <tr>
                    <th style={{ padding: "0.5rem", textAlign: "left" }}>Recipient Email</th>
                    <th style={{ padding: "0.5rem", textAlign: "left" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyItem.deliveryHistory || []).map((row, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.5rem" }}>{row.email}</td>
                      <td style={{ padding: "0.5rem", color: row.status === "success" ? "green" : "red", fontWeight: "bold" }}>
                        {row.status === "success" ? <FiCheckCircle style={{ display: "inline", marginRight: "0.2rem" }} /> : <FiAlertCircle style={{ display: "inline", marginRight: "0.2rem" }} />}
                        {row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: "1.5rem" }} onClick={() => setHistoryItem(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* SMTP Test Modal */}
      {smtpModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "10px", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiMail /> Test SMTP Configuration
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b" }}>
              Send a real test email to verify server host, port, authentication, and SSL settings.
            </p>

            <form onSubmit={handleTestSmtp} style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.85rem" }}>
                Recipient Test Email:
              </label>
              <input
                type="email"
                required
                placeholder="Enter test recipient email"
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                className="form-input"
                style={{ width: "100%", padding: "0.6rem", marginBottom: "1rem" }}
              />

              {smtpResult && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    background: smtpResult.success ? "#f0fdf4" : "#fef2f2",
                    color: smtpResult.success ? "#166534" : "#991b1b",
                    border: `1px solid ${smtpResult.success ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {smtpResult.message}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setSmtpModalOpen(false); setSmtpResult(null); }}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={testingSmtp}>
                  {testingSmtp ? "Testing..." : "Send Test Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
