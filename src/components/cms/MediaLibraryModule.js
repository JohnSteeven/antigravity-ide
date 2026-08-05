/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MediaLibraryModule.js  —  Enterprise Digital Asset Management (DAM)
 *  MyJourney CMS  |  Phase 2: Media Library 2.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiImage,
  FiFolder,
  FiUploadCloud,
  FiSearch,
  FiGrid,
  FiList,
  FiStar,
  FiClock,
  FiTrash2,
  FiTag,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiCopy,
  FiArchive,
  FiRefreshCw,
  FiFileText,
  FiFilm,
  FiMusic,
  FiDownload,
  FiAlertTriangle,
  FiInfo,
  FiZap,
} from 'react-icons/fi';

const COLLECTIONS = [
  { id: 'all', label: 'All Assets', icon: FiImage },
  { id: 'favorites', label: 'Favorites', icon: FiStar },
  { id: 'recently_uploaded', label: 'Recently Uploaded', icon: FiClock },
  { id: 'unused', label: 'Unused Media', icon: FiLayers },
  { id: 'most_used', label: 'Most Used', icon: FiLayers },
  { id: 'large', label: 'Large Files (>5MB)', icon: FiFileText },
  { id: 'duplicates', label: 'Duplicates', icon: FiAlertTriangle },
  { id: 'archived', label: 'Archived', icon: FiArchive },
];

export default function MediaLibraryModule() {
  const [assets, setAssets] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeAsset, setActiveAsset] = useState(null);
  const [assetUsage, setAssetUsage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load Folders & Assets
  const fetchFolders = useCallback(async () => {
    try {
      const res = await apiService.get('/api/media/folders');
      if (res?.data) setFolders(res.data);
    } catch (err) {
      console.error('[MediaLibrary] Error loading folders:', err);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/api/media?type=${selectedType}&search=${encodeURIComponent(search)}`;
      if (selectedFolder) query += `&folderId=${selectedFolder}`;
      if (selectedCollection && selectedCollection !== 'all') query += `&collection=${selectedCollection}`;

      const res = await apiService.get(query);
      if (res?.items) {
        setAssets(res.items);
      }
    } catch (err) {
      console.error('[MediaLibrary] Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, selectedCollection, selectedType, search]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Asset Select & Inspection
  const handleSelectAsset = async (asset) => {
    setActiveAsset(asset);
    try {
      const usageRes = await apiService.get(`/api/media/usage/${asset._id}`);
      setAssetUsage(usageRes);
    } catch (err) {
      setAssetUsage(null);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Upload Handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        if (selectedFolder) formData.append('folderId', selectedFolder);

        const res = await apiService.post('/api/media/upload', formData);
        if (res?.warning) {
          setNotification({ type: 'warning', text: res.warning });
        }
      }
      setNotification({ type: 'success', text: `Uploaded ${files.length} asset(s) successfully.` });
      fetchAssets();
    } catch (err) {
      setNotification({ type: 'error', text: 'Upload failed: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await apiService.post('/api/media/folders', {
        name: newFolderName,
        parentFolder: selectedFolder || null,
      });
      setNewFolderName('');
      setShowFolderModal(false);
      fetchFolders();
      setNotification({ type: 'success', text: 'Folder created.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    try {
      await apiService.post('/api/media/bulk', { action, ids: selectedIds });
      setSelectedIds([]);
      fetchAssets();
      setNotification({ type: 'success', text: `Bulk ${action} completed.` });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (assetId, force = false) => {
    try {
      await apiService.delete(`/api/media/${assetId}${force ? '?force=true' : ''}`);
      if (activeAsset?._id === assetId) setActiveAsset(null);
      fetchAssets();
      setNotification({ type: 'success', text: 'Asset deleted.' });
    } catch (err) {
      if (err.status === 409) {
        if (window.confirm(`Warning: Asset is used in ${err.usage?.usageCount || 0} locations. Force delete anyway?`)) {
          handleDeleteAsset(assetId, true);
        }
      } else {
        setNotification({ type: 'error', text: err.message });
      }
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (asset) => {
    try {
      const updated = await apiService.patch(`/api/media/${asset._id}`, { isFavorite: !asset.isFavorite });
      if (updated?.data) {
        setAssets((prev) => prev.map((a) => (a._id === asset._id ? updated.data : a)));
        if (activeAsset?._id === asset._id) setActiveAsset(updated.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="cms-panel wide" style={{ padding: '0', display: 'flex', minHeight: '680px', overflow: 'hidden' }}>
      {/* ── Left Sidebar (Folders & Collections) ─────────────────────────── */}
      <div
        style={{
          width: '240px',
          background: 'var(--color-panel-muted, #f8faf8)',
          borderRight: '1px solid var(--color-line, #e4ded4)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Collections
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
            {COLLECTIONS.map((col) => {
              const Icon = col.icon;
              const isActive = selectedCollection === col.id && !selectedFolder;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    setSelectedCollection(col.id);
                    setSelectedFolder(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? '700' : '500',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--cms-accent-light, #e8f0ef)' : 'transparent',
                    color: isActive ? 'var(--cms-accent, #426c67)' : 'var(--color-ink, #444)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon style={{ fontSize: '1rem' }} />
                  <span>{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Folders
            </span>
            <button
              type="button"
              onClick={() => setShowFolderModal(true)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--cms-accent, #426c67)', fontSize: '1rem' }}
              title="New Folder"
            >
              <FiPlus />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '260px', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setSelectedFolder(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                border: 'none',
                backgroundColor: selectedFolder === null && selectedCollection === 'all' ? 'var(--cms-accent-light, #e8f0ef)' : 'transparent',
                color: selectedFolder === null && selectedCollection === 'all' ? 'var(--cms-accent, #426c67)' : '#444',
                cursor: 'pointer',
              }}
            >
              <FiFolder /> All Root Assets
            </button>
            {folders.map((f) => (
              <button
                key={f._id}
                type="button"
                onClick={() => {
                  setSelectedFolder(f._id);
                  setSelectedCollection(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  border: 'none',
                  backgroundColor: selectedFolder === f._id ? 'var(--cms-accent-light, #e8f0ef)' : 'transparent',
                  color: selectedFolder === f._id ? 'var(--cms-accent, #426c67)' : '#444',
                  cursor: 'pointer',
                }}
              >
                <FiFolder style={{ color: f.color || 'inherit' }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Asset Browser Area ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '20px' }}>
        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label className="primary-btn" style={{ cursor: 'pointer' }}>
              <FiUploadCloud /> {uploading ? 'Uploading...' : 'Upload Assets'}
              <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>

            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                <span>{selectedIds.length} selected</span>
                <button type="button" onClick={() => handleBulkAction('archive')} className="btn-ghost" title="Archive">
                  <FiArchive />
                </button>
                <button type="button" onClick={() => handleBulkAction('delete')} className="btn-ghost" title="Delete" style={{ color: 'red' }}>
                  <FiTrash2 />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="cms-search-control" style={{ width: '200px' }}>
              <FiSearch />
              <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDFs</option>
              <option value="document">Documents</option>
            </select>

            <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{ padding: '6px 10px', border: 'none', background: viewMode === 'grid' ? '#eee' : '#fff', cursor: 'pointer' }}
              >
                <FiGrid />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{ padding: '6px 10px', border: 'none', background: viewMode === 'list' ? '#eee' : '#fff', cursor: 'pointer' }}
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: notification.type === 'warning' ? '#fdf6ee' : notification.type === 'success' ? '#e8f5ee' : '#fdf1f0',
              color: notification.type === 'warning' ? '#b58b5f' : notification.type === 'success' ? '#2e7d5a' : '#9d3e32',
            }}
          >
            {notification.type === 'warning' ? <FiAlertTriangle /> : <FiCheckCircle />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Asset Grid Display */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="empty-state" style={{ flex: 1 }}>
            No media assets found. Upload images to populate your library.
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', overflowY: 'auto', flex: 1, alignContent: 'start' }}>
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset._id);
              const isActive = activeAsset?._id === asset._id;

              return (
                <div
                  key={asset._id}
                  onClick={() => handleSelectAsset(asset)}
                  style={{
                    position: 'relative',
                    background: '#fff',
                    border: isActive ? '2px solid var(--cms-accent, #426c67)' : isSelected ? '2px solid #4d6478' : '1px solid #e4ded4',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(asset._id);
                    }}
                    style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(asset);
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, border: 'none', background: 'none', cursor: 'pointer', color: asset.isFavorite ? '#b58b5f' : '#ccc' }}
                  >
                    <FiStar style={{ fill: asset.isFavorite ? '#b58b5f' : 'none' }} />
                  </button>

                  <div style={{ height: '110px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {asset.type === 'image' ? (
                      <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : asset.type === 'video' ? (
                      <FiFilm style={{ fontSize: '2rem', color: '#888' }} />
                    ) : (
                      <FiFileText style={{ fontSize: '2rem', color: '#888' }} />
                    )}
                  </div>

                  <div style={{ padding: '8px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{asset.size || '0 KB'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left', color: '#666' }}>
                  <th style={{ padding: '8px' }}>Asset</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Folder</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id} onClick={() => handleSelectAsset(asset)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={asset.url} alt={asset.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                      <span>{asset.name}</span>
                    </td>
                    <td>{asset.type}</td>
                    <td>{asset.size || '0 KB'}</td>
                    <td>{asset.folderPath || '/'}</td>
                    <td>{new Date(asset.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button type="button" onClick={() => handleDeleteAsset(asset._id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Right Inspector Panel (Metadata & Usage) ────────────────────── */}
      {activeAsset && (
        <div
          style={{
            width: '280px',
            background: '#fff',
            borderLeft: '1px solid var(--color-line, #e4ded4)',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Asset Inspector</h4>
            <button type="button" onClick={() => setActiveAsset(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}>
              ✕
            </button>
          </div>

          <div style={{ height: '160px', background: '#fafafa', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeAsset.type === 'image' ? (
              <img src={activeAsset.url} alt={activeAsset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <FiFileText style={{ fontSize: '3rem', color: '#aaa' }} />
            )}
          </div>

          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong>{activeAsset.name}</strong>
            <span style={{ color: '#888' }}>{activeAsset.mimeType} • {activeAsset.size}</span>
            <span style={{ color: '#888', wordBreak: 'break-all' }}>{activeAsset.url}</span>
          </div>

          {/* Usage Scan */}
          <div style={{ background: '#f8faf8', padding: '10px', borderRadius: '6px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FiLayers style={{ color: 'var(--cms-accent, #426c67)' }} />
              <strong>Used In ({assetUsage?.usageCount || 0} locations)</strong>
            </div>
            {assetUsage?.usedBy?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#555' }}>
                {assetUsage.usedBy.map((u, idx) => (
                  <li key={idx}>
                    {u.entityType}: <strong>{u.title}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: '#888' }}>Asset is currently unused.</span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="primary-btn"
              onClick={async () => {
                try {
                  const res = await apiService.post('/api/ai/media', {
                    fileName: activeAsset.name,
                    fileType: activeAsset.mimeType,
                  });
                  if (res?.data?.content) {
                    const parsed = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.content;
                    alert(`✨ AI Suggested Alt Text:\n${parsed.altText || ''}\n\nCaption:\n${parsed.caption || ''}`);
                  }
                } catch (err) {
                  alert('AI Media generation failed: ' + err.message);
                }
              }}
              style={{ justifyContent: 'center' }}
            >
              <FiZap /> Auto-Generate Alt Text
            </button>
            <a href={activeAsset.url} target="_blank" rel="noreferrer" className="secondary-btn" style={{ justifyContent: 'center', textDecoration: 'none' }}>
              <FiDownload /> Download Original
            </a>
            <button type="button" onClick={() => handleDeleteAsset(activeAsset._id)} className="btn-danger" style={{ padding: '8px' }}>
              <FiTrash2 /> Delete Asset
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateFolder} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name (e.g. Hero Images)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowFolderModal(false)}>
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
  path: '/cms/media',
  component: MediaLibraryModule,
  auth: true,
  permissions: ['media.read'],
});

registerSidebar({
  key: 'media',
  label: 'Media Library 2.0',
  icon: FiImage,
  path: '/cms/media',
  group: 'Content',
  order: 3,
});
