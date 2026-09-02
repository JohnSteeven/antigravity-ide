/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  UniversalSearchBar.jsx  —  Public Universal & AI Semantic Search Bar
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';
import { FiSearch, FiZap, FiX, FiArrowRight, FiBookOpen } from 'react-icons/fi';

export default function UniversalSearchBar() {
  const [query, setQuery] = useState('');
  const [autocomplete, setAutocomplete] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Instant autocomplete on typing
  useEffect(() => {
    if (!query || query.length < 2) {
      setAutocomplete([]);
      return;
    }

    const timer = setTimeout(() => {
      apiService
        .get(`/api/search/autocomplete?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (res?.data) setAutocomplete(res.data);
        })
        .catch(() => {});
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setIsOpen(true);

    try {
      const res = await apiService.get(`/api/search?q=${encodeURIComponent(q)}&semantic=true`);
      if (res?.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
      {/* Search Input Field */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 100, padding: '6px 16px' }}>
        <FiSearch style={{ color: 'var(--muted, #888)', marginRight: 10 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="Search articles, concepts, topics or ask a question..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink, #fff)', fontSize: '0.88rem' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); setResults(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <FiX />
          </button>
        )}
      </div>

      {/* Instant Autocomplete Dropdown */}
      {autocomplete.length > 0 && !isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9000, overflow: 'hidden' }}>
          {autocomplete.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', textDecoration: 'none', color: 'var(--ink, #fff)', fontSize: '0.85rem', borderBottom: '1px solid var(--line, #333)' }}
            >
              <span>{item.title}</span>
              <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 6px', borderRadius: 4, color: 'var(--cms-accent)' }}>{item.entityType}</span>
            </a>
          ))}
        </div>
      )}

      {/* Semantic Results Modal / Dropdown */}
      {isOpen && results && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, background: 'var(--panel, #1f2022)', border: '1px solid var(--line, #333)', borderRadius: 16, padding: 18, boxShadow: '0 15px 40px rgba(0,0,0,0.4)', zIndex: 9500, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* AI Synthesis */}
          {results.aiSynthesis && (
            <div style={{ background: 'var(--soft)', padding: 12, borderRadius: 10, border: '1px solid var(--line)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--cms-accent)', fontSize: '0.75rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiZap /> AI Semantic Answer
              </div>
              <div>{results.aiSynthesis}</div>
            </div>
          )}

          {/* Related Concepts */}
          {results.relatedConcepts?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Related Knowledge Graph Concepts</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {results.relatedConcepts.map((c, i) => (
                  <span key={i} onClick={() => handleSearch(c.label)} style={{ padding: '3px 8px', background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--cms-accent)' }}>
                    🔗 {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search Hits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Results ({results.total})</div>
            {results.results.map((res, i) => (
              <a key={i} href={res.url} style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--soft)', textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.title}</span>
                <FiArrowRight size={14} style={{ color: 'var(--muted)' }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
