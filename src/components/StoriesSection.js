import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";

const StoriesSection = () => {
  const { data } = useCms();
  const intro = data.site.storyIntro;

  return (
    <section className="stories-section" id="about">
      <div className="stories-container">

        <p className="stories-subtitle">{intro.subtitle}</p>

        <h2 className="stories-text">{intro.text}</h2>

        <Link className="stories-btn" to="/about">
          {intro.cta}
        </Link>
      </div>
    </section>
  );
};

export default StoriesSection;
