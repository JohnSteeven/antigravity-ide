import React, { useEffect, useState } from "react";
import { Link } from "react-router";
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

/* ── LearnCard ─────────────────────────────────────────────────────────── */
const LearnCard = ({ item, format }) => {
  const image = item.coverImage || item.thumbnail || "";
  const destination =
    format === "exam"
      ? FORMAT_ROUTES.exam
      : `${FORMAT_ROUTES[format]}/${item.slug}`;
  return (
    <article className="learn-card">
      {image && (
        <img
          className="learn-card__image"
          src={image}
          alt={item.coverImageAlt || item.thumbnailAlt || ""}
          loading="lazy"
        />
      )}
      <div className="learn-card__body">
        <div className="learn-card__eyebrow">
          <span>{format}</span>
          <span>{item.accessLevel === "premium" ? "Premium" : "Free"}</span>
        </div>
        <h3>
          <Link to={destination}>{item.title}</Link>
        </h3>
        <p>{item.subtitle || item.description}</p>
        {item.creator?.displayName && (
          <span className="learn-card__creator">
            By{" "}
            <Link to={`/creators/${item.creator.slug}`}>
              {item.creator.displayName}
            </Link>
          </span>
        )}
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
          <p className="learn-kicker">{format}</p>
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
        <p className="learn-kicker">MyJourney Learn</p>
        <h1>Knowledge for the life you are building.</h1>
        <p>
          Explore structured Courses and practical work from verified Creators.
          Topics organize discovery; each format keeps the experience it needs.
        </p>
        <div className="learn-hero__actions">
          <Link className="learn-primary-action" to="/learn/courses">
            Explore Courses
          </Link>
          <Link to="/creators">Meet Creators</Link>
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
              <p className="learn-kicker">Private to you</p>
              <h2 id="continue-learning-heading">Continue Learning</h2>
            </div>
          </div>
          <div className="learn-continue__rail">
            {data.continueLearning.map(
              (entry) =>
                entry.courseId && (
                  <article key={entry._id}>
                    <p>
                      {entry.completedLessonCount || 0} of{" "}
                      {entry.courseId.lessonCount || 0} lessons
                    </p>
                    <h3>
                      <Link to={`/learn/courses/${entry.courseId.slug}`}>
                        {entry.courseId.title}
                      </Link>
                    </h3>
                    <span>
                      {entry.status === "completed"
                        ? "Completed"
                        : "Resume Course"}
                    </span>
                  </article>
                )
            )}
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
        action={<Link to="/learn/courses">View all Courses</Link>}
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
        <Link to="/creators">Explore Creators</Link>
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
