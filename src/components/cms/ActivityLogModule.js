import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function ActivityLogModule() {
  const { fetchLogs } = useCms();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Query State
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchLogs({
        page: currentPage,
        limit: 15,
        search,
        module: moduleFilter,
        status: statusFilter,
        startDate,
        endDate,
      });
      if (res && res.logs) {
        setLogs(res.logs);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, moduleFilter, statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLogs();
  };

  const handleExportJSON = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(logs, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `myjourney_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export JSON.");
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Timestamp", "User Email", "Action", "Module", "Description", "Status", "IP Address", "User Agent"];
      const rows = logs.map(l => [
        new Date(l.timestamp || l.createdAt).toISOString(),
        l.userEmail || (l.userId?.email) || "System",
        l.action,
        l.module || "N/A",
        `"${(l.description || "").replace(/"/g, '""')}"`,
        l.status || "success",
        l.ipAddress || "N/A",
        `"${(l.userAgent || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `myjourney_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV.");
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>System Activity & Audit Logs</h2>
          <p className="kicker">Track administrative operations, access records, and changes</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => loadLogs()} title="Refresh logs">
            <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <FiDownload /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJSON} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <FiDownload /> Export JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="cms-alert cms-alert-danger" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} className="close-btn" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="filters-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Search Description / Email</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Filter keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
              <FiSearch />
            </button>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Module</label>
          <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }} className="form-input">
            <option value="all">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="articles">Articles</option>
            <option value="categories">Categories</option>
            <option value="comments">Comments</option>
            <option value="media">Media Library</option>
            <option value="users">Users</option>
            <option value="roles">Roles</option>
            <option value="newsletter">Newsletter</option>
            <option value="backup">Backup</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Action Status</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-input">
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="form-input"
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="form-input"
          />
        </div>
      </form>

      {/* Main Table */}
      <div className="table-container">
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Description</th>
              <th>Status</th>
              <th>IP Address</th>
              <th>Browser</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto" }}></div>
                  <p>Loading system activity logs...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  No system logs found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id || log.id}>
                  <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp || log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {log.userId ? (
                      <div>
                        <strong>{log.userId.firstName} {log.userId.lastName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>{log.userId.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: "#999" }}>{log.userEmail || "System"}</span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ fontSize: "0.75rem", background: "#e8eaed", color: "#3c4043", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
                      {log.module || "N/A"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{log.description}</td>
                  <td>
                    <span className="badge" style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      background: log.status === "failure" ? "#fce8e6" : "#e6f4ea",
                      color: log.status === "failure" ? "#c5221f" : "#137333",
                      fontWeight: "bold"
                    }}>
                      {log.status || "success"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>{log.ipAddress || "N/A"}</td>
                  <td style={{ fontSize: "0.75rem", color: "#666", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.userAgent}>
                    {log.userAgent || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.pages > 1 && (
        <div className="pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total logs)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem" }}
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem" }}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
