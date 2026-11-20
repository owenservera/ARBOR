# File: hq/lib/thread-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/thread-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15384 B |
| Lines | 397 |
| Hash | d1a7bd06398f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SOURCE_OF_KIND | const | 33 | no | const SOURCE_OF_KIND = /** @type {Record&lt;ThreadKind, string&gt;} */ ({ session: &#39;sessions&#39;, inbox: &#39;inbox&#39;, receipt: &#39;receipts&#39; }); |
| KIND_RANK | const | 34 | no | const KIND_RANK = /** @type {Record&lt;ThreadKind, number&gt;} */ ({ session: 1, inbox: 2, receipt: 3 }); |
| IDENTITY_RANK | const | 35 | no | const IDENTITY_RANK = /** @type {Record&lt;ThreadIdentity, number&gt;} */ ({ unknown: 0, stored: 1, named: 2 }); |
| SOURCE_ORDER | const | 36 | no | const SOURCE_ORDER = [&#39;receipts&#39;, &#39;inbox&#39;, &#39;sessions&#39;]; |
| isPlaceholderThreadId | function | 43 | yes | export function isPlaceholderThreadId(value) { |
| raw | const | 45 | no | const raw = value.trim(); |
| text | function | 51 | no | function text(value) { |
| s | const | 53 | no | const s = value.trim(); |
| isRecord | function | 58 | no | function isRecord(value) { |
| listOf | function | 69 | no | function listOf(input, ...keys) { |
| value | const | 73 | no | const value = (/** @type {any} */ (input))[key]; |
| loadRegistry | function | 87 | yes | export function loadRegistry(registryFile) { |
| doc | variable | 90 | no | let doc = null; |
| bare | const | 101 | no | const bare = doc.byKey &amp;&amp; typeof doc.byKey === &#39;object&#39; &amp;&amp; !Array.isArray(doc.byKey); |
| source | const | 102 | no | const source = bare ? doc.byKey : doc; |
| META | const | 103 | no | const META = new Set([&#39;schema&#39;, &#39;generatedAt&#39;, &#39;byKey&#39;, &#39;byNid&#39;, &#39;nextLineage&#39;]); |
| byKey | const | 105 | no | const byKey = new Map(); |
| nid | const | 108 | no | const nid = typeof value === &#39;string&#39; ? value : (isRecord(value) ? (/** @type {any} */ (value)).nid : null); |
| clean | const | 109 | no | const clean = text(nid); |
| keysFor | function | 122 | no | function keysFor(kind, record) { |
| keys | const | 124 | no | const keys = []; |
| push | function | 126 | no | const push = (value) =&gt; { |
| clean | const | 127 | no | const clean = text(value); |
| id | const | 130 | no | const id = record?.id ?? null; |
| raw | const | 145 | no | const raw = record?.threadId; |
| nidFor | function | 161 | no | function nidFor(kind, record, registry) { |
| declared | const | 162 | no | const declared = text(record?.resolvedNid) ?? text(record?.nid); |
| hit | const | 166 | no | const hit = registry.byKey.get(key); |
| pickTime | function | 178 | no | function pickTime(values) { |
| best | variable | 180 | no | let best = null; |
| bestAt | variable | 181 | no | let bestAt = Number.NEGATIVE_INFINITY; |
| raw | const | 183 | no | const raw = text(value); |
| at | const | 185 | no | const at = Date.parse(raw); |
| countOf | function | 196 | no | function countOf(record, fallback) { |
| value | const | 198 | no | const value = record?.[key]; |
| sessionLastSeen | function | 208 | no | function sessionLastSeen(record) { |
| explicit | const | 209 | no | const explicit = pickTime([record?.lastSeenAt, record?.updatedAt, record?.ts, record?.newest, record?.createdAt]); |
| age | const | 213 | no | const age = record?.ageMinutes; |
| fromSession | function | 233 | no | function fromSession(record) { |
| id | const | 234 | no | const id = text(record?.id); |
| name | const | 235 | no | const name = text(record?.title); |
| fromInbox | function | 251 | no | function fromInbox(record) { |
| id | const | 252 | no | const id = text(record?.id); |
| name | const | 253 | no | const name = text(record?.thread) ?? text(record?.title); |
| fromReceipt | function | 269 | no | function fromReceipt(record) { |
| id | const | 270 | no | const id = text(record?.receiptId) ?? text(record?.id); |
| raw | const | 271 | no | const raw = text(record?.threadId); |
| real | const | 272 | no | const real = raw &amp;&amp; !isPlaceholderThreadId(raw) ? raw : null; |
| BUILDERS | const | 284 | no | const BUILDERS = { session: fromSession, inbox: fromInbox, receipt: fromReceipt }; |
| buildIndex | function | 297 | yes | export function buildIndex({ sessions = [], inboxThreads = [], evidence = [], registryFile = null } = {}) { |
| registry | const | 298 | no | const registry = loadRegistry(registryFile); |
| feeds | const | 299 | no | const feeds = /** @type {Array&lt;[ThreadKind, any[]]&gt;} */ ([ [&#39;session&#39;, listOf(sessions, &#39;sessions&#39;, &#39;threads&#39;, &#39;items&#39;)], [&#39;inbox&#39;, listOf(inboxThreads, &#39;threads&#39;, &#39;items&#39;)], [&#39;receipt&#39;, listOf(evide… |
| rows | const | 306 | no | const rows = new Map(); |
| ordinal | variable | 307 | no | let ordinal = 0; |
| part | const | 313 | no | const part = BUILDERS[kind](record); |
| nid | const | 314 | no | const nid = nidFor(kind, record, registry); |
| key | const | 315 | no | const key = nid ? `nid:${nid}` : `${kind}:${part.id ?? `#${ordinal}`}`; |
| identity | const | 316 | no | const identity = nid ? &#39;named&#39; : part.identity; |
| incoming | const | 318 | no | const incoming = { |
| current | const | 330 | no | const current = rows.get(key); |
| threads | const | 351 | no | const threads = [...rows.values()] |
| out | const | 354 | no | const out = { |
| at | const | 367 | no | const at = a.lastSeenAt ? Date.parse(a.lastSeenAt) : Number.NEGATIVE_INFINITY; |
| bt | const | 368 | no | const bt = b.lastSeenAt ? Date.parse(b.lastSeenAt) : Number.NEGATIVE_INFINITY; |
| counts | const | 373 | no | const counts = { total: threads.length, session: 0, inbox: 0, receipt: 0, named: 0, stored: 0, unknown: 0, merged: 0 }; |
| renderIndex | function | 387 | yes | export function renderIndex(index) { |
| c | const | 388 | no | const c = index.counts; |
| L | const | 389 | no | const L = []; |
| seen | const | 392 | no | const seen = t.lastSeenAt ? t.lastSeenAt.slice(0, 16).replace(&#39;T&#39;, &#39; &#39;) : &#39;-&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 17 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | One thread list over the three places a conversation is written down — live sessions, |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | thread-index |
| 7 | invariant | — | — | read-only: inputs are rows somebody else probed; this module reads one registry file and nothing else |
| 8 | invariant | — | — | a missing, unreadable or wrongly shaped registry is `identity: &#39;unknown&#39;`, never a throw |
| 9 | invariant | — | — | one conversation is one row: two sources resolving to the same Nid merge, never duplicate |
| 10 | invariant | — | — | a placeholder or missing thread id is never a conversation key, so it can never merge two records |
| 11 | invariant | — | — | messages is the largest single-source count for the conversation, never a sum across overlapping views |
| 12 | why | — | — | The owner asked for one list instead of three panels. The join must stay honest: rows merge only on |
| 14 | see | — | hq/lib/comms-roof.mjs | hq/lib/comms-roof.mjs |
| 15 | see | — | hq/lib/cnp.mjs | hq/lib/cnp.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context One thread list over the three places a conversation is written down — live sessions,
 *   bot-inbox threads and channel receipts — joined by CNP Nid so one conversation is one row.
 * @hq:owner channel-manager
 * @hq:task thread-index
 * @hq:invariant read-only: inputs are rows somebody else probed; this module reads one registry file and nothing else
 * @hq:invariant a missing, unreadable or wrongly shaped registry is `identity: 'unknown'`, never a throw
 * @hq:invariant one conversation is one row: two sources resolving to the same Nid merge, never duplicate
 * @hq:invariant a placeholder or missing thread id is never a conversation key, so it can never merge two records
 * @hq:invariant messages is the largest single-source count for the conversation, never a sum across overlapping views
 * @hq:why The owner asked for one list instead of three panels. The join must stay honest: rows merge only on
 *   a name the CNP registry proves, and a row with no proof stays separate and says `unknown`.
 * @hq:see hq/lib/comms-roof.mjs
 * @hq:see hq/lib/cnp.mjs
 */
import { existsSync, readFileSync } from 'node:fs';

/** @typedef {'session' | 'inbox' | 'receipt'} ThreadKind */
/** @typedef {'stored' | 'named' | 'unknown'} ThreadIdentity */
/**
 * @typedef {Object} ThreadRow
 * @property {string} key             stable row key: `nid:<nid>` when the conversation is named, else `<kind>:<id>`
 * @property {ThreadKind} kind        the strictest evidence behind the row: receipt > inbox > session
 * @property {string} title           the best human name any contributing source offered
 * @property {string[]} source        every feed the row was built from, strongest first
 * @property {string | null} lastSeenAt ISO-8601 of the newest record, or null when no source dates it
 * @property {number} messages        the largest single-source message count, 0 when the source does not count
 * @property {string} [nid]           the CNP/1 stem, present only when the registry (or the record) named it
 * @property {ThreadIdentity} identity
 */

const SOURCE_OF_KIND = /** @type {Record<ThreadKind, string>} */ ({ session: 'sessions', inbox: 'inbox', receipt: 'receipts' });
const KIND_RANK = /** @type {Record<ThreadKind, number>} */ ({ session: 1, inbox: 2, receipt: 3 });
const IDENTITY_RANK = /** @type {Record<ThreadIdentity, number>} */ ({ unknown: 0, stored: 1, named: 2 });
const SOURCE_ORDER = ['receipts', 'inbox', 'sessions'];

/**
 * A thread id that names a tab, not a conversation. Same test the roof and CNP use,
 * so a placeholder can never become a merge key here.
 * @param {unknown} value
 */
export function isPlaceholderThreadId(value) {
  if (typeof value !== 'string') return true;
  const raw = value.trim();
  if (!raw) return true;
  return /live-tab$/i.test(raw) || /^(new|t\d+)$/i.test(raw) || /-new$/i.test(raw);
}

/** @param {unknown} value */
function text(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s : null;
}

/** @param {unknown} value */
function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Accept a bare array, or the probe object that carries one, so callers can pass
 * `probeInboxes()` itself and not be punished for it.
 * @param {unknown} input
 * @param {...string} keys
 * @returns {any[]}
 */
function listOf(input, ...keys) {
  if (Array.isArray(input)) return input;
  if (isRecord(input)) {
    for (const key of keys) {
      const value = (/** @type {any} */ (input))[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/**
```

_First 80 of 398 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
