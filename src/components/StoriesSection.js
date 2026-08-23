import { Link } from "react-router";
import { useCms } from "../context/CmsContext";
import { FiArrowRight } from "react-icons/fi";

const StoriesSection = () => {
  const { data } = useCms();
  const intro = data.site.storyIntro;

  return (
    <section className="stories-section-premium" id="about">
      <div className="stories-container-premium">
        
        {/* Left spacer to leave the background photo's pen and notebook visible */}
        <div className="stories-spacer-col" />

        {/* Right Column: Text content */}
        <div className="stories-content-col">
          <span className="stories-subtitle-premium">{intro.subtitle}</span>
          <h2 className="stories-text-premium">{intro.text}</h2>
          <Link className="stories-btn-premium" to="/about">
            {intro.cta} <FiArrowRight className="stories-btn-arrow" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default StoriesSection;
