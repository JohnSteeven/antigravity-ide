import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";

const Hero = () => {
  const { data } = useCms();
  const hero = data.site.hero;

  return (
    <section className="hero" id="hero">
      {/* Ambient background light glows */}
      <div className="hero-glow-1"></div>
      <div className="hero-glow-2"></div>

      <div className="hero-container">
        
        {/* Left Column: Title & Description */}
        <div className="hero-content">
          <p className="hero-subtitle">{hero.eyebrow}</p>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-description">{hero.description}</p>

          <div className="hero-buttons">
            <a className="primary-btn" href="#latest-articles">
              {hero.primaryLabel}
            </a>
            <Link className="secondary-btn" to="/about">
              {hero.secondaryLabel || "Read My Story"}
            </Link>
          </div>
        </div>

        {/* Right Column: Floating Translucent Glass Card Decoration */}
        <div className="hero-glass-column">
          <div className="hero-glass-card">
            <div className="glass-card-badge">❤️ Life</div>
            <h3 className="glass-card-title">Finding beauty in the quiet corners of our journey.</h3>
            <p className="glass-card-excerpt">Reflections on slow living, finding purpose, and the small moments that shape who we are.</p>
            <div className="glass-card-meta">
              <span className="glass-card-author">Noble John Steeven</span>
              <span className="glass-card-dot">•</span>
              <span className="glass-card-read">5 min read</span>
            </div>
          </div>
          <div className="hero-floating-badge">
            <span>✍️ 12+ Published Stories</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
