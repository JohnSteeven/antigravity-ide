import React, { useState } from "react";
import { FiCode, FiTerminal, FiGithub, FiCopy, FiCheck, FiCpu, FiExternalLink } from "react-icons/fi";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EngagementBar from "../shared/widgets/EngagementBar";

const CodingHero = ({
  article,
  isLiked,
  handleLikeToggle,
  isBookmarked,
  handleBookmarkToggle,
  isSaved,
  handleSaveToggle,
  handleCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  const lang = article.programmingLanguage || article.subcategory || "JavaScript";
  const framework = article.framework || "React";
  const version = article.version || "v18.2";
  const githubUrl = article.githubUrl || "https://github.com";

  const handleCopyCodePrompt = () => {
    navigator.clipboard.writeText(`git clone ${githubUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="coding-hero">
      <div className="coding-hero-container">
        {/* Terminal Header Bar */}
        <div className="coding-terminal-bar">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="terminal-title">
            <FiTerminal className="terminal-icon" />
            <span>myjourney@dev:~/articles/{article.slug || "code"}.md</span>
          </div>
          <div className="terminal-badge">{lang}</div>
        </div>

        {/* Hero Content */}
        <div className="coding-hero-body">
          <Breadcrumbs
            items={[
              { label: article.category || "Coding", to: "/category/coding" },
              { label: article.title },
            ]}
          />

          {/* Tech Stack Badges */}
          <div className="coding-badge-row">
            <span className="tech-badge lang">{lang}</span>
            <span className="tech-badge framework">{framework} {version}</span>
            {article.difficulty && (
              <span className={`tech-badge difficulty ${article.difficulty}`}>
                <FiCpu /> {article.difficulty}
              </span>
            )}
          </div>

          <h1 className="coding-title">{article.title}</h1>

          {article.subtitle && (
            <p className="coding-subtitle">{article.subtitle}</p>
          )}

          {/* Terminal Command Box */}
          <div className="coding-cli-prompt">
            <span className="prompt-prefix">$</span>
            <span className="prompt-cmd">git clone {githubUrl}</span>
            <button className="copy-cmd-btn" onClick={handleCopyCodePrompt}>
              {copied ? <FiCheck /> : <FiCopy />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          {/* Author Meta */}
          <div className="coding-author-row">
            <div className="coding-avatar">
              <FiCode />
            </div>
            <div className="coding-author-meta">
              <span className="coding-author-name">
                {article.author?.name || "Noble John Steeven"}
              </span>
              <span className="coding-dates">
                Published {article.publishedAt || "Recently"} • {article.readingTime || 5} min read
              </span>
            </div>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="coding-repo-btn"
              >
                <FiGithub /> Repo <FiExternalLink />
              </a>
            )}
          </div>

          {/* Engagement Bar */}
          <EngagementBar
            article={article}
            isLiked={isLiked}
            handleLikeToggle={handleLikeToggle}
            isBookmarked={isBookmarked}
            handleBookmarkToggle={handleBookmarkToggle}
            isSaved={isSaved}
            handleSaveToggle={handleSaveToggle}
            handleCopyLink={handleCopyLink}
          />
        </div>
      </div>
    </header>
  );
};

export default CodingHero;
