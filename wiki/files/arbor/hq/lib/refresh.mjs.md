# File: hq/lib/refresh.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/refresh.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17031 B |
| Lines | 395 |
| Hash | c0bdd2154273 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REFRESH_LOCK | const | 28 | yes | export const REFRESH_LOCK = &#39;refresh.lock&#39;; |
| REFRESH_LOG | const | 29 | yes | export const REFRESH_LOG = &#39;refresh.log&#39;; |
| WATCH_PID | const | 30 | yes | export const WATCH_PID = &#39;watch.pid&#39;; |
| WATCH_LOG | const | 31 | yes | export const WATCH_LOG = &#39;watch.log&#39;; |
| WATCH_PAUSE | const | 32 | yes | export const WATCH_PAUSE = &#39;watch.pause&#39;; |
| HOOKS_LOG | const | 33 | yes | export const HOOKS_LOG = &#39;hooks.log&#39;; |
| timeZoneOffsetMinutes | function | 39 | no | function timeZoneOffsetMinutes(date, timeZone) { |
| parts | const | 41 | no | const parts = new Intl.DateTimeFormat(&#39;en-US&#39;, { timeZone, timeZoneName: &#39;longOffset&#39; }) |
| name | const | 43 | no | const name = parts.find((p) =&gt; p.type === &#39;timeZoneName&#39;)?.value \|\| &#39;&#39;; |
| sign | const | 46 | no | const sign = match[1] === &#39;-&#39; ? -1 : 1; |
| parisISO | function | 54 | yes | export function parisISO(date = new Date()) { |
| offset | const | 55 | no | const offset = timeZoneOffsetMinutes(date, &#39;Europe/Paris&#39;); |
| shifted | const | 56 | no | const shifted = new Date(date.getTime() - offset * 60_000); |
| sign | const | 57 | no | const sign = offset &lt; 0 ? &#39;-&#39; : &#39;+&#39;; |
| abs | const | 58 | no | const abs = Math.abs(offset); |
| label | const | 59 | no | const label = `${sign}${String(Math.floor(abs / 60)).padStart(2, &#39;0&#39;)}:${String(abs % 60).padStart(2, &#39;0&#39;)}`; |
| hqFile | function | 67 | no | function hqFile(root, name) { |
| dir | const | 68 | no | const dir = join(root, &#39;.hq&#39;); |
| appendLogLine | function | 74 | yes | export function appendLogLine(root, name, text) { |
| path | const | 75 | no | const path = hqFile(root, name); |
| tailLines | function | 80 | yes | export function tailLines(path, n = 20) { |
| text | const | 82 | no | const text = readFileSync(path, &#39;utf8&#39;); |
| isProcessAlive | function | 86 | no | function isProcessAlive(pid) { |
| readPidFile | function | 96 | no | function readPidFile(path) { |
| info | const | 98 | no | const info = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| pid | const | 99 | no | const pid = Number(info?.pid); |
| isPaused | function | 112 | yes | export function isPaused(root) { |
| acquireRefreshLock | function | 125 | yes | export function acquireRefreshLock(root) { |
| path | const | 126 | no | const path = hqFile(root, REFRESH_LOCK); |
| held | const | 128 | no | const held = readPidFile(path); |
| fd | variable | 138 | no | let fd; |
| held | const | 143 | no | const held = readPidFile(path); |
| writeFd | function | 154 | no | function writeFd(fd, text) { |
| buffer | const | 155 | no | const buffer = Buffer.from(text, &#39;utf8&#39;); |
| written | variable | 156 | no | let written = 0; |
| releaseRefreshLock | function | 163 | yes | export function releaseRefreshLock(root) { |
| path | const | 164 | no | const path = join(root, &#39;.hq&#39;, REFRESH_LOCK); |
| held | const | 165 | no | const held = readPidFile(path); |
| readWatcherState | function | 176 | yes | export function readWatcherState(root) { |
| path | const | 177 | no | const path = join(root, &#39;.hq&#39;, WATCH_PID); |
| held | const | 179 | no | const held = readPidFile(path); |
| alive | const | 181 | no | const alive = isProcessAlive(held.pid); |
| REFRESH_LINE | const | 185 | no | const REFRESH_LINE = /^(\\S+)\\s+(\\S+)\\s+(\\d+)ms\\s+files=(\\d+)\\s+pages=(\\d+)\\s+reason=(.*)$/; |
| parseRefreshLine | function | 188 | yes | export function parseRefreshLine(line) { |
| lastRefreshBySpace | function | 195 | yes | export function lastRefreshBySpace(root) { |
| out | const | 196 | no | const out = {}; |
| entry | const | 199 | no | const entry = parseRefreshLine(line); |
| errorMessage | function | 209 | no | function errorMessage(error) { |
| pageBelongsToSpace | function | 213 | no | function pageBelongsToSpace(pageId, name) { |
| runRefreshPipeline | function | 238 | yes | export async function runRefreshPipeline({ root, config, db, projects, spaces = null, reason = &#39;manual&#39;, indexResults = null, operation = &#39;refresh&#39;, maxFileBytes = null, maxFilePages = 5000, lock = t… |
| allProjects | const | 243 | no | const allProjects = Array.isArray(projects) ? projects : []; |
| targetSpaces | const | 246 | no | const targetSpaces = spaces === null \|\| spaces === undefined \|\| spaces === &#39;&#39; ? allProjects : spaces; |
| started | const | 247 | no | const started = performance.now(); |
| lockState | variable | 249 | no | let lockState = null; |
| perSpace | const | 257 | no | const perSpace = []; |
| reused | const | 261 | no | const reused = indexResults ? indexResults.get(space.name) : null; |
| result | variable | 266 | no | let result = null; |
| wiki | variable | 288 | no | let wiki = { written: 0, skipped: 0, total: 0, pages: [] }; |
| kg | variable | 303 | no | let kg = { imported: false, reason: null }; |
| kgModule | const | 305 | no | const kgModule = await import(&#39;./kg-export.mjs&#39;); |
| outPath | const | 306 | no | const outPath = join(root, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 307 | no | const statePath = join(root, &#39;.hq&#39;, &#39;kg-export-state.json&#39;); |
| export_ | const | 308 | no | const export_ = kgModule.exportGraphExchange({ db, outPath, statePath }); |
| imp | const | 312 | no | const imp = kgModule.importGraphExchange({ root, journal: join(root, &#39;.hq&#39;, &#39;kg-journal.hqj&#39;), exchange: outPath, namespace: kgModule.SOURCE_NAMESPACE, |
| ack | const | 323 | no | const ack = kgModule.acknowledgeGraphExport({ statePath, digest: export_.digest, acknowledgment: { epochBefore: imp.epochBefore, epochAfter: imp.epochAfter, stats: imp.statsLine ?? undefined }, }); |
| staleCount | variable | 340 | no | let staleCount = 0; |
| stale | variable | 341 | no | let stale = []; |
| durationMs | const | 350 | no | const durationMs = Math.max(1, Math.round(performance.now() - started)); |
| generated | const | 370 | no | const generated = (wiki.pages \|\| []).filter((p) =&gt; p.generated); |
| pages | const | 372 | no | const pages = targetSpaces.length === 1 |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 16 | external |
| node:path | import | 19 | external |
| ./util.mjs | import | 20 | [hq/lib/util.mjs](./util.mjs.md) |
| ./telemetry.mjs | import | 21 | [hq/lib/telemetry.mjs](./telemetry.mjs.md) |
| ./indexer.mjs | import | 22 | [hq/lib/indexer.mjs](./indexer.mjs.md) |
| ./skills.mjs | import | 23 | [hq/lib/skills.mjs](./skills.mjs.md) |
| ./lake.mjs | import | 24 | [hq/lib/lake.mjs](./lake.mjs.md) |
| ./wiki.mjs | import | 25 | [hq/lib/wiki.mjs](./wiki.mjs.md) |
| ./freshness.mjs | import | 26 | [hq/lib/freshness.mjs](./freshness.mjs.md) |
| ./kg-export.mjs | dynamic | 305 | [hq/lib/kg-export.mjs](./kg-export.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/refresh.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/refresh.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/refresh.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/refresh.mjs — one-command incremental refresh: index → wiki → gate → log.
//
// CONTRACT (Z.ai R1, "always on, always updating"): `hq refresh` is the single
// maintenance primitive every automation surface (watch daemon, git hooks,
// manual/CI invocations) funnels through. It re-indexes only changed files for
// the requested spaces (size/mtime/hash machinery in the indexer), regenerates
// only stale wiki pages (per-page input hash in the wiki generator), runs the
// strict freshness gate and appends one line per space to .hq/refresh.log.
//
// Files owned here (all under .hq/, all machine-local):
//   refresh.lock — single-writer guard for refresh invocations
//   refresh.log  — append-only audit trail, ISO-8601 Europe/Paris timestamps
//   watch.pid    — daemon liveness (written/removed by `hq watch`)
//   watch.log    — daemon start/stop/pause/refresh trail
//   watch.pause  — pause sentinel: watchers and hooks skip refreshes while present
import {
  appendFileSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, rmSync, statSync, writeSync,
} from 'node:fs';
import { join } from 'node:path';
import { nowISO } from './util.mjs';
import { recordTiming } from './telemetry.mjs';
import { indexProject } from './indexer.mjs';
import { indexInstructions } from './skills.mjs';
import { ingestProject } from './lake.mjs';
import { buildWiki } from './wiki.mjs';
import { collectStaleFiles } from './freshness.mjs';

export const REFRESH_LOCK = 'refresh.lock';
export const REFRESH_LOG = 'refresh.log';
export const WATCH_PID = 'watch.pid';
export const WATCH_LOG = 'watch.log';
export const WATCH_PAUSE = 'watch.pause';
export const HOOKS_LOG = 'hooks.log';

// ---------------------------------------------------------------------------
// Europe/Paris wall clock
// ---------------------------------------------------------------------------

function timeZoneOffsetMinutes(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    const match = /GMT([+-])(\d{1,2}):?(\d{2})?/.exec(name);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2] || 0) * 60 + Number(match[3] || 0));
  } catch {
    return 0;
  }
}

/** parisISO — ISO-8601 timestamp with the Europe/Paris UTC offset (CET/CEST). */
export function parisISO(date = new Date()) {
  const offset = timeZoneOffsetMinutes(date, 'Europe/Paris');
  const shifted = new Date(date.getTime() - offset * 60_000);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const label = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return shifted.toISOString().replace('Z', label);
}

// ---------------------------------------------------------------------------
// small log/pid helpers
// ---------------------------------------------------------------------------

function hqFile(root, name) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}

/** appendLogLine — append `<parisISO> <text>` to .hq/<name> (created on demand). */
export function appendLogLine(root, name, text) {
  const path = hqFile(root, name);
  appendFileSync(path, `${parisISO()} ${text}\n`, 'utf8');
}

/** tailLines — last n lines of a file (empty array when missing). */
export function tailLines(path, n = 20) {
```

_First 80 of 396 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
