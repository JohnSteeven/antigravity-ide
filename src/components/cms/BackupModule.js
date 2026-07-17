import React, { useState, useEffect } from "react";
import { FiDatabase, FiPlus, FiDownload, FiRefreshCw, FiTrash2, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { useSiteCms } from "../../context/SiteCmsContext";

export default function BackupModule() {
  const { backups, fetchBackups, triggerBackup, restoreBackup, deleteBackup } = useSiteCms();

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBackups = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchBackups();
    } catch (err) {
      setError(err.message || "Failed to load backups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreate = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const backup = await triggerBackup();
      setSuccess(`Backup "${backup.fileName}" created successfully.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to trigger backup.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id, fileName) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to restore database snapshot from "${fileName}"? This will overwrite ALL current database collections.`)) {
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await restoreBackup(id);
      setSuccess("Database successfully restored to the chosen backup snapshot.");
      await fetchBackups();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Database restore failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete backup record and file for "${fileName}"?`)) {
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteBackup(id);
      setSuccess("Backup record deleted.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete backup.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCounts = (counts = {}) => {
    return Object.entries(counts)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Database Backup & Restoration</h2>
          <p className="kicker">Create snapshot archives of database collections, download backups, or restore previous system states</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={actionLoading}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          <FiPlus /> {actionLoading ? "Triggering..." : "Create Full Backup"}
        </button>
      </div>

      {success && (
        <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiCheckCircle /> <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiAlertTriangle /> <span>{error}</span>
        </div>
      )}

      {/* Warning Notice */}
      <div style={{ background: "#fffaf0", border: "1px solid #feebc8", padding: "1rem", borderRadius: "8px", marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "start" }}>
        <FiAlertTriangle style={{ color: "#dd6b20", fontSize: "1.25rem", marginTop: "2px", flexShrink: 0 }} />
        <div style={{ fontSize: "0.88rem", color: "#744210", lineHeight: 1.5 }}>
          <strong>Attention Administrators:</strong> Restoring a backup completely replaces the active database collections with the snapshot records. This operation is instant and cannot be undone. Always download a local copy of your current state before triggering a restore.
        </div>
      </div>

      {/* Backups Table */}
      <div className="table-container" style={{ marginTop: "1.5rem" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Created Timestamp</th>
              <th>Backup File Name</th>
              <th>File Size</th>
              <th>Record Counts</th>
              <th>Created By</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto" }}></div>
                  <p>Loading database backups...</p>
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  No database backup logs found.
                </td>
              </tr>
            ) : (
              backups.map((item) => (
                <tr key={item._id || item.id}>
                  <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {item.fileName}
                  </td>
                  <td>{item.size || "Unknown"}</td>
                  <td style={{ fontSize: "0.8rem", color: "#666", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }} title={formatCounts(item.recordCounts)}>
                    {formatCounts(item.recordCounts)}
                  </td>
                  <td>
                    {item.createdBy ? (
                      <span style={{ fontSize: "0.85rem" }}>
                        {item.createdBy.firstName || item.createdBy.username}
                      </span>
                    ) : (
                      <span style={{ color: "#999" }}>System</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <a
                        href={backupApi.downloadUrl(item._id || item.id)}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                        title="Download Backup File"
                      >
                        <FiDownload /> Get File
                      </a>
                      <button
                        onClick={() => handleRestore(item._id || item.id, item.fileName)}
                        disabled={actionLoading}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", color: "#dd6b20", display: "flex", alignItems: "center", gap: "0.25rem" }}
                        title="Restore Snapshot"
                      >
                        <FiRefreshCw /> Restore
                      </button>
                      <button
                        onClick={() => handleDelete(item._id || item.id, item.fileName)}
                        disabled={actionLoading}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", color: "#e53e3e" }}
                        title="Delete record & file"
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
    </div>
  );
}
