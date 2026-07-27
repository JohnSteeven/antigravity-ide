import React from "react";
import { FiCode, FiGithub, FiCheckCircle, FiCpu, FiExternalLink, FiBookmark, FiBox } from "react-icons/fi";
import AuthorCard from "../shared/widgets/AuthorCard";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const CodingRightSidebar = ({
  article,
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  const techStack = article.techStack || ["React", "Node.js", "Express", "MongoDB", "CSS Grid"];
  const githubUrl = article.githubUrl || "https://github.com";

  return (
    <aside className="coding-right-sidebar">
      <div className="coding-sticky-box">
        {/* Developer Profile Card */}
        <AuthorCard article={article} />

        {/* Environment & Tech Stack */}
        <div className="coding-sidebar-panel">
          <h3>
            <FiCpu className="icon" /> Tech Stack & Specs
          </h3>
          <div className="stack-pills">
            {techStack.map((tech, idx) => (
              <span key={idx} className="stack-pill">
                {tech}
              </span>
            ))}
          </div>

          <div className="env-compat-box">
            <div className="compat-item">
              <span className="label">Runtime:</span>
              <span className="val">Node.js &gt;= 18.0</span>
            </div>
            <div className="compat-item">
              <span className="label">Framework:</span>
              <span className="val">React 18.2</span>
            </div>
            <div className="compat-item">
              <span className="label">Bundler:</span>
              <span className="val">Parcel 2.9</span>
            </div>
          </div>
        </div>

        {/* Quick Links & Sandbox */}
        <div className="coding-sidebar-panel sandbox-panel">
          <h3>
            <FiBox className="icon" /> Repository & Sandbox
          </h3>
          <p>Explore source code and run interactive demos:</p>
          <div className="sandbox-actions">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="coding-action-btn primary"
            >
              <FiGithub /> GitHub Repository <FiExternalLink />
            </a>
            <a
              href="https://stackblitz.com"
              target="_blank"
              rel="noreferrer"
              className="coding-action-btn secondary"
            >
              <FiCode /> Open StackBlitz <FiExternalLink />
            </a>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <NewsletterPanel
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          handleNewsletterSubmit={handleNewsletterSubmit}
          newsletterMsg={newsletterMsg}
        />
      </div>
    </aside>
  );
};

export default CodingRightSidebar;
