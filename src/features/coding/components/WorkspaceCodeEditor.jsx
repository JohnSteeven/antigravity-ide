// WorkspaceCodeEditor
import React, { useMemo, useRef, useState } from "react";
import { FiCode } from "react-icons/fi";
import "../editor.css";

const LANGUAGE_FILES = {
  html: "index.html",
  css: "style.css",
  javascript: "script.js",
  python: "main.py",
};

const LANGUAGE_LABELS = {
  html: "HTML",
  css: "CSS",
  javascript: "JS",
  python: "PY",
};

export default function WorkspaceCodeEditor({
  value = "",
  onChange,
  language = "html",
  onRun,
  disabled = false,
  isSaving = false,
  isDirty = false,
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const [wordWrap, setWordWrap] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const langKey = (language || "html").toLowerCase();
  const filename = LANGUAGE_FILES[langKey] || "code.txt";
  const langLabel = LANGUAGE_LABELS[langKey] || langKey.toUpperCase();
  const indentSpaces = langKey === "python" ? "    " : "  ";

  // Calculate lines for line-number gutter
  const lines = useMemo(() => {
    const split = (value || "").split("\n");
    return split.length > 0 ? split : [""];
  }, [value]);

  // Synchronize scroll between textarea and line gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Update cursor line & col
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const { selectionStart } = textareaRef.current;
    const textBefore = (value || "").slice(0, selectionStart);
    const lineArr = textBefore.split("\n");
    const currentLine = lineArr.length;
    const currentCol = lineArr[lineArr.length - 1].length + 1;
    setCursorPos({ line: currentLine, col: currentCol });
  };

  // Handle Tab and Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (disabled) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertText = indentSpaces;

      const updated = value.substring(0, start) + insertText + value.substring(end);
      if (onChange) onChange(updated);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + insertText.length;
          textareaRef.current.selectionEnd = start + insertText.length;
          updateCursorPosition();
        }
      });
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (onRun) {
        onRun();
      }
    }
  };

  return (
    <div className="cd-workspace-editor" role="region" aria-label="Code Editor">
      {/* Tab bar header */}
      <div className="cd-workspace-editor__header">
        <div className="cd-workspace-editor__tabs">
          <div className="cd-workspace-editor__tab">
            <span className="cd-workspace-editor__file-icon" aria-hidden="true">
              <FiCode />
            </span>
            <span>{filename}</span>
            {isDirty && <span className="cd-workspace-editor__dirty-dot" title="Unsaved edits" />}
          </div>
          <div
            className={`cd-workspace-editor__save-status ${
              isSaving ? "is-saving" : "is-saved"
            }`}
          >
            {isSaving ? "Saving…" : "Saved"}
          </div>
        </div>

        <div className="cd-workspace-editor__header-controls">
          <button
            type="button"
            className={`cd-workspace-editor__tool-btn ${wordWrap ? "active" : ""}`}
            onClick={() => setWordWrap((prev) => !prev)}
            title="Toggle word wrap"
            aria-pressed={wordWrap}
          >
            Wrap: {wordWrap ? "On" : "Off"}
          </button>
          <span className="cd-workspace-editor__pill">{langLabel}</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="cd-workspace-editor__body">
        <div
          ref={gutterRef}
          className="cd-workspace-editor__gutter"
          aria-hidden="true"
        >
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={`cd-workspace-editor__line-num ${
                idx + 1 === cursorPos.line ? "active" : ""
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="cd-workspace-editor__textarea-container">
          <textarea
            ref={textareaRef}
            className={`cd-workspace-editor__textarea ${wordWrap ? "is-wrap" : ""}`}
            value={value}
            onChange={(e) => {
              if (onChange) onChange(e.target.value);
              updateCursorPosition();
            }}
            onScroll={handleScroll}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label={`Code editor for ${filename}`}
          />
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="cd-workspace-editor__statusbar">
        <div className="cd-workspace-editor__statusbar-left">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{lines.length} lines</span>
          <span>Spaces: {langKey === "python" ? 4 : 2}</span>
        </div>
        <div className="cd-workspace-editor__statusbar-right">
          <span className="cd-workspace-editor__kbd-hint">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to Run
          </span>
        </div>
      </div>
    </div>
  );
}
