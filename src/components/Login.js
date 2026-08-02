import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCompass,
  FiEye,
  FiEyeOff,
  FiFeather,
  FiHome,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { validateLoginForm } from "../utils/validators";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPassword } = useAuth();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(location.state?.message || "");
  const [showPassword, setShowPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = location.state?.from;
  const redirectTo = from
    ? `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`
    : "/profile";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    setMessage("");
    setIncorrectPassword(false);

    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await loginWithPassword(form);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setMessage(
        error.code === "INCORRECT_PASSWORD" ? "Incorrect password." : error.message
      );
      setIncorrectPassword(error.code === "INCORRECT_PASSWORD");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="auth-page login-auth-page centered-glass-login-page glass-split-login-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Background Ambient Glows */}
      <div className="glass-bg-glow glow-1" />
      <div className="glass-bg-glow glow-2" />
      <div className="glass-bg-glow glow-3" />

      {/* Top Header Navigation */}
      <header className="centered-login-header">
        <Link className="auth-logo" to="/">
          <span className="logo-brand-name">MyJourney</span>
        </Link>

        <Link className="auth-back-home" to="/">
          <FiArrowLeft /> Back to Home
        </Link>
      </header>

      {/* Main Two-Column Layout Container */}
      <div className="glass-split-container">
        {/* Left Side: Headline & Subheading */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="login-hero-left"
          initial={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="login-hero-badge">
            <FiCompass className="badge-sparkle-icon" />
            <span>Welcome</span>
          </div>

          <h1 className="login-hero-headline">
            Explore Stories That <span className="headline-accent">Inspire</span> Every Journey.
          </h1>

          <p className="login-hero-subheading">
            Whether you're here to learn something new, find inspiration, or simply enjoy great writing, MyJourney is built to make every visit meaningful.
          </p>

          <div className="login-hero-features">
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Personalized Reading</span>
            </div>
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Save Your Favorites</span>
            </div>
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Continue Anywhere</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Glassmorphism Login Form Card */}
        <div className="login-hero-right">
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="auth-card login-card glass-login-card"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.45 }}
          >
            <div className="login-card-header">
              <h2 className="login-card-title">Log In</h2>
              <p className="login-card-subtitle">Sign in to continue exploring inspiring stories.</p>
            </div>

            <form className="auth-form login-form-body" onSubmit={handlePasswordLogin}>
              <div className="login-field-group">
                <label className="field-label" htmlFor="login-identifier">
                  <span>
                    Email or Mobile <span className="required-star">*</span>
                  </span>
                </label>
                <div className="field-input-wrapper">
                  <FiMail className="field-icon-left" />
                  <input
                    id="login-identifier"
                    autoFocus
                    autoComplete="username"
                    aria-invalid={Boolean(errors.identifier)}
                    placeholder="example@email.com"
                    value={form.identifier}
                    onChange={(event) => updateField("identifier", event.target.value)}
                  />
                </div>
                {errors.identifier && (
                  <small className="field-error-text">{errors.identifier}</small>
                )}
              </div>

              <div className="login-field-group">
                <label className="field-label" htmlFor="login-password">
                  <span>
                    Password <span className="required-star">*</span>
                  </span>
                </label>
                <div className="field-input-wrapper">
                  <FiLock className="field-icon-left" />
                  <input
                    id="login-password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="password-eye-btn"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <small className="field-error-text">{errors.password}</small>
                )}
              </div>

              <div className="login-options-row">
                <label className="custom-checkbox-wrap">
                  <input
                    checked={form.remember}
                    type="checkbox"
                    onChange={(event) => updateField("remember", event.target.checked)}
                  />
                  <span className="checkbox-box"></span>
                  <span className="checkbox-label-text">Remember Me</span>
                </label>
                <Link className="forgot-pass-link" to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>

              {message && (
                <div className={incorrectPassword ? "auth-alert warning" : "auth-alert"}>
                  {message}
                  {incorrectPassword && (
                    <div className="auth-alert-actions">
                      <button type="button" onClick={() => updateField("password", "")}>
                        Try Again
                      </button>
                      <Link to="/forgot-password">Forgot Password</Link>
                    </div>
                  )}
                </div>
              )}

              <button className="login-action-btn" disabled={isSubmitting} type="submit">
                <span>{isSubmitting ? "Checking..." : "Start Reading"}</span>
                <FiArrowRight className="btn-arrow-icon" />
              </button>

              <div className="auth-trust-message">
                <FiShield className="trust-shield-icon" />
                <span>Protected with industry-standard security.</span>
              </div>
            </form>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <Link to="/register" state={{ fromLogin: true }}>
                Create an Account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
};

export default Login;
