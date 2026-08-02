import React, { useState } from "react";
import { FiFolder, FiFileText, FiTerminal, FiCode, FiChevronRight, FiChevronDown, FiCopy, FiCheck, FiLayers } from "react-icons/fi";
import ReadingProgress from "../shared/widgets/ReadingProgress";

const CodingLeftSidebar = ({
  article,
  headings = [],
  activeHeading = "",
  scrollProgress = 0,
}) => {
  const [copiedCmd, setCopiedCmd] = useState("");
  const [openFolders, setOpenFolders] = useState({ src: true, components: true, server: true });

  const toggleFolder = (folder) => {
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const fileTree = article.fileTree || [
    "src/components/ArticleDetail.js",
    "src/experiences/ExperienceResolver.js",
    "server/models/Article.js",
    "package.json",
  ];

  const cliCommands = article.cliCommands || [
    "npm install",
    "npm run dev",
    "docker-compose up -d",
  ];

  const apiNav = article.apiNavigation || [
    "ExperienceResolver()",
    "getExperienceConfig()",
    "useArticleQuery()",
  ];

  const handleCopyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(""), 2000);
  };

  return (
    <aside className="coding-left-sidebar">
      <div className="coding-sticky-box">
        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="coding-toc-panel">
            <h3>
              <FiLayers className="icon" /> Sections & Headers
            </h3>
            <nav className="coding-toc-nav">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`coding-toc-link ${activeHeading === h.id ? "active" : ""}`}
                >
                  <span className="prompt-dot">&gt;</span>
                  <span className="toc-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Project File Tree Widget */}
        <div className="coding-file-tree-panel">
          <h3>
            <FiFolder className="icon" /> File Explorer
          </h3>
          <div className="tree-container">
            <div className="tree-item folder" onClick={() => toggleFolder("src")}>
              {openFolders.src ? <FiChevronDown /> : <FiChevronRight />}
              <FiFolder className="folder-icon" />
              <span>src/</span>
            </div>
            {openFolders.src && (
              <div className="tree-sub">
                <div className="tree-item folder" onClick={() => toggleFolder("components")}>
                  {openFolders.components ? <FiChevronDown /> : <FiChevronRight />}
                  <FiFolder className="folder-icon" />
                  <span>experiences/</span>
                </div>
                {openFolders.components && (
                  <div className="tree-sub">
                    {fileTree.map((filePath, idx) => (
                      <div key={idx} className="tree-item file">
                        <FiFileText className="file-icon" />
                        <span>{filePath.split("/").pop()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* API Navigator */}
        {apiNav.length > 0 && (
          <div className="coding-api-panel">
            <h3>
              <FiCode className="icon" /> API & Functions
            </h3>
            <div className="api-list">
              {apiNav.map((fn, idx) => (
                <div key={idx} className="api-item">
                  <span className="fn-keyword">fn</span>
                  <span className="fn-name">{fn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLI Quick Reference */}
        {cliCommands.length > 0 && (
          <div className="coding-cli-panel">
            <h3>
              <FiTerminal className="icon" /> Terminal Commands
            </h3>
            <div className="cli-list">
              {cliCommands.map((cmd, idx) => (
                <div key={idx} className="cli-item" onClick={() => handleCopyCmd(cmd)}>
                  <code>$ {cmd}</code>
                  <button className="copy-icon-btn">
                    {copiedCmd === cmd ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reading Progress */}
        <ReadingProgress scrollProgress={scrollProgress} article={article} category="coding" />
      </div>
    </aside>
  );
};

export default CodingLeftSidebar;
