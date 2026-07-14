import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiRotateCcw, FiSearch, FiSave, FiSend, FiList, FiCheckCircle } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function NewsletterModule() {
  const { fetchCampaigns, saveCampaign, sendCampaign, deleteCampaign, restoreCampaign, analytics } = useCms();

  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formId, setFormId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    body: "<p>Write your newsletter here...</p>",
    status: "draft",
    scheduledAt: "",
  });

  // History Popup
  const [historyItem, setHistoryItem] = useState(null);

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

  useEffect(() => {
    loadCampaigns();
  }, [page, status, showDeleted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadCampaigns();
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
    const activeSubs = analytics?.subscribers || 0;
    if (!window.confirm(`Are you sure you want to send "${title}" to all ${activeSubs} subscribers immediately?`)) {
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    try {
      await sendCampaign(id);
      setSuccess(`Newsletter campaign "${title}" sent successfully.`);
      loadCampaigns();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Sending failed.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
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

  const handleRestore = async (id, title) => {
    if (!window.confirm(`Are you sure you want to restore "${title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await restoreCampaign(id);
      setSuccess("Campaign restored.");
      loadCampaigns();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Restoration failed.");
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Newsletter Campaigns</h2>
          <p className="kicker">Create, schedule, and send announcements to subscriber lists ({analytics?.subscribers || 0} active subscribers)</p>
        </div>
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
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

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
                placeholder="e.g. July 2026 Recap"
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
                placeholder="e.g. New projects and stories from this month!"
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
                  <td>{item.status === "sent" ? item.subscriberCount : "—"}</td>
                  <td>
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>
                      {item.status === "sent" && item.sentAt ? new Date(item.sentAt).toLocaleString() :
                       item.status === "scheduled" && item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                      {item.status === "sent" && (
                        <button
                          onClick={() => setHistoryItem(item)}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                          title="View Delivery History"
                        >
                          <FiList /> Logs
                        </button>
                      )}
                      
                      {item.status !== "sent" && !item.isDeleted && (
                        <button
                          onClick={() => handleSend(item._id || item.id, item.title)}
                          disabled={sending}
                          className="btn btn-primary"
                          style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                          title="Send Now"
                        >
                          <FiSend /> Send
                        </button>
                      )}

                      {item.isDeleted ? (
                        <button
                          onClick={() => handleRestore(item._id || item.id, item.title)}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem" }}
                          title="Restore"
                        >
                          <FiRotateCcw />
                        </button>
                      ) : (
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
                            onClick={() => handleDelete(item._id || item.id, item.title)}
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

      {/* History Popup overlay */}
      {historyItem && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "600px", width: "90%", maxHeight: "80%", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Delivery History: {historyItem.title}</h3>
            <p>Sent on: {new Date(historyItem.sentAt).toLocaleString()}</p>
            <p>Total subscribers reached: <strong>{historyItem.subscriberCount}</strong></p>
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
                      <td style={{ padding: "0.5rem", color: "green", fontWeight: "bold" }}>
                        <FiCheckCircle style={{ display: "inline", marginRight: "0.2rem" }} /> {row.status}
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Showing Page {pagination.page} of {pagination.pages} ({pagination.total} campaigns)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="btn btn-secondary">
              Previous
            </button>
            <button onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))} disabled={page === pagination.pages} className="btn btn-secondary">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
