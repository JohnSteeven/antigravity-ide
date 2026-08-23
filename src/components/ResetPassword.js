import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiCheckCircle, FiCompass, FiEye, FiEyeOff, FiKey, FiLock, FiXCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { validateResetPasswordForm } from "../utils/validators";
import PasswordStrength from "./PasswordStrength";

const ResetPassword = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // Extract token from URL route params or search query or location state
  const tokenFromQuery = new URLSearchParams(location.search).get("token");
  const rawToken = params.token || tokenFromQuery || location.state?.resetToken || "";

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState(rawToken ? "validating" : "invalid"); // validating | idle | loading | success | expired | invalid | error
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-flight token validation on load
  useEffect(() => {
    if (!rawToken) {
      setStatus("invalid");
      setMessage("Password reset token is missing.");
      return;
    }

    let isMounted = true;
    authService
      .validateResetToken(rawToken)
      .then((res) => {
        if (!isMounted) return;
        if (!res.valid) {
          if (res.reason === "expired") {
            setStatus("expired");
            setMessage("This password reset link has expired. Request a new one.");
          } else {
            setStatus("invalid");
            setMessage("This password reset link is invalid or has already been used.");
          }
        } else {
          setStatus("idle");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("idle");
      });

    return () => {
      isMounted = false;
    };
  }, [rawToken]);

  const formErrors = useMemo(() => validateResetPasswordForm(form), [form]);
  const isFormValid = Object.keys(formErrors).length === 0;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rawToken) {
      setStatus("invalid");
      setMessage("Password reset token is missing.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (Object.keys(formErrors).length > 0) {
      setStatus("error");
      setMessage("Please fulfill all password strength requirements.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await resetPassword({
        token: rawToken,
        resetToken: rawToken,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setStatus("success");
      setMessage(
        res.message ||
          "Password updated successfully. For your security, you've been signed out on all devices. Please sign in again."
      );
    } catch (error) {
      const errMsg = error.message || "";
      if (errMsg.toLowerCase().includes("expired")) {
        setStatus("expired");
        setMessage("This password reset link has expired. Request a new one.");
      } else if (errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("used")) {
        setStatus("invalid");
        setMessage("This password reset link is invalid or has already been used.");
      } else {
        setStatus("error");
        setMessage(errMsg || "Failed to update password. Please try again.");
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
          className="glass-login-card reset-password-card"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          {status === "validating" ? (
            <div className="text-center" style={{ padding: "36px 0" }}>
              <div style={{ fontSize: "1rem", color: "#64748b", fontWeight: 600 }}>
                Validating security token...
              </div>
            </div>
          ) : status === "expired" ? (
            <div className="reset-expired-state text-center" style={{ padding: "16px 0" }}>
              <div style={{ fontSize: "2.5rem", color: "#e11d48", marginBottom: "12px" }}>
                <FiXCircle style={{ display: "inline-block" }} />
              </div>
              <h2 className="login-card-title" style={{ fontSize: "1.4rem", margin: "0 0 8px" }}>
                Link Expired
              </h2>
              <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
                This password reset link has expired for your security. Password reset links are valid for 15 minutes.
              </p>
              <Link className="login-action-btn primary-action-btn" to="/forgot-password" style={{ textDecoration: "none", display: "inline-flex" }}>
                Request a New Link
              </Link>
            </div>
          ) : status === "invalid" || !rawToken ? (
            <div className="reset-invalid-state text-center" style={{ padding: "16px 0" }}>
              <div style={{ fontSize: "2.5rem", color: "#e11d48", marginBottom: "12px" }}>
                <FiXCircle style={{ display: "inline-block" }} />
              </div>
              <h2 className="login-card-title" style={{ fontSize: "1.4rem", margin: "0 0 8px" }}>
                Invalid Reset Link
              </h2>
              <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
                This link is invalid or has already been used to reset a password.
              </p>
              <Link className="login-action-btn primary-action-btn" to="/forgot-password" style={{ textDecoration: "none", display: "inline-flex" }}>
                Request New Password Reset
              </Link>
            </div>
          ) : status === "success" ? (
            <div className="reset-success-state text-center" style={{ padding: "16px 0" }}>
              <div style={{ fontSize: "2.6rem", color: "#16a34a", marginBottom: "12px" }}>
                <FiCheckCircle style={{ display: "inline-block" }} />
              </div>
              <h2 className="login-card-title" style={{ fontSize: "1.4rem", margin: "0 0 8px" }}>
                Password Updated Successfully
              </h2>
              <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
                For your security, you've been signed out on all devices. Please sign in again with your new password.
              </p>
              <button
                className="login-action-btn primary-action-btn"
                onClick={() => navigate("/login", { replace: true })}
                type="button"
              >
                Sign In Now →
              </button>
            </div>
          ) : (
            <>
              <div className="login-card-header text-center">
                <h2 className="login-card-title">Set New Password</h2>
                <p className="login-card-subtitle">
                  Choose a strong password to secure your account.
                </p>
              </div>

              <form className="login-form-body" onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="login-field-group">
                  <label className="field-label" htmlFor="new-password">
                    New Password <span className="required-star">*</span>
                  </label>
                  <div className="field-input-wrapper">
                    <FiLock className="field-icon-left" />
                    <input
                      autoFocus
                      required
                      autoComplete="new-password"
                      id="new-password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    <button
                      className="password-eye-btn"
                      tabIndex="-1"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="login-field-group">
                  <label className="field-label" htmlFor="confirm-password">
                    Confirm New Password <span className="required-star">*</span>
                  </label>
                  <div className="field-input-wrapper">
                    <FiLock className="field-icon-left" />
                    <input
                      required
                      autoComplete="new-password"
                      id="confirm-password"
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                    />
                    <button
                      className="password-eye-btn"
                      tabIndex="-1"
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <small className="field-error-text">Passwords do not match.</small>
                  )}
                </div>

                {/* Password Strength Widget */}
                {form.password && <PasswordStrength password={form.password} />}

                {message && <div className="auth-alert error">{message}</div>}

                <button
                  className="login-action-btn primary-action-btn"
                  disabled={status === "loading" || !isFormValid || form.password !== form.confirmPassword}
                  type="submit"
                >
                  {status === "loading" ? "Updating Password..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
};

export default ResetPassword;
