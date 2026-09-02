/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIProviderModule.js  —  AI Provider Configuration Dashboard
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiCpu, FiCheckCircle, FiAlertCircle, FiZap, FiSettings,
  FiTrash2, FiEdit2, FiPlusCircle, FiActivity, FiShield,
} from 'react-icons/fi';

const PROVIDER_META = {
  openai: { label: 'OpenAI', color: '#10a37f', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o-mini'] },
  gemini: { label: 'Google Gemini', color: '#4285f4', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'] },
  claude: { label: 'Anthropic Claude', color: '#d4a574', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'] },
  ollama: { label: 'Ollama (Local)', color: '#7c3aed', models: ['llama3', 'llama3.1', 'mistral', 'phi3', 'deepseek-r1'] },
};

const EMPTY_FORM = {
  name: '', provider: 'openai', model: '', apiKey: '', baseUrl: '',
  temperature: 0.7, maxTokens: 2048, timeoutMs: 30000, retryCount: 2,
  dailyTokenLimit: 0, monthlyTokenLimit: 0,
  costPerInputToken: 0, costPerOutputToken: 0, notes: '',
};

export default function AIProviderModule() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState({});

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/ai/providers');
      if (res?.data) setProviders(res.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiService.patch(`/api/ai/providers/${editingId}`, form);
        notify('success', 'Provider updated.');
      } else {
        await apiService.post('/api/ai/providers', form);
        notify('success', 'Provider added.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchProviders();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      await apiService.post(`/api/ai/providers/${id}/activate`);
      notify('success', 'Provider activated.');
      fetchProviders();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    setTestResult((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await apiService.post(`/api/ai/providers/${id}/test`);
      setTestResult((prev) => ({ ...prev, [id]: res }));
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, error: err.message } }));
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this provider? This cannot be undone.')) return;
    try {
      await apiService.delete(`/api/ai/providers/${id}`);
      notify('success', 'Provider deleted.');
      fetchProviders();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, provider: p.provider, model: p.model || '',
      apiKey: '', baseUrl: p.baseUrl || '',
      temperature: p.temperature, maxTokens: p.maxTokens,
      timeoutMs: p.timeoutMs || 30000, retryCount: p.retryCount || 2,
      dailyTokenLimit: p.dailyTokenLimit || 0, monthlyTokenLimit: p.monthlyTokenLimit || 0,
      costPerInputToken: p.costPerInputToken || 0, costPerOutputToken: p.costPerOutputToken || 0,
      notes: p.notes || '',
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const meta = PROVIDER_META[form.provider] || {};

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · AI Intelligence</span>
          <h2>AI Provider Manager</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Configure OpenAI, Gemini, Claude, or Ollama. Only one provider is active at a time.
          </p>
        </div>
        <button className="primary-btn" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
          <FiPlusCircle /> Add Provider
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Providers Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading providers...</div>
      ) : providers.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          <FiCpu size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No AI providers configured yet.</p>
          <button className="primary-btn" onClick={() => setShowForm(true)}>Add Your First Provider</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {providers.map((p) => {
            const pmeta = PROVIDER_META[p.provider] || {};
            const tr = testResult[p._id];
            return (
              <div key={p._id} style={{ background: 'var(--panel)', border: p.isActive ? `2px solid ${pmeta.color || 'var(--cms-accent)'}` : '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${pmeta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiCpu style={{ color: pmeta.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{pmeta.label} · {p.model || 'No model set'}</div>
                    </div>
                  </div>
                  {p.isActive && (
                    <span style={{ fontSize: '0.7rem', background: `${pmeta.color}20`, color: pmeta.color, padding: '2px 10px', borderRadius: 100, fontWeight: 700 }}>ACTIVE</span>
                  )}
                </div>

                {/* Usage stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Total Tokens', value: (p.totalTokensUsed || 0).toLocaleString() },
                    { label: 'Est. Cost', value: `$${(p.estimatedTotalCostUsd || 0).toFixed(4)}` },
                    { label: 'Daily Used', value: (p.dailyTokensUsed || 0).toLocaleString() },
                    { label: 'Monthly Used', value: (p.monthlyTokensUsed || 0).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--soft)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Test result */}
                {tr && (
                  <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', background: tr.success ? '#e8f5ee' : '#fdf1f0', color: tr.success ? '#2e7d5a' : '#9d3e32' }}>
                    {tr.success ? `✓ Connected: ${tr.response}` : `✗ ${tr.error}`}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!p.isActive && (
                    <button className="primary-btn" style={{ flex: 1, fontSize: '0.78rem', padding: '6px 12px' }} onClick={() => handleActivate(p._id)}>
                      <FiZap /> Activate
                    </button>
                  )}
                  <button className="small-outline-btn" onClick={() => handleTest(p._id)} disabled={testing === p._id}>
                    <FiActivity /> {testing === p._id ? 'Testing…' : 'Test'}
                  </button>
                  <button className="small-outline-btn" onClick={() => openEdit(p)}><FiEdit2 /></button>
                  {!p.isActive && (
                    <button className="small-outline-btn" style={{ color: '#9d3e32' }} onClick={() => handleDelete(p._id)}><FiTrash2 /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Drawer */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 480, background: 'var(--panel)', height: '100%', padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Provider' : 'Add AI Provider'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Display Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. OpenAI Production" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Provider *</label>
                  <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value, model: '' })}>
                    {Object.entries(PROVIDER_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Model *</label>
                  <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
                    <option value="">-- Select --</option>
                    {(PROVIDER_META[form.provider]?.models || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                  {form.model === '__custom__' && (
                    <input style={{ marginTop: 6 }} placeholder="Enter model name" onChange={(e) => setForm({ ...form, model: e.target.value })} />
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  API Key {form.provider === 'ollama' ? '(not required for local)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={editingId ? 'Leave blank to keep existing key' : 'sk-…'}
                  required={!editingId && form.provider !== 'ollama'}
                />
              </div>

              {(form.provider === 'ollama' || form.baseUrl) && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Base URL</label>
                  <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="http://localhost:11434" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Temperature</label>
                  <input type="number" min={0} max={2} step={0.1} value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Max Tokens</label>
                  <input type="number" min={256} max={128000} value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Daily Token Limit <span style={{ color: 'var(--muted)' }}>(0=unlimited)</span></label>
                  <input type="number" min={0} value={form.dailyTokenLimit} onChange={(e) => setForm({ ...form, dailyTokenLimit: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Monthly Token Limit</label>
                  <input type="number" min={0} value={form.monthlyTokenLimit} onChange={(e) => setForm({ ...form, monthlyTokenLimit: parseInt(e.target.value) })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this provider config" />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--line)', marginTop: 'auto' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editingId ? 'Save Changes' : 'Add Provider'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/ai/providers', component: AIProviderModule, auth: true, permissions: ['ai.manage'] });
registerSidebar({ key: 'ai-providers', label: 'AI Provider Manager', icon: FiCpu, path: '/cms/ai/providers', group: 'Stage 3: AI Intelligence', order: 1 });
