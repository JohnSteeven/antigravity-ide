import { FiCheck, FiX } from "react-icons/fi";
import { getPasswordStrength } from "../utils/validators";

const PasswordStrength = ({ password }) => {
  const strength = getPasswordStrength(password);
  const checks = [
    ["length", "At least 8 characters"],
    ["uppercase", "Uppercase letter (A-Z)"],
    ["lowercase", "Lowercase letter (a-z)"],
    ["number", "Number (0-9)"],
    ["special", "Special character (!@#$%^&*)"],
  ];

  // Calculate filled segments (out of 5)
  const passedCount = checks.filter(([key]) => Boolean(strength.checks?.[key])).length;

  return (
    <div className="password-strength-widget">
      <div className="strength-header">
        <span className="strength-label">Password Strength:</span>
        <span className={`strength-score score-${passedCount}`}>{strength.label}</span>
      </div>

      {/* Segmented Meter Bar (■■■■■■■■) */}
      <div className="strength-segmented-bar">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            className={`bar-segment ${index <= passedCount ? `active-seg-${passedCount}` : ""}`}
            key={index}
          />
        ))}
      </div>

      {/* Real-time Checklist */}
      <ul className="strength-checklist">
        {checks.map(([key, label]) => {
          const isPassed = Boolean(strength.checks?.[key]);
          return (
            <li className={`check-item ${isPassed ? "passed" : "pending"}`} key={key}>
              <span className="check-icon">{isPassed ? <FiCheck /> : <FiX />}</span>
              <span className="check-text">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
