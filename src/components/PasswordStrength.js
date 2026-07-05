import { FiCheckCircle, FiCircle } from "react-icons/fi";
import { getPasswordStrength } from "../utils/validators";

const PasswordStrength = ({ password }) => {
  const strength = getPasswordStrength(password);
  const checks = [
    ["length", "8 characters"],
    ["maxLength", "64 characters max"],
    ["uppercase", "Uppercase"],
    ["lowercase", "Lowercase"],
    ["number", "Number"],
    ["special", "Special character"],
  ];

  return (
    <div className="password-strength">
      <div className="strength-top">
        <span>Password strength</span>
        <strong>{strength.label}</strong>
      </div>
      <div className="strength-meter" aria-hidden="true">
        <span style={{ width: `${strength.percent}%` }}></span>
      </div>
      <ul>
        {checks.map(([key, label]) => (
          <li className={strength.checks[key] ? "passed" : ""} key={key}>
            {strength.checks[key] ? <FiCheckCircle /> : <FiCircle />}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
