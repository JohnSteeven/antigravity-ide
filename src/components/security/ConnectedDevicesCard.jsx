import { useState } from "react";
import { FiCheck, FiCpu, FiEdit2, FiMonitor, FiSmartphone, FiTablet, FiTrash2 } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import ConfirmationModal from "./ConfirmationModal";
import SecurityEmptyState from "./SecurityEmptyState";
import "./ConnectedDevicesCard.css";

const formatDate = (dateInput) => {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString();
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

  const handleStartRename = (dev) => {
    setEditingId(dev.id);
    setEditingName(dev.deviceName);
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
    setIsSubmitting(true);
    try {
      await onRemoveDevice(modalConfig.targetId);
    } catch (err) {
      alert(err.message || "Failed to remove device.");
    } finally {
      setIsSubmitting(false);
      setModalConfig({ isOpen: false, targetId: null });
    }
  };

  return (
    <SecurityCard>
      <div style={{ marginBottom: "14px" }}>
        <h4 style={{ fontSize: "0.98rem", fontWeight: 700, margin: "0 0 2px", color: "#1e293b" }}>
          Connected & Trusted Devices
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

          return (
            <div key={dev.id} className="sec-device-item">
              <div className="sec-device-info">
                <div className="sec-device-icon">
                  <DeviceIcon />
                </div>
                <div>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                      <input
                        style={{
                          padding: "2px 6px",
                          fontSize: "0.86rem",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                        }}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button
                        className="primary-btn"
                        style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                        type="button"
                        onClick={() => handleSaveRename(dev.id)}
                      >
                        <FiCheck />
                      </button>
                    </div>
                  ) : (
                    <h5
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        margin: "0 0 2px",
                        color: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {dev.deviceName}
                      {dev.isCurrentDevice && (
                        <span className="sec-current-badge">Current Device</span>
                      )}
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                        type="button"
                        onClick={() => handleStartRename(dev)}
                      >
                        <FiEdit2 style={{ fontSize: "0.78rem" }} />
                      </button>
                    </h5>
                  )}

                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                    {dev.browser} on {dev.os} • Trusted since: {formatDate(dev.trustedSince)}
                  </p>
                </div>
              </div>

              {!dev.isCurrentDevice && (
                <button
                  className="secondary-btn"
                  style={{ fontSize: "0.78rem", padding: "4px 8px", color: "#e11d48" }}
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
        message="Are you sure you want to remove this trusted device?"
        title="Remove Trusted Device"
        onClose={() => setModalConfig({ isOpen: false, targetId: null })}
        onConfirm={handleConfirmRemove}
      />
    </SecurityCard>
  );
};

export default ConnectedDevicesCard;
