import { useState } from "react";
import { FiMail, FiPhone, FiRefreshCw, FiShield, FiX } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

const initialState = {
  kind: "email",
  value: "",
  reauthMethod: "password",
  credential: "",
  code: "",
};

const IdentityChangePanel = () => {
  const {
    user,
    startIdentityChange,
    resendIdentityChange,
    cancelIdentityChange,
    verifyIdentityChange,
  } = useAuth();
  const [form, setForm] = useState(initialState);
  const [challenge, setChallenge] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const resetChallenge = () => {
    setChallenge(null);
    setForm((current) => ({ ...current, credential: "", code: "", value: "" }));
  };

  const describeChallenge = (next) => {
    const dev = next.devCode ? ` Development code: ${next.devCode}` : "";
    return `${next.message || "Verification code requested."}${dev}`;
  };

  const handleStart = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await startIdentityChange({
        kind: form.kind,
        value: form.value,
        reauth: { method: form.reauthMethod, credential: form.credential },
      });
      setChallenge(result.challenge);
      setMessage(describeChallenge(result.challenge));
      update("credential", "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await verifyIdentityChange(challenge.id, form.code);
      resetChallenge();
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await resendIdentityChange(challenge.id);
      setChallenge(result.challenge);
      setMessage(describeChallenge(result.challenge));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await cancelIdentityChange(challenge.id);
      resetChallenge();
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="edit-profile-form" aria-labelledby="identity-change-title">
      <div>
        <span className="section-kicker">Account security</span>
        <h2 id="identity-change-title">Email and mobile</h2>
        <p>
          Identity changes require your password or authenticator, then a code sent to the new address or number.
          Completing a change signs out your other sessions.
        </p>
      </div>

      <dl className="identity-current-values">
        <div><dt>Current email</dt><dd>{user.email}</dd></div>
        <div><dt>Current mobile</dt><dd>{user.mobile}</dd></div>
      </dl>

      {!challenge ? (
        <form onSubmit={handleStart}>
          <fieldset disabled={busy}>
            <legend>Start a secure identity change</legend>
            <div className="form-grid two">
              <label>
                Identity to change
                <select
                  value={form.kind}
                  onChange={(event) => {
                    setForm({ ...initialState, kind: event.target.value });
                    setMessage("");
                  }}
                >
                  <option value="email">Email address</option>
                  <option value="mobile">Mobile number</option>
                </select>
              </label>
              <label>
                New {form.kind === "email" ? "email address" : "mobile number"}
                <input
                  required
                  type={form.kind === "email" ? "email" : "tel"}
                  inputMode={form.kind === "email" ? "email" : "tel"}
                  autoComplete={form.kind === "email" ? "email" : "tel"}
                  placeholder={form.kind === "email" ? "name@example.com" : "+14155552671"}
                  value={form.value}
                  onChange={(event) => update("value", event.target.value)}
                />
              </label>
            </div>
            <div className="form-grid two">
              <label>
                Reauthenticate with
                <select value={form.reauthMethod} onChange={(event) => update("reauthMethod", event.target.value)}>
                  <option value="password">Password</option>
                  {user.twoFactor?.enabled && <option value="totp">Authenticator code</option>}
                </select>
              </label>
              <label>
                {form.reauthMethod === "password" ? "Current password" : "Current authenticator code"}
                <input
                  required
                  type={form.reauthMethod === "password" ? "password" : "text"}
                  inputMode={form.reauthMethod === "totp" ? "numeric" : undefined}
                  autoComplete={form.reauthMethod === "password" ? "current-password" : "one-time-code"}
                  value={form.credential}
                  onChange={(event) => update("credential", event.target.value)}
                />
              </label>
            </div>
            <button className="primary-btn" disabled={busy} type="submit">
              {form.kind === "email" ? <FiMail /> : <FiPhone />}
              {busy ? "Requesting…" : "Send verification code"}
            </button>
          </fieldset>
        </form>
      ) : (
        <form onSubmit={handleVerify}>
          <fieldset disabled={busy}>
            <legend>Verify the new {challenge.kind}</legend>
            <p>A six-digit code was requested for {challenge.maskedIdentifier}.</p>
            <label>
              Verification code
              <input
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength="6"
                value={form.code}
                onChange={(event) => update("code", event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>
            <div className="identity-change-actions">
              <button className="primary-btn" disabled={busy || form.code.length !== 6} type="submit">
                <FiShield /> {busy ? "Verifying…" : "Verify and update"}
              </button>
              <button className="secondary-btn" disabled={busy} type="button" onClick={handleResend}>
                <FiRefreshCw /> Resend code
              </button>
              <button className="secondary-btn" disabled={busy} type="button" onClick={handleCancel}>
                <FiX /> Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {message && <div className="auth-alert" role="status" aria-live="polite">{message}</div>}
    </section>
  );
};

export default IdentityChangePanel;
