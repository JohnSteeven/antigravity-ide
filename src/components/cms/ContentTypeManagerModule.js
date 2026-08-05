/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ContentTypeManagerModule.js  —  Headless Content Modeling Engine Dashboard
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiDatabase,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiSliders,
  FiFolder,
  FiFileText,
  FiLayers,
  FiSave,
} from 'react-icons/fi';

export default function ContentTypeManagerModule() {
  const [activeTab, setActiveTab] = useState('types'); // 'types' or 'entries'
  const [contentTypes, setContentTypes] = useState([]);
  const [selectedTypeKey, setSelectedTypeKey] = useState('authors');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);

  // Forms
  const [newTypeForm, setNewTypeForm] = useState({ key: '', name: '', singularName: '', description: '', icon: 'Folder' });
  const [newFieldForm, setNewFieldForm] = useState({ key: '', name: '', label: '', type: 'text', required: false });
  const [entryFormData, setEntryFormData] = useState({ title: '', slug: '', data: {} });

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/content-modeling/types');
      if (res?.data) {
        setContentTypes(res.data);
        if (res.data.length > 0 && !selectedTypeKey) {
          setSelectedTypeKey(res.data[0].key);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeKey]);

  const fetchEntries = useCallback(async () => {
    if (!selectedTypeKey) return;
    try {
      setLoading(true);
      const res = await apiService.get(`/api/content-modeling/entries/${selectedTypeKey}`);
      if (res?.data) setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeKey]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (activeTab === 'entries') fetchEntries();
  }, [activeTab, fetchEntries]);

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeForm.key.trim() || !newTypeForm.name.trim()) return;

    try {
      await apiService.post('/api/content-modeling/types', newTypeForm);
      setShowCreateTypeModal(false);
      setNewTypeForm({ key: '', name: '', singularName: '', description: '', icon: 'Folder' });
      fetchTypes();
      setNotification({ type: 'success', text: 'Content Type schema created.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleAddField = () => {
    if (!activeType) return;
    if (!newFieldForm.key.trim() || !newFieldForm.label.trim()) return;

    const updatedFields = [...(activeType.fields || []), { ...newFieldForm, name: newFieldForm.label }];
    setActiveType({ ...activeType, fields: updatedFields });
    setShowAddFieldModal(false);
    setNewFieldForm({ key: '', name: '', label: '', type: 'text', required: false });
  };

  const handleSaveActiveType = async () => {
    if (!activeType) return;
    try {
      await apiService.patch(`/api/content-modeling/types/${activeType._id}`, activeType);
      setNotification({ type: 'success', text: `Saved schema for '${activeType.name}'` });
      setActiveType(null);
      fetchTypes();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!entryFormData.title.trim()) return;

    try {
      await apiService.post(`/api/content-modeling/entries/${selectedTypeKey}`, entryFormData);
      setShowCreateEntryModal(false);
      setEntryFormData({ title: '', slug: '', data: {} });
      fetchEntries();
      setNotification({ type: 'success', text: 'Content entry published.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const currentTypeDoc = contentTypes.find((t) => t.key === selectedTypeKey);

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Headless CMS</span>
          <h2>Enterprise Content Modeling Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTab === 'types' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('types')}
          >
            Content Types ({contentTypes.length})
          </button>
          <button
            type="button"
            className={activeTab === 'entries' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('entries')}
          >
            Content Entries
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* ── TAB 1: Content Types Schema Builder ───────────────────────────── */}
      {activeTab === 'types' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Define dynamic schemas, fields, and taxonomies without writing code</span>
            <button type="button" className="primary-btn" onClick={() => setShowCreateTypeModal(true)}>
              <FiPlus /> New Content Type
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading content schemas...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {contentTypes.map((type) => (
                <div key={type._id} style={{ background: '#fff', border: activeType?._id === type._id ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{type.name}</h3>
                        {type.isBuiltIn && <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>Core Built-in</span>}
                      </div>
                      <code style={{ fontSize: '0.75rem', color: 'var(--cms-accent, #426c67)' }}>{type.key}</code>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{type.description || 'No description'}</p>

                  <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    Fields defined: <strong>{type.fields?.length || 0}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <button type="button" className="small-outline-btn" onClick={() => setActiveType(type)}>
                      <FiSliders /> Edit Fields Schema
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => {
                        setSelectedTypeKey(type.key);
                        setActiveTab('entries');
                      }}
                    >
                      View Entries
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Headless Content Entries ───────────────────────────────── */}
      {activeTab === 'entries' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Select Content Type:</label>
              <select value={selectedTypeKey} onChange={(e) => setSelectedTypeKey(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                {contentTypes.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name} ({t.key})
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="primary-btn" onClick={() => setShowCreateEntryModal(true)}>
              <FiPlus /> Create {currentTypeDoc?.singularName || 'Entry'}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="empty-state">No content entries for '{selectedTypeKey}'. Click 'Create Entry' to publish one.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.map((entry) => (
                <div key={entry._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>{entry.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>slug: /{entry.slug}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', backgroundColor: '#e8f5ee', color: '#2e7d5a', fontWeight: '700' }}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Schema Drawer */}
      {activeType && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '480px', background: '#fff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Fields Schema: {activeType.name}</h3>
                <code style={{ fontSize: '0.75rem', color: 'var(--cms-accent, #426c67)' }}>{activeType.key}</code>
              </div>
              <button type="button" onClick={() => setActiveType(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Schema Fields ({activeType.fields?.length || 0})</h4>
                <button type="button" className="small-outline-btn" onClick={() => setShowAddFieldModal(true)}>
                  <FiPlus /> Add Field
                </button>
              </div>

              {(!activeType.fields || activeType.fields.length === 0) ? (
                <div style={{ padding: '16px', background: '#fafafa', borderRadius: '6px', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
                  No custom fields defined. Click 'Add Field' to extend schema.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeType.fields.map((f, idx) => (
                    <div key={idx} style={{ background: '#f8faf8', border: '1px solid #e4ded4', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{f.label || f.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#888' }}>
                          key: <code>{f.key}</code> • type: <code>{f.type}</code> {f.required && '• required'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setActiveType(null)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleSaveActiveType}>
                <FiSave /> Save Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '340px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Add Schema Field</h3>
            <input type="text" placeholder="Field Label (e.g. Profile Bio)" value={newFieldForm.label} onChange={(e) => setNewFieldForm({ ...newFieldForm, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') })} required autoFocus />
            <input type="text" placeholder="Field Key (e.g. profile_bio)" value={newFieldForm.key} onChange={(e) => setNewFieldForm({ ...newFieldForm, key: e.target.value })} required />
            <select value={newFieldForm.type} onChange={(e) => setNewFieldForm({ ...newFieldForm, type: e.target.value })}>
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="rich_text">Rich Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="image">Image URL</option>
              <option value="gallery">Photo Gallery</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowAddFieldModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleAddField}>
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Content Type Modal */}
      {showCreateTypeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateType} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Create Content Type</h3>
            <input type="text" placeholder="Plural Name (e.g. Podcasts)" value={newTypeForm.name} onChange={(e) => setNewTypeForm({ ...newTypeForm, name: e.target.value, singularName: e.target.value.replace(/s$/, ''), key: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} required autoFocus />
            <input type="text" placeholder="Type Key (e.g. podcasts)" value={newTypeForm.key} onChange={(e) => setNewTypeForm({ ...newTypeForm, key: e.target.value })} required />
            <input type="text" placeholder="Singular Name (e.g. Podcast)" value={newTypeForm.singularName} onChange={(e) => setNewTypeForm({ ...newTypeForm, singularName: e.target.value })} required />
            <textarea placeholder="Description" value={newTypeForm.description} onChange={(e) => setNewTypeForm({ ...newTypeForm, description: e.target.value })} rows={2} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowCreateTypeModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Create Schema
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Entry Modal */}
      {showCreateEntryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateEntry} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>New {currentTypeDoc?.singularName || 'Entry'}</h3>
            <input type="text" placeholder="Title" value={entryFormData.title} onChange={(e) => setEntryFormData({ ...entryFormData, title: e.target.value })} required autoFocus />
            <input type="text" placeholder="Slug (optional)" value={entryFormData.slug} onChange={(e) => setEntryFormData({ ...entryFormData, slug: e.target.value })} />

            {/* Dynamic Input Controls generated from ContentType Fields Schema */}
            {currentTypeDoc?.fields?.map((f) => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                <label style={{ fontWeight: '600' }}>{f.label || f.name}:</label>
                {f.type === 'textarea' || f.type === 'rich_text' ? (
                  <textarea
                    rows={2}
                    value={entryFormData.data?.[f.key] || ''}
                    onChange={(e) => setEntryFormData({ ...entryFormData, data: { ...entryFormData.data, [f.key]: e.target.value } })}
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={entryFormData.data?.[f.key] || ''}
                    onChange={(e) => setEntryFormData({ ...entryFormData, data: { ...entryFormData.data, [f.key]: e.target.value } })}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowCreateEntryModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Publish Entry
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
  path: '/cms/content-modeling',
  component: ContentTypeManagerModule,
  auth: true,
  permissions: ['content_type.manage'],
});

registerSidebar({
  key: 'content-modeling',
  label: 'Content Modeling Engine',
  icon: FiDatabase,
  path: '/cms/content-modeling',
  group: 'Headless CMS',
  order: 7,
});
