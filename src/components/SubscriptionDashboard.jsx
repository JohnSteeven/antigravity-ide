/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SubscriptionDashboard.jsx  —  Reader Subscription & Plan Manager
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import {
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiStar,
  FiZap, FiShield, FiCheck, FiRefreshCw
} from 'react-icons/fi';

export default function SubscriptionDashboard() {
  const [plans, setPlans] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, memRes] = await Promise.all([
        apiService.get('/api/membership/plans'),
        apiService.get('/api/membership/me').catch(() => null),
      ]);

      if (plansRes?.data) setPlans(plansRes.data);
      if (memRes?.data) setMembership(memRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleSubscribe = async (planSlug) => {
    setUpgrading(planSlug);
    try {
      const res = await apiService.post('/api/membership/subscribe', { planSlug });
      if (res?.data) {
        notify('success', `Subscribed to ${planSlug.toUpperCase()} plan!`);
        fetchSubscriptionData();
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You will maintain access until the end of your billing cycle.')) return;
    try {
      await apiService.post('/api/membership/cancel');
      notify('success', 'Subscription canceled.');
      fetchSubscriptionData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading Subscription Details...</div>;
  }

  const currentSlug = membership?.planSlug || 'free';

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 960 }}>
      {/* Active Membership Status Header */}
      <div style={{ background: 'var(--panel, #1f2022)', borderRadius: 16, border: '1px solid var(--line, #333)', padding: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--cms-accent, #426c67)', fontWeight: 700 }}>MEMBERSHIP</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.6rem' }}>My Subscription</h1>
            <div style={{ color: 'var(--muted, #888)', fontSize: '0.88rem', marginTop: 4 }}>
              Active Plan: <strong style={{ color: 'var(--ink, #fff)', textTransform: 'capitalize' }}>{currentSlug} Plan</strong>
              {membership?.billingStatus === 'trialing' && <span style={{ color: '#f59e0b', marginLeft: 8 }}>(Trial Active)</span>}
            </div>
          </div>

          {currentSlug !== 'free' && (
            <button type="button" className="small-outline-btn" style={{ color: '#ef4444', borderColor: '#ef444450' }} onClick={handleCancel}>
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#10b98120' : '#ef444420', color: notification.type === 'success' ? '#10b981' : '#ef4444' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Plans Comparison */}
      <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', textAlign: 'center' }}>Choose Your Membership Tier</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {plans.map((p) => {
          const isCurrent = currentSlug === p.slug;
          return (
            <div
              key={p._id}
              style={{
                background: 'var(--panel, #1f2022)',
                border: isCurrent ? '2px solid var(--cms-accent, #426c67)' : '1px solid var(--line, #333)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name}</h4>
                  {isCurrent && <span style={{ fontSize: '0.68rem', background: 'var(--cms-accent, #426c67)', color: '#fff', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>CURRENT</span>}
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>
                  ${p.monthlyPrice} <span style={{ fontSize: '0.8rem', color: 'var(--muted, #888)', fontWeight: 400 }}>/ mo</span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--muted, #888)' }}>{p.description}</p>

                <div style={{ borderTop: '1px solid var(--line, #333)', paddingTop: 12, marginBottom: 20 }}>
                  {p.features?.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', marginBottom: 6 }}>
                      <FiCheck style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={isCurrent ? 'secondary-btn' : 'primary-btn'}
                disabled={isCurrent || upgrading === p.slug}
                onClick={() => handleSubscribe(p.slug)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {upgrading === p.slug ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : isCurrent ? 'Active Plan' : `Upgrade to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
