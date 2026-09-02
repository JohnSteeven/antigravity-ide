/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIAssistantModule.js  —  AI Knowledge Assistant & Index Dashboard (CMS)
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiMessageSquare, FiDatabase, FiRefreshCw, FiSend, FiCheckCircle,
  FiAlertCircle, FiThumbsUp, FiThumbsDown, FiBookOpen, FiZap, FiHelpCircle,
  FiSliders, FiLayers, FiList, FiCheck
} from 'react-icons/fi';

const MODES = [
  { id: 'hybrid', label: 'Hybrid', desc: 'Search MyJourney first, fallback to General AI' },
  { id: 'knowledge-only', label: 'Knowledge Only', desc: 'Strictly answer from published MyJourney content' },
  { id: 'general', label: 'General AI', desc: 'Standard LLM without knowledge base context' },
];

export default function AIAssistantModule() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'index'
  const [mode, setMode] = useState('hybrid');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Index Stats State
  const [indexStats, setIndexStats] = useState(null);
  const [indexing, setIndexing] = useState(false);

  const messagesEndRef = useRef(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch suggested questions & index stats on load
  const fetchInitialData = useCallback(async () => {
    const [questionsRes, statsRes] = await Promise.all([
      apiService.get('/api/ai/suggested-questions').catch(() => null),
      apiService.get('/api/ai/index/stats').catch(() => null),
    ]);

    if (questionsRes?.data && Array.isArray(questionsRes.data) && questionsRes.data.length > 0) {
      setSuggestedQuestions(questionsRes.data);
    } else {
      setSuggestedQuestions([
        'How do I learn React?',
        'Recommend backend articles',
        'Explain JWT',
        'What should I read today?',
        'Best travel guides',
      ]);
    }

    if (statsRes?.data) {
      setIndexStats(statsRes.data);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Send Chat Message
  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await apiService.post('/api/ai/chat', {
        query: text,
        mode,
        interface: 'admin',
        conversationId,
      });

      if (res?.data) {
        const assistantMessage = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations || [],
          sourceType: res.data.sourceType,
          tokens: res.data.tokens,
          latencyMs: res.data.latencyMs,
          id: res.data.messageId || Date.now().toString(),
          createdAt: new Date(),
        };

        if (res.data.conversationId) {
          setConversationId(res.data.conversationId);
        }

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      notify('error', err.message || 'Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  // Feedback Submission
  const handleFeedback = async (messageId, feedback) => {
    if (!conversationId) return;
    try {
      await apiService.post('/api/ai/feedback', {
        conversationId,
        messageId,
        feedback,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedback } : msg
        )
      );
      notify('success', 'Thank you for your feedback!');
    } catch (err) {
      notify('error', err.message);
    }
  };

  // Trigger Re-indexing
  const handleReindex = async () => {
    setIndexing(true);
    try {
      await apiService.post('/api/ai/index/reindex');
      notify('success', 'Knowledge base re-indexing started in background.');
      setTimeout(fetchInitialData, 2000);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div className="cms-panel wide" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', padding: 0 }}>
      {/* Top Header & Tabs */}
      <div className="cms-panel-heading" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)' }}>
        <div>
          <span className="section-kicker">Stage 3 · AI Intelligence</span>
          <h2>AI Knowledge Assistant & RAG Engine</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            RAG-powered conversational search grounded in published MyJourney content.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            className={activeTab === 'chat' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('chat')}
          >
            <FiMessageSquare /> Assistant
          </button>
          <button
            type="button"
            className={activeTab === 'index' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('index')}
          >
            <FiDatabase /> Knowledge Index
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'chat' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', flex: 1, overflow: 'hidden' }}>
          {/* Chat Column */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--line)' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 480 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--soft)', color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <FiZap size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 8px' }}>Ask MyJourney AI</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24 }}>
                    Query published articles, analyze platform metrics, or ask technical questions.
                  </p>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>Suggested Prompts</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(q)}
                          style={{
                            textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                            background: 'var(--soft)', border: '1px solid var(--line)',
                            cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink)',
                            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease'
                          }}
                        >
                          <FiHelpCircle style={{ color: 'var(--cms-accent)', flexShrink: 0 }} />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: msg.role === 'user' ? 'var(--cms-accent)' : 'var(--panel)',
                        color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--line)',
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Citations / Sources */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div style={{ maxWidth: '82%', marginTop: 8, padding: '10px 14px', background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 8, fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiBookOpen size={14} /> Citations ({msg.citations.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {msg.citations.map((c, cIdx) => (
                            <a
                              key={cIdx}
                              href={`/articles/${c.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '3px 8px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--cms-accent)', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                            >
                              ✓ {c.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback & Metadata */}
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.72rem', color: 'var(--muted)' }}>
                        <span>Source: <strong>{msg.sourceType}</strong></span>
                        {msg.latencyMs && <span>{msg.latencyMs}ms</span>}

                        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'helpful')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.feedback === 'helpful' ? '#2e7d5a' : 'var(--muted)' }}
                            title="Helpful"
                          >
                            <FiThumbsUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'not_helpful')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.feedback === 'not_helpful' ? '#9d3e32' : 'var(--muted)' }}
                            title="Not Helpful"
                          >
                            <FiThumbsDown size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Generating response via RAG pipeline...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12, background: 'var(--panel)' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about articles, platform features, or technology topics..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.9rem' }}
                disabled={loading}
              />
              <button type="submit" className="primary-btn" disabled={loading || !query.trim()}>
                <FiSend /> Send
              </button>
            </form>
          </div>

          {/* Right Controls Panel */}
          <div style={{ padding: 20, background: 'var(--soft)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
                RAG Search Mode
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MODES.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    style={{
                      padding: 12, borderRadius: 8, cursor: 'pointer',
                      border: mode === m.id ? '2px solid var(--cms-accent)' : '1px solid var(--line)',
                      background: mode === m.id ? 'var(--panel)' : 'transparent',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{m.label}</span>
                      {mode === m.id && <FiCheck style={{ color: 'var(--cms-accent)' }} />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                      {m.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {indexStats && (
              <div style={{ background: 'var(--panel)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Knowledge Index Status
                </div>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Indexed Chunks: <strong>{indexStats.chunksIndexed || 0}</strong></div>
                  <div>Indexed Articles: <strong>{indexStats.articlesIndexed || 0} / {indexStats.publishedArticles || 0}</strong></div>
                  <div>Coverage: <strong>{indexStats.coveragePercent || 0}%</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Knowledge Index Tab */
        <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px' }}>RAG Knowledge Index Status</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                The Knowledge Search Engine chunks published articles into searchable sections.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--soft)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Indexed Chunks</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>{indexStats?.chunksIndexed || 0}</div>
                </div>
                <div style={{ background: 'var(--soft)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Indexed Articles</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>{indexStats?.articlesIndexed || 0}</div>
                </div>
                <div style={{ background: 'var(--soft)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Coverage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#2e7d5a' }}>{indexStats?.coveragePercent || 0}%</div>
                </div>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={handleReindex}
                disabled={indexing}
              >
                <FiRefreshCw style={{ animation: indexing ? 'spin 1s linear infinite' : 'none' }} />
                {indexing ? 'Re-indexing Articles...' : 'Trigger Full Re-index'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/ai/assistant', component: AIAssistantModule, auth: true, permissions: ['ai.read'] });
registerSidebar({ key: 'ai-assistant', label: 'AI Knowledge Assistant', icon: FiMessageSquare, path: '/cms/ai/assistant', group: 'Stage 3: AI Intelligence', order: 5 });
