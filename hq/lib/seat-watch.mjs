// @ts-check
/**
 * @hq:context Seat wake by file watcher — poll one file for a content change and wake a seat with the lines that are new
 * @hq:owner channel-manager
 * @hq:task channel-wake
 * @hq:invariant no provider send: this module reads one file and calls an injected wake; it owns no transport
 * @hq:invariant a file that blinks out mid-rewrite is not a change; only content appearing or changing wakes a seat
 * @hq:invariant a wake text never carries a credential shape: matching lines are redacted before the wake
 * @hq:see docs/AGENT-BUS.md
 * @hq:see docs/SYNC-BUS.md
 */
import { readFileSync } from 'node:fs';

export const SEAT_WATCH_SCHEMA = 'hq.seat-watch/1';

/** One poll a second: an inbox that gains a line is not urgent below that. */
export const DEFAULT_INTERVAL_MS = 1000;

/** 9m30s — longer than one provider turn, shorter than a nap, so a wait always ends. */
export const DEFAULT_TIMEOUT_MS = 570000;

/** A wake prompt names the new lines; past this count it names the overflow instead of dumping a file. */
export const MAX_WAKE_LINES = 100;

// Mirrors the credential shapes `channel-seats` refuses in a wake prompt. It is a
// copy rather than an import so this module stays a leaf: watcher in, wake out.
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bbearer\s+[A-Za-z0-9._-]{20,}/i,
  /\bapi[_-]?key\s*[:=]\s*\S{8,}/i,
  /\bpassword\s*[:=]\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

/** Redact credential shapes in one line. Evidence of a secret is never the secret. */
export function redactSecrets(line) {
  let out = String(line ?? '');
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[redacted]');
  return out;
}

/**
 * The production reader: absent is `null`, everything else is text. `null` is a
 * stated observation ("no file"), not an empty file — the two must stay apart or
 * an atomic save reads as a deletion plus a creation.
 */
export function readTextFile(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch (err) {
    if (/** @type {any} */ (err)?.code === 'ENOENT') return null;
    throw err;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** One observation. A read that throws is "nothing seen this poll"; it never fabricates content. */
function observe(readFile, file) {
  try {
    const value = readFile(file);
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? value : String(value);
  } catch {
    return null;
  }
}

/**
 * Poll `readFile(file)` until the content differs from the baseline taken at the
 * start, then call `onChange` once and return `{ change: true }`. Returns
 * `{ change: false }` when the timeout arrives first.
 *
 * `readFile`, `now` and `sleep` are injected so a test drives the wait with a
 * fake clock instead of sleeping: a `sleep(ms)` that advances `now()` is the
 * whole contract.
 *
 * @param {{
 *   file: string,
 *   intervalMs?: number,
 *   timeoutMs?: number,
 *   onChange: (change: { file: string, before: string|null, after: string|null }) => void,
 *   readFile?: (file: string) => string|null,
 *   now?: () => number,
 *   sleep?: (ms: number) => Promise<any>,
 * }} opts
 */
export async function watchFile({
  file,
  intervalMs = DEFAULT_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onChange,
  readFile = readTextFile,
  now = Date.now,
  sleep = defaultSleep,
} = /** @type {any} */ ({})) {
  if (!file) throw new Error('watchFile needs a file path');
  if (typeof onChange !== 'function') throw new Error('watchFile needs an onChange({ file, before, after }) function');
  if (typeof readFile !== 'function') throw new Error('watchFile needs a readFile(file) function');
  if (typeof now !== 'function') throw new Error('watchFile needs a now() clock');

  const startedAt = now();
  const deadline = startedAt + Math.max(0, timeoutMs);
  const baseline = observe(readFile, file);
  let polls = 0;
  let last = baseline;

  for (;;) {
    polls += 1;
    last = observe(readFile, file);

    // A file absent (or unreadable) on this poll is not evidence of a change: an
    // atomic save unlinks and recreates the file, and waking on that blink is a
    // false wake. A change is always content that arrived, never content that
    // vanished. Comparing to the baseline — not to the previous poll — is what
    // keeps one change to one wake.
    if (last !== null && last !== baseline) {
      onChange({ file, before: baseline, after: last });
      return {
        schema: SEAT_WATCH_SCHEMA,
        change: true,
        file,
        before: baseline,
        after: last,
        polls,
        waitedMs: now() - startedAt,
      };
    }

    const at = now();
    if (at >= deadline) {
      return {
        schema: SEAT_WATCH_SCHEMA,
        change: false,
        file,
        before: baseline,
        after: last,
        polls,
        waitedMs: at - startedAt,
      };
    }
    await sleep(Math.max(1, Math.min(intervalMs, deadline - at)));
  }
}

function linesOf(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

/**
 * The lines an append-only inbox gained. Compared as a line prefix, so an append
 * names exactly what arrived and a rewrite honestly reads as "everything from the
 * first differing line" instead of inventing a diff.
 */
export function newLinesBetween(before, after) {
  const prev = linesOf(before);
  const next = linesOf(after);
  let i = 0;
  while (i < prev.length && i < next.length && prev[i] === next[i]) i += 1;
  return next.slice(i);
}

/**
 * The message the seat receives. The new lines are the payload; the header is
 * the provenance. `total` is the true count when the lines were capped.
 *
 * @param {{ seat: string, inboxFile: string, lines: string[], total?: number }} opts
 */
export function buildInboxWakeText({ seat, inboxFile, lines, total }) {
  const count = Number.isFinite(total) ? Number(total) : lines.length;
  const shown = lines.slice(0, MAX_WAKE_LINES).map(redactSecrets);
  const hidden = Math.max(0, count - shown.length);
  return [
    `[INBOX-WAKE ${seat}] ${count} new line${count === 1 ? '' : 's'} in ${inboxFile}`,
    '',
    ...shown,
    ...(hidden ? [`... ${hidden} more line(s) not shown`] : []),
    '',
    'From: seat-watch. This is a file change, not a provider send: read the inbox before acting.',
  ].join('\n');
}

/**
 * Watch an inbox file and wake a seat with the lines that arrived.
 *
 * `wake(seat, text)` is the transport and is injected, so this module never
 * decides how a seat is reached. The wake's own answer is returned unchanged: a
 * caller reads one vocabulary (the channel's), not a copy of it.
 *
 * @param {{
 *   inboxFile: string,
 *   wake: (seat: string, text: string) => any,
 *   seat: string,
 *   intervalMs?: number,
 *   timeoutMs?: number,
 *   readFile?: (file: string) => string|null,
 *   now?: () => number,
 *   sleep?: (ms: number) => Promise<any>,
 * }} opts
 */
export async function watchInbox({
  inboxFile,
  wake,
  seat,
  intervalMs = DEFAULT_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  readFile = readTextFile,
  now = Date.now,
  sleep = defaultSleep,
} = /** @type {any} */ ({})) {
  if (!inboxFile) throw new Error('watchInbox needs an inboxFile path');
  if (!seat) throw new Error('watchInbox needs a seat id to wake');
  if (typeof wake !== 'function') throw new Error('watchInbox needs a wake(seat, text) function');

  /** @type {{ before: string|null, after: string|null }|null} */
  let seen = null;
  const outcome = await watchFile({
    file: inboxFile,
    intervalMs,
    timeoutMs,
    readFile,
    now,
    sleep,
    onChange: ({ before, after }) => { seen = { before, after }; },
  });
  if (!outcome.change || !seen) return outcome;

  const lines = newLinesBetween(seen.before, seen.after);
  return wake(seat, buildInboxWakeText({ seat, inboxFile, lines }));
}
