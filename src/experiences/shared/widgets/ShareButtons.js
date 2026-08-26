import React from "react";
import { FiTwitter, FiLinkedin, FiFacebook, FiLink } from "react-icons/fi";

const ShareButtons = ({ article, handleCopyLink }) => {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="right-sidebar-panel detail-card detail-card--dark share-story-panel">
      <h3>Share this Story</h3>
      <div className="share-buttons-grid">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title || "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-grid-btn twitter"
        >
          <FiTwitter /> Twitter
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-grid-btn linkedin"
        >
          <FiLinkedin /> LinkedIn
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-grid-btn facebook"
        >
          <FiFacebook /> Facebook
        </a>
        <button type="button" onClick={handleCopyLink} className="share-grid-btn copylink">
          <FiLink /> Copy Link
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;
