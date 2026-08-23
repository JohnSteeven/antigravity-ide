import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { FiRefreshCw, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getPersistedServerChallenge } from "../services/authService";
import { OTP_RESEND_MS, VERIFICATION_PURPOSES } from "../utils/constants";
import { formatCountdown } from "../utils/helpers";
import OTPInput from "./OTPInput";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendOtp, verifyOtp } = useAuth();
  const [challenge, setChallenge] = useState(
    location.state?.challenge || getPersistedServerChallenge()
  );
  const purpose = location.state?.purpose || challenge?.purpose || VERIFICATION_PURPOSES.register;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timers = useMemo(() => {
    if (!challenge) return { expiresIn: 0, resendIn: 0 };
    return {
      expiresIn: Math.max(0, challenge.expiresAt - now),
      resendIn: Math.max(0, challenge.resendAfter - now),
    };
  }, [challenge, now]);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!challenge || otp.length !== 6) return;

    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await verifyOtp({
        challengeId: challenge.id,
        code: otp,
        purpose,
      });

      if (purpose === VERIFICATION_PURPOSES.passwordReset) {
        navigate("/reset-password", {
          replace: true,
          state: {
            resetToken: result.resetToken,
            message: result.message,
          },
        });
        return;
      }

      navigate("/profile", { replace: true, state: { message: result.message } });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const resent = await resendOtp({ challengeId: challenge.id });
      setChallenge(resent);
      setOtp("");
      setMessage(`${resent.message}${resent.devCode ? ` Dev code: ${resent.devCode}` : ""}`);
      setNow(Date.now());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsResending(false);
    }
  };

  if (!challenge) {
    return (
      <main className="auth-page">
        <section className="auth-empty-state">
          <FiShield />
          <h1>No OTP challenge found</h1>
          <p>Start again from registration, login, or forgot password.</p>
          <Link className="primary-btn" to="/login">
            Go to Login
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
      <section className="otp-card">
        <span className="auth-icon">
          <FiShield />
        </span>
        <span className="section-kicker">Account verification</span>
        <h1>Verify OTP</h1>
        <p>Enter the six digit code sent to {challenge.maskedIdentifier}.</p>

        <form onSubmit={handleVerify}>
          <OTPInput value={otp} onChange={setOtp} disabled={isSubmitting} />

          <div className="otp-timers">
            <span>Expires in {formatCountdown(timers.expiresIn)}</span>
            <span>Resend in {formatCountdown(timers.resendIn || OTP_RESEND_MS)}</span>
          </div>

          {message && <div className="auth-alert">{message}</div>}

          <div className="hero-buttons">
            <button className="primary-btn" disabled={isSubmitting || otp.length !== 6} type="submit">
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>
            <button
              className="secondary-btn"
              disabled={isResending || timers.resendIn > 0}
              type="button"
              onClick={handleResend}
            >
              <FiRefreshCw /> {isResending ? "Sending..." : "Resend"}
            </button>
          </div>
        </form>
      </section>
    </motion.main>
  );
};

export default VerifyOTP;
