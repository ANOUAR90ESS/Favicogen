/**
 * What the app is running inside, and the one place that answers it.
 *
 * The same bundle serves a browser tab and a native shell. Almost nothing
 * needs to care — the studio, the generators and the ZIP builder are the same
 * code either way — but two things do, and both fail silently rather than
 * loudly when they get it wrong: handing the user a file, and calling the API.
 *
 * Capacitor's plugins are imported lazily on purpose. A browser visitor should
 * not download a filesystem bridge it can never use, and `import()` inside the
 * native branch keeps them out of the main chunk.
 */

import { Capacitor } from '@capacitor/core';

export type RuntimePlatform = 'web' | 'ios' | 'android';

/**
 * Asks Capacitor, rather than reading the global it installs.
 *
 * The global was the cheaper check — synchronous, no import — but it is not
 * ours: loading any plugin pulls in `@capacitor/core`, which installs its own
 * object over whatever is there. A check that can change its answer halfway
 * through a session, depending on which chunk has loaded, is the wrong thing
 * to gate file saving on. `@capacitor/core` is small and it is the one place
 * that actually knows.
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    // A half-initialised bridge is still a browser as far as we are
    // concerned, and the web path works everywhere.
    return false;
  }
}

export function currentPlatform(): RuntimePlatform {
  try {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android' ? platform : 'web';
  } catch {
    return 'web';
  }
}

/**
 * Turns a Blob into the base64 the Filesystem plugin writes.
 *
 * `FileReader` gives back a data URL, and the plugin wants the payload alone —
 * passing the whole `data:...;base64,` prefix writes a file that is corrupt in
 * a way nothing reports until someone opens it.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the generated file.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      if (!result.startsWith('data:') || comma === -1) {
        reject(new Error('Unexpected reader output while encoding the file.'));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * A file name a phone filesystem will actually accept.
 *
 * Generated names carry the brand name the user typed, which may hold a slash,
 * a colon or an emoji. On the web the browser sanitises this for us; a native
 * write just fails, or worse, escapes the directory it was given.
 */
export function safeFileName(filename: string): string {
  const cleaned = filename
    // Path separators, the characters Windows and iOS both reject, control
    // bytes, and whitespace all collapse to a single dash. The control range
    // is the point rather than an oversight: a NUL in a name truncates the
    // path a native write is given, which is how a file lands somewhere it
    // was never meant to.
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f\s]+/g, '-')
    // `..` is the traversal; a run of dots is never meaningful in a name.
    .replace(/\.{2,}/g, '.')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/[.-]+$/, '');
  return cleaned.length > 0 ? cleaned.slice(0, 120) : 'download';
}
