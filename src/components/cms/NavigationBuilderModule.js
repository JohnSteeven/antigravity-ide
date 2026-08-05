/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationBuilderModule.js  —  Two-Panel Navigation & Information Architecture
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiNavigation,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiSliders,
  FiLayers,
  FiBarChart2,
  FiSave,
} from 'react-icons/fi';

export default function NavigationBuilderModule() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('primary-header');
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // New Item Form State
  const [itemForm, setItemForm] = useState({
    title: '',
    type: 'internal',
    internalRoute: '/',
    externalUrl: '',
    target: '_self',
    icon: '',
    badgeText: '',
    badgeColor: '#2e7d5a',
    featureFlag: '',
    roles: [],
  });

  const fetchZones = useCallback(async () => {
    try {
      const res = await apiService.get('/api/navigation/zones');
      if (res?.data) setZones(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/api/navigation?zone=${selectedZone}`);
      if (res?.data) setTree(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!itemForm.title.trim()) return;

    try {
      await apiService.post('/api/navigation', {
        ...itemForm,
        zoneKey: selectedZone,
        badge: { text: itemForm.badgeText, color: itemForm.badgeColor },
      });
      setShowItemModal(false);
      setItemForm({ title: '', type: 'internal', internalRoute: '/', externalUrl: '', target: '_self', icon: '', badgeText: '', badgeColor: '#2e7d5a', featureFlag: '', roles: [] });
      fetchTree();
      setNotification({ type: 'success', text: 'Navigation item added.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveActiveItem = async () => {
    if (!activeItem) return;
    try {
      await apiService.patch(`/api/navigation/${activeItem._id}`, activeItem);
      setNotification({ type: 'success', text: `Saved '${activeItem.title}'` });
      setActiveItem(null);
      fetchTree();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this navigation item?')) return;
    try {
      await apiService.delete(`/api/navigation/${id}`);
      if (activeItem?._id === id) setActiveItem(null);
      fetchTree();
      setNotification({ type: 'success', text: 'Item deleted.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide" style={{ padding: 0, display: 'flex', minHeight: '680px', overflow: 'hidden' }}>
      {/* ── Left Panel: Zones List ─────────────────────────────────────────── */}
      <div style={{ width: '240px', background: 'var(--color-panel-muted, #f8faf8)', borderRight: '1px solid var(--color-line, #e4ded4)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Navigation Zones
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {zones.map((z) => {
              const isActive = selectedZone === z.key;
              return (
                <button
                  key={z.key}
                  type="button"
                  onClick={() => setSelectedZone(z.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? '700' : '500',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--cms-accent-light, #e8f0ef)' : 'transparent',
                    color: isActive ? 'var(--cms-accent, #426c67)' : '#444',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{z.name}</span>
                  {z.isBuiltIn && <span style={{ fontSize: '0.65rem', background: '#eee', padding: '1px 4px', borderRadius: '3px' }}>System</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center/Right Panel: Tree View + Inspector Drawer ───────────────── */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        {/* Tree View */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Zone: {selectedZone}</h3>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Manage navigation links and dynamic category expansion</span>
            </div>

            <button type="button" className="primary-btn" onClick={() => setShowItemModal(true)}>
              <FiPlus /> Add Item
            </button>
          </div>

          {notification && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
              {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{notification.text}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading menu tree...</div>
          ) : tree.length === 0 ? (
            <div className="empty-state">No navigation items in this zone. Click 'Add Item' to start building.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tree.map((item) => (
                <div key={item._id} style={{ background: '#fff', border: activeItem?._id === item._id ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiNavigation style={{ color: 'var(--cms-accent, #426c67)' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{item.title}</strong>
                        <span style={{ fontSize: '0.7rem', background: '#f0f0f0', padding: '1px 6px', borderRadius: '4px' }}>{item.type}</span>
                        {item.featureFlag && <span style={{ fontSize: '0.7rem', background: '#fdf6ee', color: '#b58b5f', padding: '1px 6px', borderRadius: '4px' }}>Flag: {item.featureFlag}</span>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{item.internalRoute || item.externalUrl || '/'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiBarChart2 /> {item.clicks || 0} clicks
                    </span>
                    <button type="button" className="small-outline-btn" onClick={() => setActiveItem(item)}>
                      <FiSliders /> Inspect
                    </button>
                    <button type="button" onClick={() => handleDeleteItem(item._id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Inspector Drawer */}
        {activeItem && (
          <div style={{ width: '320px', background: '#fff', borderLeft: '1px solid #e4ded4', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Item Inspector</h4>
              <button type="button" onClick={() => setActiveItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <label>
                Title:
                <input type="text" value={activeItem.title} onChange={(e) => setActiveItem({ ...activeItem, title: e.target.value })} />
              </label>

              <label>
                Type:
                <select value={activeItem.type} onChange={(e) => setActiveItem({ ...activeItem, type: e.target.value })}>
                  <option value="internal">Internal Route</option>
                  <option value="external">External URL</option>
                  <option value="auto_categories">Auto Populate Categories</option>
                  <option value="dropdown">Dropdown Group</option>
                  <option value="mega">Mega Menu</option>
                  <option value="button">Button CTA</option>
                </select>
              </label>

              {activeItem.type === 'internal' && (
                <label>
                  Route Path:
                  <input type="text" value={activeItem.internalRoute} onChange={(e) => setActiveItem({ ...activeItem, internalRoute: e.target.value })} />
                </label>
              )}

              {activeItem.type === 'external' && (
                <label>
                  External URL:
                  <input type="text" value={activeItem.externalUrl} onChange={(e) => setActiveItem({ ...activeItem, externalUrl: e.target.value })} />
                </label>
              )}

              <label>
                Feature Flag Gate:
                <input type="text" placeholder="e.g. comments" value={activeItem.featureFlag || ''} onChange={(e) => setActiveItem({ ...activeItem, featureFlag: e.target.value })} />
              </label>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="primary-btn" onClick={handleSaveActiveItem}>
                <FiSave /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateItem} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Add Navigation Item</h3>
            <input type="text" placeholder="Title (e.g. Articles)" value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} required autoFocus />
            <select value={itemForm.type} onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}>
              <option value="internal">Internal Route</option>
              <option value="external">External URL</option>
              <option value="auto_categories">Auto Populate Categories</option>
              <option value="dropdown">Dropdown Group</option>
              <option value="mega">Mega Menu</option>
            </select>

            {itemForm.type === 'internal' && (
              <input type="text" placeholder="Route Path (e.g. /articles)" value={itemForm.internalRoute} onChange={(e) => setItemForm({ ...itemForm, internalRoute: e.target.value })} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowItemModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/navigation',
  component: NavigationBuilderModule,
  auth: true,
  permissions: ['navigation.manage'],
});

registerSidebar({
  key: 'navigation',
  label: 'Navigation Engine',
  icon: FiNavigation,
  path: '/cms/navigation',
  group: 'Experience',
  order: 2,
});
