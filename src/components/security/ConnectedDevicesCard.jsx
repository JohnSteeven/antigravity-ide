import { useState } from "react";
import { FiCheck, FiCpu, FiEdit2, FiMapPin, FiMonitor, FiSmartphone, FiTablet, FiTrash2 } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import ConfirmationModal from "./ConfirmationModal";
import SecurityEmptyState from "./SecurityEmptyState";
import "./ConnectedDevicesCard.css";

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Never";
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

const formatTrustedSince = (dateInput) => {
  if (!dateInput) return "Unknown";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const ConnectedDevicesCard = ({ devices = [], onRenameDevice, onRemoveDevice }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [modalConfig, setModalConfig] = useState({ isOpen: false, targetId: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDeviceIcon = (type = "") => {
    const t = String(type).toLowerCase();
    if (t.includes("mobile")) return FiSmartphone;
    if (t.includes("tablet")) return FiTablet;
    if (t.includes("laptop")) return FiCpu;
    return FiMonitor;
  };

  const handleSaveRename = async (id) => {
    if (!editingName.trim()) return;
    try {
      await onRenameDevice(id, editingName.trim());
      setEditingId(null);
    } catch (err) {
      alert(err.message || "Failed to rename device.");
    }
  };

  const handleConfirmRemove = async () => {
    const scrollY = window.scrollY;
    setIsSubmitting(true);
    try {
      await onRemoveDevice(modalConfig.targetId);
    } catch (err) {
      alert(err.message || "Failed to remove device.");
    } finally {
      setIsSubmitting(false);
      setModalConfig({ isOpen: false, targetId: null });
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
    }
  };

  return (
    <SecurityCard>
      <div style={{ marginBottom: "14px" }}>
        <h4 style={{ fontSize: "0.98rem", fontWeight: 700, margin: "0 0 2px", color: "#1e293b" }}>
          Connected &amp; Trusted Devices
        </h4>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
          View trusted hardware, browsers, and authorized access points.
        </p>
      </div>

      {devices.length === 0 ? (
        <SecurityEmptyState description="No trusted devices registered yet." title="No Devices Found" />
      ) : (
        devices.map((dev) => {
          const DeviceIcon = getDeviceIcon(dev.deviceType);
          const isEditing = editingId === dev.id;
          const lastSeen = dev.lastSeenRelative || formatRelativeTime(dev.lastSeenAt);

          return (
            <div key={dev.id} className="sec-device-item">
              {/* Icon */}
              <div className="sec-device-icon">
                <DeviceIcon />
              </div>

              {/* Info */}
              <div className="sec-device-body">
                {/* Name row */}
                {isEditing ? (
                  <div className="sec-device-edit-row">
                    <input
                      className="sec-device-edit-input"
                      value={editingName}
                      autoFocus
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveRename(dev.id)}
                    />
                    <button
                      className="primary-btn"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                      type="button"
                      onClick={() => handleSaveRename(dev.id)}
                    >
                      <FiCheck /> Save
                    </button>
                    <button
                      className="secondary-btn"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="sec-device-name-row">
                    <span className="sec-device-name">{dev.deviceName}</span>
                    {dev.isCurrentDevice && (
                      <span className="sec-device-badge current">Current Device</span>
                    )}
                    {!dev.isCurrentDevice && (
                      <span className="sec-device-badge trusted">Trusted</span>
                    )}
                    <button
                      className="sec-device-rename-btn"
                      type="button"
                      title="Rename device"
                      onClick={() => { setEditingId(dev.id); setEditingName(dev.deviceName); }}
                    >
                      <FiEdit2 />
                    </button>
                  </div>
                )}

                {/* Browser & OS */}
                <p className="sec-device-spec">
                  {dev.browser || "Unknown Browser"} &nbsp;·&nbsp; {dev.os || "Unknown OS"}
                </p>

                {/* Location & last seen */}
                <div className="sec-device-meta-row">
                  {(dev.city || dev.country) && (
                    <span className="sec-device-location">
                      <FiMapPin style={{ fontSize: "0.72rem" }} />
                      {[dev.city, dev.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="sec-device-lastseen">Last active: {lastSeen}</span>
                  <span className="sec-device-trusted-since">Trusted since: {formatTrustedSince(dev.trustedSince)}</span>
                </div>
              </div>

              {/* Actions */}
              {!dev.isCurrentDevice && (
                <button
                  className="secondary-btn"
                  style={{ fontSize: "0.78rem", padding: "4px 8px", color: "#e11d48", flexShrink: 0 }}
                  type="button"
                  onClick={() => setModalConfig({ isOpen: true, targetId: dev.id })}
                >
                  <FiTrash2 /> Remove
                </button>
              )}
            </div>
          );
        })
      )}

      <ConfirmationModal
        confirmText="Remove Device"
        isDanger
        isOpen={modalConfig.isOpen}
        isSubmitting={isSubmitting}
        message="Remove this device from your trusted list? You'll need to re-authenticate next time."
        title="Remove Trusted Device"
        onClose={() => setModalConfig({ isOpen: false, targetId: null })}
        onConfirm={handleConfirmRemove}
      />
    </SecurityCard>
  );
};

export default ConnectedDevicesCard;
