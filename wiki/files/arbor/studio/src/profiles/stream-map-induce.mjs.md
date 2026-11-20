# File: studio/src/profiles/stream-map-induce.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/stream-map-induce.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26601 B |
| Lines | 585 |
| Hash | b61ccd5e89c4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_LEAVES | const | 42 | no | const MAX_LEAVES = 60; |
| MAX_DEPTH | const | 43 | no | const MAX_DEPTH = 4; |
| IDENT | const | 44 | no | const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/; |
| NUMERIC_SEG | const | 45 | no | const NUMERIC_SEG = /^\\d+$/; |
| HEXISH_SEG | const | 46 | no | const HEXISH_SEG = /^[0-9a-f]{8,}$/i; |
| CATEGORIES | const | 47 | no | const CATEGORIES = [&#39;open&#39;, &#39;append&#39;, &#39;close&#39;, &#39;ignore&#39;]; |
| isObj | function | 49 | no | const isObj = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| round2 | function | 50 | no | const round2 = (x) =&gt; Math.round(x * 100) / 100; |
| round3 | function | 51 | no | const round3 = (x) =&gt; Math.round(x * 1000) / 1000; |
| getPath | function | 53 | no | function getPath(obj, dotted) { |
| node | variable | 54 | no | let node = obj; |
| unitsOf | function | 65 | no | function unitsOf(json) { |
| leavesOf | function | 77 | no | function leavesOf(unit) { |
| types | const | 78 | no | const types = new Map(); |
| walk | function | 79 | no | const walk = (v, p, depth) =&gt; { |
| t | const | 81 | no | const t = v === null ? &#39;null&#39; : Array.isArray(v) ? &#39;array&#39; : typeof v; |
| pathTemplate | function | 93 | no | function pathTemplate(p) { |
| selectorFor | function | 100 | no | function selectorFor(template) { |
| i | const | 102 | no | const i = template.indexOf(&#39;*&#39;); |
| escapeRegex | function | 107 | no | function escapeRegex(s) { |
| patternFromTemplate | function | 112 | no | function patternFromTemplate(template) { |
| prefix | const | 115 | no | const prefix = template.slice(0, -1); |
| distinctSize | function | 120 | no | const distinctSize = (s) =&gt; (s.distinctDropped ? 9 : s.distinct.size); |
| IDENTIFIER_LEAF | const | 123 | no | const IDENTIFIER_LEAF = /(^\|\\.)(id\|uuid\|guid\|key\|token\|hash\|sha\\d*\|nonce\|etag\|marker\|request_id\|message_id\|conversation_id\|turn_exchange_id\|working_turn_id\|parent_id)$/i; |
| isIdentifierLeaf | function | 124 | no | const isIdentifierLeaf = (path) =&gt; IDENTIFIER_LEAF.test(String(path)); |
| LABEL_LEAF | const | 128 | no | const LABEL_LEAF = /(^\|\\.)(type\|event\|name\|object\|kind)$/i; |
| isLabelLeaf | function | 129 | no | const isLabelLeaf = (path) =&gt; LABEL_LEAF.test(String(path)); |
| growthCandidates | function | 135 | no | function growthCandidates(c, minGrowth) { |
| out | const | 136 | no | const out = []; |
| growthPairs | const | 147 | no | const growthPairs = s.pairs; |
| cumulativeCandidate | function | 157 | no | function cumulativeCandidate(c) { |
| paths | const | 158 | no | const paths = [...c.str.keys()].sort(); |
| s | const | 160 | no | const s = c.str.get(path); |
| potentiallyText | function | 171 | no | function potentiallyText(c) { |
| objectIdPath | function | 180 | no | function objectIdPath(c) { |
| keys | const | 181 | no | const keys = [...c.types.keys()].sort((a, b) =&gt; (a.length - b.length) \|\| (a &lt; b ? -1 : a &gt; b ? 1 : 0)); |
| nestedObjectPath | function | 190 | no | function nestedObjectPath(c) { |
| keys | const | 191 | no | const keys = [...c.types.keys()].sort((a, b) =&gt; (a.length - b.length) \|\| (a &lt; b ? -1 : a &gt; b ? 1 : 0)); |
| induceStreamMap | function | 202 | yes | export function induceStreamMap(events, opts = {}) { |
| list | const | 203 | no | const list = Array.isArray(events) ? events : []; |
| minGrowth | const | 204 | no | const minGrowth = Number.isInteger(opts.minGrowth) &amp;&amp; opts.minGrowth &gt; 0 ? opts.minGrowth : 2; |
| clusters | const | 205 | no | const clusters = new Map(); |
| order | const | 206 | no | const order = []; |
| perSid | const | 207 | no | const perSid = new Map(); |
| sidList | const | 208 | no | const sidList = []; |
| gpos | variable | 209 | no | let gpos = 0; |
| totalUnits | variable | 210 | no | let totalUnits = 0; |
| pathLikeUnits | variable | 211 | no | let pathLikeUnits = 0; |
| e | const | 214 | no | const e = isObj(ev) ? ev : {}; |
| sid | const | 215 | no | const sid = e.sid !== undefined &amp;&amp; e.sid !== null ? String(e.sid) : &#39;(none)&#39;; |
| st | variable | 216 | no | let st = perSid.get(sid); |
| pos | const | 220 | no | const pos = { sid, pos: st.units++, at: gpos++ }; |
| pathLike | const | 221 | no | const pathLike = isObj(unit) &amp;&amp; (&#39;p&#39; in unit \|\| &#39;o&#39; in unit \|\| (&#39;v&#39; in unit &amp;&amp; !(&#39;type&#39; in unit))); |
| p | variable | 222 | no | let p; |
| o | variable | 223 | no | let o = null; |
| view | const | 230 | no | const view = { |
| types | const | 240 | no | const types = error ? new Map() : leavesOf(unit); |
| sig | const | 244 | no | const sig = [...types.entries()].map(([k, t]) =&gt; `${k}:${t}`).join(&#39;\|&#39;); |
| key | const | 245 | no | const key = JSON.stringify([ error ?? null, view.eventName, view.type, view.blockType, view.deltaType, view.pathTemplate ?? null, view.o, view.terminal, sig, ]); |
| c | variable | 249 | no | let c = clusters.get(key); |
| v | const | 260 | no | const v = getPath(unit, path); |
| s | variable | 262 | no | let s = c.str.get(path); |
| prev | const | 272 | no | const prev = s.prevBySid.get(sid); |
| streams | const | 286 | no | const streams = sidList.length; |
| totalBySid | const | 287 | no | const totalBySid = new Map(sidList.map((sid) =&gt; [sid, perSid.get(sid).units])); |
| appends | const | 296 | no | const appends = new Map(); |
| candidates | const | 299 | no | const candidates = growthCandidates(c, minGrowth); |
| firstAppendBySid | const | 302 | no | const firstAppendBySid = new Map(); |
| cur | const | 305 | no | const cur = firstAppendBySid.get(q.sid); |
| dialect | const | 310 | no | const dialect = totalUnits &gt; 0 &amp;&amp; pathLikeUnits * 2 &gt; totalUnits ? &#39;path-ops&#39; : &#39;typed-events&#39;; |
| numFreq | const | 314 | no | const numFreq = new Map(); |
| rankedNumeric | const | 316 | no | const rankedNumeric = [...numFreq].sort((a, b) =&gt; b[1] - a[1] \|\| (a[0] &lt; b[0] ? -1 : a[0] &gt; b[0] ? 1 : 0)); |
| numericPath | const | 317 | no | const numericPath = rankedNumeric.length &amp;&amp; rankedNumeric[0][1] &gt;= 2 ? rankedNumeric[0][0] : null; |
| firstAppend | const | 318 | no | const firstAppend = appends.keys().next().value ?? null; |
| blockIndexPath | variable | 319 | no | let blockIndexPath = numericPath; |
| blockIndexPattern | variable | 320 | no | let blockIndexPattern; |
| pattern | const | 322 | no | const pattern = patternFromTemplate(firstAppend.pathTemplate); |
| opsByTemplate | const | 328 | no | const opsByTemplate = new Map(); |
| sp | const | 331 | no | const sp = selectorFor(c.pathTemplate); |
| set | const | 332 | no | const set = opsByTemplate.get(sp) ?? new Set(); |
| baseWhen | function | 337 | no | const baseWhen = (c, objectPath = null) =&gt; { |
| w | const | 338 | no | const w = {}; |
| sp | const | 340 | no | const sp = selectorFor(c.pathTemplate); |
| ops | const | 343 | no | const ops = opsByTemplate.get(sp) ?? new Set(); |
| openRules | const | 365 | no | const openRules = []; |
| appendRules | const | 366 | no | const appendRules = []; |
| closeRules | const | 367 | no | const closeRules = []; |
| finalizeRules | const | 368 | no | const finalizeRules = []; |
| ignoreRules | const | 369 | no | const ignoreRules = []; |
| unexplained | const | 370 | no | const unexplained = []; |
| messageIdPath | function | 371 | no | let messageIdPath; |
| evidenceOf | function | 373 | no | const evidenceOf = (c) =&gt; ({ clusterId: c.id, count: c.count, streams: new Set(c.pos.map((q) =&gt; q.sid)).size, firstInStream: c.firstSids.size, |
| byWhen | const | 384 | no | const byWhen = new Map(); |
| emit | function | 385 | no | const emit = (bucket, rule) =&gt; { |
| sig | const | 386 | no | const sig = JSON.stringify(canonicalWhen(rule.when)); |
| prior | const | 387 | no | const prior = byWhen.get(sig); |
| app | const | 398 | no | const app = appends.get(c) ?? null; |
| t | const | 401 | no | const t = app &amp;&amp; app.count === 1 ? app.best : null; |
| ambiguousGrowth | const | 402 | no | const ambiguousGrowth = app ? app.count &gt; 1 : false; |
| idInfo | const | 412 | no | const idInfo = c.firstSids.size === streams &amp;&amp; c.count &lt;= streams * 3 ? objectIdPath(c) : null; |
| nested | const | 413 | no | const nested = c.firstSids.size === streams &amp;&amp; c.count &lt;= streams * 3 ? nestedObjectPath(c) : null; |
| when | const | 417 | no | const when = baseWhen(c, idInfo?.obj ?? nested); |
| rule | const | 419 | no | const rule = { when, op: &#39;open&#39;, component: &#39;message&#39; }; |
| when | const | 430 | no | const when = baseWhen(c); |
| afterFirstAppend | const | 442 | no | const afterFirstAppend = c.pos.every((q) =&gt; { const fa = firstAppendBySid.get(q.sid); return fa !== undefined &amp;&amp; q.pos &gt; fa; }); |
| fa | const | 443 | no | const fa = firstAppendBySid.get(q.sid); |
| lastAll | const | 446 | no | const lastAll = c.lastSids.size === streams &amp;&amp; c.count === streams; |
| hasIndex | const | 447 | no | const hasIndex = blockIndexPath |
| when | const | 452 | no | const when = baseWhen(c); |
| when | const | 463 | no | const when = baseWhen(c); |
| cum | const | 475 | no | const cum = cumulativeCandidate(c); |
| when | const | 477 | no | const when = baseWhen(c); |
| noSelector | const | 488 | no | const noSelector = c.type === null &amp;&amp; c.pathTemplate === undefined &amp;&amp; c.eventName === null; |
| reason | variable | 489 | no | let reason; |
| candidates | const | 504 | no | const candidates = []; |
| info | const | 506 | no | const info = objectIdPath(c); |
| ops | const | 515 | no | const ops = [...finalizeRules.filter((r) =&gt; r.when.terminal === true), ...openRules, ...appendRules, |
| stream | const | 518 | no | const stream = {}; |
| canonicalWhen | function | 555 | no | function canonicalWhen(when) { |
| out | const | 557 | no | const out = []; |
| ruleSig | function | 565 | no | function ruleSig(rule) { |
| diceSets | function | 570 | no | function diceSets(a, b) { |
| common | variable | 572 | no | let common = 0; |
| compareMaps | function | 577 | yes | export function compareMaps(induced, reference) { |
| a | const | 578 | no | const a = Array.isArray(induced?.stream?.ops) ? induced.stream.ops : []; |
| b | const | 579 | no | const b = Array.isArray(reference?.stream?.ops) ? reference.stream.ops : []; |
| cat | function | 580 | no | const cat = (ops, category) =&gt; new Set(ops.filter((r) =&gt; isObj(r) &amp;&amp; r.op === category).map(ruleSig)); |
| out | const | 581 | no | const out = {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./stream-map.mjs | import | 40 | [studio/src/profiles/stream-map.mjs](./stream-map.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/induce-vs-handmap.mjs](../../scripts/induce-vs-handmap.mjs.md) | ../src/profiles/stream-map-induce.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Stream-map induction: propose a stream map (the format src/profiles/stream-map.mjs already
// accepts) from the decoded events of one or more streams. Pure and deterministic: no I/O, no
// clock, no randomness, no site names, no vocabulary beyond structural features (key paths and
// value TYPES, never values). Nothing here is wired into the engine; a caller decides whether to
// keep the proposal. The induced object is itself a map: applyStreamMap/validateStreamMap accept
// it unchanged (rule-level `evidence`/`confidence` and the top-level `induction`/`unexplained`
// fields are ignored by the engine), so no inducedMapToProfile converter is needed or provided.
//
// Method (all counts only; every emitted rule carries evidence + confidence):
//   1. Expand each event into the same units the engine sees (an { o:"patch", v:[...] } envelope
//      becomes its sub-operations; a bare { v } inherits the previous pointer, as in delta.mjs).
//   2. Cluster units by structural signature: SSE event name, json.type, block/delta type, the
//      resolved pointer TEMPLATE (numeric / uuid-ish segments become "*") plus op, the terminal
//      flag and the sorted ["path:type"] leaf map. Values never enter the key.
//   3. Per cluster compute counts: occurrences, streams it appears in, whether it starts / ends
//      each stream, and per string leaf the sequence counters used to classify growth:
//      cumulative (every value is a prefix of the next), constant, or fragment deltas.
//   4. Emit rules only on structural evidence:
//        OPEN     starts every stream, small count, carries a nested object (keyPath from a
//                 string `id` inside it; messageIdPath is that dotted path).
//        APPEND   a string leaf with >= minGrowth consecutive non-empty, non-prefix fragments
//                 (concatenated text is therefore non-decreasing); textPath is that leaf.
//        CLOSE    no text, has the block-index leaf, every occurrence after the stream's first
//                 append, and is not the stream's last unit.
//        FINALIZE the terminal flag, or a text-free cluster that is every stream's last unit.
//        IGNORE   every other text-free cluster that has an expressible selector.
//      Clusters with no expressible selector, cumulative snapshots (a "set" op the engine does
//      not have), and clusters whose growth is below threshold are listed under `unexplained`
//      with their count and a reason; nothing is silently dropped.
//   5. Signal rules are NEVER induced. Error-ish key NAMES are irrelevant here: a real-data
//      finding is 326 events carrying error/error_code keys with null values, so any rule keyed
//      on presence would fire a false error. Only value types are observed and `signal` is not
//      in the emitted op set at all.
//
// Honest limits: a cumulative-snapshot stream cannot be mapped by an append-only engine, so it
// stays unexplained; a mid-stream pointer change to an unrelated path inside one signature is
// collided by the "*" template; path selectors are prefix matches when a variable segment is
// not last; close/finalize are distinguished only by position and index presence, not by name.

import { STREAM_MAP_SCHEMA } from './stream-map.mjs';

const MAX_LEAVES = 60;
const MAX_DEPTH = 4;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const NUMERIC_SEG = /^\d+$/;
const HEXISH_SEG = /^[0-9a-f]{8,}$/i;
const CATEGORIES = ['open', 'append', 'close', 'ignore'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const round2 = (x) => Math.round(x * 100) / 100;
const round3 = (x) => Math.round(x * 1000) / 1000;

function getPath(obj, dotted) {
  let node = obj;
  for (const k of String(dotted).split('.')) {
    if (!isObj(node)) return undefined;
    node = node[k];
    if (node === undefined) return undefined;
  }
  return node;
}

// Same unit expansion as the engine (src/profiles/stream-map.mjs unitsOf). Copied because that
// module does not export it; keep in sync.
function unitsOf(json) {
  if (json === undefined) return [{ unit: undefined }];
  if (isObj(json) && json.o === 'patch' && Array.isArray(json.v)) {
    if (json.v.length === 0) return [{ error: 'empty_patch' }];
    return json.v.map((unit) => ({ unit }));
  }
  return [{ unit: json }];
}

// Sorted "path:type" leaf map. Arrays are a leaf of type "array" (their items are not indexed:
// indices are values and would fragment the signature). Keys that cannot be written as a dotted
// path are skipped, because a rule could not address them anyway.
function leavesOf(unit) {
  const types = new Map();
  const walk = (v, p, depth) => {
    if (types.size >= MAX_LEAVES || depth > MAX_DEPTH) return;
```

_First 80 of 586 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
