import React, { useRef, useState, useEffect } from "react";
import { FiSend, FiXCircle } from "react-icons/fi";
import { useAgent } from "./AgentContext";
import VoiceControls from "./voice/VoiceControls";
import { useAuth } from "../../hooks/useAuth";

export default function AgentComposer({ autoFocus = false }) {
  const { sendMessage, sending, cancelMessage, capabilities } = useAgent();
  const { isAuthenticated } = useAuth();
  const unavailable = capabilities?.provider?.ready === false || capabilities?.agentEnabled === false;
  const disabled = sending || !isAuthenticated || unavailable;
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea to fit content sensibly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(42, nextHeight)}px`;
  }, [draft]);

  const submit = async (event) => {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || disabled) return;
    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
    }
    try {
      await sendMessage(message, { source: "typed" });
    } catch (_error) {
      setDraft(message);
    }
  };

  return (
    <div className="agent-composer">
      <VoiceControls sendMessage={sendMessage} disabled={disabled} />
      <form onSubmit={submit} className="agent-composer__form">
        <label className="agent-sr-only" htmlFor="agent-message-input">
          Message MyJourney
        </label>
        <textarea
          id="agent-message-input"
          ref={textareaRef}
          className="agent-composer__textarea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={!isAuthenticated ? "Sign in to ask MyJourney" : unavailable ? "Journey AI is unavailable right now" : "Ask MyJourney anything…"}
          rows="1"
          maxLength="4000"
          autoFocus={autoFocus}
          disabled={disabled}
        />
        {sending ? (
          <button
            type="button"
            className="agent-composer__cancel"
            onClick={cancelMessage}
            title="Stop generating"
          >
            <FiXCircle aria-hidden="true" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            className="agent-composer__send"
            disabled={!draft.trim() || disabled}
            aria-label="Send message"
            title="Send"
          >
            <FiSend aria-hidden="true" />
          </button>
        )}
      </form>
    </div>
  );
}
