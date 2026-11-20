# File: studio/scripts/fidelity-survey.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/fidelity-survey.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 33483 B |
| Lines | 720 |
| Hash | bfbd2482f8da |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SURVEY_SCHEMA | const | 36 | yes | export const SURVEY_SCHEMA = &#39;capture-studio.fidelity-survey/1&#39;; |
| EVENT_CAP | const | 37 | yes | export const EVENT_CAP = 20000; |
| RANK_LIMIT | const | 38 | no | const RANK_LIMIT = 20; |
| EXIT_OK | const | 39 | no | const EXIT_OK = 0; |
| EXIT_ERROR | const | 40 | no | const EXIT_ERROR = 1; |
| EXIT_USAGE | const | 41 | no | const EXIT_USAGE = 2; |
| EXIT_WRITE | const | 42 | no | const EXIT_WRITE = 4; |
| SESSION_ID_RE | const | 43 | no | const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/; |
| SAFE_VIEW_PART | const | 45 | no | const SAFE_VIEW_PART = /^[A-Za-z_]+=[A-Za-z0-9_.\\/*:+-]{1,80}$/; |
| isInside | function | 72 | yes | export function isInside(child, parent) { |
| prefix | const | 74 | no | const prefix = parent.endsWith(path.sep) ? parent : parent + path.sep; |
| findGitRoots | function | 78 | yes | export function findGitRoots(start) { |
| out | const | 79 | no | const out = []; |
| d | variable | 80 | no | let d = path.resolve(start); |
| up | const | 83 | no | const up = path.dirname(d); |
| assertNotRepoCheckout | function | 91 | yes | export function assertNotRepoCheckout(dataDir, { toolRoot = TOOL_ROOT, gitRoots = findGitRoots(TOOL_ROOT) } = {}) { |
| target | const | 92 | no | const target = canon(dataDir); |
| walkInto | function | 103 | no | function walkInto(out, id, root, dir) { |
| ents | variable | 104 | no | let ents; |
| p | const | 107 | no | const p = path.join(dir, ent.name); |
| rel | const | 108 | no | const rel = `${id}/${path.relative(root, p).split(path.sep).join(&#39;/&#39;)}`; |
| st | variable | 109 | no | let st; |
| snapshotSessionDirs | function | 121 | yes | export function snapshotSessionDirs(sessions) { |
| out | const | 122 | no | const out = new Map(); |
| safeMtime | function | 130 | no | function safeMtime(p) { |
| diffSnapshots | function | 134 | yes | export function diffSnapshots(before, after) { |
| changes | const | 135 | no | const changes = []; |
| w | const | 138 | no | const w = after.get(k); |
| DICE_BUCKET_LABELS | const | 183 | no | const DICE_BUCKET_LABELS = [&#39;[0]&#39;, &#39;(0,0.5)&#39;, &#39;[0.5,0.8)&#39;, `[0.8,${NEAR_THRESHOLD})`, `[0.95,1]`]; |
| DIAGNOSES | const | 184 | no | const DIAGNOSES = [&#39;exact_after_normalization&#39;, &#39;prefix&#39;, &#39;near&#39;, &#39;similar&#39;, &#39;different&#39;, &#39;no_candidate&#39;]; |
| LIKELY_CAUSES | const | 185 | no | const LIKELY_CAUSES = [ |
| MARKDOWN_FEATURES | const | 190 | no | const MARKDOWN_FEATURES = [&#39;markdownLinks&#39;, &#39;markdownImages&#39;, &#39;fenceLines&#39;, &#39;tableRows&#39;, &#39;headingLines&#39;, &#39;bulletLines&#39;]; |
| PRIVATE_USE_RE | const | 191 | no | const PRIVATE_USE_RE = /[\\uE000-\\uF8FF]/g; |
| ZERO_WIDTH_RE | const | 192 | no | const ZERO_WIDTH_RE = /[\\u200B-\\u200D\\u2060\\uFEFF\\u00AD]/g; |
| MD_LINK_RE | const | 193 | no | const MD_LINK_RE = /(?&lt;!!)\\[[^\\]\\n]*\\]\\((?:[^()\\s]\|\\([^()\\s]*\\))*(?:\\s+&quot;[^&quot;]*&quot;)?\\)/g; |
| MD_IMAGE_RE | const | 194 | no | const MD_IMAGE_RE = /!\\[[^\\]\\n]*\\]\\((?:[^()\\s]\|\\([^()\\s]*\\))*(?:\\s+&quot;[^&quot;]*&quot;)?\\)/g; |
| CITATION_RE | const | 195 | no | const CITATION_RE = /\\[\\^?\\d+\\]\|【[^】\\n]*】/g; |
| HTML_ENTITY_RE | const | 196 | no | const HTML_ENTITY_RE = /&amp;(?:#x[0-9a-f]+\|#[0-9]+\|[a-z][a-z0-9]*);/gi; |
| HTML_TAG_RE | const | 197 | no | const HTML_TAG_RE = /&lt;\\/?[a-z][a-z0-9-]*(?:\\s[^&lt;&gt;]*)?\\/?&gt;/gi; |
| URL_RE | const | 198 | no | const URL_RE = /https?:\\/\\/[^\\s&lt;&gt;()[\\]&quot;&#39;]+/gi; |
| NEWLINE_RE | const | 199 | no | const NEWLINE_RE = /\\r\\n\|\\r\|\\n/g; |
| FENCE_LINE_RE | const | 200 | no | const FENCE_LINE_RE = /^[ \\t]*(?:`{3,}\|~{3,})/; |
| HEADING_LINE_RE | const | 201 | no | const HEADING_LINE_RE = /^[ \\t]*#{1,6}[ \\t]+/; |
| BULLET_LINE_RE | const | 202 | no | const BULLET_LINE_RE = /^[ \\t]*(?:[-*+]\|\\d+[.)])[ \\t]+/; |
| r3 | function | 204 | no | const r3 = (x) =&gt; Math.round(x * 1000) / 1000; |
| countOf | function | 205 | no | const countOf = (re, s) =&gt; (s.match(re) ?? []).length; |
| diceTokens | function | 208 | no | function diceTokens(a, b) { |
| A | const | 209 | no | const A = a.split(&#39; &#39;).filter(Boolean); |
| B | const | 210 | no | const B = b.split(&#39; &#39;).filter(Boolean); |
| counts | const | 212 | no | const counts = new Map(); |
| common | variable | 214 | no | let common = 0; |
| c | const | 216 | no | const c = counts.get(t) ?? 0; |
| diceBucket | function | 222 | no | function diceBucket(d) { |
| commonPrefixLen | function | 230 | no | function commonPrefixLen(a, b) { |
| n | const | 231 | no | const n = Math.min(a.length, b.length); |
| i | variable | 232 | no | let i = 0; |
| commonSuffixLen | function | 237 | no | function commonSuffixLen(a, b) { |
| n | const | 238 | no | const n = Math.min(a.length, b.length); |
| i | variable | 239 | no | let i = 0; |
| featureCounts | function | 245 | yes | export function featureCounts(raw) { |
| s | const | 246 | no | const s = String(raw ?? &#39;&#39;); |
| lines | const | 247 | no | const lines = s.split(/\\r\\n\|\\r\|\\n/); |
| cps | const | 248 | no | const cps = Array.from(s); |
| nonAscii | const | 249 | no | const nonAscii = cps.filter((c) =&gt; c.codePointAt(0) &gt; 0x7f).length; |
| likelyCauseOf | function | 269 | yes | export function likelyCauseOf({ diagnosis, streamFeat, domFeat, streamNorm, domNorm, lengthRatio }) { |
| more | function | 271 | no | const more = (k) =&gt; streamFeat[k] &gt; domFeat[k]; |
| diagnoseAssistantTurns | function | 284 | yes | export function diagnoseAssistantTurns(messages, turns) { |
| cands | const | 285 | no | const cands = []; |
| raw | const | 288 | no | const raw = String(m?.text ?? &#39;&#39;); |
| norm | const | 289 | no | const norm = normalizeForJoin(raw); |
| out | const | 293 | no | const out = []; |
| raw | const | 296 | no | const raw = String(t?.text ?? &#39;&#39;); |
| norm | const | 297 | no | const norm = normalizeForJoin(raw); |
| turnIndex | const | 298 | no | const turnIndex = Number.isInteger(t?.index) ? t.index : pos; |
| domChars | const | 299 | no | const domChars = norm.length; |
| blocks | const | 300 | no | const blocks = Array.isArray(t?.blocks) ? t.blocks.length : 0; |
| domFeat | const | 301 | no | const domFeat = featureCounts(raw); |
| best | variable | 309 | no | let best = null, runner = null; |
| dice | const | 311 | no | const dice = diceTokens(c.norm, norm); |
| s | const | 312 | no | const s = { c, dice }; |
| streamChars | const | 316 | no | const streamChars = best.c.norm.length; |
| lengthRatio | const | 317 | no | const lengthRatio = domChars &gt; 0 ? r3(streamChars / domChars) : null; |
| streamFeat | const | 318 | no | const streamFeat = featureCounts(best.c.raw); |
| diagnosis | variable | 319 | no | let diagnosis; |
| median | function | 346 | no | function median(xs) { |
| v | const | 348 | no | const v = [...xs].sort((a, b) =&gt; a - b); |
| mid | const | 349 | no | const mid = v.length &gt;&gt; 1; |
| aggregateDiagnostics | function | 354 | yes | export function aggregateDiagnostics(sessions) { |
| all | const | 355 | no | const all = []; |
| sessionsDiagnosed | variable | 356 | no | let sessionsDiagnosed = 0; |
| histogram | const | 362 | no | const histogram = Object.fromEntries(DICE_BUCKET_LABELS.map((k) =&gt; [k, 0])); |
| byDiagnosis | const | 363 | no | const byDiagnosis = Object.fromEntries(DIAGNOSES.map((k) =&gt; [k, 0])); |
| byLikelyCause | const | 364 | no | const byLikelyCause = Object.fromEntries(LIKELY_CAUSES.map((k) =&gt; [k, 0])); |
| ratios | const | 365 | no | const ratios = []; |
| bump | function | 392 | no | function bump(obj, key, n = 1) { obj[key] = (obj[key] ?? 0) + n; } |
| addInto | function | 394 | no | function addInto(total, counts) { |
| reasonLabel | function | 401 | yes | export function reasonLabel(reason) { |
| s | const | 402 | no | const s = String(reason ?? &#39;unknown&#39;); |
| m | const | 403 | no | const m = /^no_rule_matched: (.*)$/.exec(s); |
| parts | const | 405 | no | const parts = m[1].split(&#39; &#39;); |
| ok | const | 406 | no | const ok = parts.every((p) =&gt; SAFE_VIEW_PART.test(p)); |
| errorClassOf | function | 412 | yes | export function errorClassOf(e) { |
| code | const | 413 | no | const code = e?.code; |
| name | const | 415 | no | const name = e?.name; |
| hostOf | function | 420 | no | function hostOf(meta) { |
| readSessionMeta | function | 424 | no | function readSessionMeta(dir) { |
| p | const | 425 | no | const p = path.join(dir, &#39;session.json&#39;); |
| meta | const | 427 | no | const meta = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| readDomTurns | function | 433 | no | function readDomTurns(dir) { |
| p | const | 434 | no | const p = path.join(dir, &#39;kv&#39;, &#39;DOM_TURNS.json&#39;); |
| v | const | 436 | no | const v = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| surveySession | function | 440 | yes | export async function surveySession(dir, id, { eventCap = EVENT_CAP, diagnose = false } = {}) { |
| meta | const | 441 | no | const meta = readSessionMeta(dir); |
| reducer | const | 442 | no | const reducer = new StreamReducer({ deltaDialect: &#39;auto&#39;, keepEvents: true, maxEventsPerStream: eventCap }); |
| firstSeqBySid | const | 443 | no | const firstSeqBySid = new Map(); |
| rawRecords | variable | 444 | no | let rawRecords = 0, corruptRecords = 0, gapRecords = 0, bodyExcluded = 0, bodyTruncated = 0; |
| summary | const | 454 | no | const summary = reducer.summary(); |
| dialects | const | 455 | no | const dialects = {}, framings = {}, dialectFailures = {}, unmappedReasons = {}; |
| mapIds | const | 456 | no | const mapIds = new Set(); |
| mapCandidates | const | 457 | no | const mapCandidates = {}; |
| componentCount | variable | 458 | no | let componentCount = 0, unmappedCount = 0, eventsOmitted = 0, messageIdObserved = 0; |
| s | const | 461 | no | const s = reducer.streams.get(st.sid); |
| events | const | 462 | no | const events = reducer.eventsOf(st.sid); |
| det | const | 470 | no | const det = detectStreamMap(events); |
| r | const | 473 | no | const r = applyStreamMap(det.map, events); |
| messages | const | 484 | no | const messages = buildStreamMessages(reducer, { firstSeqBySid }); |
| assistantTextChars | const | 485 | no | const assistantTextChars = messages.reduce((a, m) =&gt; a + (m.text?.length ?? 0), 0); |
| turns | const | 486 | no | const turns = readDomTurns(dir); |
| joinStatusCounts | variable | 487 | no | let joinStatusCounts = null, blockLinkStatusCounts = null; |
| mapIdList | const | 493 | no | const mapIdList = [...mapIds]; |
| result | const | 494 | no | const result = { |
| errorEntry | function | 524 | no | function errorEntry(id, e) { |
| rank | function | 531 | no | function rank(obj, limit = RANK_LIMIT) { |
| aggregate | function | 538 | yes | export function aggregate(sessions, { diagnose = false } = {}) { |
| ok | const | 539 | no | const ok = sessions.filter((s) =&gt; s.status === &#39;ok&#39;); |
| sessionsByMapId | const | 540 | no | const sessionsByMapId = {}, dialectCounts = {}, framingCounts = {}, unmapped = {}, failures = {}; |
| errorClasses | const | 541 | no | const errorClasses = {}; |
| joinStatusTotals | variable | 542 | no | let joinStatusTotals = null, blockLinkStatusTotals = null, sessionsWithDomTurns = 0, eventsOmittedTotal = 0; |
| out | const | 559 | no | const out = { |
| runSurvey | function | 581 | yes | export async function runSurvey({ dataDir = defaultDataDir(), session = null, all = false, limit = null, out = null, eventCap = EVENT_CAP, diagnose = false, _testHookAfterRead = null, } = {}) { |
| root | const | 585 | no | const root = path.resolve(dataDir); |
| sessionsDir | const | 592 | no | const sessionsDir = dataPaths(root).sessions; |
| targets | variable | 593 | no | let targets; |
| ids | const | 595 | no | const ids = existsSync(sessionsDir) |
| dir | const | 602 | no | const dir = path.join(sessionsDir, session); |
| before | const | 606 | no | const before = snapshotSessionDirs(targets); |
| sessions | const | 607 | no | const sessions = []; |
| after | const | 613 | no | const after = snapshotSessionDirs(targets); |
| writes | const | 614 | no | const writes = diffSnapshots(before, after); |
| report | const | 616 | no | const report = { |
| renderTable | function | 627 | no | function renderTable(report) { |
| head | const | 628 | no | const head = [&#39;ID&#39;, &#39;HOST&#39;, &#39;RAW&#39;, &#39;COMPLETE&#39;, &#39;STREAMS&#39;, &#39;MAP&#39;, &#39;COMP&#39;, &#39;UNMAP&#39;, &#39;JOIN v/p/a&#39;, &#39;STATUS&#39;]; |
| rows | const | 629 | no | const rows = [head]; |
| j | const | 632 | no | const j = s.joinStatusCounts; |
| widths | const | 639 | no | const widths = head.map((_, i) =&gt; Math.max(...rows.map((r) =&gt; r[i].length))); |
| lines | const | 640 | no | const lines = rows.map((r) =&gt; r.map((c, i) =&gt; c.padEnd(widths[i])).join(&#39; &#39;).trimEnd()); |
| a | const | 641 | no | const a = report.aggregate; |
| d | const | 648 | no | const d = a.diagnostics; |
| parseArgs | function | 655 | yes | export function parseArgs(argv) { |
| o | const | 656 | no | const o = { dataDir: null, session: null, all: false, limit: null, out: null, json: false, diagnose: false, help: false }; |
| need | function | 657 | no | const need = (flag, v) =&gt; { |
| a | variable | 662 | no | let a = argv[i]; |
| inline | variable | 663 | no | let inline; |
| val | function | 665 | no | const val = () =&gt; (inline !== undefined ? inline : argv[++i]); |
| n | const | 671 | no | const n = Number(need(a, val())); |
| main | function | 686 | yes | export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) { |
| args | variable | 687 | no | let args; |
| result | variable | 691 | no | let result; |
| json | const | 707 | no | const json = `${JSON.stringify(result.report, null, 2)}\\n`; |
| isMain | const | 717 | no | const isMain = process.argv[1] &amp;&amp; pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 26 | external |
| node:path | import | 27 | external |
| node:url | import | 28 | external |
| ../src/config.mjs | import | 29 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/store/raw-index.mjs | import | 30 | [studio/src/store/raw-index.mjs](../src/store/raw-index.mjs.md) |
| ../src/replay/reducer.mjs | import | 31 | [studio/src/replay/reducer.mjs](../src/replay/reducer.mjs.md) |
| ../src/profiles/stream-map.mjs | import | 32 | [studio/src/profiles/stream-map.mjs](../src/profiles/stream-map.mjs.md) |
| ../src/replay/stream-messages.mjs | import | 33 | [studio/src/replay/stream-messages.mjs](../src/replay/stream-messages.mjs.md) |
| ../src/intel/join.mjs | import | 34 | [studio/src/intel/join.mjs](../src/intel/join.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/categorization-scoreboard.mjs](./categorization-scoreboard.mjs.md) | ./fidelity-survey.mjs |
| [studio/scripts/induce-vs-handmap.mjs](./induce-vs-handmap.mjs.md) | ./fidelity-survey.mjs |
| [studio/scripts/proto-field-search.mjs](./proto-field-search.mjs.md) | ./fidelity-survey.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Real-session fidelity survey (READ-ONLY).
//
// Replays each saved session's raw log IN MEMORY through the product's own modules and reports,
// per session, how the stream-to-component pipeline sees it: framings, dialects, the detected
// stream map, component/unmapped counts, and the stream-to-DOM join against the saved DOM_TURNS.
//
// Usage:
//   node scripts/fidelity-survey.mjs [--data-dir DIR] (--session ID | --all) [--limit N]
//                                    [--out FILE] [--json] [--diagnose]
//
// Guarantees:
//   * Never writes into the data directory. The session is NOT opened through store/session.mjs,
//     because its constructor creates kv/ and Dataset constructors create folders. Raw segments are
//     read with store/raw-index.mjs iterateRaw (read-only) and kv/DOM_TURNS.json with readFileSync.
//   * Never derives, never opens a browser, never contacts a network.
//   * Snapshots every touched session directory (relative path, kind, size, mtime) before and after
//     the run. Any difference prints "WRITE DETECTED <path>" and exits 4 with no report.
//   * Refuses a data directory that is the repository checkout (or inside one), and refuses an
//     --out file inside the data directory.
//   * The report is shareable: counts, ids, host only, enum labels. No message text, no URL paths
//     or query strings, no titles, no headers, no cookies.
//   * Each session is isolated in try/catch. A bad session becomes status "error" with a class name.
//   * Per stream, at most EVENT_CAP decoded events stay in memory; evictions are reported as
//     eventsOmitted. Raw records are streamed one at a time, never loaded whole.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defaultDataDir, dataPaths, TOOL_ROOT } from '../src/config.mjs';
import { iterateRaw } from '../src/store/raw-index.mjs';
import { StreamReducer } from '../src/replay/reducer.mjs';
import { detectStreamMap, applyStreamMap } from '../src/profiles/stream-map.mjs';
import { buildStreamMessages } from '../src/replay/stream-messages.mjs';
import { joinStreamToDom, normalizeForJoin, normalizeRole, NEAR_THRESHOLD } from '../src/intel/join.mjs';

export const SURVEY_SCHEMA = 'capture-studio.fidelity-survey/1';
export const EVENT_CAP = 20000;
const RANK_LIMIT = 20;
const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const EXIT_WRITE = 4;
const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/;
// Reason labels are shown in the shareable report; anything not shaped like a schema label is redacted.
const SAFE_VIEW_PART = /^[A-Za-z_]+=[A-Za-z0-9_.\/*:+-]{1,80}$/;
const SAFE_LABEL = /^[A-Za-z0-9_.:\/=,*+ -]{1,120}$/;

const USAGE = [
  'Usage: node scripts/fidelity-survey.mjs [--data-dir DIR] (--session ID | --all) [--limit N] [--out FILE] [--json] [--diagnose]',
  '  --session ID   survey one session folder (read-only)',
  '  --all          survey every session folder, newest name first; --limit N keeps the first N',
  '  --out FILE     also write the JSON report to FILE (refused inside the data directory)',
  '  --json         print the JSON report to stdout (default: table on stderr)',
  '  --diagnose     add per-assistant-turn join diagnostics (counts and numbers only; no text)',
  '',
].join('\n');

export class UsageError extends Error {}
export class GuardError extends Error {}

// ---------------------------------------------------------------------------------------------
// Path guards
// ---------------------------------------------------------------------------------------------
function canon(p) {
  let r = path.resolve(p);
  try { r = realpathSync(r); } catch {
    try { r = path.join(realpathSync(path.dirname(r)), path.basename(r)); } catch { /* keep resolved */ }
  }
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

export function isInside(child, parent) {
  if (child === parent) return true;
  const prefix = parent.endsWith(path.sep) ? parent : parent + path.sep;
  return child.startsWith(prefix);
}

export function findGitRoots(start) {
  const out = [];
  let d = path.resolve(start);
```

_First 80 of 721 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
