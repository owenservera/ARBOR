// Transport-neutral browser adapter for ACTUAL native GPUI PNG frames.
// No DOM product components, Host effects, authentication or transport are defined here.
const MAX_BYTES = 4 * 1024 * 1024;
const PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const validInt = (x) => Number.isSafeInteger(x) && x >= 0;
export function validateGpuiFrame(frame, previous = null) {
  if (!frame || frame.kind !== 'vivim.gpui.pixels/1' ||
      typeof frame.session !== 'string' || !/^[a-f0-9]{32}$/.test(frame.session) ||
      !validInt(frame.revision) || frame.revision === 0 ||
      !validInt(frame.width) || frame.width < 240 || frame.width > 4096 ||
      !validInt(frame.height) || frame.height < 240 || frame.height > 4096 ||
      !(frame.png instanceof Uint8Array) || frame.png.length < 24 || frame.png.length > MAX_BYTES ||
      !PNG.every((byte, i) => frame.png[i] === byte)) throw new Error('INVALID_GPUI_FRAME');
  const view = new DataView(frame.png.buffer, frame.png.byteOffset, frame.png.byteLength);
  if (view.getUint32(12) !== 0x49484452 || view.getUint32(16) !== frame.width ||
      view.getUint32(20) !== frame.height) throw new Error('INVALID_GPUI_PNG_DIMENSIONS');
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
