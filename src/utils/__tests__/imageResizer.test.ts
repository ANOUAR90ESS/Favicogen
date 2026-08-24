import { describe, expect, it } from 'vitest';
import { convertUnitsToPixels } from '../imageResizer';
import { formatBytes } from '../imageIntake';

describe('convertUnitsToPixels', () => {
  it('passes pixels through, rounded', () => {
    expect(convertUnitsToPixels(100, 'px')).toBe(100);
    expect(convertUnitsToPixels(100.4, 'px')).toBe(100);
    expect(convertUnitsToPixels(100.6, 'px')).toBe(101);
  });

  it('converts inches at the given DPI', () => {
    expect(convertUnitsToPixels(1, 'in', 300)).toBe(300);
    expect(convertUnitsToPixels(2, 'in', 72)).toBe(144);
  });

  it('converts centimetres', () => {
    // 1 inch = 2.54cm, so 2.54cm at 300dpi is one inch of pixels.
    expect(convertUnitsToPixels(2.54, 'cm', 300)).toBe(300);
  });

  it('converts millimetres', () => {
    expect(convertUnitsToPixels(25.4, 'mm', 300)).toBe(300);
  });

  it('defaults to 300 DPI', () => {
    expect(convertUnitsToPixels(1, 'in')).toBe(300);
  });

  it('is consistent across equivalent physical units', () => {
    const inch = convertUnitsToPixels(1, 'in', 150);
    expect(convertUnitsToPixels(2.54, 'cm', 150)).toBe(inch);
    expect(convertUnitsToPixels(25.4, 'mm', 150)).toBe(inch);
  });
});

describe('formatBytes', () => {
  it('uses MB above a megabyte and KB below', () => {
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
  });
});
