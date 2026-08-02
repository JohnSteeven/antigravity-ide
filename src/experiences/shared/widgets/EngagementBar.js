import React from "react";
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

  return (
    <div className="premium-stats-bar">
      <button
        className={`stat-btn ${isLiked ? "active like-btn" : ""}`}
        type="button"
        onClick={handleLikeToggle}
        title="Like story"
      >
        <FiHeart style={isLiked ? { fill: "#ef4444", stroke: "#ef4444" } : undefined} />
        <span>{Number(article.likes || 0).toLocaleString()}</span>
      </button>

      <button
        className={`stat-btn ${isBookmarked ? "active bookmark-btn" : ""}`}
        type="button"
        onClick={handleBookmarkToggle}
        title="Bookmark story"
      >
        <FiBookmark style={isBookmarked ? { fill: "#f59e0b", stroke: "#f59e0b" } : undefined} />
        <span>{Number(article.bookmarks || 0).toLocaleString()}</span>
      </button>

      <button
        className={`stat-btn ${isSaved ? "active save-btn" : ""}`}
        type="button"
        onClick={handleSaveToggle}
        title="Save for offline reading"
      >
        <FiBookOpen />
        <span>{isSaved ? "Saved ✓" : "Save"}</span>
      </button>

      <button className="stat-btn share-btn" type="button" onClick={handleCopyLink} title="Share story link">
        <FiShare2 />
        <span>Share</span>
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
