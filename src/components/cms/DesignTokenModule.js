/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DesignTokenModule.js  —  Design Token Management System Dashboard
 *  MyJourney CMS  |  Phase 7: Enterprise Design Token System
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiSliders,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiUpload,
  FiSave,
  FiInfo,
  FiLayers,
} from 'react-icons/fi';

const GROUPS = ['All', 'Core', 'Semantic', 'Component', 'Layout', 'Motion', 'Brand'];
const CATEGORIES = ['All', 'Colors', 'Typography', 'Spacing', 'Radius', 'Shadows', 'Z-Index'];

export default function DesignTokenModule() {
  const [tokens, setTokens] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeToken, setActiveToken] = useState(null);
  const [notification, setNotification] = useState(null);

  // New token form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenForm, setNewTokenForm] = useState({
    key: '',
    name: '',
    value: '#426c67',
    type: 'color',
    category: 'Colors',
    group: 'Core',
    description: '',
  });

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/api/design-tokens?search=${encodeURIComponent(search)}`;
      if (selectedGroup !== 'All') query += `&group=${encodeURIComponent(selectedGroup)}`;
      if (selectedCategory !== 'All') query += `&category=${encodeURIComponent(selectedCategory)}`;

      const res = await apiService.get(query);
      if (res?.data) setTokens(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup, selectedCategory]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async (e) => {
    e.preventDefault();
    if (!newTokenForm.key.trim() || !newTokenForm.name.trim()) return;

    try {
      await apiService.post('/api/design-tokens', newTokenForm);
      setShowCreateModal(false);
      setNewTokenForm({ key: '', name: '', value: '#426c67', type: 'color', category: 'Colors', group: 'Core', description: '' });
      fetchTokens();
      setNotification({ type: 'success', text: 'Design token created successfully.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveActiveToken = async () => {
    if (!activeToken) return;
    try {
      await apiService.patch(`/api/design-tokens/${activeToken._id}`, activeToken);
      setNotification({ type: 'success', text: `Saved token '${activeToken.key}'` });
      setActiveToken(null);
      fetchTokens();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleDeleteToken = async (id) => {
    if (!window.confirm('Delete this design token?')) return;
    try {
      await apiService.delete(`/api/design-tokens/${id}`);
      if (activeToken?._id === id) setActiveToken(null);
      fetchTokens();
      setNotification({ type: 'success', text: 'Token deleted.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleExport = () => {
    window.open('/api/design-tokens/export', '_blank');
  };

  return (
    <div className="cms-panel wide" style={{ padding: 0, display: 'flex', minHeight: '680px', overflow: 'hidden' }}>
      {/* ── Left Sidebar: Group & Category Filters ─────────────────────────── */}
      <div style={{ width: '220px', background: 'var(--color-panel-muted, #f8faf8)', borderRight: '1px solid var(--color-line, #e4ded4)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Token Groups
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {GROUPS.map((grp) => {
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? '700' : '500',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--cms-accent-light, #e8f0ef)' : 'transparent',
                    color: isActive ? 'var(--cms-accent, #426c67)' : '#444',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {grp}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Category
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? '700' : '500',
                    border: 'none',
                    backgroundColor: isActive ? '#eee' : 'transparent',
                    color: isActive ? '#111' : '#555',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content Area: Token Grid & Usage Inspector ────────────────── */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Design Tokens ({tokens.length})</h3>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Single source of truth for visual tokens across MyJourney</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="cms-search-control" style={{ width: '180px' }}>
                <FiSearch />
                <input type="text" placeholder="Filter tokens..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button type="button" className="secondary-btn" onClick={handleExport} title="Export Tokens JSON">
                <FiDownload /> Export
              </button>
              <button type="button" className="primary-btn" onClick={() => setShowCreateModal(true)}>
                <FiPlus /> New Token
              </button>
            </div>
          </div>

          {notification && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
              {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{notification.text}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading design tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="empty-state">No design tokens match query filters.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {tokens.map((token) => (
                <div key={token._id} style={{ background: '#fff', border: activeToken?._id === token._id ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', display: 'block' }}>{token.name}</strong>
                      <code style={{ fontSize: '0.72rem', color: 'var(--cms-accent, #426c67)' }}>var(--{token.key.replace(/\./g, '-')})</code>
                    </div>
                    <span style={{ fontSize: '0.68rem', background: '#f0f0f0', padding: '1px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                      {token.group}
                    </span>
                  </div>

                  {/* Token Value Display / Swatch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fafafa', padding: '6px 10px', borderRadius: '6px' }}>
                    {token.type === 'color' && (
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: token.value, border: '1px solid rgba(0,0,0,0.1)' }} />
                    )}
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: '600' }}>{token.value}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>
                      Used in: {token.usedIn?.length || 0} components
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="small-outline-btn" onClick={() => setActiveToken(token)}>
                        Inspect
                      </button>
                      {!token.isCore && (
                        <button type="button" onClick={() => handleDeleteToken(token._id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Inspector Drawer */}
        {activeToken && (
          <div style={{ width: '320px', background: '#fff', borderLeft: '1px solid #e4ded4', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Token Inspector</h4>
              <button type="button" onClick={() => setActiveToken(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <label>
                Token Name:
                <input type="text" value={activeToken.name} onChange={(e) => setActiveToken({ ...activeToken, name: e.target.value })} />
              </label>

              <label>
                Value:
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {activeToken.type === 'color' && (
                    <input
                      type="color"
                      value={activeToken.value}
                      onChange={(e) => setActiveToken({ ...activeToken, value: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                    />
                  )}
                  <input type="text" value={activeToken.value} onChange={(e) => setActiveToken({ ...activeToken, value: e.target.value })} style={{ flex: 1 }} />
                </div>
              </label>

              <label>
                Description:
                <input type="text" value={activeToken.description || ''} onChange={(e) => setActiveToken({ ...activeToken, description: e.target.value })} />
              </label>

              {/* Usage references list */}
              <div>
                <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Used In Components:</strong>
                {(!activeToken.usedIn || activeToken.usedIn.length === 0) ? (
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Global token (no component references attached)</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {activeToken.usedIn.map((u, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', background: '#e8f0ef', color: '#426c67', padding: '2px 6px', borderRadius: '4px' }}>
                        {u.component}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="primary-btn" onClick={handleSaveActiveToken}>
                <FiSave /> Save Token
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateToken} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Create Design Token</h3>
            <input type="text" placeholder="Token Key (e.g. color.brand)" value={newTokenForm.key} onChange={(e) => setNewTokenForm({ ...newTokenForm, key: e.target.value })} required autoFocus />
            <input type="text" placeholder="Display Name (e.g. Brand Color)" value={newTokenForm.name} onChange={(e) => setNewTokenForm({ ...newTokenForm, name: e.target.value })} required />
            <input type="text" placeholder="Value (e.g. #426c67 or 16px)" value={newTokenForm.value} onChange={(e) => setNewTokenForm({ ...newTokenForm, value: e.target.value })} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select value={newTokenForm.type} onChange={(e) => setNewTokenForm({ ...newTokenForm, type: e.target.value })}>
                <option value="color">Color</option>
                <option value="typography">Typography</option>
                <option value="spacing">Spacing</option>
                <option value="radius">Radius</option>
                <option value="shadow">Shadow</option>
                <option value="zindex">Z-Index</option>
              </select>
              <select value={newTokenForm.group} onChange={(e) => setNewTokenForm({ ...newTokenForm, group: e.target.value })}>
                <option value="Core">Core</option>
                <option value="Semantic">Semantic</option>
                <option value="Component">Component</option>
                <option value="Layout">Layout</option>
                <option value="Brand">Brand</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/design-tokens',
  component: DesignTokenModule,
  auth: true,
  permissions: ['tokens.manage'],
});

registerSidebar({
  key: 'design-tokens',
  label: 'Design Token System',
  icon: FiSliders,
  path: '/cms/design-tokens',
  group: 'Experience',
  order: 5,
});
