import React from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiChevronRight,
  FiExternalLink,
  FiLock,
  FiRefreshCw,
  FiX,
  FiZap,
} from "react-icons/fi";
import AgentComposer from "./AgentComposer";
import { useAgent } from "./AgentContext";
import "./agent.css";

const idOf = (item, index) =>
  item?._id || item?.id || item?.clientRequestId || `agent-message-${index}`;

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
  // Strip raw internal serialization markers if any
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

function EntitlementNotice({ content }) {
  const readable = String(content || "")
    .replace(/life(?:\.|\s+)getToday/gi, "Life and Today activities")
    .replace(/life(?:\.|\s+)getHabits/gi, "Life habits")
    .replace(/life(?:\.|\s+)getGoals/gi, "Life goals")
    .replace(/life(?:\.|\s+)[a-zA-Z0-9_]+/gi, "private Life data");

  return (
    <div className="agent-entitlement-notice">
      <div className="agent-entitlement-notice__header">
        <FiLock aria-hidden="true" /> Premium Entitlement
      </div>
      <div className="agent-entitlement-notice__body">{readable}</div>
      <Link to="/pricing" className="agent-entitlement-notice__action">
        Upgrade to Premium →
      </Link>
    </div>
  );
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
      {successful.slice(0, 4).map((e, idx) => {
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

function Message({ message }) {
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

export default function AgentPanel({
  variant = "page",
  onClose,
  titleId = "agent-panel-title",
}) {
  const {
    messages,
    sending,
    loading,
    error,
    messageCursor,
    loadEarlierMessages,
    sendMessage,
  } = useAgent();

  const handleSuggestionClick = (query) => {
    sendMessage(query, { source: "typed" }).catch(() => {});
  };

  return (
    <section
      className={`agent-panel agent-panel--${variant}`}
      role={variant === "widget" ? "dialog" : "region"}
      aria-modal={variant === "widget" ? "false" : undefined}
      aria-labelledby={titleId}
    >
      <header className="agent-panel__header">
        <div className="agent-panel__identity">
          <div className="agent-panel__identity-icon" aria-hidden="true">
            <FiZap />
          </div>
          <div>
            <h2 id={titleId}>Ask MyJourney</h2>
            <p>Your knowledge and life companion</p>
          </div>
        </div>
        <div className="agent-panel__header-actions">
          {variant === "widget" && (
            <Link
              to="/agent"
              className="agent-panel__header-btn"
              aria-label="Open full MyJourney Agent"
              title="Open full workspace"
            >
              <FiExternalLink aria-hidden="true" />
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              className="agent-panel__header-btn"
              onClick={onClose}
              aria-label="Close Ask MyJourney"
              title="Close"
            >
              <FiX aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div className="agent-panel__messages" role="log" aria-live="polite">
        {messageCursor && (
          <button
            type="button"
            className="agent-panel__earlier"
            onClick={loadEarlierMessages}
            disabled={loading}
          >
            Load earlier messages
          </button>
        )}

        {messages.length === 0 && !loading && (
          <div className="agent-panel__welcome">
            <div className="agent-panel__welcome-icon" aria-hidden="true">
              <FiZap />
            </div>
            <h3>What would make today clearer?</h3>
            <p>
              Ask about MyJourney stories, explore courses, or review your Life
              habits and daily progress.
            </p>
            <div className="agent-panel__chips">
              {[
                "What are today's activities?",
                "Show my goals",
                "Recommend an article",
                "Find courses on React",
              ].map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="agent-panel__chip"
                  onClick={() => handleSuggestionClick(query)}
                  disabled={sending}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={idOf(message, index)} message={message} />
        ))}

        {(sending || loading) && (
          <div className="agent-panel__working" role="status">
            <FiRefreshCw aria-hidden="true" />
            <span>{sending ? "MyJourney is thinking…" : "Loading…"}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="agent-panel__error" role="alert">
          {error}
        </div>
      )}

      <AgentComposer autoFocus={variant === "widget"} />
    </section>
  );
}
