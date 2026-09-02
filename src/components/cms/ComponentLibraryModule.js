/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ComponentLibraryModule.js  —  Component Library & Block Marketplace
 *  MyJourney CMS  |  Phase 8: Component Library
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGrid,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
  FiSliders,
  FiLayers,
  FiCode,
  FiShield,
  FiDroplet,
} from 'react-icons/fi';

const CATEGORIES = ['All', 'Content', 'Marketing', 'Articles', 'Community', 'Media', 'Layout', 'Utility'];

export default function ComponentLibraryModule() {
  const [components, setComponents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/api/components?search=${encodeURIComponent(search)}`;
      if (selectedCategory !== 'All') query += `&category=${encodeURIComponent(selectedCategory)}`;
      const res = await apiService.get(query);
      if (res?.data) setComponents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Experience</span>
          <h2>Component Library & Block Marketplace</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={fetchComponents}>
            Refresh Library
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Category Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: isActive ? '1px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4',
                  backgroundColor: isActive ? 'var(--cms-accent, #426c67)' : '#fff',
                  color: isActive ? '#fff' : '#444',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="cms-search-control" style={{ width: '220px' }}>
          <FiSearch />
          <input type="text" placeholder="Search blocks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Component Manifests Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading block library...</div>
      ) : components.length === 0 ? (
        <div className="empty-state">No components match query filters.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {components.map((comp) => (
            <div key={comp._id} style={{ background: '#fff', border: activeComponent?._id === comp._id ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiBox style={{ color: 'var(--cms-accent, #426c67)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{comp.name}</h3>
                  </div>
                  <code style={{ fontSize: '0.75rem', color: '#888' }}>key: {comp.key}</code>
                </div>

                <span style={{ fontSize: '0.7rem', background: '#f0f0f0', padding: '2px 8px', borderRadius: '100px', fontWeight: '600' }}>
                  {comp.category}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: '1.5' }}>{comp.description || 'No description provided'}</p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                <span style={{ background: '#e8f0ef', color: '#426c67', padding: '2px 6px', borderRadius: '4px' }}>
                  v{comp.version || 1}
                </span>
                <span style={{ background: '#fafafa', border: '1px solid #eee', padding: '2px 6px', borderRadius: '4px' }}>
                  Props: {comp.propSchema?.props?.length || 0}
                </span>
                {comp.isBuiltIn && (
                  <span style={{ background: '#eee', color: '#555', padding: '2px 6px', borderRadius: '4px' }}>
                    Core Built-in
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button type="button" className="small-outline-btn" onClick={() => setActiveComponent(comp)}>
                  <FiSliders /> Inspect Manifest
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manifest Inspector Drawer */}
      {activeComponent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '440px', background: '#fff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Manifest: {activeComponent.name}</h3>
                <code style={{ fontSize: '0.75rem', color: 'var(--cms-accent, #426c67)' }}>{activeComponent.key}</code>
              </div>
              <button type="button" onClick={() => setActiveComponent(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Editable Schema Props */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCode /> Property Schema ({activeComponent.propSchema?.props?.length || 0})
              </h4>
              {(!activeComponent.propSchema?.props || activeComponent.propSchema.props.length === 0) ? (
                <div style={{ fontSize: '0.8rem', color: '#888' }}>No custom props declared.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeComponent.propSchema.props.map((p, idx) => (
                    <div key={idx} style={{ background: '#f8faf8', border: '1px solid #e4ded4', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{p.label || p.name}</strong>
                        <code style={{ fontSize: '0.7rem', color: '#666' }}>{p.type}</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#888' }}>Default: {JSON.stringify(p.defaultValue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Design Token Integration */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiDroplet /> Design Tokens Integrated
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(activeComponent.designTokens || []).map((tok, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px' }}>
                    {tok}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="primary-btn" onClick={() => setActiveComponent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/components',
  component: ComponentLibraryModule,
  auth: true,
  permissions: ['components.manage'],
});

registerSidebar({
  key: 'components',
  label: 'Component Library',
  icon: FiGrid,
  path: '/cms/components',
  group: 'Experience',
  order: 6,
});
