/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RecommendationModule.js  —  Recommendation Engine Config & Preview
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiLayers, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiSliders,
  FiBookOpen, FiEye, FiHeart, FiTrendingUp
} from 'react-icons/fi';

export default function RecommendationModule() {
  const [strategy, setStrategy] = useState('recommended');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`/api/recommendations?strategy=${strategy}&limit=6`);
      if (res?.data) {
        setRecommendations(res.data);
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [strategy]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · Content Intelligence</span>
          <h2>Recommendation Engine</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Configure and preview article recommendation strategies for readers.
          </p>
        </div>

        <button className="primary-btn" onClick={fetchRecommendations} disabled={loading}>
          <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Test Engine
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Strategy Picker */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { id: 'recommended', label: 'Recommended For You', desc: 'Featured & high engagement articles' },
          { id: 'popular', label: 'Popular In Category', desc: 'Ranked by views and likes' },
          { id: 'related', label: 'Related Content', desc: 'Tag and category overlap scoring' },
        ].map((s) => (
          <div
            key={s.id}
            onClick={() => setStrategy(s.id)}
            style={{
              flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer',
              border: strategy === s.id ? '2px solid var(--cms-accent)' : '1px solid var(--line)',
              background: strategy === s.id ? 'var(--panel)' : 'var(--soft)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Preview Grid */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Engine Results Preview ({recommendations.length})</h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
          <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p>Calculating recommendation scores...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          No recommended articles found for this strategy.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {recommendations.map((item) => (
            <div key={item._id || item.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4, width: 'fit-content', fontWeight: 600, color: 'var(--cms-accent)' }}>
                {item.category || 'General'}
              </span>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.description || item.excerpt || 'No excerpt'}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8, fontSize: '0.75rem', color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiEye size={12} /> {item.views || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiHeart size={12} /> {item.likes || 0}</span>
                {item.recommendationScore && (
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#2e7d5a' }}>
                    Score: {item.recommendationScore}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/ai/recommendations', component: RecommendationModule, auth: true, permissions: ['content.read'] });
registerSidebar({ key: 'ai-recommendations', label: 'Recommendation Engine', icon: FiLayers, path: '/cms/ai/recommendations', group: 'Stage 3: AI Intelligence', order: 7 });
