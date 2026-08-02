import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import "./PasswordInput.css";

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
  required = true,
  disabled = false,
  error = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const handleKeyDown = (event) => {
    if (event.getModifierState) {
      setIsCapsLockOn(event.getModifierState("CapsLock"));
    }
  };

  const handleKeyUp = (event) => {
    if (event.getModifierState) {
      setIsCapsLockOn(event.getModifierState("CapsLock"));
    }
  };

  return (
    <div className="sec-password-input-group">
      {label && (
        <label className="sec-field-label" htmlFor={id}>
          {label} {required && <span className="sec-required-star">*</span>}
        </label>
      )}

      <div className="sec-input-wrapper">
        <FiLock className="sec-input-icon" />
        <input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="sec-input-field"
          disabled={disabled}
          id={id}
          placeholder={placeholder}
          required={required}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="sec-eye-btn"
          disabled={disabled}
          tabIndex="-1"
          type="button"
          onClick={() => setShowPassword((curr) => !curr)}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      {isCapsLockOn && (
        <div className="sec-caps-lock-warning" role="alert">
          ⚠️ Caps Lock is ON
        </div>
      )}

      {error && (
        <small className="field-error-text" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
};

export default PasswordInput;
