import { Link } from "react-router-dom";
import { FiCheckCircle, FiCompass, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";

const ResetPasswordSuccess = () => {
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
      </header>

      <div className="centered-login-container">
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-login-card reset-success-card text-center"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          style={{ padding: "36px 28px" }}
        >
          <div style={{ fontSize: "3rem", color: "#16a34a", marginBottom: "16px" }}>
            <FiCheckCircle style={{ display: "inline-block" }} />
          </div>

          <h2 className="login-card-title" style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
            Password Changed Successfully!
          </h2>

          <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.6, marginBottom: "20px" }}>
            Your account security is our top priority. For your safety, all active login sessions on all devices have been signed out.
          </p>

          <div style={{ background: "rgba(241, 245, 249, 0.85)", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", fontSize: "0.82rem", color: "#64748b", display: "flex", alignItems: "center", gap: "10px", textAlign: "left", marginBottom: "24px" }}>
            <FiShield style={{ fontSize: "1.4rem", color: "#0284c7", flexShrink: 0 }} />
            <div>
              <strong>Security Confirmation:</strong> A confirmation email with details of this change has been dispatched to your email address.
            </div>
          </div>

          <Link className="login-action-btn primary-action-btn" to="/login" style={{ textDecoration: "none", display: "inline-flex" }}>
            Sign In with New Password →
          </Link>
        </motion.div>
      </div>
    </motion.main>
  );
};

export default ResetPasswordSuccess;
