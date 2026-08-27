import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      /*
       * Offline, and installable.
       *
       * Everything this app makes it makes locally — the generators, the
       * rasteriser and the ZIP builder never touch a server. Losing the
       * network was nonetheless losing the whole tool, which is a strange
       * thing for software whose entire premise is that your logo does not
       * leave your device. A manifest was already shipping; a service worker
       * with a fetch handler is the other half of what makes a page
       * installable, and it was the missing half.
       *
       * Workbox generates the precache list rather than a hand-written one:
       * the hard part of a service worker is not caching, it is knowing what
       * to throw away on the next deploy, and a stale cache that never clears
       * is the classic way to ship an app nobody can update.
       */
      VitePWA({
        registerType: 'autoUpdate',
        // The repository already owns public/manifest.json and index.html
        // links it. Generating a second one would leave two sources of truth
        // for the same thing.
        manifest: false,
        workbox: {
          // The app shell and every lazily-loaded chunk, so a modal opened
          // for the first time while offline still has code to load.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,md}'],
          // The font *subsets* are runtime-cached below instead: precaching
          // all 63 would push 1.2 MB through an install for the two or three
          // a given visitor ever renders. The stylesheet that indexes them is
          // precached, though — every export reads it to find out which
          // subsets a piece of text needs, so it is on the critical path for
          // producing a correct file rather than for drawing the page.
          globIgnores: ['**/fonts/*.woff2', '**/server.cjs*', '**/*.map'],
          navigateFallback: 'index.html',
          // The AI routes need a server by definition; answering them from a
          // cache would hand back a stale generation as if it were new.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Typefaces are content-addressed by name and never change in
              // place, so the first render of a subset is the only one that
              // needs the network. This is what lets an export keep its
              // typeface offline.
              urlPattern: ({ url }) => url.pathname.startsWith('/fonts/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'typefaces',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
          // A brand package is tens of megabytes of generated blobs; none of
          // it belongs in a cache, and the default 2 MB ceiling keeps a large
          // chunk from silently going unprecached.
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          // A service worker in dev caches the very files being edited.
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
