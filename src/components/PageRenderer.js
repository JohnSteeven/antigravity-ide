/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PageRenderer.js  —  Page Engine Component Renderer Pipeline
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Pipeline: Page -> Layout -> Regions -> Blocks -> Component Registry -> React Component
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import LayoutEngine from './layouts/LayoutEngine';
import { getBlock } from '../core/cmsCore';

// Built-in fallback components for core block types
const DEFAULT_BLOCK_RENDERERS = {
  hero: ({ title, subtitle, buttonText, buttonLink, image }) => (
    <section className="block-hero" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--cms-accent-light, #e8f0ef)', borderRadius: '16px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 12px' }}>{title || 'Hero Banner'}</h1>
      {subtitle && <p style={{ fontSize: '1.2rem', color: '#555', margin: '0 0 20px' }}>{subtitle}</p>}
      {buttonText && (
        <a href={buttonLink || '#'} className="primary-btn" style={{ padding: '12px 24px', textDecoration: 'none' }}>
          {buttonText}
        </a>
      )}
    </section>
  ),
  rich_text: ({ title, body }) => (
    <article className="block-rich-text" style={{ padding: '20px 0' }}>
      {title && <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{title}</h2>}
      <div style={{ lineHeight: '1.7', color: '#333' }}>{body}</div>
    </article>
  ),
  quote: ({ quote, author }) => (
    <blockquote className="block-quote" style={{ borderLeft: '4px solid var(--cms-accent, #426c67)', paddingLeft: '16px', margin: '24px 0', fontStyle: 'italic' }}>
      <p style={{ fontSize: '1.2rem', margin: '0 0 8px' }}>"{quote}"</p>
      {author && <cite style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'normal' }}>— {author}</cite>}
    </blockquote>
  ),
  cta: ({ title, subtitle, buttonText }) => (
    <section className="block-cta" style={{ background: '#2f3133', color: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 8px', color: '#fff' }}>{title || 'Call to Action'}</h2>
      {subtitle && <p style={{ color: '#ccc', margin: '0 0 20px' }}>{subtitle}</p>}
      {buttonText && <button className="primary-btn">{buttonText}</button>}
    </section>
  ),
};

export default function PageRenderer({ page }) {
  if (!page) return <div className="page-not-found">Page content unavailable.</div>;

  const layout = page.layout;
  const blocks = page.blocks || [];

  // Group blocks by layout region
  const regionBlocksMap = {};
  blocks.forEach((b) => {
    const region = b.region || 'mainContent';
    if (!regionBlocksMap[region]) regionBlocksMap[region] = [];
    regionBlocksMap[region].push(b);
  });

  // Sort blocks in each region by order
  Object.keys(regionBlocksMap).forEach((r) => {
    regionBlocksMap[r].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  const renderRegionBlocks = (regionKey) => {
    const regionBlocks = regionBlocksMap[regionKey] || [];
    return regionBlocks.map((block) => {
      const registered = getBlock(block.type);
      const Component = registered?.component || DEFAULT_BLOCK_RENDERERS[block.type];

      if (!Component) {
        return (
          <div key={block.id} style={{ padding: '16px', background: '#fff0f0', border: '1px red dashed', borderRadius: '6px' }}>
            Unregistered Block Type: <strong>{block.type}</strong>
          </div>
        );
      }

      return (
        <div key={block.id} className={`page-block block-type-${block.type}`}>
          <Component {...(block.props || {})} />
        </div>
      );
    });
  };

  return (
    <LayoutEngine
      layout={layout}
      heroContent={renderRegionBlocks('hero')}
      sidebarContent={renderRegionBlocks('leftSidebar').concat(renderRegionBlocks('rightSidebar'))}
      footerContent={renderRegionBlocks('bottomSection')}
    >
      {renderRegionBlocks('mainContent')}
    </LayoutEngine>
  );
}
