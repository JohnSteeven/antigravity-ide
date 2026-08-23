import { useState } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiCheckCircle, FiCompass, FiLock, FiMail } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail || !/\S+@\S+\.\S+/.test(targetEmail)) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await requestPasswordReset({ email: targetEmail });
      setMessage(res.message || "If the email exists, a password reset link has been sent.");
      setStatus("success");
    } catch (error) {
      if (error.status === 429) {
        setMessage(error.message || "Too many reset attempts for this account. Please wait 1 hour.");
        setStatus("too-many-requests");
      } else {
        setMessage(error.message || "An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="auth-page register-auth-page centered-glass-login-page glass-split-login-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="glass-bg-glow glow-1" />
      <div className="glass-bg-glow glow-2" />
      <div className="glass-bg-glow glow-3" />

      <header className="centered-login-header">
        <Link className="auth-logo" to="/">
          <span className="logo-feather-icon">
            <FiCompass />
          </span>
          <span className="logo-brand-name">MyJourney</span>
        </Link>

        <Link className="auth-back-home" to="/login">
          <FiArrowLeft /> Back to Login
        </Link>
      </header>

      <div className="centered-login-container">
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-login-card forgot-password-card"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          <div className="login-card-header text-center">
            <h2 className="login-card-title">Forgot Password</h2>
            <p className="login-card-subtitle">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>
          </div>

          {status === "success" ? (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="forgot-success-state text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              style={{ padding: "12px 0" }}
            >
              <div style={{ fontSize: "2.4rem", color: "#16a34a", marginBottom: "12px" }}>
                <FiCheckCircle style={{ display: "inline-block" }} />
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "#1e293b", margin: "0 0 8px 0", fontWeight: 700 }}>
                Check Your Email
              </h3>
              <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                {message}
              </p>
              <div style={{ background: "rgba(241, 245, 249, 0.9)", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px", fontSize: "0.78rem", color: "#64748b", textAlign: "left", marginBottom: "20px" }}>
                <strong>Important:</strong>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "16px", lineHeight: 1.5 }}>
                  <li>The reset link will expire in <strong>15 minutes</strong>.</li>
                  <li>Check your spam or junk folder if it doesn't appear in a minute.</li>
                  <li>The link can only be used once.</li>
                </ul>
              </div>
              <Link className="login-action-btn primary-action-btn" to="/login" style={{ textDecoration: "none", display: "inline-flex" }}>
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form className="login-form-body" onSubmit={handleSubmit}>
              <div className="login-field-group">
                <label className="field-label" htmlFor="forgot-email">
                  Registered Email Address <span className="required-star">*</span>
                </label>
                <div className="field-input-wrapper">
                  <FiMail className="field-icon-left" />
                  <input
                    autoFocus
                    required
                    autoComplete="email"
                    id="forgot-email"
                    placeholder="example@email.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              {message && (
                <div className={`auth-alert ${status === "too-many-requests" ? "warning" : "error"}`}>
                  {message}
                </div>
              )}

              <button
                className="login-action-btn primary-action-btn"
                disabled={status === "loading"}
                type="submit"
              >
                {status === "loading" ? "Sending Reset Link..." : "Send Reset Link"}
              </button>

              <div className="auth-switch-text text-center" style={{ marginTop: "16px" }}>
                Remember your password? <Link to="/login">Sign In</Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
};

export default ForgotPassword;
