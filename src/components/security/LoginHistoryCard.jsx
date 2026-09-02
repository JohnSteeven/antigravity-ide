import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import SecurityEmptyState from "./SecurityEmptyState";
import "./LoginHistoryCard.css";

const formatDate = (dateInput) => {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString();
};

// Severity → visual style map
const SEVERITY_STYLES = {
  success: { label: "✓",  color: "#059669", bg: "rgba(5,150,105,0.09)",   border: "rgba(5,150,105,0.18)"   },
  danger:  { label: "✗",  color: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.18)"   },
  warning: { label: "⚠",  color: "#d97706", bg: "rgba(217,119,6,0.09)",   border: "rgba(217,119,6,0.18)"   },
  info:    { label: "ℹ",  color: "#0284c7", bg: "rgba(2,132,199,0.09)",   border: "rgba(2,132,199,0.18)"   },
  purple:  { label: "★",  color: "#7c3aed", bg: "rgba(124,58,237,0.09)",  border: "rgba(124,58,237,0.18)"  },
  neutral: { label: "·",  color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.15)" },
};

const ActionBadge = ({ severity, label, action }) => {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.neutral;
  const display = label || action || "Event";
  return (
    <span
      className="sec-action-badge"
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
      title={action}
    >
      {display}
    </span>
  );
};

const LoginHistoryCard = ({ historyData, params, onUpdateParams }) => {
  const logs = historyData?.logs || [];
  const pagination = historyData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleUpdate = (newParams) => {
    const scrollY = window.scrollY;
    onUpdateParams(newParams);
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
  };

  return (
    <SecurityCard>
      <div style={{ marginBottom: "14px" }}>
        <h4 style={{ fontSize: "0.98rem", fontWeight: 700, margin: "0 0 2px", color: "#1e293b" }}>
          Login History &amp; Security Audit Logs
        </h4>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
          Review account sign-in history and security authentication events.
        </p>
      </div>

      {/* Toolbar */}
      <div className="sec-history-toolbar">
        <div style={{ position: "relative", flex: 1, maxWidth: "240px" }}>
          <input
            className="sec-history-search"
            placeholder="Search IP, action, browser..."
            style={{ width: "100%", paddingLeft: "28px" }}
            value={params.search || ""}
            onChange={(e) => handleUpdate({ search: e.target.value, page: 1 })}
          />
          <FiSearch style={{ position: "absolute", left: "9px", top: "9px", color: "#94a3b8" }} />
        </div>

        <div className="sec-history-filters">
          <select
            className="sec-history-select"
            value={params.range || "all"}
            onChange={(e) => handleUpdate({ range: e.target.value, page: 1 })}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <SecurityEmptyState description="No activity records match your search filter." title="No History Records" />
      ) : (
        <div className="sec-history-table-wrap">
          <table className="sec-history-table">
            <thead>
              <tr>
                <th>Event / Action</th>
                <th>Browser &amp; OS</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <ActionBadge
                      severity={log.severity}
                      label={log.label}
                      action={log.action}
                    />
                  </td>
                  <td>{log.browser} / {log.os}</td>
                  <td>{log.ipAddress}</td>
                  <td>{log.city}, {log.country}</td>
                  <td>
                    <span className={`sec-status-badge ${log.status === "FAILED" ? "failed" : "success"}`}>
                      {log.status || "SUCCESS"}
                    </span>
                  </td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="sec-history-pagination">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="secondary-btn"
              disabled={pagination.page <= 1}
              style={{ padding: "4px 8px", fontSize: "0.78rem" }}
              type="button"
              onClick={() => handleUpdate({ page: pagination.page - 1 })}
            >
              <FiChevronLeft /> Prev
            </button>
            <button
              className="secondary-btn"
              disabled={pagination.page >= pagination.totalPages}
              style={{ padding: "4px 8px", fontSize: "0.78rem" }}
              type="button"
              onClick={() => handleUpdate({ page: pagination.page + 1 })}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </SecurityCard>
  );
};

export default LoginHistoryCard;
