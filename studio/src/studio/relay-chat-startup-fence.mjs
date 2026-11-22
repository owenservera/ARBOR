// Capture a read-only boot watermark for the EXISTING append-only bridge queue.
// Never start an AI web worker by replaying historical queued commands. User
// messages admitted AFTER this snapshot are the only eligible dispatches.
// On malformed/corrupt journals, fail closed rather than risking a provider send.
import { existsSync, readFileSync, statSync } from 'node:fs';

const COMMAND_ID = /^cmd-[0-9a-f]{16}$/;
const MAX_JOURNAL_BYTES = 64 * 1024 * 1024;

export function snapshotRelayStartupFence(file) {
  if (typeof file !== 'string' || !file.trim()) throw new TypeError('Bridge ledger path required');
  if (!existsSync(file)) return new Set();
  const before = statSync(file);
  if (!before.isFile() || before.size > MAX_JOURNAL_BYTES)
    throw new Error('RELAY_STARTUP_FENCE_UNAVAILABLE');
  const raw = readFileSync(file, 'utf8');
  const after = statSync(file);
  // A concurrent writer during the initial scan could obscure a new or old
  // queue record. Stop instead of admitting an ambiguous startup boundary.
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs ||
      Buffer.byteLength(raw, 'utf8') !== after.size)
    throw new Error('RELAY_STARTUP_FENCE_RACED');
  if (raw && !raw.endsWith('\n'))
    throw new Error('RELAY_STARTUP_FENCE_TORN_TAIL');
  const ids = new Set();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let row;
    try { row = JSON.parse(line); }
    catch { throw new Error('RELAY_STARTUP_FENCE_CORRUPT'); }
    if (!COMMAND_ID.test(row?.id ?? ''))
      throw new Error('RELAY_STARTUP_FENCE_INVALID_ID');
    ids.add(row.id);
  }
  return ids;
}
