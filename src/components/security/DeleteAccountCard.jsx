import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronRight,
  FiLock,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import "./DeleteAccountCard.css";

const STEPS = ["Consequences", "Password", "Confirm", "Done"];

const CONSEQUENCES = [
  { icon: "👤", text: "Your profile and account data will be permanently removed" },
  { icon: "📝", text: "Your articles will remain but be anonymized" },
  { icon: "💬", text: "Your comments will be removed" },
  { icon: "🔖", text: "Your bookmarks, likes, and saved articles will be lost" },
  { icon: "🔐", text: "All active sessions will be immediately revoked" },
  { icon: "📧", text: "Your email will be removed from all mailing lists" },
  { icon: "⏳", text: "You have 7 days to cancel before permanent deletion" },
];

const DeleteAccountCard = ({ onDeleteAccount }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  const openModal = () => {
    setStep(1);
    setPassword("");
    setConfirmation("");
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleStep2 = () => { setError(""); setStep(2); };

  const handleStep3 = async () => {
    if (!password.trim()) { setError("Please enter your password."); return; }
    setSubmitting(true); setError("");
    try {
      // Validate password against backend (or just advance for now)
      // In a real implementation: await onValidatePassword(password);
      setStep(3);
    } catch (e) {
      setError(e.message || "Incorrect password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (confirmation !== CONFIRM_PHRASE) {
      setError(`Please type "${CONFIRM_PHRASE}" exactly.`);
      return;
    }
    setSubmitting(true); setError("");
    try {
      await onDeleteAccount(password, confirmation);
      setStep(4);
    } catch (e) {
      setError(e.message || "Failed to request account deletion. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Danger Zone Card ─────────────────────────────── */}
      <SecurityCard className="sec-danger-card">
        <div className="del-card-row">
          <div className="del-card-left">
            <FiTrash2 className="del-card-icon" />
            <div>
              <h4 className="del-card-title">Delete Account</h4>
              <p className="del-card-desc">
                Permanently delete your MyJourney account. This action starts a 7-day recovery window.
              </p>
            </div>
          </div>
          <button
            className="danger-btn"
            style={{ fontSize: "0.84rem", flexShrink: 0 }}
            type="button"
            onClick={openModal}
          >
            <FiTrash2 /> Delete Account
          </button>
        </div>
      </SecurityCard>

      {/* ── Modal (portal) ───────────────────────────────── */}
      {modalOpen && createPortal(
        <div className="del-modal-backdrop" onClick={closeModal}>
          <div className="del-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="del-modal-header">
              <div className="del-modal-header-left">
                <div className={`del-modal-step-icon ${step === 4 ? "success" : "danger"}`}>
                  {step === 4 ? <FiCheck /> : <FiAlertTriangle />}
                </div>
                <div>
                  <h3 className="del-modal-title">
                    {step === 1 && "Delete Account"}
                    {step === 2 && "Verify Identity"}
                    {step === 3 && "Final Confirmation"}
                    {step === 4 && "Deletion Scheduled"}
                  </h3>
                  <p className="del-modal-step-label">Step {step} of 3{step === 4 ? " — Complete" : ""}</p>
                </div>
              </div>
              {step !== 4 && (
                <button className="del-modal-close" type="button" onClick={closeModal}>
                  <FiX />
                </button>
              )}
            </div>

            {/* Error */}
            {error && <div className="del-modal-error">{error}</div>}

            {/* ── Step 1: Consequences ── */}
            {step === 1 && (
              <div className="del-modal-body">
                <p className="del-step-intro">
                  Before you proceed, please understand what will happen when you delete your account:
                </p>
                <ul className="del-consequences-list">
                  {CONSEQUENCES.map((c, i) => (
                    <li key={i} className="del-consequence-item">
                      <span>{c.icon}</span>
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="del-recovery-notice">
                  <strong>⏳ 7-Day Recovery Window</strong>
                  <p>Your account won't be permanently deleted immediately. You have 7 days to log in and cancel the deletion.</p>
                </div>
                <div className="del-modal-actions">
                  <button className="secondary-btn" type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="danger-btn" type="button" onClick={handleStep2}>
                    I Understand — Continue <FiChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Password ── */}
            {step === 2 && (
              <div className="del-modal-body">
                <div className="del-step-icon-wrap">
                  <FiLock style={{ fontSize: "2rem", color: "#dc2626" }} />
                </div>
                <p className="del-step-intro">
                  Enter your current password to confirm your identity.
                </p>
                <input
                  className="del-modal-input"
                  placeholder="Current password"
                  type="password"
                  value={password}
                  autoFocus
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep3()}
                />
                <div className="del-modal-actions">
                  <button className="secondary-btn" type="button" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button className="danger-btn" disabled={submitting} type="button" onClick={handleStep3}>
                    {submitting ? "Verifying..." : "Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Type confirmation ── */}
            {step === 3 && (
              <div className="del-modal-body">
                <p className="del-step-intro">
                  To confirm, type exactly:
                </p>
                <code className="del-confirm-phrase">{CONFIRM_PHRASE}</code>
                <input
                  className="del-modal-input del-confirm-input"
                  placeholder={CONFIRM_PHRASE}
                  type="text"
                  value={confirmation}
                  autoFocus
                  onChange={(e) => setConfirmation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                {confirmation.length > 0 && confirmation !== CONFIRM_PHRASE && (
                  <p className="del-confirm-hint">Keep typing — it needs to match exactly</p>
                )}
                <div className="del-modal-actions">
                  <button className="secondary-btn" type="button" onClick={() => setStep(2)}>
                    ← Back
                  </button>
                  <button
                    className="danger-btn"
                    disabled={submitting || confirmation !== CONFIRM_PHRASE}
                    type="button"
                    onClick={handleSubmit}
                    style={{ opacity: confirmation !== CONFIRM_PHRASE ? 0.5 : 1 }}
                  >
                    {submitting ? "Processing..." : "Delete My Account"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Done ── */}
            {step === 4 && (
              <div className="del-modal-body del-done-body">
                <div className="del-done-icon">
                  <FiCheck />
                </div>
                <h4 className="del-done-title">Account Deletion Scheduled</h4>
                <p className="del-done-desc">
                  Your account has been scheduled for deletion. You have <strong>7 days</strong> to change your mind — simply log back in and cancel the deletion from your Security Center.
                </p>
                <div className="del-done-timeline">
                  <div className="del-timeline-item active">
                    <span className="del-timeline-dot" />
                    <span>Deletion requested — sessions revoked</span>
                  </div>
                  <div className="del-timeline-item">
                    <span className="del-timeline-dot pending" />
                    <span>7-day recovery window (can cancel)</span>
                  </div>
                  <div className="del-timeline-item">
                    <span className="del-timeline-dot pending" />
                    <span>Permanent deletion after 7 days</span>
                  </div>
                </div>
                <button className="secondary-btn" style={{ marginTop: "8px" }} type="button" onClick={closeModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DeleteAccountCard;
