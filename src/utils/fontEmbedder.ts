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
 * The typefaces are served from this app, not from Google. They used to be
 * fetched from fonts.gstatic.com at the moment of export, which meant an
 * export made offline, inside the native app, or from a network that blocks
 * Google lost its typeface — and lost it silently, because this layer is
 * best-effort by design: it returns the SVG untouched rather than failing. A
 * successful export with the wrong font is worse than a failed one, so the
 * bytes now ship with the app.
 *
 * `scripts/fetch-fonts.mjs` produces `public/fonts/`. Re-run it to update.
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

/**
 * The bundled stylesheet, relative to the app's base so it resolves the same
 * in a browser tab and inside the native shell, where the origin is
 * `capacitor://localhost` and an absolute `/fonts/...` would still be wrong if
 * the app were ever served from a sub-path.
 */
const FONT_STYLESHEET_URL = new URL('fonts/fonts.css', document.baseURI).href;

/** Parsed subsets per family, from the bundled stylesheet. */
const familyBlocksCache = new Map<string, FontFaceBlock[]>();
/** The one in-flight stylesheet request, shared by concurrent exports. */
let stylesheetRequest: Promise<Map<string, FontFaceBlock[]>> | null = null;
/** Downloaded font binaries as data URIs, keyed by their resolved URL. */
const fontDataUriCache = new Map<string, string>();

/** Families that failed to resolve — never retried within a session. */
const failedFamilies = new Set<string>();

interface FontFaceBlock {
  css: string;
  /** Absolute URL of the .woff2, resolved against the stylesheet. */
  url: string;
  unicodeRanges: Array<[number, number]>;
  weight: number;
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

/**
 * The weights the markup actually paints.
 *
 * A family is served at up to seven weights and a logo uses one or two. Every
 * weight of every needed subset used to be embedded — thirteen faces and
 * 398 KB for artwork that asked for 500 and 800 — which is the difference
 * between an SVG someone can put on a website and one they cannot.
 *
 * Text with no explicit weight inherits the CSS default, so 400 is added
 * whenever the markup contains an unweighted run.
 */
function extractWeights(svg: string): number[] {
  const weights = new Set<number>();

  for (const match of svg.matchAll(/font-weight="(\d+)"/g)) {
    weights.add(Number(match[1]));
  }

  for (const element of svg.matchAll(/<text\b[^>]*>/g)) {
    if (!/font-weight=/.test(element[0])) {
      weights.add(400);
      break;
    }
  }

  // Nothing recognisable: embed the regular face rather than no face at all.
  if (weights.size === 0) weights.add(400);
  return [...weights];
}

/**
 * The faces to embed for one weight the artwork asks for.
 *
 * A family may not ship the exact weight — the nearest one it does ship is
 * what a browser would pick, and dropping the run entirely would silently
 * lose its typeface, which is the failure this whole module exists to avoid.
 */
function nearestWeight(available: number[], wanted: number): number {
  return available.reduce((best, candidate) =>
    Math.abs(candidate - wanted) < Math.abs(best - wanted) ? candidate : best
  );
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

/**
 * Splits the bundled stylesheet into `@font-face` blocks, grouped by family.
 *
 * One sheet holds every family, so it is parsed once and indexed rather than
 * re-fetched per family the way the remote endpoint required.
 */
function parseFontFaceBlocks(css: string, baseUrl: string): Map<string, FontFaceBlock[]> {
  const byFamily = new Map<string, FontFaceBlock[]>();
  const blockPattern = /@font-face\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(css)) !== null) {
    const body = match[1];

    const urlMatch = body.match(/src:\s*url\(([^)]+)\)/);
    const familyMatch = body.match(/font-family:\s*['"]?([^'";]+?)['"]?\s*;/);
    if (!urlMatch || !familyMatch) continue;

    const known = KNOWN_FAMILY_LOOKUP.get(familyMatch[1].trim().toLowerCase());
    if (!known) continue;

    const rangeMatch = body.match(/unicode-range:\s*([^;]+);/);
    const rawUrl = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');

    const weightMatch = body.match(/font-weight:\s*(\d+)/);

    const block: FontFaceBlock = {
      css: body,
      url: new URL(rawUrl, baseUrl).href,
      unicodeRanges: rangeMatch ? parseUnicodeRanges(rangeMatch[1]) : [],
      weight: weightMatch ? Number(weightMatch[1]) : 400,
    };

    byFamily.set(known, [...(byFamily.get(known) ?? []), block]);
  }

  return byFamily;
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
 * Loads and indexes the bundled stylesheet, once per session.
 *
 * Only the stylesheet is read here, not the binaries: which subsets an export
 * needs depends on the text being rendered, and that differs every time.
 */
async function loadStylesheet(): Promise<Map<string, FontFaceBlock[]>> {
  stylesheetRequest ??= (async () => {
    const response = await fetch(FONT_STYLESHEET_URL);
    if (!response.ok) throw new Error(`Stylesheet request failed with ${response.status}`);

    const byFamily = parseFontFaceBlocks(await response.text(), FONT_STYLESHEET_URL);
    if (byFamily.size === 0) throw new Error('No @font-face blocks in the bundled stylesheet');

    for (const [family, blocks] of byFamily) familyBlocksCache.set(family, blocks);
    return byFamily;
  })();

  try {
    return await stylesheetRequest;
  } catch (err) {
    // A failed parse must not poison the session: the next export retries.
    stylesheetRequest = null;
    throw err;
  }
}

async function resolveFamilyBlocks(family: string): Promise<FontFaceBlock[]> {
  const cached = familyBlocksCache.get(family);
  if (cached) return cached;

  const blocks = (await loadStylesheet()).get(family);
  if (!blocks || blocks.length === 0) {
    throw new Error(`The bundled stylesheet has no faces for "${family}"`);
  }
  return blocks;
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

  const wantedWeights = extractWeights(svg);

  const rules: string[] = [];

  await Promise.all(
    families.map(async (family) => {
      try {
        const blocks = await resolveFamilyBlocks(family);

        const available = [...new Set(blocks.map((block) => block.weight))];
        const keep = new Set(wantedWeights.map((wanted) => nearestWeight(available, wanted)));

        const needed = blocks.filter(
          (block) => keep.has(block.weight) && textNeedsRanges(text, block.unicodeRanges)
        );

        await Promise.all(
          needed.map(async (block) => {
            const dataUri = await fetchFontAsDataUri(block.url);
            rules.push(
              `@font-face{${block.css.replace(
                /src:\s*url\([^)]+\)/,
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
  stylesheetRequest = null;
  failedFamilies.clear();
}

/** Exported for unit tests. */
export const __internals = {
  extractFamilies,
  extractRenderedText,
  extractWeights,
  nearestWeight,
  parseUnicodeRanges,
  textNeedsRanges,
  parseFontFaceBlocks,
};
