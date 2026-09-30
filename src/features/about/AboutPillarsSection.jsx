import React from "react";
import { Link } from "react-router";
import {
  FiBookOpen,
  FiTerminal,
  FiSun,
  FiFeather,
  FiSmile,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";
import "./about-pillars.css";

const PILLARS_DATA = [
  {
    key: "read",
    name: "READ",
    index: "01",
    icon: <FiBookOpen aria-hidden="true" />,
    badge: "Editorial & Essays",
    headline: "Long-Form Stories & Editorial Insights",
    description:
      "Carefully written essays, field observations, personal memoirs, and structured technical incidents. Featuring distraction-free presets, typography tuning, and progress tracking.",
    chips: ["Adaptive Readers", "Curated Essays", "Incident Postmortems"],
    primaryRoute: "/articles",
    cta: "Explore Stories",
  },
  {
    key: "learn",
    name: "LEARN",
    index: "02",
    icon: <FiTerminal aria-hidden="true" />,
    badge: "Courses & Practice",
    headline: "Structured Courses & Interactive Coding",
    description:
      "Multi-module curriculum, syntax-highlighted sandboxes, automated test validation, and daily learning streaks across Python, JavaScript, and modern web development.",
    chips: ["In-Browser Runners", "Coding Sandboxes", "Daily Streaks"],
    primaryRoute: "/learn",
    cta: "Browse Curriculum",
  },
  {
    key: "life",
    name: "LIFE",
    index: "03",
    icon: <FiSun aria-hidden="true" />,
    badge: "Private & Personal",
    headline: "Personal Operating System & Reflection",
    description:
      "A private sanctuary for daily check-ins, micro-habit tracking, emotional clarity, and life milestone roadmaps. Strictly private to you and never indexed in public search.",
    chips: ["Zero-Knowledge Privacy", "Daily Check-ins", "Life Milestones"],
    primaryRoute: "/life",
    cta: "Open Life OS",
  },
  {
    key: "create",
    name: "CREATE",
    index: "04",
    icon: <FiFeather aria-hidden="true" />,
    badge: "Authoring & Studio",
    headline: "Creator Studio & Editorial Publishing",
    description:
      "Authoring workspaces for independent writers and technical mentors to structure courses, publish rich media lessons, and cultivate thoughtful learner communities.",
    chips: ["Lesson Architect", "Editorial Review", "Community Impact"],
    primaryRoute: "/creators",
    cta: "Meet Creators",
  },
  {
    key: "play",
    name: "PLAY",
    index: "05",
    icon: <FiSmile aria-hidden="true" />,
    badge: "Interactive & Games",
    headline: "Simulations & Real-Time Multiplayer",
    description:
      "Engaging philosophical dilemma simulations like Play Life and live multiplayer party games like Who Knows Me Better and Life Auction—turning meaningful ideas into shared experiences.",
    chips: ["Play Life Simulation", "Multiplayer Rooms", "Philosophical Trade-offs"],
    primaryRoute: "/play",
    cta: "Enter Play Hub",
  },
];

const AboutPillarsSection = () => {
  return (
    <section className="about-pillars-section" id="pillars" aria-labelledby="pillars-heading">
      <div className="about-pillars-container">
        {/* Header */}
        <header className="about-pillars-header">
          <span className="about-pillars-kicker">Platform Architecture</span>
          <h2 id="pillars-heading" className="about-pillars-title">
            The Five Pillars of MyJourney
          </h2>
          <p className="about-pillars-intro">
            MyJourney brings together long-form literature, hands-on technical learning, private
            self-reflection, creator-first authoring, and playful social simulations into one
            interconnected ecosystem.
          </p>
        </header>

        {/* Five Pillars Grid */}
        <div className="about-pillars-grid">
          {PILLARS_DATA.map((pillar) => (
            <article key={pillar.key} className={`about-pillar-card pillar-${pillar.key}`}>
              <div className="about-pillar-top">
                <span className="about-pillar-badge">{pillar.badge}</span>
                <span className="about-pillar-index">{pillar.index}</span>
              </div>

              <div className="about-pillar-icon-box">{pillar.icon}</div>

              <h3 className="about-pillar-heading">{pillar.headline}</h3>
              <p className="about-pillar-desc">{pillar.description}</p>

              <div className="about-pillar-chips" aria-label={`${pillar.name} core features`}>
                {pillar.chips.map((chip) => (
                  <span key={chip} className="about-pillar-chip">
                    {chip}
                  </span>
                ))}
              </div>

              <Link
                to={pillar.primaryRoute}
                className="about-pillar-cta"
                aria-label={`${pillar.cta} in ${pillar.name}`}
              >
                <span>{pillar.cta}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        {/* Connected Ecosystem & Journey AI Callout */}
        <div className="about-connection-card">
          <div className="about-connection-grid">
            <div className="about-connection-col">
              <h3>How the Pillars Connect</h3>
              <p>
                Unlike disjointed point tools, MyJourney connects your intellectual curiosity with
                practical execution. What you read in essays inspires what you build in coding tracks;
                what you reflect on in Life anchors how you create and share with others.
              </p>
              <p>
                Everything is backed by a unified user identity, server-authoritative progress tracking,
                and transparent account entitlements.
              </p>
            </div>

            <div className="about-connection-col">
              <h3>Journey AI & Trust Commitment</h3>
              <p>
                <strong>Journey AI</strong> acts as an assistive companion for summaries, coding guidance,
                and guided study. In keeping with our product principles, it provides helpful suggestions
                without pretending to provide certified medical or financial outcomes.
              </p>
              <ul className="about-trust-list">
                <li className="about-trust-item">
                  <FiShield className="about-trust-item-icon" aria-hidden="true" />
                  <span>
                    <strong>Strict Life Isolation:</strong> Your personal reflections and habit records
                    are strictly isolated and never surfaced to other users or search.
                  </span>
                </li>
                <li className="about-trust-item">
                  <FiCheckCircle className="about-trust-item-icon" aria-hidden="true" />
                  <span>
                    <strong>Honest Providers:</strong> External payment, AI, and video services are
                    truthfully reported, with resilient fallbacks when offline.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPillarsSection;
