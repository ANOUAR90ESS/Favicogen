import { FAVICON_SPECS, JPEG_EXPORT_SIZES, SOCIAL_MEDIA_PRESETS } from './canvasRenderer';
import { BRAND_VARIANT_IDS } from './brandVariants';
import { assetsFor } from './platformAssets';

/**
 * What the user is asked to choose between, and what each choice costs.
 *
 * The counts here are computed from the same tables the generators read, not
 * written down beside them. A hard-coded "12 assets" drifts the moment a size
 * is added, and a count that disagrees with the ZIP is a small lie the user
 * finds out about at the worst moment.
 */

export type PackageCategory = 'website' | 'android' | 'ios' | 'google-play' | 'social' | 'brand';

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  'website',
  'android',
  'ios',
  'google-play',
  'social',
  'brand',
];

/**
 * favicon.svg, favicon.ico, site.webmanifest, browserconfig.xml, the HTML
 * snippet, and the guide the website builder writes beside them.
 */
const WEBSITE_FIXED_FILES = 6;
/** Both a PNG and a JPG of the feature graphic. */
const PLAY_STORE_FILES = 2;
/** Each brand variant ships as an SVG and a PNG. */
const BRAND_FORMATS_PER_VARIANT = 2;
/** The social builder adds a 1:1 vector master, a 16:9 master, and a guide. */
const SOCIAL_EXTRA_FILES = 3;
/** The package's own README, written at the root whatever was selected. */
export const PACKAGE_README_FILES = 1;

/** How many files a category actually writes into the package. */
export function countAssets(category: PackageCategory): number {
  switch (category) {
    case 'website':
      // PNG and WebP at every favicon size; JPEG only at the three sizes it
      // is any use at.
      return FAVICON_SPECS.length * 2 + JPEG_EXPORT_SIZES.length + WEBSITE_FIXED_FILES;
    case 'android':
      return assetsFor('android').length;
    case 'ios':
      return assetsFor('ios').length;
    case 'google-play':
      return PLAY_STORE_FILES;
    case 'social':
      return SOCIAL_MEDIA_PRESETS.length + SOCIAL_EXTRA_FILES;
    case 'brand':
      return BRAND_VARIANT_IDS.length * BRAND_FORMATS_PER_VARIANT;
  }
}

/** Everything that ends up in the archive, the package's own README included. */
export function countSelected(categories: PackageCategory[]): number {
  if (categories.length === 0) return 0;
  return (
    categories.reduce((total, category) => total + countAssets(category), 0) +
    PACKAGE_README_FILES
  );
}

/* ── Presets ──────────────────────────────────────────────────────────────
 *
 * Each is a starting point, not a lock: picking one selects its categories
 * and the user can then add or drop any of them. "Custom" is what any edited
 * selection becomes, rather than a preset of its own.
 */

export type PresetId =
  | 'website-starter'
  | 'app-developer'
  | 'social-kit'
  | 'brand-kit'
  | 'everything';

export interface PackagePreset {
  id: PresetId;
  categories: PackageCategory[];
}

export const PACKAGE_PRESETS: PackagePreset[] = [
  { id: 'website-starter', categories: ['website'] },
  { id: 'app-developer', categories: ['android', 'ios', 'google-play'] },
  { id: 'social-kit', categories: ['social'] },
  { id: 'brand-kit', categories: ['brand'] },
  { id: 'everything', categories: [...PACKAGE_CATEGORIES] },
];

const sameSet = (a: PackageCategory[], b: PackageCategory[]): boolean =>
  a.length === b.length && a.every((item) => b.includes(item));

/** The preset a selection corresponds to, or null when it is a custom mix. */
export function matchPreset(categories: PackageCategory[]): PresetId | null {
  return PACKAGE_PRESETS.find((preset) => sameSet(preset.categories, categories))?.id ?? null;
}

/** Toggling a category off is allowed down to — but not past — one. */
export function toggleCategory(
  categories: PackageCategory[],
  category: PackageCategory
): PackageCategory[] {
  if (!categories.includes(category)) {
    // Keep the canonical order rather than the click order, so the summary
    // below the picker does not reshuffle as the user changes their mind.
    return PACKAGE_CATEGORIES.filter((c) => c === category || categories.includes(c));
  }
  const next = categories.filter((c) => c !== category);
  return next.length === 0 ? categories : next;
}

/* ── Progress ─────────────────────────────────────────────────────────────── */

/** The steps a generation run reports, in the order they happen. */
export type PackageStep = PackageCategory | 'zip';

export function stepsFor(categories: PackageCategory[]): PackageStep[] {
  return [...PACKAGE_CATEGORIES.filter((c) => categories.includes(c)), 'zip'];
}

export type StepState = 'pending' | 'running' | 'done';
