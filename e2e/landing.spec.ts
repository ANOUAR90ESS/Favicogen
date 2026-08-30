import { expect, test } from '@playwright/test';
import { enterStudio, waitForSavedProject } from './helpers';

/**
 * The pages around the studio.
 *
 * Two things here are worth a test rather than a look. The first is that the
 * landing page counts files from the same tables the generators loop over — the
 * one number on this site that has already drifted from the archive once. The
 * second is what the account pages do in a build with no account service, which
 * is what this repo is by default and what every fork will be: they must say
 * so, and must not put up a password field that goes nowhere.
 */

test('the landing page states the file count the package actually holds', async ({ page }) => {
  await page.goto('/');

  const headline = page.getByRole('heading', { level: 1 });
  await expect(headline).toBeVisible();

  // The figure on the page, and the figure the studio's own screen promises.
  const marketing = Number(/(\d+)/.exec(await page.locator('body').innerText())?.[0]);
  expect(marketing).toBeGreaterThan(20);

  await page.goto('/studio');
  const promised = Number(
    /(\d+)/.exec(await page.getByRole('button', { name: /see what.s included/i }).innerText())?.[1]
  );
  expect(marketing).toBe(promised);
});

test('the landing page leads into the studio', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-marketing-start').click();

  await expect(page).toHaveURL(/\/studio$/);
  await page.getByRole('button', { name: /design one from scratch/i }).click();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();
});

test('someone with saved work is never shown the pitch instead of it', async ({ page }) => {
  // The guarantee the first-run screen already learned to keep, now that there
  // is a marketing page in front of everything: typing the bare domain after a
  // week away has to return you to your project, not to a hero section.
  await enterStudio(page);
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByPlaceholder(/brand name/i).fill('Meridian');
  await waitForSavedProject(page);

  await page.goto('/');

  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toContainText(
    'Meridian'
  );
  await expect(page).toHaveURL(/\/studio$/);
});

test('an account page with no account service says so, and asks for nothing', async ({ page }) => {
  // This build has no VITE_SUPABASE_* configured, which is the honest default
  // and the state every fork starts in. A sign-in form here would take a real
  // password and do nothing with it — the one failure mode that is worse than
  // having no sign-in at all.
  await page.goto('/signin');

  await expect(page.getByRole('alert').or(page.locator('body'))).toContainText(
    /not enabled|غير مفعّلة/i
  );
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await expect(page.locator('input[type=email]')).toHaveCount(0);
});

test('every account route is reachable as a deep link', async ({ page }) => {
  // A confirmation email links straight to one of these on a browser that has
  // never loaded the app. Without the service worker's navigation fallback and
  // the server's, that is a 404 in the middle of signing up.
  for (const path of ['/signup', '/reset-password', '/update-password', '/auth/callback']) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} did not serve the app`).toBeLessThan(400);
    await expect(page.locator('h1'), `${path} rendered nothing`).toBeVisible();
  }
});

test('the landing page mirrors into Arabic', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-lang-ar').click();

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('body')).toContainText('شعار');
});

test('an unknown address lands on the landing page rather than nothing', async ({ page }) => {
  await page.goto('/this-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('with no account service, the studio offers no sync control at all', async ({ page }) => {
  // Syncing is the reason the account layer exists, so it is also the thing
  // most likely to be advertised in a build that cannot do it. A disabled
  // button with a tooltip is still a promise; there should be nothing here.
  await page.goto('/studio');
  await page.getByRole('button', { name: /design one from scratch/i }).click();
  await expect(page.locator('#logo-svg-canvas-container svg.artboard-svg')).toBeVisible();

  await page.locator('#btn-more-menu').click();
  await page.locator('#btn-saved-projects').click();
  await expect(page.getByRole('heading', { name: /saved designs/i })).toBeVisible();

  await expect(page.locator('#btn-sync-projects')).toHaveCount(0);
  await expect(page.getByText(/sign in to sync/i)).toHaveCount(0);
});
