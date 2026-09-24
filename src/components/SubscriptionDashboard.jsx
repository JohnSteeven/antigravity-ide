import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { membershipApi } from "../services/apiService";
import useDialogFocus from "../hooks/useDialogFocus";

const labelForDuration = (months) => ({ 1: "1 Month", 3: "3 Months", 6: "6 Months", 12: "1 Year" }[months] || "Not available");
const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function SubscriptionDashboard() {
  const { accountAccess, accessLoading, accessError, refreshEntitlements } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const confirmationRef = useRef(null);
  const premiumActive = accountAccess?.plan === "premium";
  const cancelPending = Boolean(accountAccess?.cancelAtPeriodEnd);
  const expired = accountAccess?.subscriptionStatus === "expired" || accountAccess?.accessReason === "period_expired";
  const prepaid = accountAccess?.billingMode === "prepaid_term";

  // Visiting the account page fetches current server dates/status after payment.
  useEffect(() => { refreshEntitlements(); }, []);

  useDialogFocus({
    open: confirming,
    containerRef: confirmationRef,
    onClose: () => setConfirming(false),
    escapeEnabled: !busy,
  });

  const cancelRenewal = async () => {
    setBusy(true);
    setMessage("");
    try {
      await membershipApi.cancelRenewal();
      await refreshEntitlements();
      setConfirming(false);
      setMessage("Renewal has been canceled. Premium remains available through the current paid period.");
    } catch (error) {
      setMessage(error.message || "Subscription management is currently unavailable.");
    } finally {
      setBusy(false);
    }
  };

  if (accessLoading) return <main className="premium-account"><p role="status">Loading membership…</p></main>;

  return (
    <main className="premium-account">
      <section className="premium-account__card" aria-labelledby="membership-heading">
        <p className="premium-kicker">Account membership</p>
        <h1 id="membership-heading">{premiumActive ? "MyJourney Premium" : "MyJourney Free"}</h1>
        {accessError && <p className="premium-status" role="alert">Subscription state is unavailable. Premium features remain securely locked until it can be verified.</p>}
        {accountAccess?.paymentIssue && <p className="premium-status" role="status">A payment attempt failed. Previously paid access remains available until its expiry date.</p>}

        {premiumActive ? (
          <>
            {accountAccess?.entitlementSource === "qa_override" ? (
              <>
                <p className="premium-account__state">QA Premium Override</p>
                <p>Platform-wide Premium access is granted for development and QA testing. No paid subscription or billing charges exist.</p>
              </>
            ) : (
              <>
                <p className="premium-account__state">{cancelPending ? "Renewal canceled" : "Active"}</p>
                <dl>
                  <div><dt>Current membership</dt><dd>{labelForDuration(accountAccess.billingPeriodMonths)}</dd></div>
                  <div><dt>Started</dt><dd>{formatDate(accountAccess.startedAt)}</dd></div>
                  <div><dt>Access until</dt><dd>{formatDate(accountAccess.currentPeriodEnd)}</dd></div>
                  <div><dt>Billing</dt><dd>{prepaid ? "Prepaid — no automatic renewal" : "Automatic renewal status unavailable"}</dd></div>
                </dl>
                {prepaid && <Link className="premium-primary-action" to="/premium">Renew Premium</Link>}
                {cancelPending ? (
                  <p>Your Premium access remains active until the date above. Your private MyJourney Life history is not deleted.</p>
                ) : accountAccess.cancellationAvailable && !prepaid ? (
                  <button type="button" className="premium-secondary-action" onClick={() => setConfirming(true)}>Cancel renewal</button>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            <p>{expired ? "Your previous Premium period has ended." : "Your account includes MyJourney's free experiences."}</p>
            {accountAccess?.nextAccessStart && <p>Your next paid Premium period starts {formatDate(accountAccess.nextAccessStart)}.</p>}
            <p>Your private Life history remains associated with this account and returns when Premium access is restored.</p>
            <Link className="premium-primary-action" to="/premium">Explore Premium</Link>
          </>
        )}
        {message && <p className="premium-status" role="status">{message}</p>}
      </section>

      {confirming && (
        <div className="premium-dialog-backdrop">
          <section ref={confirmationRef} className="premium-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-premium-heading" tabIndex="-1">
            <h2 id="cancel-premium-heading">Cancel renewal?</h2>
            <p>Your MyJourney Premium access will continue until {formatDate(accountAccess.currentPeriodEnd)}. After that, Premium experiences will lock unless you renew.</p>
            <p>Your private MyJourney Life history will not be deleted.</p>
            <div className="premium-actions">
              <button type="button" className="premium-primary-action" onClick={() => setConfirming(false)} autoFocus>Keep Premium</button>
              <button type="button" className="premium-secondary-action" onClick={cancelRenewal} disabled={busy}>{busy ? "Canceling…" : "Cancel renewal"}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
