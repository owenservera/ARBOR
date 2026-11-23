// Transport-neutral browser adapter for ACTUAL native GPUI PNG frames.
// No DOM product components, Host effects, authentication or transport are defined here.
// Structural PNG integrity is necessary but not proof of native pixel provenance,
// successful image decoding, pairing or a live phone viewport.
const MAX_BYTES = 4 * 1024 * 1024;
const PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const validInt = (x) => Number.isSafeInteger(x) && x >= 0;

// PNG chunk CRC-32 (ISO 3309), computed over type and payload. No Node APIs:
// this same no-effect guard runs unchanged in the browser and in source tests.
const CRC_TABLE = Uint32Array.from({length: 256}, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++)
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  return crc >>> 0;
});
function chunkCrc(bytes, start, end) {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++)
    crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function wellFormedPng(bytes, view) {
  // Signature + IHDR(25) + IDAT(>=13) + IEND(12). Reject truncated
  // headers, chunk overruns, corrupt CRCs and trailing bytes.
  if (bytes.length < 58) return false;
  let at = 8;
  let first = true;
  let hasIdat = false;
  let dataBytes = 0;
  let leftIdat = false;
  while (at + 12 <= bytes.length) {
    const size = view.getUint32(at);
    const end = at + 12 + size;
    if (end > bytes.length) return false;
    const type = view.getUint32(at + 4);
    if (chunkCrc(bytes, at + 4, at + 8 + size) !== view.getUint32(at + 8 + size))
      return false;
    if (first) {
      // IHDR must be exactly 13 bytes, first, with a legal PNG color mode.
      if (type !== 0x49484452 || size !== 13) return false;
      const depth = bytes[at + 16], color = bytes[at + 17];
      const depths = {0: [1,2,4,8,16], 2: [8,16], 3: [1,2,4,8], 4: [8,16], 6: [8,16]};
      if (!depths[color]?.includes(depth) || bytes[at + 18] !== 0 ||
          bytes[at + 19] !== 0 || bytes[at + 20] > 1) return false;
      first = false;
    } else if (type === 0x49484452) {
      return false; // duplicate IHDR
    } else if (type === 0x49444154) {
      if (leftIdat) return false; // IDAT chunks must be consecutive
      hasIdat = true;
      dataBytes += size;
    } else if (type === 0x49454e44) {
      return size === 0 && hasIdat && dataBytes > 0 && end === bytes.length;
    } else if (hasIdat) {
      leftIdat = true;
    }
    at = end;
  }
  return false; // no valid terminal IEND
}
export function validateGpuiFrame(frame, previous = null) {
  if (!frame || frame.kind !== 'vivim.gpui.pixels/1' ||
      typeof frame.session !== 'string' || !/^[a-f0-9]{32}$/.test(frame.session) ||
      !validInt(frame.revision) || frame.revision === 0 ||
      !validInt(frame.width) || frame.width < 240 || frame.width > 4096 ||
      !validInt(frame.height) || frame.height < 240 || frame.height > 4096 ||
      !(frame.png instanceof Uint8Array) || frame.png.length < 33 || frame.png.length > MAX_BYTES ||
      !PNG.every((byte, i) => frame.png[i] === byte)) throw new Error('INVALID_GPUI_FRAME');
  const view = new DataView(frame.png.buffer, frame.png.byteOffset, frame.png.byteLength);
  if (view.getUint32(12) !== 0x49484452 || view.getUint32(16) !== frame.width ||
      view.getUint32(20) !== frame.height) throw new Error('INVALID_GPUI_PNG_DIMENSIONS');
  if (!wellFormedPng(frame.png, view)) throw new Error('INVALID_GPUI_PNG_STRUCTURE');
  if (previous && frame.session === previous.session && frame.revision <= previous.revision)
    throw new Error('STALE_GPUI_FRAME');
  return Object.freeze({session: frame.session, revision: frame.revision,
    width: frame.width, height: frame.height});
}
export function nativePointerFromClient(frame, bounds, clientX, clientY, sequence) {
  if (!frame || !validInt(frame.width) || !validInt(frame.height) ||
      !bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.top) ||
      !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) ||
      bounds.width <= 0 || bounds.height <= 0 || !validInt(sequence) ||
      !Number.isFinite(clientX) || !Number.isFinite(clientY)) throw new Error('INVALID_GPUI_POINTER');
  const x = (clientX - bounds.left) / bounds.width;
  const y = (clientY - bounds.top) / bounds.height;
  if (x < 0 || x >= 1 || y < 0 || y >= 1) throw new Error('OUTSIDE_GPUI_VIEWPORT');
  return Object.freeze({session: frame.session, revision: frame.revision, sequence,
    x: Math.floor(x * frame.width), y: Math.floor(y * frame.height)});
}
