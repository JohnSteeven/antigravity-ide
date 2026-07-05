import { useRef } from "react";
import { OTP_LENGTH } from "../utils/constants";

const OTPInput = ({ value, onChange, length = OTP_LENGTH, disabled = false }) => {
  const inputs = useRef([]);
  const digits = String(value || "").padEnd(length, " ").slice(0, length).split("");

  const updateValue = (nextDigits) => {
    onChange(nextDigits.join("").replace(/\s/g, ""));
  };

  const handleChange = (index, event) => {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit || " ";
    updateValue(nextDigits);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-input" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          aria-label={`OTP digit ${index + 1}`}
          autoComplete="one-time-code"
          disabled={disabled}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          value={digit.trim()}
        />
      ))}
    </div>
  );
};

export default OTPInput;
