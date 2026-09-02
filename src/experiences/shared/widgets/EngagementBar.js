import React, { useState } from "react";
import { FiHeart, FiBookmark, FiBookOpen, FiEye, FiShare2 } from "react-icons/fi";

const EngagementBar = ({
  article = {},
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
  showViews = false,
}) => {
  const views = Number(article.views || 0).toLocaleString();
  const [pendingAction, setPendingAction] = useState("");
  const runAction = (action, handler) => async () => {
    if (pendingAction || typeof handler !== "function") return;
    setPendingAction(action);
    try {
      await handler();
    } finally {
      setPendingAction("");
    }
  };
  const actionsPending = Boolean(pendingAction);

  return (
    <div className="premium-stats-bar" aria-busy={actionsPending}>
      <button
        className={`stat-btn ${isLiked ? "active like-btn" : ""}`}
        type="button"
        onClick={runAction("like", handleLikeToggle)}
        disabled={actionsPending}
        aria-pressed={Boolean(isLiked)}
        aria-label={isLiked ? "Unlike article" : "Like article"}
        title={isLiked ? "Unlike article" : "Like article"}
      >
        <FiHeart />
        <span>{pendingAction === "like" ? "Updating…" : Number(article.likes || 0).toLocaleString()}</span>
      </button>

      <button
        className={`stat-btn ${isBookmarked ? "active bookmark-btn" : ""}`}
        type="button"
        onClick={runAction("bookmark", handleBookmarkToggle)}
        disabled={actionsPending}
        aria-pressed={Boolean(isBookmarked)}
        aria-label={isBookmarked ? "Remove article bookmark" : "Bookmark article"}
        title={isBookmarked ? "Remove article bookmark" : "Bookmark article"}
      >
        <FiBookmark />
        <span>{pendingAction === "bookmark" ? "Updating…" : Number(article.bookmarks || 0).toLocaleString()}</span>
      </button>

      <button
        className={`stat-btn ${isSaved ? "active save-btn" : ""}`}
        type="button"
        onClick={runAction("save", handleSaveToggle)}
        disabled={actionsPending}
        aria-pressed={Boolean(isSaved)}
        aria-label={isSaved ? "Remove article from saved articles" : "Save article"}
        title={isSaved ? "Remove from saved articles" : "Save article"}
      >
        <FiBookOpen />
        <span>{pendingAction === "save" ? "Updating…" : isSaved ? "Saved ✓" : "Save"}</span>
      </button>

      <button
        className="stat-btn share-btn"
        type="button"
        onClick={runAction("share", handleCopyLink)}
        disabled={actionsPending}
        aria-label="Share article"
        title="Share article"
      >
        <FiShare2 />
        <span>{pendingAction === "share" ? "Sharing…" : "Share"}</span>
      </button>

      {showViews && article.views > 0 && (
        <span className="stat-span views-span">
          <FiEye /> {views} Views
        </span>
      )}
    </div>
  );
};

export default EngagementBar;
