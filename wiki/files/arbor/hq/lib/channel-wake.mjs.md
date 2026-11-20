# File: hq/lib/channel-wake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/channel-wake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6186 B |
| Lines | 143 |
| Hash | 380be362452c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CHANNEL_WAKE_SCHEMA | const | 22 | yes | export const CHANNEL_WAKE_SCHEMA = &#39;hq.channel-wake/1&#39;; |
| scanChannel | function | 33 | yes | export function scanChannel(root) { |
| scanDir | function | 47 | no | function scanDir(dir, fields) { |
| out | const | 48 | no | const out = []; |
| file | const | 50 | no | const file = join(dir, name); |
| doc | variable | 51 | no | let doc = null; |
| mtime | const | 54 | no | const mtime = statSync(file).mtimeMs; |
| listJson | function | 63 | no | function listJson(dir) { |
| str | function | 71 | no | function str(v) { |
| diffEvents | function | 87 | yes | export function diffEvents(before, after) { |
| b | const | 88 | no | const b = before ?? { outcomes: [], pending: [], receipts: [] }; |
| a | const | 89 | no | const a = after ?? { outcomes: [], pending: [], receipts: [] }; |
| events | const | 91 | no | const events = []; |
| bOutcomes | const | 93 | no | const bOutcomes = new Map(b.outcomes.map((o) =&gt; [o.id, o])); |
| prev | const | 95 | no | const prev = bOutcomes.get(o.id); |
| to | const | 96 | no | const to = `${o.effect}/${o.evidenceState}`; |
| aPending | const | 103 | no | const aPending = new Set(a.pending); |
| bReceipts | const | 108 | no | const bReceipts = new Map(b.receipts.map((r) =&gt; [r.id, r])); |
| prev | const | 110 | no | const prev = bReceipts.get(r.id); |
| describeEvent | function | 127 | yes | export function describeEvent(e) { |
| line | variable | 128 | no | let line; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 18 | external |
| node:path | import | 19 | external |
| ./seat-watch.mjs | import | 20 | [hq/lib/seat-watch.mjs](./seat-watch.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-wake.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Event-driven channel wake core — snapshot the channel (outcomes/, pending/, |
| 6 | owner | channel-wake | — | channel-wake |
| 7 | task | — | — | channel-wake-lane (owner order 2026-11-09: hook-based wakes, not polling) |
| 8 | invariant | — | — | reads only the root it is given: this lib hardcodes no channel path, so tests |
| 10 | invariant | — | — | an event names id, kind and state transition only — never a prompt, reply, |
| 12 | invariant | — | — | mtime never produces an event; only effect/evidenceState/state transitions do |
| 13 | invariant | — | — | pure + testable: no timers, no transports, no bus access in this module — |
| 15 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 16 | see | — | hq/lib/seat-watch.mjs | hq/lib/seat-watch.mjs (redaction patterns) · hq/lib/channel-broker.mjs (receipt states) |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Event-driven channel wake core — snapshot the channel (outcomes/, pending/,
 *   broker/receipts/), diff against the last snapshot, and turn every real transition into one
 *   secret-free bus line so no seat ever has to sleep-poll the channel again
 * @hq:owner channel-wake
 * @hq:task channel-wake-lane (owner order 2026-11-09: hook-based wakes, not polling)
 * @hq:invariant reads only the root it is given: this lib hardcodes no channel path, so tests
 *   run against temp dirs only and the live channel is touched by the CLI default alone
 * @hq:invariant an event names id, kind and state transition only — never a prompt, reply,
 *   digest or credential; describeEvent redacts credential shapes defensively
 * @hq:invariant mtime never produces an event; only effect/evidenceState/state transitions do
 * @hq:invariant pure + testable: no timers, no transports, no bus access in this module —
 *   watch/debounce/send wiring lives in hq/bin/hq.mjs cmdChannel
 * @hq:see docs/AGENT-BUS.md
 * @hq:see hq/lib/seat-watch.mjs (redaction patterns) · hq/lib/channel-broker.mjs (receipt states)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { redactSecrets } from './seat-watch.mjs';

export const CHANNEL_WAKE_SCHEMA = 'hq.channel-wake/1';

/**
 * One read-only sweep of a channel root. Absent subdirectories read as empty
 * arrays; a file that vanishes mid-scan or fails to parse is skipped — a
 * transient write is never reported as a transition.
 *
 * @param {string} root channel root (e.g. the CLI default; never hardcoded here)
 * @returns {{outcomes: {id: string, effect: string, evidenceState: string, mtime: number}[],
 *            pending: string[], receipts: {id: string, state: string, mtime: number}[]}}
 */
export function scanChannel(root) {
  return {
    outcomes: scanDir(join(root, 'outcomes'), (doc) => ({
      effect: str(doc?.effect),
      evidenceState: str(doc?.evidenceState),
    })).map(({ id, mtime, fields }) => ({ id, mtime, ...fields })),
    pending: listJson(join(root, 'pending')).map((name) => name.slice(0, -5)),
    receipts: scanDir(join(root, 'broker', 'receipts'), (doc) => ({
      state: str(doc?.state),
    })).map(({ id, mtime, fields }) => ({ id, mtime, ...fields })),
  };
}

/** Read every `*.json` in one dir; skip unparseable/transient files; sort by id. */
function scanDir(dir, fields) {
  const out = [];
  for (const name of listJson(dir)) {
    const file = join(dir, name);
    let doc = null;
    try {
      doc = JSON.parse(readFileSync(file, 'utf8'));
      const mtime = statSync(file).mtimeMs;
      out.push({ id: name.slice(0, -5), mtime, fields: fields(doc) });
    } catch {
      // File vanished mid-scan or is being rewritten: not an observation.
    }
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function listJson(dir) {
  try {
    return readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
  } catch {
    return []; // absent dir is an empty observation, not an error
  }
}

function str(v) {
  return typeof v === 'string' && v.length > 0 ? v : 'UNKNOWN';
}

/**
 * Pure diff between two snapshots. Kinds: `outcome` (new or effect/evidenceState
 * transition; from/to are `<effect>/<evidenceState>`), `pending-cleared` (the
 * write-ahead pending file self-cleared = the detached turn completed),
 * `receipt-state` (SENT/UNCERTAIN/REFUSED transition). Removals of outcomes and
 * receipts are not observable transitions and emit nothing; mtime is ignored.
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
