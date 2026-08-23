/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AICopilotPanel.jsx  —  Persistent Context-Aware AI Copilot Drawer
 *  MyJourney CMS  |  Stage 3 — Phase 20C: AI-Native CMS Integration
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import apiService from '../../../services/apiService';
import {
  FiZap, FiX, FiSend, FiRefreshCw, FiCheckCircle,
  FiBookOpen, FiEdit3, FiSearch, FiFolder, FiImage, FiSliders
} from 'react-icons/fi';

export default function AICopilotPanel({ isOpen, onClose }) {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const messagesEndRef = useRef(null);

  // Deduce current CMS context from path
  const activePath = location.pathname;
  let contextLabel = 'CMS Overview';
  let contextType = 'general';

  if (activePath.includes('articles')) { contextLabel = 'Article Editor'; contextType = 'article'; }
  else if (activePath.includes('categories')) { contextLabel = 'Category Manager'; contextType = 'category'; }
  else if (activePath.includes('media')) { contextLabel = 'Media Library'; contextType = 'media'; }
  else if (activePath.includes('seo')) { contextLabel = 'SEO Engine'; contextType = 'seo'; }
  else if (activePath.includes('theme')) { contextLabel = 'Theme Builder'; contextType = 'theme'; }
  else if (activePath.includes('website')) { contextLabel = 'Website Builder'; contextType = 'page'; }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await apiService.post('/api/ai/chat', {
        query: text,
        mode: 'hybrid',
        interface: 'admin',
      });

      if (res?.data) {
        const assistantMsg = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations || [],
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action Handler
  const handleQuickAction = async (actionType) => {
    setLoading(true);
    try {
      let res;
      if (actionType === 'audit') {
        res = await apiService.post('/api/ai/article/audit', { title: 'Draft', body: 'Sample article body' });
      } else if (actionType === 'category') {
        res = await apiService.post('/api/ai/category', { categoryName: 'Coding' });
      } else if (actionType === 'theme') {
        res = await apiService.post('/api/ai/theme', { brandName: 'MyJourney', stylePreference: 'sleek dark' });
      } else if (actionType === 'dashboard') {
        res = await apiService.post('/api/ai/dashboard', {});
      }

      if (res?.data) {
        const formatted = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚡ **Quick Action Output:**\n\`\`\`json\n${formatted}\n\`\`\`` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Action failed: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: '100vw',
        background: 'var(--panel, #1f2022)',
        color: 'var(--ink, #f5f0eb)',
        borderLeft: '1px solid var(--line, #333)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
        zIndex: 15000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line, #333)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: 'var(--soft, #18191b)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiZap style={{ color: 'var(--cms-accent, #426c67)', fontSize: '1.2rem' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Copilot</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #888)' }}>Context: {contextLabel}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted, #888)', cursor: 'pointer', fontSize: '1.1rem' }}><FiX /></button>
      </div>

      {/* Context Quick Actions Bar */}
      <div style={{ padding: '10px 16px', background: 'var(--soft, #18191b)', borderBottom: '1px solid var(--line, #333)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {contextType === 'article' && (
          <>
            <button className="small-outline-btn" style={{ fontSize: '0.72rem' }} onClick={() => handleQuickAction('audit')}>Pre-publish Audit</button>
            <button className="small-outline-btn" style={{ fontSize: '0.72rem' }} onClick={() => handleSend('Suggest 5 catchy titles for this article')}>Title Ideas</button>
          </>
        )}
        {contextType === 'category' && (
          <button className="small-outline-btn" style={{ fontSize: '0.72rem' }} onClick={() => handleQuickAction('category')}>Auto-Gen Category</button>
        )}
        {contextType === 'theme' && (
          <button className="small-outline-btn" style={{ fontSize: '0.72rem' }} onClick={() => handleQuickAction('theme')}>Suggest Palette</button>
        )}
        {contextType === 'general' && (
          <button className="small-outline-btn" style={{ fontSize: '0.72rem' }} onClick={() => handleQuickAction('dashboard')}>Growth Suggestions</button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted, #888)', margin: 'auto 0' }}>
            <FiZap size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>I'm your AI Copilot</div>
            <div style={{ fontSize: '0.8rem' }}>Ask questions about {contextLabel} or use quick actions above.</div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: m.role === 'user' ? 'var(--cms-accent, #426c67)' : 'var(--soft, #18191b)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink, #f5f0eb)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--line, #333)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted, #888)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: 12, borderTop: '1px solid var(--line, #333)', display: 'flex', gap: 8, background: 'var(--soft, #18191b)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask AI about ${contextLabel}...`}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line, #333)', background: 'var(--panel, #1f2022)', color: 'var(--ink, #f5f0eb)', fontSize: '0.84rem' }}
        />
        <button type="submit" className="primary-btn" disabled={loading || !query.trim()} style={{ padding: '8px 14px' }}>
          <FiSend />
        </button>
      </form>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
