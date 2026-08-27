import { expect, type Download, type Page } from '@playwright/test';

/**
 * Shared moves, so a test reads as what it is checking rather than as the
 * clicking that gets there.
 */

/**
 * Dismisses the first-run screen and waits for the studio to be drawing.
 *
 * `/studio` rather than `/`: the root is the public landing page now, and a
 * returning visitor is bounced from it to here. Going straight to the studio is
 * what an installed app and the native shell both do.
 */
export async function enterStudio(page: Page): Promise<void> {
  await page.goto('/studio');
  await page.getByRole('button', { name: /design one from scratch/i }).click();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();
}

/** The live artwork, rasterised in the page and read back as pixels. */
export async function rasterizeCanvas(page: Page, size = 512) {
  return page.evaluate(async (px) => {
    const svg = document.querySelector('#logo-svg-canvas-container svg.artboard-svg');
    if (!svg) throw new Error('no canvas on the page');

    const markup = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('the artwork would not rasterise'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no 2d context');
    context.drawImage(img, 0, 0, px, px);

    const data = context.getImageData(0, 0, px, px).data;
    let opaque = 0;
    let black = 0;
    const colours = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue;
      opaque += 1;
      if (data[i] < 12 && data[i + 1] < 12 && data[i + 2] < 12) black += 1;
      const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
      colours.set(key, (colours.get(key) ?? 0) + 1);
    }

    return {
      opaque,
      black,
      corner: [data[0], data[1], data[2], data[3]] as number[],
      distinctColours: colours.size,
    };
  }, size);
}

/** A PNG's real dimensions, straight out of its IHDR. */
export function pngSize(bytes: Buffer): { width: number; height: number } {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('not a PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** Reads a download into memory without leaving a file behind. */
export async function downloadBytes(download: Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error(`download ${download.suggestedFilename()} produced no file`);
  const { readFile } = await import('node:fs/promises');
  return readFile(path);
}

/**
 * The brand name as it currently sits in storage.
 *
 * The auto-save is debounced, so a test that reloads immediately after typing
 * is racing it — and work that never reached storage is work the next visit
 * cannot restore, which is the thing worth asserting. The project lives in
 * IndexedDB rather than localStorage; reading the real store is the only way
 * to know it arrived.
 */
export async function savedBrandName(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase | null>((resolve) => {
      const request = indexedDB.open('logo_studio', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onupgradeneeded = () => resolve(null);
    });
    if (!db) return null;

    try {
      return await new Promise<string | null>((resolve) => {
        const read = db
          .transaction('keyval', 'readonly')
          .objectStore('keyval')
          .get('logo_studio_current_project');
        read.onsuccess = () => resolve((read.result as { text?: string } | undefined)?.text ?? null);
        read.onerror = () => resolve(null);
      });
    } finally {
      db.close();
    }
  });
}

/**
 * Waits until there is a project in storage to come back to.
 *
 * What decides a first run is whether any work is saved, and the auto-save is
 * debounced — so a test that reloads too early lands on the first-run screen
 * rather than the studio, and reads as a broken app when nothing is broken.
 */
export async function waitForSavedProject(page: Page): Promise<void> {
  await expect.poll(() => savedBrandName(page), { timeout: 15_000 }).not.toBeNull();
}

/**
 * Waits until a typeface is in the service worker's cache.
 *
 * This is the precondition every offline export rests on, and the one that was
 * silently missing: a worker claims a page only after that page has already
 * fetched its fonts, so a first visit left the cache empty and the app warms
 * it deliberately instead. Asserting the cache rather than waiting a while
 * also stops the browser's own HTTP cache from quietly standing in — which is
 * exactly how this passed on one machine and failed on another.
 */
export async function waitForCachedTypeface(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          for (const name of await caches.keys()) {
            const cache = await caches.open(name);
            for (const request of await cache.keys()) {
              if (request.url.endsWith('.woff2')) return true;
            }
          }
          return false;
        }),
      { timeout: 20_000 }
    )
    .toBe(true);
}
