import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCheck,
  FiCopy,
  FiDownload,
  FiKey,
  FiLock,
  FiShield,
  FiSmartphone,
  FiX,
} from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import "./TwoFactorCard.css";

/* ── Step indicators ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Verify Password" },
  { id: 2, label: "Scan QR Code" },
  { id: 3, label: "Confirm Code" },
  { id: 4, label: "Save Recovery Codes" },
];

const StepBar = ({ current }) => (
  <div className="tfa-step-bar">
    {STEPS.map((s, i) => (
      <div key={s.id} className="tfa-step-wrap">
        <div className={`tfa-step-circle ${current >= s.id ? "done" : ""} ${current === s.id ? "active" : ""}`}>
          {current > s.id ? <FiCheck /> : s.id}
        </div>
        <span className={`tfa-step-label ${current === s.id ? "active" : ""}`}>{s.label}</span>
        {i < STEPS.length - 1 && <div className={`tfa-step-line ${current > s.id ? "done" : ""}`} />}
      </div>
    ))}
  </div>
);

/* ── Main component ──────────────────────────────────────── */
const TwoFactorCard = ({ user, on2FASetup, on2FAVerify, on2FADisable }) => {
  const [isEnabled, setIsEnabled] = useState(Boolean(user?.twoFactor?.enabled));
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — password
  const [password, setPassword] = useState("");

  // Step 2 — QR data from backend
  const [qrData, setQrData] = useState(null); // { qrUrl, secret }

  // Step 3 — OTP code
  const [otpCode, setOtpCode] = useState("");

  // Step 4 — backup codes
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);

  const resetWizard = () => {
    setStep(1);
    setPassword("");
    setQrData(null);
    setOtpCode("");
    setBackupCodes([]);
    setError("");
    setCopied(false);
  };

  const openWizard = () => { resetWizard(); setWizardOpen(true); };
  const closeWizard = () => { setWizardOpen(false); resetWizard(); };

  /* Step 1 → 2: verify password and get QR */
  const handleStep1 = async () => {
    if (!password) { setError("Please enter your password."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await on2FASetup(password);
      setQrData(res); // { qrUrl (data URI), secret, otpauthUrl }
      setStep(2);
    } catch (e) {
      setError(e.message || "Password incorrect.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Step 2 → 3 */
  const handleStep2 = () => { setError(""); setStep(3); };

  /* Step 3 → 4: verify OTP and activate */
  const handleStep3 = async () => {
    if (otpCode.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await on2FAVerify(otpCode);
      setBackupCodes(res.backupCodes || generateFallbackCodes());
      setStep(4);
    } catch (e) {
      setError(e.message || "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Step 4 → done */
  const handleFinish = () => {
    setIsEnabled(true);
    closeWizard();
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "myjourney-backup-codes.txt";
    a.click();
  };

  const handleDisable = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication?")) return;
    try {
      await on2FADisable();
      setIsEnabled(false);
    } catch (e) {
      alert(e.message || "Failed to disable 2FA.");
    }
  };

  return (
    <>
      <SecurityCard>
        <div className="tfa-card-header">
          <div className="tfa-card-icon">
            <FiSmartphone />
          </div>
          <div className="tfa-card-body">
            <div className="tfa-card-top">
              <div>
                <h4 className="tfa-card-title">Two-Factor Authentication (2FA)</h4>
                <p className="tfa-card-desc">
                  {isEnabled
                    ? "2FA is active. Your account is protected with an authenticator app."
                    : "Add an authenticator app (Google Authenticator, Authy, 1Password) for extra security."}
                </p>
              </div>
              {isEnabled ? (
                <span className="tfa-status-badge enabled">Enabled</span>
              ) : (
                <span className="tfa-status-badge disabled">Not Enabled</span>
              )}
            </div>

            <div className="tfa-card-actions">
              {isEnabled ? (
                <>
                  <span className="tfa-enabled-note">
                    <FiShield /> Protected since: {user?.twoFactor?.verifiedAt
                      ? new Date(user.twoFactor.verifiedAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  <button className="secondary-btn" style={{ fontSize: "0.8rem", color: "#dc2626" }} type="button" onClick={handleDisable}>
                    Disable 2FA
                  </button>
                </>
              ) : (
                <button className="primary-btn" style={{ fontSize: "0.84rem" }} type="button" onClick={openWizard}>
                  Enable 2FA
                </button>
              )}
            </div>
          </div>
        </div>
      </SecurityCard>

      {/* ── Wizard Modal (portal) ─────────────────────────────── */}
      {wizardOpen && createPortal(
        <div className="tfa-wizard-backdrop" onClick={closeWizard}>
          <div className="tfa-wizard-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="tfa-wizard-header">
              <div className="tfa-wizard-title-wrap">
                <FiKey className="tfa-wizard-icon" />
                <h3 className="tfa-wizard-title">Set Up Two-Factor Authentication</h3>
              </div>
              <button className="tfa-wizard-close" type="button" onClick={closeWizard}>
                <FiX />
              </button>
            </div>

            {/* Step bar */}
            <StepBar current={step} />

            {/* Error */}
            {error && <div className="tfa-wizard-error">{error}</div>}

            {/* ── Step 1: Password ── */}
            {step === 1 && (
              <div className="tfa-wizard-body">
                <div className="tfa-wizard-step-icon"><FiLock /></div>
                <h4 className="tfa-wizard-step-title">Verify Your Identity</h4>
                <p className="tfa-wizard-step-desc">
                  Enter your current password to begin setting up Two-Factor Authentication.
                </p>
                <input
                  className="tfa-wizard-input"
                  placeholder="Current password"
                  type="password"
                  value={password}
                  autoFocus
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                />
                <button className="primary-btn tfa-wizard-btn" disabled={submitting} type="button" onClick={handleStep1}>
                  {submitting ? "Verifying..." : "Continue →"}
                </button>
              </div>
            )}

            {/* ── Step 2: QR Code ── */}
            {step === 2 && (
              <div className="tfa-wizard-body">
                <h4 className="tfa-wizard-step-title">Scan QR Code</h4>
                <p className="tfa-wizard-step-desc">
                  Open your authenticator app and scan this QR code. If you can't scan, enter the key manually.
                </p>

                <div className="tfa-qr-box">
                  {qrData?.qrUrl ? (
                    <img src={qrData.qrUrl} alt="2FA QR Code" className="tfa-qr-image" />
                  ) : (
                    <div className="tfa-qr-placeholder">
                      <FiSmartphone style={{ fontSize: "3rem", color: "#94a3b8" }} />
                      <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "8px" }}>QR code will appear here</p>
                    </div>
                  )}
                </div>

                {qrData?.secret && (
                  <div className="tfa-secret-box">
                    <span className="tfa-secret-label">Manual entry key:</span>
                    <code className="tfa-secret-code">{qrData.secret}</code>
                  </div>
                )}

                <div className="tfa-app-hints">
                  <span className="tfa-app-hint">Google Authenticator</span>
                  <span className="tfa-app-hint">Authy</span>
                  <span className="tfa-app-hint">1Password</span>
                  <span className="tfa-app-hint">Microsoft Authenticator</span>
                </div>

                <button className="primary-btn tfa-wizard-btn" type="button" onClick={handleStep2}>
                  I've Scanned the Code →
                </button>
              </div>
            )}

            {/* ── Step 3: Verify OTP ── */}
            {step === 3 && (
              <div className="tfa-wizard-body">
                <div className="tfa-wizard-step-icon"><FiSmartphone /></div>
                <h4 className="tfa-wizard-step-title">Enter Verification Code</h4>
                <p className="tfa-wizard-step-desc">
                  Enter the 6-digit code currently shown in your authenticator app.
                </p>
                <input
                  className="tfa-otp-input"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  placeholder="000 000"
                  type="text"
                  value={otpCode}
                  autoFocus
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleStep3()}
                />
                <button className="primary-btn tfa-wizard-btn" disabled={submitting} type="button" onClick={handleStep3}>
                  {submitting ? "Verifying..." : "Verify Code →"}
                </button>
              </div>
            )}

            {/* ── Step 4: Backup Codes ── */}
            {step === 4 && (
              <div className="tfa-wizard-body">
                <div className="tfa-wizard-step-icon success"><FiCheck /></div>
                <h4 className="tfa-wizard-step-title">Save Your Recovery Codes</h4>
                <p className="tfa-wizard-step-desc">
                  Save these recovery codes somewhere safe. Each code can only be used <strong>once</strong>. Use them if you lose access to your authenticator app.
                </p>

                <div className="tfa-backup-grid">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="tfa-backup-code">{code}</code>
                  ))}
                </div>

                <div className="tfa-backup-actions">
                  <button className="secondary-btn" style={{ fontSize: "0.82rem" }} type="button" onClick={handleCopyCodes}>
                    {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy All</>}
                  </button>
                  <button className="secondary-btn" style={{ fontSize: "0.82rem" }} type="button" onClick={handleDownloadCodes}>
                    <FiDownload /> Download
                  </button>
                </div>

                <button className="primary-btn tfa-wizard-btn success-btn" type="button" onClick={handleFinish}>
                  <FiCheck /> I've Saved My Codes — Finish
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

/* Fallback backup codes for when API is not yet connected */
const generateFallbackCodes = () =>
  Array.from({ length: 10 }, () =>
    Math.random().toString(36).slice(2, 7).toUpperCase() + "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase()
  );

export default TwoFactorCard;
