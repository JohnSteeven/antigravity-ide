/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BreadcrumbEngine.jsx  —  Automatic Breadcrumb Renderer Engine
 *  MyJourney CMS  |  Phase 10: Navigation Intelligence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router';
import apiService from '../../services/apiService';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export default function BreadcrumbEngine({ className = '' }) {
  const location = useLocation();
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadBreadcrumb() {
      try {
        const res = await apiService.get(`/api/navigation/breadcrumb?path=${encodeURIComponent(location.pathname)}`);
        if (isMounted && res?.data) {
          setTrail(res.data);
        }
      } catch (err) {
        // Fallback
        const parts = location.pathname.split('/').filter(Boolean);
        const fallbackTrail = [{ title: 'Home', url: '/' }];
        let acc = '';
        parts.forEach((p) => {
          acc += `/${p}`;
          fallbackTrail.push({ title: p.replace(/[-_]+/g, ' '), url: acc });
        });
        if (isMounted) setTrail(fallbackTrail);
      }
    }
    loadBreadcrumb();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (trail.length <= 1) return null;

  return (
    <nav className={`breadcrumb-engine ${className}`} style={{ padding: '10px 0', fontSize: '0.82rem', color: '#666' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
        {trail.map((item, idx) => {
          const isLast = idx === trail.length - 1;
          return (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {idx === 0 ? (
                <Link to="/" style={{ color: 'var(--cms-accent, #426c67)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiHome /> Home
                </Link>
              ) : isLast ? (
                <span style={{ fontWeight: '600', color: '#333', textTransform: 'capitalize' }}>{item.title}</span>
              ) : (
                <Link to={item.url} style={{ color: 'var(--cms-accent, #426c67)', textDecoration: 'none', textTransform: 'capitalize' }}>
                  {item.title}
                </Link>
              )}

              {!isLast && <FiChevronRight style={{ fontSize: '0.75rem', color: '#aaa' }} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
