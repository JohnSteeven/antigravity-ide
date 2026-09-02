/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SmartSEOModule.js  —  Smart SEO Assistant & Audit Engine
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiZap, FiCheckCircle, FiAlertCircle, FiSearch, FiRefreshCw,
  FiLink, FiImage, FiFileText, FiArrowRight, FiSave
} from 'react-icons/fi';

export default function SmartSEOModule() {
  const [articles, setArticles] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState(null);

  // SEO Audit / AI Suggestions State
  const [suggestions, setSuggestions] = useState(null);
  const [editedSeo, setEditedSeo] = useState({
    title: '',
    description: '',
    keywords: [],
    canonicalUrl: '',
  });

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch articles list for audit selection
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/articles?limit=50');
      if (res?.data) {
        setArticles(res.data);
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSelectArticle = (articleId) => {
    setSelectedArticleId(articleId);
    const found = articles.find((a) => a._id === articleId || a.id === articleId);
    setSelectedArticle(found || null);
    setSuggestions(null);
    if (found) {
      setEditedSeo({
        title: found.seo?.title || found.title || '',
        description: found.seo?.description || found.description || '',
        keywords: found.seo?.keywords || found.tags || [],
        canonicalUrl: found.seo?.canonicalUrl || '',
      });
    }
  };

  // Run AI Smart SEO Engine on selected article
  const handleRunSmartSeo = async () => {
    if (!selectedArticle) return;
    setGenerating(true);
    try {
      const res = await apiService.post('/api/ai/write', {
        action: 'seo_meta',
        title: selectedArticle.title,
        content: selectedArticle.body || selectedArticle.description,
        keywords: (selectedArticle.tags || []).join(', '),
        articleId: selectedArticle._id,
      });

      if (res?.data?.content) {
        try {
          const parsed = JSON.parse(res.data.content);
          setSuggestions(parsed);
          setEditedSeo((prev) => ({
            ...prev,
            title: parsed.metaTitle || prev.title,
            description: parsed.metaDescription || prev.description,
            keywords: parsed.keywords || prev.keywords,
          }));
          notify('success', 'Smart SEO analysis & suggestions generated!');
        } catch (parseErr) {
          // If response isn't strict JSON
          setSuggestions({ rawText: res.data.content });
          notify('success', 'Generated SEO recommendations.');
        }
      }
    } catch (err) {
      notify('error', err.message || 'Smart SEO analysis failed');
    } finally {
      setGenerating(false);
    }
  };

  // Save changes to Article SEO
  const handleSaveSeo = async () => {
    if (!selectedArticle) return;
    try {
      await apiService.patch(`/api/articles/${selectedArticle._id}`, {
        seo: {
          ...selectedArticle.seo,
          title: editedSeo.title,
          description: editedSeo.description,
          keywords: editedSeo.keywords,
          canonicalUrl: editedSeo.canonicalUrl,
        },
      });
      notify('success', 'Article SEO metadata updated successfully!');
      fetchArticles();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · Content Intelligence</span>
          <h2>Smart SEO Assistant</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Automated meta tags, internal linking suggestions, keyword optimization, and title score audit.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Select Article Bar */}
      <div style={{ background: 'var(--soft)', padding: 16, borderRadius: 10, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Select Article to Optimize
          </label>
          <select
            value={selectedArticleId}
            onChange={(e) => handleSelectArticle(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.9rem' }}
          >
            <option value="">-- Choose an article --</option>
            {articles.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title} ({a.category || 'General'})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleRunSmartSeo}
          disabled={!selectedArticle || generating}
          style={{ marginTop: 20 }}
        >
          {generating ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : <FiZap />}
          {generating ? 'Analyzing...' : 'Run Smart SEO Audit'}
        </button>
      </div>

      {/* Main Audit Workspace */}
      {selectedArticle && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Current vs AI Suggested Meta */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Meta Tag Editor</h3>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Meta Title ({editedSeo.title.length} / 60 chars)
              </label>
              <input
                value={editedSeo.title}
                onChange={(e) => setEditedSeo({ ...editedSeo, title: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Meta Description ({editedSeo.description.length} / 160 chars)
              </label>
              <textarea
                rows={4}
                value={editedSeo.description}
                onChange={(e) => setEditedSeo({ ...editedSeo, description: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Canonical URL
              </label>
              <input
                value={editedSeo.canonicalUrl}
                onChange={(e) => setEditedSeo({ ...editedSeo, canonicalUrl: e.target.value })}
                placeholder="https://myjourney.com/articles/slug"
                style={{ width: '100%' }}
              />
            </div>

            <button type="button" className="primary-btn" onClick={handleSaveSeo} style={{ alignSelf: 'flex-start' }}>
              <FiSave /> Save SEO Settings
            </button>
          </div>

          {/* AI Audit & Suggestions Panel */}
          <div style={{ background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiZap style={{ color: 'var(--cms-accent)' }} /> AI Intelligence Audit
            </h3>

            {suggestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {suggestions.metaTitle && (
                  <div style={{ background: 'var(--panel)', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SUGGESTED TITLE</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{suggestions.metaTitle}</div>
                  </div>
                )}

                {suggestions.metaDescription && (
                  <div style={{ background: 'var(--panel)', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SUGGESTED DESCRIPTION</div>
                    <div style={{ fontSize: '0.88rem', marginTop: 4, lineHeight: 1.5 }}>{suggestions.metaDescription}</div>
                  </div>
                )}

                {suggestions.keywords && (
                  <div style={{ background: 'var(--panel)', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>TARGET KEYWORDS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {suggestions.keywords.map((kw, i) => (
                        <span key={i} style={{ padding: '3px 8px', background: 'var(--soft)', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <FiSearch size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
                <p>Click "Run Smart SEO Audit" to evaluate and generate optimization recommendations for this article.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/ai/seo', component: SmartSEOModule, auth: true, permissions: ['seo.manage'] });
registerSidebar({ key: 'ai-seo', label: 'Smart SEO Assistant', icon: FiSearch, path: '/cms/ai/seo', group: 'Stage 3: AI Intelligence', order: 6 });
