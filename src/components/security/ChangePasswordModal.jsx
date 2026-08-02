import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const ChangePasswordModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            margin: "0 auto 14px",
            borderRadius: "50%",
            background: "#fef3c7",
            color: "#d97706",
            display: "grid",
            placeItems: "center",
            fontSize: "1.5rem",
          }}
        >
          <FiAlertTriangle />
        </div>

        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
          Confirm Password Change
        </h3>

        <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: 1.5, margin: "0 0 20px" }}>
          You're about to update your password. This will log you out everywhere, revoke active sessions, and require you to sign in again.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            className="secondary-btn"
            disabled={isSubmitting}
            onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: "6px", fontSize: "0.88rem" }}
            type="button"
          >
            Cancel
          </button>
          <button
            className="primary-btn"
            disabled={isSubmitting}
            onClick={onConfirm}
            style={{ padding: "8px 20px", borderRadius: "6px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
            type="button"
          >
            {isSubmitting ? "Updating..." : "Update Password"} <FiCheckCircle />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
