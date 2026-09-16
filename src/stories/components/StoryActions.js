import React from "react";
import { FiBookmark, FiShare2 } from "react-icons/fi";

export default function StoryActions({ saved, copied, saving, saveDisabled, feedback, onSave, onShare, rail = false }) {
  return (
    <div>
      <div className={rail ? "story-reader__rail-actions" : "story-reader__actions"} aria-label="Story actions">
        <button type="button" onClick={onSave} aria-pressed={saved} disabled={saveDisabled} aria-busy={saving || undefined}>
          <FiBookmark aria-hidden="true" />{saving ? "Saving…" : saved ? "Saved to reading list" : "Save story"}
        </button>
        <button type="button" onClick={onShare}><FiShare2 aria-hidden="true" />{copied ? "Link copied" : "Share story"}</button>
      </div>
      {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
    </div>
  );
}
