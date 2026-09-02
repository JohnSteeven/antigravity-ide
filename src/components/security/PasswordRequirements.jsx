import { useMemo } from "react";
import { FiCheck, FiX } from "react-icons/fi";

const PasswordRequirements = ({ password }) => {
  const rules = useMemo(
    () => [
      { id: "length", label: "At least 8 characters", met: password.length >= 8 },
      { id: "upper", label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
      { id: "lower", label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
      { id: "number", label: "One number (0-9)", met: /[0-9]/.test(password) },
      { id: "symbol", label: "One special character (!@#$%^&*)", met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  if (!password) return null;

  return (
    <div style={{ margin: "10px 0 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 12px" }}>
      {rules.map((rule) => (
        <div
          key={rule.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: rule.met ? "#16a34a" : "#94a3b8",
            transition: "color 0.2s ease",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>{rule.met ? <FiCheck /> : <FiX />}</span>
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
};

export default PasswordRequirements;
