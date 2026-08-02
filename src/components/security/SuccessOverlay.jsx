import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiLogIn, FiPauseCircle, FiPlayCircle } from "react-icons/fi";
import "./SuccessOverlay.css";

const SuccessOverlay = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    if (countdown <= 0) {
      navigate("/login", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isPaused, navigate]);

  return (
    <div className="sec-success-wrap">
      <div className="sec-success-icon-badge">
        <FiCheckCircle />
      </div>

      <h3 className="sec-success-title">Password Changed Successfully</h3>

      <p className="sec-success-subtitle">
        Your password has been updated. For your protection, all active sessions across all devices have been revoked.
      </p>

      <div className="sec-success-checklist-box">
        <div className="sec-success-checklist-item">
          <FiCheckCircle style={{ color: "#16a34a" }} /> Password Updated
        </div>
        <div className="sec-success-checklist-item">
          <FiCheckCircle style={{ color: "#16a34a" }} /> Security Email Sent
        </div>
        <div className="sec-success-checklist-item">
          <FiCheckCircle style={{ color: "#16a34a" }} /> All Sessions Revoked
        </div>
        <div className="sec-success-checklist-item">
          <FiCheckCircle style={{ color: "#16a34a" }} /> Remember Me Cleared
        </div>
        <div className="sec-success-checklist-item">
          <FiCheckCircle style={{ color: "#16a34a" }} /> You'll need to sign in again
        </div>
      </div>

      <div className="sec-success-actions">
        <button
          className="primary-btn"
          onClick={() => navigate("/login", { replace: true })}
          style={{ padding: "10px 24px", borderRadius: "8px", fontSize: "0.92rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
          type="button"
        >
          Login Now <FiLogIn />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.84rem", color: "#64748b" }}>
          <span>
            {isPaused ? "Redirect paused" : `Redirecting in ${countdown} seconds...`}
          </span>
          <button
            className="secondary-btn"
            onClick={() => setIsPaused((prev) => !prev)}
            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            type="button"
          >
            {isPaused ? <><FiPlayCircle /> Resume</> : <><FiPauseCircle /> Cancel Redirect</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;
