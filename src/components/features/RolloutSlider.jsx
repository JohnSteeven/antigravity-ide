/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RolloutSlider.jsx  —  Percentage Rollout Range Slider
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';

export default function RolloutSlider({ initialValue = 100, onChange }) {
  const [val, setVal] = useState(initialValue);

  const handleChange = (e) => {
    const newVal = Number(e.target.value);
    setVal(newVal);
    if (onChange) onChange(newVal);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted, #666)' }}>
        <span>Percentage Rollout</span>
        <strong style={{ color: 'var(--color-ink, #222)' }}>{val}%</strong>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={val}
        onChange={handleChange}
        style={{
          width: '100%',
          accentColor: 'var(--cms-accent, #426c67)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
