import { Link } from "react-router";
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

        {/* Right Column: Stacked Layered Glass Cards Display */}
        <div className="hero-glass-column">
          <div className="hero-card-stack">
            {/* Back Card 2 (Peeking Top-Left) */}
            <div className="hero-glass-card stack-card back-card-2" aria-hidden="true">
              <div className="glass-card-badge coding">⚡ Coding</div>
              <h3 className="glass-card-title">Clean Architecture & Modern React</h3>
              <p className="glass-card-excerpt">Building scalable web interfaces with robust state management.</p>
              <div className="glass-card-meta">
                <span className="glass-card-author">Noble John Steeven</span>
                <span className="glass-card-dot">•</span>
                <span className="glass-card-read">8 min read</span>
              </div>
            </div>

            {/* Back Card 1 (Peeking Top-Right) */}
            <div className="hero-glass-card stack-card back-card-1" aria-hidden="true">
              <div className="glass-card-badge reflections">🌿 Reflections</div>
              <h3 className="glass-card-title">The Art of Slowing Down in a Fast World</h3>
              <p className="glass-card-excerpt">Why intentional pause fuels long-term creativity and inner clarity.</p>
              <div className="glass-card-meta">
                <span className="glass-card-author">Noble John Steeven</span>
                <span className="glass-card-dot">•</span>
                <span className="glass-card-read">6 min read</span>
              </div>
            </div>

            {/* Front Card (Primary Main Layer) */}
            <div className="hero-glass-card stack-card front-card">
              <div className="glass-card-badge life">❤️ Life</div>
              <h3 className="glass-card-title">Finding beauty in the quiet corners of our journey.</h3>
              <p className="glass-card-excerpt">Reflections on slow living, finding purpose, and the small moments that shape who we are.</p>
              <div className="glass-card-meta">
                <span className="glass-card-author">Noble John Steeven</span>
                <span className="glass-card-dot">•</span>
                <span className="glass-card-read">5 min read</span>
              </div>
              
              {/* Anchored Floating Badge */}
              <div className="hero-floating-badge">
                <span>✍️ 12+ Published Stories</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
