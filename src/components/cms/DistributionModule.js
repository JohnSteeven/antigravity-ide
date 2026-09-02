/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DistributionModule.js  —  Omnichannel Distribution & Marketing CMS Platform
 *  MyJourney CMS  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiSend, FiShare2, FiMic, FiRss, FiMail, FiCheckCircle,
  FiAlertCircle, FiPlus, FiZap, FiBarChart2, FiRadio
} from 'react-icons/fi';

export default function DistributionModule() {
  const [campaigns, setCampaigns] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [campRes, socRes, podRes] = await Promise.all([
        apiService.get('/api/distribution/campaigns').catch(() => null),
        apiService.get('/api/distribution/social/accounts').catch(() => null),
        apiService.get('/api/distribution/podcasts').catch(() => null),
      ]);

      if (campRes?.data) setCampaigns(campRes.data);
      if (socRes?.data) setSocialAccounts(socRes.data);
      if (podRes?.data) setPodcasts(podRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLaunchCampaign = async () => {
    try {
      await apiService.post('/api/distribution/campaigns', {
        title: `Omnichannel Launch #${campaigns.length + 1}`,
        type: 'article_launch',
        channels: ['social', 'email', 'push'],
      });
      notify('success', 'Omnichannel marketing campaign launched!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 4 · Omnichannel Platform</span>
          <h2>Distribution & Marketing Automation</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Manage social accounts, launch omnichannel campaigns, publish podcasts, and inspect RSS feeds.
          </p>
        </div>

        <button className="primary-btn" onClick={handleLaunchCampaign}>
          <FiZap /> Launch Omnichannel Campaign
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Campaigns</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>{campaigns.length}</div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Connected Social Channels</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4, color: 'var(--cms-accent)' }}>{socialAccounts.length}</div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Podcast Episodes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>{podcasts.length}</div>
        </div>
      </div>

      {/* Campaigns List */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiShare2 style={{ color: 'var(--cms-accent)' }} /> Active Marketing Campaigns ({campaigns.length})
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', background: 'var(--soft)', borderRadius: 12 }}>
          No marketing campaigns found. Click "Launch Omnichannel Campaign" to start one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {campaigns.map((c) => (
            <div key={c._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 18 }}>
              <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: 'var(--cms-accent)' }}>{c.type}</span>
              <h4 style={{ margin: '6px 0 4px', fontSize: '1rem' }}>{c.title}</h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8, display: 'flex', gap: 12 }}>
                <span>Channels: {c.channels?.join(', ')}</span>
                <span>Reach: {c.reach || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/distribution', component: DistributionModule, auth: true, permissions: ['content.publish'] });
registerSidebar({ key: 'distribution', label: 'Distribution & Marketing', icon: FiSend, path: '/cms/distribution', group: 'Stage 4: Reader Platform', order: 10 });
