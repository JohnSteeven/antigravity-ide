/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIWriterModule.js  —  AI Writing Assistant Dashboard
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Standalone AI writing workspace. Also exposes the useAIWriter hook
 *  which the ArticleModule integrates for inline AI assistance.
 *
 *  Content Safety: Generated content is NEVER auto-saved.
 *  All output requires manual copy/paste or click-to-insert.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiEdit3, FiZap, FiRefreshCw, FiCopy, FiCheckCircle, FiAlertCircle,
  FiChevronDown, FiMaximize2, FiMinimize2, FiCpu,
} from 'react-icons/fi';

const ACTIONS = [
  { group: 'Generate',  items: [{ key: 'generate', label: 'Generate Article', requiresTitle: true }] },
  { group: 'Rewrite',   items: [
    { key: 'rewrite',             label: 'Rewrite Selection' },
    { key: 'improve_readability', label: 'Improve Readability' },
    { key: 'improve_grammar',     label: 'Fix Grammar & Spelling' },
    { key: 'expand',              label: 'Expand Paragraph' },
    { key: 'shorten',             label: 'Shorten Paragraph' },
  ]},
  { group: 'Summarise', items: [
    { key: 'generate_summary', label: 'Generate Summary' },
    { key: 'generate_excerpt', label: 'Generate Excerpt' },
  ]},
  { group: 'Suggest',   items: [
    { key: 'suggest_headings', label: 'Suggest Headings' },
    { key: 'suggest_tags',     label: 'Suggest Tags' },
    { key: 'suggest_faqs',     label: 'Generate FAQs' },
  ]},
  { group: 'SEO',       items: [
    { key: 'seo_meta', label: 'Generate SEO Meta', requiresTitle: true },
  ]},
];

const TONES = ['engaging', 'professional', 'casual', 'technical', 'inspirational', 'educational', 'storytelling'];

export default function AIWriterModule() {
  const [action, setAction]       = useState('generate');
  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [category, setCategory]   = useState('');
  const [tone, setTone]           = useState('engaging');
  const [output, setOutput]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied]       = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 6000);
  };

  const selectedAction = ACTIONS.flatMap((g) => g.items).find((a) => a.key === action);

  const handleRun = useCallback(async () => {
    if (!content && !title) {
      notify('error', 'Please enter some content or a title first.');
      return;
    }
    setLoading(true);
    setOutput('');
    setTokenInfo(null);
    try {
      const res = await apiService.post('/api/ai/write', {
        action,
        title,
        content,
        category,
        tone,
        wordCount: 80,
        count: 5,
      });
      if (res?.data) {
        setOutput(res.data.content);
        setTokenInfo(res.data.tokens);
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [action, title, content, category, tone]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="cms-panel wide" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 3 · AI Intelligence</span>
          <h2>AI Writing Assistant</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            AI-generated content always requires manual review. Nothing is auto-saved.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action picker */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Action</label>
            {ACTIONS.map((group) => (
              <div key={group.group} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{group.group}</div>
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAction(item.key)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '7px 12px', marginBottom: 3,
                      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.83rem',
                      background: action === item.key ? 'var(--cms-accent)' : 'transparent',
                      color: action === item.key ? '#fff' : 'var(--ink)',
                      fontWeight: action === item.key ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Tone */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: '100%' }}>
              {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Right: Input + Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Inputs */}
          <div style={{ background: 'var(--soft)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Article Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How to Build a React App" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Coding, Life, Travel" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Content / Selection <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(paste text for rewrite/expand/etc.)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={expanded ? 16 : 6}
                placeholder="Paste your article content or selected paragraph here…"
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setExpanded(!expanded)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                {expanded ? <FiMinimize2 /> : <FiMaximize2 />} {expanded ? 'Collapse' : 'Expand'}
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleRun}
                disabled={loading}
                style={{ minWidth: 140 }}
              >
                {loading ? <><FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><FiZap /> Run AI</>}
              </button>
            </div>
          </div>

          {/* Output */}
          {(output || loading) && (
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCpu style={{ color: 'var(--cms-accent)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Output</span>
                  {tokenInfo && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', padding: '2px 8px', background: 'var(--soft)', borderRadius: 100 }}>
                      {tokenInfo.total?.toLocaleString()} tokens
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="small-outline-btn" onClick={handleCopy} disabled={!output}>
                    {copied ? <FiCheckCircle /> : <FiCopy />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="small-outline-btn" onClick={() => setOutput('')}>Clear</button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                  <FiCpu size={28} style={{ animation: 'spin 2s linear infinite', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>Generating with AI…</p>
                </div>
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.88rem',
                  lineHeight: 1.7, color: 'var(--ink)', maxHeight: 500, overflowY: 'auto',
                  padding: '12px 0',
                }}>
                  {output}
                </div>
              )}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: '0.75rem', color: 'var(--muted)' }}>
                ⚠ Review all AI output before using. AI can make mistakes. Content is not saved automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Hook for Article Editor Integration ──────────────────────────────────────

export function useAIWriter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (action, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.post('/api/ai/write', { action, ...params });
      return res?.data || null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}

// ── Self Registration ─────────────────────────────────────────────────────────
registerRoute({ path: '/cms/ai/writer', component: AIWriterModule, auth: true, permissions: ['ai.write'] });
registerSidebar({ key: 'ai-writer', label: 'AI Writing Assistant', icon: FiEdit3, path: '/cms/ai/writer', group: 'Stage 3: AI Intelligence', order: 2 });
