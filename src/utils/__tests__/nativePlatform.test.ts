import { afterEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { blobToBase64, currentPlatform, isNativePlatform, safeFileName } from '../nativePlatform';
import { apiUrl } from '../apiBase';

/** Stands in for the shell, since jsdom is never actually running on a phone. */
const pretendPlatform = (platform: string) => {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue(platform);
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(platform !== 'web');
};

/**
 * The native shell fails quietly when it fails at all.
 *
 * A WebView ignores `<a download>` without raising anything, a filesystem
 * write rejects a name the browser would have sanitised for us, and a relative
 * `/api` path resolves to a host that does not exist. None of it throws where
 * a developer would see it, so the parts that can be checked here are.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isNativePlatform', () => {
  it('is false in a browser, which is what jsdom is', () => {
    expect(isNativePlatform()).toBe(false);
    expect(currentPlatform()).toBe('web');
  });

  it('is true when the shell says so', () => {
    pretendPlatform('ios');
    expect(isNativePlatform()).toBe(true);
    expect(currentPlatform()).toBe('ios');
  });

  it('treats a broken bridge as a browser rather than throwing', () => {
    // A half-initialised shell must not take the whole app down on a check
    // that runs during render.
    vi.spyOn(Capacitor, 'isNativePlatform').mockImplementation(() => {
      throw new Error('bridge not ready');
    });
    vi.spyOn(Capacitor, 'getPlatform').mockImplementation(() => {
      throw new Error('bridge not ready');
    });
    expect(isNativePlatform()).toBe(false);
    expect(currentPlatform()).toBe('web');
  });

  it('does not accept a platform it does not know', () => {
    pretendPlatform('electron');
    expect(currentPlatform()).toBe('web');
  });
});

describe('safeFileName', () => {
  it('leaves a generated name alone', () => {
    expect(safeFileName('nebula_favicon_512x512.png')).toBe('nebula_favicon_512x512.png');
    expect(safeFileName('brand-kit.zip')).toBe('brand-kit.zip');
  });

  it('strips the separators that would escape the directory', () => {
    expect(safeFileName('../../etc/passwd')).not.toContain('..');
    expect(safeFileName('../../etc/passwd')).not.toContain('/');
    expect(safeFileName('a/b\\c.png')).toBe('a-b-c.png');
  });

  it('collapses whitespace, which a brand name usually has', () => {
    expect(safeFileName('My Brand  Logo.svg')).toBe('My-Brand-Logo.svg');
  });

  it('removes the characters a phone filesystem rejects', () => {
    expect(safeFileName('re:port*<v1>?.png')).toBe('re-port-v1-.png');
  });

  it('keeps non-Latin names, which are not the problem', () => {
    expect(safeFileName('شعار.png')).toBe('شعار.png');
  });

  it('never returns an empty name', () => {
    expect(safeFileName('')).toBe('download');
    expect(safeFileName('   ')).toBe('download');
    expect(safeFileName('...')).toBe('download');
    expect(safeFileName('///')).toBe('download');
  });

  it('bounds the length, because a tagline can end up in one', () => {
    expect(safeFileName('x'.repeat(400)).length).toBe(120);
  });
});

describe('blobToBase64', () => {
  it('returns the payload without the data URL prefix', async () => {
    // The prefix is the failure that writes a corrupt file nothing reports.
    const encoded = await blobToBase64(new Blob(['hello'], { type: 'text/plain' }));
    expect(encoded).not.toContain('data:');
    expect(encoded).not.toContain(',');
    expect(atob(encoded)).toBe('hello');
  });

  it('round-trips bytes that are not text', async () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    const encoded = await blobToBase64(new Blob([bytes], { type: 'application/octet-stream' }));
    const decoded = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    expect([...decoded]).toEqual([...bytes]);
  });
});

describe('apiUrl', () => {
  it('stays relative when no base is configured, which is right on the web', () => {
    // The web build is served by the process that owns /api.
    expect(apiUrl('/api/ai/generate-logo')).toBe('/api/ai/generate-logo');
  });

  it('accepts a path with or without its leading slash', () => {
    expect(apiUrl('api/health')).toBe('/api/health');
  });
});
