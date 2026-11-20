# File: studio/src/shapes/infer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/shapes/infer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 34778 B |
| Lines | 533 |
| Hash | d3abee3d452e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DISCRIMINATORS | const | 10 | no | const DISCRIMINATORS = [&#39;type&#39;, &#39;event&#39;, &#39;kind&#39;, &#39;op&#39;, &#39;o&#39;, &#39;action&#39;, &#39;method&#39;, &#39;name&#39;, &#39;object&#39;]; |
| UUID | const | 11 | no | const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| ISO | const | 12 | no | const ISO = /^\\d{4}-\\d{2}-\\d{2}([T ]\\d{2}:\\d{2}(:\\d{2}(\\.\\d+)?)?(Z\|[+-]\\d{2}:?\\d{2})?)?$/; |
| URLISH | const | 13 | no | const URLISH = /^(https?:\\/\\/\|\\/[\\w-])/; |
| TEMPLATE_MEMO_MAX | const | 17 | no | const TEMPLATE_MEMO_MAX = 2048; |
| templateMemo | const | 18 | no | const templateMemo = new Map(); |
| templateUrl | function | 20 | yes | export function templateUrl(url) { |
| r | variable | 22 | no | let r = templateMemo.get(url); |
| templateUrlUncached | function | 31 | no | function templateUrlUncached(url) { |
| u | const | 33 | no | const u = new URL(url); |
| segs | const | 34 | no | const segs = u.pathname.split(&#39;/&#39;).map((s) =&gt; { if (!s) return s; if (UUID.test(s) \|\| /^\\d+$/.test(s) \|\| /^[0-9a-f]{12,}$/i.test(s) \|\| (/^[A-Za-z0-9_-]{22,}$/.test(s) &amp;&amp; /\\d/.test(s))) return &#39;{id}&#39;;… |
| sid8 | function | 43 | no | const sid8 = (s) =&gt; createHash(&#39;sha1&#39;).update(s).digest(&#39;hex&#39;).slice(0, 10); |
| short | function | 44 | no | const short = (v) =&gt; { const s = typeof v === &#39;string&#39; ? v : JSON.stringify(v); return s &amp;&amp; s.length &gt; 120 ? s.slice(0, 117) + &#39;…&#39; : s; }; |
| fieldPath | function | 46 | no | const fieldPath = (name) =&gt; /^[A-Za-z_$][\\w$]*$/.test(name) ? `$.${name}` : `$[${JSON.stringify(name)}]`; |
| FLAG_MEMO_MAX | const | 49 | no | const FLAG_MEMO_MAX = 8192; |
| FLAG_MEMO_STR_MAX | const | 50 | no | const FLAG_MEMO_STR_MAX = 256; |
| flagMemo | const | 51 | no | const flagMemo = new Map(); |
| POINTER | const | 54 | no | const POINTER = /^\\/[\\w/-]*$/; |
| MARKDOWN | const | 55 | no | const MARKDOWN = /(^\|\\n)(#{1,6} \|\\* \|- \|\\d+\\. \|```\|\\\|.*\\\|)/; |
| computeStringFlags | function | 56 | yes | export function computeStringFlags(v) { |
| out | const | 57 | no | const out = []; |
| c0 | const | 58 | no | const c0 = v.charCodeAt(0); |
| stringFlags | function | 66 | no | function stringFlags(v) { |
| r | variable | 68 | no | let r = flagMemo.get(v); |
| FieldStats | class | 77 | no | class FieldStats { |
| constructor | method | 78 | yes | constructor() { this.count = 0; this.types = {}; this.distinct = new Set(); this.distinctOverflow = false; this.examples = []; this.strLenMax = 0; this.strLenSum = 0; this.strN = 0; this.numMin = Inf… |
| add | method | 79 | yes | add(v) { |
| t | const | 81 | no | const t = typeOf(v); |
| toJSON | method | 96 | yes | toJSON() { |
| types | const | 97 | no | const types = Object.entries(this.types).sort((a, b) =&gt; b[1] - a[1]).map(([t]) =&gt; t); |
| out | const | 98 | no | const out = { count: this.count, types, examples: this.examples }; |
| Group | class | 108 | no | class Group { |
| constructor | method | 109 | yes | constructor(key, meta) { Object.assign(this, meta); this.key = key; this.count = 0; this.fields = new Map(); this.arrays = new Map(); this.firstT = null; this.lastT = null; this.streams = new Set(); } |
| observe | method | 110 | yes | observe(json, t, sid) { |
| walk | function | 116 | no | function walk(v, path, depth, group) { |
| f | variable | 118 | no | let f = group.fields.get(path); |
| objs | const | 122 | no | const objs = v.filter((x) =&gt; x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x)); |
| a | const | 124 | no | const a = group.arrays.get(path) ?? { observations: 0, items: 0, sampledItems: 0, keyCounts: new Map() }; |
| indices | const | 126 | no | const indices = sampleIndices(objs.length, (i) =&gt; shapeKey(objs[i]), { head: 30, stride: 20, perShape: 2, maxShapes: 16 }); |
| discriminatorOf | function | 137 | no | function discriminatorOf(ev) { |
| j | const | 139 | no | const j = ev.json; |
| ShapeInferencer | class | 147 | yes | export class ShapeInferencer { |
| constructor | method | 155 | yes | constructor(options = {}) { |
| _applyOne | method | 171 | yes | _applyOne() { |
| q | const | 172 | no | const q = this._q, i = this._qi; |
| g | const | 173 | no | const g = q[i], key = q[i + 1], ev = q[i + 2]; |
| _compact | method | 182 | yes | _compact() { if (this._qi &gt;= this._q.length) { this._q = []; this._qi = 0; } else if (this._qi &gt; 30000) { this._q = this._q.slice(this._qi); this._qi = 0; } } |
| flush | method | 184 | yes | flush() { |
| _schedule | method | 189 | yes | _schedule() { |
| _drainSlice | method | 197 | yes | _drainSlice() { |
| deadline | const | 199 | no | const deadline = performance.now() + this.sliceMs; |
| n | variable | 200 | no | let n = 0; |
| _endpointOf | method | 211 | yes | _endpointOf(stream) { |
| method | const | 212 | no | const method = stream.method, url = stream.url, kind = stream.kind; |
| c | const | 213 | no | const c = this._epCache.get(stream); |
| endpoint | const | 215 | no | const endpoint = `${method ?? (kind === &#39;ws&#39; ? &#39;WS&#39; : &#39;GET&#39;)} ${templateUrl(url)}`; |
| observeEvent | method | 220 | yes | observeEvent(ev, stream) { |
| endpoint | const | 222 | no | const endpoint = stream ? this._endpointOf(stream) : &#39;(unknown)&#39;; |
| d | const | 223 | no | const d = discriminatorOf(ev); |
| key | const | 224 | no | const key = `${endpoint} :: ${d.value}`; |
| g | variable | 225 | no | let g = this._groups.get(key); |
| observeAssembled | method | 233 | yes | observeAssembled(stream, doc) { |
| endpoint | const | 236 | no | const endpoint = `${stream.method ?? &#39;GET&#39;} ${templateUrl(stream.url)}`; |
| key | const | 237 | no | const key = `${endpoint} :: (assembled)`; |
| g | variable | 238 | no | let g = this.assembled.get(key); |
| report | method | 244 | yes | report(reducer, opts = {}) { |
| ph | const | 247 | no | const ph = {}; let tp = performance.now(); |
| mark | function | 248 | no | const mark = (k) =&gt; { const n = performance.now(); ph[k] = (ph[k] ?? 0) + (n - tp); tp = n; }; |
| summary | const | 249 | no | const summary = reducer.summary(); |
| st | const | 253 | no | const st = reducer.streams.get(s.sid); |
| groups | const | 258 | no | const groups = [...this.groups.values(), ...this.assembled.values()].map((g) =&gt; ({ key: g.key, endpoint: g.endpoint, discriminator: g.discriminator, discriminatorPath: g.discriminatorPath, source: g.… |
| suggestions | const | 270 | no | const suggestions = suggest(summary, groups, reducer, domBlocks, ph); |
| ctx | const | 272 | no | const ctx = { families: opts.families ?? [], profile: opts.profile ?? null, domInspect: opts.domInspect ?? null, domTurns: opts.domTurns ?? null }; |
| evidence | const | 273 | no | const evidence = gatherEvidence(reducer, { domInspect: ctx.domInspect, domTurns: ctx.domTurns, phases: ph }); |
| families | const | 275 | no | const families = ctx.families.length ? detectFamilies(ctx.families, evidence) : []; |
| acc | const | 279 | no | const acc = new Map((ctx.profile?.shapes?.accepted ?? []).map((x) =&gt; [x.id, &#39;accepted&#39;])); |
| renames | const | 281 | no | const renames = ctx.profile?.shapes?.renames ?? {}; |
| endpoints | const | 289 | no | const endpoints = endpointTable(summary.streams); |
| schemaProfiles | const | 290 | no | const schemaProfiles = this.profiler.report(); |
| q | const | 292 | no | const q = quality(summary, reducer, suggestions, families, ctx, evidence); |
| endpointTable | function | 299 | no | function endpointTable(streams) { |
| m | const | 300 | no | const m = new Map(); |
| key | const | 302 | no | const key = `${s.method ?? (s.kind === &#39;ws&#39; ? &#39;WS&#39; : &#39;GET&#39;)} ${templateUrl(s.url)}`; |
| e | const | 303 | no | const e = m.get(key) ?? { endpoint: key, streams: 0, bytes: 0, events: 0, transports: {}, statuses: {}, mime: new Set(), resourceTypes: new Set(), policies: new Set(), sids: [] }; |
| norm | function | 314 | no | const norm = (t) =&gt; String(t ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim().toLowerCase(); |
| suggest | function | 316 | no | function suggest(summary, groups, reducer, domBlocks, ph = null) { |
| out | const | 317 | no | const out = []; |
| push | function | 318 | no | const push = (kind, key, title, detail, confidence, evidence, proposal) =&gt; out.push({ id: `${kind}-${sid8(key)}`, kind, title, detail, confidence: +confidence.toFixed(2), evidence, proposal }); |
| tp | variable | 320 | no | let tp = performance.now(); |
| mk | const | 321 | no | const mk = ph ? (k) =&gt; { const n = performance.now(); ph[&#39;s.&#39; + k] = (ph[&#39;s.&#39; + k] ?? 0) + (n - tp); tp = n; } : () =&gt; {}; |
| eps | const | 322 | no | const eps = endpointTable(summary.streams); |
| streaming | const | 326 | no | const streaming = Object.keys(e.transports).filter((t) =&gt; [&#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_STREAMED&#39;, &#39;EVENT_SOURCE&#39;, &#39;WEBSOCKET&#39;].includes(t)); |
| avg | const | 333 | no | const avg = e.bytes / Math.max(1, e.streams); |
| allSmallOk | const | 334 | no | const allSmallOk = Object.keys(e.statuses).every((c) =&gt; [&#39;200&#39;, &#39;202&#39;, &#39;204&#39;].includes(String(c))); |
| fieldList | const | 344 | no | const fieldList = Object.entries(g.fields).filter(([p]) =&gt; p !== &#39;$&#39; &amp;&amp; !p.includes(&#39;[*]&#39;)).slice(0, 8).map(([p, f]) =&gt; `${p.replace(/^\\$\\./, &#39;&#39;)}: ${f.enum ? `enum(${f.enum.join(&#39;\|&#39;)})` : f.types.jo… |
| idKey | const | 348 | no | const idKey = c.keys.find((k) =&gt; /(^\|_)id$\|Id$\|^uuid$\|^key$/.test(k.key))?.key; |
| idValues | const | 369 | no | const idValues = new Map(); |
| blocks | const | 381 | no | const blocks = domBlocks ?? [...(reducer.dom?.blocks?.values() ?? [])]; |
| streamTexts | const | 382 | no | const streamTexts = []; |
| st | const | 384 | no | const st = reducer.streams.get(s.sid); |
| texts | const | 385 | no | const texts = st?._delta?.texts?.(40) ?? []; |
| evTexts | const | 386 | no | const evTexts = (st?._events ?? []).filter((e) =&gt; typeof e.text === &#39;string&#39; &amp;&amp; e.text.length &gt;= 40).map((e) =&gt; ({ text: e.text })); |
| matchedBlocks | const | 390 | no | const matchedBlocks = new Set(); |
| normBlocks | const | 393 | no | const normBlocks = new Array(blocks.length); |
| probe | const | 395 | no | const probe = st.text.slice(0, 120); |
| needle | const | 397 | no | const needle = probe.slice(0, 60); |
| hit | variable | 398 | no | let hit = null; |
| b | const | 400 | no | const b = blocks[i]; |
| nt | const | 402 | no | const nt = normBlocks[i] ?? (normBlocks[i] = norm(b.text)); |
| started | const | 417 | no | const started = summary.streams.filter((s) =&gt; s.startedT &gt;= a.t &amp;&amp; s.startedT &lt;= a.t + 3000 &amp;&amp; s.policy === &#39;body&#39;); |
| failed | const | 425 | no | const failed = summary.streams.filter((s) =&gt; s.armError); |
| suggestName | function | 431 | no | function suggestName(g, path) { |
| base | const | 432 | no | const base = String(g.discriminator ?? &#39;event&#39;).replace(/[^A-Za-z0-9]+/g, &#39;_&#39;).replace(/^_\|_$/g, &#39;&#39;).toLowerCase() \|\| &#39;event&#39;; |
| tail | const | 433 | no | const tail = path ? path.split(/[.[\\]*]+/).filter(Boolean).pop() : &#39;&#39;; |
| endpointRegex | function | 437 | yes | export function endpointRegex(endpoint) { |
| p | const | 438 | no | const p = endpoint.replace(/^[A-Z]+ /, &#39;&#39;); |
| fmtBytes | function | 442 | no | function fmtBytes(n) { return n &gt; 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n &gt; 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`; } |
| familySuggestions | function | 448 | no | function familySuggestions(detections, ctx, evidence) { |
| out | const | 449 | no | const out = []; |
| best | const | 450 | no | const best = detections[0]; |
| fam | const | 452 | no | const fam = ctx.families.find((f) =&gt; f.name === best.family); |
| linked | const | 453 | no | const linked = ctx.profile?.family === best.family &amp;&amp; (ctx.profile.familyMappings ?? []).length &gt; 0; |
| links | const | 454 | no | const links = proposeFamilyLink(fam, evidence); |
| chosen | const | 455 | no | const chosen = []; |
| seen | const | 456 | no | const seen = new Set(); |
| runnerUp | const | 459 | no | const runnerUp = detections[1] &amp;&amp; detections[1].score &gt;= 0.5 ? ` Also plausible: ${detections[1].family} (${Math.round(detections[1].score * 100)}%).` : &#39;&#39;; |
| have | const | 469 | no | const have = new Set((ctx.profile.familyMappings ?? []).map((m) =&gt; `${m.entity}\|${m.source.kind}\|${m.source.endpoint ?? &#39;&#39;}`)); |
| k | const | 471 | no | const k = `${c.entity}\|${c.source.kind}\|${c.source.endpoint ?? &#39;&#39;}`; |
| driftSuggestions | function | 482 | no | function driftSuggestions(profile, reducer, evidence) { |
| out | const | 483 | no | const out = []; |
| streams | const | 485 | no | const streams = [...reducer.streams.values()]; |
| re | const | 488 | no | const re = new RegExp(rule.endpoint); |
| sts | const | 489 | no | const sts = streams.filter((s) =&gt; re.test(templateUrl(s.url))); |
| matched | const | 491 | no | const matched = sts.reduce((a, s) =&gt; a + (s._events ?? []).filter((e) =&gt; ruleMatchesEvent(rule, e, s)).length, 0); |
| events | const | 492 | no | const events = sts.reduce((a, s) =&gt; a + (s._events ?? []).length, 0); |
| re | const | 497 | no | const re = new RegExp(m.source.endpoint); |
| docs | const | 498 | no | const docs = evidence.assembled.filter((a) =&gt; re.test(templateUrl(a.url))); |
| recs | const | 500 | no | const recs = docs.map((d) =&gt; applyMapping(m, d.doc)); |
| broken | const | 501 | no | const broken = Object.keys(m.fields).filter((f) =&gt; recs.filter((r) =&gt; r[f] === undefined \|\| r[f] === null \|\| r[f] === &#39;&#39;).length &gt; recs.length / 2); |
| req | const | 502 | no | const req = broken.filter((f) =&gt; [&#39;text&#39;, &#39;role&#39;, &#39;id&#39;, &#39;title&#39;].includes(f)); |
| quality | function | 511 | no | function quality(summary, reducer, suggestions, families, ctx, evidence) { |
| streams | const | 512 | no | const streams = summary.streams; |
| terminal | const | 513 | no | const terminal = streams.filter((s) =&gt; s.status !== &#39;open&#39;); |
| complete | const | 514 | no | const complete = streams.filter((s) =&gt; s.status === &#39;complete&#39; \|\| s.status === &#39;closed&#39;); |
| withText | const | 515 | no | const withText = suggestions.filter((g) =&gt; g.kind === &#39;correlation&#39;).length; |
| uncorrelated | const | 516 | no | const uncorrelated = suggestions.filter((g) =&gt; g.kind === &#39;uncorrelated_ui&#39;).length; |
| shapeConf | const | 517 | no | const shapeConf = suggestions.filter((g) =&gt; [&#39;event_type&#39;, &#39;collection&#39;].includes(g.kind)); |
| fam | const | 518 | no | const fam = families[0]; |
| mappingConf | const | 519 | no | const mappingConf = ctx.profile?.familyMappings?.length ? Math.min(...ctx.profile.familyMappings.map((m) =&gt; m.confidence ?? 0.7)) : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ../families/families.mjs | import | 5 | [studio/src/families/families.mjs](../families/families.mjs.md) |
| ./extract.mjs | import | 6 | [studio/src/shapes/extract.mjs](./extract.mjs.md) |
| ../intel/schema.mjs | import | 7 | [studio/src/intel/schema.mjs](../intel/schema.mjs.md) |
| ./profiler.mjs | import | 8 | [studio/src/shapes/profiler.mjs](./profiler.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/categorization-scoreboard.mjs](../../scripts/categorization-scoreboard.mjs.md) | ../src/shapes/infer.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/shapes/infer.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/shapes/infer.mjs |
| [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) | ../shapes/infer.mjs |
| [studio/src/families/families.mjs](../families/families.mjs.md) | ../shapes/infer.mjs |
| [studio/src/intel/corpus.mjs](../intel/corpus.mjs.md) | ../shapes/infer.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../shapes/infer.mjs |
| [studio/src/shapes/extract.mjs](./extract.mjs.md) | ./infer.mjs |

## Annotations

_No annotations._

## Excerpt

````javascript
// Shape inference and suggestion engine.
// Observed values are kept apart from inferred meaning: every suggestion carries its evidence
// and a confidence, and nothing is applied until the user accepts it.
import { createHash } from 'node:crypto';
import { gatherEvidence, detectFamilies, proposeFamilyLink, applyMapping, endpointPattern } from '../families/families.mjs';
import { ruleMatchesEvent } from './extract.mjs';
import { sampleIndices, shapeKey } from '../intel/schema.mjs';
import { OnlineSchemaProfiler } from './profiler.mjs';

const DISCRIMINATORS = ['type', 'event', 'kind', 'op', 'o', 'action', 'method', 'name', 'object'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const URLISH = /^(https?:\/\/|\/[\w-])/;

// templateUrl is a pure function of the url string and is called once per decoded event (and per
// stream per status/report pass); `new URL` + 4 regexes per segment dominated. Bounded memo.
const TEMPLATE_MEMO_MAX = 2048;
const templateMemo = new Map();

export function templateUrl(url) {
  if (typeof url !== 'string') return templateUrlUncached(url);
  let r = templateMemo.get(url);
  if (r === undefined) {
    r = templateUrlUncached(url);
    if (templateMemo.size >= TEMPLATE_MEMO_MAX) templateMemo.clear();
    templateMemo.set(url, r);
  }
  return r;
}

function templateUrlUncached(url) {
  try {
    const u = new URL(url);
    const segs = u.pathname.split('/').map((s) => {
      if (!s) return s;
      if (UUID.test(s) || /^\d+$/.test(s) || /^[0-9a-f]{12,}$/i.test(s) || (/^[A-Za-z0-9_-]{22,}$/.test(s) && /\d/.test(s))) return '{id}';
      return s;
    });
    return `${u.host}${segs.join('/')}`;
  } catch { return String(url ?? '').split('?')[0]; }
}

const sid8 = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
const short = (v) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s && s.length > 120 ? s.slice(0, 117) + '…' : s; };
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const fieldPath = (name) => /^[A-Za-z_$][\w$]*$/.test(name) ? `$.${name}` : `$[${JSON.stringify(name)}]`;

// Pure per-string flag detection, memoised (same strings recur constantly; bounded).
const FLAG_MEMO_MAX = 8192;
const FLAG_MEMO_STR_MAX = 256;
const flagMemo = new Map();
// Each regex is preceded by a necessary-condition check (length / first character) so the common
// non-matching strings never run it. The checks only ever exclude; results are unchanged.
const POINTER = /^\/[\w/-]*$/;
const MARKDOWN = /(^|\n)(#{1,6} |\* |- |\d+\. |```|\|.*\|)/;
export function computeStringFlags(v) {
  const out = [];
  const c0 = v.charCodeAt(0);
  if (v.length === 36 && UUID.test(v)) out.push('uuid');
  if (v.length >= 10 && c0 >= 48 && c0 <= 57 && ISO.test(v)) out.push('isoTime');
  if ((c0 === 104 || c0 === 47) && URLISH.test(v)) out.push('url');
  if (c0 === 47 && v.length < 80 && POINTER.test(v)) out.push('pointer');
  if (MARKDOWN.test(v)) out.push('markdown');
  return out;
}
function stringFlags(v) {
  if (v.length > FLAG_MEMO_STR_MAX) return computeStringFlags(v);
  let r = flagMemo.get(v);
  if (r === undefined) {
    r = computeStringFlags(v);
    if (flagMemo.size >= FLAG_MEMO_MAX) flagMemo.clear();
    flagMemo.set(v, r);
  }
  return r;
}

class FieldStats {
  constructor() { this.count = 0; this.types = {}; this.distinct = new Set(); this.distinctOverflow = false; this.examples = []; this.strLenMax = 0; this.strLenSum = 0; this.strN = 0; this.numMin = Infinity; this.numMax = -Infinity; this.flags = {}; }
  add(v) {
    this.count++;
````

_First 80 of 534 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
