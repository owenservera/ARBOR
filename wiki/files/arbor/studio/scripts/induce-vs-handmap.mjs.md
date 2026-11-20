# File: studio/scripts/induce-vs-handmap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/induce-vs-handmap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13032 B |
| Lines | 264 |
| Hash | df7987470842 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPORT_SCHEMA | const | 37 | yes | export const REPORT_SCHEMA = &#39;capture-studio.induce-vs-handmap/1&#39;; |
| EVENT_CAP | const | 38 | no | const EVENT_CAP = 20000; |
| CATEGORIES | const | 39 | no | const CATEGORIES = [&#39;open&#39;, &#39;append&#39;, &#39;close&#39;, &#39;ignore&#39;, &#39;all&#39;]; |
| EXIT_OK | const | 40 | no | const EXIT_OK = 0; |
| EXIT_ERROR | const | 41 | no | const EXIT_ERROR = 1; |
| EXIT_USAGE | const | 42 | no | const EXIT_USAGE = 2; |
| EXIT_WRITE | const | 43 | no | const EXIT_WRITE = 4; |
| USAGE | const | 45 | no | const USAGE = [ |
| r3 | function | 54 | no | const r3 = (x) =&gt; Math.round(x * 1000) / 1000; |
| assembledChars | function | 55 | no | const assembledChars = (r) =&gt; r.components.reduce((a, c) =&gt; a + (typeof c.text === &#39;string&#39; ? c.text.length : 0), 0); |
| assembledText | function | 57 | no | const assembledText = (r) =&gt; r.components.map((c) =&gt; c.text).join(&#39;&#39;); |
| mean | function | 59 | no | function mean(xs) { return xs.length ? r3(xs.reduce((a, b) =&gt; a + b, 0) / xs.length) : null; } |
| min | function | 60 | no | function min(xs) { return xs.length ? Math.min(...xs) : null; } |
| max | function | 61 | no | function max(xs) { return xs.length ? Math.max(...xs) : null; } |
| surveySession | function | 63 | yes | export async function surveySession(dir, { eventCap = EVENT_CAP, listMismatches = false } = {}) { |
| reducer | const | 64 | no | const reducer = new StreamReducer({ deltaDialect: &#39;auto&#39;, keepEvents: true, maxEventsPerStream: eventCap }); |
| summary | const | 69 | no | const summary = reducer.summary(); |
| streams | const | 70 | no | const streams = []; |
| events | const | 73 | no | const events = reducer.eventsOf(st.sid); |
| det | const | 75 | no | const det = detectStreamMap(events); |
| hand | const | 78 | no | const hand = applyStreamMap(det.map, events); |
| induced | variable | 79 | no | let induced; |
| cmp | variable | 80 | no | let cmp; |
| inducedResult | variable | 81 | no | let inducedResult; |
| threw | variable | 82 | no | let threw = false; |
| equal | const | 90 | no | const equal = !threw &amp;&amp; assembledText(inducedResult) === assembledText(hand); |
| charsEqual | const | 91 | no | const charsEqual = !threw &amp;&amp; assembledChars(inducedResult) === assembledChars(hand); |
| row | const | 92 | no | const row = { |
| hostOf | function | 111 | no | function hostOf(meta) { |
| aggregate | function | 115 | yes | export function aggregate(sessions) { |
| streams | const | 116 | no | const streams = sessions.filter((s) =&gt; s.status === &#39;ok&#39;).flatMap((s) =&gt; s.streams); |
| byMap | const | 117 | no | const byMap = {}; |
| overlap | const | 118 | no | const overlap = Object.fromEntries(CATEGORIES.map((c) =&gt; [c, []])); |
| reasons | const | 119 | no | const reasons = {}; |
| uncertain | variable | 120 | no | let uncertain = 0; |
| b | const | 122 | no | const b = byMap[s.mapId] ?? (byMap[s.mapId] = { streams: 0, assembledEqual: 0, overlap: Object.fromEntries(CATEGORIES.map((c) =&gt; [c, []])) }); |
| stat | function | 134 | no | const stat = (xs) =&gt; ({ mean: mean(xs), min: min(xs), max: max(xs) }); |
| byMapOut | const | 135 | no | const byMapOut = {}; |
| b | const | 137 | no | const b = byMap[id]; |
| runSurvey | function | 161 | yes | export async function runSurvey({ dataDir = defaultDataDir(), session = null, all = false, limit = null, listMismatches = false } = {}) { |
| root | const | 162 | no | const root = path.resolve(dataDir); |
| sessionsDir | const | 168 | no | const sessionsDir = dataPaths(root).sessions; |
| targets | variable | 169 | no | let targets; |
| ids | const | 171 | no | const ids = existsSync(sessionsDir) |
| dir | const | 178 | no | const dir = path.join(sessionsDir, session); |
| before | const | 183 | no | const before = snapshotSessionDirs(targets); |
| sessions | const | 184 | no | const sessions = []; |
| streams | const | 187 | no | const streams = await surveySession(t.dir, { listMismatches }); |
| host | variable | 188 | no | let host = null; |
| after | const | 195 | no | const after = snapshotSessionDirs(targets); |
| writes | const | 196 | no | const writes = diffSnapshots(before, after); |
| render | function | 212 | no | function render(report) { |
| a | const | 213 | no | const a = report.aggregate; |
| fmt | function | 214 | no | const fmt = (s) =&gt; (s.mean === null ? &#39;-&#39; : `${s.mean} (${s.min}..${s.max})`); |
| lines | const | 215 | no | const lines = []; |
| main | function | 227 | yes | export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) { |
| args | variable | 228 | no | let args; |
| listMismatches | const | 231 | no | const listMismatches = argv.includes(&#39;--list-mismatches&#39;); |
| result | variable | 239 | no | let result; |
| json | const | 255 | no | const json = `${JSON.stringify(result.report, null, 2)}\\n`; |
| isMain | const | 261 | no | const isMain = process.argv[1] &amp;&amp; pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |
| node:url | import | 26 | external |
| ../src/config.mjs | import | 27 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/store/raw-index.mjs | import | 28 | [studio/src/store/raw-index.mjs](../src/store/raw-index.mjs.md) |
| ../src/replay/reducer.mjs | import | 29 | [studio/src/replay/reducer.mjs](../src/replay/reducer.mjs.md) |
| ../src/profiles/stream-map.mjs | import | 30 | [studio/src/profiles/stream-map.mjs](../src/profiles/stream-map.mjs.md) |
| ../src/profiles/stream-map-induce.mjs | import | 31 | [studio/src/profiles/stream-map-induce.mjs](../src/profiles/stream-map-induce.mjs.md) |
| ./fidelity-survey.mjs | import | 32 | [studio/scripts/fidelity-survey.mjs](./fidelity-survey.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Induced-map vs hand-map survey (READ-ONLY over saved sessions).
//
// For every saved session stream where a built-in hand-written stream map matched, this tool
// induces a map from the same decoded events and reports how the two compare. Output is counts
// and booleans only: no message text, no URL paths or query strings, no titles, no headers, no
// cookies, no site names. Nothing is written into the data directory and nothing is derived,
// captured, or sent over a network.
//
// The write proof is the same one scripts/fidelity-survey.mjs uses: every touched session folder
// is snapshotted (kind/size/mtime per file) before and after the run, and any difference prints
// "WRITE DETECTED <path>" and exits 4 with no report.
//
// Usage:
//   node scripts/induce-vs-handmap.mjs [--data-dir DIR] (--session ID | --all) [--limit N]
//                                     [--json] [--list-mismatches]
//
// Metrics (all numbers, no pass/fail threshold):
//   overlap.<category>   Dice of the SELECTORS (op + when) of induced vs hand rules, per category
//   assembledEqual       the induced map's concatenated component text equals the hand map's
//   charsEqual           the two assembled texts have the same length (weaker than text equality)
//   unexplained          clusters the induction could not express (reason labels, counts)
//   rules                induced rule count for the stream
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defaultDataDir, dataPaths } from '../src/config.mjs';
import { iterateRaw } from '../src/store/raw-index.mjs';
import { StreamReducer } from '../src/replay/reducer.mjs';
import { detectStreamMap, applyStreamMap } from '../src/profiles/stream-map.mjs';
import { induceStreamMap, compareMaps } from '../src/profiles/stream-map-induce.mjs';
import {
  snapshotSessionDirs, diffSnapshots, assertNotRepoCheckout, parseArgs,
  UsageError, GuardError, errorClassOf,
} from './fidelity-survey.mjs';

export const REPORT_SCHEMA = 'capture-studio.induce-vs-handmap/1';
const EVENT_CAP = 20000;
const CATEGORIES = ['open', 'append', 'close', 'ignore', 'all'];
const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const EXIT_WRITE = 4;

const USAGE = [
  'Usage: node scripts/induce-vs-handmap.mjs [--data-dir DIR] (--session ID | --all) [--limit N] [--json] [--list-mismatches]',
  '  --session ID       one session folder (read-only)',
  '  --all              every session folder; --limit N keeps the first N',
  '  --json             print the counts-only JSON report to stdout',
  '  --list-mismatches  add one row per stream whose assembled text differs (counts only)',
  '',
].join('\n');

const r3 = (x) => Math.round(x * 1000) / 1000;
const assembledChars = (r) => r.components.reduce((a, c) => a + (typeof c.text === 'string' ? c.text.length : 0), 0);
// The assembled text is compared, never printed or stored.
const assembledText = (r) => r.components.map((c) => c.text).join('');

function mean(xs) { return xs.length ? r3(xs.reduce((a, b) => a + b, 0) / xs.length) : null; }
function min(xs) { return xs.length ? Math.min(...xs) : null; }
function max(xs) { return xs.length ? Math.max(...xs) : null; }

export async function surveySession(dir, { eventCap = EVENT_CAP, listMismatches = false } = {}) {
  const reducer = new StreamReducer({ deltaDialect: 'auto', keepEvents: true, maxEventsPerStream: eventCap });
  for await (const rec of iterateRaw(path.join(dir, 'raw'), { useIndex: false })) {
    if (!rec || typeof rec !== 'object' || rec.k === 'corrupt') continue;
    reducer.ingest(rec);
  }
  const summary = reducer.summary();
  const streams = [];
  for (const st of summary.streams) {
    if (st.kind === 'ws') continue; // websocket streams are not stream-mapped
    const events = reducer.eventsOf(st.sid);
    if (!events.length) continue;
    const det = detectStreamMap(events);
    if (!det.map) continue;

    const hand = applyStreamMap(det.map, events);
    let induced;
    let cmp;
```

_First 80 of 265 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
