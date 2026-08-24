import { describe, expect, it } from 'vitest';
import { parseLogoConfig, parseSavedProjectItem } from '../configSchema';
import { DEFAULT_LOGO_CONFIG } from '../templates';

describe('parseLogoConfig', () => {
  it('returns a complete config for junk input', () => {
    for (const junk of [null, undefined, 42, 'nope', [], true]) {
      const config = parseLogoConfig(junk);
      expect(typeof config.canvasSize).toBe('number');
      expect(typeof config.layout).toBe('string');
      expect(typeof config.uploadedImageFilters.brightness).toBe('number');
    }
  });

  it('drops keys it does not know about', () => {
    const config = parseLogoConfig({ evil: '<script>x</script>', alsoEvil: 1 });
    expect('evil' in config).toBe(false);
    expect('alsoEvil' in config).toBe(false);
  });

  it('sanitizes custom SVG markup', () => {
    const config = parseLogoConfig({
      customSvgString: '<image href="x" onerror="window.pwned=1"/>',
    });
    expect(config.customSvgString).not.toMatch(/onerror/i);
  });

  it('accepts only raster data URLs as image sources', () => {
    expect(parseLogoConfig({ uploadedImageSrc: 'data:image/png;base64,AAAA' }).uploadedImageSrc)
      .toBe('data:image/png;base64,AAAA');

    // An SVG data URL is a script vector; a remote URL taints the export canvas.
    expect(parseLogoConfig({ uploadedImageSrc: 'data:image/svg+xml;base64,PHN2Zz4=' }).uploadedImageSrc)
      .toBeUndefined();
    expect(parseLogoConfig({ uploadedImageSrc: 'https://evil.test/x.png' }).uploadedImageSrc)
      .toBeUndefined();
    expect(parseLogoConfig({ uploadedImageSrc: 'javascript:alert(1)' }).uploadedImageSrc)
      .toBeUndefined();
  });

  it('rejects colors that are not literal CSS colors', () => {
    expect(parseLogoConfig({ bgColor1: '#abc' }).bgColor1).toBe('#abc');
    expect(parseLogoConfig({ bgColor1: 'rgb(1,2,3)' }).bgColor1).toBe('rgb(1,2,3)');

    expect(parseLogoConfig({ bgColor1: 'url(javascript:alert(1))' }).bgColor1)
      .toBe(DEFAULT_LOGO_CONFIG.bgColor1);
    expect(parseLogoConfig({ textColor: '#fff" onload="alert(1)' }).textColor)
      .toBe(DEFAULT_LOGO_CONFIG.textColor);
  });

  it('clamps numbers to their documented range', () => {
    expect(parseLogoConfig({ fontSize: 1e9 }).fontSize).toBe(512);
    expect(parseLogoConfig({ fontSize: -50 }).fontSize).toBe(1);
    expect(parseLogoConfig({ iconOpacity: 5 }).iconOpacity).toBe(1);
    expect(parseLogoConfig({ patternOpacity: -1 }).patternOpacity).toBe(0);
  });

  it('coerces non-numeric values instead of passing them through', () => {
    const config = parseLogoConfig({ iconOpacity: 'not a number', fontSize: {} });
    expect(typeof config.iconOpacity).toBe('number');
    expect(Number.isFinite(config.fontSize)).toBe(true);
  });

  it('strips path separators from the project id', () => {
    const config = parseLogoConfig({ id: '../../etc/passwd' });
    expect(config.id).not.toContain('/');
    expect(config.id).not.toContain('.');
  });

  it('falls back to a valid enum member for an unknown value', () => {
    expect(parseLogoConfig({ layout: 'nonsense' }).layout).toBe(DEFAULT_LOGO_CONFIG.layout);
    expect(parseLogoConfig({ shapeMask: 'triangle' }).shapeMask).toBe(DEFAULT_LOGO_CONFIG.shapeMask);
    expect(parseLogoConfig({ bgType: 'hologram' }).bgType).toBe(DEFAULT_LOGO_CONFIG.bgType);
  });

  it('preserves values that are already valid', () => {
    const config = parseLogoConfig({
      text: 'Acme',
      fontSize: 48,
      layout: 'icon-left',
      showText: true,
      bgColor1: '#123456',
    });
    expect(config.text).toBe('Acme');
    expect(config.fontSize).toBe(48);
    expect(config.layout).toBe('icon-left');
    expect(config.showText).toBe(true);
    expect(config.bgColor1).toBe('#123456');
  });

  it('validates the nested watermark object', () => {
    const config = parseLogoConfig({
      watermark: {
        enabled: true,
        customImageSrc: 'https://evil.test/track.gif',
        color: 'expression(alert(1))',
        opacity: 99,
      },
    });
    expect(config.watermark?.customImageSrc).toBeUndefined();
    expect(config.watermark?.color).not.toMatch(/expression/i);
    expect(config.watermark?.opacity).toBe(1);
  });

  it('caps very long text', () => {
    expect(parseLogoConfig({ text: 'a'.repeat(5000) }).text.length).toBe(200);
  });
});

describe('parseSavedProjectItem', () => {
  it('rejects non-objects', () => {
    expect(parseSavedProjectItem(null)).toBeNull();
    expect(parseSavedProjectItem('nope')).toBeNull();
  });

  it('validates the nested config', () => {
    const item = parseSavedProjectItem({
      id: 'p1',
      name: 'Mine',
      updatedAt: 123,
      config: { fontSize: 1e9, customSvgString: '<script>x</script>' },
    });
    expect(item?.config.fontSize).toBe(512);
    expect(item?.config.customSvgString).not.toMatch(/script/i);
  });
});
