/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AskMyJourneyWidget.jsx  —  Public Reader AI Assistant Widget
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiService from '../../services/apiService';
import {
  FiZap, FiX, FiSend, FiRefreshCw, FiBookOpen,
  FiThumbsUp, FiThumbsDown, FiHelpCircle, FiHelpCircle as FiQuiz, FiMinimize2
} from 'react-icons/fi';

export default function AskMyJourneyWidget({ articleSlug = null, categorySlug = null }) {
  const [isAiAvailable, setIsAiAvailable] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('hybrid');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Check AI provider status on mount
  useEffect(() => {
    let isMounted = true;
    apiService
      .get('/api/ai/status')
      .then((res) => {
        if (isMounted && res?.data?.available) {
          setIsAiAvailable(true);
        } else if (isMounted) {
          setIsAiAvailable(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAiAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Load suggested questions when opening
  const fetchSuggested = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (articleSlug) queryParams.append('articleSlug', articleSlug);
      if (categorySlug) queryParams.append('category', categorySlug);

      const res = await apiService.get(`/api/ai/suggested-questions?${queryParams.toString()}`);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setSuggestedQuestions(res.data);
      } else {
        setSuggestedQuestions([
          'How do I learn React?',
          'Recommend backend articles',
          'Explain JWT',
          'What should I read today?',
        ]);
      }
    } catch (err) {
      setSuggestedQuestions([
        'How do I learn React?',
        'Recommend backend articles',
        'Explain JWT',
        'What should I read today?',
      ]);
    }
  }, [articleSlug, categorySlug]);

  useEffect(() => {
    if (isOpen && suggestedQuestions.length === 0) {
      fetchSuggested();
    }
  }, [isOpen, fetchSuggested, suggestedQuestions.length]);

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
        mode,
        interface: 'reader',
        conversationId,
        contextArticleSlug: articleSlug,
        category: categorySlug,
      });

      if (res?.data) {
        const assistantMsg = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations || [],
          sourceType: res.data.sourceType,
          id: res.data.messageId || Date.now().toString(),
          createdAt: new Date(),
        };

        if (res.data.conversationId) setConversationId(res.data.conversationId);
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I hit an error answering that. Please make sure an AI provider is configured in CMS.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId, feedback) => {
    if (!conversationId) return;
    try {
      await apiService.post('/api/ai/feedback', { conversationId, messageId, feedback });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!articleSlug || quizLoading) return;
    setQuizLoading(true);
    try {
      const res = await apiService.post('/api/ai/quiz', { articleSlug, questionCount: 5 });
      if (res?.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📝 **Article Quiz**\n\n${res.data.content}`,
            createdAt: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  if (!isAiAvailable) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--paper, #1a1a1a)',
            color: 'var(--ink, #ffffff)',
            border: '1px solid var(--line, rgba(255,255,255,0.2))',
            borderRadius: 100,
            padding: '12px 20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <FiZap style={{ color: '#f59e0b' }} />
          <span>Ask MyJourney AI</span>
        </button>
      )}

      {/* Floating Assistant Drawer / Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            height: 580,
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--paper, #18181b)',
            color: 'var(--ink, #f4f4f5)',
            border: '1px solid var(--line, rgba(255,255,255,0.15))',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line, rgba(255,255,255,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--panel, #27272a)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <FiZap />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>MyJourney AI Companion</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted, #a1a1aa)' }}>RAG Knowledge Engine</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mode Toggle */}
              <button
                type="button"
                onClick={() => setMode(mode === 'hybrid' ? 'knowledge-only' : 'hybrid')}
                style={{
                  background: 'none', border: '1px solid var(--line, rgba(255,255,255,0.2))',
                  borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', color: 'var(--muted, #a1a1aa)',
                  cursor: 'pointer',
                }}
                title="Toggle Mode"
              >
                {mode === 'hybrid' ? 'Hybrid Mode' : 'Knowledge Only'}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted, #a1a1aa)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto 0', padding: '12px 8px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted, #a1a1aa)', marginBottom: 16 }}>
                  Ask me anything about articles, topics, or recommendations.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      style={{
                        padding: '8px 12px', borderRadius: 100, border: '1px solid var(--line, rgba(255,255,255,0.15))',
                        background: 'var(--panel, #27272a)', color: 'var(--ink, #f4f4f5)',
                        fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                  {articleSlug && (
                    <button
                      type="button"
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading}
                      style={{
                        padding: '8px 12px', borderRadius: 100, border: '1px solid #f59e0b50',
                        background: '#f59e0b15', color: '#f59e0b',
                        fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      {quizLoading ? 'Generating Quiz...' : '✨ Generate Article Quiz'}
                    </button>
                  )}
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
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: msg.role === 'user' ? '#2563eb' : 'var(--panel, #27272a)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ink, #f4f4f5)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--line, rgba(255,255,255,0.1))',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Sources / Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{ maxWidth: '85%', marginTop: 6, padding: '8px 10px', background: 'var(--panel, #27272a)', borderRadius: 8, fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--muted, #a1a1aa)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiBookOpen size={12} /> Sources:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {msg.citations.map((c, cIdx) => (
                          <a
                            key={cIdx}
                            href={`/articles/${c.slug}`}
                            style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: '0.75rem' }}
                          >
                            ✓ {c.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {msg.role === 'assistant' && !msg.isError && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.7rem', color: 'var(--muted, #a1a1aa)' }}>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'helpful')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.feedback === 'helpful' ? '#10b981' : 'inherit' }}
                      >
                        <FiThumbsUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'not_helpful')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.feedback === 'not_helpful' ? '#ef4444' : 'inherit' }}
                      >
                        <FiThumbsDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted, #a1a1aa)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Searching knowledge base...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: 12, borderTop: '1px solid var(--line, rgba(255,255,255,0.1))',
              display: 'flex', gap: 8, background: 'var(--panel, #27272a)',
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--line, rgba(255,255,255,0.15))',
                background: 'var(--paper, #18181b)', color: 'var(--ink, #f4f4f5)',
                fontSize: '0.85rem',
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: '#2563eb', color: '#fff', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem',
              }}
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
