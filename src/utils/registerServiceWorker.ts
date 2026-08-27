import { isNativePlatform } from './nativePlatform';

/**
 * Turns the web build into something that survives losing the network.
 *
 * Every asset this app produces it produces locally: the generators, the
 * rasteriser and the ZIP builder never call a server. Before this, a visitor
 * who lost signal lost the tool anyway — which is a strange thing for software
 * whose premise is that the logo never leaves the device.
 *
 * Registration is skipped in the native shell. The APK and the IPA already
 * carry every asset in the bundle, so a worker there would cache a copy of
 * files that are on disk, and put a second, staler answer in front of them.
 */
export function registerServiceWorker(): void {
  if (isNativePlatform()) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // Registration is not urgent and competes with the first render for
  // bandwidth; the load event is late enough that it costs the user nothing.
  window.addEventListener('load', () => {
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegisterError(error: unknown) {
            // Worth knowing, never worth breaking the page for: everything the
            // studio does works without a worker.
            console.info('The offline worker could not be registered:', error);
          },
        });
      })
      .catch((error) => {
        console.info('The offline worker is unavailable in this browser:', error);
      });
  });
}
