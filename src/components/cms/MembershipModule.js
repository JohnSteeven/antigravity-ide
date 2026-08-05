/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MembershipModule.js  —  CMS Membership & Revenue Management Platform
 *  MyJourney CMS  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiDollarSign, FiCreditCard, FiTrendingUp, FiUsers, FiCheckCircle,
  FiAlertCircle, FiPlusCircle, FiEdit2, FiLock, FiTag, FiRefreshCw, FiZap
} from 'react-icons/fi';

export default function MembershipModule() {
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [provider, setProvider] = useState('stripe');

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, revRes] = await Promise.all([
        apiService.get('/api/membership/plans'),
        apiService.get('/api/membership/revenue').catch(() => null),
      ]);

      if (plansRes?.data) setPlans(plansRes.data);
      if (revRes?.data) setRevenue(revRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 4 · Monetization Platform</span>
          <h2>Membership & Revenue Management</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Configure plans, payment providers, pricing, coupons, and monitor subscription revenue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8 }}>
            <option value="stripe">Payment Provider: Stripe</option>
            <option value="lemonsqueezy">Payment Provider: LemonSqueezy</option>
            <option value="paddle">Payment Provider: Paddle</option>
          </select>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Revenue KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Monthly Recurring Revenue (MRR)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#10b981' }}>${revenue?.mrr || 0}</div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Annual Run Rate (ARR)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>${revenue?.arr || 0}</div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Subscribers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{revenue?.activeSubscribers || 0}</div>
        </div>
      </div>

      {/* Plans List */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Active Membership Plans ({plans.length})</h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading plans...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {plans.map((p) => (
            <div key={p._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: 'var(--cms-accent)' }}>{p.currency} {p.monthlyPrice}/mo</span>
                <h4 style={{ margin: '6px 0 2px', fontSize: '1.1rem' }}>{p.name}</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>{p.description}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, fontSize: '0.8rem' }}>
                <strong>Features:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--muted)' }}>
                  {p.features?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/membership', component: MembershipModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'membership', label: 'Membership & Monetization', icon: FiCreditCard, path: '/cms/membership', group: 'Stage 4: Reader Platform', order: 8 });
