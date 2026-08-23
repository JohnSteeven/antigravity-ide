/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AskMyJourneyWidget.jsx  —  Floating AI Companion
 *  MyJourney CMS  |  Stage 4 — MyJourney Agent Premium UI Pass
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import {
  FiBookOpen,
  FiChevronRight,
  FiLock,
  FiMaximize2,
  FiMic,
  FiMicOff,
  FiRefreshCw,
  FiSend,
  FiX,
  FiZap,
} from "react-icons/fi";

import { useAgent } from "../../features/agent/AgentContext.jsx";
import VoiceControls from "../../features/agent/voice/VoiceControls.jsx";
import { useAuth } from "../../hooks/useAuth";
import "../../features/agent/agent.css";

const toolHumanLabels = {
  "account.getProfile": "Account Profile",
  "account.getSubscription": "Subscription Status",
  "life.getToday": "Today's Schedule",
  "life.getHabits": "Life Habits",
  "life.getGoals": "Life Goals",
  "life.getRecentProgress": "Recent Progress",
  "learn.searchCourses": "Course Search",
  "learn.getEnrollments": "Course Enrollments",
  "learn.getProgress": "Learning Progress",
  "learn.getNextLesson": "Next Lesson",
  "content.searchArticles": "Article Search",
  "content.searchStories": "Story Search",
  "creators.search": "Creator Directory",
  "creators.getProfile": "Creator Profile",
  "knowledge.search": "Knowledge Base",
  "life.recordWater": "Water Log",
  "life.completeHabit": "Habit Completion",
  "life.createTask": "Life Task",
};

function formatAssistantText(text) {
  if (!text) return null;
  const clean = text.replace(/---\s*SOURCE\s*\d+\s*---/gi, "").trim();
  const paragraphs = clean.split(/\n\n+/).filter(Boolean);

  return paragraphs.map((para, idx) => {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const isList =
      lines.length > 1 &&
      lines.every((l) => l.startsWith("- ") || l.startsWith("• ") || l.startsWith("* ") || /^\d+\.\s/.test(l));

    if (isList) {
      return (
        <ul key={idx}>
          {lines.map((item, itemIdx) => (
            <li key={itemIdx}>{item.replace(/^[-•*]\s+|\d+\.\s+/, "")}</li>
          ))}
        </ul>
      );
    }
    return <p key={idx}>{para}</p>;
  });
}

function CitationList({ citations }) {
  if (!citations?.length) return null;

  return (
    <div className="agent-message__citations">
      <div className="agent-citations__title">
        <FiBookOpen aria-hidden="true" /> Sources
      </div>
      {citations.map((c, idx) => {
        const title = c.title || c.slug || "Article Source";
        const tags = Array.isArray(c.tags)
          ? c.tags.join(" · ")
          : c.category || "MyJourney";

        return c.slug ? (
          <Link
            key={c.id || c._id || idx}
            to={`/articles/${encodeURIComponent(c.slug)}`}
            className="agent-source-card"
          >
            <div className="agent-source-card__info">
              <span className="agent-source-card__title">
                [{idx + 1}] {title}
              </span>
              <span className="agent-source-card__tags">{tags}</span>
            </div>
            <span className="agent-source-card__arrow">
              <FiChevronRight aria-hidden="true" />
            </span>
          </Link>
        ) : (
          <div key={c.id || c._id || idx} className="agent-source-card">
            <div className="agent-source-card__info">
              <span className="agent-source-card__title">
                [{idx + 1}] {title}
              </span>
              <span className="agent-source-card__tags">{tags}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolExecutions({ executions }) {
  if (!executions?.length) return null;
  const successful = executions.filter((t) => t.status !== "failed");
  if (!successful.length) return null;

  return (
    <div className="agent-message__tools" aria-label="Tools used">
      {successful.slice(0, 3).map((e, idx) => {
        const key = e.toolKey || e.toolName || e.tool || "";
        const label = toolHumanLabels[key] || e.displayName || key || "Domain Tool";
        return (
          <span key={e.id || e._id || idx} className="agent-tool-chip">
            <span className="agent-tool-chip__dot" aria-hidden="true" />
            {label}
          </span>
        );
      })}
    </div>
  );
}

function EntitlementNotice({ content }) {
  const readable = String(content || "")
    .replace(/life(?:\.|\s+)getToday/gi, "Life and Today activities")
    .replace(/life(?:\.|\s+)getHabits/gi, "Life habits")
    .replace(/life(?:\.|\s+)getGoals/gi, "Life goals")
    .replace(/life(?:\.|\s+)[a-zA-Z0-9_]+/gi, "private Life data");

  return (
    <div className="agent-entitlement-notice">
      <div className="agent-entitlement-notice__header">
        <FiLock aria-hidden="true" /> Premium Feature
      </div>
      <div className="agent-entitlement-notice__body">{readable}</div>
      <Link to="/pricing" className="agent-entitlement-notice__action">
        Upgrade to Premium →
      </Link>
    </div>
  );
}

function MessageBubble({ message }) {
  const assistant = message.role === "assistant";
  const content = String(message.content || "");
  const isPremiumNotice =
    assistant &&
    (content.includes("MyJourney Premium is required") ||
      content.includes("Upgrade to get full access"));

  const citations = Array.isArray(message.citations) ? message.citations : [];
  const toolExecutions = Array.isArray(message.toolExecutions)
    ? message.toolExecutions
    : [];

  return (
    <article
      className={`agent-message agent-message--${assistant ? "assistant" : "user"} ${
        message.status === "sending" ? "is-sending" : ""
      }`}
      aria-label={assistant ? "MyJourney response" : "Your message"}
    >
      <div className="agent-message__bubble">
        {assistant ? formatAssistantText(content) : content}
      </div>

      {isPremiumNotice && <EntitlementNotice content={content} />}

      {message.status === "failed" && (
        <span className="agent-message__failed">Message was not delivered.</span>
      )}

      {toolExecutions.length > 0 && (
        <ToolExecutions executions={toolExecutions} />
      )}

      {citations.length > 0 && <CitationList citations={citations} />}
    </article>
  );
}

export default function AskMyJourneyWidget({
  articleSlug = null,
  categorySlug = null,
}) {
  const {
    capabilities,
    messages,
    sending,
    error,
    sendMessage,
    cancelMessage,
  } = useAgent();
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const agentEnabled = capabilities?.agentEnabled !== false;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (textToSend) => {
      const text = String(textToSend || query).trim();
      if (!text || sending) return;

      if (!isAuthenticated) {
        setAuthPrompt(true);
        return;
      }

      setAuthPrompt(false);
      setQuery("");
      try {
        await sendMessage(text, {
          source: "typed",
          pageContext: {
            currentRoute: window.location.pathname,
            articleSlug: articleSlug || undefined,
            categorySlug: categorySlug || undefined,
          },
        });
      } catch (_sendError) {
        // Handled in AgentContext
      }
    },
    [query, sending, sendMessage, articleSlug, categorySlug, isAuthenticated]
  );

  const handleVoiceTranscript = useCallback(
    (transcript) => {
      if (!transcript) return;
      if (!isAuthenticated) {
        setAuthPrompt(true);
        return;
      }
      sendMessage(transcript, { source: "voice" }).catch(() => {});
    },
    [sendMessage, isAuthenticated]
  );

  if (!agentEnabled) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          id="ask-myjourney-open-btn"
          className="ask-myjourney-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Ask MyJourney AI"
        >
          <span className="ask-myjourney-trigger__dot" aria-hidden="true" />
          <FiZap className="ask-myjourney-trigger__icon" aria-hidden="true" />
          <span>Ask MyJourney</span>
        </button>
      )}

      {/* Floating Assistant Window */}
      {isOpen && (
        <div
          id="ask-myjourney-panel"
          className="ask-myjourney-window"
          role="dialog"
          aria-labelledby="ask-myjourney-dialog-title"
        >
          {/* Header */}
          <header className="agent-panel__header">
            <div className="agent-panel__identity">
              <div className="agent-panel__identity-icon" aria-hidden="true">
                <FiZap />
              </div>
              <div>
                <h2 id="ask-myjourney-dialog-title">Ask MyJourney</h2>
                <p>Knowledge &amp; Life Assistant</p>
              </div>
            </div>

            <div className="agent-panel__header-actions">
              <Link
                to="/agent"
                onClick={() => setIsOpen(false)}
                className="agent-panel__header-btn"
                title="Open full MyJourney Agent"
                aria-label="Open full Agent page"
              >
                <FiMaximize2 size={15} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="agent-panel__header-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close Ask MyJourney"
              >
                <FiX size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Messages Body */}
          <div className="agent-panel__messages" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="agent-panel__welcome">
                <div className="agent-panel__welcome-icon" aria-hidden="true">
                  <FiZap />
                </div>
                <h3>What would make today clearer?</h3>
                <p>
                  Ask about MyJourney stories, explore courses, or ask about
                  your Life habits and goals.
                </p>
                <div className="agent-panel__chips">
                  {[
                    "What are today's activities?",
                    "Show my goals",
                    "Recommend an article",
                    "Find courses on React",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="agent-panel__chip"
                      onClick={() => handleSend(q)}
                      disabled={sending}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble key={msg._id || msg.id || i} message={msg} />
              ))
            )}

            {sending && (
              <div className="agent-panel__working" role="status">
                <FiRefreshCw aria-hidden="true" />
                <span>MyJourney is thinking…</span>
              </div>
            )}

            {authPrompt && !isAuthenticated && (
              <div className="agent-page__auth-note" role="status">
                <strong>Sign in required: </strong>
                Please{" "}
                <Link to="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  sign in
                </Link>{" "}
                to ask about your private Life data and chat with MyJourney Agent.
              </div>
            )}

            {error && !sending && (
              <div className="agent-panel__error" role="alert">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice controls drawer */}
          {voiceOpen && (
            <div style={{ padding: "0.65rem 1.25rem", borderTop: "1px solid var(--agent-line)", background: "var(--agent-panel)" }}>
              <VoiceControls
                onTranscript={handleVoiceTranscript}
                disabled={sending}
              />
            </div>
          )}

          {/* Composer Footer */}
          <footer className="agent-composer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="agent-composer__form"
            >
              <button
                type="button"
                onClick={() => setVoiceOpen((v) => !v)}
                title={voiceOpen ? "Hide voice input" : "Use voice input"}
                style={{
                  background: voiceOpen ? "var(--agent-accent-light)" : "transparent",
                  border: "none",
                  borderRadius: "var(--agent-radius-md)",
                  color: voiceOpen ? "var(--agent-accent)" : "var(--agent-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 38,
                  width: 38,
                  marginBottom: 2,
                  transition: "all 0.15s ease",
                }}
                aria-label="Toggle voice input"
              >
                {voiceOpen ? <FiMicOff size={16} /> : <FiMic size={16} />}
              </button>

              <textarea
                ref={inputRef}
                className="agent-composer__textarea"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask MyJourney anything…"
                rows="1"
                disabled={sending}
              />

              {sending ? (
                <button
                  type="button"
                  className="agent-composer__cancel"
                  onClick={cancelMessage}
                  title="Stop"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="agent-composer__send"
                  disabled={!query.trim()}
                  aria-label="Send message"
                  title="Send"
                >
                  <FiSend aria-hidden="true" />
                </button>
              )}
            </form>
          </footer>
        </div>
      )}
    </>
  );
}
