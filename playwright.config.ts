import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * This container ships one Chromium at a fixed path and blocks the download
 * Playwright would otherwise do for its own pinned build. CI installs a
 * matching browser through the action instead, so the path is not there and
 * Playwright uses what it downloaded.
 */
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';

/**
 * End-to-end tests, against the production build.
 *
 * The unit suite covers the pure parts — the platform tables, the planner, the
 * layout maths — and it is fast and worth having. It cannot see the failures
 * that actually shipped in this codebase, because those all lived in the seam
 * between the generators and a real browser: an icon painted black because a
 * gradient was passed through a CSS property that only takes colours; a
 * package promising eighty-two files and writing eighty-one; an export losing
 * its typeface because a font fetch failed at the moment of writing. Every one
 * of those was found by driving the app and looking at the bytes, and none of
 * it was automated. This is that, automated.
 *
 * `vite preview` rather than `vite dev`: the service worker, the chunk
 * splitting and the hashed asset names only exist in a build, and two of the
 * checks here are about exactly those.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  // Generating a full brand package rasterises around eighty images; the
  // default five seconds is not the right ceiling for that.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  // A flaky end-to-end test that is retried into green teaches nothing. If one
  // fails here it is either a real bug or a bad test, and both want fixing.
  retries: 0,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(existsSync(PREINSTALLED_CHROMIUM)
          ? { launchOptions: { executablePath: PREINSTALLED_CHROMIUM } }
          : {}),
      },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --host 127.0.0.1 --outDir dist`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
