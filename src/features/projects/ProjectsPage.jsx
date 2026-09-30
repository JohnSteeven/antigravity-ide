import React from "react";
import { Link } from "react-router";
import {
  FiBookOpen,
  FiTerminal,
  FiSun,
  FiFeather,
  FiSmile,
  FiCpu,
  FiArrowRight,
} from "react-icons/fi";
import DocumentMetadata from "../../components/shared/DocumentMetadata.jsx";
import AboutProjectsSection from "../about/AboutProjectsSection";
import { useCms } from "../../context/CmsContext";
import "./projects.css";

const PLATFORM_SHOWCASE = [
  {
    id: "platform-read",
    title: "Editorial & Stories Reader",
    category: "Reading Engine",
    badge: "Core Platform",
    description:
      "A distraction-free reading environment featuring reader presets, adaptive typography, dark mode, audio narration support, and structured section layouts for essays and technical postmortems.",
    route: "/articles",
    cta: "Read Articles",
    icon: <FiBookOpen className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-coding",
    title: "Interactive Coding Hub",
    category: "Hands-on Practice",
    badge: "Interactive",
    description:
      "Full-featured browser sandbox, Monaco-style editor, live HTML/CSS preview, and client-side Python execution via WebAssembly worker with automated test validation.",
    route: "/coding",
    cta: "Open Coding Hub",
    icon: <FiTerminal className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-learn",
    title: "Learn Curriculum Engine",
    category: "Learning Management",
    badge: "Curriculum",
    description:
      "Server-authoritative course progress, video lessons with resume state, multi-question quizzes, milestone badges, and daily learning streaks.",
    route: "/learn",
    cta: "Explore Courses",
    icon: <FiTerminal className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-life",
    title: "MyJourney Life OS",
    category: "Personal Operating System",
    badge: "Private",
    description:
      "A personal operating system for daily reflections, milestone roadmaps, habit tracking, and emotional balance. Strictly private to the authenticated user.",
    route: "/life",
    cta: "Open Life OS",
    icon: <FiSun className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-creators",
    title: "Creator Studio & Authoring",
    category: "Publishing Suite",
    badge: "Creators",
    description:
      "Dedicated publishing suite enabling educators and essayists to author courses, design lessons, and curate educational materials for community learners.",
    route: "/creators",
    cta: "Creator Directory",
    icon: <FiFeather className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-play",
    title: "Multiplayer Arena & Games",
    category: "Play & Social",
    badge: "Multiplayer",
    description:
      "Real-time WebSocket multiplayer party games (Who Knows Me Better, Life Auction) and solo simulations (Play Life, This or That) designed for memorable connections.",
    route: "/play",
    cta: "Enter Play Hub",
    icon: <FiSmile className="platform-icon" aria-hidden="true" />,
  },
  {
    id: "platform-agent",
    title: "Journey AI Assistant",
    category: "Assistive Intelligence",
    badge: "AI Companion",
    description:
      "An assistive conversational guide for code explanations, summarization, and study assistance. Operating within explicit bounds with zero access to private Life records.",
    route: "/agent",
    cta: "Ask Journey AI",
    icon: <FiCpu className="platform-icon" aria-hidden="true" />,
  },
];

const ProjectsPage = () => {
  const { data } = useCms();
  const portfolioProjects = data?.projects || [];

  return (
    <main className="projects-showcase-page">
      <DocumentMetadata
        content={{
          title: "Projects & Platform Architecture",
          description:
            "Explore the software systems, interactive experiences, and open architecture powering the MyJourney platform.",
        }}
        kind="Projects"
      />

      {/* Hero Header */}
      <section className="projects-hero" aria-labelledby="projects-hero-title">
        <div className="projects-container">
          <span className="projects-kicker">Platform Architecture</span>
          <h1 id="projects-hero-title" className="projects-title">
            Projects & Systems We Build
          </h1>
          <p className="projects-subtitle">
            An overview of the software platforms, interactive multiplayer simulations, and
            editorial products engineered across MyJourney.
          </p>
        </div>
      </section>

      {/* Section 1: Core Platform Systems */}
      <section className="projects-section" aria-labelledby="platforms-heading">
        <div className="projects-container">
          <header className="projects-section-header">
            <span className="projects-section-kicker">Core Systems</span>
            <h2 id="platforms-heading" className="projects-section-title">
              Software Platforms & Engines
            </h2>
            <p className="projects-section-desc">
              The primary architectural modules powering reader experiences, learning, and multiplayer interactions.
            </p>
          </header>

          <div className="platforms-grid">
            {PLATFORM_SHOWCASE.map((item) => (
              <Link
                key={item.id}
                to={item.route}
                className="platform-card"
                aria-label={`${item.title} — ${item.category}`}
              >
                <div className="platform-card-header">
                  <span className="platform-badge">{item.badge}</span>
                  {item.icon}
                </div>
                <h3 className="platform-card-title">{item.title}</h3>
                <p className="platform-card-desc">{item.description}</p>
                <div className="platform-card-footer">
                  <span>{item.cta}</span>
                  <FiArrowRight aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Flagship Interactive Experiences */}
      <AboutProjectsSection />

      {/* Section 3: Curated Works & Initiatives */}
      {Array.isArray(portfolioProjects) && portfolioProjects.length > 0 && (
        <section className="projects-section" aria-labelledby="works-heading">
          <div className="projects-container">
            <header className="projects-section-header">
              <span className="projects-section-kicker">Creative Portfolio</span>
              <h2 id="works-heading" className="projects-section-title">
                Featured Creative Initiatives
              </h2>
              <p className="projects-section-desc">
                Curated portfolio works and digital craftsmanship across web development and design.
              </p>
            </header>

            <div className="portfolio-grid">
              {portfolioProjects.map((p) => (
                <article key={p.id} className="portfolio-card">
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="portfolio-card-img"
                      loading="lazy"
                    />
                  )}
                  <div className="portfolio-card-body">
                    <span className="portfolio-card-cat">{p.category}</span>
                    <h3 className="portfolio-card-title">{p.title}</h3>
                    <p className="portfolio-card-desc">{p.description}</p>
                    {p.status && (
                      <span className="portfolio-card-status">Status: {p.status}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default ProjectsPage;
