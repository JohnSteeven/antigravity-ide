'use strict';

const fs = require('fs');
const path = require('path');

const workspaceFile = (...parts) => path.join(__dirname, '..', '..', ...parts);

describe('StoryEngine and StoryDetail Hotfix Structural Invariants', () => {
  test('StoryEngine progressbar is accessible and has no duplicate dead code', () => {
    const engineSource = fs.readFileSync(workspaceFile('src', 'stories', 'components', 'StoryEngine.js'), 'utf8');

    // Exactly one progressbar container rendered
    expect(engineSource).toContain('role="progressbar"');
    expect(engineSource).toContain('aria-label="Story reading progress"');
    expect(engineSource).toContain('aria-valuenow=');
    expect(engineSource).toContain('aria-valuemin={0}');
    expect(engineSource).toContain('aria-valuemax={100}');

    // Obsolete duplicate aria-hidden progress element removed
    expect(engineSource).not.toContain('className="story-reader__progress" aria-hidden="true"');

    // No duplicate hasIntegratedHeader declarations
    const declarations = engineSource.match(/const\s+hasIntegratedHeader\s*=/g) || [];
    expect(declarations.length).toBe(1);
  });

  test('StoryDetail has exactly one contentType === "article" redirect branch', () => {
    const detailSource = fs.readFileSync(workspaceFile('src', 'stories', 'StoryDetail.js'), 'utf8');

    const redirectMatches = detailSource.match(/contentType\s*===\s*["']article["']/g) || [];
    expect(redirectMatches.length).toBe(1);

    // Verify clear branch structure
    expect(detailSource).toMatch(/if\s*\(response\.article\.contentType\s*===\s*["']article["']\)\s*\{\s*setRedirectToArticle\(true\);\s*return;\s*\}/);
  });
});
