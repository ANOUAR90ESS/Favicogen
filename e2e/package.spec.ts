import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { downloadBytes, enterStudio, pngSize } from './helpers';

/**
 * The archive, opened and counted.
 *
 * This is the app's actual product, and its failures were all of one kind:
 * files that looked fine and were not. The first-run screen promised
 * eighty-two and the ZIP held eighty-one. Every exported SVG lost its
 * typeface when the font fetch failed, and said nothing. A guide certified
 * itself against a standard nobody publishes. None of that is visible from
 * the outside — you have to open the thing.
 */

test('the package holds exactly what the screen promised, at the sizes it claims', async ({
  page,
}) => {
  await page.goto('/');
  const promised = Number(
    /(\d+)/.exec(await page.getByRole('button', { name: /see what.s included/i }).innerText())?.[1]
  );
  expect(promised).toBeGreaterThan(20);

  await page.getByRole('button', { name: /design one from scratch/i }).click();
  await page.locator('#btn-brand-package').click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-generate-brand-package').click(),
  ]);

  const zip = await JSZip.loadAsync(await downloadBytes(download));
  const files = Object.values(zip.files).filter((entry) => !entry.dir);

  // The number on the screen is computed from the same tables the generators
  // loop over. When those two drift, this is where it shows.
  expect(files).toHaveLength(promised);

  // Every raster is the size its name claims. A 512 written at 256 is a file
  // that opens fine and is wrong.
  const pngs = files.filter((entry) => entry.name.endsWith('.png'));
  expect(pngs.length).toBeGreaterThan(20);

  for (const entry of pngs) {
    const named = /(\d+)x(\d+)/.exec(entry.name.split('/').pop() ?? '');
    if (!named) continue;
    const { width, height } = pngSize(await entry.async('nodebuffer'));
    expect(
      { file: entry.name, width, height },
      `${entry.name} should be ${named[1]}x${named[2]}`
    ).toEqual({ file: entry.name, width: Number(named[1]), height: Number(named[2]) });
  }
});

test('the platform folders carry the sizes those platforms publish', async ({ page }) => {
  await enterStudio(page);
  await page.locator('#btn-brand-package').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-generate-brand-package').click(),
  ]);
  const zip = await JSZip.loadAsync(await downloadBytes(download));

  // Android's five density buckets, from a 48dp launcher icon.
  const launchers: Record<string, number> = {
    'android/mipmap-mdpi/ic_launcher.png': 48,
    'android/mipmap-hdpi/ic_launcher.png': 72,
    'android/mipmap-xhdpi/ic_launcher.png': 96,
    'android/mipmap-xxhdpi/ic_launcher.png': 144,
    'android/mipmap-xxxhdpi/ic_launcher.png': 192,
  };
  for (const [path, expected] of Object.entries(launchers)) {
    const entry = zip.file(path);
    expect(entry, `${path} is missing`).not.toBeNull();
    expect(pngSize(await entry!.async('nodebuffer'))).toEqual({
      width: expected,
      height: expected,
    });
  }

  // Apple takes one 1024, and rejects any transparency in it.
  const icon = zip.file('ios/AppIcon.appiconset/icon-1024.png');
  expect(icon, 'the iOS icon is missing').not.toBeNull();
  expect(pngSize(await icon!.async('nodebuffer'))).toEqual({ width: 1024, height: 1024 });
});

test('every exported SVG carries its typeface, rather than a name for one', async ({ page }) => {
  // The fonts used to be fetched at the moment of export. Offline, or from a
  // network that blocks Google, the fetch failed and the export succeeded
  // without its typeface: a file right on the maker's screen and wrong
  // everywhere they sent it.
  await enterStudio(page);
  await page.locator('#btn-brand-package').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-generate-brand-package').click(),
  ]);
  const zip = await JSZip.loadAsync(await downloadBytes(download));

  const svgs = Object.values(zip.files).filter((entry) => entry.name.endsWith('.svg'));
  expect(svgs.length).toBeGreaterThan(3);

  for (const entry of svgs) {
    const markup = await entry.async('string');
    if (!/font-family=/.test(markup)) continue;
    expect(markup, `${entry.name} names a typeface but embeds none`).toContain(
      'data:font/woff2;base64,'
    );
    expect(markup, `${entry.name} still reaches for Google`).not.toContain('fonts.gstatic.com');
  }
});

test('nothing in the package asserts anything about the user', async ({ page }) => {
  await enterStudio(page);
  await page.locator('#btn-brand-package').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-generate-brand-package').click(),
  ]);
  const zip = await JSZip.loadAsync(await downloadBytes(download));

  const documents = Object.values(zip.files).filter((entry) =>
    /\.(txt|md|html|json|xml)$/.test(entry.name)
  );
  expect(documents.length).toBeGreaterThan(3);

  for (const entry of documents) {
    const text = await entry.async('string');
    // A certification nobody issued once shipped in every one of these.
    expect(text, `${entry.name} claims a compliance it cannot show`).not.toMatch(/\bcompliant\b/i);
    expect(text, `${entry.name} claims a rating`).not.toMatch(/★\s*\d|\b\d\.\d\s*(rating|stars)\b/i);
    expect(text, `${entry.name} claims a download count`).not.toMatch(
      /\b\d+[KMB]\+?\s*(downloads|users|subscribers)\b/i
    );
  }
});
