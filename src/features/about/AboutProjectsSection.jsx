import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCompass, FiUsers } from "react-icons/fi";
import { motion, useReducedMotion } from "framer-motion";
import { aboutProjectsData } from "./aboutProjectsData";
import "./about-projects.css";

const AboutProjectsSection = () => {
  const reducedMotion = useReducedMotion();

  // Filter and sort enabled projects from structured data
  const activeProjects = aboutProjectsData
    .filter((project) => project.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section
      className="about-projects-section"
      id="projects"
      aria-label="Projects & Experiences"
    >
      <div className="about-projects-container">
        {/* Section Header */}
        <div className="about-projects-header">
          <span className="about-projects-kicker">THINGS I'M BUILDING</span>
          <h2 className="about-projects-title">Projects & Experiences</h2>
        </div>

        {/* Feature Projects Grid */}
        <div className="about-projects-grid">
          {activeProjects.map((project, idx) => {
            const isLife = project.themeKey === "play-life";

            return (
              <motion.article
                key={project.id}
                className={`about-project-card theme-${project.themeKey}`}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.45,
                  delay: reducedMotion ? 0 : idx * 0.08,
                }}
              >
                <Link
                  to={project.route}
                  className="about-project-card-link"
                  aria-label={`${project.title} - ${project.subtitle}`}
                >
                  {/* Visual Artwork Container */}
                  <div className="about-project-art-wrapper" aria-hidden="true">
                    {/* Background Layer with image fallback */}
                    <div
                      className="about-project-art-bg"
                      style={
                        project.bgImage
                          ? { backgroundImage: `url("${project.bgImage}")` }
                          : undefined
                      }
                    />
                    <div className="about-project-art-overlay" />

                    {/* Distinct Visual Motifs */}
                    {isLife ? (
                      <div className="art-motif motif-life">
                        <svg
                          className="life-horizon-svg"
                          viewBox="0 0 400 160"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M-20 145 C 100 120, 240 75, 420 40"
                            stroke="rgba(251, 191, 36, 0.4)"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                          />
                          <path
                            d="M-20 155 C 120 130, 260 85, 420 50"
                            stroke="rgba(245, 158, 11, 0.7)"
                            strokeWidth="2.5"
                          />
                        </svg>
                        <div className="life-glow-orb" />
                        <span className="life-node node-1" />
                        <span className="life-node node-2" />
                      </div>
                    ) : (
                      <div className="art-motif motif-friends">
                        <svg
                          className="friends-connection-svg"
                          viewBox="0 0 400 160"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <circle
                            cx="110"
                            cy="75"
                            r="36"
                            stroke="rgba(244, 63, 94, 0.35)"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="290"
                            cy="75"
                            r="46"
                            stroke="rgba(251, 113, 133, 0.3)"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="110"
                            y1="75"
                            x2="290"
                            y2="75"
                            stroke="rgba(244, 63, 94, 0.5)"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                          />
                        </svg>
                        <div className="friends-glow-orb" />
                        <span className="friends-node node-a" />
                        <span className="friends-node node-b" />
                      </div>
                    )}

                    {/* Subtle Badge */}
                    {project.badgeText && (
                      <div className="about-project-badge">
                        {isLife ? (
                          <FiCompass className="badge-icon" />
                        ) : (
                          <FiUsers className="badge-icon" />
                        )}
                        <span>{project.badgeText}</span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="about-project-body">
                    <h3 className="about-project-headline">{project.title}</h3>
                    <p className="about-project-primary-line">
                      {project.subtitle}
                    </p>
                    <p className="about-project-desc">{project.description}</p>

                    <div className="about-project-cta">
                      <span>{project.ctaLabel}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutProjectsSection;
