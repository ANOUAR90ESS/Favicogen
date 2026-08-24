import { describe, expect, it } from 'vitest';
import { removeFlatBackgroundPixels } from '../backgroundRemover';

/**
 * The two ways this could quietly ruin someone's logo are a white glyph inside
 * a badge getting punched out, and a photo losing its sky. Both are covered
 * here, along with the halo the feathering exists to remove.
 */

interface Canvas {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function blank(width: number, height: number, rgba: [number, number, number, number]): Canvas {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { data, width, height };
}

function fill(
  c: Canvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgba: [number, number, number, number]
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * c.width + x) * 4;
      c.data[i] = rgba[0];
      c.data[i + 1] = rgba[1];
      c.data[i + 2] = rgba[2];
      c.data[i + 3] = rgba[3];
    }
  }
}

const at = (c: Canvas, x: number, y: number) => {
  const i = (y * c.width + x) * 4;
  return [c.data[i], c.data[i + 1], c.data[i + 2], c.data[i + 3]];
};

describe('removeFlatBackgroundPixels', () => {
  it('clears a flat field and leaves the subject alone', () => {
    const c = blank(32, 32, [236, 239, 243, 255]);
    fill(c, 8, 8, 24, 24, [20, 160, 150, 255]);

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    expect(r.removed).toBe(true);
    expect(r.color).toEqual([236, 239, 243]);
    expect(at(c, 0, 0)[3]).toBe(0);
    expect(at(c, 31, 31)[3]).toBe(0);
    expect(at(c, 16, 16)).toEqual([20, 160, 150, 255]);
  });

  it('keeps a light glyph that sits inside the subject', () => {
    // The case that matters: the badge is teal, the field around it and the
    // glyph inside it are the same near-white. Only the field may go.
    const c = blank(40, 40, [236, 239, 243, 255]);
    fill(c, 8, 8, 32, 32, [20, 160, 150, 255]);
    fill(c, 16, 16, 24, 24, [236, 239, 243, 255]);

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    expect(r.removed).toBe(true);
    expect(at(c, 1, 1)[3]).toBe(0);
    expect(at(c, 20, 20)).toEqual([236, 239, 243, 255]);
  });

  it('feathers the antialiased rim instead of leaving a halo', () => {
    const c = blank(32, 32, [255, 255, 255, 255]);
    fill(c, 8, 8, 24, 24, [0, 0, 0, 255]);
    // one row of half-and-half pixels, as an antialiased edge would be
    fill(c, 8, 7, 24, 8, [128, 128, 128, 255]);

    removeFlatBackgroundPixels(c.data, c.width, c.height);

    const rim = at(c, 16, 7);
    expect(rim[3]).toBeGreaterThan(0);
    expect(rim[3]).toBeLessThan(255);
    // un-mixed back towards the subject, not left as pale grey
    expect(rim[0]).toBeLessThan(128);
  });

  it('refuses when the border is not one colour', () => {
    const c = blank(32, 32, [0, 0, 0, 255]);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        fill(c, x, y, x + 1, y + 1, [(x * 7) % 256, (y * 11) % 256, (x * y) % 256, 255]);
      }
    }

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    expect(r.removed).toBe(false);
    expect(r.reason).toBe('not-flat');
    expect(at(c, 0, 0)[3]).toBe(255);
  });

  it('does nothing when the image is already transparent around the subject', () => {
    const c = blank(32, 32, [0, 0, 0, 0]);
    fill(c, 8, 8, 24, 24, [20, 160, 150, 255]);

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    expect(r.removed).toBe(false);
    expect(r.reason).toBe('already-transparent');
    expect(at(c, 16, 16)[3]).toBe(255);
  });

  it('reaches a field that wraps around a subject touching the edge', () => {
    // The reported image: the badge nearly fills the frame, so the field is a
    // thin ring rather than a wide margin.
    const c = blank(32, 32, [240, 240, 240, 255]);
    fill(c, 2, 0, 30, 32, [20, 160, 150, 255]);

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    expect(r.removed).toBe(true);
    expect(at(c, 0, 16)[3]).toBe(0);
    expect(at(c, 31, 16)[3]).toBe(0);
    expect(at(c, 16, 0)[3]).toBe(255);
  });

  it('reports the share it removed', () => {
    const c = blank(20, 20, [255, 255, 255, 255]);
    fill(c, 5, 5, 15, 15, [0, 0, 0, 255]);

    const r = removeFlatBackgroundPixels(c.data, c.width, c.height);

    // 400 pixels, 100 of them subject
    expect(r.share).toBeCloseTo(0.75, 2);
  });
});
