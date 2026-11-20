# File: studio/src/capture/acceptance.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/acceptance.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26458 B |
| Lines | 438 |
| Hash | 669b374a548f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACCEPTANCE_SCHEMA | const | 29 | yes | export const ACCEPTANCE_SCHEMA = &#39;capture-studio.acceptance/1&#39;; |
| EVALUATOR_VERSION | const | 33 | yes | export const EVALUATOR_VERSION = &#39;1.1.0&#39;; |
| DEFAULT_RECIPE | const | 34 | yes | export const DEFAULT_RECIPE = Object.freeze({ id: &#39;clean-data-gate&#39;, version: 1 }); |
| GATE_IDS | const | 35 | yes | export const GATE_IDS = Object.freeze([&#39;G1&#39;, &#39;G2&#39;, &#39;G3&#39;, &#39;G4&#39;, &#39;G5&#39;, &#39;G6&#39;, &#39;G7&#39;]); |
| VERDICTS | const | 36 | yes | export const VERDICTS = Object.freeze([&#39;capture_accepted&#39;, &#39;capture_rejected&#39;, &#39;capture_incomplete&#39;, &#39;unassessed&#39;]); |
| GATE_VALUES | const | 37 | no | const GATE_VALUES = new Set([&#39;passed&#39;, &#39;failed&#39;, &#39;not-checked&#39;, &#39;unknown&#39;]); |
| ACCEPTANCE_FILE | const | 38 | no | const ACCEPTANCE_FILE = &#39;acceptance.json&#39;; |
| RAW_SEGMENT | const | 39 | no | const RAW_SEGMENT = /^\\d{6}\\.jsonl$/; |
| gate | function | 41 | no | const gate = (value, reason, evidence = {}) =&gt; ({ value, reason, evidence }); |
| notChecked | function | 42 | no | const notChecked = (reason, evidence) =&gt; gate(&#39;not-checked&#39;, reason, evidence); |
| unknown | function | 43 | no | const unknown = (reason, evidence) =&gt; gate(&#39;unknown&#39;, reason, evidence); |
| isKnownRecipe | function | 45 | no | const isKnownRecipe = (recipe) =&gt; !!recipe &amp;&amp; recipe.id === DEFAULT_RECIPE.id &amp;&amp; recipe.version === DEFAULT_RECIPE.version; |
| domDigest | function | 50 | yes | export function domDigest(session) { |
| rawDigest | function | 54 | yes | export function rawDigest(session) { |
| rawDir | const | 55 | no | const rawDir = session.rawDir; |
| names | const | 57 | no | const names = readdirSync(rawDir).filter((f) =&gt; RAW_SEGMENT.test(f) \|\| f === &#39;manifest.json&#39;).sort(); |
| files | const | 58 | no | const files = names.map((file) =&gt; { const buf = readFileSync(path.join(rawDir, file)); return { file, bytes: buf.length, sha256: sha256Hex(buf) }; }); |
| buf | const | 59 | no | const buf = readFileSync(path.join(rawDir, file)); |
| scanRaw | function | 68 | no | async function scanRaw(session) { |
| out | const | 69 | no | const out = { records: 0, firstSeq: null, lastSeq: null, gapRecords: 0, bodyExcluded: 0, bodyTruncated: 0, corrupt: 0, streams: new Map() }; |
| stream | function | 70 | no | const stream = (sid) =&gt; { let e = out.streams.get(sid); if (!e) out.streams.set(sid, (e = { done: false, fail: false })); return e; }; |
| replyText | function | 85 | no | async function replyText(session) { |
| assembled | const | 86 | no | const assembled = session.kv.get(&#39;ASSEMBLED&#39;, null); |
| sids | const | 87 | no | const sids = assembled &amp;&amp; typeof assembled === &#39;object&#39; ? Object.keys(assembled) : []; |
| best | variable | 88 | no | let best = null; |
| errors | const | 89 | no | const errors = []; |
| t | const | 92 | no | const t = await streamText(session, sid, { useLocator: false }); |
| text | const | 93 | no | const text = typeof t.assembledText === &#39;string&#39; ? t.assembledText : &#39;&#39;; |
| streamed | const | 96 | no | const streamed = (assembled[sid]?.revisions ?? 0) &gt; 1; |
| norm | function | 107 | no | const norm = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| tokens | function | 108 | no | const tokens = (s) =&gt; String(s ?? &#39;&#39;).toLowerCase().split(/[^\\p{L}\\p{N}]+/u).filter(Boolean); |
| turnsOf | function | 109 | no | const turnsOf = (dom, role) =&gt; (Array.isArray(dom) ? dom : []).filter((t) =&gt; t &amp;&amp; t.role === role &amp;&amp; typeof t.text === &#39;string&#39;); |
| isBaseline | function | 113 | no | const isBaseline = (b) =&gt; !!b &amp;&amp; typeof b === &#39;object&#39; |
| gateG1 | function | 124 | no | function gateG1(conv, dom) { |
| users | const | 127 | no | const users = turnsOf(dom, &#39;user&#39;); |
| baseline | const | 129 | no | const baseline = conv.baseline; |
| matched | const | 136 | no | const matched = norm(users[baseline.userTurns].text) === norm(conv.prompt); |
| matched | const | 142 | no | const matched = norm(users.at(-1).text) === norm(conv.prompt); |
| gateG2 | function | 153 | no | function gateG2(conv, dom) { |
| replies | const | 156 | no | const replies = turnsOf(dom, &#39;assistant&#39;); |
| words | const | 158 | no | const words = conv.expectedReplyWords.flatMap((w) =&gt; tokens(w)); |
| baseline | const | 160 | no | const baseline = conv.baseline; |
| seen | const | 167 | no | const seen = tokens(replies[baseline.assistantTurns].text); |
| i | variable | 168 | no | let i = 0; |
| ok | const | 170 | no | const ok = i === words.length; |
| seen | const | 176 | no | const seen = tokens(replies.at(-1).text); |
| i | variable | 177 | no | let i = 0; |
| ok | const | 179 | no | const ok = i === words.length; |
| gateG3 | function | 188 | no | function gateG3(conv, reply, scan) { |
| rule | const | 190 | no | const rule = conv.completionRule; |
| stream | const | 195 | no | const stream = reply.best ? scan.streams.get(reply.best.sid) : null; |
| s | const | 200 | no | const s = scan.streams.get(reply.best.sid) ?? { done: false, fail: false }; |
| evidence | const | 201 | no | const evidence = { sid: reply.best.sid, done: s.done, fail: s.fail }; |
| gateG4 | function | 208 | no | function gateG4(session) { |
| status | const | 209 | no | const status = session.meta?.status; |
| gateG5 | function | 216 | no | function gateG5(v, scan) { |
| why | const | 217 | no | const why = []; |
| evidence | const | 224 | no | const evidence = { |
| gateG6 | function | 233 | no | function gateG6(session) { |
| ks | const | 234 | no | const ks = session.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| datasetPresent | const | 238 | no | const datasetPresent = session.dataset(&#39;entities&#39;).exists(); |
| evidence | const | 239 | no | const evidence = { status: ks.status, entityCount: ks.entityCount ?? null, entitiesDatasetPresent: datasetPresent }; |
| gateG7 | function | 254 | no | function gateG7(reply, dom) { |
| replies | const | 255 | no | const replies = turnsOf(dom, &#39;assistant&#39;); |
| r | const | 258 | no | const r = reconcileFinal(reply.best.text, replies.at(-1).text); |
| value | const | 259 | no | const value = r.status === &#39;consistent&#39; ? &#39;passed&#39; : r.status === &#39;insufficient_evidence&#39; ? &#39;unknown&#39; : &#39;failed&#39;; |
| deriveVerdict | function | 268 | no | function deriveVerdict(gates) { |
| values | const | 269 | no | const values = GATE_IDS.map((id) =&gt; gates?.[id]?.value); |
| unassessedGates | function | 275 | no | function unassessedGates(reason) { |
| unassessedDoc | function | 279 | no | function unassessedDoc({ evaluatedAt, binding, reasons }) { |
| why | const | 280 | no | const why = reasons.join(&#39;; &#39;); |
| evaluateAcceptance | function | 299 | yes | export async function evaluateAcceptance({ session, conversation = null, recipe = DEFAULT_RECIPE } = {}) { |
| evaluatedAt | const | 302 | no | const evaluatedAt = new Date().toISOString(); |
| recipeBinding | const | 303 | no | const recipeBinding = { id: recipe?.id ?? null, version: recipe?.version ?? null }; |
| emptyBinding | const | 304 | no | const emptyBinding = { rawDigest: null, seqRange: [null, null], recipe: recipeBinding }; |
| before | variable | 309 | no | let before, domBefore; |
| scan | variable | 313 | no | let scan, verify, reply; |
| after | variable | 321 | no | let after, domAfter; |
| dom | const | 330 | no | const dom = session.kv.get(&#39;DOM_TURNS&#39;, null); |
| gates | const | 331 | no | const gates = { |
| verdict | const | 340 | no | const verdict = deriveVerdict(gates); |
| reasons | const | 341 | no | const reasons = GATE_IDS.filter((id) =&gt; gates[id].value !== &#39;passed&#39;).map((id) =&gt; `${id} ${gates[id].value}: ${gates[id].reason}`); |
| acceptancePath | function | 350 | no | function acceptancePath(session) { |
| assertWritable | function | 354 | no | function assertWritable(doc) { |
| writeAcceptance | function | 363 | yes | export function writeAcceptance(session, doc) { |
| p | const | 365 | no | const p = acceptancePath(session); |
| tmp | const | 366 | no | const tmp = `${p}.${process.pid}.${randomBytes(4).toString(&#39;hex&#39;)}.tmp`; |
| fd | const | 367 | no | const fd = openSync(tmp, &#39;wx&#39;); |
| readAcceptance | function | 385 | yes | export function readAcceptance(session, { recipe = DEFAULT_RECIPE } = {}) { |
| unassessed | function | 386 | no | const unassessed = (reason, extra = {}) =&gt; ({ schema: ACCEPTANCE_SCHEMA, evaluator: { version: EVALUATOR_VERSION }, evaluatedAt: null, binding: null, gates: null, verdict: &#39;unassessed&#39;, reasons: [rea… |
| p | const | 391 | no | const p = acceptancePath(session); |
| stored | variable | 393 | no | let stored; |
| sb | const | 396 | no | const sb = stored.binding ?? null; |
| current | variable | 404 | no | let current; |
| domNow | variable | 408 | no | let domNow; |
| reuseAcceptedContext | function | 419 | yes | export function reuseAcceptedContext(previous, current) { |
| gates | const | 430 | no | const gates = { ...current.gates, G1: previous.gates.G1, |
| verdict | const | 432 | no | const verdict = deriveVerdict(gates); |
| reasons | const | 433 | no | const reasons = GATE_IDS.filter((id) =&gt; gates[id].value !== &#39;passed&#39;) |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 22 | external |
| node:path | import | 23 | external |
| node:crypto | import | 24 | external |
| ../store/integrity.mjs | import | 25 | [studio/src/store/integrity.mjs](../store/integrity.mjs.md) |
| ../intel/correlate.mjs | import | 26 | [studio/src/intel/correlate.mjs](../intel/correlate.mjs.md) |
| ../replay/derive.mjs | import | 27 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/live-e2e.mjs](../../scripts/live-e2e.mjs.md) | ../src/capture/acceptance.mjs |
| [studio/scripts/shape-atlas.mjs](../../scripts/shape-atlas.mjs.md) | ../src/capture/acceptance.mjs |
| [studio/src/capture/campaign.mjs](./campaign.mjs.md) | ./acceptance.mjs |
| [studio/src/families/build.mjs](../families/build.mjs.md) | ../capture/acceptance.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../capture/acceptance.mjs |
| [studio/src/studio/adapter-learning-pipeline.mjs](../studio/adapter-learning-pipeline.mjs.md) | ../capture/acceptance.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../capture/acceptance.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../capture/acceptance.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Offline acceptance label for one saved capture session (DESIGN-live-drive-studio.md section 5,
// the clean-data gate G1-G7). This is a label, not a gate: nothing in the product blocks on it.
//
//   Offline gates, computed from the saved session alone:  G4 G5 G6 G7
//   Context gates, need the optional `conversation` input:  G1 G2 G3 (not-checked without it)
//
// Verdicts (exact names; "accepted"/"rejected" are reserved by the exchange vocabulary):
//   capture_accepted   all seven gates passed
//   capture_rejected   any gate failed
//   capture_incomplete no gate failed, at least one unknown or not-checked
//   unassessed         binding mismatch, unreadable evidence, unknown recipe, or legacy (no file)
//
// Binding: rawDigest = sha256 over the canonical list of raw/manifest.json and every raw segment
// file (name, bytes, sha256), using the same sha256Hex/canonicalJson primitives as store/integrity.mjs
// and the same per-segment sha256 that raw/manifest.json records. Derived index files are excluded
// because they are rebuildable. Any byte change to raw evidence changes the digest.
// DOM_TURNS is also bound by canonical SHA-256, because G1/G2/G7 inspect rendered
// evidence and rawDigest alone does not detect an edited KV DOM projection.
//
// Only writeAcceptance writes, and only <session>/acceptance.json (temp file + fsync + rename).
// Raw logs and session.json are read, never modified.
import { existsSync, readFileSync, readdirSync, openSync, writeSync, fsyncSync, closeSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { sha256Hex, canonicalJson } from '../store/integrity.mjs';
import { reconcileFinal } from '../intel/correlate.mjs';
import { streamText } from '../replay/derive.mjs';

export const ACCEPTANCE_SCHEMA = 'capture-studio.acceptance/1';
// 1.1.0: G1/G2 gained pre-send baseline freshness. A text match without a baseline is now
// 'unknown' (capture_incomplete), never 'passed', so prior accepted documents are not reused
// across the semantic change (reuseAcceptedContext refuses version mismatches).
export const EVALUATOR_VERSION = '1.1.0';
export const DEFAULT_RECIPE = Object.freeze({ id: 'clean-data-gate', version: 1 });
export const GATE_IDS = Object.freeze(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']);
export const VERDICTS = Object.freeze(['capture_accepted', 'capture_rejected', 'capture_incomplete', 'unassessed']);
const GATE_VALUES = new Set(['passed', 'failed', 'not-checked', 'unknown']);
const ACCEPTANCE_FILE = 'acceptance.json';
const RAW_SEGMENT = /^\d{6}\.jsonl$/;

const gate = (value, reason, evidence = {}) => ({ value, reason, evidence });
const notChecked = (reason, evidence) => gate('not-checked', reason, evidence);
const unknown = (reason, evidence) => gate('unknown', reason, evidence);

const isKnownRecipe = (recipe) => !!recipe && recipe.id === DEFAULT_RECIPE.id && recipe.version === DEFAULT_RECIPE.version;

// ---- binding -------------------------------------------------------------------------------------

// Throws if the raw directory is missing or unreadable. Reads only.
export function domDigest(session) {
  return sha256Hex(canonicalJson(session.kv.get('DOM_TURNS', null)));
}

export function rawDigest(session) {
  const rawDir = session.rawDir;
  if (!existsSync(rawDir)) throw new Error('raw directory missing');
  const names = readdirSync(rawDir).filter((f) => RAW_SEGMENT.test(f) || f === 'manifest.json').sort();
  const files = names.map((file) => {
    const buf = readFileSync(path.join(rawDir, file));
    return { file, bytes: buf.length, sha256: sha256Hex(buf) };
  });
  return { digest: sha256Hex(canonicalJson(files)), files: files.length };
}

// ---- evidence scans --------------------------------------------------------------------------------

// One pass over raw records: seq range, gap/body counters, per-stream terminal records.
async function scanRaw(session) {
  const out = { records: 0, firstSeq: null, lastSeq: null, gapRecords: 0, bodyExcluded: 0, bodyTruncated: 0, corrupt: 0, streams: new Map() };
  const stream = (sid) => { let e = out.streams.get(sid); if (!e) out.streams.set(sid, (e = { done: false, fail: false })); return e; };
  for await (const r of session.records()) {
    out.records++;
    if (typeof r.seq === 'number') { out.firstSeq ??= r.seq; out.lastSeq = r.seqTo ?? r.seq; }
    if (r.k === 'corrupt') out.corrupt++;
    else if (r.k === 'gap') out.gapRecords++;
    else if (r.k === 'body.excluded') out.bodyExcluded++;
    else if (r.k === 'body.truncated') out.bodyTruncated++;
    else if (r.k === 'done' && r.sid) stream(r.sid).done = true;
    else if (r.k === 'fail' && r.sid) stream(r.sid).fail = true;
  }
```

_First 80 of 439 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
