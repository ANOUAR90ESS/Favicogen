import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Which route a download takes.
 *
 * This is the failure the whole native effort exists to prevent: a WebView
 * ignores `<a download>` silently, so an app build that kept the browser path
 * would show every export succeeding and produce no file at all. The test that
 * matters is not that the native path works — that needs a device — but that
 * the browser path is not taken on a device, and is still taken in a browser.
 */

const saveBlobNatively = vi.fn(
  async (_blob: Blob, _filename: string) => ({ uri: 'file:///cache/exports/x.png', shared: true })
);

vi.mock('../nativeFiles', () => ({ saveBlobNatively }));

/** Flipped per-suite to stand in for running inside the shell. */
let nativePlatform = false;
vi.mock('../nativePlatform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../nativePlatform')>()),
  isNativePlatform: () => nativePlatform,
}));

let clicks: string[];

beforeEach(() => {
  clicks = [];
  saveBlobNatively.mockClear();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicks.push(this.download);
  });
  // jsdom has no object URL support.
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => undefined,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  nativePlatform = false;
  vi.resetModules();
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('in a browser', () => {
  it('hands the file over with an anchor, as it always did', async () => {
    const { downloadBlob } = await import('../download');
    downloadBlob(new Blob(['x']), 'brand-kit.zip');
    expect(clicks).toEqual(['brand-kit.zip']);
    expect(saveBlobNatively).not.toHaveBeenCalled();
  });
});

describe('in a native shell', () => {
  beforeEach(() => {
    nativePlatform = true;
  });

  it('never clicks an anchor, because the click would do nothing', async () => {
    const { downloadBlob } = await import('../download');
    downloadBlob(new Blob(['x']), 'brand-kit.zip');
    await flush();
    expect(clicks).toEqual([]);
    expect(saveBlobNatively).toHaveBeenCalledTimes(1);
    expect(saveBlobNatively.mock.calls[0][1]).toBe('brand-kit.zip');
  });

  it('reports the save, so a dismissed share sheet is not silence', async () => {
    const { downloadBlob, setNativeSaveNotice } = await import('../download');
    const seen: [string, string][] = [];
    setNativeSaveNotice((filename, outcome) => seen.push([filename, outcome]));

    downloadBlob(new Blob(['x']), 'icon.png');
    await flush();
    expect(seen).toEqual([['icon.png', 'shared']]);
  });

  it('still reports when the save itself fails, rather than failing silently', async () => {
    saveBlobNatively.mockRejectedValueOnce(new Error('no space left on device'));
    const { downloadBlob, setNativeSaveNotice } = await import('../download');
    const seen: [string, string][] = [];
    setNativeSaveNotice((filename, outcome) => seen.push([filename, outcome]));

    downloadBlob(new Blob(['x']), 'icon.png');
    await flush();
    // Not a quiet "saved": nothing was written, and saying otherwise would
    // announce a file the user cannot find.
    expect(seen).toEqual([['icon.png', 'failed']]);
  });
});

describe('a bridge that never answers', () => {
  beforeEach(() => {
    nativePlatform = true;
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('reports a failure rather than leaving the user with nothing', async () => {
    // A plugin missing from a build leaves the promise pending forever, and a
    // pending promise shows nothing at all — the silence this path exists to
    // remove.
    saveBlobNatively.mockImplementationOnce(() => new Promise(() => {}));
    const { downloadBlob, setNativeSaveNotice } = await import('../download');
    const seen: [string, string][] = [];
    setNativeSaveNotice((filename, outcome) => seen.push([filename, outcome]));

    downloadBlob(new Blob(['x']), 'stuck.zip');
    await vi.advanceTimersByTimeAsync(21_000);
    expect(seen).toEqual([['stuck.zip', 'failed']]);
  });
});
