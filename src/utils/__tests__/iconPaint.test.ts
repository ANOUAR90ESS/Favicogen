import { describe, expect, it } from 'vitest';
import { generateSvgString } from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { LogoConfig } from '../../types';

/**
 * The icon has to be painted the colour the user picked.
 *
 * Icon markup is authored in the lucide idiom — `stroke="currentColor"` — and
 * the paint used to arrive through the CSS `color` property. That property
 * takes a <color>; a gradient is a paint server, so `color="url(#iconGrad)"`
 * is invalid, silently ignored, and `currentColor` falls back to black.
 *
 * Dual-tone is on in the default template, so this was not an edge case: every
 * new project rendered a black icon, and the colour controls looked inert.
 * Rasterising the canvas measured 0 pixels of the chosen colour against 11,296
 * black ones.
 */

const config = (o: Partial<LogoConfig> = {}): LogoConfig => ({ ...DEFAULT_LOGO_CONFIG, ...o });

describe('the icon paint', () => {
  it('leaves no currentColor for a document to resolve', () => {
    // A raster export renders the SVG in an isolated document, where nothing
    // inherits from the page — so an unresolved currentColor is black there
    // even when the on-screen preview happens to look right.
    for (const iconGradient of [true, false]) {
      const svg = generateSvgString(config({ iconGradient }), 512);
      expect(svg).not.toContain('currentColor');
    }
  });

  it('never routes a gradient through the color property', () => {
    const svg = generateSvgString(config({ iconGradient: true }), 512);
    expect(svg).not.toMatch(/color="url\(/);
  });

  it('paints the gradient onto the icon markup itself', () => {
    const svg = generateSvgString(config({ iconGradient: true }), 512);
    const gradientId = /id="(iconGrad[^"]*)"/.exec(svg)?.[1];
    expect(gradientId).toBeTruthy();
    // referenced by the icon, not merely defined in <defs>
    const references = svg.split(`url(#${gradientId})`).length - 1;
    expect(references).toBeGreaterThan(1);
  });

  it('still sets color for a solid colour, where it is valid', () => {
    const svg = generateSvgString(config({ iconGradient: false, iconColor: '#f59e0b' }), 512);
    expect(svg).toContain('color="#f59e0b"');
    expect(svg).toContain('#f59e0b');
  });

  it('does not expand a replacement pattern hidden in a colour', () => {
    // `$&` in a naive String.replace would splice the match back in and
    // produce a broken attribute.
    const svg = generateSvgString(config({ iconGradient: false, iconColor: '$&$1' }), 512);
    expect(svg).not.toContain('currentColor');
    expect(svg).toContain('$&$1');
  });
});
