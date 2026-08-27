import { expect, test } from '@playwright/test';
import {
  downloadBytes,
  enterStudio,
  waitForCachedTypeface,
  waitForSavedProject,
} from './helpers';

/**
 * Losing the network must not lose the tool.
 *
 * Everything the studio does it does locally, so this is a promise the code
 * can actually keep — and a service worker is the kind of thing that stops
 * working quietly. Nothing about a missing one is an error: the app simply
 * goes back to needing a connection, and no one notices until someone is on a
 * plane.
 */

test('the worker takes control, and the app survives losing the network', async ({
  page,
  context,
}) => {
  await enterStudio(page);

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          await navigator.serviceWorker.ready;
          return Boolean(navigator.serviceWorker.controller);
        }),
      { timeout: 30_000 }
    )
    .toBe(true);

  // The reload has to have something to come back to. A first run is decided
  // by whether work is saved, and the save is debounced — reloading before it
  // lands shows the first-run screen and reads as an app that did not survive.
  await waitForSavedProject(page);

  await context.setOffline(true);
  await page.reload();

  // Not merely a page that loads: the studio, drawing.
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();
});

test('an export made offline still carries its typeface', async ({ page, context }) => {
  // The subtlest version of this failure: the export succeeds, the file opens,
  // and the typeface is gone. The stylesheet is precached; the subsets are
  // pulled into the worker's cache by the studio itself, because a worker
  // claims a page too late to have seen that page load its own fonts.
  await enterStudio(page);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          await navigator.serviceWorker.ready;
          return Boolean(navigator.serviceWorker.controller);
        }),
      { timeout: 30_000 }
    )
    .toBe(true);

  await waitForSavedProject(page);
  // The bytes have to be in the worker's cache before the network goes, or the
  // export has nothing to embed and says nothing about it.
  await waitForCachedTypeface(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export SVG/i }).first().click(),
  ]);

  const svg = (await downloadBytes(download)).toString('utf8');
  expect(svg).toContain('data:font/woff2;base64,');
  expect(svg).not.toContain('fonts.gstatic.com');
});

test('the build stays installable', async ({ page, request }) => {
  // A manifest and a worker with a fetch handler are the two halves of it.
  await page.goto('/studio');

  const manifestHref = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.start_url).toBeTruthy();
  expect(manifest.display).toBe('standalone');

  const sizes = (manifest.icons as { sizes: string }[]).map((icon) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');

  expect((await request.get('/sw.js')).status()).toBe(200);
});

test('a typeface chosen after the network is gone still reaches the file', async ({
  page,
  context,
}) => {
  // The gap the previous test does not cover. What the artwork already uses is
  // cached because the page drew it; a family the visitor has not picked yet is
  // not, and picking one offline used to export a file that had quietly fallen
  // back to a system face. Precaching all sixty-three subsets would close it by
  // doubling the install. Opening the list is the moment that says which of
  // them is about to matter, and it nearly always happens with a connection.
  await enterStudio(page);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          await navigator.serviceWorker.ready;
          return Boolean(navigator.serviceWorker.controller);
        }),
      { timeout: 30_000 }
    )
    .toBe(true);
  await waitForSavedProject(page);

  await page.getByRole('button', { name: 'Text', exact: true }).click();
  const picker = page.locator('select').first();
  await picker.focus();

  // The alternatives, in the worker's cache — asserted, not waited out.
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          for (const name of await caches.keys()) {
            const cache = await caches.open(name);
            for (const request of await cache.keys()) {
              if (/montserrat.*\.woff2$/.test(request.url)) return true;
            }
          }
          return false;
        }),
      { timeout: 20_000 }
    )
    .toBe(true);

  await context.setOffline(true);

  // Now choose a typeface this session has never drawn with.
  await picker.selectOption('Montserrat');
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toContainText(
    /\S/
  );

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export SVG/i }).first().click(),
  ]);

  const svg = (await downloadBytes(download)).toString('utf8');
  expect(svg).toContain('Montserrat');
  expect(svg, 'the newly chosen typeface is named but not carried').toContain(
    'data:font/woff2;base64,'
  );
});
