/**
 * CMS visibility for the account-level MyJourney Premium product.
 * Billing remains provider-independent; this view never invents prices or
 * presents a provider selector while checkout is unconfigured.
 */

import React, { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCreditCard } from "react-icons/fi";
import apiService from "../../services/apiService";
import { registerRoute } from "../../core/registerRoute";
import { registerSidebar } from "../../core/registerSidebar";

const metricValue = (configured, value) => configured ? value : "Not configured";

export default function MembershipModule() {
  const [catalog, setCatalog] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = useCallback((type, text) => {
    setNotification({ type, text });
    window.setTimeout(() => setNotification(null), 5000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogResponse, revenueResponse] = await Promise.all([
        apiService.get("/api/membership/plans"),
        apiService.get("/api/membership/revenue").catch(() => null),
      ]);
      setCatalog(catalogResponse?.data || null);
      setRevenue(revenueResponse?.data || null);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revenueConfigured = Boolean(revenue?.revenueConfigured);
  const billingConfigured = Boolean(catalog?.billing?.providerConfigured);
  const durations = Array.isArray(catalog?.durations) ? catalog.durations : [];

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Account-level membership</span>
          <h2>MyJourney Premium</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
            One Premium product with identical access at every supported billing duration.
          </p>
        </div>
        <span className="cms-badge">
          Billing: {billingConfigured ? "Configured" : "Not configured"}
        </span>
      </div>

      {notification && (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, background: "#fdf1f0", color: "#9d3e32" }}>
          <FiAlertCircle aria-hidden="true" /> <span>{notification.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>Monthly recurring revenue</div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: 4 }}>{metricValue(revenueConfigured, revenue?.mrr)}</div>
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>Annual run rate</div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: 4 }}>{metricValue(revenueConfigured, revenue?.arr)}</div>
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>Accounts with Premium access</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: 4 }}>{revenue?.activeSubscribers ?? "—"}</div>
        </div>
      </div>

      <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Supported durations</h3>
      {loading ? (
        <div role="status" style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Loading Premium catalog…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {durations.map((duration) => (
            <div key={duration.billingPeriodMonths} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "1.1rem" }}>{duration.displayLabel}</h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                Full MyJourney Premium entitlement set
              </p>
              <p style={{ margin: "12px 0 0", fontSize: "0.78rem", fontWeight: 700 }}>
                {duration.priceConfigured ? "Price configured" : "Price not configured"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

registerRoute({ path: "/cms/membership", component: MembershipModule, auth: true, permissions: ["settings.manage"] });
registerSidebar({ key: "membership", label: "Membership & Monetization", icon: FiCreditCard, path: "/cms/membership", group: "Stage 4: Reader Platform", order: 8 });
