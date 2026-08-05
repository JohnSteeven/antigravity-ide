/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PersonalizedDashboardModule.js  —  Personalized Workspace Dashboard
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/apiService';
import DashboardWidgetContainer from './DashboardWidgetContainer';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGrid,
  FiZap,
  FiInbox,
  FiCalendar,
  FiUsers,
  FiHardDrive,
  FiBox,
  FiPlus,
  FiRotateCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiFileText,
  FiSliders,
  FiLayout,
  FiDroplet,
} from 'react-icons/fi';

export default function PersonalizedDashboardModule() {
  const [layout, setLayout] = useState(null);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/dashboard/layout');
      if (res?.data) setLayout(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWidgets = useCallback(async () => {
    try {
      const res = await apiService.get('/api/dashboard/widgets');
      if (res?.data) setAvailableWidgets(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchWidgets();
  }, [fetchDashboard, fetchWidgets]);

  const handleResetLayout = async () => {
    try {
      setLoading(true);
      const res = await apiService.post('/api/dashboard/reset');
      if (res?.data) {
        setLayout(res.data);
        setNotification({ type: 'success', text: 'Dashboard reset to role default.' });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWidget = async (widgetId) => {
    if (!layout) return;
    const updatedWidgets = layout.widgets.filter((w) => w.widgetId !== widgetId);
    try {
      const res = await apiService.post('/api/dashboard/layout', { widgets: updatedWidgets });
      if (res?.data) setLayout(res.data);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleAddWidget = async (wDef) => {
    if (!layout) return;
    if (layout.widgets.some((w) => w.widgetId === wDef.widgetId)) {
      setNotification({ type: 'error', text: `'${wDef.name}' is already in your workspace.` });
      return;
    }

    const newWidgetInstance = {
      widgetId: wDef.widgetId,
      size: wDef.defaultSize || 'medium',
      order: layout.widgets.length + 1,
      isCollapsed: false,
    };

    const updatedWidgets = [...layout.widgets, newWidgetInstance];
    try {
      const res = await apiService.post('/api/dashboard/layout', { widgets: updatedWidgets });
      if (res?.data) {
        setLayout(res.data);
        setNotification({ type: 'success', text: `'${wDef.name}' added to workspace.` });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Personalized Workspace & Widget Platform</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="secondary-btn" onClick={handleResetLayout}>
            <FiRotateCcw /> Reset Default Layout
          </button>
          <button type="button" className="primary-btn" onClick={() => setShowLibrary(true)}>
            <FiPlus /> Widget Library
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Quick Action Shortcuts Bar */}
      <div style={{ background: '#fafafa', border: '1px solid #e4ded4', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Quick Shortcuts
        </span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/cms/articles" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiBookOpen /> New Article
          </Link>
          <Link to="/cms/media" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiHardDrive /> Media Library
          </Link>
          <Link to="/cms/website-builder" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiFileText /> Website Builder
          </Link>
          <Link to="/cms/forms" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiInbox /> Form Builder
          </Link>
          <Link to="/cms/layouts" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiLayout /> Layout Engine
          </Link>
          <Link to="/cms/theme-builder" className="secondary-btn" style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiDroplet /> Theme Engine
          </Link>
        </div>
      </div>

      {/* Workspace Widgets Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading workspace layout...</div>
      ) : !layout || layout.widgets?.length === 0 ? (
        <div className="empty-state">No active widgets in workspace. Open Widget Library to customize.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {layout.widgets.map((wInst) => {
            const def = availableWidgets.find((d) => d.widgetId === wInst.widgetId);
            return (
              <DashboardWidgetContainer key={wInst.widgetId} title={def?.name || wInst.widgetId} category={def?.category || 'Widget'} size={wInst.size} onRemove={() => handleRemoveWidget(wInst.widgetId)}>
                <div style={{ fontSize: '0.85rem', color: '#666', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                  {def?.description || 'Active widget container ready.'}
                </div>
              </DashboardWidgetContainer>
            );
          })}
        </div>
      )}

      {/* Widget Library Drawer Modal */}
      {showLibrary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Self-Registered Widget Library</h3>
              <button type="button" className="secondary-btn" onClick={() => setShowLibrary(false)}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableWidgets.map((wDef) => {
                const isAdded = layout?.widgets?.some((w) => w.widgetId === wDef.widgetId);
                return (
                  <div key={wDef.widgetId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>{wDef.name}</strong>
                        <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '1px 6px', borderRadius: '4px' }}>
                          {wDef.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#666' }}>{wDef.description}</span>
                    </div>

                    <button
                      type="button"
                      className={isAdded ? 'secondary-btn' : 'primary-btn'}
                      style={{ fontSize: '0.8rem' }}
                      disabled={isAdded}
                      onClick={() => handleAddWidget(wDef)}
                    >
                      {isAdded ? 'Added' : 'Add to Workspace'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/workspace',
  component: PersonalizedDashboardModule,
  auth: true,
  permissions: ['dashboard.view'],
});

registerSidebar({
  key: 'workspace',
  label: 'Personalized Workspace',
  icon: FiGrid,
  path: '/cms/workspace',
  group: 'Stage 2 Post-Launch',
  order: 6,
});
