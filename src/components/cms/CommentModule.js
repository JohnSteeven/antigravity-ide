import React, { useState, useMemo, useEffect } from "react";
import {
  FiCheck,
  FiX,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiEdit2,
  FiAlertCircle,
  FiMapPin,
  FiSave,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function CommentModule() {
  const { data, moderateComment, deleteComment, restoreComment, refreshComments } = useCms();
  const { comments = [] } = data;

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Re-fetch comments on mount
  useEffect(() => {
    if (typeof refreshComments === "function") {
      refreshComments();
    }
  }, []);

  // Filter & search comments
  const filteredComments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return comments.filter((c) => {
      // Search body or authorName
      const matchesSearch =
        !q ||
        (c.body || "").toLowerCase().includes(q) ||
        (c.authorName || "").toLowerCase().includes(q);

      // Status filter
      const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;

      // Deleted state
      const matchesDeleted = showDeleted ? c.isDeleted === true : !c.isDeleted;

      return matchesSearch && matchesStatus && matchesDeleted;
    });
  }, [comments, searchQuery, selectedStatus, showDeleted]);

  // Paginated comments
  const paginatedComments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComments.slice(start, start + itemsPerPage);
  }, [filteredComments, currentPage]);

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, showDeleted]);

  // Status moderation actions
  const handleModerate = async (commentId, status) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await moderateComment(commentId, status);
      setSuccess(`Comment marked as ${status}.`);
    } catch (err) {
      setError(err.message || "Failed to update comment status.");
    } finally {
      setLoading(false);
    }
  };

  // Pin / Unpin comment
  const handleTogglePin = async (c) => {
    setLoading(true);
    setError("");
    setSuccess("");
    const newPinState = !c.isPinned;
    try {
      await moderateComment(c._id || c.id, c.status, { isPinned: newPinState });
      setSuccess(newPinState ? "Comment pinned to top." : "Comment unpinned.");
    } catch (err) {
      setError(err.message || "Failed to update pinning state.");
    } finally {
      setLoading(false);
    }
  };

  // Inline Edit Save
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      setError("Comment text cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const comment = comments.find((c) => (c._id || c.id) === commentId);
      await moderateComment(commentId, comment.status, { body: editText.trim() });
      setSuccess("Comment updated successfully.");
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to edit comment.");
    } finally {
      setLoading(false);
    }
  };

  // Soft delete
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to soft-delete this comment?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteComment(commentId);
      setSuccess("Comment soft-deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete comment.");
    } finally {
      setLoading(false);
    }
  };

  // Restore
  const handleRestore = async (commentId) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await restoreComment(commentId);
      setSuccess("Comment restored successfully.");
    } catch (err) {
      setError(err.message || "Failed to restore comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="section-kicker">Moderation Dashboard</span>
          <h2>Comments Control</h2>
        </div>
      </div>

      {error && <div className="alert-message error"><FiAlertCircle /> {error}</div>}
      {success && <div className="alert-message success"><FiCheck /> {success}</div>}

      {/* Filter toolbar */}
      <div className="toolbar-search-filter" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-input-wrapper" style={{ flexGrow: 1, position: "relative" }}>
          <FiSearch className="search-icon" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search comment contents or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: "35px", width: "100%" }}
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="form-select"
          style={{ width: "150px" }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="spam">Spam</option>
          <option value="hidden">Hidden</option>
        </select>

        <label className="checkbox-label" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Show Deleted
        </label>
      </div>

      {/* Comments List */}
      {paginatedComments.length === 0 ? (
        <p className="empty-state">No comments match your search/filter criteria.</p>
      ) : (
        <div className="comment-moderation-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {paginatedComments.map((c) => {
            const commentId = c._id || c.id;
            const isEditing = editingId === commentId;
            const articleTitle = c.articleId?.title || c.articleTitle || "Unknown Article";

            return (
              <article
                key={commentId}
                className="comment-card"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1rem",
                  backgroundColor: c.isPinned ? "#fdfbf7" : "transparent",
                  borderLeft: c.isPinned ? "4px solid #d4af37" : "1px solid #ddd"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <strong>{c.authorName || "Reader"}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "0.5rem" }}>
                      on <em>{articleTitle}</em>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`status-pill ${c.status}`} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {c.status.toUpperCase()}
                    </span>
                    {!c.isDeleted && (
                      <button
                        onClick={() => handleTogglePin(c)}
                        className="small-icon-btn"
                        title={c.isPinned ? "Unpin Comment" : "Pin Comment"}
                        style={{ color: c.isPinned ? "#d4af37" : "#aaa" }}
                      >
                        <FiMapPin />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="form-input"
                      rows={3}
                      style={{ width: "100%", padding: "0.5rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleSaveEdit(commentId)}
                        className="small-outline-btn"
                        style={{ color: "green" }}
                      >
                        <FiSave /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="small-outline-btn"
                      >
                        <FiX /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: "0.5rem 0", fontSize: "0.95rem", lineHeight: "1.4" }}>
                    {c.body || c.text}
                  </p>
                )}

                <div className="inline-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  {!c.isDeleted ? (
                    <>
                      {c.status !== "approved" && (
                        <button
                          onClick={() => handleModerate(commentId, "approved")}
                          className="small-outline-btn"
                        >
                          Approve
                        </button>
                      )}
                      {c.status !== "rejected" && (
                        <button
                          onClick={() => handleModerate(commentId, "rejected")}
                          className="small-outline-btn"
                        >
                          Reject
                        </button>
                      )}
                      {c.status !== "spam" && (
                        <button
                          onClick={() => handleModerate(commentId, "spam")}
                          className="small-outline-btn"
                        >
                          Spam
                        </button>
                      )}
                      {c.status !== "hidden" && (
                        <button
                          onClick={() => handleModerate(commentId, "hidden")}
                          className="small-outline-btn"
                        >
                          Hide
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(commentId);
                          setEditText(c.body || c.text || "");
                        }}
                        className="small-outline-btn"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(commentId)}
                        className="small-outline-btn"
                        style={{ color: "red" }}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestore(commentId)}
                      className="small-outline-btn"
                      style={{ color: "green" }}
                    >
                      <FiRotateCcw /> Restore
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination-wrapper" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
            disabled={currentPage === 1}
            className="small-outline-btn"
          >
            Prev
          </button>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
            disabled={currentPage === totalPages}
            className="small-outline-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
