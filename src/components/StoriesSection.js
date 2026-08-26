import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import { GiFeather } from "react-icons/gi";
import { useCms } from "../context/CmsContext";

const DEFAULT_STORY_IMAGE =
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=90";

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const StoriesSection = () => {
  const { data } = useCms();
  const intro = data.site.storyIntro;
  const title = intro.title || "A space for stories that stay with us.";
  const accentWord = intro.accentWord?.trim() || "stay";
  const titleParts = title.split(
    new RegExp(`(${escapeRegExp(accentWord)})`, "gi")
  );

  return (
    <section className="stories-section-premium" id="about">
      <img
        className="stories-background-img"
        src={intro.image || DEFAULT_STORY_IMAGE}
        alt="Fountain pen resting on a handwritten journal"
        loading="lazy"
      />
      <div className="stories-background-overlay" aria-hidden="true" />

      <div className="stories-container-premium">
        <p className="stories-handwritten-note">
          {intro.eyebrow || "Stories stay.\nJourneys shape us."}
        </p>

        <div className="stories-paper-card">
          <div className="stories-card-content">
            <div className="stories-card-heading">
              <GiFeather className="stories-feather" aria-hidden="true" />
              <h2 className="stories-card-title">
                {titleParts.map((part, index) =>
                  part.toLowerCase() === accentWord.toLowerCase() ? (
                    <span key={`${part}-${index}`} className="stories-title-accent">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </h2>
            </div>

            <div className="stories-card-divider" aria-hidden="true">
              <span />
              <span />
            </div>

            <p className="stories-card-description">{intro.text}</p>

            <Link className="stories-btn-premium" to="/about">
              {intro.cta}
              <FiArrowRight className="stories-btn-arrow" aria-hidden="true" />
            </Link>

            <p className="stories-card-signature">
              {intro.signature || "Experience. Reflect. Grow."}
            </p>
          </div>

          <svg
            className="stories-botanical"
            viewBox="0 0 180 220"
            fill="none"
            aria-hidden="true"
          >
            <path d="M24 211C72 177 111 131 146 43" />
            <path d="M63 178C53 160 52 143 60 127C70 145 72 161 63 178Z" />
            <path d="M82 156C70 136 69 117 78 99C90 119 92 138 82 156Z" />
            <path d="M103 128C94 108 95 90 106 74C115 94 114 112 103 128Z" />
            <path d="M122 95C117 76 121 60 134 47C139 65 135 81 122 95Z" />
            <path d="M69 169C87 166 101 170 111 181C94 185 80 181 69 169Z" />
            <path d="M88 145C106 140 121 143 132 153C115 159 100 156 88 145Z" />
            <path d="M107 116C123 108 138 109 151 117C136 126 121 125 107 116Z" />
            <path d="M127 82C141 72 155 70 169 75C156 87 142 89 127 82Z" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default StoriesSection;
