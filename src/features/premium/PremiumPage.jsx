import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { membershipApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import "./premium.css";

const FALLBACK_DURATIONS = [
  { billingPeriodMonths: 1, displayLabel: "1 Month" },
  { billingPeriodMonths: 3, displayLabel: "3 Months" },
  { billingPeriodMonths: 6, displayLabel: "6 Months" },
  { billingPeriodMonths: 12, displayLabel: "1 Year" },
];

export default function PremiumPage() {
  const { isAuthenticated, accountAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    membershipApi.catalog().then((response) => setCatalog(response?.data || null)).catch(() => setCatalog(null));
  }, []);

  const durations = catalog?.durations || FALLBACK_DURATIONS;
  const isPremium = accountAccess?.plan === "premium";

  const moveDurationSelection = (event, index) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? durations.length - 1
        : (index + direction + durations.length) % durations.length;
    setSelected(durations[nextIndex].billingPeriodMonths);
    event.currentTarget.parentElement?.querySelectorAll("button")[nextIndex]?.focus();
  };

  const continueSelection = async () => {
    if (!selected) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await membershipApi.selectDuration(selected);
    } catch (error) {
      setMessage(error.code === "BILLING_PROVIDER_UNAVAILABLE"
        ? "Billing is not configured yet. Your selection did not change your account."
        : error.message || "Billing is currently unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="premium-page">
      <section className="premium-hero" aria-labelledby="premium-heading">
        <p className="premium-kicker">MyJourney Premium</p>
        <h1 id="premium-heading">One membership for more of your journey.</h1>
        <p>Premium Articles, Premium Stories, MyJourney Life, deeper insights, and future included experiences—all under one membership.</p>
        {isPremium && <Link className="premium-text-action" to="/profile/subscription">View your Premium membership</Link>}
      </section>

      <section className="premium-benefits" aria-labelledby="premium-includes-heading">
        <h2 id="premium-includes-heading">Included with Premium</h2>
        <ul>
          {(catalog?.product?.benefits || ["Premium Articles", "Premium Stories", "MyJourney Life", "Advanced Life insights", "Future included Premium experiences"])
            .map((benefit) => <li key={benefit}>{benefit}</li>)}
        </ul>
      </section>

      <section className="premium-duration-section" aria-labelledby="premium-duration-heading">
        <div>
          <p className="premium-kicker">Choose your membership duration</p>
          <h2 id="premium-duration-heading">Same Premium access. Choose how long.</h2>
          <p>Duration affects the billing period and renewal date—not which Premium experiences you receive.</p>
        </div>
        <div className="premium-duration-grid" role="radiogroup" aria-label="Premium membership duration">
          {durations.map((duration, index) => {
            const active = selected === duration.billingPeriodMonths;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active || (selected === null && index === 0) ? 0 : -1}
                className={active ? "is-selected" : ""}
                key={duration.billingPeriodMonths}
                onClick={() => setSelected(duration.billingPeriodMonths)}
                onKeyDown={(event) => moveDurationSelection(event, index)}
              >
                <strong>{duration.displayLabel}</strong>
                <span>{duration.priceConfigured ? "Configured price" : "Price not configured"}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="premium-primary-action" disabled={!selected || busy} onClick={continueSelection}>
          {busy ? "Checking billing…" : "Continue"}
        </button>
        <p className="premium-provider-note">No payment will be taken while billing is unconfigured.</p>
        {message && <p className="premium-status" role="status">{message}</p>}
      </section>
    </main>
  );
}
