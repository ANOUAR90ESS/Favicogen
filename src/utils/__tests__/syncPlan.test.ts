import { describe, expect, it } from 'vitest';
import { configFits, detachImage, planSync, type RemoteProject } from '../syncPlan';
import type { SavedProjectItem } from '../storage';
import type { LogoConfig } from '../../types';

/**
 * The decisions syncing makes, checked without a network.
 *
 * This is the layer that can lose work. Every case below is one where getting
 * it wrong overwrites an edit someone made on their other device, which is a
 * failure they discover long after it happened and cannot undo.
 */

const localProject = (id: string, updatedAt: number, name = id): SavedProjectItem => ({
  id,
  name,
  updatedAt,
  config: { id, name, text: name, updatedAt } as unknown as LogoConfig,
});

const remoteProject = (client_id: string, updated_at: string, name = client_id): RemoteProject => ({
  client_id,
  name,
  config: { text: name },
  thumbnail_svg: null,
  image_path: null,
  updated_at,
});

describe('planSync', () => {
  it('uploads what the server has never seen', () => {
    const plan = planSync([localProject('a', 1_000_000)], []);

    expect(plan.create.map((p) => p.id)).toEqual(['a']);
    expect(plan.update).toHaveLength(0);
    expect(plan.download).toHaveLength(0);
  });

  it('downloads what this device has never seen', () => {
    const plan = planSync([], [remoteProject('b', '2026-01-01T00:00:00Z')]);

    expect(plan.download.map((p) => p.client_id)).toEqual(['b']);
    expect(plan.create).toHaveLength(0);
  });

  it('lets the newer edit win, in each direction', () => {
    const newer = Date.parse('2026-06-01T12:00:00Z');
    const older = Date.parse('2026-01-01T12:00:00Z');

    const localWins = planSync(
      [localProject('a', newer)],
      [remoteProject('a', new Date(older).toISOString())]
    );
    expect(localWins.update.map((p) => p.id)).toEqual(['a']);
    expect(localWins.download).toHaveLength(0);

    const remoteWins = planSync(
      [localProject('a', older)],
      [remoteProject('a', new Date(newer).toISOString())]
    );
    expect(remoteWins.download.map((p) => p.client_id)).toEqual(['a']);
    expect(remoteWins.update).toHaveLength(0);
  });

  it('does not write anything when both sides hold the same edit', () => {
    const when = Date.parse('2026-06-01T12:00:00Z');
    const plan = planSync(
      [localProject('a', when)],
      [remoteProject('a', new Date(when).toISOString())]
    );

    expect(plan).toMatchObject({ create: [], update: [], download: [], unchanged: 1 });
  });

  it('treats a sub-second difference as the same edit', () => {
    // Two devices never agree on the millisecond. Without this, one project
    // ping-pongs between them forever, each upload making the other stale.
    const when = Date.parse('2026-06-01T12:00:00Z');
    const plan = planSync(
      [localProject('a', when + 400)],
      [remoteProject('a', new Date(when).toISOString())]
    );

    expect(plan.unchanged).toBe(1);
    expect(plan.update).toHaveLength(0);
  });

  it('re-sends rather than overwrites when the server timestamp is unreadable', () => {
    // Neither copy is provably older, so the local one is left untouched and
    // the row is pushed — which also repairs the unusable value.
    const plan = planSync([localProject('a', 1_000_000)], [remoteProject('a', 'not a date')]);

    expect(plan.update.map((p) => p.id)).toEqual(['a']);
    expect(plan.download).toHaveLength(0);
  });

  it('handles the real shape: some new, some old, some untouched', () => {
    const t = Date.parse('2026-06-01T12:00:00Z');
    const plan = planSync(
      [
        localProject('same', t),
        localProject('local-newer', t + 60_000),
        localProject('remote-newer', t - 60_000),
        localProject('only-here', t),
      ],
      [
        remoteProject('same', new Date(t).toISOString()),
        remoteProject('local-newer', new Date(t).toISOString()),
        remoteProject('remote-newer', new Date(t).toISOString()),
        remoteProject('only-there', new Date(t).toISOString()),
      ]
    );

    expect(plan.create.map((p) => p.id)).toEqual(['only-here']);
    expect(plan.update.map((p) => p.id)).toEqual(['local-newer']);
    expect(plan.download.map((p) => p.client_id).sort()).toEqual(['only-there', 'remote-newer']);
    expect(plan.unchanged).toBe(1);
  });

  it('never lists one project in two places at once', () => {
    // A project counted as both an upload and a download would be written
    // twice in one pass, with whichever landed last silently winning.
    const t = Date.parse('2026-06-01T12:00:00Z');
    const plan = planSync(
      [localProject('a', t + 60_000), localProject('b', t - 60_000)],
      [remoteProject('a', new Date(t).toISOString()), remoteProject('b', new Date(t).toISOString())]
    );

    const touched = [
      ...plan.create.map((p) => p.id),
      ...plan.update.map((p) => p.id),
      ...plan.download.map((p) => p.client_id),
    ];
    expect(touched).toHaveLength(new Set(touched).size);
  });
});

describe('detachImage', () => {
  it('lifts a data URL out of the design', () => {
    const config = {
      id: 'a',
      text: 'Alpha',
      uploadedImageSrc: 'data:image/png;base64,AAAA',
    } as unknown as LogoConfig;

    const { config: stripped, dataUrl } = detachImage(config);

    expect(dataUrl).toBe('data:image/png;base64,AAAA');
    expect(stripped).not.toHaveProperty('uploadedImageSrc');
    expect(stripped.text).toBe('Alpha');
  });

  it('leaves a design without a bitmap alone', () => {
    const config = { id: 'a', text: 'Alpha' } as unknown as LogoConfig;
    const { config: stripped, dataUrl } = detachImage(config);

    expect(dataUrl).toBeNull();
    expect(stripped).toEqual({ id: 'a', text: 'Alpha' });
  });

  it('does not mistake a plain URL for something to upload', () => {
    // Only a data URL carries bytes. An http one is already somewhere.
    const config = {
      id: 'a',
      uploadedImageSrc: 'https://example.com/logo.png',
    } as unknown as LogoConfig;

    expect(detachImage(config).dataUrl).toBeNull();
    expect(detachImage(config).config.uploadedImageSrc).toBe('https://example.com/logo.png');
  });

  it('does not mutate the design it was handed', () => {
    const config = {
      id: 'a',
      uploadedImageSrc: 'data:image/png;base64,AAAA',
    } as unknown as LogoConfig;

    detachImage(config);
    expect(config.uploadedImageSrc).toBe('data:image/png;base64,AAAA');
  });
});

describe('configFits', () => {
  it('accepts an ordinary design', () => {
    expect(configFits({ text: 'Alpha', iconKey: 'star' })).toBe(true);
  });

  it('rejects one too large for the row', () => {
    expect(configFits({ blob: 'x'.repeat(600 * 1024) })).toBe(false);
  });

  it('measures bytes rather than characters', () => {
    // A string of Arabic is two bytes per character in UTF-8, and a length
    // check would let through nearly twice what the column accepts.
    const arabic = 'ش'.repeat(300 * 1024);
    expect(arabic.length).toBeLessThan(480 * 1024);
    expect(configFits({ text: arabic })).toBe(false);
  });

  it('refuses a design that cannot be serialised at all', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(configFits(cyclic)).toBe(false);
  });
});
