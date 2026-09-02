/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EnvironmentSelector.jsx  —  Environment Selector Tags
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

const ALL_ENVS = ['development', 'staging', 'production'];

export default function EnvironmentSelector({ selected = [], onChange, editable = false }) {
  const toggleEnv = (env) => {
    if (!editable || !onChange) return;
    if (selected.includes(env)) {
      onChange(selected.filter((e) => e !== env));
    } else {
      onChange([...selected, env]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {ALL_ENVS.map((env) => {
        const isSelected = selected.includes(env);
        return (
          <button
            key={env}
            type="button"
            onClick={() => toggleEnv(env)}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              border: isSelected ? '1px solid var(--cms-accent, #426c67)' : '1px solid var(--color-line, #ddd)',
              backgroundColor: isSelected ? 'var(--cms-accent-light, #e8f0ef)' : 'var(--color-surface, #fff)',
              color: isSelected ? 'var(--cms-accent, #426c67)' : 'var(--color-muted, #888)',
              cursor: editable ? 'pointer' : 'default',
            }}
          >
            {env}
          </button>
        );
      })}
    </div>
  );
}
