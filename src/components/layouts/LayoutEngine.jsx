/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LayoutEngine.jsx  —  Configuration-Driven Layout Renderer Engine
 *  MyJourney CMS  |  Phase 3: Layout Manager
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Renders pages dynamically based on Layout JSON configuration documents.
 *  Applies CSS variables (heroHeight, sidebarWidth, gap, columns, cardRadius),
 *  renders active regions (hero, mainContent, leftSidebar, rightSidebar, footer),
 *  and enforces responsive column rules.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

export default function LayoutEngine({ layout, children, heroContent, sidebarContent, footerContent }) {
  if (!layout) {
    return <div className="layout-engine-fallback">{children}</div>;
  }

  const vars = layout.cssVariables || {};
  const regions = layout.regions || {};

  const layoutStyle = {
    '--hero-height': vars.heroHeight || '420px',
    '--sidebar-width': vars.sidebarWidth || '300px',
    '--layout-gap': vars.gap || '24px',
    '--container-width': vars.containerWidth || '1200px',
    '--layout-columns': vars.columns || 3,
    '--card-radius': vars.cardRadius || '12px',
    maxWidth: vars.containerWidth || '1200px',
    margin: '0 auto',
    padding: '0 16px',
  };

  const isSplit = layout.layoutType === 'split';
  const isTimeline = layout.layoutType === 'timeline';
  const isMasonry = layout.layoutType === 'masonry';
  const hasLeftSidebar = regions.leftSidebar?.visible;
  const hasRightSidebar = regions.rightSidebar?.visible;

  return (
    <div className={`layout-engine layout-type-${layout.layoutType}`} style={layoutStyle}>
      {/* Hero Region */}
      {regions.hero?.visible && (
        <header
          className="layout-region-hero"
          style={{
            minHeight: vars.heroHeight || 'auto',
            marginBottom: vars.gap || '24px',
            background: regions.hero?.background || 'transparent',
          }}
        >
          {heroContent}
        </header>
      )}

      {/* Main Grid / Flexible Region Body */}
      <div
        className="layout-region-body"
        style={{
          display: isTimeline ? 'block' : isMasonry ? 'column' : 'grid',
          gridTemplateColumns:
            hasLeftSidebar && hasRightSidebar
              ? `${regions.leftSidebar.width || '260px'} 1fr ${regions.rightSidebar.width || '280px'}`
              : hasLeftSidebar
              ? `${regions.leftSidebar.width || '260px'} 1fr`
              : hasRightSidebar
              ? `1fr ${regions.rightSidebar.width || '300px'}`
              : isSplit
              ? '1fr 1fr'
              : '1fr',
          gap: vars.gap || '24px',
        }}
      >
        {/* Left Sidebar */}
        {hasLeftSidebar && (
          <aside className="layout-region-left-sidebar" style={{ position: regions.leftSidebar?.sticky ? 'sticky' : 'static', top: '90px' }}>
            {sidebarContent}
          </aside>
        )}

        {/* Main Content */}
        <main className="layout-region-main">{children}</main>

        {/* Right Sidebar */}
        {hasRightSidebar && (
          <aside className="layout-region-right-sidebar" style={{ position: regions.rightSidebar?.sticky ? 'sticky' : 'static', top: '90px' }}>
            {sidebarContent}
          </aside>
        )}
      </div>

      {/* Footer / Bottom Region */}
      {regions.bottomSection?.visible && (
        <footer className="layout-region-bottom" style={{ marginTop: vars.gap || '24px' }}>
          {footerContent}
        </footer>
      )}
    </div>
  );
}
