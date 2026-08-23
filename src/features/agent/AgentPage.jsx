import React, { useState } from "react";
import { Link } from "react-router";
import {
  FiArchive,
  FiChevronLeft,
  FiMenu,
  FiMessageSquare,
  FiPlus,
  FiZap,
} from "react-icons/fi";
import AgentPanel from "./AgentPanel";
import { conversationIdOf, useAgent } from "./AgentContext";
import { useAuth } from "../../hooks/useAuth";
import "./agent.css";

const titleOf = (conversation) =>
  conversation.title || conversation.preview || "New conversation";

export default function AgentPage() {
  const {
    conversations,
    activeConversationId,
    conversationCursor,
    loading,
    sending,
    createConversation,
    selectConversation,
    loadConversations,
    archiveConversation,
  } = useAgent();
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSelect = (id) => {
    selectConversation(id);
    setMobileSidebarOpen(false);
  };

  const handleCreate = async () => {
    await createConversation();
    setMobileSidebarOpen(false);
  };

  return (
    <main className="agent-page">
      <header className="agent-page__hero">
        <div className="agent-page__kicker">
          <FiZap aria-hidden="true" />
          <span>MyJourney Intelligence</span>
        </div>
        <h1>A conversation grounded in your journey.</h1>
        <span>
          Voice and typed messages share the same secure conversation. Private
          tools remain governed by server-authoritative authentication,
          ownership, and entitlements.
        </span>
      </header>

      {!isAuthenticated && (
        <div className="agent-page__auth-note" role="status">
          <strong>Note:</strong> Sign in to ask about your private Life activities,
          habits, goals, and learning progress.{" "}
          <Link to="/login">Sign In →</Link>
        </div>
      )}

      {/* Mobile drawer toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="agent-conversations-toggle"
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          aria-expanded={mobileSidebarOpen}
        >
          {mobileSidebarOpen ? <FiChevronLeft /> : <FiMenu />}
          <span>
            {mobileSidebarOpen
              ? "Close Conversations"
              : `Conversations (${conversations.length})`}
          </span>
        </button>
      </div>

      <div className="agent-page__workspace">
        <aside
          className={`agent-conversations ${
            mobileSidebarOpen ? "is-open" : ""
          }`}
          aria-label="Agent conversations"
        >
          <div className="agent-conversations__heading">
            <h2>Conversations</h2>
            <button
              type="button"
              className="agent-conversations__new-btn"
              onClick={handleCreate}
              disabled={loading || sending || !isAuthenticated}
              title="Start a new conversation"
            >
              <FiPlus aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          <div className="agent-conversations__list-wrap">
            {conversations.length === 0 ? (
              <div className="agent-conversations__empty">
                <FiMessageSquare
                  size={24}
                  aria-hidden="true"
                  style={{ opacity: 0.5 }}
                />
                <p>
                  {isAuthenticated
                    ? "Start a conversation when you're ready."
                    : "Sign in to view your conversation history."}
                </p>
              </div>
            ) : (
              <ul>
                {conversations.map((conversation) => {
                  const id = conversationIdOf(conversation);
                  const active = id === activeConversationId;
                  return (
                    <li key={id} className={active ? "is-active" : ""}>
                      <button
                        type="button"
                        className="agent-conversations__select"
                        onClick={() => handleSelect(id)}
                        disabled={sending}
                        aria-current={active ? "true" : undefined}
                      >
                        <strong>{titleOf(conversation)}</strong>
                        <span>
                          {conversation.messageCount || 0} message
                          {conversation.messageCount === 1 ? "" : "s"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="agent-conversations__archive"
                        onClick={() => archiveConversation(id)}
                        disabled={sending}
                        aria-label={`Archive ${titleOf(conversation)}`}
                        title="Archive conversation"
                      >
                        <FiArchive aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {conversationCursor && (
              <button
                type="button"
                className="agent-conversations__more"
                onClick={() => loadConversations({ append: true })}
                disabled={loading}
              >
                Load more conversations
              </button>
            )}
          </div>
        </aside>

        <AgentPanel variant="page" titleId="agent-page-panel-title" />
      </div>
    </main>
  );
}
