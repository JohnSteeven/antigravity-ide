import React, { useState, useEffect } from "react";
import {
  FiBookOpen,
  FiClock,
  FiBookmark,
  FiZap,
  FiEdit2,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const LifeLeftSidebar = ({
  article = {},
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const favoriteQuote = article.favoriteQuote || "In the middle of difficulty lies opportunity.";
  const readingTimeNum = parseInt(article.readingTime || "5", 10) || 5;
  const timeRemaining = Math.max(1, Math.ceil(readingTimeNum * (1 - scrollProgress / 100)));

  const articleKey = `myjourney_notes_${article.slug || article._id || "general"}`;

  // Interactive Personal Notes State
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Load saved notes from LocalStorage on mount/article change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(articleKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedNotes(Array.isArray(parsed) ? parsed : []);
      } else {
        setSavedNotes([]);
      }
    } catch (e) {
      console.error("Failed to load notes from localStorage:", e);
    }
  }, [articleKey]);

  // Save note handler
  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      id: Date.now(),
      text: noteText.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    setNoteText("");
    try {
      localStorage.setItem(articleKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save note:", e);
    }
    setStatusMessage("Note saved!");
    setTimeout(() => setStatusMessage(""), 2500);
  };

  // Delete note handler
  const handleDeleteNote = (id) => {
    const updated = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(updated);
    try {
      localStorage.setItem(articleKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update notes:", e);
    }
    setStatusMessage("Note removed");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  return (
    <aside className="life-left-sidebar">
      <div className="life-sticky-box">
        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="life-toc-panel">
            <h3><FiBookOpen /> Article Chapters</h3>
            <nav className="life-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`life-toc-link ${activeHeading === h.id ? "active" : ""}`}
                  style={h.level === 3 ? { paddingLeft: "20px", fontSize: "0.85rem", opacity: 0.8 } : undefined}
                >
                  <span className="bullet">✦</span> {h.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Reading Progress */}
        <div className="life-progress-panel">
          <div className="life-progress-header">
            <span>Reading Progress</span>
            <span className="progress-pct">{Math.round(scrollProgress)}%</span>
          </div>
          <ReadingProgress scrollProgress={scrollProgress} article={article} />
          <div className="life-eta-indicator">
            <FiClock /> {timeRemaining} min remaining
          </div>
        </div>

        {/* Highlight Quote */}
        {favoriteQuote && (
          <div className="life-sidebar-quote-panel">
            <h4><FiBookmark /> Reflection Note</h4>
            <p>"{favoriteQuote}"</p>
          </div>
        )}

        {/* Reading Streak */}
        <div className="life-streak-panel">
          <div className="streak-icon"><FiZap /></div>
          <div>
            <h5>Reading Streak</h5>
            <p>3 Days Active • Daily Mindful Reader</p>
          </div>
        </div>

        {/* Interactive Functional Personal Notes & Highlights */}
        <div className={`life-notes-panel ${isNotesExpanded ? "expanded" : "collapsed"}`}>
          {!isNotesExpanded ? (
            <div
              className="notes-trigger-bar"
              onClick={() => setIsNotesExpanded(true)}
              role="button"
              tabIndex={0}
            >
              <div className="notes-trigger-left">
                <FiEdit2 className="notes-icon" />
                <span>Personal Notes & Highlights</span>
              </div>
              {savedNotes.length > 0 && (
                <span className="notes-count-badge">{savedNotes.length}</span>
              )}
            </div>
          ) : (
            <div className="notes-editor-box">
              <div className="notes-header">
                <div className="notes-title">
                  <FiEdit2 />
                  <h4>My Notes</h4>
                </div>
                <button
                  type="button"
                  className="notes-close-btn"
                  onClick={() => setIsNotesExpanded(false)}
                  title="Collapse Notes"
                >
                  <FiX />
                </button>
              </div>

              <div className="notes-input-wrapper">
                <textarea
                  className="notes-textarea"
                  placeholder="Type a key takeaway, reflection, or note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <div className="notes-action-row">
                  {statusMessage && <span className="notes-status-msg">{statusMessage}</span>}
                  <button
                    type="button"
                    className="notes-save-btn"
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                  >
                    <FiSave /> Save Note
                  </button>
                </div>
              </div>

              {savedNotes.length > 0 && (
                <div className="saved-notes-list">
                  <h5>Saved Notes ({savedNotes.length})</h5>
                  {savedNotes.map((item) => (
                    <div key={item.id} className="saved-note-item">
                      <div className="note-item-header">
                        <span className="note-date">{item.date}</span>
                        <button
                          type="button"
                          className="note-delete-btn"
                          onClick={() => handleDeleteNote(item.id)}
                          title="Delete Note"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                      <p className="note-item-text">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LifeLeftSidebar;
