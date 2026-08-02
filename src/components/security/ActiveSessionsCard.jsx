import { useState } from "react";
import { FiLogOut, FiMonitor, FiSmartphone, FiTablet } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import ConfirmationModal from "./ConfirmationModal";
import SecurityEmptyState from "./SecurityEmptyState";
import "./ActiveSessionsCard.css";

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

const ActiveSessionsCard = ({ sessions = [], onRevokeSession, onRevokeAllOtherSessions }) => {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, targetId: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDeviceIcon = (device = "") => {
    const d = String(device).toLowerCase();
    if (d.includes("mobile") || d.includes("phone")) return FiSmartphone;
    if (d.includes("tablet") || d.includes("ipad")) return FiTablet;
    return FiMonitor;
  };

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      if (modalConfig.type === "single") {
        await onRevokeSession(modalConfig.targetId);
      } else if (modalConfig.type === "all") {
        await onRevokeAllOtherSessions();
      }
    } catch (err) {
      alert(err.message || "Failed to revoke session.");
    } finally {
      setIsSubmitting(false);
      setModalConfig({ isOpen: false, type: null, targetId: null });
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <SecurityCard>
      <div className="sec-sessions-header">
        <div>
          <h4 className="sec-sessions-title">Active Sessions</h4>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
            Manage active browser sessions across your devices.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <button
            className="secondary-btn"
            style={{ fontSize: "0.8rem", color: "#e11d48", borderColor: "#fecdd3" }}
            type="button"
            onClick={() =>
              setModalConfig({
                isOpen: true,
                type: "all",
                targetId: null,
              })
            }
          >
            <FiLogOut /> Sign Out All Other Devices
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <SecurityEmptyState description="No active sessions detected." title="No Active Sessions" />
      ) : (
        sessions.map((sess) => {
          const DeviceIcon = getDeviceIcon(sess.device);
          return (
            <div key={sess.id} className="sec-session-item">
              <div className="sec-session-info">
                <div className="sec-session-icon">
                  <DeviceIcon />
                </div>
                <div>
                  <h5 className="sec-session-device-name">
                    {sess.browser} on {sess.os}
                    {sess.isCurrent && <span className="sec-current-badge">Current Session</span>}
                  </h5>
                  <p className="sec-session-meta">
                    {sess.ipAddress} • {sess.city || "Unknown City"}, {sess.country || "Localhost"} • Last active:{" "}
                    {formatRelativeTime(sess.lastActiveAt)}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  className="secondary-btn"
                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                  type="button"
                  onClick={() =>
                    setModalConfig({
                      isOpen: true,
                      type: "single",
                      targetId: sess.id,
                    })
                  }
                >
                  Revoke
                </button>
              )}
            </div>
          );
        })
      )}

      <ConfirmationModal
        confirmText={modalConfig.type === "all" ? "Sign Out All" : "Revoke Session"}
        isDanger
        isOpen={modalConfig.isOpen}
        isSubmitting={isSubmitting}
        message={
          modalConfig.type === "all"
            ? "Are you sure you want to sign out all other devices? This will invalidate their refresh tokens."
            : "Are you sure you want to revoke this session?"
        }
        title={modalConfig.type === "all" ? "Sign Out All Other Devices" : "Revoke Session"}
        onClose={() => setModalConfig({ isOpen: false, type: null, targetId: null })}
        onConfirm={handleConfirmAction}
      />
    </SecurityCard>
  );
};

export default ActiveSessionsCard;
