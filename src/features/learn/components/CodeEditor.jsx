import React, { useRef, useEffect, useState } from "react";

const MAX_CODE_CHARS = 65536; // 64 KB

export default function CodeEditor({
  value,
  onChange,
  onRun,
  onReset,
  onCheck,
  onViewSolution,
  language = "javascript",
  disabled = false,
  isExecuting = false,
  isValidating = false,
  hasSolution = false,
  solutionViewed = false,
}) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [lineCount, setLineCount] = useState(1);
  const [sizeWarning, setSizeWarning] = useState("");

  // Update line numbers count
  useEffect(() => {
    const lines = (value || "").split("\n").length;
    setLineCount(Math.max(1, lines));

    if ((value || "").length > MAX_CODE_CHARS) {
      setSizeWarning(`Code length (${value.length} chars) exceeds the 64 KB limit.`);
    } else {
      setSizeWarning("");
    }
  }, [value]);

  // Synchronize line numbers scroll with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut handlers
  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (onRun && !isExecuting && !disabled) {
        onRun();
      }
      return;
    }

    // Tab key inserts 2 spaces (or 4 for python)
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const indent = language === "python" ? "    " : "  ";
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = value || "";

      const newValue = currentValue.substring(0, start) + indent + currentValue.substring(end);
      if (newValue.length > MAX_CODE_CHARS) return;

      onChange(newValue);

      // Restore cursor position after inserted spaces
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      });
    }
  };

  return (
    <div className="learn-code-editor" role="region" aria-label="Interactive code editor">
      <header className="learn-code-editor__header">
        <div className="learn-code-editor__meta">
          <span className="learn-code-editor__lang">{language.toUpperCase()}</span>
          <span className="learn-code-editor__hint" aria-hidden="true">
            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run
          </span>
        </div>
        <div className="learn-code-editor__actions">
          {onReset && (
            <button
              type="button"
              className="learn-btn learn-btn--ghost"
              onClick={onReset}
              disabled={disabled || isExecuting}
              title="Reset to starter code"
              aria-label="Reset to starter code"
            >
              Reset
            </button>
          )}
          {hasSolution && onViewSolution && (
            <button
              type="button"
              className={`learn-btn ${solutionViewed ? "learn-btn--solution-viewed" : "learn-btn--ghost"}`}
              onClick={onViewSolution}
              disabled={disabled}
              title="View lesson solution"
            >
              {solutionViewed ? "Solution Revealed" : "View Solution"}
            </button>
          )}
          {onRun && (
            <button
              type="button"
              className="learn-btn learn-btn--primary"
              onClick={onRun}
              disabled={disabled || isExecuting}
              aria-label="Run code"
            >
              {isExecuting ? "Running…" : "▶ Run Code"}
            </button>
          )}
          {onCheck && (
            <button
              type="button"
              className="learn-btn learn-btn--accent"
              onClick={onCheck}
              disabled={disabled || isValidating || isExecuting}
              aria-label="Check solution"
            >
              {isValidating ? "Checking…" : "✓ Check"}
            </button>
          )}
        </div>
      </header>

      {sizeWarning && (
        <div className="learn-code-editor__warning" role="alert">
          {sizeWarning}
        </div>
      )}

      <div className="learn-code-editor__body">
        <div
          className="learn-code-editor__gutter"
          ref={lineNumbersRef}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="learn-code-editor__line-num">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="learn-code-editor__textarea"
          value={value || ""}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CODE_CHARS) {
              onChange(e.target.value);
            }
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={`Write your ${language} code here...`}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={`${language} code editor. Press Tab to indent, Escape to exit tab capture.`}
        />
      </div>
    </div>
  );
}

