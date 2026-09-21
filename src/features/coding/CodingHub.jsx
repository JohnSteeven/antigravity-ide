import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiCode, FiPlay, FiSearch, FiTerminal } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { learnApi } from "../../services/apiService";
import CodingSubNav from "./CodingSubNav.jsx";
import { CANONICAL_TRACKS, courseSlugToTrack } from "./codingConstants";
import "./coding.css";

export default function CodingHub() {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [continueData, setContinueData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [coursesRes, continueRes, statsRes] = await Promise.all([
          learnApi.courses(),
          isAuthenticated ? learnApi.continueLearning().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          learnApi.codingStats().catch(() => ({ data: null })),
        ]);

        if (!active) return;
        const allCourses = coursesRes.courses || coursesRes.items || coursesRes.data?.courses || coursesRes.data || [];
        setCourses(allCourses);

        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        const enrollments = continueRes.data || continueRes || [];
        const codingEnrollments = Array.isArray(enrollments)
          ? enrollments.filter((e) => {
              const slug = e.courseId?.slug || e.courseSlug;
              return ["html-foundations", "css-foundations", "javascript-foundations", "python-foundations"].includes(slug);
            })
          : [];

        if (codingEnrollments.length > 0) {
          setContinueData(codingEnrollments[0]);
        }
      } catch (err) {
        // Fallback silently if offline/error
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Combine presentation metadata with authoritative backend course data
  const tracksWithData = useMemo(() => {
    return CANONICAL_TRACKS.map((trackMeta) => {
      const dbCourse = courses.find((c) => c.slug === trackMeta.courseSlug);
      const lessonCount = dbCourse?.lessonCount || 0;
      const completedCount = dbCourse?.enrollment?.completedLessonCount || 0;
      const progressPercent =
        lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
      const isPremium =
        dbCourse
          ? dbCourse.accessLevel === "premium" ||
            dbCourse.monetizationType === "PREMIUM_INCLUDED"
          : Boolean(trackMeta.isPremium);

      return {
        ...trackMeta,
        title: dbCourse?.title || `${trackMeta.label} Foundations`,
        description: dbCourse?.description || trackMeta.tagline,
        level: dbCourse?.level?.replace("_", " ") || "Beginner",
        lessonCount,
        progressPercent,
        completedCount,
        isPremium,
        hasEnrollment: Boolean(dbCourse?.enrollment),
        firstLessonId: dbCourse?.curriculum?.[0]?.lessons?.[0]?.id || null,
      };
    });
  }, [courses]);

  // Filtered tracks based on search
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracksWithData;
    const q = searchQuery.toLowerCase();
    return tracksWithData.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [tracksWithData, searchQuery]);

  const continueLessonCount = continueData?.courseId?.lessonCount || 0;
  const continueCompletedCount = continueData?.completedLessonCount || 0;
  const continuePercent = continueLessonCount
    ? Math.round((continueCompletedCount / continueLessonCount) * 100)
    : 0;

  return (
    <div className="coding-page">
      <CodingSubNav />

      {/* Hero Section */}
      <section className="coding-hero coding-hero--overview">
        <div className="coding-hero__copy">
          <p className="coding-hero__kicker">
            <FiTerminal /> CODING
          </p>
          <h1>Learn by building.</h1>
          <p className="coding-hero__lead">
            Interactive lessons, live code execution, exercises, quizzes, projects,
            and practical challenges.
          </p>
        </div>

        <div className="coding-hero__visual" aria-hidden="true">
          <div className="coding-hero__visual-bar">
            <div className="coding-hero__window-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="coding-hero__filename">learning-path.js</span>
            <span className="coding-hero__file-status">Saved</span>
          </div>
          <div className="coding-hero__code">
            <div><span>01</span><code><b>const</b> journey = [</code></div>
            <div><span>02</span><code>&nbsp;&nbsp;&quot;learn&quot;, &quot;build&quot;, &quot;practice&quot;,</code></div>
            <div><span>03</span><code>&nbsp;&nbsp;&quot;ship&quot;</code></div>
            <div><span>04</span><code>];</code></div>
            <div className="coding-hero__code-result"><span>05</span><code>journey.map(step =&gt; grow(step));</code></div>
          </div>
          <div className="coding-hero__visual-footer">
            <span><i /> Browser sandbox ready</span>
            <span>4 guided tracks</span>
          </div>
        </div>
      </section>

      {/* Continue Learning Section (Authenticated & Enrolled) */}
      {continueData && continueData.courseId && (
        <section className="coding-continue" aria-label="Continue learning">
          <div className="coding-continue__card">
            <div className="coding-continue__identity">
              <div className="coding-continue__icon" aria-hidden="true">
                <FiCode />
              </div>
              <div className="coding-continue__info">
                <p className="coding-continue__kicker">Pick up where you left off</p>
                <h2 className="coding-continue__title">{continueData.courseId.title}</h2>
                <div className="coding-continue__progress-row">
                  <div className="coding-continue__progress-copy">
                    <span>
                      {continueCompletedCount} of {continueLessonCount} lessons completed
                    </span>
                    <strong>{continuePercent}%</strong>
                  </div>
                  <div
                    className="coding-continue__progress-bar"
                    role="progressbar"
                    aria-label={`${continueData.courseId.title} progress`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={continuePercent}
                  >
                    <div
                      className="coding-continue__progress-fill"
                      style={{ width: `${continuePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Link
              to={
                continueData.currentLessonId
                  ? `/coding/${courseSlugToTrack(continueData.courseId.slug)}/lesson/${continueData.currentLessonId}`
                  : `/coding/${courseSlugToTrack(continueData.courseId.slug)}`
              }
              className="cd-btn cd-btn--primary coding-continue__action"
            >
              <FiPlay /> Continue Learning
            </Link>
          </div>
        </section>
      )}

      {/* Compact Coding Stats Row */}
      <div className="cd-hub-stats-row" role="region" aria-label="Coding activity stats">
        <div className="cd-hub-stat-card">
          <div className="cd-hub-stat-card__icon" aria-hidden="true">🔥</div>
          <div>
            <div className="cd-hub-stat-card__val">
              {stats?.streaks?.currentStreak || 0} Days
            </div>
            <div className="cd-hub-stat-card__lbl">Current Streak</div>
          </div>
        </div>

        <div className="cd-hub-stat-card">
          <div className="cd-hub-stat-card__icon" aria-hidden="true">🎯</div>
          <div>
            <div className="cd-hub-stat-card__val">
              {stats?.weeklyGoal?.daysCompleted ?? 0} / {stats?.weeklyGoal?.targetDays ?? 5}
            </div>
            <div className="cd-hub-stat-card__lbl">Weekly Goal</div>
          </div>
        </div>

        <div className="cd-hub-stat-card">
          <div className="cd-hub-stat-card__icon" aria-hidden="true">📊</div>
          <div>
            <div className="cd-hub-stat-card__val">{stats?.completedLessons || 0}</div>
            <div className="cd-hub-stat-card__lbl">Lessons Done</div>
          </div>
        </div>

        <div className="cd-hub-stat-card">
          <div className="cd-hub-stat-card__icon" aria-hidden="true">⚡</div>
          <div>
            <div className="cd-hub-stat-card__val">{stats?.exercisesPassed || 0}</div>
            <div className="cd-hub-stat-card__lbl">Exercises Passed</div>
          </div>
        </div>
      </div>

      {/* Recent Achievements chips (if any) */}
      {stats?.achievements?.length > 0 && (
        <div className="coding-achievements">
          <span className="coding-achievements__label">Recent achievements</span>
          <div className="coding-achievements__list">
            {stats.achievements.slice(0, 3).map((ach, idx) => (
              <span
                key={ach.id || ach.key || `ach-${idx}`}
                className="coding-achievements__item"
              >
                <span aria-hidden="true">🏆</span> {ach.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="coding-catalog-heading">
        <div>
          <p>Learning paths</p>
          <h2>Choose your next track</h2>
        </div>
        <span>{filteredTracks.length} of {tracksWithData.length} tracks</span>
      </div>

      {/* Search Bar */}
      <div className="coding-search-bar">
        <div className="coding-search-bar__inner">
          <FiSearch className="coding-search-bar__icon" />
          <input
            type="text"
            className="coding-search-bar__input"
            placeholder="Search HTML, CSS, JavaScript, Python tracks & lessons…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search coding curriculum"
          />
        </div>
      </div>

      {/* 4 Canonical Tracks Grid */}
      <section className="coding-tracks-grid" id="tracks" aria-label="Coding tracks">
        {filteredTracks.map((track) => {
          return (
            <article
              key={track.key}
              className="coding-track-card"
              style={{ "--coding-track-accent": track.accent }}
            >
              <div className="coding-track-card__top">
                <div className="coding-track-card__header">
                  <Link to={`/coding/${track.key}`} className="coding-track-card__icon" aria-label={track.title}>
                    <span aria-hidden="true">{track.icon}</span>
                  </Link>
                  <span
                    className={`cd-badge ${
                      track.isPremium ? "cd-badge--premium" : "cd-badge--free"
                    }`}
                  >
                    {track.isPremium ? "PREMIUM INCLUDED" : "FREE"}
                  </span>
                </div>

                <h3 className="coding-track-card__title">
                  <Link to={`/coding/${track.key}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {track.title}
                  </Link>
                </h3>
                <p className="coding-track-card__description">{track.description}</p>

                <div className="coding-track-card__meta">
                  <span>{track.level}</span>
                  <span>•</span>
                  <span>{track.lessonCount} Lessons</span>
                  <span>•</span>
                  <span>MyJourney Coding</span>
                </div>

                {/* Real-time Progress when Authenticated */}
                {isAuthenticated && track.hasEnrollment && (
                  <div className="coding-track-card__progress-block">
                    <div className="coding-track-card__progress-labels">
                      <span>Progress</span>
                      <span>{track.progressPercent}%</span>
                    </div>
                    <div className="coding-track-card__progress-track">
                      <div
                        className="coding-track-card__progress-fill"
                        style={{
                          width: `${track.progressPercent}%`,
                          backgroundColor: track.accent,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="coding-track-card__bottom">
                <Link
                  to={`/coding/${track.key}`}
                  className="cd-btn cd-btn--secondary cd-btn--full"
                >
                  {track.hasEnrollment ? "Continue Track" : "Start Track"}{" "}
                  <FiArrowRight />
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* Explore More Modules */}
      <section className="coding-more">
        <div className="coding-more__heading">
          <div>
            <p>Keep exploring</p>
            <h2>More ways to code</h2>
          </div>
          <FiArrowRight aria-hidden="true" />
        </div>
        <div className="coding-more__grid">
          <Link to="/coding/playground" className="coding-more__card">
            <div className="coding-more__icon" aria-hidden="true">⚙️</div>
            <h3>Code Playground</h3>
            <p>
              Free in-browser HTML/CSS/JS sandbox &amp; Pyodide Python environment.
            </p>
          </Link>

          <Link to="/coding/projects" className="coding-more__card">
            <div className="coding-more__icon" aria-hidden="true">🚀</div>
            <h3>Portfolio Projects</h3>
            <p>
              Practical, portfolio-grade capstone projects built right in your browser.
            </p>
          </Link>

          <Link to="/coding/practice" className="coding-more__card">
            <div className="coding-more__icon" aria-hidden="true">⚡</div>
            <h3>Quick Practice</h3>
            <p>
              Targeted code challenges to test syntax, layout, and algorithmic skills.
            </p>
          </Link>

          <Link to="/coding/resources" className="coding-more__card">
            <div className="coding-more__icon" aria-hidden="true">📚</div>
            <h3>Resource Library</h3>
            <p>
              Official cheat sheets, checklists, and downloadable course guides.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
