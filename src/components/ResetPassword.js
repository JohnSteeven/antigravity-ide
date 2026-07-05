import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STORAGE_KEYS } from "../utils/constants";
import { readStorage } from "../utils/helpers";
import { validateResetPasswordForm } from "../utils/validators";
import PasswordStrength from "./PasswordStrength";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const resetState = readStorage(AUTH_STORAGE_KEYS.passwordReset, null);
  const stateResetToken = location.state?.resetToken || "";
  const resetToken = stateResetToken || resetState?.resetToken || "";
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isExpired = useMemo(
    () =>
      !resetToken ||
      (!stateResetToken && (!resetState || resetState.expiresAt < Date.now())),
    [resetState, resetToken, stateResetToken]
  );
  const isFormValid = Object.keys(validateResetPasswordForm(form)).length === 0;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateResetPasswordForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const result = await resetPassword({ resetToken, password: form.password });
      navigate("/login", {
        replace: true,
        state: { message: result.message },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isExpired) {
    return (
      <main className="auth-page">
        <section className="auth-empty-state">
          <FiKey />
          <h1>Reset session expired</h1>
          <p>Please request a new OTP to update your password.</p>
          <Link className="primary-btn" to="/forgot-password">
            Request New OTP
          </Link>
        </section>
      </main>
    );
  }

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="auth-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="auth-shell">
        <div className="auth-brand-panel">
          <Link className="auth-logo" to="/">
            MyJourney
          </Link>
          <span className="section-kicker">New credentials</span>
          <h1>Reset Password</h1>
          <p>Set a strong password and return to the login page.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-icon">
              <FiKey />
            </span>
            <div>
              <h2>Choose Password</h2>
              <p>Use uppercase, lowercase, number, and symbol.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              New Password <span className="required-star">*</span>
              <span className="password-input">
                <input
                  autoFocus
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
              {errors.password && <small>{errors.password}</small>}
            </label>

            <label>
              Confirm Password <span className="required-star">*</span>
              <span className="password-input">
                <input
                  autoComplete="new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                />
                <button
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
              {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
            </label>

            <PasswordStrength password={form.password} />

            {message && <div className="auth-alert">{message}</div>}

            <button
              className="primary-btn auth-submit"
              disabled={isSubmitting || !isFormValid}
              type="submit"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </motion.main>
  );
};

export default ResetPassword;
