import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCompass,
  FiEye,
  FiEyeOff,
  FiFeather,
  FiHome,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiUserPlus,
  FiXCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { VERIFICATION_PURPOSES } from "../utils/constants";
import { ALL_COUNTRY_CODES } from "../utils/countryCodes";
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

  // Progressive Step Validations
  const isFirstNameValid = Boolean(form.firstName.trim());
  const isLastNameValid = isFirstNameValid && Boolean(form.lastName.trim());
  const isEmailValid = isLastNameValid && Boolean(form.email.trim()) && !liveErrors.email;
  const isMobileValid = isEmailValid && Boolean(form.mobile.trim()) && !liveErrors.mobile;
  const isPasswordValid = isMobileValid && Boolean(form.password.trim()) && !liveErrors.password;
  const isConfirmPasswordValid = isPasswordValid && Boolean(form.confirmPassword.trim()) && !liveErrors.confirmPassword;

  // Active step is the first incomplete step in the registration sequence
  const activeStep = useMemo(() => {
    if (!isFirstNameValid) return "firstName";
    if (!isLastNameValid) return "lastName";
    if (!isEmailValid) return "email";
    if (!isMobileValid) return "mobile";
    if (!isPasswordValid) return "password";
    if (!isConfirmPasswordValid) return "confirmPassword";
    return "acceptTerms";
  }, [isFirstNameValid, isLastNameValid, isEmailValid, isMobileValid, isPasswordValid, isConfirmPasswordValid]);

  const isFormValid = Object.keys(liveErrors).length === 0;

  // Only display the error for the active step to avoid multiple errors popping up simultaneously
  const fieldErrors = useMemo(() => {
    const current = {};
    if (liveErrors[activeStep] && (submitted || touched[activeStep])) {
      current[activeStep] = liveErrors[activeStep];
    }
    return current;
  }, [liveErrors, activeStep, submitted, touched]);

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

  // Helper when user clicks or focuses a locked field
  const handleLockedFieldClick = (requiredPrevField) => {
    markTouched(requiredPrevField);
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
      className="auth-page register-auth-page centered-glass-login-page glass-split-login-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Background Glass Highlights */}
      <div className="glass-bg-glow glow-1" />
      <div className="glass-bg-glow glow-2" />
      <div className="glass-bg-glow glow-3" />



      {/* Top Header Navigation */}
      <header className="centered-login-header">
        <Link className="auth-logo" to="/">
          <span className="logo-brand-name">MyJourney</span>
        </Link>

        <Link className="auth-back-home" to="/">
          <FiArrowLeft /> Back to Home
        </Link>
      </header>

      {/* Main Two-Column Layout Container: Left Content, Right Form */}
      <div className="glass-split-container glass-split-register-container">
        {/* Left Side: Hero Content */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="login-hero-left"
          initial={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Floating Hero Decorative Glass Orbs */}
          <div className="hero-decor-orb hero-orb-1" />
          <div className="hero-decor-orb hero-orb-2" />

          <div className="login-hero-badge">
            <FiCompass className="badge-sparkle-icon" />
            <span>Welcome to MyJourney</span>
          </div>

          <h1 className="login-hero-headline">
            Join <span className="headline-accent">MyJourney</span>
          </h1>

          <p className="login-hero-subheading">
            Create your account and start discovering inspiring stories, practical insights, and ideas that help you grow every day.
          </p>

          <div className="login-hero-features">
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Personalized Reading</span>
            </div>
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Save Your Favorites</span>
            </div>
            <div className="hero-feature-item">
              <span className="feature-check-icon">✓</span>
              <span>Continue Across Devices</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Register Form Card */}
        <div className="login-hero-right">
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="auth-card register-card glass-login-card glass-register-card"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.45 }}
          >
            <div className="login-card-header">
              <h2 className="login-card-title">
                {registeredUser ? "Choose Verification" : "Create Account"}
              </h2>
              <p className="login-card-subtitle">
                {registeredUser
                  ? "Pick where your OTP should arrive."
                  : "Fill in the details below to get started."}
              </p>
            </div>

            {registeredUser ? (
              <div className="verification-choice">
                <FiCheckCircle className="choice-success-icon" />
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
              <form className="auth-form login-form-body register-form-body" onSubmit={handleSubmit}>
                <div className="register-field-row">
                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-first-name">
                      <span>
                        First Name <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <input
                        id="reg-first-name"
                        autoComplete="given-name"
                        autoFocus
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        placeholder="First Name"
                        value={form.firstName}
                        onBlur={() => markTouched("firstName")}
                        onChange={(event) => updateField("firstName", event.target.value)}
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <small className="field-error-text">{fieldErrors.firstName}</small>
                    )}
                  </div>

                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-last-name">
                      <span>
                        Last Name <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <input
                        id="reg-last-name"
                        autoComplete="family-name"
                        disabled={!isFirstNameValid}
                        aria-invalid={Boolean(fieldErrors.lastName)}
                        placeholder="Last Name"
                        value={form.lastName}
                        onFocus={() => {
                          if (!isFirstNameValid) markTouched("firstName");
                        }}
                        onBlur={() => markTouched("lastName")}
                        onChange={(event) => updateField("lastName", event.target.value)}
                      />
                    </div>
                    {fieldErrors.lastName && (
                      <small className="field-error-text">{fieldErrors.lastName}</small>
                    )}
                  </div>
                </div>

                <div className="register-field-row">
                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-email">
                      <span>
                        Email Address <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <input
                        id="reg-email"
                        autoComplete="email"
                        disabled={!isLastNameValid}
                        type="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        placeholder="example@email.com"
                        value={form.email}
                        onFocus={() => {
                          if (!isFirstNameValid) markTouched("firstName");
                          else if (!isLastNameValid) markTouched("lastName");
                        }}
                        onBlur={() => markTouched("email")}
                        onChange={(event) => updateField("email", event.target.value)}
                      />
                    </div>
                    {fieldErrors.email && (
                      <small className="field-error-text">{fieldErrors.email}</small>
                    )}
                  </div>

                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-mobile">
                      <span>
                        Mobile <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="mobile-input-wrapper">
                      <select
                        aria-label="Country Code"
                        className="country-code-select"
                        disabled={!isEmailValid}
                        value={form.countryCode}
                        onChange={(event) => updateField("countryCode", event.target.value)}
                      >
                        {ALL_COUNTRY_CODES.map((c) => (
                          <option key={`${c.country}-${c.code}`} value={c.code}>
                            {c.flag} {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="field-input-wrapper mobile-number-wrapper">
                        <input
                          id="reg-mobile"
                          autoComplete="tel-national"
                          disabled={!isEmailValid}
                          inputMode="numeric"
                          aria-invalid={Boolean(fieldErrors.mobile)}
                          placeholder="Mobile Number"
                          value={form.mobile}
                          onFocus={() => {
                            if (!isLastNameValid) markTouched("lastName");
                            else if (!isEmailValid) markTouched("email");
                          }}
                          onBlur={() => markTouched("mobile")}
                          onChange={(event) => updateField("mobile", event.target.value)}
                        />
                      </div>
                    </div>
                    {fieldErrors.mobile && (
                      <small className="field-error-text">{fieldErrors.mobile}</small>
                    )}
                  </div>
                </div>

                <div className="register-field-row">
                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-password">
                      <span>
                        Password <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <input
                        id="reg-password"
                        autoComplete="new-password"
                        disabled={!isMobileValid}
                        maxLength={64}
                        type={showPassword ? "text" : "password"}
                        aria-invalid={Boolean(fieldErrors.password)}
                        placeholder="••••••••"
                        value={form.password}
                        onFocus={() => {
                          if (!isEmailValid) markTouched("email");
                          else if (!isMobileValid) markTouched("mobile");
                          else setIsPasswordFocused(true);
                        }}
                        onBlur={() => {
                          setIsPasswordFocused(false);
                          markTouched("password");
                        }}
                        onChange={(event) => updateField("password", event.target.value)}
                      />
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="password-eye-btn"
                        disabled={!isMobileValid}
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
                    </div>
                    {fieldErrors.password && (
                      <small className="field-error-text">{fieldErrors.password}</small>
                    )}
                  </div>

                  <div className="login-field-group half-width">
                    <label className="field-label" htmlFor="reg-confirm-password">
                      <span>
                        Confirm Password <span className="required-star">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <input
                        id="reg-confirm-password"
                        autoComplete="new-password"
                        disabled={!isPasswordValid}
                        maxLength={64}
                        type={showConfirmPassword ? "text" : "password"}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onFocus={() => {
                          if (!isMobileValid) markTouched("mobile");
                          else if (!isPasswordValid) markTouched("password");
                        }}
                        onBlur={() => markTouched("confirmPassword")}
                        onChange={(event) =>
                          updateField("confirmPassword", event.target.value)
                        }
                      />
                      <button
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                        className="password-eye-btn"
                        disabled={!isPasswordValid}
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <small className="field-error-text">{fieldErrors.confirmPassword}</small>
                    )}
                  </div>
                </div>

                <div className="register-checkboxes-row">
                  <div className="checkbox-item-group">
                    <label className="custom-checkbox-wrap">
                      <input
                        checked={form.acceptTerms}
                        disabled={!isConfirmPasswordValid}
                        type="checkbox"
                        onChange={(event) => {
                          if (!isConfirmPasswordValid) {
                            markTouched(activeStep);
                            return;
                          }
                          updateField("acceptTerms", event.target.checked);
                          markTouched("acceptTerms");
                        }}
                      />
                      <span className="checkbox-box"></span>
                      <span className="checkbox-label-text">
                        I accept terms & privacy policy <span className="required-star">*</span>
                      </span>
                    </label>
                    {fieldErrors.acceptTerms && (
                      <small className="field-error-text">{fieldErrors.acceptTerms}</small>
                    )}
                  </div>

                  <div className="checkbox-item-group">
                    <label className="custom-checkbox-wrap">
                      <input
                        checked={form.newsletter}
                        type="checkbox"
                        onChange={(event) => updateField("newsletter", event.target.checked)}
                      />
                      <span className="checkbox-box"></span>
                      <span className="checkbox-label-text">Subscribe to Newsletter</span>
                    </label>
                  </div>
                </div>

                {message && <div className="auth-alert">{message}</div>}

                <button
                  className="login-action-btn"
                  disabled={isSubmitting || !isFormValid}
                  type="submit"
                >
                  <span>{isSubmitting ? "Creating..." : "Create Account"}</span>
                  <FiUserPlus className="btn-arrow-icon" />
                </button>

                <div className="auth-trust-message">
                  <FiShield className="trust-shield-icon" />
                  <span>Protected with industry-standard security.</span>
                </div>
              </form>
            )}

            <p className="auth-switch-text">
              Already have an account?{" "}
              <Link to="/login">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
};

export default Register;
