import { useMemo } from "react";
import { FiCheckCircle, FiShield } from "react-icons/fi";

const formatRelativeTime = (dateInput) => {
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
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffMonths / 12)} years ago`;
};

const formatDateFull = (dateInput) => {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return dateInput;

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const AccountSecurityCard = ({ user }) => {
  const securityScore = useMemo(() => {
    let score = 30; // Has password
    if (user?.verified?.email) score += 20;
    if (user?.verified?.mobile) score += 20;
    if (user?.lastPasswordChange) {
      const daysSinceChange = (Date.now() - new Date(user.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange <= 90) score += 20;
      else score += 10;
    } else {
      score += 10;
    }
    if (!user?.lockUntil) score += 10;
    return Math.min(score, 100);
  }, [user]);

  const scoreLabel = securityScore >= 90 ? "Excellent" : securityScore >= 70 ? "Good" : "Needs Improvement";
  const scoreColor = securityScore >= 90 ? "#16a34a" : securityScore >= 70 ? "#0d9488" : "#d97706";

  const lastChangedRelative = formatRelativeTime(user?.lastPasswordChange);
  const lastChangedDate = formatDateFull(user?.lastPasswordChange);

  return (
    <div
      style={{
        padding: "20px 22px",
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid rgba(66, 108, 103, 0.22)",
        borderRadius: "12px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clay, #a5855f)", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Account Security
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Security Health Overview
          </h3>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: scoreColor }}>
            {securityScore} <span style={{ fontSize: "0.9rem", color: "#64748b" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: scoreColor }}>
            {scoreLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", paddingTop: "12px", borderTop: "1px solid rgba(226, 232, 240, 0.7)" }}>
        <div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Password Updated</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>{lastChangedRelative}</div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Last changed: {lastChangedDate}</div>
        </div>

        <div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>Status Checks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.8rem", color: "#1e293b" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#16a34a", fontWeight: 600 }}>
              <FiCheckCircle /> Password Protected
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: user?.verified?.email ? "#16a34a" : "#64748b", fontWeight: 600 }}>
              <FiCheckCircle /> {user?.verified?.email ? "Email Verified" : "Email Unverified"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#16a34a", fontWeight: 600 }}>
              <FiCheckCircle /> No Suspicious Activity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurityCard;
