/**
 * @hq:context Extract the JSON result from a drive run whose stdout also carries progress lines.
 * @hq:owner atlas
 * @hq:task VC-14
 * @hq:invariant a stdout with no JSON object is an error, never an empty result.
 */
// `studio drive` writes human progress lines ("tab …", "sent via enter") before its JSON result.
// A bare JSON.parse of the whole stream therefore failed on every noisy run, which the channel
// reported as an empty reply. This extracts the object instead of assuming a clean stream.

/** Return the parsed result object, or throw when stdout carries none. */
export function extractDriveJson(stdout) {
  const raw = String(stdout ?? '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('DRIVE_OUTPUT_NO_JSON');
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('DRIVE_OUTPUT_INVALID_JSON');
  }
}
