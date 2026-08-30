/**
 * Making sure a name fits on the canvas it is drawn on.
 *
 * Without this the generator used whatever font size the controls held, however
 * long the name was — so "International Business Machines" at the default 42px
 * rendered as "ernational Business Machi", cut off at both edges, in the App
 * Store icon, the PWA icon and the master brand PNG. Nothing reported it. The
 * files opened, looked deliberate, and were wrong.
 *
 * SVG has no way to ask "how wide will this be" from a string builder, and the
 * generator has to work in a worker, in a test and in a browser alike. So the
 * width is estimated from per-character advances instead — deliberately on the
 * generous side, because over-estimating shrinks the text slightly more than
 * needed while under-estimating puts it back off the edge.
 */

/**
 * Advance width per character, in ems, at weight 700.
 *
 * Measured, not guessed. My first attempt at this table was written from
 * intuition and an end-to-end test caught it under-measuring "WWW WWW WWW" in
 * Montserrat by 20% — which is the one direction that puts the wordmark back
 * off the canvas. These are the *widest* advances across all nine bundled
 * families, rounded up, so the estimate is safe whichever one is selected.
 *
 * Two of them are worth knowing about. Fira Code is monospaced, so every
 * character in it is 0.6em and that becomes the floor for even the narrowest
 * letter. And Arabic reaches 1.22em, wider than a Latin capital, because the
 * families differ most there.
 *
 * To regenerate: measure `ctx.measureText(char).width / size` at
 * `700 <size>px <family>` for each bundled family and take the maximum.
 */
const ADVANCE_WIDE = 1.18; // W
const ADVANCE_HEAVY = 1.08; // m w M @ %
const ADVANCE_ARABIC = 1.25;
const ADVANCE_CAPITAL = 0.87; // O and Q are the widest at 0.844
const ADVANCE_LOWER = 0.72; // g is the widest at 0.700
const ADVANCE_BASE = 0.6; // the monospaced floor, and every narrow glyph

const HEAVY = new Set([...'mwMW@%']);
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const CAPITAL_OR_DIGIT = /[A-Z0-9]/;
const LOWERCASE = /[a-z]/;

function advance(char: string): number {
  if (char === 'W') return ADVANCE_WIDE;
  if (HEAVY.has(char)) return ADVANCE_HEAVY;
  if (ARABIC.test(char)) return ADVANCE_ARABIC;
  if (CAPITAL_OR_DIGIT.test(char)) return ADVANCE_CAPITAL;
  if (LOWERCASE.test(char)) return ADVANCE_LOWER;
  // Punctuation, spaces and anything unrecognised. Never below the monospaced
  // floor, because Fira Code makes even a full stop 0.6em wide.
  return ADVANCE_BASE;
}

/**
 * How wide `text` will be at `fontSize`, including the gaps letter-spacing adds.
 *
 * Letter-spacing is applied after every character including the last in SVG, so
 * it is counted that way here rather than as `length - 1` gaps.
 */
export function estimateTextWidth(text: string, fontSize: number, letterSpacing = 0): number {
  if (!text) return 0;

  let ems = 0;
  for (const char of text) ems += advance(char);

  return ems * fontSize + letterSpacing * [...text].length;
}

/**
 * The largest size at or below `requested` that keeps `text` inside `maxWidth`.
 *
 * Returns `requested` untouched when it already fits, so a short name is drawn
 * exactly as the controls say and only an overflowing one is touched. The floor
 * stops a pathological string from shrinking the wordmark into an illegible
 * smear: past that point the design needs a shorter name, not a smaller font,
 * and the caller can say so.
 */
export function fitFontSize(
  text: string,
  requested: number,
  maxWidth: number,
  letterSpacing = 0,
  minimum = 8
): number {
  if (!text || requested <= 0 || maxWidth <= 0) return requested;

  const width = estimateTextWidth(text, requested, letterSpacing);
  if (width <= maxWidth) return requested;

  // Letter-spacing does not scale with the font size, so it is removed from the
  // budget before the ratio rather than scaled by it.
  const spacingBudget = letterSpacing * [...text].length;
  const forGlyphs = Math.max(1, maxWidth - spacingBudget);
  const glyphEms = estimateTextWidth(text, 1, 0);

  const fitted = glyphEms > 0 ? forGlyphs / glyphEms : requested;

  // Floor to avoid a fractional size that rounds back up over the edge.
  return Math.max(minimum, Math.floor(Math.min(requested, fitted) * 10) / 10);
}
