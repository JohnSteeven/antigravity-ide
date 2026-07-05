import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";

const Hero = () => {
  const { data } = useCms();
  const hero = data.site.hero;

  return (
    <section
      className="hero"
      id="hero"
      style={{ backgroundImage: `url("${hero.image}")` }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <p className="hero-subtitle">{hero.eyebrow}</p>

        <h1 className="hero-title">{hero.title}</h1>

        <p className="hero-description">{hero.description}</p>

        <div className="hero-buttons">
          <a className="primary-btn" href="#latest-articles">
            {hero.primaryLabel}
          </a>

          <Link className="secondary-btn" to="/read-my-story">
            {hero.secondaryLabel || "Read My Story"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
