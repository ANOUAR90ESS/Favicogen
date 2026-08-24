import { describe, expect, it } from 'vitest';
import { sanitizeSvgDocument, sanitizeSvgMarkup } from '../svgSanitizer';

/**
 * These cover the boundary that stops a shared project file from running code
 * in the app's origin. A regression here is a security regression, so the
 * cases are written as "this exact payload must not survive".
 */
describe('sanitizeSvgMarkup', () => {
  const payloads: Array<[string, string]> = [
    ['inline event handler', '<image href="x" onerror="window.pwned=1" />'],
    ['script element', '<script>window.pwned=1</script><circle cx="5" cy="5" r="4"/>'],
    ['foreignObject escape', '<foreignObject><img src=x onerror="window.pwned=1"></foreignObject>'],
    ['animation setting a handler', '<set attributeName="onload" to="window.pwned=1"/>'],
    ['javascript: link', '<a href="javascript:window.pwned=1"><rect width="9" height="9"/></a>'],
    ['external xlink reference', '<use xlink:href="https://evil.test/x.svg#a"/>'],
    ['style with a remote url()', '<rect style="fill:url(https://evil.test/t.png)" width="9" height="9"/>'],
    ['handler on an allowed element', '<circle cx="5" cy="5" r="4" onmouseover="window.pwned=1"/>'],
    ['data: URL in a paint attribute', '<rect fill="url(data:text/html,<script>x</script>)" width="9" height="9"/>'],
    ['nested svg with onload', '<svg onload="window.pwned=1"><rect width="9" height="9"/></svg>'],
  ];

  it.each(payloads)('strips %s', (_name, payload) => {
    const clean = sanitizeSvgMarkup(payload);
    expect(clean).not.toMatch(/on[a-z]+\s*=/i);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).not.toMatch(/evil\.test/i);
  });

  it('keeps legitimate icon markup intact', () => {
    const clean = sanitizeSvgMarkup(
      '<path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" stroke="#333" stroke-width="2"/>'
    );
    expect(clean).toContain('<path');
    expect(clean).toContain('d="M12 2L2 7l10 5 10-5-10-5z"');
    expect(clean).toContain('fill="currentColor"');
    expect(clean).toContain('stroke-width="2"');
  });

  it('keeps a same-document url(#id) reference', () => {
    const clean = sanitizeSvgMarkup(
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs>' +
        '<rect width="10" height="10" fill="url(#g)"/>'
    );
    expect(clean).toContain('url(#g)');
    expect(clean).toContain('linearGradient');
  });

  it('returns an empty string for input it cannot parse', () => {
    expect(sanitizeSvgMarkup('<svg><unclosed>')).toBe('');
    expect(sanitizeSvgMarkup('')).toBe('');
    expect(sanitizeSvgMarkup(null as unknown as string)).toBe('');
  });
});

describe('sanitizeSvgDocument', () => {
  it('returns a complete svg element with its namespace', () => {
    const clean = sanitizeSvgDocument(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="1" cy="1" r="1"/></svg>'
    );
    expect(clean).toMatch(/^<svg/);
    expect(clean).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(clean).toContain('viewBox="0 0 24 24"');
  });

  it('strips handlers from the root element too', () => {
    const clean = sanitizeSvgDocument(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="window.pwned=1"><circle r="1"/></svg>'
    );
    expect(clean).not.toContain('onload');
    expect(clean).toContain('<circle');
  });

  it('rejects a non-svg root', () => {
    expect(sanitizeSvgDocument('<html><body>hi</body></html>')).toBe('');
  });
});
