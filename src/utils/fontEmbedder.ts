/**
 * Embeds web fonts into a generated SVG as base64 `@font-face` rules.
 *
 * Why this exists: an SVG loaded through `new Image()` (which is how every
 * raster export works) renders inside an isolated document. That document
 * cannot reach the host page's stylesheets and cannot fetch fonts.gstatic.com,
 * so `font-family="Cairo"` silently falls back to a system face. The preview
 * on screen and the exported PNG then show two different fonts — measured at
 * 254px vs 311px for the same string.
 *
 * Embedding the font bytes directly in the markup is the only way to make the
 * SVG self-contained, and it also makes exported .svg files portable.
 *
 * Everything here is best-effort: if the network is unavailable or Google
 * Fonts changes its response shape, the original SVG is returned untouched so
 * an export never fails outright.
 */

/** Families the app offers, all served by Google Fonts. */
const KNOWN_GOOGLE_FAMILIES = [
  'Cairo',
  'Tajawal',
  'Almarai',
  'IBM Plex Sans Arabic',
  'Outfit',
  'Montserrat',
  'Playfair Display',
  'Righteous',
  'Fira Code',
];

const KNOWN_FAMILY_LOOKUP = new Map(
  KNOWN_GOOGLE_FAMILIES.map((family) => [family.toLowerCase(), family])
);

/** Weights we request. Google collapses unsupported ones to the nearest match. */
const REQUESTED_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

/** Parsed subsets per family, from the Google Fonts stylesheet. */
const familyBlocksCache = new Map<string, FontFaceBlock[]>();
/** In-flight stylesheet requests, so concurrent exports share one download. */
const inflight = new Map<string, Promise<FontFaceBlock[]>>();
/** Downloaded font binaries as data URIs, keyed by their gstatic URL. */
const fontDataUriCache = new Map<string, string>();

/** Families that failed to resolve — never retried within a session. */
const failedFamilies = new Set<string>();

interface FontFaceBlock {
  css: string;
  url: string;
  unicodeRanges: Array<[number, number]>;
}

/**
 * Pulls every `font-family` value out of the generated markup. The generator
 * always emits a quoted attribute with a comma-separated stack, and only the
 * first entry is ever a web font.
 */
function extractFamilies(svg: string): string[] {
  const found = new Set<string>();
  const attrPattern = /font-family="([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(svg)) !== null) {
    for (const rawName of match[1].split(',')) {
      const name = rawName.trim().replace(/^['"]|['"]$/g, '');
      const known = KNOWN_FAMILY_LOOKUP.get(name.toLowerCase());
      if (known) found.add(known);
    }
  }

  return [...found];
}

/**
 * Collects the text that will actually be painted, so we can drop the font
 * subsets it does not need. A logo usually needs one subset out of ten, and
 * skipping the rest keeps the embedded payload small.
 */
function extractRenderedText(svg: string): string {
  const chunks: string[] = [];
  const textPattern = /<text\b[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;

  while ((match = textPattern.exec(svg)) !== null) {
    // Strip nested markup (textPath, tspan) and decode the entities escapeXml writes.
    chunks.push(
      match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
    );
  }

  return chunks.join('');
}

/** Parses a CSS `unicode-range` value into numeric code point pairs. */
function parseUnicodeRanges(value: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  for (const part of value.split(',')) {
    const token = part.trim().replace(/^U\+/i, '');
    if (!token) continue;

    if (token.includes('-')) {
      const [from, to] = token.split('-');
      const start = parseInt(from, 16);
      const end = parseInt(to, 16);
      if (Number.isFinite(start) && Number.isFinite(end)) ranges.push([start, end]);
    } else if (token.includes('?')) {
      // Wildcard form, e.g. U+04?? covers U+0400-U+04FF.
      const start = parseInt(token.replace(/\?/g, '0'), 16);
      const end = parseInt(token.replace(/\?/g, 'F'), 16);
      if (Number.isFinite(start) && Number.isFinite(end)) ranges.push([start, end]);
    } else {
      const point = parseInt(token, 16);
      if (Number.isFinite(point)) ranges.push([point, point]);
    }
  }

  return ranges;
}

/** True when any character of `text` falls inside one of the ranges. */
function textNeedsRanges(text: string, ranges: Array<[number, number]>): boolean {
  if (ranges.length === 0) return true;

  for (const char of text) {
    const point = char.codePointAt(0);
    if (point === undefined) continue;
    for (const [start, end] of ranges) {
      if (point >= start && point <= end) return true;
    }
  }

  return false;
}

/** Splits a Google Fonts stylesheet into its individual `@font-face` blocks. */
function parseFontFaceBlocks(css: string): FontFaceBlock[] {
  const blocks: FontFaceBlock[] = [];
  const blockPattern = /@font-face\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(css)) !== null) {
    const body = match[1];
    const urlMatch = body.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    if (!urlMatch) continue;

    const rangeMatch = body.match(/unicode-range:\s*([^;]+);/);

    blocks.push({
      css: body,
      url: urlMatch[1],
      unicodeRanges: rangeMatch ? parseUnicodeRanges(rangeMatch[1]) : [],
    });
  }

  return blocks;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Chunked to stay well under the argument limit of String.fromCharCode.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function fetchFontAsDataUri(url: string): Promise<string> {
  const cached = fontDataUriCache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font request failed with ${response.status}`);

  const dataUri = `data:font/woff2;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  fontDataUriCache.set(url, dataUri);
  return dataUri;
}

/**
 * Fetches and parses the Google Fonts stylesheet for one family.
 *
 * Only the stylesheet is resolved here, not the binaries: which subsets are
 * actually needed depends on the text being rendered, and that differs per
 * export.
 */
async function resolveFamilyBlocks(family: string): Promise<FontFaceBlock[]> {
  const cached = familyBlocksCache.get(family);
  if (cached) return cached;

  const pending = inflight.get(family);
  if (pending) return pending;

  const request = (async () => {
    const url =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}` +
      `:wght@${REQUESTED_WEIGHTS.join(';')}&display=swap`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Stylesheet request failed with ${response.status}`);

    const blocks = parseFontFaceBlocks(await response.text());
    if (blocks.length === 0) throw new Error('No @font-face blocks in stylesheet');

    familyBlocksCache.set(family, blocks);
    return blocks;
  })();

  inflight.set(family, request);
  try {
    return await request;
  } finally {
    inflight.delete(family);
  }
}

/**
 * Builds a `<style>` element containing every `@font-face` the markup needs,
 * with the font binaries inlined as data URIs.
 *
 * Returns an empty string when nothing could be resolved, which leaves the
 * SVG exactly as it was.
 */
export async function buildEmbeddedFontStyle(svg: string): Promise<string> {
  const families = extractFamilies(svg).filter((family) => !failedFamilies.has(family));
  if (families.length === 0) return '';

  const text = extractRenderedText(svg);
  if (!text.trim()) return '';

  const rules: string[] = [];

  await Promise.all(
    families.map(async (family) => {
      try {
        const blocks = await resolveFamilyBlocks(family);
        const needed = blocks.filter((block) => textNeedsRanges(text, block.unicodeRanges));

        await Promise.all(
          needed.map(async (block) => {
            const dataUri = await fetchFontAsDataUri(block.url);
            rules.push(
              `@font-face{${block.css.replace(
                /src:\s*url\(https:\/\/fonts\.gstatic\.com\/[^)]+\)/,
                `src:url(${dataUri})`
              )}}`
            );
          })
        );
      } catch (err) {
        // One unavailable family must not sink the whole export.
        failedFamilies.add(family);
        console.warn(`Could not embed the "${family}" web font in the export:`, err);
      }
    })
  );

  if (rules.length === 0) return '';
  return `<style type="text/css">${rules.join('')}</style>`;
}

/**
 * Returns the SVG with its web fonts inlined, so it renders identically
 * wherever it is opened or rasterized.
 *
 * Call this on every export path. The live on-screen preview does not need it:
 * an inline SVG in the DOM already inherits the page's loaded fonts.
 */
export async function embedFontsInSvg(svg: string): Promise<string> {
  try {
    const style = await buildEmbeddedFontStyle(svg);
    if (!style) return svg;

    // Fonts must be declared inside <defs> so they resolve before first paint.
    if (svg.includes('<defs>')) {
      return svg.replace('<defs>', `<defs>${style}`);
    }

    return svg.replace(/(<svg\b[^>]*>)/, `$1<defs>${style}</defs>`);
  } catch (err) {
    console.warn('Font embedding was skipped for this export:', err);
    return svg;
  }
}

/** Test seam: clears every cache so a run starts from a known state. */
export function __resetFontEmbedderCaches(): void {
  familyBlocksCache.clear();
  fontDataUriCache.clear();
  inflight.clear();
  failedFamilies.clear();
}

/** Exported for unit tests. */
export const __internals = {
  extractFamilies,
  extractRenderedText,
  parseUnicodeRanges,
  textNeedsRanges,
  parseFontFaceBlocks,
};
