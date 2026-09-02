import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiKey, FiLock, FiShield } from "react-icons/fi";
import { useChangePassword } from "../../hooks/useChangePassword";
import PasswordInput from "./PasswordInput";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import PasswordRequirements from "./PasswordRequirements";
import SecurityNotice from "./SecurityNotice";
import ChangePasswordModal from "./ChangePasswordModal";
import SuccessOverlay from "./SuccessOverlay";
import "./ChangePasswordCard.css";

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffMonths / 12)} years ago`;
};

const ChangePasswordCard = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    form,
    updateField,
    status,
    errorMessage,
    showConfirmModal,
    setShowConfirmModal,
    hasUnsavedChanges,
    resetForm,
    requestConfirmation,
    executeChangePassword,
  } = useChangePassword();

  const handleToggleExpand = () => {
    if (isExpanded && hasUnsavedChanges && status !== "success") {
      if (!window.confirm("Discard unsaved password changes?")) return;
      resetForm();
    }
    setIsExpanded((prev) => !prev);
  };

  const lastUpdatedText = formatRelativeTime(user?.lastPasswordChange);

  if (status === "success") {
    return (
      <div className="sec-card-box" style={{ padding: 0 }}>
        <SuccessOverlay />
      </div>
    );
  }

  return (
    <div className="sec-card-box">
      <button className="sec-card-header-row" type="button" onClick={handleToggleExpand}>
        <div className="sec-card-title-group">
          <div className="sec-card-icon-badge">
            <FiLock />
          </div>
          <div>
            <h4 className="sec-card-title-text">Password & Security</h4>
            <p className="sec-card-subtitle-text">
              Last updated: {lastUpdatedText} • All devices will be signed out after changing password.
            </p>
          </div>
        </div>

        <span className="sec-card-toggle-btn">
          {isExpanded ? <><FiChevronUp /> Hide Form</> : <><FiKey /> Change Password</>}
        </span>
      </button>

      <div className={`sec-card-collapsible-body ${isExpanded ? "is-expanded" : ""}`}>
        <form onSubmit={requestConfirmation} style={{ paddingTop: "16px" }}>
          {/* Current Password */}
          <PasswordInput
            autoComplete="current-password"
            disabled={status === "submitting"}
            id="current-password"
            label="Current Password"
            placeholder="Enter your current password"
            required
            value={form.currentPassword}
            onChange={(e) => updateField("currentPassword", e.target.value)}
          />

          {/* New Password */}
          <PasswordInput
            autoComplete="new-password"
            disabled={status === "submitting"}
            id="new-password"
            label="New Password"
            placeholder="Choose a strong new password"
            required
            value={form.newPassword}
            onChange={(e) => updateField("newPassword", e.target.value)}
          />

          {/* Strength Meter & Requirements Checklist */}
          {form.newPassword && (
            <>
              <PasswordStrengthMeter password={form.newPassword} />
              <PasswordRequirements password={form.newPassword} />
            </>
          )}

          {/* Confirm Password */}
          <PasswordInput
            autoComplete="new-password"
            disabled={status === "submitting"}
            error={form.confirmPassword && form.newPassword !== form.confirmPassword ? "Passwords do not match." : ""}
            id="confirm-password"
            label="Confirm New Password"
            placeholder="Re-enter your new password"
            required
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
          />

          {/* Security Notice */}
          <SecurityNotice />

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="auth-alert error" style={{ marginBottom: "16px" }}>
              {errorMessage}
            </div>
          )}

          {/* Submit Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              className="secondary-btn"
              disabled={status === "submitting"}
              type="button"
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm("Discard unsaved password changes?")) return;
                resetForm();
                setIsExpanded(false);
              }}
            >
              Cancel
            </button>
            <button
              className="primary-btn"
              disabled={status === "submitting" || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
              type="submit"
            >
              {status === "submitting" ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <ChangePasswordModal
          isOpen={showConfirmModal}
          isSubmitting={status === "submitting"}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={executeChangePassword}
        />
      </div>
    </div>
  );
};

export default ChangePasswordCard;
