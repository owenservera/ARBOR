# File: studio/scripts/proto-field-search.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/proto-field-search.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 31494 B |
| Lines | 744 |
| Hash | 18b5556b3146 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GuardError | export | 61 | yes | export { UsageError, GuardError } |
| UsageError | export | 61 | yes | export { UsageError, GuardError } |
| SCHEMA | const | 63 | yes | export const SCHEMA = &#39;capture-studio.proto-field-search/1&#39;; |
| STRING_CAP | const | 64 | yes | export const STRING_CAP = 1 &lt;&lt; 20; |
| FRAME_CAP | const | 65 | yes | export const FRAME_CAP = 50000; |
| PATH_CAP | const | 66 | yes | export const PATH_CAP = 500; |
| INFLATE_CAP | const | 67 | yes | export const INFLATE_CAP = 64 &lt;&lt; 20; |
| TOP_N | const | 68 | yes | export const TOP_N = 5; |
| COMBO_N | const | 69 | yes | export const COMBO_N = 3; |
| COVERED_MIN | const | 70 | yes | export const COVERED_MIN = 0.95; |
| MATCH_MIN | const | 71 | yes | export const MATCH_MIN = NEAR_THRESHOLD; |
| AGGREGATIONS | const | 72 | yes | export const AGGREGATIONS = [&#39;last&#39;, &#39;longest&#39;, &#39;concat&#39;, &#39;concatDistinct&#39;, &#39;chain&#39;, &#39;unionAll&#39;]; |
| MIME_RE | const | 73 | yes | export const MIME_RE = /connect\\+proto\|grpc\|protobuf/i; |
| METHOD_NAMES | const | 75 | no | const METHOD_NAMES = [&#39;gzip&#39;, &#39;inflate&#39;, &#39;inflateRaw&#39;, &#39;brotli&#39;]; |
| KNOWN_FLAGS | const | 76 | no | const KNOWN_FLAGS = 0x01 \| 0x02 \| 0x80; |
| FLAG_COMPRESSED | const | 77 | no | const FLAG_COMPRESSED = 0x01; |
| SESSION_ID_RE | const | 78 | no | const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/; |
| EXIT_OK | const | 79 | no | const EXIT_OK = 0; |
| EXIT_ERROR | const | 80 | no | const EXIT_ERROR = 1; |
| EXIT_USAGE | const | 81 | no | const EXIT_USAGE = 2; |
| EXIT_WRITE | const | 82 | no | const EXIT_WRITE = 4; |
| RANK_LIMIT | const | 83 | no | const RANK_LIMIT = 20; |
| USAGE | const | 85 | no | const USAGE = [ |
| r3 | function | 95 | no | const r3 = (x) =&gt; Math.round(x * 1000) / 1000; |
| bump | function | 96 | no | const bump = (obj, key) =&gt; { obj[key] = (obj[key] ?? 0) + 1; }; |
| sha1 | function | 97 | no | const sha1 = (s) =&gt; createHash(&#39;sha1&#39;).update(s).digest(&#39;hex&#39;); |
| stripIdx | function | 98 | no | const stripIdx = (p) =&gt; p.replace(/\\[\\d+\\]/g, &#39;&#39;); |
| AGG_INDEX | const | 99 | no | const AGG_INDEX = Object.fromEntries(AGGREGATIONS.map((a, i) =&gt; [a, i])); |
| DECOMPRESSORS | const | 102 | no | const DECOMPRESSORS = { |
| inflateFrame | function | 110 | yes | export function inflateFrame(payload) { |
| tokenDice | function | 119 | yes | export function tokenDice(a, b) { |
| A | const | 120 | no | const A = a.split(&#39; &#39;).filter(Boolean); |
| B | const | 121 | no | const B = b.split(&#39; &#39;).filter(Boolean); |
| counts | const | 123 | no | const counts = new Map(); |
| common | variable | 125 | no | let common = 0; |
| c | const | 127 | no | const c = counts.get(t) ?? 0; |
| coverageOf | function | 134 | yes | export function coverageOf(domTokens, tokenSet) { |
| hit | variable | 136 | no | let hit = 0; |
| bestAgainstTurns | function | 142 | no | function bestAgainstTurns(text, domNorms) { |
| norm | const | 143 | no | const norm = normalizeForJoin(text); |
| best | variable | 145 | no | let best = null; |
| dice | const | 147 | no | const dice = tokenDice(norm, dn); |
| newAcc | function | 156 | no | const newAcc = () =&gt; ({ s: &#39;&#39;, n: 0, capped: false }); |
| appendCapped | function | 158 | no | function appendCapped(acc, piece, sep = &#39;&#39;) { |
| add | const | 160 | no | const add = (acc.n &gt; 0 ? sep : &#39;&#39;) + piece; |
| room | const | 161 | no | const room = STRING_CAP - acc.s.length; |
| setCapped | function | 171 | no | function setCapped(acc, text) { |
| addDistinct | function | 177 | no | function addDistinct(st, text) { |
| prev | const | 178 | no | const prev = st.prev; |
| addChain | function | 185 | no | function addChain(acc, text) { |
| PathStats | class | 194 | no | class PathStats { |
| constructor | method | 195 | yes | constructor() { |
| add | method | 208 | yes | add(text, streamTokens) { |
| h | const | 215 | no | const h = sha1(text); |
| value | method | 226 | yes | value(agg) { |
| StreamStats | class | 240 | no | class StreamStats { |
| constructor | method | 241 | yes | constructor() { |
| add | method | 247 | yes | add(p, text) { |
| ps | variable | 248 | no | let ps = this.paths.get(p); |
| StreamDecoder | class | 262 | yes | export class StreamDecoder { |
| constructor | method | 263 | yes | constructor({ onString = () =&gt; {} } = {}) { |
| push | method | 278 | yes | push(buf) { |
| joined | const | 283 | no | const joined = this.pending.length === 1 ? this.pending[0] : Buffer.concat(this.pending, this.pendingLen); |
| r | const | 286 | no | const r = splitEnvelopes(joined); |
| left | const | 292 | no | const left = Buffer.from(r.leftover); |
| flags | const | 295 | no | const flags = left[0]; |
| len | const | 296 | no | const len = left.readUInt32BE(1); |
| frame | method | 306 | yes | frame(f) { |
| idx | const | 308 | no | const idx = this.frames++; |
| payload | variable | 311 | no | let payload = f.payload; |
| got | const | 314 | no | const got = inflateFrame(payload); |
| r | const | 319 | no | const r = decodeProtobuf(payload); |
| top | const | 321 | no | const top = r.ok ? r.tree : r.partial; |
| text | variable | 323 | no | let text = s.text; |
| canon | function | 340 | no | function canon(p) { |
| r | variable | 341 | no | let r = path.resolve(p); |
| readSessionMeta | function | 348 | no | function readSessionMeta(dir) { |
| p | const | 349 | no | const p = path.join(dir, &#39;session.json&#39;); |
| meta | const | 351 | no | const meta = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| readDomTurns | function | 356 | no | function readDomTurns(dir) { |
| p | const | 357 | no | const p = path.join(dir, &#39;kv&#39;, &#39;DOM_TURNS.json&#39;); |
| v | const | 359 | no | const v = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| hostOf | function | 363 | no | function hostOf(meta) { |
| hostMatches | function | 367 | no | function hostMatches(siteHost, host) { |
| scanStreamKinds | function | 373 | no | async function scanStreamKinds(rawDir) { |
| streams | const | 374 | no | const streams = new Map(); |
| get | function | 375 | no | const get = (sid) =&gt; { |
| e | variable | 376 | no | let e = streams.get(sid); |
| e | const | 382 | no | const e = get(rec.sid); |
| feedStreams | function | 391 | no | async function feedStreams(rawDir, plan, decoders) { |
| summarizeStream | function | 402 | no | function summarizeStream(st, dstats, domNorms, domTokens) { |
| pathCoverage | const | 404 | no | const pathCoverage = new Map(); |
| entries | const | 405 | no | const entries = []; |
| text | const | 409 | no | const text = ps.value(agg); |
| best | const | 410 | no | const best = bestAgainstTurns(text, domNorms); |
| byCoverageThenPath | function | 422 | no | const byCoverageThenPath = (a, b) =&gt; b[1] - a[1] \|\| (a[0] &lt; b[0] ? -1 : a[0] &gt; b[0] ? 1 : 0); |
| rankEntries | function | 425 | no | function rankEntries(sums) { |
| best | const | 426 | no | const best = new Map(); |
| pathCov | const | 427 | no | const pathCov = new Map(); |
| k | const | 431 | no | const k = `${e.path}\|${e.aggregation}`; |
| cur | const | 432 | no | const cur = best.get(k); |
| searchSession | function | 452 | yes | export async function searchSession(dir, id, { host = null } = {}) { |
| meta | const | 453 | no | const meta = readSessionMeta(dir); |
| siteHost | const | 454 | no | const siteHost = hostOf(meta); |
| assistant | const | 456 | no | const assistant = readDomTurns(dir).filter((t) =&gt; normalizeRole(t?.role) === &#39;assistant&#39;); |
| domNorms | const | 458 | no | const domNorms = assistant.map((t) =&gt; normalizeForJoin(String(t?.text ?? &#39;&#39;))); |
| domTokens | const | 459 | no | const domTokens = domNorms.flatMap((n) =&gt; n.split(&#39; &#39;).filter(Boolean)); |
| domAssistantChars | const | 460 | no | const domAssistantChars = domNorms.reduce((a, n) =&gt; a + n.length, 0); |
| rawDir | const | 462 | no | const rawDir = path.join(dir, &#39;raw&#39;); |
| seen | const | 463 | no | const seen = await scanStreamKinds(rawDir); |
| plan | const | 464 | no | const plan = new Map(); |
| stats | const | 471 | no | const stats = new Map(); |
| decoders | const | 472 | no | const decoders = new Map(); |
| st | const | 474 | no | const st = new StreamStats(); |
| sums | const | 479 | no | const sums = new Map(); |
| comboPlan | const | 485 | no | const comboPlan = new Map(); |
| comboPaths | const | 486 | no | const comboPaths = new Map(); |
| top | const | 488 | no | const top = [...sum.pathCoverage].filter(([, c]) =&gt; c &gt; 0).sort(byCoverageThenPath) |
| comboDecoders | const | 492 | no | const comboDecoders = new Map(); |
| comboAcc | const | 493 | no | const comboAcc = new Map(); |
| set | const | 495 | no | const set = new Set(paths); |
| acc | const | 496 | no | const acc = newAcc(); |
| bestCombination | variable | 501 | no | let bestCombination = null; |
| norm | const | 503 | no | const norm = normalizeForJoin(acc.s); |
| best | const | 505 | no | const best = bestAgainstTurns(acc.s, domNorms); |
| cand | const | 506 | no | const cand = { |
| totals | const | 515 | no | const totals = { |
| decompressMethods | const | 519 | no | const decompressMethods = Object.fromEntries(METHOD_NAMES.map((m) =&gt; [m, 0])); |
| framesCapped | variable | 520 | no | let framesCapped = false; |
| streamCoverage | variable | 521 | no | let streamCoverage = 0; |
| d | const | 523 | no | const d = sum.stats; |
| median | function | 548 | no | function median(xs) { |
| v | const | 550 | no | const v = [...xs].sort((a, b) =&gt; a - b); |
| m | const | 551 | no | const m = v.length &gt;&gt; 1; |
| aggregate | function | 555 | yes | export function aggregate(sessions) { |
| ok | const | 556 | no | const ok = sessions.filter((s) =&gt; s.status === &#39;ok&#39;); |
| skipped | const | 557 | no | const skipped = {}; |
| errorClasses | const | 558 | no | const errorClasses = {}; |
| bestAggregation | const | 563 | no | const bestAggregation = Object.fromEntries(AGGREGATIONS.map((a) =&gt; [a, 0])); |
| pathRows | const | 564 | no | const pathRows = new Map(); |
| covered | variable | 565 | no | let covered = 0; |
| single | variable | 566 | no | let single = 0; |
| comboOnly | variable | 567 | no | let comboOnly = 0; |
| t0 | const | 569 | no | const t0 = s.top[0]; |
| bestSingle | const | 572 | no | const bestSingle = t0 ? t0.dice : 0; |
| bestCombo | const | 573 | no | const bestCombo = s.bestCombination ? s.bestCombination.dice : 0; |
| perPath | const | 576 | no | const perPath = new Map(); |
| row | variable | 579 | no | let row = pathRows.get(p); |
| pathsInTop | const | 585 | no | const pathsInTop = [...pathRows.values()] |
| m | const | 590 | no | const m = ok.length; |
| candidate | const | 591 | no | const candidate = pathsInTop[0]; |
| runSearch | function | 615 | yes | export async function runSearch({ dataDir = defaultDataDir(), session = null, all = false, host = null, out = null, _testHookAfterRead = null, } = {}) { |
| root | const | 618 | no | const root = path.resolve(dataDir); |
| sessionsDir | const | 624 | no | const sessionsDir = dataPaths(root).sessions; |
| targets | variable | 625 | no | let targets; |
| ids | const | 627 | no | const ids = existsSync(sessionsDir) |
| dir | const | 634 | no | const dir = path.join(sessionsDir, session); |
| before | const | 638 | no | const before = snapshotSessionDirs(targets); |
| sessions | const | 639 | no | const sessions = []; |
| after | const | 645 | no | const after = snapshotSessionDirs(targets); |
| writes | const | 646 | no | const writes = diffSnapshots(before, after); |
| report | const | 648 | no | const report = { |
| renderTable | function | 663 | no | function renderTable(report) { |
| head | const | 664 | no | const head = [&#39;ID&#39;, &#39;HOST&#39;, &#39;STREAMS&#39;, &#39;PROTO&#39;, &#39;FRAMES&#39;, &#39;UNDEC&#39;, &#39;COVER&#39;, &#39;BEST PATH&#39;, &#39;AGG&#39;, &#39;DICE&#39;, &#39;COMBO&#39;, &#39;STATUS&#39;]; |
| rows | const | 665 | no | const rows = [head]; |
| t0 | const | 669 | no | const t0 = s.top[0]; |
| widths | const | 676 | no | const widths = head.map((_, i) =&gt; Math.max(...rows.map((r) =&gt; r[i].length))); |
| lines | const | 677 | no | const lines = rows.map((r) =&gt; r.map((c, i) =&gt; c.padEnd(widths[i])).join(&#39; &#39;).trimEnd()); |
| a | const | 678 | no | const a = report.aggregate; |
| parseArgs | function | 685 | yes | export function parseArgs(argv) { |
| o | const | 686 | no | const o = { dataDir: null, session: null, all: false, host: null, out: null, json: false, help: false }; |
| need | function | 687 | no | const need = (flag, v) =&gt; { |
| a | variable | 692 | no | let a = argv[i]; |
| inline | variable | 693 | no | let inline; |
| val | function | 695 | no | const val = () =&gt; (inline !== undefined ? inline : argv[++i]); |
| main | function | 710 | yes | export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) { |
| args | variable | 711 | no | let args; |
| result | variable | 715 | no | let result; |
| json | const | 731 | no | const json = `${JSON.stringify(result.report, null, 2)}\\n`; |
| isMain | const | 741 | no | const isMain = process.argv[1] &amp;&amp; pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 45 | external |
| node:path | import | 46 | external |
| node:zlib | import | 47 | external |
| node:crypto | import | 48 | external |
| node:url | import | 49 | external |
| ../src/config.mjs | import | 50 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/store/raw-index.mjs | import | 51 | [studio/src/store/raw-index.mjs](../src/store/raw-index.mjs.md) |
| ../src/decode/protobuf.mjs | import | 52 | [studio/src/decode/protobuf.mjs](../src/decode/protobuf.mjs.md) |
| ../src/intel/join.mjs | import | 55 | [studio/src/intel/join.mjs](../src/intel/join.mjs.md) |
| ./fidelity-survey.mjs | import | 56 | [studio/scripts/fidelity-survey.mjs](./fidelity-survey.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Protobuf reply-field search (READ-ONLY).
//
// For each saved session that has an assistant turn in kv/DOM_TURNS.json and at least one stream whose
// response mime names connect+proto, grpc or protobuf, this tool:
//   1. reassembles each such stream's bytes from its raw chunk records (fallback: its body record),
//      splits Connect envelopes, decompresses compressed frames (gzip, inflate, inflateRaw, brotli, in
//      that order), decodes protobuf and collects every string leaf with its index-free path;
//   2. aggregates each path's occurrences six ways and scores each aggregate against every saved
//      assistant DOM turn (multiset token Dice, the metric of join.mjs near_match):
//        last            the last occurrence
//        longest         the longest occurrence (first one on ties)
//        concat          all occurrences joined in frame order
//        concatDistinct  occurrences joined in order, skipping one identical to the previous occurrence
//                        or already contained in the joined text
//        chain           a growth chain: an occurrence that starts with the chain replaces it (snapshots),
//                        one already contained is skipped, anything else is appended (deltas)
//        unionAll        every distinct occurrence joined in first-seen order
//   3. measures presence coverage: the share of DOM assistant tokens (with multiplicity) whose token
//      appears anywhere in the stream's strings, and in each path's strings alone;
//   4. tries the in-frame-order concatenation of the top COMBO_N paths of each stream by coverage.
//
// Usage:
//   node scripts/proto-field-search.mjs [--data-dir DIR] (--session ID | --all) [--host claude.ai]
//                                       [--out FILE] [--json]
//
// Guarantees:
//   * Never writes into the data directory. Raw records are read with iterateRaw(dir, { useIndex: false })
//     (read-only); kv/DOM_TURNS.json and session.json are read with readFileSync. No session store.
//   * Never derives, never opens a browser, never contacts a network.
//   * Snapshots the touched session folders before and after the run. Any change prints WRITE DETECTED
//     and exits 4 with no report.
//   * Refuses a data directory that is the repository checkout (or inside one) and an --out file inside
//     the data directory.
//   * Zero text in the report: session ids, host name, numbers, paths (digits and dots) and enum labels.
//     No string values, no URLs or query strings, no titles.
//   * Bounded memory: raw records stream one at a time. Per stream, a string is capped at STRING_CAP
//     characters, frames at FRAME_CAP, distinct paths at PATH_CAP, and each aggregate at STRING_CAP.
//   * Each session runs in its own try/catch; a bad session becomes status "error" with a class name.
//
// Thresholds (code constants): COVERED_MIN (presence coverage that counts as "covered") and MATCH_MIN
// (Dice that counts as "reconstructs the reply"; equal to join.mjs NEAR_THRESHOLD).
// Known limit: src/decode/protobuf.mjs classifies a string that also parses as a message with two or
// more fields as a message, so such a text is not a string leaf here.
import { readFileSync, readdirSync, existsSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defaultDataDir, dataPaths } from '../src/config.mjs';
import { iterateRaw } from '../src/store/raw-index.mjs';
import {
  splitEnvelopes, decodeProtobuf, protoStrings, DEFAULT_MAX_FRAME_BYTES,
} from '../src/decode/protobuf.mjs';
import { normalizeForJoin, normalizeRole, NEAR_THRESHOLD } from '../src/intel/join.mjs';
import {
  assertNotRepoCheckout, snapshotSessionDirs, diffSnapshots, errorClassOf, isInside,
  UsageError, GuardError,
} from './fidelity-survey.mjs';

export { UsageError, GuardError };

export const SCHEMA = 'capture-studio.proto-field-search/1';
export const STRING_CAP = 1 << 20;
export const FRAME_CAP = 50000;
export const PATH_CAP = 500;
export const INFLATE_CAP = 64 << 20;
export const TOP_N = 5;
export const COMBO_N = 3;
export const COVERED_MIN = 0.95;
export const MATCH_MIN = NEAR_THRESHOLD;
export const AGGREGATIONS = ['last', 'longest', 'concat', 'concatDistinct', 'chain', 'unionAll'];
export const MIME_RE = /connect\+proto|grpc|protobuf/i;

const METHOD_NAMES = ['gzip', 'inflate', 'inflateRaw', 'brotli'];
const KNOWN_FLAGS = 0x01 | 0x02 | 0x80;
const FLAG_COMPRESSED = 0x01;
const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/;
const EXIT_OK = 0;
const EXIT_ERROR = 1;
```

_First 80 of 745 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
