/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CommunityFeed.jsx  —  Reader Community Feed & Timeline Component
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import {
  FiUsers, FiMessageSquare, FiAward, FiStar,
  FiZap, FiThumbsUp, FiCheckCircle, FiClock
} from 'react-icons/fi';

export default function CommunityFeed() {
  const [feed, setFeed] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      const [feedRes, repRes] = await Promise.all([
        apiService.get('/api/community/feed'),
        apiService.get('/api/community/reputation').catch(() => null),
      ]);

      if (feedRes?.data) setFeed(feedRes.data);
      if (repRes?.data) setReputation(repRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading Community Feed...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 960 }}>
      {/* Community Header & Reputation Banner */}
      <div style={{ background: 'var(--panel, #1f2022)', borderRadius: 16, border: '1px solid var(--line, #333)', padding: 28, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--cms-accent, #426c67)', fontWeight: 700 }}>COMMUNITY</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.6rem' }}>Community Timeline & Discussions</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--soft, #18191b)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--line, #333)' }}>
            <FiAward size={24} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted, #888)', textTransform: 'uppercase' }}>Reputation Rank</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{reputation?.level || 'Beginner'} ({reputation?.points || 0} pts)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Latest Published Updates</h3>

        {(feed?.timeline || []).map((art) => (
          <div key={art._id} style={{ background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 12, padding: 20 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--cms-accent, #426c67)', fontWeight: 700 }}>{art.category || 'General'} · By {art.author || 'Author'}</span>
            <h4 style={{ margin: '6px 0 4px', fontSize: '1.1rem' }}>
              <a href={`/articles/${art.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{art.title}</a>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--muted, #888)' }}>{art.description}</p>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted, #888)', display: 'flex', gap: 14 }}>
              <span>👁 {art.views || 0} views</span>
              <span>👍 {art.likes || 0} likes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
