/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PromptManagerModule.js  —  AI Prompt Template Manager
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiFileText, FiPlusCircle, FiEdit2, FiTrash2,
  FiCheckCircle, FiAlertCircle, FiSave, FiLock,
} from 'react-icons/fi';

const CATEGORIES = ['writing', 'seo', 'rewrite', 'summarize', 'social', 'custom'];
const ACTIONS = [
  'generate', 'rewrite', 'expand', 'shorten', 'improve_readability',
  'improve_grammar', 'improve_tone', 'suggest_headings', 'suggest_faqs',
  'generate_summary', 'generate_excerpt', 'suggest_tags', 'suggest_categories',
  'seo_meta', 'seo_keywords', 'seo_internal_links', 'custom',
];

const EMPTY_FORM = {
  name: '', key: '', description: '', category: 'writing', action: 'generate',
  systemPrompt: '', userPromptTemplate: '', variables: '',
  temperature: '', maxTokens: '',
};

const CATEGORY_COLORS = {
  writing: '#426c67', seo: '#4285f4', rewrite: '#d97706',
  summarize: '#7c3aed', social: '#e11d48', custom: '#6b7280',
};

export default function PromptManagerModule() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewVars, setPreviewVars] = useState({});

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/ai/prompts');
      if (res?.data) setTemplates(res.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        variables: form.variables.split(',').map((v) => v.trim()).filter(Boolean),
        temperature: form.temperature !== '' ? parseFloat(form.temperature) : null,
        maxTokens: form.maxTokens !== '' ? parseInt(form.maxTokens) : null,
      };
      if (editingId) {
        await apiService.patch(`/api/ai/prompts/${editingId}`, payload);
        notify('success', 'Template updated.');
      } else {
        await apiService.post('/api/ai/prompts', payload);
        notify('success', 'Template created.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchTemplates();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await apiService.delete(`/api/ai/prompts/${id}`);
      notify('success', 'Template deleted.');
      fetchTemplates();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, key: t.key, description: t.description || '',
      category: t.category, action: t.action,
      systemPrompt: t.systemPrompt || '', userPromptTemplate: t.userPromptTemplate,
      variables: (t.variables || []).join(', '),
      temperature: t.temperature ?? '', maxTokens: t.maxTokens ?? '',
    });
    setEditingId(t._id);
    setShowForm(true);
  };

  const filtered = templates.filter((t) => {
    const matchCat = filter === 'all' || t.category === filter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.key.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Live preview
  const previewOutput = form.userPromptTemplate
    ? form.userPromptTemplate.replace(/\{\{(\w+)\}\}/g, (_, k) => previewVars[k] ? `[${previewVars[k]}]` : `{{${k}}}`)
    : '';

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · AI Intelligence</span>
          <h2>Prompt Template Manager</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Create reusable prompt templates. Use {`{{variable}}`} syntax for dynamic content.
          </p>
        </div>
        <button className="primary-btn" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
          <FiPlusCircle /> New Template
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            style={{
              padding: '5px 14px', borderRadius: 100, border: '1px solid', cursor: 'pointer', fontSize: '0.78rem',
              background: filter === c ? 'var(--cms-accent)' : 'transparent',
              borderColor: filter === c ? 'var(--cms-accent)' : 'var(--line)',
              color: filter === c ? '#fff' : 'var(--ink)',
            }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.8rem' }}>{filtered.length} templates</span>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading templates…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((t) => (
            <div key={t._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.68rem', background: `${CATEGORY_COLORS[t.category] || '#6b7280'}20`, color: CATEGORY_COLORS[t.category] || '#6b7280', padding: '2px 8px', borderRadius: 100, fontWeight: 700, textTransform: 'uppercase' }}>{t.category}</span>
                    {t.isBuiltIn && <span style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}><FiLock size={10} /> Built-in</span>}
                  </div>
                  <h4 style={{ margin: '6px 0 2px', fontSize: '0.9rem', fontWeight: 700 }}>{t.name}</h4>
                  <code style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{t.key}</code>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="small-outline-btn" onClick={() => openEdit(t)}><FiEdit2 size={13} /></button>
                  {!t.isBuiltIn && (
                    <button className="small-outline-btn" style={{ color: '#9d3e32' }} onClick={() => handleDelete(t._id)}><FiTrash2 size={13} /></button>
                  )}
                </div>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--muted)' }}>{t.description || 'No description'}</p>
              <div style={{ fontSize: '0.75rem', background: 'var(--soft)', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.userPromptTemplate}
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)' }}>
                <span>Action: {t.action}</span>
                <span>Used {t.usageCount || 0}×</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Drawer */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 560, background: 'var(--panel)', height: '100%', padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Template' : 'New Prompt Template'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Template Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, key: !editingId ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') : form.key })} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Key (auto-generated)</label>
                  <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} disabled={!!editingId} style={{ opacity: 0.7 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this template do?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Action</label>
                  <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                    {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>System Prompt <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional — sets AI persona)</span></label>
                <textarea rows={3} value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} placeholder="You are an expert content writer…" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>User Prompt Template * <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— use {`{{variable}}`}</span></label>
                <textarea rows={4} value={form.userPromptTemplate} onChange={(e) => setForm({ ...form, userPromptTemplate: e.target.value })} required placeholder={`Write an article titled "{{title}}" in {{category}}…`} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Variables <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                <input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="title, category, content, tone" />
              </div>

              {/* Live Preview */}
              {form.userPromptTemplate && (
                <div style={{ background: 'var(--soft)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, color: 'var(--muted)', textTransform: 'uppercase' }}>Live Preview</div>
                  {form.variables.split(',').filter(Boolean).map((v) => v.trim()).map((v) => (
                    <div key={v} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                      <label style={{ fontSize: '0.75rem', width: 80, flexShrink: 0 }}>{v}:</label>
                      <input style={{ fontSize: '0.8rem', flex: 1 }} placeholder={`Sample ${v}`} value={previewVars[v] || ''} onChange={(e) => setPreviewVars({ ...previewVars, [v]: e.target.value })} />
                    </div>
                  ))}
                  <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginTop: 8, padding: 10, background: 'var(--panel)', borderRadius: 6, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
                    {previewOutput}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="primary-btn"><FiSave /> {editingId ? 'Save Changes' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/ai/prompts', component: PromptManagerModule, auth: true, permissions: ['ai.manage'] });
registerSidebar({ key: 'ai-prompts', label: 'Prompt Manager', icon: FiFileText, path: '/cms/ai/prompts', group: 'Stage 3: AI Intelligence', order: 3 });
