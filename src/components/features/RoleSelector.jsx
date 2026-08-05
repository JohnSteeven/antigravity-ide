/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RoleSelector.jsx  —  Role Restriction Selector
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

const ALL_ROLES = ['admin', 'editor', 'author', 'subscriber', 'public'];

export default function RoleSelector({ selected = [], onChange, editable = false }) {
  const toggleRole = (role) => {
    if (!editable || !onChange) return;
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {ALL_ROLES.map((role) => {
        const isSelected = selected.includes(role);
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggleRole(role)}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              border: isSelected ? '1px solid var(--color-blue, #4d6478)' : '1px solid var(--color-line, #ddd)',
              backgroundColor: isSelected ? 'var(--color-info-bg, #eaf0f5)' : 'var(--color-surface, #fff)',
              color: isSelected ? 'var(--color-blue, #4d6478)' : 'var(--color-muted, #888)',
              cursor: editable ? 'pointer' : 'default',
            }}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
