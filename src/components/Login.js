import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiFeather,
  FiHome,
  FiKey,
  FiLogIn,
  FiMail,
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
      className="auth-page login-auth-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="auth-shell login-shell">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="auth-brand-panel login-visual-panel"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <Link className="auth-logo" to="/">
            <FiFeather />
            MyJourney
          </Link>
          <div className="auth-brand-copy">
            <span className="section-kicker">Secure reader space</span>
            <h1>Welcome Back</h1>
            <p>Log in to continue your journey of stories, lessons, and inspiration.</p>
            <blockquote>
              Every story you love is one step closer to your own beautiful journey.
            </blockquote>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="login-form-panel"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <Link className="auth-back-home" to="/">
            <FiHome /> Back to Home
          </Link>

          <div className="auth-card login-card">
            <div className="auth-card-heading centered">
              <span className="auth-icon">
                <FiUser />
              </span>
              <div>
                <h2>Log In</h2>
                <p>Glad to see you again.</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={handlePasswordLogin}>
              <label>
                Email or Mobile <span className="required-star">*</span>
                <span className="input-icon">
                  <FiMail />
                  <input
                    autoFocus
                    autoComplete="username"
                    aria-invalid={Boolean(errors.identifier)}
                    value={form.identifier}
                    onChange={(event) => updateField("identifier", event.target.value)}
                    placeholder="Enter your email or mobile"
                  />
                </span>
                {errors.identifier && <small>{errors.identifier}</small>}
              </label>

              <label>
                Password <span className="required-star">*</span>
                <span className="input-icon password-input">
                  <FiKey />
                  <input
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Enter your password"
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

              <div className="auth-form-row">
                <label className="check-line">
                  <input
                    checked={form.remember}
                    type="checkbox"
                    onChange={(event) => updateField("remember", event.target.checked)}
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password">Forgot Password?</Link>
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

              <button className="primary-btn auth-submit" disabled={isSubmitting} type="submit">
                <FiLogIn /> {isSubmitting ? "Checking..." : "Log In"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/register" state={{ fromLogin: true }}>
                Create an Account
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </motion.main>
  );
};

export default Login;
