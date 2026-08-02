import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import SecurityCard from "./SecurityCard";
import "./SecurityHealthCard.css";

const formatRelativeDays = (dateInput) => {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};

const RULE_LABELS = {
  hasPassword: { label: "Password Configured", max: 30 },
  emailVerified: { label: "Email Verified", max: 20 },
  recentPasswordUpdate: { label: "Password Recently Changed", max: 20 },
  twoFactorEnabled: { label: "Two-Factor Authentication", max: 20 },
  noSuspiciousActivity: { label: "No Suspicious Activity", max: 10 },
};

const SecurityHealthCard = ({ overview, user }) => {
  const score = overview?.score ?? 0;
  const rating = overview?.rating ?? "Needs Attention";
  const checks = overview?.checks ?? {};
  const breakdown = overview?.breakdown ?? [];
  const recommendations = overview?.recommendations ?? [];
  const lastPasswordChangeText = formatRelativeDays(
    overview?.lastPasswordChange || user?.lastPasswordChange
  );

  const getScoreColor = () => {
    if (score >= 85) return { val: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", track: "#10b981" };
    if (score >= 65) return { val: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", track: "#f59e0b" };
    return { val: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", track: "#ef4444" };
  };

  const colors = getScoreColor();

  // Build breakdown from either API breakdown array or fallback checks object
  const displayBreakdown = breakdown.length > 0
    ? breakdown
    : Object.entries(RULE_LABELS).map(([id, meta]) => ({
        id,
        label: meta.label,
        maxPoints: meta.max,
        earned: checks[id] ? meta.max : 0,
        pass: Boolean(checks[id]),
      }));

  return (
    <SecurityCard>
      {/* Header */}
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
          <div className="sec-score-rating" style={{ color: colors.val }}>{rating}</div>
        </div>
      </div>

      {/* Score progress bar */}
      <div className="sec-score-bar-wrap">
        <div
          className="sec-score-bar-fill"
          style={{ width: `${score}%`, background: colors.track }}
        />
      </div>

      {/* Key metrics */}
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

      {/* Score breakdown */}
      <div className="sec-score-breakdown">
        {displayBreakdown.map((item) => (
          <div key={item.id} className="sec-breakdown-row">
            <div className="sec-breakdown-left">
              <span className={`sec-breakdown-icon ${item.pass ? "pass" : "fail"}`}>
                {item.pass ? <FiCheckCircle /> : <FiXCircle />}
              </span>
              <span className="sec-breakdown-label">{item.label}</span>
            </div>
            <div className="sec-breakdown-right">
              <span
                className="sec-breakdown-pts"
                style={{ color: item.pass ? "#10b981" : "#94a3b8" }}
              >
                +{item.earned}
              </span>
              <span className="sec-breakdown-max">/ {item.maxPoints}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
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
