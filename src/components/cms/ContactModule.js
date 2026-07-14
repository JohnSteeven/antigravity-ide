import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiRotateCcw, FiMail, FiMessageSquare, FiArchive, FiAlertOctagon, FiUser, FiEdit3 } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function ContactModule() {
  const { fetchContactMessages, updateContactMessage, deleteContactMessage, restoreContactMessage } = useCms();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Detail Modal / Sidebar
  const [activeMessage, setActiveMessage] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("read");

  const loadMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchContactMessages({
        page,
        limit: 10,
        search,
        status: status === "all" ? undefined : status,
        includeDeleted: showDeleted,
      });
      if (res && res.messages) {
        setMessages(res.messages);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [page, status, showDeleted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadMessages();
  };

  const openDetail = (msg) => {
    setActiveMessage(msg);
    setNotesDraft(msg.notes || "");
    setStatusDraft(msg.status || "read");

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
      const updated = await updateContactMessage(id, { notes: notesDraft, status: statusDraft });
      setMessages((prev) => prev.map((m) => (m._id === id || m.id === id ? updated : m)));
      setActiveMessage(updated);
      setSuccess("Internal notes saved.");
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

  return (
    <div className="cms-panel">
      <div className="cms-panel-header">
        <div>
          <h2 style={{ margin: 0 }}>Contact Form Submissions</h2>
          <p className="kicker">Read and moderate messages submitted by readers or partners</p>
        </div>
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      {/* Grid: message inbox and message details */}
      <div className="cms-grid-two" style={{ marginTop: "1.5rem" }}>
        
        {/* Inbox Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Filter Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search sender / message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input" style={{ width: "130px" }}>
              <option value="all">All status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
              <option value="spam">Spam</option>
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
              <p className="empty-state">No messages in inbox.</p>
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
                    <span className={`badge ${
                      item.status === "unread" ? "badge-danger" :
                      item.status === "read" ? "badge-success" :
                      item.status === "archived" ? "badge-secondary" : "badge-warning"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#4a5568", marginTop: "0.2rem" }}>
                    {item.email}
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
                  <div style={{ fontSize: "0.8rem", color: "#718096" }}>
                    Received: {new Date(activeMessage.createdAt).toLocaleString()}
                  </div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label>
                      Status Label
                      <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="form-input">
                        <option value="read">Read</option>
                        <option value="unread">Unread</option>
                        <option value="archived">Archived</option>
                        <option value="spam">Spam</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      &nbsp;
                      <button onClick={handleSaveNotes} className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Status & Notes"}
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
              <p>Select a message from the list to view details and add notes.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
