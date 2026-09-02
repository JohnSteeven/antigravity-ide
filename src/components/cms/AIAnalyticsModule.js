/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIAnalyticsModule.js  —  AI Usage Analytics Dashboard
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiBarChart2, FiRefreshCw, FiCpu, FiDollarSign,
  FiClock, FiTrendingUp, FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';

const PROVIDER_COLORS = { openai: '#10a37f', gemini: '#4285f4', claude: '#d4a574', ollama: '#7c3aed' };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: color || 'var(--ink)' }}>{value}</div>
          {sub && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color ? `${color}20` : 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color: color || 'var(--cms-accent)' }} />
        </div>
      </div>
    </div>
  );
}

export default function AIAnalyticsModule() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [notification, setNotification] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/api/ai/analytics?days=${days}`);
      if (res?.data) setAnalytics(res.data);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const t = analytics?.totals || {};

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · AI Intelligence</span>
          <h2>AI Analytics</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Usage, cost, and performance metrics for all AI operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 140 }}>
            {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <button className="small-outline-btn" onClick={fetchAnalytics} disabled={loading}>
            <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /><span>{notification.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)' }}>
          <FiCpu size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 12 }} />
          <p>Loading AI analytics…</p>
        </div>
      ) : !analytics || analytics.totals.requests === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
          <FiBarChart2 size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px' }}>No AI usage yet</h3>
          <p style={{ margin: 0 }}>Configure a provider and start using the AI Writing Assistant to see analytics here.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard icon={FiCpu} label="Total Requests" value={t.requests?.toLocaleString() || 0} sub={`${t.successRate}% success rate`} />
            <StatCard icon={FiTrendingUp} label="Total Tokens" value={t.tokens?.toLocaleString() || 0} sub="Input + output" color="#4285f4" />
            <StatCard icon={FiDollarSign} label="Est. Cost (USD)" value={`$${t.estimatedCostUsd?.toFixed(4) || '0.0000'}`} sub={`Last ${days} days`} color="#10a37f" />
            <StatCard icon={FiClock} label="Avg. Latency" value={`${t.avgLatencyMs?.toLocaleString() || 0}ms`} sub="Per request" />
            {t.acceptanceRate !== null && (
              <StatCard icon={FiCheckCircle} label="AI Acceptance" value={`${t.acceptanceRate}%`} sub="Output accepted by editors" color="#7c3aed" />
            )}
          </div>

          {/* Provider breakdown */}
          {analytics.byProvider?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Usage by Provider</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {analytics.byProvider.map((p) => (
                  <div key={p._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: PROVIDER_COLORS[p._id] || '#888' }} />
                      <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p._id}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>REQUESTS</div><div style={{ fontWeight: 700 }}>{p.requests?.toLocaleString()}</div></div>
                      <div><div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>TOKENS</div><div style={{ fontWeight: 700 }}>{p.tokens?.toLocaleString()}</div></div>
                      <div><div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>EST. COST</div><div style={{ fontWeight: 700 }}>${p.costUsd?.toFixed(4)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action breakdown */}
          {analytics.byAction?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Top Actions</h3>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--soft)' }}>
                      {['Action', 'Requests', 'Avg Tokens'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byAction.map((a, i) => (
                      <tr key={a._id} style={{ borderTop: '1px solid var(--line)', background: i % 2 === 0 ? 'transparent' : 'var(--soft)' }}>
                        <td style={{ padding: '10px 14px', fontSize: '0.85rem', fontFamily: 'monospace' }}>{a._id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{a.count}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{Math.round(a.avgTokens)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily volume chart (simple bar) */}
          {analytics.dailyVolume?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Daily Request Volume</h3>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {analytics.dailyVolume.map((d) => {
                    const max = Math.max(...analytics.dailyVolume.map((x) => x.requests));
                    const pct = max > 0 ? (d.requests / max) * 100 : 0;
                    return (
                      <div key={d._id} title={`${d._id}: ${d.requests} requests`} style={{ flex: 1, minWidth: 4, height: `${Math.max(pct, 4)}%`, background: 'var(--cms-accent)', borderRadius: '3px 3px 0 0', opacity: 0.8, cursor: 'pointer' }} />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--muted)' }}>
                  <span>{analytics.dailyVolume[0]?._id}</span>
                  <span>{analytics.dailyVolume[analytics.dailyVolume.length - 1]?._id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent errors */}
          {analytics.recentErrors?.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#9d3e32' }}>Recent Errors</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics.recentErrors.map((e, i) => (
                  <div key={i} style={{ background: '#fdf1f0', border: '1px solid #f5c5c0', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9d3e32' }}>{e.provider} · {e.action}</span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#9d3e32' }}>{e.errorMessage}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/ai/analytics', component: AIAnalyticsModule, auth: true, permissions: ['ai.manage'] });
registerSidebar({ key: 'ai-analytics', label: 'AI Analytics', icon: FiBarChart2, path: '/cms/ai/analytics', group: 'Stage 3: AI Intelligence', order: 4 });
