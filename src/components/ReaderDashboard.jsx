/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReaderDashboard.jsx  —  Reader Experience & Personalization Dashboard
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import {
  FiBookOpen, FiClock, FiZap, FiAward, FiBookmark,
  FiFolder, FiCheckCircle, FiFlame, FiArrowRight, FiPlay
} from 'react-icons/fi';

export default function ReaderDashboard() {
  const [profile, setProfile] = useState(null);
  const [continueReading, setContinueReading] = useState([]);
  const [collections, setCollections] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReaderData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, continueRes, collectionsRes, pathsRes] = await Promise.all([
        apiService.get('/api/reader/profile').catch(() => null),
        apiService.get('/api/reader/continue-reading').catch(() => null),
        apiService.get('/api/reader/collections').catch(() => null),
        apiService.get('/api/reader/learning-paths').catch(() => null),
      ]);

      if (profileRes?.data) setProfile(profileRes.data);
      if (continueRes?.data) setContinueReading(continueRes.data);
      if (collectionsRes?.data) setCollections(collectionsRes.data);
      if (pathsRes?.data) setLearningPaths(pathsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReaderData();
  }, [fetchReaderData]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
        Loading Reader Dashboard...
      </div>
    );
  }

  const goal = profile?.readingGoal || { articlesPerWeekTarget: 5, articlesReadThisWeek: 0 };
  const goalProgress = Math.min(Math.round((goal.articlesReadThisWeek / (goal.articlesPerWeekTarget || 1)) * 100), 100);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Header & Streak Card */}
      <div style={{ background: 'var(--panel, #1f2022)', borderRadius: 16, border: '1px solid var(--line, #333)', padding: '28px 32px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--cms-accent, #426c67)', fontWeight: 700 }}>STAGE 4 · READER PLATFORM</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.8rem' }}>Welcome Back, Reader</h1>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {/* Streak Badge */}
            <div style={{ background: 'var(--soft, #18191b)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--line, #333)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiFlame size={24} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted, #888)', textTransform: 'uppercase' }}>Current Streak</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile?.currentStreakDays || 0} Days</div>
              </div>
            </div>

            {/* Total Read Badge */}
            <div style={{ background: 'var(--soft, #18191b)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--line, #333)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiBookOpen size={24} style={{ color: 'var(--cms-accent, #426c67)' }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted, #888)', textTransform: 'uppercase' }}>Articles Read</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile?.totalArticlesRead || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Goal Bar */}
        <div style={{ marginTop: 24, background: 'var(--soft, #18191b)', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600 }}>
            <span>Weekly Reading Goal ({goal.articlesReadThisWeek} / {goal.articlesPerWeekTarget} articles)</span>
            <span>{goalProgress}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--line, #333)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ width: `${goalProgress}%`, height: '100%', background: 'var(--cms-accent, #426c67)', borderRadius: 100, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Continue Reading */}
          {continueReading.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPlay style={{ color: 'var(--cms-accent)' }} /> Continue Reading
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {continueReading.map((item) => (
                  <a
                    key={item._id}
                    href={`/articles/${item.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cms-accent)', fontWeight: 700 }}>{item.category || 'General'}</span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.title}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {item.progress?.completionPercent || 0}% read
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Learning Paths */}
          {learningPaths.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiZap style={{ color: '#f59e0b' }} /> Structured Learning Pathways
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {learningPaths.map((path) => (
                  <div key={path._id} style={{ background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4, color: 'var(--cms-accent)', fontWeight: 700 }}>{path.category} · {path.difficulty}</span>
                        <h4 style={{ margin: '6px 0 2px', fontSize: '1.05rem' }}>{path.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>{path.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                      {path.steps.map((step, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', background: 'var(--soft)', borderRadius: 6, fontSize: '0.78rem', flexShrink: 0 }}>
                          {idx + 1}. {step.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Achievements & Collections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Achievements */}
          <div style={{ background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 14, padding: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAward style={{ color: '#f59e0b' }} /> Badges & Achievements
            </h4>
            {profile?.achievements?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.achievements.map((badge, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--soft)', borderRadius: 8 }}>
                    <FiAward style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{badge.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                Read articles to unlock badges!
              </div>
            )}
          </div>

          {/* Collections */}
          <div style={{ background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 14, padding: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiFolder style={{ color: 'var(--cms-accent)' }} /> Collections ({collections.length})
            </h4>
            {collections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {collections.map((c) => (
                  <div key={c._id} style={{ padding: 10, background: 'var(--soft)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                    📁 {c.title} <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>({c.articles?.length || 0} items)</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                No custom collections yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
