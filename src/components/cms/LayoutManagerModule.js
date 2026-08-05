/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LayoutManagerModule.js  —  Dynamic Layout Manager Dashboard
 *  MyJourney CMS  |  Phase 3: Layout Manager
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGrid,
  FiSearch,
  FiPlus,
  FiCopy,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiSliders,
  FiEdit,
  FiTrash2,
  FiEye,
  FiSave,
} from 'react-icons/fi';

const CATEGORIES = ['All', 'Editorial', 'Business', 'Portfolio', 'Education', 'Documentation', 'Magazine', 'Timeline', 'Marketing', 'Personal', 'Gallery'];

export default function LayoutManagerModule() {
  const [layouts, setLayouts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeLayout, setActiveLayout] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/api/layouts?category=${selectedCategory}&search=${encodeURIComponent(search)}`);
      if (res?.data) {
        setLayouts(res.data);
      }
    } catch (err) {
      console.error('[LayoutManager] Error loading layouts:', err);
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  const handleDuplicate = async (id) => {
    try {
      const res = await apiService.post(`/api/layouts/${id}/duplicate`);
      if (res?.data) {
        setNotification({ type: 'success', text: `Layout duplicated successfully.` });
        fetchLayouts();
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handlePublish = async (id) => {
    try {
      await apiService.post(`/api/layouts/${id}/publish`);
      setNotification({ type: 'success', text: 'Layout published.' });
      fetchLayouts();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveLayout = async () => {
    if (!activeLayout) return;
    try {
      await apiService.patch(`/api/layouts/${activeLayout._id}`, activeLayout);
      setNotification({ type: 'success', text: 'Layout configuration saved.' });
      setShowEditor(false);
      fetchLayouts();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Experience</span>
          <h2>Layout Engine Manager</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={fetchLayouts}>
            Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            backgroundColor: notification.type === 'success' ? 'var(--color-success-bg, #e8f5ee)' : 'var(--color-danger-bg, #fdf1f0)',
            color: notification.type === 'success' ? 'var(--color-success, #2e7d5a)' : 'var(--color-danger, #9d3e32)',
            border: '1px solid currentColor',
          }}
        >
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Category Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: selectedCategory === cat ? '1px solid var(--cms-accent, #426c67)' : '1px solid var(--color-line, #ddd)',
                backgroundColor: selectedCategory === cat ? 'var(--cms-accent, #426c67)' : 'var(--color-surface, #fff)',
                color: selectedCategory === cat ? '#fff' : 'var(--color-ink, #333)',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="cms-search-control" style={{ width: '220px' }}>
          <FiSearch />
          <input type="text" placeholder="Search layouts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Layout Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading layout configurations...</div>
      ) : layouts.length === 0 ? (
        <div className="empty-state">No layouts match criteria.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {layouts.map((layout) => (
            <div
              key={layout._id}
              style={{
                background: '#fff',
                border: '1px solid var(--color-line, #e4ded4)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.05))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{layout.name}</h3>
                    {layout.isBuiltIn && (
                      <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>System</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted, #666)' }}>{layout.key} • {layout.category}</span>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '100px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    backgroundColor: layout.status === 'published' ? '#e8f5ee' : '#fdf6ee',
                    color: layout.status === 'published' ? '#2e7d5a' : '#b58b5f',
                  }}
                >
                  {layout.status}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{layout.description || 'No description provided'}</p>

              {/* Layout Features / Region Indicators */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#555' }}>
                <span style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>Type: {layout.layoutType}</span>
                {layout.regions?.hero?.visible && <span style={{ background: '#eaf0f5', padding: '2px 6px', borderRadius: '4px' }}>Hero</span>}
                {layout.regions?.leftSidebar?.visible && <span style={{ background: '#fdf6ee', padding: '2px 6px', borderRadius: '4px' }}>Left Sidebar</span>}
                {layout.regions?.rightSidebar?.visible && <span style={{ background: '#fdf6ee', padding: '2px 6px', borderRadius: '4px' }}>Right Sidebar</span>}
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="small-outline-btn"
                    onClick={() => {
                      setActiveLayout(layout);
                      setShowEditor(true);
                    }}
                  >
                    <FiSliders /> Configure
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => handleDuplicate(layout._id)} title="Duplicate">
                    <FiCopy />
                  </button>
                </div>

                {layout.status === 'draft' && (
                  <button type="button" className="primary-btn" onClick={() => handlePublish(layout._id)} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Region & Variable Config Editor Drawer */}
      {showEditor && activeLayout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '420px', background: '#fff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: '12px' }}>
              <h3 style={{ margin: 0 }}>Configure: {activeLayout.name}</h3>
              <button type="button" onClick={() => setShowEditor(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* CSS Variable Controls */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>CSS Variable Tokens</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem' }}>
                  Container Width:
                  <input
                    type="text"
                    value={activeLayout.cssVariables?.containerWidth || '1200px'}
                    onChange={(e) =>
                      setActiveLayout({
                        ...activeLayout,
                        cssVariables: { ...activeLayout.cssVariables, containerWidth: e.target.value },
                      })
                    }
                  />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Grid Columns:
                  <input
                    type="number"
                    value={activeLayout.cssVariables?.columns || 3}
                    onChange={(e) =>
                      setActiveLayout({
                        ...activeLayout,
                        cssVariables: { ...activeLayout.cssVariables, columns: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Gap Spacing:
                  <input
                    type="text"
                    value={activeLayout.cssVariables?.gap || '24px'}
                    onChange={(e) =>
                      setActiveLayout({
                        ...activeLayout,
                        cssVariables: { ...activeLayout.cssVariables, gap: e.target.value },
                      })
                    }
                  />
                </label>
              </div>
            </div>

            {/* Region Toggles */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>Active Regions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['hero', 'leftSidebar', 'rightSidebar', 'bottomSection'].map((regionKey) => (
                  <label key={regionKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      checked={activeLayout.regions?.[regionKey]?.visible ?? false}
                      onChange={(e) =>
                        setActiveLayout({
                          ...activeLayout,
                          regions: {
                            ...activeLayout.regions,
                            [regionKey]: { ...activeLayout.regions?.[regionKey], visible: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>Show {regionKey}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowEditor(false)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleSaveLayout}>
                <FiSave /> Save Configuration
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
  path: '/cms/layouts',
  component: LayoutManagerModule,
  auth: true,
  permissions: ['layouts.manage'],
});

registerSidebar({
  key: 'layouts',
  label: 'Layout Manager',
  icon: FiGrid,
  path: '/cms/layouts',
  group: 'Experience',
  order: 1,
});
