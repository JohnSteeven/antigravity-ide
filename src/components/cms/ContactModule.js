import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiRotateCcw, FiMail, FiMessageSquare, FiArchive, FiUser, FiEdit3, FiDownload, FiCheckCircle, FiClock, FiList, FiAlertCircle } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";
import { contactMessageApi } from "../../services/apiService";

export default function ContactModule() {
  const { fetchContactMessages, updateContactMessage, deleteContactMessage, restoreContactMessage } = useCms();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [stats, setStats] = useState({ total: 0, unread: 0, resolved: 0, pending: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [inquiryType, setInquiryType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Detail Modal / Sidebar
  const [activeMessage, setActiveMessage] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("read");
  const [priorityDraft, setPriorityDraft] = useState("Medium");
  const [repliedDraft, setRepliedDraft] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        fetchContactMessages({
          page,
          limit: 10,
          search,
          status: status === "all" ? undefined : status,
          inquiryType: inquiryType === "all" ? undefined : inquiryType,
          priority: priority === "all" ? undefined : priority,
          includeDeleted: showDeleted,
        }),
        contactMessageApi.getStats().catch(() => ({ stats: null })),
      ]);

      if (res && res.messages) {
        setMessages(res.messages);
        setPagination(res.pagination);
      }
      if (statsRes && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      setError(err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [page, status, inquiryType, priority, showDeleted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadMessages();
  };

  const openDetail = (msg) => {
    setActiveMessage(msg);
    setNotesDraft(msg.notes || "");
    setStatusDraft(msg.status || "read");
    setPriorityDraft(msg.priority || "Medium");
    setRepliedDraft(Boolean(msg.replied));

    // Automatically mark as read if it is unread
    if (msg.status === "unread") {
      handleStatusChange(msg._id || msg.id, "read");
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      const updated = await updateContactMessage(id, { status: nextStatus });
      setMessages((prev) => prev.map((m) => (m._id === id || m.id === id ? updated : m)));
      if (activeMessage && (activeMessage._id === id || activeMessage.id === id)) {
        setActiveMessage(updated);
        setStatusDraft(nextStatus);
      }
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const handleSaveNotes = async () => {
    if (!activeMessage) return;
    setSaving(true);
    try {
      const id = activeMessage._id || activeMessage.id;
      const updated = await updateContactMessage(id, {
        notes: notesDraft,
        status: statusDraft,
        priority: priorityDraft,
        replied: repliedDraft,
      });
      setMessages((prev) => prev.map((m) => (m._id === id || m.id === id ? updated : m)));
      setActiveMessage(updated);
      setSuccess("Internal notes & operational status saved.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete message from "${name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteContactMessage(id);
      setSuccess("Contact message soft deleted.");
      setActiveMessage(null);
      loadMessages();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Deletion failed.");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Are you sure you want to restore message from "${name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await restoreContactMessage(id);
      setSuccess("Contact message restored.");
      loadMessages();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Restoration failed.");
    }
  };

  const exportCSV = () => {
    if (!messages.length) return;
    const headers = ["ID", "Name", "Email", "Inquiry Type", "Subject", "Status", "Priority", "Created At"];
    const rows = messages.map((m) => [
      m._id || m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email}"`,
      `"${m.inquiryType || "General Question"}"`,
      `"${m.subject.replace(/"/g, '""')}"`,
      m.status,
      m.priority || "Medium",
      new Date(m.createdAt).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contact_messages_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Contact Form Submissions</h2>
          <p className="kicker">Read, manage, and moderate support inquiries and reader messages</p>
        </div>
        <button onClick={exportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Top Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div className="cms-card" style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <FiList style={{ fontSize: "1.5rem", color: "#3182ce" }} />
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginTop: "0.3rem" }}>{stats.total || pagination.total || 0}</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Messages</div>
        </div>
        <div className="cms-card" style={{ padding: "1rem", textAlign: "center", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
          <FiAlertCircle style={{ fontSize: "1.5rem", color: "#ef4444" }} />
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#991b1b", marginTop: "0.3rem" }}>{stats.unread || 0}</div>
          <div style={{ fontSize: "0.8rem", color: "#991b1b" }}>Unread</div>
        </div>
        <div className="cms-card" style={{ padding: "1rem", textAlign: "center", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <FiCheckCircle style={{ fontSize: "1.5rem", color: "#22c55e" }} />
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#166534", marginTop: "0.3rem" }}>{stats.resolved || 0}</div>
          <div style={{ fontSize: "0.8rem", color: "#166534" }}>Resolved</div>
        </div>
        <div className="cms-card" style={{ padding: "1rem", textAlign: "center", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
          <FiClock style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#1e40af", marginTop: "0.3rem" }}>{stats.today || 0}</div>
          <div style={{ fontSize: "0.8rem", color: "#1e40af" }}>Today</div>
        </div>
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      {/* Grid: message inbox and message details */}
      <div className="cms-grid-two" style={{ marginTop: "1.5rem" }}>
        
        {/* Inbox Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Filter Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search sender / message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: "150px" }}
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input" style={{ width: "120px" }}>
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
              <option value="spam">Spam</option>
            </select>
            <select value={inquiryType} onChange={(e) => { setInquiryType(e.target.value); setPage(1); }} className="form-input" style={{ width: "140px" }}>
              <option value="all">All Types</option>
              <option value="General Question">General Question</option>
              <option value="Feedback">Feedback</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Business Inquiry">Business Inquiry</option>
              <option value="Report Content">Report Content</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem" }}><FiSearch /></button>
          </form>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
            />
            Show Deleted Messages
          </label>

          {/* Messages list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "600px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div className="spinner" style={{ margin: "0 auto" }}></div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <p className="empty-state">No messages match filters.</p>
            ) : (
              messages.map((item) => (
                <div
                  key={item._id || item.id}
                  onClick={() => openDetail(item)}
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    border: activeMessage && (activeMessage._id === item._id || activeMessage.id === item.id) ? "2px solid #3182ce" : "1px solid #e2e8f0",
                    background: item.status === "unread" ? "#f0f4f8" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: item.isDeleted ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#2d3748" }}>{item.name}</strong>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <span className={`badge ${
                        item.priority === "High" ? "badge-danger" :
                        item.priority === "Medium" ? "badge-warning" : "badge-secondary"
                      }`}>
                        {item.priority || "Medium"}
                      </span>
                      <span className={`badge ${
                        item.status === "unread" ? "badge-danger" :
                        item.status === "resolved" ? "badge-success" :
                        item.status === "read" ? "badge-info" : "badge-secondary"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
                    {item.email} &bull; <span style={{ fontWeight: 600 }}>{item.inquiryType || "General Question"}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1a202c", marginTop: "0.4rem" }}>
                    {item.subject}
                  </div>
                  <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "#718096", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.message}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#a0aec0", marginTop: "0.5rem", textAlign: "right" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#666" }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>Prev</button>
                <button onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))} disabled={page === pagination.pages} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="cms-panel" style={{ border: "1px solid #e2e8f0", background: "#f8f9fa" }}>
          {activeMessage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{activeMessage.subject}</h3>
                  <div style={{ fontSize: "0.9rem", color: "#4a5568", marginTop: "0.4rem" }}>
                    From: <strong>{activeMessage.name}</strong> &lt;{activeMessage.email}&gt;
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "0.2rem" }}>
                    Inquiry Type: <strong>{activeMessage.inquiryType || "General Question"}</strong> &bull; Received: {new Date(activeMessage.createdAt).toLocaleString()}
                  </div>
                  {activeMessage.resolvedAt && (
                    <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.2rem" }}>
                      ✓ Resolved on {new Date(activeMessage.resolvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {activeMessage.isDeleted ? (
                    <button onClick={() => handleRestore(activeMessage._id || activeMessage.id, activeMessage.name)} className="btn btn-secondary" title="Restore message">
                      <FiRotateCcw /> Restore
                    </button>
                  ) : (
                    <button onClick={() => handleDelete(activeMessage._id || activeMessage.id, activeMessage.name)} className="btn btn-secondary" style={{ color: "#e53e3e" }} title="Delete message">
                      <FiTrash2 /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Message text block */}
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "6px", border: "1px solid #e2e8f0", flex: 1, overflowY: "auto", minHeight: "150px" }}>
                <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                  <FiMessageSquare style={{ color: "#a0aec0", fontSize: "1.25rem", marginTop: "2px" }} />
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#2d3748", lineHeight: 1.6 }}>{activeMessage.message}</p>
                </div>
              </div>

              {/* Action moderation box */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}><FiEdit3 style={{ display: "inline", marginRight: "0.25rem" }} /> Administrative Actions</h4>
                <div className="form-grid one" style={{ margin: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <label>
                      Status
                      <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="form-input">
                        <option value="read">Read</option>
                        <option value="unread">Unread</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="archived">Archived</option>
                        <option value="spam">Spam</option>
                      </select>
                    </label>
                    <label>
                      Priority
                      <select value={priorityDraft} onChange={(e) => setPriorityDraft(e.target.value)} className="form-input">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      &nbsp;
                      <button onClick={handleSaveNotes} className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Actions"}
                      </button>
                    </label>
                  </div>
                  <label style={{ marginTop: "0.5rem" }}>
                    Private Internal Notes
                    <textarea
                      rows="3"
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="form-input"
                      placeholder="Add admin follow-up notes..."
                    />
                  </label>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "3rem", color: "#a0aec0", textAlign: "center" }}>
              <FiMail style={{ fontSize: "3rem", marginBottom: "1rem" }} />
              <p>Select a message from the list to view details and update administrative status.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
