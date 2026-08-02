import { useMemo } from "react";
import "./PasswordStrengthMeter.css";

const calculateStrength = (password) => {
  if (!password) {
    return { score: 0, level: "Weak", resistance: "Low", cssClass: "active-weak" };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password)) points += 1;
  if (/[A-Z]/.test(password)) points += 1;
  if (/[0-9]/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 2) {
    return { score: 1, level: "Weak", resistance: "Low", cssClass: "active-weak" };
  }
  if (points === 3) {
    return { score: 2, level: "Fair", resistance: "Moderate", cssClass: "active-fair" };
  }
  if (points === 4) {
    return { score: 3, level: "Good", resistance: "Moderate", cssClass: "active-good" };
  }
  if (points === 5) {
    return { score: 4, level: "Strong", resistance: "High", cssClass: "active-strong" };
  }
  return { score: 5, level: "Excellent", resistance: "Very High", cssClass: "active-excellent" };
};

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="sec-strength-meter-wrap">
      <div className="sec-strength-meta">
        <div className="sec-strength-label-group">
          <span>Strength:</span>
          <span style={{ color: strength.score >= 4 ? "#16a34a" : strength.score >= 3 ? "#0284c7" : "#d97706" }}>
            {strength.level}
          </span>
        </div>
        <div className="sec-strength-resistance">
          Estimated resistance: <strong>{strength.resistance}</strong>
        </div>
      </div>

      <div className="sec-strength-bar-track">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`sec-strength-bar-segment ${index <= strength.score ? strength.cssClass : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
