import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";

const StoriesSection = () => {
  const { data } = useCms();
  const intro = data.site.storyIntro;

  return (
    <section className="stories-section" id="about">
      <div className="stories-container">
        <div className="stories-icon" aria-hidden="true">
          <span>+</span>
        </div>

        <p className="stories-subtitle">{intro.subtitle}</p>

        <h2 className="stories-text">{intro.text}</h2>

        <Link className="stories-btn" to="/read-my-story">
          {intro.cta}
        </Link>
      </div>
    </section>
  );
};

export default StoriesSection;
