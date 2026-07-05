import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiFeather,
  FiLock,
  FiMail,
  FiPhone,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiXCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { VERIFICATION_PURPOSES } from "../utils/constants";
import { getPasswordStrength, validateRegisterForm } from "../utils/validators";

const initialForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  countryCode: "+91",
  mobile: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  newsletter: true,
};

const requiredFields = [
  "firstName",
  "lastName",
  "email",
  "countryCode",
  "mobile",
  "password",
  "confirmPassword",
  "acceptTerms",
];

const getUsername = (form) =>
  form.username ||
  `${form.firstName}${form.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24) ||
  String(form.email).split("@")[0];

const Register = () => {
  const navigate = useNavigate();
  const { register, sendRegistrationOtp } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const submitForm = useMemo(
    () => ({
      ...form,
      username: getUsername(form),
    }),
    [form]
  );
  const liveErrors = useMemo(() => validateRegisterForm(submitForm), [submitForm]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );
  const isFormValid = Object.keys(liveErrors).length === 0;
  const fieldErrors = Object.keys(liveErrors).reduce((current, field) => {
    if (submitted || touched[field]) {
      current[field] = liveErrors[field];
    }
    return current;
  }, {});
  const passwordChecks = [
    ["length", "Minimum 8 characters"],
    ["uppercase", "Uppercase letter"],
    ["lowercase", "Lowercase letter"],
    ["number", "Number"],
    ["special", "Special character"],
  ];
  const showPasswordPopover = isPasswordFocused && !passwordStrength.isValid;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setTouched(
      requiredFields.reduce((next, field) => ({ ...next, [field]: true }), {})
    );
    setMessage("");

    if (Object.keys(liveErrors).length) return;

    setIsSubmitting(true);
    try {
      const result = await register(submitForm);
      setRegisteredUser(result.user);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startVerification = async (channel) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const challenge = await sendRegistrationOtp({
        userId: registeredUser.id || registeredUser._id,
        channel,
      });
      navigate("/verify-otp", {
        state: {
          challenge,
          purpose: VERIFICATION_PURPOSES.register,
          message: `${challenge.message}${
            challenge.devCode ? ` Dev code: ${challenge.devCode}` : ""
          }`,
        },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="auth-page register-auth-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="auth-shell wide compact-register-shell">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="auth-brand-panel register-hero-panel"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <Link className="auth-logo" to="/">
            <FiFeather />
            MyJourney
          </Link>
          <div className="register-hero-copy">
            <span className="section-kicker">Join the journal</span>
            <h1>
              Begin Your <span>Journey</span>
            </h1>
            <p>Create your account and keep every story, bookmark, and reflection close.</p>
          </div>
          <div className="register-hero-points" aria-label="Account benefits">
            <span>
              <FiTarget /> Set Goals
            </span>
            <span>
              <FiTrendingUp /> Track Progress
            </span>
            <span>
              <FiAward /> Achieve More
            </span>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="auth-card register-card compact-register-card"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <div className="compact-register-topline">
            <div className="auth-card-heading">
              <span className="auth-icon">
                <FiUserPlus />
              </span>
              <div>
                <h2>{registeredUser ? "Choose Verification" : "Create Account"}</h2>
                <p>
                  {registeredUser
                    ? "Pick where your OTP should arrive."
                    : "Fill in the details below to get started."}
                </p>
              </div>
            </div>
            <p className="compact-signin-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>

          {registeredUser ? (
            <div className="verification-choice">
              <FiCheckCircle />
              <h3>Account created</h3>
              <p>{message}</p>
              <div className="choice-grid">
                <button
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => startVerification("email")}
                >
                  <FiMail />
                  Verify using Email
                  <span>{registeredUser.email}</span>
                </button>
                <button
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => startVerification("mobile")}
                >
                  <FiPhone />
                  Verify using Mobile Number
                  <span>{registeredUser.mobile}</span>
                </button>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-grid two">
                <label>
                  First Name <span className="required-star">*</span>
                  <span className="input-icon">
                    <FiUser />
                    <input
                      autoComplete="given-name"
                      autoFocus
                      aria-invalid={Boolean(fieldErrors.firstName)}
                      value={form.firstName}
                      onBlur={() => markTouched("firstName")}
                      onChange={(event) => updateField("firstName", event.target.value)}
                    />
                  </span>
                  {fieldErrors.firstName && <small>{fieldErrors.firstName}</small>}
                </label>
                <label>
                  Last Name <span className="required-star">*</span>
                  <span className="input-icon">
                    <FiUser />
                    <input
                      autoComplete="family-name"
                      aria-invalid={Boolean(fieldErrors.lastName)}
                      value={form.lastName}
                      onBlur={() => markTouched("lastName")}
                      onChange={(event) => updateField("lastName", event.target.value)}
                    />
                  </span>
                  {fieldErrors.lastName && <small>{fieldErrors.lastName}</small>}
                </label>
              </div>

              <div className="form-grid one">
                <label>
                  Email Address <span className="required-star">*</span>
                  <span className="input-icon">
                    <FiMail />
                    <input
                      autoComplete="email"
                      type="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      value={form.email}
                      onBlur={() => markTouched("email")}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                  </span>
                  {fieldErrors.email && <small>{fieldErrors.email}</small>}
                </label>
              </div>

              <div className="form-grid country-mobile">
                <label>
                  Country Code <span className="required-star">*</span>
                  <input
                    autoComplete="tel-country-code"
                    aria-invalid={Boolean(fieldErrors.countryCode)}
                    value={form.countryCode}
                    onBlur={() => markTouched("countryCode")}
                    onChange={(event) => updateField("countryCode", event.target.value)}
                  />
                  {fieldErrors.countryCode && <small>{fieldErrors.countryCode}</small>}
                </label>
                <label>
                  Mobile Number <span className="required-star">*</span>
                  <span className="input-icon">
                    <FiPhone />
                    <input
                      autoComplete="tel-national"
                      inputMode="numeric"
                      aria-invalid={Boolean(fieldErrors.mobile)}
                      value={form.mobile}
                      onBlur={() => markTouched("mobile")}
                      onChange={(event) => updateField("mobile", event.target.value)}
                    />
                  </span>
                  {fieldErrors.mobile && <small>{fieldErrors.mobile}</small>}
                </label>
              </div>

              <div className="form-grid two">
                <label className="password-field-wrap">
                  Password <span className="required-star">*</span>
                  <span className="password-input input-icon">
                    <FiLock />
                    <input
                      autoComplete="new-password"
                      maxLength={64}
                      type={showPassword ? "text" : "password"}
                      aria-invalid={Boolean(fieldErrors.password)}
                      value={form.password}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                        markTouched("password");
                      }}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    {showPasswordPopover && (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="password-popover"
                        initial={{ opacity: 0, y: -6 }}
                        role="status"
                        transition={{ duration: 0.16 }}
                      >
                        <div className="strength-top">
                          <span>Password strength</span>
                          <strong>{passwordStrength.label}</strong>
                        </div>
                        <div className="strength-meter" aria-hidden="true">
                          <span style={{ width: `${passwordStrength.percent}%` }}></span>
                        </div>
                        <ul>
                          {passwordChecks.map(([key, label]) => (
                            <li
                              className={passwordStrength.checks[key] ? "passed" : ""}
                              key={key}
                            >
                              {passwordStrength.checks[key] ? (
                                <FiCheckCircle />
                              ) : (
                                <FiXCircle />
                              )}
                              {label}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </span>
                  {fieldErrors.password && <small>{fieldErrors.password}</small>}
                </label>
                <label>
                  Confirm Password <span className="required-star">*</span>
                  <span className="password-input input-icon">
                    <FiLock />
                    <input
                      autoComplete="new-password"
                      maxLength={64}
                      type={showConfirmPassword ? "text" : "password"}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      value={form.confirmPassword}
                      onBlur={() => markTouched("confirmPassword")}
                      onChange={(event) =>
                        updateField("confirmPassword", event.target.value)
                      }
                    />
                    <button
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </span>
                  {fieldErrors.confirmPassword && (
                    <small>{fieldErrors.confirmPassword}</small>
                  )}
                </label>
              </div>

              <label className="check-line">
                <input
                  checked={form.acceptTerms}
                  type="checkbox"
                  onChange={(event) => {
                    updateField("acceptTerms", event.target.checked);
                    markTouched("acceptTerms");
                  }}
                />
                I accept the terms and privacy policy.{" "}
                <span className="required-star">*</span>
              </label>
              <small className="field-error">
                {fieldErrors.acceptTerms ? fieldErrors.acceptTerms : "\u00A0"}
              </small>

              <label className="check-line">
                <input
                  checked={form.newsletter}
                  type="checkbox"
                  onChange={(event) => updateField("newsletter", event.target.checked)}
                />
                Subscribe to Newsletter
              </label>

              {message && <div className="auth-alert">{message}</div>}

              <button
                className="primary-btn auth-submit compact-register-submit"
                disabled={isSubmitting || !isFormValid}
                type="submit"
              >
                <FiUserPlus /> {isSubmitting ? "Creating..." : "Register"}
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </motion.main>
  );
};

export default Register;
