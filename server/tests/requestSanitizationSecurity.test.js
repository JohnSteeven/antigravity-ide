jest.mock('../config/env', () => ({
  nodeEnv: 'test',
  cookieSecure: false,
  csrfEnabled: false,
}));

const { sanitizeRequest } = require('../middleware/security');

const sanitizeBody = (body) => {
  const req = { body, params: {}, query: {} };
  sanitizeRequest(req, {}, jest.fn());
  return req.body;
};

describe('rich-text request sanitization', () => {
  test('removes inline CSS and untrusted iframe hosts', () => {
    const result = sanitizeBody({
      body: '<p style="position:fixed">Safe</p><iframe src="https://attacker.example/embed"></iframe>',
    });

    expect(result.body).toContain('<p>Safe</p>');
    expect(result.body).not.toContain('style=');
    expect(result.body).not.toContain('attacker.example');
  });

  test('keeps allowlisted video embeds and protects new-tab links', () => {
    const result = sanitizeBody({
      body: '<iframe src="https://www.youtube-nocookie.com/embed/abc"></iframe><a href="https://example.com" target="_blank">Open</a>',
    });

    expect(result.body).toContain('www.youtube-nocookie.com/embed/abc');
    expect(result.body).toContain('rel="noopener noreferrer"');
  });

  test('removes data URLs from images', () => {
    const result = sanitizeBody({ body: '<img src="data:image/svg+xml;base64,PHN2Zy8+" alt="bad" />' });
    expect(result.body).not.toContain('data:image');
  });

  test('sanitizes nested Story section HTML while keeping SEO text plain', () => {
    const result = sanitizeBody({
      storySections: [{
        type: 'text',
        body: '<p><strong>Kept</strong><img src="x" onerror="alert(1)"></p><script>alert(2)</script>',
      }],
      seo: { description: '<strong>Plain metadata</strong>' },
    });

    expect(result.storySections[0].body).toContain('<strong>Kept</strong>');
    expect(result.storySections[0].body).not.toContain('onerror');
    expect(result.storySections[0].body).not.toContain('<script');
    expect(result.seo.description).toBe('Plain metadata');
  });
});
