/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WebsiteBuilderModule.js  —  Page Engine Management Dashboard
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiLayout,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiGlobe,
  FiLayers,
  FiSave,
  FiSliders,
} from 'react-icons/fi';

export default function WebsiteBuilderModule() {
  const [pages, setPages] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modals / Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', layoutKey: 'hero' });
  const [newBlockType, setNewBlockType] = useState('hero');

  const fetchLayouts = useCallback(async () => {
    try {
      const res = await apiService.get('/api/layouts');
      if (res?.data) setLayouts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/api/pages?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      const res = await apiService.get(query);
      if (res?.data) setPages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageForm.title.trim()) return;

    try {
      const slug = newPageForm.slug || newPageForm.title.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const res = await apiService.post('/api/pages', {
        title: newPageForm.title,
        slug,
        layoutKey: newPageForm.layoutKey,
      });

      setShowCreateModal(false);
      setNewPageForm({ title: '', slug: '', layoutKey: 'hero' });
      fetchPages();
      setNotification({ type: 'success', text: 'Page created successfully.' });
      if (res?.data) setActivePage(res.data);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await apiService.post(`/api/pages/${id}/duplicate`);
      fetchPages();
      setNotification({ type: 'success', text: 'Page duplicated.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handlePublish = async (id) => {
    try {
      await apiService.post(`/api/pages/${id}/publish`);
      fetchPages();
      setNotification({ type: 'success', text: 'Page published.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await apiService.delete(`/api/pages/${id}`);
      if (activePage?._id === id) setActivePage(null);
      fetchPages();
      setNotification({ type: 'success', text: 'Page deleted.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleAddBlock = () => {
    if (!activePage) return;
    const newBlock = {
      id: `b_${Date.now()}`,
      type: newBlockType,
      region: 'mainContent',
      order: (activePage.blocks?.length || 0) + 1,
      props: { title: 'New Block Title' },
      visibility: true,
    };
    setActivePage({
      ...activePage,
      blocks: [...(activePage.blocks || []), newBlock],
    });
    setShowBlockModal(false);
  };

  const handleSaveActivePage = async () => {
    if (!activePage) return;
    try {
      await apiService.patch(`/api/pages/${activePage._id}`, activePage);
      setNotification({ type: 'success', text: `Page '${activePage.title}' saved.` });
      fetchPages();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Experience</span>
          <h2>Website Builder & Page Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> New Page
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'published', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                border: statusFilter === st ? '1px solid var(--cms-accent, #426c67)' : '1px solid #ddd',
                backgroundColor: statusFilter === st ? 'var(--cms-accent, #426c67)' : '#fff',
                color: statusFilter === st ? '#fff' : '#333',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="cms-search-control" style={{ width: '220px' }}>
          <FiSearch />
          <input type="text" placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Pages List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="empty-state">No pages found. Click 'New Page' to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {pages.map((page) => (
            <div key={page._id} style={{ background: '#fff', border: activePage?._id === page._id ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{page.title}</h3>
                    {page.isSystem && <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>System</span>}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cms-accent, #426c67)' }}>/{page.slug}</span>
                </div>

                <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: page.status === 'published' ? '#e8f5ee' : '#fdf6ee', color: page.status === 'published' ? '#2e7d5a' : '#b58b5f' }}>
                  {page.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#666' }}>
                <span>Layout: <strong>{page.layoutKey}</strong></span>
                <span>•</span>
                <span>Blocks: <strong>{page.blocks?.length || 0}</strong></span>
                <span>•</span>
                <span>Views: <strong>{page.views || 0}</strong></span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" className="small-outline-btn" onClick={() => setActivePage(page)}>
                    <FiSliders /> Edit Blocks
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => handleDuplicate(page._id)} title="Duplicate">
                    <FiCopy />
                  </button>
                  <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="btn-ghost" title="Preview Public Page">
                    <FiGlobe />
                  </a>
                </div>

                {!page.isSystem && (
                  <button type="button" onClick={() => handleDelete(page._id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Builder Block Editor Drawer */}
      {activePage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '480px', background: '#fff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Block Editor: {activePage.title}</h3>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>Layout: {activePage.layoutKey}</span>
              </div>
              <button type="button" onClick={() => setActivePage(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Layout Switcher */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Assigned Layout:</label>
              <select value={activePage.layoutKey} onChange={(e) => setActivePage({ ...activePage, layoutKey: e.target.value })} style={{ width: '100%', marginTop: '4px' }}>
                {layouts.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.name} ({l.layoutType})
                  </option>
                ))}
              </select>
            </div>

            {/* Block List & Add Button */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Page Blocks ({activePage.blocks?.length || 0})</h4>
                <button type="button" className="small-outline-btn" onClick={() => setShowBlockModal(true)}>
                  <FiPlus /> Add Block
                </button>
              </div>

              {(!activePage.blocks || activePage.blocks.length === 0) ? (
                <div style={{ padding: '20px', background: '#f9f9f9', textAlign: 'center', fontSize: '0.8rem', color: '#888', borderRadius: '6px' }}>
                  No blocks added. Click 'Add Block' to build page layout.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePage.blocks.map((block, idx) => (
                    <div key={block.id || idx} style={{ background: '#f8faf8', border: '1px solid #e4ded4', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                          #{idx + 1} {block.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newBlocks = activePage.blocks.filter((_, i) => i !== idx);
                            setActivePage({ ...activePage, blocks: newBlocks });
                          }}
                          style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem' }}>
                          Title:
                          <input
                            type="text"
                            value={block.props?.title || ''}
                            onChange={(e) => {
                              const updated = [...activePage.blocks];
                              updated[idx].props = { ...updated[idx].props, title: e.target.value };
                              setActivePage({ ...activePage, blocks: updated });
                            }}
                          />
                        </label>
                        <label style={{ fontSize: '0.75rem' }}>
                          Region:
                          <select
                            value={block.region || 'mainContent'}
                            onChange={(e) => {
                              const updated = [...activePage.blocks];
                              updated[idx].region = e.target.value;
                              setActivePage({ ...activePage, blocks: updated });
                            }}
                          >
                            <option value="hero">hero</option>
                            <option value="mainContent">mainContent</option>
                            <option value="leftSidebar">leftSidebar</option>
                            <option value="rightSidebar">rightSidebar</option>
                            <option value="bottomSection">bottomSection</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setActivePage(null)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleSaveActivePage}>
                <FiSave /> Save Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showBlockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Add Block</h3>
            <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)}>
              <option value="hero">Hero Banner</option>
              <option value="rich_text">Rich Text</option>
              <option value="quote">Quote</option>
              <option value="cta">Call To Action (CTA)</option>
              <option value="featured_articles">Featured Articles</option>
              <option value="gallery">Photo Gallery</option>
              <option value="newsletter">Newsletter Box</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowBlockModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleAddBlock}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreatePage} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Create New Page</h3>
            <input type="text" placeholder="Page Title (e.g. Services)" value={newPageForm.title} onChange={(e) => setNewPageForm({ ...newPageForm, title: e.target.value })} required autoFocus />
            <input type="text" placeholder="URL Slug (e.g. services)" value={newPageForm.slug} onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })} />
            <select value={newPageForm.layoutKey} onChange={(e) => setNewPageForm({ ...newPageForm, layoutKey: e.target.value })}>
              {layouts.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.name}
                </option>
              ))}
            </select>
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
  path: '/cms/website-builder',
  component: WebsiteBuilderModule,
  auth: true,
  permissions: ['pages.manage'],
});

registerSidebar({
  key: 'website-builder',
  label: 'Website Builder',
  icon: FiLayout,
  path: '/cms/website-builder',
  group: 'Experience',
  order: 3,
});
