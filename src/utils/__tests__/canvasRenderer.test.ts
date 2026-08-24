import { describe, expect, it } from 'vitest';
import {
  createIcoFile,
  escapeXml,
  generateSvgString,
  generateWebmanifestJson,
  getShapePathD,
} from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { LogoConfig } from '../../types';

const config = (overrides: Partial<LogoConfig> = {}): LogoConfig => ({
  ...DEFAULT_LOGO_CONFIG,
  ...overrides,
});

describe('escapeXml', () => {
  it('escapes the five XML metacharacters', () => {
    expect(escapeXml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;'
    );
  });

  it('escapes ampersands before the other entities, not after', () => {
    // Getting this order wrong yields &amp;lt; for a literal '<'.
    expect(escapeXml('&<')).toBe('&amp;&lt;');
  });

  it('handles nullish input', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(0)).toBe('0');
  });
});

describe('generateSvgString', () => {
  it('escapes brand text so it cannot break out of the markup', () => {
    const svg = generateSvgString(config({ text: '</text><script>x</script>', showText: true }));
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;/text&gt;');
  });

  it('gives every render a unique set of ids', () => {
    // Two renders of one config used to emit identical ids, so whichever
    // landed second in the document silently borrowed the first's gradients.
    const shared = config({ id: 'proj_same', pattern: 'dots', bgType: 'linear' });
    const first = generateSvgString(shared, 100);
    const second = generateSvgString(shared, 100);

    const idsOf = (svg: string) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const a = idsOf(first);
    const b = idsOf(second);

    expect(a.length).toBeGreaterThan(0);
    expect(a).toHaveLength(b.length);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });

  it('namespaces pattern ids, which used to be fixed strings', () => {
    const svg = generateSvgString(config({ pattern: 'dots' }), 100);
    expect(svg).not.toContain('id="pattern_dots"');
    expect(svg).toMatch(/id="pattern_dots_[^"]+"/);
  });

  it('points every url(#…) reference at an id the same document defines', () => {
    const svg = generateSvgString(
      config({ pattern: 'grid', bgType: 'linear', showText: true, text: 'Acme', iconShadow: true }),
      256
    );
    const defined = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const referenced = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const ref of referenced) {
      expect(defined.has(ref)).toBe(true);
    }
  });

  it('emits a well-formed svg root at the requested size', () => {
    const svg = generateSvgString(config(), 128);
    expect(svg).toMatch(/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('width="128"');
    expect(svg).toContain('height="128"');
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('parses as valid XML', () => {
    const svg = generateSvgString(
      config({ showText: true, text: 'Brand & Co', showTagline: true, tagline: '<taste>' }),
      256
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
  });
});

describe('getShapePathD', () => {
  it('returns a path for every supported mask', () => {
    for (const shape of ['square', 'squircle', 'circle', 'shield', 'hexagon', 'octagon', 'diamond', 'badge', 'pill'] as const) {
      const d = getShapePathD(shape, 512, 48).trim();
      expect(d.length).toBeGreaterThan(0);
      // A path must open with a moveto command.
      expect(d).toMatch(/^[Mm]/);
      // And must not contain NaN from a bad size calculation.
      expect(d).not.toMatch(/NaN|undefined/);
    }
  });
});

describe('createIcoFile', () => {
  const png = (bytes: number) => new Blob([new Uint8Array(bytes).fill(0x89)], { type: 'image/png' });

  it('writes a valid ICO header and directory', async () => {
    const blob = await createIcoFile([
      { size: 16, blob: png(100) },
      { size: 32, blob: png(200) },
    ]);
    const view = new DataView(await blob.arrayBuffer());

    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type: icon
    expect(view.getUint16(4, true)).toBe(2); // image count

    // First directory entry.
    expect(view.getUint8(6)).toBe(16); // width
    expect(view.getUint8(7)).toBe(16); // height
    expect(view.getUint16(12, true)).toBe(32); // bits per pixel
    expect(view.getUint32(14, true)).toBe(100); // byte length
    expect(view.getUint32(18, true)).toBe(6 + 16 * 2); // offset past the directory
  });

  it('encodes 256px as 0, per the ICO spec', async () => {
    const blob = await createIcoFile([{ size: 256, blob: png(50) }]);
    const view = new DataView(await blob.arrayBuffer());
    expect(view.getUint8(6)).toBe(0);
    expect(view.getUint8(7)).toBe(0);
  });

  it('lays entries out back to back with no gaps or overlap', async () => {
    const sizes = [10, 20, 30];
    const blob = await createIcoFile(sizes.map((n, i) => ({ size: 16 << i, blob: png(n) })));
    const view = new DataView(await blob.arrayBuffer());

    let expectedOffset = 6 + 16 * sizes.length;
    for (let i = 0; i < sizes.length; i++) {
      const entry = 6 + i * 16;
      expect(view.getUint32(entry + 8, true)).toBe(sizes[i]);
      expect(view.getUint32(entry + 12, true)).toBe(expectedOffset);
      expectedOffset += sizes[i];
    }
    expect(blob.size).toBe(expectedOffset);
  });
});

describe('generateWebmanifestJson', () => {
  it('produces parseable JSON with the expected icon sizes', () => {
    const manifest = JSON.parse(generateWebmanifestJson('Acme', '#123456'));
    expect(manifest.name).toBe('Acme');
    expect(manifest.theme_color).toBe('#123456');
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
  });
});
