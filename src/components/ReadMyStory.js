import React from "react";
import { Link } from "react-router";
import {
  FiAward,
  FiBriefcase,
  FiCompass,
  FiStar,
  FiArrowDown,
  FiArrowRight,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import AboutProjectsSection from "../features/about/AboutProjectsSection";
import "../styles/pages/about.css";

const ReadMyStory = () => {
  const { data } = useCms();
  const { story, timeline, projects, skills, stats } = data;

  const heroImage =
    story?.hero?.image?.trim() ||
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80";

  return (
    <main className="about-page">
      {/* ── Full-Bleed Background Hero Section ── */}
      <section
        className="about-hero"
        style={{ backgroundImage: `url("${heroImage}")` }}
        aria-label="About Hero"
      >
        <div className="about-hero-overlay" />
        <div className="about-hero-container">
          <div className="about-hero-copy">
            <span className="about-hero-kicker">READ MY STORY</span>
            <h1 className="about-hero-title">
              {story?.hero?.title || "Read My Story"}
            </h1>
            <p className="about-hero-description">
              {story?.hero?.description ||
                "Every experience, every lesson, and every moment has shaped who I am today. This is my journey."}
            </p>
            <a href="#journey" className="about-hero-cta">
              <span>Explore My Journey</span>
              <FiArrowDown />
            </a>
          </div>
        </div>
      </section>

      {/* ── Journey & Intro Grid ── */}
      <section className="about-intro-section" id="journey" aria-label="Journey Introduction">
        <div className="about-container">
          <div className="about-intro-grid">
            {story?.about?.image?.trim() && (
              <div className="about-image-card">
                <img
                  src={story.about.image.trim()}
                  alt={story?.about?.title || "About portrait"}
                  loading="lazy"
                />
              </div>
            )}

            <div className="about-copy-card">
              <span className="about-section-kicker">
                {story?.about?.eyebrow || "About my journey"}
              </span>
              <h2>{story?.about?.title || "It All Started With A Dream"}</h2>
              <p>
                {story?.about?.text ||
                  "I have always been curious, passionate, and driven to learn new things. My journey has not been a straight path. It has been full of lessons, failures, growth, and unforgettable moments that shaped my purpose."}
              </p>
              <Link to="/articles" className="about-outline-btn">
                <span>More About Me</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="about-timeline-card">
              <span className="about-section-kicker">My journey so far</span>
              {Array.isArray(timeline) &&
                timeline.map((item) => (
                  <div className="about-timeline-item" key={item.id}>
                    <div className="about-timeline-icon">
                      <FiCompass />
                    </div>
                    <div>
                      <span className="about-timeline-year">{item.year}</span>
                      <h3 className="about-timeline-title">{item.title}</h3>
                      <p className="about-timeline-desc">{item.description}</p>
                    </div>
                  </div>
                ))}
            </div>

            <aside
              className="about-quote-card"
              style={
                data?.site?.quote?.image?.trim()
                  ? { backgroundImage: `url("${data.site.quote.image}")` }
                  : undefined
              }
            >
              <span className="about-quote-mark">“</span>
              <p>
                {data?.site?.quote?.text ||
                  "Life is not measured by the number of breaths we take, but by the moments that take our breath away."}
              </p>
              {data?.site?.quote?.author && (
                <span className="about-quote-author">
                  — {data.site.quote.author}
                </span>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ── Work and Projects Section (Full Width Header + 4-Card Balanced Grid) ── */}
      {Array.isArray(projects) && projects.length > 0 && (
        <section className="about-work-section" id="projects-list" aria-label="Projects and Work">
          <div className="about-container">
            <div className="about-work-header">
              <div className="about-work-header-copy">
                <span className="about-section-kicker">Projects and work</span>
                <h2>Things I've Built</h2>
                <p>
                  A collection of projects that reflect my passion for creating
                  meaningful and useful experiences.
                </p>
              </div>
              <Link to="/articles" className="about-outline-btn">
                <span>View All Projects</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="about-projects-grid-cards">
              {projects.map((project) => (
                <article className="about-project-mini-card" key={project.id}>
                  {project?.image?.trim() && (
                    <img
                      src={project.image.trim()}
                      alt={project.title}
                      loading="lazy"
                    />
                  )}
                  <div className="about-project-mini-body">
                    <span className="about-project-mini-cat">
                      {project.category}
                    </span>
                    <h3 className="about-project-mini-title">
                      {project.title}
                    </h3>
                    <p className="about-project-mini-desc">
                      {project.description}
                    </p>
                    {project.status && (
                      <small className="about-project-mini-status">
                        {project.status}
                      </small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Flagship Projects & Experiences Section ── */}
      <AboutProjectsSection />

      {/* ── Lower Grid: Stats, Skills, Values, CTA ── */}
      <section className="about-lower-section" aria-label="Experience and Values">
        <div className="about-container">
          <div className="about-lower-grid">
            {/* Stat Strip */}
            {Array.isArray(stats) && stats.length > 0 && (
              <div className="about-stat-strip">
                {stats.map((stat) => (
                  <div className="about-stat-item" key={stat.id}>
                    <FiAward className="about-stat-icon" />
                    <strong className="about-stat-value">{stat.value}</strong>
                    <span className="about-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Skills Panel */}
            {Array.isArray(skills) && skills.length > 0 && (
              <div className="about-panel-card" id="skills">
                <span className="about-section-kicker">Skills and expertise</span>
                <h2>What I Do</h2>
                <div className="about-skills-list">
                  {skills.map((skill) => (
                    <div className="about-skill-row" key={skill.id}>
                      <div className="about-skill-meta">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <div
                        className="about-skill-bar"
                        role="progressbar"
                        aria-valuenow={skill.level}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={skill.name}
                      >
                        <div
                          className="about-skill-fill"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Story CTA */}
            <div className="about-bottom-cta">
              <FiBriefcase className="about-bottom-cta-icon" />
              <h2>Let's Create Something Meaningful Together</h2>
              <p>I am always open to new opportunities, writing collaborations, and conversations.</p>
              <Link className="about-bottom-cta-btn" to="/contact">
                <span>Get In Touch</span>
                <FiArrowRight />
              </Link>
            </div>

            {/* Values Panel */}
            {Array.isArray(story?.values) && story.values.length > 0 && (
              <div className="about-panel-card about-values-panel">
                <span className="about-section-kicker">My approach</span>
                <h2>I Believe In</h2>
                <div className="about-values-grid">
                  {story.values.map((value) => (
                    <div className="about-value-item" key={value.title}>
                      <FiStar className="about-value-icon" />
                      <h3 className="about-value-title">{value.title}</h3>
                      <p className="about-value-text">{value.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ReadMyStory;
