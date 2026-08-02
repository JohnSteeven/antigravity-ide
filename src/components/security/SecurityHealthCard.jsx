import { FiCheckCircle, FiClock, FiShield, FiXCircle } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import "./SecurityHealthCard.css";

const formatRelativeDays = (dateInput) => {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
};

const SecurityHealthCard = ({ overview, user }) => {
  const score = overview?.score ?? 90;
  const rating = overview?.rating ?? "Excellent";
  const checks = overview?.checks ?? {
    hasPassword: true,
    emailVerified: Boolean(user?.verified?.email),
    mobileVerified: Boolean(user?.verified?.mobile),
    recentPasswordUpdate: true,
    noSuspiciousActivity: true,
  };
  const recommendations = overview?.recommendations ?? [];
  const lastPasswordChangeText = formatRelativeDays(overview?.lastPasswordChange || user?.lastPasswordChange);

  const getScoreColor = () => {
    if (score >= 85) return { val: "#10b981", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)" };
    if (score >= 65) return { val: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)" };
    return { val: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)" };
  };

  const colors = getScoreColor();

  return (
    <SecurityCard>
      <div className="sec-health-header">
        <div>
          <span className="section-kicker" style={{ color: "#a5855f", fontSize: "0.74rem", fontWeight: 800 }}>
            Account Security
          </span>
          <h3 className="sec-health-title" style={{ fontSize: "1.05rem", fontWeight: 700, margin: "2px 0 0" }}>
            Security Health Overview
          </h3>
        </div>

        <div className="sec-score-pill" style={{ background: colors.bg, borderColor: colors.border }}>
          <div className="sec-score-value" style={{ color: colors.val }}>
            {score} <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>/ 100</span>
          </div>
          <div className="sec-score-rating" style={{ color: colors.val }}>
            {rating}
          </div>
        </div>
      </div>

      <div className="sec-health-grid">
        <div className="sec-health-metric-box">
          <div className="sec-health-metric-label">Password Status</div>
          <div className="sec-health-metric-val">
            {checks.hasPassword ? "Password Protected" : "No Password Set"}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
            Last changed: {lastPasswordChangeText}
          </div>
        </div>

        <div className="sec-health-metric-box">
          <div className="sec-health-metric-label">Verification Posture</div>
          <div className="sec-health-metric-val">
            {checks.emailVerified ? "Email Verified" : "Unverified Email"}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
            {user?.email || "User Account"}
          </div>
        </div>
      </div>

      <ul className="sec-check-list">
        <li className={`sec-check-item ${checks.hasPassword ? "pass" : "warn"}`}>
          {checks.hasPassword ? <FiCheckCircle /> : <FiXCircle />} Password Protected
        </li>
        <li className={`sec-check-item ${checks.emailVerified ? "pass" : "warn"}`}>
          {checks.emailVerified ? <FiCheckCircle /> : <FiXCircle />} Email Verified
        </li>
        <li className={`sec-check-item ${checks.noSuspiciousActivity ? "pass" : "warn"}`}>
          {checks.noSuspiciousActivity ? <FiCheckCircle /> : <FiXCircle />} No Suspicious Activity
        </li>
      </ul>

      {recommendations.length > 0 && (
        <div className="sec-recs-box">
          <h5 className="sec-recs-title">Security Recommendations</h5>
          <ul className="sec-recs-list">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </SecurityCard>
  );
};

export default SecurityHealthCard;
