import { isNativePlatform } from './nativePlatform';

/**
 * Where the API lives, which is not the same question in a tab and in an app.
 *
 * In a browser the app is served by the same Express process that owns
 * `/api`, so a relative path is right and needs no configuration. A native
 * shell has no server behind it at all: its origin is `capacitor://localhost`
 * on iOS and `http://localhost` on Android, and a relative `/api/ai/...`
 * resolves to a host that does not exist. The request fails with a network
 * error that says nothing about the actual cause.
 *
 * So a native build has to be told where the deployed server is, at build
 * time, through `VITE_API_BASE_URL`. When it is not set the app says the AI
 * features are unavailable, which is true, rather than letting the user press
 * a button that can only fail.
 */

const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

/** The base every API call is resolved against. Empty means same origin. */
export function apiBase(): string {
  return configuredBase;
}

/**
 * True when API calls can reach a server. Always true on the web, where the
 * server is the thing that served the page.
 */
export function hasApiBackend(): boolean {
  return !isNativePlatform() || configuredBase.length > 0;
}

/**
 * Resolves an API path for the current platform.
 *
 * Takes the same `/api/...` paths the web code already uses, so a call site
 * reads the same in both builds.
 */
export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${configuredBase}${suffix}`;
}
