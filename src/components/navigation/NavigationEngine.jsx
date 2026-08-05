/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationEngine.jsx  —  Client Navigation Renderer Engine
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Renders navigation items for any given zoneKey (primary-header, footer, etc.)
 *  Evaluates feature flags, roles, external target tabs, badges, and icons.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import apiService from '../../services/apiService';

export default function NavigationEngine({ zoneKey = 'primary-header', className = '', onItemClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTree() {
      try {
        setLoading(true);
        const res = await apiService.get(`/api/navigation?zone=${zoneKey}`);
        if (isMounted && res?.data) {
          setItems(res.data);
        }
      } catch (err) {
        console.warn(`[NavigationEngine] Failed to load zone '${zoneKey}':`, err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTree();
    return () => {
      isMounted = false;
    };
  }, [zoneKey]);

  if (loading || items.length === 0) {
    return null;
  }

  const handleLinkClick = (item) => {
    if (item._id && !item._id.startsWith('auto_')) {
      apiService.post(`/api/navigation/click/${item._id}`).catch(() => {});
    }
    if (onItemClick) onItemClick(item);
  };

  return (
    <nav className={`navigation-engine zone-${zoneKey} ${className}`}>
      <ul style={{ display: 'flex', gap: '16px', listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>
        {items.map((item) => {
          const isExternal = item.type === 'external' || !!item.externalUrl;
          const targetUrl = isExternal ? item.externalUrl : item.internalRoute || '/';

          return (
            <li key={item._id} style={{ position: 'relative' }}>
              {isExternal ? (
                <a
                  href={targetUrl}
                  target={item.target || '_blank'}
                  rel="noreferrer"
                  onClick={() => handleLinkClick(item)}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{item.title}</span>
                  {item.badge?.text && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: item.badge.color || '#2e7d5a', color: '#fff' }}>
                      {item.badge.text}
                    </span>
                  )}
                </a>
              ) : (
                <NavLink
                  to={targetUrl}
                  onClick={() => handleLinkClick(item)}
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    color: isActive ? 'var(--cms-accent, #426c67)' : 'inherit',
                    fontWeight: isActive ? '700' : '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  })}
                >
                  <span>{item.title}</span>
                  {item.badge?.text && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: item.badge.color || '#2e7d5a', color: '#fff' }}>
                      {item.badge.text}
                    </span>
                  )}
                </NavLink>
              )}

              {/* Sub-menu Dropdown */}
              {item.children?.length > 0 && (
                <ul className="nav-dropdown" style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', boxShadow: 'var(--shadow-md)', borderRadius: '6px', padding: '8px 0', minWidth: '160px', display: 'none' }}>
                  {item.children.map((child) => (
                    <li key={child._id} style={{ padding: '6px 14px' }}>
                      <NavLink to={child.internalRoute || '/'} onClick={() => handleLinkClick(child)}>
                        {child.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
