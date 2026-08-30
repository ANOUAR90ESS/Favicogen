import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { downloadBytes, enterStudio, pngColourType } from './helpers';

/**
 * The audit, run on a real archive.
 *
 * These checks exist because I ran them by hand on somebody else's asset
 * package, listed what was wrong with it, and then found this app failing three
 * of the same checks. Reviewing another product is not a substitute for
 * measuring your own, so the audit lives here now and runs on every push.
 *
 * The brand name is deliberately long. Every one of these defects is invisible
 * at "Vertex" and obvious at "International Business Machines", which is
 * exactly why they shipped.
 */

const LONG_NAME = 'International Business Machines';

/** One package, generated once, shared by every check below. */
async function buildPackage(page: import('@playwright/test').Page) {
  await enterStudio(page);
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByPlaceholder(/brand name/i).fill(LONG_NAME);

  await page.locator('#btn-brand-package').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-generate-brand-package').click(),
  ]);

  return JSZip.loadAsync(await downloadBytes(download));
}

test('the archive holds no path twice', async ({ page }) => {
  // A ZIP can carry the same path more than once. Unpacking then depends on
  // which entry the extractor happens to keep, and the two are not the same
  // file — three iOS icons arrived this way in the package that prompted this.
  const zip = await buildPackage(page);
  const names = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name);

  expect(names).toHaveLength(new Set(names).size);
});

test('no store upload carries an alpha channel', async ({ page }) => {
  // Apple's rule is about the *channel*, not the pixels: an icon whose pixels
  // are all opaque is still rejected while the file has one, and
  // `canvas.toBlob` writes one every time. This is the check that made the app
  // encode those two files by hand.
  const zip = await buildPackage(page);

  for (const path of [
    'ios/AppIcon.appiconset/icon-1024.png',
    'google-play/feature-graphic-1024x500.png',
  ]) {
    const entry = zip.file(path);
    expect(entry, `${path} is missing`).not.toBeNull();

    const bytes = await entry!.async('nodebuffer');
    expect(pngColourType(bytes), `${path} still has an alpha channel`).toBe(2);
  }
});

test('the width estimate is never smaller than the real one', async ({ page }) => {
  /*
   * The guarantee the whole fix rests on.
   *
   * The generator builds a string, so it cannot ask a browser how wide text
   * will be; it estimates from per-character advances and shrinks the font
   * until the estimate fits. That is only safe in one direction — an estimate
   * *below* the truth puts the wordmark back off the edge — so what is checked
   * here is exactly that: against the real bundled fonts, in a real browser,
   * the estimate must never come in under `measureText`.
   *
   * I first wrote this as a pixel check on the exported icons, counting light
   * pixels in the outermost columns. It failed on a file whose text was
   * perfectly inside: the icon's own rim highlight is white too, and no
   * threshold separates a rim from a letter. Measuring the property directly
   * beats guessing at it from pixels.
   */
  await enterStudio(page);
  await page.waitForFunction(() => document.fonts.status === 'loaded');

  const worst = await page.evaluate(
    async ({ samples, families, sizes }) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // The same table the generator uses, inlined: the test must not import
      // the implementation it is checking against real metrics.
      const HEAVY = new Set([...'mwM@%']);
      const advance = (c: string) =>
        c === 'W' ? 1.18
          : HEAVY.has(c) ? 1.08
          : /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(c) ? 1.25
          : /[A-Z0-9]/.test(c) ? 0.87
          : /[a-z]/.test(c) ? 0.72
          : 0.6;

      let worstRatio = Infinity;
      let worstCase = '';

      for (const family of families) {
        for (const size of sizes) {
          await document.fonts.load(`700 ${size}px ${family}`);
          ctx.font = `700 ${size}px ${family}, sans-serif`;

          for (const text of samples) {
            const real = ctx.measureText(text).width;
            if (real <= 0) continue;

            let ems = 0;
            for (const ch of text) ems += advance(ch);
            const estimated = ems * size;

            const ratio = estimated / real;
            if (ratio < worstRatio) {
              worstRatio = ratio;
              worstCase = `${family} ${size}px "${text}" est=${estimated.toFixed(1)} real=${real.toFixed(1)}`;
            }
          }
        }
      }
      return { worstRatio, worstCase };
    },
    {
      samples: [
        'Vertex',
        'International Business Machines',
        'MMMMMMMMMM',
        'illillillil',
        'Meridian Solutions Group',
        'WWW WWW WWW',
        'شركة النهضة العالمية',
        'AaBbCcDdEeFfGgHhIiJjKk',
      ],
      families: ['Cairo', 'Montserrat', 'Playfair Display', 'Outfit'],
      sizes: [16, 42, 110],
    }
  );

  // A ratio below 1 means the estimate came in under the truth for that case,
  // which is the one direction that puts a wordmark off the canvas.
  expect(worst.worstRatio, `estimate under-measured: ${worst.worstCase}`).toBeGreaterThanOrEqual(1);
});

test('the web manifest is one a browser will install', async ({ page }) => {
  // start_url is a Chrome installability requirement. Without it the file is
  // valid JSON, looks complete, and the install prompt never appears.
  const zip = await buildPackage(page);

  const entry = zip.file('website/site.webmanifest');
  expect(entry, 'the manifest is missing').not.toBeNull();

  const manifest = JSON.parse(await entry!.async('string'));

  expect(manifest.start_url, 'no start_url: the site cannot be installed').toBeTruthy();
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toBe(LONG_NAME);

  const sizes = (manifest.icons as { sizes: string }[]).map((icon) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
});

test('every brand variant is a different file', async ({ page }) => {
  // Five names over four assets is a package that promises variety it does not
  // have — "white" and "monochrome" were byte-identical in the package that
  // prompted this audit.
  const zip = await buildPackage(page);

  const variants = Object.values(zip.files).filter(
    (entry) => !entry.dir && entry.name.startsWith('brand/') && entry.name.endsWith('.png')
  );
  expect(variants.length).toBeGreaterThan(2);

  const seen = new Map<string, string>();
  for (const entry of variants) {
    const bytes = await entry.async('nodebuffer');
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha1').update(bytes).digest('hex');

    expect(seen.get(hash), `${entry.name} is byte-identical to ${seen.get(hash)}`).toBeUndefined();
    seen.set(hash, entry.name);
  }
});
