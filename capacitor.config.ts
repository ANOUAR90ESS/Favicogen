import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The native shell.
 *
 * `webDir` is the plain Vite build, not the full `npm run build` output: that
 * one also writes `dist/server.cjs`, and the Express server has no business
 * inside an app bundle. `npm run build:web` is the script that produces this
 * directory on its own.
 *
 * `appId` is the identifier both stores key a listing to. Changing it after a
 * release starts a new app, so it is worth settling before the first upload —
 * the placeholder name in this repo does not oblige the bundle id to match it.
 */
const config: CapacitorConfig = {
  appId: 'com.favicogen.studio',
  appName: 'Logo & Favicon Studio',
  webDir: 'dist',
  android: {
    // Everything the app makes is generated locally; there is no cleartext
    // endpoint it needs, and allowing one would only widen what a network
    // attacker can reach.
    allowMixedContent: false,
  },
  ios: {
    // The web layer paints its own background, and a white scroll bounce
    // behind a dark canvas reads as a flash of broken layout.
    backgroundColor: '#0b1120',
    contentInset: 'never',
  },
};

export default config;
