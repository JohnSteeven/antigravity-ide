import { Link } from "react-router";
import { FiAward, FiBriefcase, FiCompass, FiStar } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import AboutProjectsSection from "../features/about/AboutProjectsSection";

const ReadMyStory = () => {
  const { data } = useCms();
  const { story, timeline, projects, skills, stats } = data;

  return (
    <main className="story-page">
      <section
        className="story-hero"
        style={story?.hero?.image?.trim() ? { backgroundImage: `url("${story.hero.image}")` } : undefined}
      >
        <div className="story-hero-overlay"></div>
        <div className="story-hero-content">
          <h1>{story.hero.title}</h1>
          <p>{story.hero.description}</p>
          <a href="#journey" className="primary-btn">
            Explore My Journey
          </a>
        </div>
      </section>

      <section className="story-intro-grid" id="journey">
        <div className="story-image-card">
          <img src={story?.about?.image?.trim() || undefined} alt={story?.about?.title} />
        </div>

        <div className="story-copy">
          <span className="section-kicker">{story.about.eyebrow}</span>
          <h2>{story.about.title}</h2>
          <p>{story.about.text}</p>
          <Link to="/articles" className="small-solid-btn">
            More About Me
          </Link>
        </div>

        <div className="journey-timeline">
          <span className="section-kicker">My journey so far</span>
          {timeline.map((item) => (
            <div className="timeline-item" key={item.id}>
              <div className="timeline-icon">
                <FiCompass />
              </div>
              <div>
                <span>{item.year}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <aside
          className="story-quote-card"
          style={data?.site?.quote?.image?.trim() ? { backgroundImage: `url("${data.site.quote.image}")` } : undefined}
        >
          <span>"</span>
          <p>{data?.site?.quote?.text}</p>
        </aside>
      </section>

      <section className="story-work-band" id="projects-list">
        <div className="story-project-intro">
          <span className="section-kicker">Projects and work</span>
          <h2>Things I've Built</h2>
          <p>
            A collection of projects that reflect my passion for creating
            meaningful and useful experiences.
          </p>
          <Link to="/articles" className="small-solid-btn">
            View All Projects
          </Link>
        </div>

        <div className="project-card-row">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <img src={project?.image?.trim() || undefined} alt={project.title} />
              <div>
                <span>{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <small>{project.status}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Flagship Projects & Experiences Section */}
      <AboutProjectsSection />

      <section className="story-lower-grid">
        <div className="stat-strip">
          {stats.map((stat) => (
            <div key={stat.id}>
              <FiAward />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="skills-panel" id="skills">
          <span className="section-kicker">Skills and expertise</span>
          <h2>What I Do</h2>
          <div className="skill-list">
            {skills.map((skill) => (
              <div className="skill-item" key={skill.id}>
                <div>
                  <span>{skill.name}</span>
                  <span>{skill.level}%</span>
                </div>
                <progress value={skill.level} max="100"></progress>
              </div>
            ))}
          </div>
        </div>

        <div className="values-panel">
          <span className="section-kicker">My approach</span>
          <h2>I Believe In</h2>
          <div className="value-grid">
            {story.values.map((value) => (
              <div key={value.title}>
                <FiStar />
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="story-cta">
          <FiBriefcase />
          <h2>Let's Create Something Meaningful Together</h2>
          <p>I am always open to new opportunities and collaborations.</p>
          <a className="primary-btn" href="#contact">
            Get In Touch
          </a>
        </div>
      </section>
    </main>
  );
};

export default ReadMyStory;
