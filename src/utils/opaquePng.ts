/**
 * A PNG with no alpha channel at all.
 *
 * `canvas.toBlob('image/png')` always writes colour type 6 — RGBA — even when
 * every pixel is opaque. For most files that is harmless. For an app icon it is
 * not: Apple's rule is that the icon "can't be transparent nor contain an alpha
 * channel", and the channel is a property of the file, not of the pixels. An
 * icon that looks perfectly opaque still carries one, and there is no canvas
 * option that removes it.
 *
 * So this writes the PNG itself: colour type 2, truecolour, three bytes per
 * pixel and no alpha to strip. Deflate comes from `CompressionStream`, which
 * emits the zlib wrapper (RFC 1950) that PNG's IDAT expects, so there is no
 * compression library to ship.
 *
 * Callers must fall back to the canvas encoder where `CompressionStream` is
 * missing — an icon with an alpha channel is a risk, an icon that failed to
 * generate is a broken package.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** One PNG chunk: length, type, data, CRC over type+data. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);

  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);

  const forCrc = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(forCrc));

  return out;
}

/** True when this engine can deflate for us. */
export function canEncodeOpaquePng(): boolean {
  return typeof CompressionStream !== 'undefined';
}

/**
 * Encodes RGBA pixels as an opaque truecolour PNG.
 *
 * Any pixel that is not fully opaque is composited onto `background` first,
 * because dropping the alpha channel without compositing would turn a soft
 * edge into a hard one against whatever colour happened to be underneath.
 */
export async function encodeOpaquePng(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  background = '#ffffff'
): Promise<Blob> {
  const bg = parseHex(background);

  // Each row is prefixed with its filter byte; 0 means "none", which keeps this
  // simple and costs a little size that deflate largely recovers.
  const raw = new Uint8Array(height * (1 + width * 3));
  let out = 0;

  for (let y = 0; y < height; y += 1) {
    raw[out] = 0;
    out += 1;

    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3] / 255;

      if (a >= 1) {
        raw[out] = rgba[i];
        raw[out + 1] = rgba[i + 1];
        raw[out + 2] = rgba[i + 2];
      } else {
        raw[out] = Math.round(rgba[i] * a + bg[0] * (1 - a));
        raw[out + 1] = Math.round(rgba[i + 1] * a + bg[1] * (1 - a));
        raw[out + 2] = Math.round(rgba[i + 2] * a + bg[2] * (1 - a));
      }
      out += 3;
    }
  }

  const deflated = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))
    ).arrayBuffer()
  );

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2: truecolour, no alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return new Blob(
    [
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflated),
      chunk('IEND', new Uint8Array(0)),
    ],
    { type: 'image/png' }
  );
}

function parseHex(colour: string): [number, number, number] {
  const hex = colour.replace('#', '').trim();
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

  const n = parseInt(full.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
}
