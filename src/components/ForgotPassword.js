import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { VERIFICATION_PURPOSES } from "../utils/constants";
import { detectIdentifierType, validateIdentifier } from "../utils/validators";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const [form, setForm] = useState({
    identifier: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateIdentifier(form.identifier)) {
      setMessage("Enter a valid email or mobile number.");
      return;
    }

    const channel = detectIdentifierType(form.identifier);
    setIsSubmitting(true);
    try {
      const challenge = await requestPasswordReset({
        identifier: form.identifier,
        channel,
      });
      navigate("/verify-otp", {
        state: {
          challenge,
          purpose: VERIFICATION_PURPOSES.passwordReset,
          message: `${challenge.message}${
            challenge.devCode ? ` Dev code: ${challenge.devCode}` : ""
          }`,
        },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <span className="section-kicker">Password recovery</span>
          <h1>Forgot Password</h1>
          <p>Verify your identity with an OTP, then set a new password.</p>
          <Link className="secondary-btn" to="/login">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-icon">
              <FiLock />
            </span>
            <div>
              <h2>Reset Access</h2>
              <p>Choose where the OTP should be sent.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email or Mobile <span className="required-star">*</span>
              <input
                autoFocus
                autoComplete="username"
                value={form.identifier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, identifier: event.target.value }))
                }
                placeholder="Registered email or mobile"
              />
            </label>

            {message && <div className="auth-alert">{message}</div>}

            <button className="primary-btn auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Sending..." : "Send OTP"}
            </button>
          </form>
        </div>
      </section>
    </motion.main>
  );
};

export default ForgotPassword;
