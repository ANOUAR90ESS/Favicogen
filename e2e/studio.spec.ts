import { expect, test } from '@playwright/test';
import { enterStudio, rasterizeCanvas, savedBrandName } from './helpers';

/**
 * The studio, driven the way a visitor drives it.
 *
 * Each of these is here because the thing it checks was once broken in a way
 * that no unit test could see and nothing on screen announced.
 */

test('a first visit leads with the upload, and never interrupts saved work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /see what.s included/i })).toBeVisible();

  await page.getByRole('button', { name: /design one from scratch/i }).click();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();

  // What decides a first run is whether there is saved work, not a flag that
  // records the skip — so this makes some. A returning visitor with a project
  // must land in the studio, never back on the pitch with their work behind it.
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByPlaceholder(/brand name/i).fill('Vertex');
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toContainText('Vertex');

  // The save is debounced, so waiting for it to land is part of the check
  // rather than a delay around it: work that never reached storage is work
  // the next visit cannot restore.
  await expect.poll(() => savedBrandName(page)).toBe('Vertex');

  await page.reload();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();
  await expect(page.getByRole('button', { name: /see what.s included/i })).toHaveCount(0);
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toContainText('Vertex');
});

test('the number on the first-run screen is the number of files', async ({ page }) => {
  // It reads "See what's included — 81 files". That figure is computed from the
  // same tables the generators loop over, and package.spec.ts opens the archive
  // and counts. Here we only insist the screen commits to a real number.
  await page.goto('/');
  const label = await page.getByRole('button', { name: /see what.s included/i }).innerText();
  const promised = Number(/(\d+)/.exec(label)?.[1]);
  expect(promised).toBeGreaterThan(20);
});

test('the icon is painted in the colour that is chosen, not black', async ({ page }) => {
  // Icon markup is authored as `stroke="currentColor"`. The paint used to
  // arrive through the CSS `color` property, which takes a <color> — so a
  // gradient passed through it was invalid, ignored, and fell back to black.
  // Dual-tone is on in the default template, so every new project was black.
  await enterStudio(page);

  const painted = await rasterizeCanvas(page);
  expect(painted.opaque).toBeGreaterThan(1000);
  expect(painted.black).toBe(0);
  // A gradient rather than one flat fill.
  expect(painted.distinctColours).toBeGreaterThan(4);
});

test('the canvas keeps its transparent ground', async ({ page }) => {
  // Assets were once matted onto a white frame, which is what started all of
  // this: a logo that looked right on screen and wrong everywhere it was used.
  await enterStudio(page);
  const painted = await rasterizeCanvas(page);
  expect(painted.corner[3]).toBe(0);
});

test('the interface mirrors into Arabic', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-lang-ar').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  // Not merely flipped: actually translated.
  await expect(page.locator('body')).toContainText('شعار');
});
