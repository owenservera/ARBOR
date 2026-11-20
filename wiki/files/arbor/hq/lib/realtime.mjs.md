# File: hq/lib/realtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/realtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13157 B |
| Lines | 413 |
| Hash | d36c041c879f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REALTIME_SCHEMA | const | 14 | yes | export const REALTIME_SCHEMA = &#39;hq.realtime/1&#39;; |
| MAX_QUEUE | const | 17 | no | const MAX_QUEUE = 256; |
| SECRET_BASENAMES | const | 20 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, |
| DOCS_DIR | const | 28 | no | const DOCS_DIR = /(?:^\|\\/)docs\\//; |
| yieldTick | const | 30 | no | const yieldTick = typeof setImmediate === &#39;function&#39; |
| posixPath | function | 38 | no | function posixPath(value) { |
| baseName | function | 42 | no | function baseName(value) { |
| path | const | 43 | no | const path = posixPath(value).replace(/\\/+$/, &#39;&#39;); |
| cut | const | 44 | no | const cut = path.lastIndexOf(&#39;/&#39;); |
| trimmed | function | 48 | no | function trimmed(value) { |
| projectName | function | 52 | no | function projectName(value) { |
| name | const | 55 | no | const name = value.name ?? value.id; |
| eventTypeOf | function | 61 | no | function eventTypeOf(event) { |
| dataOf | function | 66 | no | function dataOf(event) { |
| data | const | 68 | no | const data = event.data ?? event.properties ?? event.payload; |
| isSecretPath | function | 77 | yes | export function isSecretPath(value) { |
| name | const | 78 | no | const name = baseName(value).toLowerCase(); |
| isDocsPath | function | 86 | no | function isDocsPath(value) { |
| path | const | 87 | no | const path = posixPath(value).toLowerCase(); |
| secretPathOf | function | 94 | no | function secretPathOf(event) { |
| data | const | 96 | no | const data = dataOf(event); |
| candidate | variable | 97 | no | let candidate = &#39;&#39;; |
| planRealtime | function | 117 | yes | export function planRealtime(event) { |
| data | const | 119 | no | const data = dataOf(event); |
| actions | const | 120 | no | const actions = []; |
| path | const | 127 | no | const path = trimmed(event.path) \|\| trimmed(data.path) \|\| null; |
| project | const | 129 | no | const project = projectName(event.project ?? data.project); |
| project | const | 140 | no | const project = projectName(event.project ?? data.project); |
| project | const | 150 | no | const project = projectName(event.project ?? data.project); |
| path | const | 156 | no | const path = trimmed(data.path) \|\| null; |
| project | const | 159 | no | const project = projectName(data.project ?? event.project); |
| path | const | 165 | no | const path = trimmed(data.path) \|\| null; |
| project | const | 166 | no | const project = projectName(data.project); |
| createRealtimeCoordinator | function | 197 | yes | export function createRealtimeCoordinator({ root, db, projects = [], index, |
| delay | const | 207 | no | const delay = Number.isFinite(Number(debounceMs)) ? Math.max(0, Number(debounceMs)) : 500; |
| projectList | const | 208 | no | const projectList = Array.isArray(projects) ? projects : []; |
| workers | const | 209 | no | const workers = { |
| stats | const | 216 | no | const stats = { |
| groups | const | 228 | no | const groups = new Map(); |
| kindTail | const | 230 | no | const kindTail = new Map(); |
| inFlight | const | 232 | no | const inFlight = new Set(); |
| queueSize | variable | 234 | no | let queueSize = 0; |
| stopped | variable | 235 | no | let stopped = false; |
| stopPromise | variable | 236 | no | let stopPromise = null; |
| groupFor | function | 238 | no | function groupFor(kind, project) { |
| key | const | 239 | no | const key = `${kind}\\0${project ?? &#39;&#39;}`; |
| group | variable | 240 | no | let group = groups.get(key); |
| armTimer | function | 256 | no | function armTimer(group) { |
| schedule | function | 266 | no | function schedule(action) { |
| group | const | 273 | no | const group = groupFor(action.kind, action.project); |
| startRun | function | 286 | no | function startRun(group) { |
| entries | const | 291 | no | const entries = group.entries.splice(0, group.entries.length); |
| worker | const | 296 | no | const worker = workers[group.kind]; |
| payload | const | 297 | no | const payload = { |
| tail | const | 308 | no | const tail = kindTail.get(group.kind) ?? Promise.resolve(); |
| run | const | 309 | no | const run = tail.then(async () =&gt; { stats.ran++; stats.byKind[group.kind] = (stats.byKind[group.kind] ?? 0) + 1; try { await worker(payload); |
| tracked | const | 321 | no | const tracked = run.then( () =&gt; { inFlight.delete(tracked); }, () =&gt; { inFlight.delete(tracked); }, ); |
| finalize | function | 327 | no | const finalize = () =&gt; { |
| onEvent | function | 340 | no | function onEvent(event) { |
| plan | const | 347 | no | const plan = planRealtime(event); |
| actions | const | 348 | no | const actions = Array.isArray(plan?.actions) ? plan.actions : []; |
| flush | function | 362 | no | async function flush() { |
| started | variable | 370 | no | let started = false; |
| busy | const | 381 | no | const busy = [...groups.values()].some( (group) =&gt; group.running \|\| group.entries.length &gt; 0 \|\| group.timer !== null, ); |
| stop | function | 392 | no | function stop() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 12 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Real-time event coordinator (lane S): a pure event planner plus a debounced, non-overlapping dispatcher for index/ingest/wiki/session work. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | LAB-01 |
| 5 | invariant | — | — | planRealtime is pure — no IO, no timers, no network; the same event always yields the same actions. |
| 6 | invariant | — | — | The coordinator never sends data, never drives a browser and never throws at the caller: onEvent is synchronous and safe on malformed input. |
| 7 | invariant | — | — | Secret paths are dropped before any action is planned, so a credential never reaches a worker. |
| 8 | why | — | — | Runs are serialized per kind and coalesced per (kind, project) so a burst of editor writes cannot start parallel index passes. |
| 9 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |
| 10 | see | — | hq/lib/automation.mjs | hq/lib/automation.mjs |

## Excerpt

```javascript
/**
 * @hq:context Real-time event coordinator (lane S): a pure event planner plus a debounced, non-overlapping dispatcher for index/ingest/wiki/session work.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant planRealtime is pure — no IO, no timers, no network; the same event always yields the same actions.
 * @hq:invariant The coordinator never sends data, never drives a browser and never throws at the caller: onEvent is synchronous and safe on malformed input.
 * @hq:invariant Secret paths are dropped before any action is planned, so a credential never reaches a worker.
 * @hq:why Runs are serialized per kind and coalesced per (kind, project) so a burst of editor writes cannot start parallel index passes.
 * @hq:see hq/CONTRACT.md
 * @hq:see hq/lib/automation.mjs
 */
import { toPosix } from './util.mjs';

export const REALTIME_SCHEMA = 'hq.realtime/1';

/** Maximum number of scheduled actions waiting to be consumed by a run. */
const MAX_QUEUE = 256;

/** Basenames that never reach a worker. Mirrors the HQ-wide secret rule. */
const SECRET_BASENAMES = new Set([
  'session.json',
  'storage-state.json',
  'release-profile.json',
  'cookies',
  'login data',
]);

const DOCS_DIR = /(?:^|\/)docs\//;

const yieldTick = typeof setImmediate === 'function'
  ? () => new Promise((resolve) => setImmediate(resolve))
  : () => new Promise((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------
// small deterministic helpers
// ---------------------------------------------------------------------------

function posixPath(value) {
  return toPosix(String(value ?? '')).trim();
}

function baseName(value) {
  const path = posixPath(value).replace(/\/+$/, '');
  const cut = path.lastIndexOf('/');
  return cut === -1 ? path : path.slice(cut + 1);
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function projectName(value) {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const name = value.name ?? value.id;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

function eventTypeOf(event) {
  if (!event || typeof event !== 'object') return '';
  return trimmed(event.type ?? event.kind ?? event.name);
}

function dataOf(event) {
  if (!event || typeof event !== 'object') return {};
  const data = event.data ?? event.properties ?? event.payload;
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

/**
 * isSecretPath — true when a path names a credential store HQ must never read.
 * Rules: `.env*`, `*.keystore`, `session.json`, `storage-state.json`,
 * `release-profile.json`, `Cookies`, `Login Data`.
 */
export function isSecretPath(value) {
  const name = baseName(value).toLowerCase();
  if (!name) return false;
  if (name.startsWith('.env')) return true;
```

_First 80 of 414 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
