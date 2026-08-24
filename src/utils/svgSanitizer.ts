/**
 * Allow-list sanitizer for user-supplied SVG markup.
 *
 * Uploaded SVG fragments end up inside `generateSvgString()` output, which the
 * app renders through `dangerouslySetInnerHTML` in nineteen places. Anything
 * that survives this function executes in the app's origin, so the rule here
 * is deny-by-default: an element or attribute that is not explicitly listed
 * gets dropped, rather than trying to enumerate what is dangerous.
 *
 * Parsing is done by the browser's own XML parser instead of regexes —
 * a regex-based filter is trivially defeated by nesting and entity tricks.
 */

/** Drawing and structural elements an icon legitimately needs. */
const ALLOWED_ELEMENTS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'symbol',
  'use',
  'title',
  'desc',
  'pattern',
  'tspan',
  'text',
]);

/** Presentation and geometry attributes. No event handlers, no URLs. */
const ALLOWED_ATTRIBUTES = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'points', 'transform', 'viewbox', 'preserveaspectratio',
  'fill', 'fill-opacity', 'fill-rule', 'clip-rule', 'clip-path',
  'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit',
  'opacity', 'offset', 'stop-color', 'stop-opacity',
  'gradientunits', 'gradienttransform', 'patternunits', 'patterntransform',
  'clippathunits', 'maskunits', 'spreadmethod', 'fx', 'fy',
  'id', 'class', 'color', 'text-anchor', 'dominant-baseline',
  'font-size', 'font-weight', 'font-family', 'letter-spacing', 'dx', 'dy',
  // Namespace declaration, kept so a serialized document stays valid.
  'xmlns',
]);

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Attribute values that reference something outside the document. `url(#id)`
 * is fine — it points at a definition inside the same SVG. Everything else
 * (`javascript:`, `data:`, `http:`) is not.
 */
const SAFE_URL_REFERENCE = /^url\(#[A-Za-z0-9_:.-]+\)$/;

/** Attributes whose value may be a functional reference. */
const URL_VALUED_ATTRIBUTES = new Set(['fill', 'stroke', 'clip-path', 'mask', 'filter']);

function isSafeAttributeValue(name: string, value: string): boolean {
  const normalized = value.trim().toLowerCase();

  // A foreign namespace would let unlisted elements through the parser.
  if (name === 'xmlns') return normalized === SVG_NAMESPACE;

  // No attribute may smuggle a script or an external fetch.
  if (normalized.includes('javascript:') || normalized.includes('vbscript:')) return false;
  if (normalized.startsWith('data:') && !normalized.startsWith('data:image/')) return false;

  if (URL_VALUED_ATTRIBUTES.has(name) && normalized.startsWith('url(')) {
    return SAFE_URL_REFERENCE.test(value.trim());
  }

  return true;
}

/** Recursively strips anything not on the allow-list. */
function scrubElement(element: Element): void {
  // Walk a copy: removing children mutates the live list.
  for (const child of [...element.children]) {
    if (!ALLOWED_ELEMENTS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    scrubElement(child);
  }

  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase();

    // `on*` handlers, `xlink:href`, `href`, `style` (which can carry url())
    // and anything else unlisted all fall through to removal here.
    if (!ALLOWED_ATTRIBUTES.has(name) || !isSafeAttributeValue(name, attr.value)) {
      element.removeAttribute(attr.name);
    }
  }
}

/**
 * Returns the inner markup of an uploaded SVG with every scriptable construct
 * removed. Returns an empty string when the input cannot be parsed or nothing
 * survives — the caller should treat that as "no icon".
 */
export function sanitizeSvgMarkup(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  // Wrap fragments so the parser always sees a well-formed root.
  const source = /<svg[\s>]/i.test(rawSvg)
    ? rawSvg
    : `<svg xmlns="http://www.w3.org/2000/svg">${rawSvg}</svg>`;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  } catch {
    return '';
  }

  // A parse error yields a <parsererror> document rather than throwing.
  if (doc.querySelector('parsererror')) return '';

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') return '';

  scrubElement(root);

  return root.innerHTML.trim();
}

/**
 * Same allow-list, but returns a complete `<svg>` document rather than its
 * inner markup. Used for cached thumbnails, which are inserted into the page
 * as whole documents.
 */
export function sanitizeSvgDocument(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  } catch {
    return '';
  }

  if (doc.querySelector('parsererror')) return '';

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') return '';

  // scrubElement cleans the root's own attributes as well as its subtree.
  scrubElement(root);

  return new XMLSerializer().serializeToString(root);
}
