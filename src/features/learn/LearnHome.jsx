import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiBookOpen, FiCode, FiCheck, FiLock, FiPlay, FiUsers } from "react-icons/fi";
import { learnApi } from "../../services/apiService";
import LearnDiscoveryLayout from "./LearnDiscoveryLayout";
import "./learn.css";

/* ── Format-to-route map ───────────────────────────────────────────────── */
const FORMAT_ROUTES = {
  course: "/learn/courses",
  video: "/learn/videos",
  podcast: "/learn/podcasts",
  resource: "/learn/resources",
  exam: "/learn/exams",
};

const CANONICAL_CODING_DESTINATIONS = {
  "html-foundations": "/coding/html",
  "css-foundations": "/coding/css",
  "javascript-foundations": "/coding/javascript",
  "python-foundations": "/coding/python",
};

const CODING_COVERS = {
  "html-foundations": { label: "HTML", mark: "</>", tone: "clay" },
  "css-foundations": { label: "CSS", mark: "{ }", tone: "lavender" },
  "javascript-foundations": { label: "JavaScript", mark: "JS", tone: "ochre" },
  "python-foundations": { label: "Python", mark: "Py", tone: "blue" },
};

function LearnCover({ item, format }) {
  const [failedImage, setFailedImage] = useState("");
  const coding = format === "course" ? CODING_COVERS[item.slug] : null;
  const image = item.coverImage || item.thumbnail || "";
  if (image && !coding && failedImage !== image) {
    return <img className="learn-card__image" src={image} alt={item.coverImageAlt || item.thumbnailAlt || ""} loading="lazy" onError={() => setFailedImage(image)} />;
  }
  const tones = ["sage", "clay", "lavender", "ochre", "blue"];
  const tone = coding?.tone || tones[Array.from(item.slug || item.title || "").reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length];
  const initials = (item.title || "Learn").split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
  return (
    <div className={`learn-card__art learn-art--${tone}`} aria-hidden="true">
      <span className="learn-card__art-label">{coding ? "MyJourney Coding" : "MyJourney Learn"}</span>
      <span className="learn-card__art-mark">{coding?.mark || initials}</span>
      <span className="learn-card__art-foot">{coding?.label || item.topics?.find((topic) => topic?.name)?.name || format}<FiArrowRight /></span>
    </div>
  );
}

/* ── LearnCard ─────────────────────────────────────────────────────────── */
const LearnCard = ({ item, format }) => {
  const isCoding = format === "course" && Boolean(CANONICAL_CODING_DESTINATIONS[item.slug]);
  const isSystemCreator = isCoding || item.isSystemOwned || item.creator?.isSystem;
  const destination =
    format === "course" && CANONICAL_CODING_DESTINATIONS[item.slug]
      ? CANONICAL_CODING_DESTINATIONS[item.slug]
      : format === "exam"
      ? FORMAT_ROUTES.exam
      : `${FORMAT_ROUTES[format]}/${item.slug}`;
  return (
    <article className="learn-card">
      <LearnCover item={item} format={format} />
      <div className="learn-card__body">
        <div className="learn-card__eyebrow">
          <span>{format}</span>
          <span className={`learn-card__access${item.accessLevel === "premium" ? " is-premium" : ""}`}>{item.accessLevel === "premium" && <FiLock aria-hidden="true" />}{item.accessLevel === "premium" ? "Premium" : "Free"}</span>
        </div>
        <h3>
          <Link to={destination}>{item.title}</Link>
        </h3>
        <p>{item.subtitle || item.description}</p>
        {(item.creator?.displayName || isCoding) && (
          <span className="learn-card__creator">
            {isSystemCreator ? (item.creator?.displayName || "MyJourney Coding") : <>By {item.creator?.slug ? <Link to={`/creators/${item.creator.slug}`}>{item.creator.displayName}</Link> : item.creator.displayName}</>}
          </span>
        )}
        <div className="learn-card__footer">
          <span><FiBookOpen aria-hidden="true" />{format === "course" && item.lessonCount > 0 ? `${item.lessonCount} lessons` : `Explore ${format}`}</span>
          <FiArrowRight aria-hidden="true" />
        </div>
      </div>
    </article>
  );
};

/* ── LearnShelf ────────────────────────────────────────────────────────── */
const LearnShelf = ({ id, title, format, items = [], action }) => {
  if (!items.length) return null;
  return (
    <section className="learn-shelf" aria-labelledby={id}>
      <div className="learn-section-heading">
        <div>
          <p className="learn-kicker">{format === "course" ? "Find your next chapter" : "Keep exploring"}</p>
          <h2 id={id}>{title}</h2>
        </div>
        {action}
      </div>
      <div className="learn-card-grid">
        {items.map((item) => (
          <LearnCard
            key={item.id || item._id || item.slug}
            item={item}
            format={format}
          />
        ))}
      </div>
    </section>
  );
};

/* ── LearnHome ─────────────────────────────────────────────────────────── */
export default function LearnHome() {
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  const hasContinueLearning = Boolean(data?.continueLearning?.length);
  const hasLibraryContent = Boolean(
    data?.courses?.length ||
      data?.videos?.length ||
      data?.podcasts?.length ||
      data?.resources?.length ||
      data?.exams?.length
  );

  useEffect(() => {
    let active = true;
    learnApi
      .home()
      .then((response) => {
        if (active) {
          setData(response.data);
          setState({ loading: false, error: "" });
        }
      })
      .catch(
        (error) =>
          active && setState({ loading: false, error: error.message })
      );
    return () => {
      active = false;
    };
  }, []);

  /* ── Loading / error states (no sidebar needed while loading) ── */
  if (state.loading)
    return (
      <main className="learn-page">
        <p className="learn-state" role="status">
          Opening Learn…
        </p>
      </main>
    );

  if (state.error)
    return (
      <main className="learn-page">
        <div className="learn-state" role="alert">
          <h1>Learn is unavailable</h1>
          <p>{state.error}</p>
        </div>
      </main>
    );

  /* ── Main render wrapped in shared discovery shell ── */
  return (
    <LearnDiscoveryLayout>
      {/* Hero */}
      <header className="learn-hero">
        <div className="learn-hero__copy">
          <p className="learn-kicker"><span aria-hidden="true" /> MyJourney Learn</p>
          <h1>A little learning.<br /><em>A world of possibility.</em></h1>
          <p className="learn-hero__description">Build useful skills, follow your curiosity, and make progress at your own pace. Your next chapter starts here.</p>
          <div className="learn-hero__actions">
            <Link className="learn-primary-action" to="/learn/courses">Explore Courses <FiArrowRight aria-hidden="true" /></Link>
            <Link className="learn-secondary-action" to="/creators"><FiUsers aria-hidden="true" /> Meet Creators</Link>
          </div>
        </div>
        <div className="learn-hero__spotlight">
          <div className="learn-hero__spotlight-top"><FiCode aria-hidden="true" /><span>Learn by doing</span></div>
          <div className="learn-hero__code" aria-hidden="true"><span>&lt;</span> your next chapter <span>/&gt;</span></div>
          <h2>Turn an idea into<br />something real.</h2>
          <p>Start with the foundations. Build as you learn.</p>
          <Link to="/coding">Explore Coding <FiArrowRight aria-hidden="true" /></Link>
          <div className="learn-hero__languages" aria-label="Coding languages"><span>HTML</span><span>CSS</span><span>JavaScript</span><span>Python</span></div>
        </div>
      </header>

      {/* Continue Learning (private, authenticated only) */}
      {hasContinueLearning && (
        <section
          className="learn-continue"
          aria-labelledby="continue-learning-heading"
        >
          <div className="learn-section-heading">
            <div>
              <p className="learn-kicker">Your learning journey</p>
              <h2 id="continue-learning-heading">Continue Learning</h2>
            </div>
            <span className="learn-section-note">One step closer, every lesson.</span>
          </div>
          <div className="learn-continue__rail">
            {data.continueLearning.filter((entry) => entry.courseId).map((entry) => {
              const course = entry.courseId;
              const total = entry.totalEligibleLessons ?? course.lessonCount ?? 0;
              const completed = entry.completedLessonCount || 0;
              const percent = Math.max(0, Math.min(100, entry.progressPercent ?? (total > 0 ? Math.round(completed / total * 100) : 0)));
              const isCompleted = entry.isCompleted ?? entry.status === "completed";
              const cover = CODING_COVERS[course.slug];
              return (
                <article key={entry._id || course._id || course.slug} className="learn-resume-card">
                  <div className="learn-resume-card__top">
                    <span className={`learn-resume-card__icon learn-art--${cover?.tone || "sage"}`} aria-hidden="true">{cover?.mark || <FiBookOpen />}</span>
                    <div><p>{isCompleted ? "Course completed" : "Pick up where you left off"}</p><h3><Link to={CANONICAL_CODING_DESTINATIONS[course.slug] || `/learn/courses/${course.slug}`}>{course.title}</Link></h3></div>
                    <span className="learn-resume-card__arrow" aria-hidden="true">{isCompleted ? <FiCheck /> : <FiArrowRight />}</span>
                  </div>
                  <div className="learn-resume-card__progress-label"><span>{completed} of {total} lessons</span><span>{percent}%</span></div>
                  <progress max="100" value={percent} aria-label={`${course.title} progress`}>{percent}%</progress>
                  <div className="learn-resume-card__bottom"><span>{isCompleted ? "Ready to revisit anytime" : "Keep your momentum going"}</span><span>{isCompleted ? "Review Course" : "Resume Course"} <FiPlay aria-hidden="true" /></span></div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Explore Topics — mobile trigger rendered by LearnDiscoveryLayout above main content */}

      {/* Featured Courses */}
      <LearnShelf
        id="learn-courses"
        title="Featured Courses"
        format="course"
        items={data?.courses}
        action={<Link to="/learn/courses">View all Courses <FiArrowRight aria-hidden="true" /></Link>}
      />

      {/* Creator discovery */}
      <section
        className="learn-creator-discovery"
        aria-labelledby="learn-creators-heading"
      >
        <div>
          <p className="learn-kicker">Learn from people</p>
          <h2 id="learn-creators-heading">
            Meet the Creators behind the work.
          </h2>
          <p>
            Discover educators, specialists, writers, and storytellers sharing
            practical experience across MyJourney.
          </p>
        </div>
        <Link to="/creators">Explore Creators <FiArrowRight aria-hidden="true" /></Link>
      </section>

      {/* Additional format shelves */}
      <LearnShelf
        id="learn-videos"
        title="Watch and understand"
        format="video"
        items={data?.videos}
        action={<Link to="/learn/videos">View all Videos</Link>}
      />
      <LearnShelf
        id="learn-podcasts"
        title="Listen with intention"
        format="podcast"
        items={data?.podcasts}
        action={<Link to="/learn/podcasts">View all Podcasts</Link>}
      />
      <LearnShelf
        id="learn-resources"
        title="Keep something useful"
        format="resource"
        items={data?.resources}
        action={<Link to="/learn/resources">View all Resources</Link>}
      />
      <LearnShelf
        id="learn-exams"
        title="Exam preparation foundation"
        format="exam"
        items={data?.exams}
        action={<Link to="/learn/exams">View exam catalog</Link>}
      />

      {!hasLibraryContent && (
        <section className="learn-state">
          <h2>The learning library is taking shape.</h2>
          <p>
            Published, reviewed material will appear here. Nothing has been
            fabricated to fill the shelves.
          </p>
        </section>
      )}
    </LearnDiscoveryLayout>
  );
}

export { LearnCard };
