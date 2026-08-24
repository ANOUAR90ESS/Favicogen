/**
 * Makes a flat background transparent.
 *
 * Auto-trim only ever *crops* empty margins. That does nothing for the common
 * case: an icon exported from a design tool with an opaque near-white field
 * baked in behind it. The field reaches all four edges, so there is no margin
 * to cut — and every export then carries a white box that shows up the moment
 * the asset sits on anything dark.
 *
 * Two rules keep this from destroying artwork:
 *
 *  - It only removes what is connected to the border. A white glyph *inside*
 *    a coloured badge is the same colour as the field around it; a global
 *    colour match would punch it out. A flood fill inward from the edges
 *    stops at the badge and leaves the glyph alone.
 *  - It refuses when the border is not actually flat. A photo or a gradient
 *    has no single background colour, and guessing one would eat the subject.
 */

export interface BackgroundRemovalOptions {
  /** Colour distance below which a pixel is certainly background. */
  tolerance?: number;
  /**
   * Distance over which alpha ramps back to opaque. This is what removes the
   * halo: the antialiased rim of the subject is a blend of subject and
   * background, so it gets partial alpha and its colour un-mixed.
   */
  feather?: number;
}

export interface BackgroundRemovalResult {
  /** False when there was no flat background to remove — nothing was changed. */
  removed: boolean;
  /** The colour that was taken out. */
  color: [number, number, number] | null;
  /** Share of the image turned transparent, 0–1. */
  share: number;
  /** Why it declined, when it did. */
  reason?: 'already-transparent' | 'not-flat';
}

const DEFAULT_TOLERANCE = 26;
const DEFAULT_FEATHER = 26;

/**
 * How much of the border the dominant colour must cover before we believe it
 * is a matte. It cannot be near-1: on the reported image the badge runs to the
 * top and bottom edges, so the field is only a ring down the two sides.
 */
const FLATNESS_THRESHOLD = 0.3;
/** Below this, the border is mostly transparent already and there is nothing to do. */
const MIN_OPAQUE_BORDER = 0.25;

/** How far past the peak bucket a colour still counts as the same background. */
const MERGE_FACTOR = 1.5;
/** Hard ceiling on the widened tolerance, so a busy border cannot eat a subject. */
const MAX_TOLERANCE = 64;

const OPAQUE = 250;

/** Chebyshev distance: crisper than Euclidean on flat mattes, and cheaper. */
function distance(
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number
): number {
  const dr = Math.abs(data[i] - r);
  const dg = Math.abs(data[i + 1] - g);
  const db = Math.abs(data[i + 2] - b);
  return Math.max(dr, dg, db);
}

function borderIndices(width: number, height: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < width; x++) {
    out.push(x);
    if (height > 1) out.push((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    out.push(y * width);
    if (width > 1) out.push(y * width + width - 1);
  }
  return out;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

/**
 * The whole algorithm, over raw RGBA. Kept free of the DOM so it can be tested
 * without a canvas — this is the part where a regression would silently ruin
 * someone's logo.
 *
 * Mutates `data` in place.
 */
export function removeFlatBackgroundPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: BackgroundRemovalOptions = {}
): BackgroundRemovalResult {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const feather = Math.max(1, options.feather ?? DEFAULT_FEATHER);
  const total = width * height;
  if (total === 0) return { removed: false, color: null, share: 0, reason: 'already-transparent' };

  const border = borderIndices(width, height);

  // 1. Is there an opaque border at all?
  const opaqueBorder = border.filter((p) => data[p * 4 + 3] > OPAQUE);
  if (opaqueBorder.length / border.length < MIN_OPAQUE_BORDER) {
    return { removed: false, color: null, share: 0, reason: 'already-transparent' };
  }

  // 2. What colour is it, and does one colour actually dominate?
  //    A plain median would be wrong: when the subject runs to two edges, half
  //    the border is subject and the median lands between the two. Vote on
  //    coarse buckets instead — then widen, because a "flat" background rarely
  //    is: the reported image carries a soft shadow that ramps from the field
  //    down towards the badge, and the winning bucket was a slice of that ramp
  //    rather than the field itself.
  const buckets = new Map<number, number[]>();
  for (const p of opaqueBorder) {
    const i = p * 4;
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }
  let peak: number[] = [];
  for (const bucket of buckets.values()) {
    if (bucket.length > peak.length) peak = bucket;
  }
  const peakR = median(peak.map((p) => data[p * 4]));
  const peakG = median(peak.map((p) => data[p * 4 + 1]));
  const peakB = median(peak.map((p) => data[p * 4 + 2]));

  // Everything on the border close to that peak is the same background.
  const cluster = opaqueBorder.filter(
    (p) => distance(data, p * 4, peakR, peakG, peakB) <= tolerance * MERGE_FACTOR
  );
  if (cluster.length / opaqueBorder.length < FLATNESS_THRESHOLD) {
    return { removed: false, color: null, share: 0, reason: 'not-flat' };
  }

  const bgR = median(cluster.map((p) => data[p * 4]));
  const bgG = median(cluster.map((p) => data[p * 4 + 1]));
  const bgB = median(cluster.map((p) => data[p * 4 + 2]));

  // The fill has to be at least as tolerant as the background is varied,
  // or it stops halfway across its own gradient. Bounded, so a busy border
  // can never widen it into the subject.
  const spread = cluster
    .map((p) => distance(data, p * 4, bgR, bgG, bgB))
    .sort((a, b) => a - b)[Math.floor(cluster.length * 0.95)] ?? 0;
  const fillTolerance = Math.min(MAX_TOLERANCE, Math.max(tolerance, spread + 4));

  // 3. Flood fill inward, but only through pixels that certainly are the
  //    background. Anything the fill cannot reach is subject and is untouched.
  const soft = fillTolerance + feather;
  const state = new Uint8Array(total); // 0 unseen, 1 queued/cleared, 2 feathered
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBackground = (p: number) => {
    const i = p * 4;
    return data[i + 3] <= OPAQUE
      ? data[i + 3] === 0 || distance(data, i, bgR, bgG, bgB) <= fillTolerance
      : distance(data, i, bgR, bgG, bgB) <= fillTolerance;
  };

  for (const p of border) {
    if (state[p] === 0 && isBackground(p)) {
      state[p] = 1;
      queue[tail++] = p;
    }
  }

  const neighbours = (p: number, visit: (n: number) => void) => {
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (y > 0) visit(p - width);
    if (y < height - 1) visit(p + width);
  };

  let fringe: number[] = [];
  while (head < tail) {
    const p = queue[head++];
    neighbours(p, (n) => {
      if (state[n] !== 0) return;
      if (isBackground(n)) {
        state[n] = 1;
        queue[tail++] = n;
      } else {
        // The first ring of subject pixels touching the fill. Where the edge
        // is antialiased these are part background, and leaving them opaque is
        // exactly the pale halo people complain about.
        state[n] = 2;
        fringe.push(n);
      }
    });
  }

  // Antialiasing is usually one to two pixels wide, so let the rim reach one
  // pixel deeper — but no further, so it can never eat into the subject.
  const secondRing: number[] = [];
  for (const p of fringe) {
    neighbours(p, (n) => {
      if (state[n] === 0 && distance(data, n * 4, bgR, bgG, bgB) < soft) {
        state[n] = 2;
        secondRing.push(n);
      }
    });
  }
  fringe = fringe.concat(secondRing);

  // 4. Apply. Cleared pixels first, then the feathered rim.
  let cleared = 0;
  for (let p = 0; p < total; p++) {
    if (state[p] === 1) {
      data[p * 4 + 3] = 0;
      cleared++;
    }
  }

  for (const p of fringe) {
    const i = p * 4;
    const d = distance(data, i, bgR, bgG, bgB);
    // Ramp against the subject actually next to this pixel, not a fixed width:
    // a rim pixel halfway between white and a teal badge should end up half
    // transparent, and how far "halfway" is depends on the badge.
    let full = fillTolerance + feather;
    neighbours(p, (n) => {
      if (state[n] === 0) full = Math.max(full, distance(data, n * 4, bgR, bgG, bgB));
    });
    const alpha = Math.round((255 * (d - fillTolerance)) / Math.max(1, full - fillTolerance));
    if (alpha >= 255) continue;
    const a = alpha / 255;
    // Un-mix the background out of the blend, so the rim keeps the subject's
    // colour instead of a pale ghost of it.
    if (a >= 0.15) {
      data[i] = (data[i] - bgR * (1 - a)) / a;
      data[i + 1] = (data[i + 1] - bgG * (1 - a)) / a;
      data[i + 2] = (data[i + 2] - bgB * (1 - a)) / a;
    }
    data[i + 3] = Math.min(data[i + 3], alpha);
  }

  return {
    removed: cleared > 0,
    color: [bgR, bgG, bgB],
    share: cleared / total,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the image'));
    img.src = src;
  });
}

/**
 * Canvas wrapper. Returns the original data URL untouched when there was no
 * flat background to take out, so a caller can apply the result blindly.
 */
export async function removeFlatBackground(
  dataUrl: string,
  options: BackgroundRemovalOptions = {}
): Promise<{ dataUrl: string; result: BackgroundRemovalResult }> {
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { dataUrl, result: { removed: false, color: null, share: 0, reason: 'not-flat' } };
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const result = removeFlatBackgroundPixels(imageData.data, width, height, options);
  if (!result.removed) return { dataUrl, result };

  ctx.putImageData(imageData, 0, 0);
  return { dataUrl: canvas.toDataURL('image/png'), result };
}
