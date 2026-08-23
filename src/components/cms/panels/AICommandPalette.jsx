/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AICommandPalette.jsx  —  Global AI Command Palette (Ctrl + K)
 *  MyJourney CMS  |  Stage 3 — Phase 20C: AI-Native CMS Integration
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import apiService from '../../../services/apiService';
import {
  FiCommand, FiSearch, FiZap, FiEdit3, FiFolder, FiImage,
  FiBarChart2, FiSettings, FiCheckCircle, FiArrowRight, FiX, FiCpu
} from 'react-icons/fi';

const QUICK_ACTIONS = [
  { id: 'new-article', label: 'Create New Article', path: '/cms/articles', icon: FiEdit3, category: 'Content' },
  { id: 'ai-writer', label: 'Open AI Writing Workspace', path: '/cms/ai-writer', icon: FiZap, category: 'AI Tools' },
  { id: 'smart-seo', label: 'Run Smart SEO Audit', path: '/cms/ai-seo', icon: FiSearch, category: 'AI Tools' },
  { id: 'media', label: 'Open Media Library', path: '/cms/media', icon: FiImage, category: 'Assets' },
  { id: 'categories', label: 'Manage Categories', path: '/cms/categories', icon: FiFolder, category: 'Taxonomy' },
  { id: 'analytics', label: 'View AI Analytics', path: '/cms/ai-analytics', icon: FiBarChart2, category: 'Analytics' },
  { id: 'providers', label: 'AI Provider Settings', path: '/cms/ai-providers', icon: FiSettings, category: 'Settings' },
];

export default function AICommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Global Ctrl + K / Cmd + K keydown listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
      setAiResult(null);
    }
  }, [isOpen]);

  const filteredActions = QUICK_ACTIONS.filter(
    (a) =>
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleActionSelect = (action) => {
    setIsOpen(false);
    navigate(action.path);
  };

  const handleRunAiQuery = async () => {
    if (!search.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await apiService.post('/api/ai/chat', {
        query: search,
        mode: 'hybrid',
        interface: 'admin',
      });
      if (res?.data) {
        setAiResult(res.data.answer);
      }
    } catch (err) {
      setAiResult(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: 640,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--panel, #1f2022)',
          color: 'var(--ink, #f5f0eb)',
          border: '1px solid var(--line, #333)',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--line, #333)',
            background: 'var(--soft, #18191b)',
          }}
        >
          <FiSearch style={{ color: 'var(--cms-accent, #426c67)', fontSize: '1.2rem', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunAiQuery();
            }}
            placeholder="Type a command, route, or ask AI a question... (Press Enter to ask AI)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              fontSize: '1rem',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', background: 'var(--line, #333)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted, #888)' }}>ESC</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted, #888)', cursor: 'pointer' }}><FiX /></button>
          </div>
        </div>

        {/* AI Direct Answer View */}
        {aiLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted, #888)', fontSize: '0.9rem' }}>
            <FiCpu style={{ animation: 'spin 1s linear infinite', marginBottom: 8, fontSize: '1.4rem' }} />
            <div>Asking AI Knowledge Assistant...</div>
          </div>
        )}

        {aiResult && (
          <div style={{ padding: 20, background: 'var(--soft, #18191b)', borderBottom: '1px solid var(--line, #333)', maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cms-accent, #426c67)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiZap /> AI Quick Answer
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiResult}</div>
          </div>
        )}

        {/* Filtered Quick Actions & Navigation */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          <div style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted, #888)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Actions & Commands
          </div>

          {filteredActions.length === 0 ? (
            <div style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--muted, #888)' }}>
              Press <strong>Enter</strong> to send "{search}" directly to the AI Assistant.
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  onClick={() => handleActionSelect(action)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft, #2a2b2e)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--soft, #2a2b2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent, #426c67)' }}>
                      <Icon size={16} />
                    </div>
                    <span>{action.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--muted, #888)' }}>
                    <span>{action.category}</span>
                    <FiArrowRight size={14} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div style={{ padding: '10px 16px', background: 'var(--soft, #18191b)', borderTop: '1px solid var(--line, #333)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted, #888)' }}>
          <span>Tip: Use <kbd>Ctrl + K</kbd> anywhere in CMS to open</span>
          <span>MyJourney Intelligence v3.0</span>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
