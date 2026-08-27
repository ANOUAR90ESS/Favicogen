/**
 * Every platform dimension the app knows, in one table.
 *
 * These numbers come from platform documentation and they change: Android
 * adds a density, Apple collapses an asset catalogue, a network resizes its
 * cover. When they were spread across component files, updating one meant
 * hunting for it. Here a change is one line, and the generators read from it.
 *
 * Nothing in here invents a requirement. An entry exists only where the
 * platform actually specifies a size.
 */

export type AssetCategory = 'website' | 'android' | 'ios' | 'google-play' | 'brand';

export type AssetFormat = 'png' | 'svg' | 'ico' | 'webp' | 'jpeg' | 'xml' | 'json';

export interface AssetSpec {
  /** Stable id, used as a translation key suffix and a React key. */
  id: string;
  category: AssetCategory;
  /** Path inside the package, folders included. */
  path: string;
  width: number;
  height: number;
  format: AssetFormat;
  /** What it is for, in one line. Shown in the UI and written into the README. */
  purpose: string;
}

/* ── Android ──────────────────────────────────────────────────────────────
 *
 * Two icon systems live side by side. The legacy launcher icon is a plain
 * square bitmap per density. The adaptive icon (API 26+) is a foreground and
 * a background layer, each 108dp, of which the launcher may mask anything
 * outside the centre 72dp — so the mark has to sit inside that circle or it
 * gets clipped on a round-icon launcher.
 */

export interface AndroidDensity {
  /** Resource folder name, e.g. `mipmap-xhdpi`. */
  folder: string;
  /** Scale factor against mdpi's 1dp = 1px. */
  scale: number;
}

export const ANDROID_DENSITIES: AndroidDensity[] = [
  { folder: 'mipmap-mdpi', scale: 1 },
  { folder: 'mipmap-hdpi', scale: 1.5 },
  { folder: 'mipmap-xhdpi', scale: 2 },
  { folder: 'mipmap-xxhdpi', scale: 3 },
  { folder: 'mipmap-xxxhdpi', scale: 4 },
];

/** The legacy launcher icon is 48dp. */
export const ANDROID_LAUNCHER_DP = 48;
/** An adaptive icon layer is 108dp… */
export const ANDROID_ADAPTIVE_DP = 108;
/** …of which only the centre 72dp is guaranteed to survive masking. */
export const ANDROID_ADAPTIVE_SAFE_DP = 72;

/** The share of an adaptive layer the artwork may safely occupy. */
export const ANDROID_SAFE_FRACTION = ANDROID_ADAPTIVE_SAFE_DP / ANDROID_ADAPTIVE_DP;

export function androidLauncherPx(density: AndroidDensity): number {
  return Math.round(ANDROID_LAUNCHER_DP * density.scale);
}

export function androidAdaptivePx(density: AndroidDensity): number {
  return Math.round(ANDROID_ADAPTIVE_DP * density.scale);
}

/**
 * The XML that tells Android to use the two layers. Written to
 * `mipmap-anydpi-v26/`, which older devices ignore and fall back to the
 * bitmaps for.
 */
export const ANDROID_ADAPTIVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

/* ── iOS ──────────────────────────────────────────────────────────────────
 *
 * Xcode 14 and later take a single 1024×1024 and derive every other size at
 * build time. Emitting the old twenty-entry catalogue would be filling
 * folders for the sake of it, and a wrong entry there is a build error rather
 * than a nicety.
 *
 * The one hard rule: an iOS app icon may not be transparent. The renderer
 * therefore paints an opaque ground under it. A browser canvas can only write
 * RGBA, so the file still has an alpha channel — every pixel in it is 255,
 * and Xcode flattens the catalogue when it builds.
 */

export const IOS_APP_ICON_PX = 1024;

export const IOS_CONTENTS_JSON = `${JSON.stringify(
  {
    images: [
      {
        filename: 'icon-1024.png',
        idiom: 'universal',
        platform: 'ios',
        size: '1024x1024',
      },
    ],
    info: { author: 'xcode', version: 1 },
  },
  null,
  2
)}\n`;

/* ── The catalogue ────────────────────────────────────────────────────────── */

const androidSpecs = (): AssetSpec[] => {
  const specs: AssetSpec[] = [];
  for (const density of ANDROID_DENSITIES) {
    const launcher = androidLauncherPx(density);
    const adaptive = androidAdaptivePx(density);
    specs.push(
      {
        id: `android-launcher-${density.folder}`,
        category: 'android',
        path: `android/${density.folder}/ic_launcher.png`,
        width: launcher,
        height: launcher,
        format: 'png',
        purpose: 'Legacy launcher icon for this density.',
      },
      {
        id: `android-launcher-round-${density.folder}`,
        category: 'android',
        path: `android/${density.folder}/ic_launcher_round.png`,
        width: launcher,
        height: launcher,
        format: 'png',
        purpose: 'Round launcher icon, for launchers that ask for one.',
      },
      {
        id: `android-adaptive-fg-${density.folder}`,
        category: 'android',
        path: `android/${density.folder}/ic_launcher_foreground.png`,
        width: adaptive,
        height: adaptive,
        format: 'png',
        purpose: 'Adaptive icon foreground; the mark sits inside the 72dp safe circle.',
      },
      {
        id: `android-adaptive-bg-${density.folder}`,
        category: 'android',
        path: `android/${density.folder}/ic_launcher_background.png`,
        width: adaptive,
        height: adaptive,
        format: 'png',
        purpose: 'Adaptive icon background layer, full bleed.',
      }
    );
  }
  return specs;
};

export const PLATFORM_ASSETS: AssetSpec[] = [
  ...androidSpecs(),
  {
    id: 'android-adaptive-xml',
    category: 'android',
    path: 'android/mipmap-anydpi-v26/ic_launcher.xml',
    width: 0,
    height: 0,
    format: 'xml',
    purpose: 'Binds the two adaptive layers together on API 26 and above.',
  },
  {
    id: 'android-adaptive-round-xml',
    category: 'android',
    path: 'android/mipmap-anydpi-v26/ic_launcher_round.xml',
    width: 0,
    height: 0,
    format: 'xml',
    purpose: 'The same binding for the round icon.',
  },
  {
    id: 'ios-app-icon',
    category: 'ios',
    path: `ios/AppIcon.appiconset/icon-${IOS_APP_ICON_PX}.png`,
    width: IOS_APP_ICON_PX,
    height: IOS_APP_ICON_PX,
    format: 'png',
    purpose: 'The single icon Xcode 14+ derives every other iOS size from. Fully opaque.',
  },
  {
    id: 'ios-contents',
    category: 'ios',
    path: 'ios/AppIcon.appiconset/Contents.json',
    width: 0,
    height: 0,
    format: 'json',
    purpose: 'Asset catalogue manifest.',
  },
];

export function assetsFor(category: AssetCategory): AssetSpec[] {
  return PLATFORM_ASSETS.filter((spec) => spec.category === category);
}

/**
 * Wraps a finished SVG so its artwork occupies `fraction` of the canvas,
 * centred — how the adaptive foreground is kept inside the safe circle.
 */
export function insetSvg(svg: string, fraction: number): string {
  const openTagEnd = svg.indexOf('>');
  const closeTag = svg.lastIndexOf('</svg>');
  if (openTagEnd === -1 || closeTag === -1) return svg;

  const viewBox = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg);
  const w = viewBox ? Number(viewBox[1]) : 512;
  const h = viewBox ? Number(viewBox[2]) : 512;
  const offsetX = (w * (1 - fraction)) / 2;
  const offsetY = (h * (1 - fraction)) / 2;

  const open = svg.slice(0, openTagEnd + 1);
  const body = svg.slice(openTagEnd + 1, closeTag);

  return `${open}<g transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(
    2
  )}) scale(${fraction.toFixed(4)})">${body}</g></svg>`;
}
