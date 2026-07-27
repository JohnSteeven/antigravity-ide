import React from "react";
import { FiHeart, FiBookmark, FiBookOpen, FiEye, FiLink } from "react-icons/fi";

const EngagementBar = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  return (
    <div className="premium-stats-bar">
      <button
        className={`stat-btn ${isLiked ? "active like-btn" : ""}`}
        type="button"
        onClick={handleLikeToggle}
      >
        <FiHeart style={isLiked ? { fill: "#ff4d4f", stroke: "#ff4d4f" } : undefined} /> {article.likes}
      </button>
      <button
        className={`stat-btn ${isBookmarked ? "active bookmark-btn" : ""}`}
        type="button"
        onClick={handleBookmarkToggle}
      >
        <FiBookmark style={isBookmarked ? { fill: "currentColor" } : undefined} /> {article.bookmarks}
      </button>
      <button
        className={`stat-btn ${isSaved ? "active save-btn" : ""}`}
        type="button"
        onClick={handleSaveToggle}
      >
        <FiBookOpen /> {isSaved ? "Saved ✓" : "Save"}
      </button>
      <span className="stat-span">
        <FiEye /> {article.views} Views
      </span>
      <button className="stat-btn" type="button" onClick={handleCopyLink}>
        <FiLink /> Share
      </button>
    </div>
  );
};

export default EngagementBar;
