/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DashboardWidgetContainer.jsx  —  Widget Card Wrapper Component
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMaximize2, FiMinimize2, FiSettings, FiX } from 'react-icons/fi';

export default function DashboardWidgetContainer({ title, category, size = 'medium', onRemove, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e4ded4',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
          {category && (
            <span style={{ fontSize: '0.68rem', background: '#e8f0ef', color: '#426c67', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
              {category}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button type="button" className="icon-btn" style={{ padding: '4px' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FiChevronDown /> : <FiChevronUp />}
          </button>
          {onRemove && (
            <button type="button" className="icon-btn" style={{ padding: '4px', color: '#9d3e32' }} onClick={onRemove}>
              <FiX />
            </button>
          )}
        </div>
      </div>

      {!collapsed && <div>{children}</div>}
    </div>
  );
}
