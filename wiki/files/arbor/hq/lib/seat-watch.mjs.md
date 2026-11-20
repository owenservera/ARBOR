# File: hq/lib/seat-watch.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/seat-watch.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8328 B |
| Lines | 236 |
| Hash | 9453c616d5f7 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEAT_WATCH_SCHEMA | const | 14 | yes | export const SEAT_WATCH_SCHEMA = &#39;hq.seat-watch/1&#39;; |
| DEFAULT_INTERVAL_MS | const | 17 | yes | export const DEFAULT_INTERVAL_MS = 1000; |
| DEFAULT_TIMEOUT_MS | const | 20 | yes | export const DEFAULT_TIMEOUT_MS = 570000; |
| MAX_WAKE_LINES | const | 23 | yes | export const MAX_WAKE_LINES = 100; |
| SECRET_PATTERNS | const | 27 | no | const SECRET_PATTERNS = [ |
| redactSecrets | function | 39 | yes | export function redactSecrets(line) { |
| out | variable | 40 | no | let out = String(line ?? &#39;&#39;); |
| readTextFile | function | 50 | yes | export function readTextFile(file) { |
| defaultSleep | function | 59 | no | const defaultSleep = (ms) =&gt; new Promise((resolve) =&gt; { setTimeout(resolve, ms); }); |
| observe | function | 62 | no | function observe(readFile, file) { |
| value | const | 64 | no | const value = readFile(file); |
| watchFile | function | 91 | yes | export async function watchFile({ file, intervalMs = DEFAULT_INTERVAL_MS, timeoutMs = DEFAULT_TIMEOUT_MS, onChange, |
| startedAt | const | 105 | no | const startedAt = now(); |
| deadline | const | 106 | no | const deadline = startedAt + Math.max(0, timeoutMs); |
| baseline | const | 107 | no | const baseline = observe(readFile, file); |
| polls | variable | 108 | no | let polls = 0; |
| last | variable | 109 | no | let last = baseline; |
| at | const | 133 | no | const at = now(); |
| linesOf | function | 149 | no | function linesOf(text) { |
| newLinesBetween | function | 161 | yes | export function newLinesBetween(before, after) { |
| prev | const | 162 | no | const prev = linesOf(before); |
| next | const | 163 | no | const next = linesOf(after); |
| i | variable | 164 | no | let i = 0; |
| buildInboxWakeText | function | 175 | yes | export function buildInboxWakeText({ seat, inboxFile, lines, total }) { |
| count | const | 176 | no | const count = Number.isFinite(total) ? Number(total) : lines.length; |
| shown | const | 177 | no | const shown = lines.slice(0, MAX_WAKE_LINES).map(redactSecrets); |
| hidden | const | 178 | no | const hidden = Math.max(0, count - shown.length); |
| watchInbox | function | 207 | yes | export async function watchInbox({ inboxFile, wake, seat, intervalMs = DEFAULT_INTERVAL_MS, |
| seen | variable | 222 | no | let seen = null; |
| outcome | const | 223 | no | const outcome = await watchFile({ file: inboxFile, intervalMs, timeoutMs, readFile, |
| lines | const | 234 | no | const lines = newLinesBetween(seen.before, seen.after); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/channel-wake.mjs](./channel-wake.mjs.md) | ./seat-watch.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Seat wake by file watcher — poll one file for a content change and wake a seat with the lines that are new |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | channel-wake |
| 6 | invariant | — | — | no provider send: this module reads one file and calls an injected wake; it owns no transport |
| 7 | invariant | — | — | a file that blinks out mid-rewrite is not a change; only content appearing or changing wakes a seat |
| 8 | invariant | — | — | a wake text never carries a credential shape: matching lines are redacted before the wake |
| 9 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 10 | see | — | docs/SYNC-BUS.md | docs/SYNC-BUS.md |

## Excerpt

```javascript
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
```

_First 80 of 237 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
