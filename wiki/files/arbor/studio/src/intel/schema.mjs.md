# File: studio/src/intel/schema.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/schema.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30322 B |
| Lines | 514 |
| Hash | c1b8909889ce |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DISTINCT_CAP | const | 12 | no | const DISTINCT_CAP = 200; |
| TAG_MAX_VALUES | const | 13 | no | const TAG_MAX_VALUES = 24; |
| KEY_CAP | const | 14 | no | const KEY_CAP = 400; |
| FORMAT_TESTS | const | 16 | yes | export const FORMAT_TESTS = { |
| FORMAT_MEMO_MAX | const | 31 | no | const FORMAT_MEMO_MAX = 8192; |
| FORMAT_MEMO_STR_MAX | const | 32 | no | const FORMAT_MEMO_STR_MAX = 256; |
| formatMemo | const | 33 | no | const formatMemo = new Map(); |
| FORMAT_TEST_SNAPSHOT | const | 37 | no | const FORMAT_TEST_SNAPSHOT = { ...FORMAT_TESTS }; |
| isDigitCode | function | 38 | no | const isDigitCode = (c) =&gt; c &gt;= 48 &amp;&amp; c &lt;= 57; |
| FORMAT_GUARDS | const | 39 | no | const FORMAT_GUARDS = { |
| FORMAT_PLAN | const | 50 | no | const FORMAT_PLAN = Object.entries(FORMAT_TESTS).map(([f, test]) =&gt; [f, test, test === FORMAT_TEST_SNAPSHOT[f] ? FORMAT_GUARDS[f] : undefined]); |
| computeFormats | function | 51 | yes | export function computeFormats(s) { |
| out | const | 52 | no | const out = []; |
| plan | const | 54 | no | const plan = FORMAT_PLAN[i]; |
| formatsOf | function | 60 | no | function formatsOf(s) { |
| r | variable | 62 | no | let r = formatMemo.get(s); |
| SIG_MEMO_MAX | const | 73 | no | const SIG_MEMO_MAX = 1024; |
| sigMemo | const | 74 | no | const sigMemo = new Map(); |
| sortedSignature | function | 75 | no | function sortedSignature(keys) { |
| n | const | 76 | no | const n = keys.length; |
| raw | const | 78 | no | const raw = keys.join(&#39;\\u0000&#39;); |
| hit | const | 79 | no | const hit = sigMemo.get(raw); |
| same | variable | 81 | no | let same = true; |
| sig | const | 85 | no | const sig = keys.slice().sort().join(&#39;\|&#39;); |
| sampleIndices | function | 93 | yes | export function sampleIndices(len, shapeOf, { head = 150, stride = 150, perShape = 3, maxShapes = 64 } = {}) { |
| keep | const | 95 | no | const keep = new Set(); |
| step | const | 97 | no | const step = (len - head) / stride; |
| seen | const | 99 | no | const seen = new Map(); |
| sh | const | 101 | no | const sh = shapeOf(i); |
| c | const | 102 | no | const c = seen.get(sh) ?? 0; |
| shapeKey | function | 107 | yes | export const shapeKey = (v) =&gt; (v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) ? Object.keys(v).sort().join(&#39;\|&#39;) : Array.isArray(v) ? &#39;[]&#39; : typeof v); |
| kindOf | function | 109 | no | const kindOf = (v) =&gt; (v === null ? &#39;null&#39; : Array.isArray(v) ? &#39;array&#39; : typeof v === &#39;object&#39; ? &#39;object&#39; : typeof v === &#39;number&#39; ? (Number.isInteger(v) ? &#39;integer&#39; : &#39;number&#39;) : typeof v); |
| SchemaNode | class | 111 | yes | export class SchemaNode { |
| constructor | method | 112 | yes | constructor() { |
| observe | method | 119 | yes | observe(v, depth = 0) { |
| k | const | 121 | no | const k = kindOf(v); |
| merge | method | 132 | yes | merge(other) { if (!(other instanceof SchemaNode)) throw new TypeError(&#39;Expected SchemaNode&#39;); if (other === this) throw new Error(&#39;Cannot merge a schema into itself&#39;); mergeInto(this, other); return… |
| toState | method | 138 | yes | toState() { return nodeToState(this); } |
| fromState | method | 139 | yes | static fromState(state) { return nodeFromState(state); } |
| _str | method | 141 | yes | _str(s) { |
| st | const | 142 | no | const st = (this.str ??= { n: 0, lenSum: 0, lenMin: Infinity, lenMax: 0, distinct: new Map(), overflow: false, formats: {}, examples: [] }); |
| _num | method | 150 | yes | _num(x) { |
| st | const | 151 | no | const st = (this.num ??= { n: 0, min: Infinity, max: -Infinity, sum: 0, distinct: new Set(), overflow: false, epochS: 0, epochMs: 0, changes: 0, last: undefined, examples: [] }); |
| delta | const | 154 | no | const delta = x - (st.mean ?? 0); st.mean = (st.mean ?? 0) + delta / st.n; |
| _arr | method | 165 | yes | _arr(a, depth) { |
| st | const | 166 | no | const st = (this.arr ??= { n: 0, lenSum: 0, lenMax: 0, empty: 0, items: new SchemaNode() }); |
| _obj | method | 172 | yes | _obj(o, depth) { |
| st | const | 173 | no | const st = (this.obj ??= { n: 0, fields: new Map(), keyOverflow: false, keysPerObj: 0, tags: new Map(), fieldSets: new Map() }); |
| keys | const | 175 | no | const keys = Object.keys(o); |
| sig | const | 182 | no | const sig = sortedSignature(keys); |
| k | const | 186 | no | const k = keys[ki]; |
| v | const | 188 | no | const v = o[k]; |
| t | variable | 190 | no | let t = st.tags.get(k); |
| g | variable | 193 | no | let g = t.get(v); |
| describe | method | 201 | yes | describe(name = &#39;$&#39;) { |
| total | const | 202 | no | const total = this.count \|\| 1; |
| kinds | const | 203 | no | const kinds = Object.entries(this.kinds).sort((a, b) =&gt; b[1] - a[1]); |
| out | const | 204 | no | const out = { path: name, count: this.count, kinds: Object.fromEntries(kinds), nullable: !!this.kinds.null }; |
| main | const | 205 | no | const main = kinds.filter(([k]) =&gt; k !== &#39;null&#39;); |
| describeString | function | 218 | no | function describeString(st) { |
| formats | const | 219 | no | const formats = {}; |
| d | const | 221 | no | const d = { n: st.n, avgLen: +(st.lenSum / st.n).toFixed(1), minLen: st.lenMin, maxLen: st.lenMax, formats, examples: st.examples }; |
| idLike | const | 226 | no | const idLike = [&#39;uuid&#39;, &#39;hex_id&#39;, &#39;token_id&#39;, &#39;url&#39;, &#39;iso_time&#39;, &#39;email&#39;].some((f) =&gt; formats[f]); |
| describeNumber | function | 232 | no | function describeNumber(st) { |
| d | const | 233 | no | const d = { n: st.n, min: st.min, max: st.max, mean: +((st.mean ?? st.sum / st.n)).toFixed(3), variance: +((st.m2 ?? 0) / Math.max(1, st.n - 1)).toFixed(4), examples: st.examples, changeRate: +(st.ch… |
| looksLikeDynamicKey | function | 239 | no | const looksLikeDynamicKey = (k) =&gt; /^\\d+(\\.\\d+)*$/.test(k) \|\| /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k) \|\| /^[0-9a-f]{16,}$/i.test(k) \|\| /^\\d{4}-\\d{2}-\\d{2}/.test(k) \|\| (/^[A-Za-z0-9_-]{16,}$/.test(k) &amp;&amp; … |
| describeObject | function | 241 | no | function describeObject(st, name) { |
| n | const | 242 | no | const n = st.n; |
| keys | const | 243 | no | const keys = [...st.fields.keys()]; |
| dynamicShare | const | 244 | no | const dynamicShare = keys.length ? keys.filter(looksLikeDynamicKey).length / keys.length : 0; |
| avgKeys | const | 245 | no | const avgKeys = st.keysPerObj / n; |
| isMap | const | 247 | no | const isMap = st.keyOverflow \|\| (keys.length &gt;= 6 &amp;&amp; dynamicShare &gt;= 0.8) \|\| (keys.length &gt;= 20 &amp;&amp; keys.length &gt; avgKeys * 3); |
| merged | const | 249 | no | const merged = new SchemaNode(); |
| fields | const | 253 | no | const fields = {}; |
| d | const | 255 | no | const d = child.describe(`${name}.${k}`); |
| out | const | 260 | no | const out = { type: &#39;object&#39;, objects: n, fields }; |
| tagged | const | 261 | no | const tagged = detectTag(st, n); |
| detectTag | function | 267 | no | function detectTag(st, n) { |
| best | variable | 268 | no | let best = null; |
| covered | const | 271 | no | const covered = [...groups.values()].reduce((a, g) =&gt; a + g.n, 0); |
| sets | const | 273 | no | const sets = [...groups.entries()].map(([v, g]) =&gt; ({ value: v, n: g.n, keys: new Set([...g.keys].filter(([, c]) =&gt; c / g.n &gt;= 0.5).map(([k]) =&gt; k)) })); |
| simSum | variable | 274 | no | let simSum = 0, pairs = 0; |
| avgSim | const | 276 | no | const avgSim = pairs ? simSum / pairs : 1; |
| score | const | 277 | no | const score = (1 - avgSim) * Math.min(1, covered / n); |
| mergeInto | function | 283 | no | function mergeInto(target, src) { |
| s | const | 288 | no | const s = src.str, t = (target.str ??= { n: 0, lenSum: 0, lenMin: Infinity, lenMax: 0, distinct: new Map(), overflow: false, formats: {}, examples: [] }); |
| s | const | 299 | no | const s = src.num, t = (target.num ??= { n: 0, min: Infinity, max: -Infinity, sum: 0, distinct: new Set(), overflow: false, epochS: 0, epochMs: 0, changes: 0, last: undefined, examples: [] }); |
| total | const | 300 | no | const total = t.n + s.n, delta = (s.mean ?? 0) - (t.mean ?? 0); |
| s | const | 315 | no | const s = src.obj, t = (target.obj ??= { n: 0, fields: new Map(), keyOverflow: false, keysPerObj: 0, tags: new Map(), fieldSets: new Map() }); |
| tg | const | 325 | no | const tg = t.tags.get(k) ?? new Map(); |
| x | const | 328 | no | const x = tg.get(v) ?? { n: 0, keys: new Map() }; x.n += gg.n; |
| DISTINCT_STATE_CHARS | const | 342 | no | const DISTINCT_STATE_CHARS = 16384; |
| finiteOr | function | 343 | no | const finiteOr = (x, fallback) =&gt; (Number.isFinite(x) ? x : fallback); |
| sketchToState | function | 344 | no | const sketchToState = (s) =&gt; (s ? `${s.precision}:${Buffer.from(s.registers).toString(&#39;base64&#39;)}` : null); |
| sketchFromState | function | 345 | no | function sketchFromState(x) { |
| i | const | 347 | no | const i = x.indexOf(&#39;:&#39;), precision = Number(x.slice(0, i)); |
| nodeToState | function | 351 | no | function nodeToState(n) { |
| out | const | 352 | no | const out = { c: n.count, k: { ...n.kinds } }; |
| s | const | 354 | no | const s = n.str; |
| overflow | variable | 355 | no | let overflow = !!s.overflow, distinct = null; |
| chars | variable | 357 | no | let chars = 0; |
| s | const | 364 | no | const s = n.num; |
| o | const | 371 | no | const o = n.obj; |
| nodeFromState | function | 378 | no | function nodeFromState(st) { |
| n | const | 379 | no | const n = new SchemaNode(); |
| s | const | 383 | no | const s = st.s; |
| sk | const | 386 | no | const sk = sketchFromState(s.sk); if (sk) n.str.sketch = sk; |
| s | const | 389 | no | const s = st.n; |
| sk | const | 395 | no | const sk = sketchFromState(s.sk); if (sk) n.num.sketch = sk; |
| o | const | 400 | no | const o = st.o; |
| jaccard | function | 408 | yes | export function jaccard(a, b) { if (!a.size &amp;&amp; !b.size) return 1; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); } |
| induce | function | 410 | yes | export function induce(values) { const n = new SchemaNode(); for (const v of values) n.observe(v); return n.describe(); } |
| flatten | function | 415 | yes | export function flatten(desc, out = []) { |
| tokens | function | 425 | yes | export const tokens = (name) =&gt; String(name).replace(/\\[\\*\\]/g, &#39;&#39;).split(/[.\\s]/).pop().replace(/([a-z0-9])([A-Z])/g, &#39;$1 $2&#39;).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); |
| SYNONYMS | const | 427 | no | const SYNONYMS = [ |
| SYN | const | 434 | no | const SYN = new Map(); |
| synGroups | function | 436 | no | const synGroups = (toks) =&gt; { const s = new Set(); for (const t of toks) for (const g of SYN.get(t) ?? []) s.add(g); return s; }; |
| nameSimilarity | function | 438 | yes | export function nameSimilarity(a, b) { |
| ta | const | 439 | no | const ta = tokens(a), tb = tokens(b); |
| ja | const | 441 | no | const ja = jaccard(new Set(ta), new Set(tb)); |
| joinedA | const | 443 | no | const joinedA = ta.join(&#39;&#39;), joinedB = tb.join(&#39;&#39;); |
| ga | const | 445 | no | const ga = synGroups([...ta, joinedA]), gb = synGroups([...tb, joinedB]); |
| sg | const | 446 | no | const sg = ga.size &amp;&amp; gb.size ? jaccard(ga, gb) : 0; |
| valueSignature | function | 451 | yes | export function valueSignature(d) { |
| f | const | 452 | no | const f = d.string?.formats ?? {}; |
| valueSimilarity | function | 463 | yes | export function valueSimilarity(a, b) { |
| sa | const | 464 | no | const sa = valueSignature(a), sb = valueSignature(b); |
| s | variable | 465 | no | let s = 0; |
| alignFields | function | 476 | yes | export function alignFields(a, b, { minScore = 0.45 } = {}) { |
| fa | const | 477 | no | const fa = Object.entries(a.fields ?? {}), fb = Object.entries(b.fields ?? {}); |
| cands | const | 478 | no | const cands = []; |
| ns | const | 480 | no | const ns = nameSimilarity(na, nb), vs = valueSimilarity(da, db); |
| score | const | 481 | no | const score = 0.55 * ns + 0.45 * vs; |
| usedA | const | 485 | no | const usedA = new Set(), usedB = new Set(), pairs = []; |
| schemaSimilarity | function | 491 | yes | export function schemaSimilarity(a, b) { |
| na | const | 494 | no | const na = Object.keys(a.fields).length, nb = Object.keys(b.fields).length; |
| matched | const | 495 | no | const matched = pairs.reduce((s, p) =&gt; s + p.score, 0); |
| schemaDiff | function | 500 | yes | export function schemaDiff(oldD, newD) { |
| removed | const | 502 | no | const removed = Object.keys(of).filter((k) =&gt; !(k in nf)); |
| added | const | 503 | no | const added = Object.keys(nf).filter((k) =&gt; !(k in of)); |
| typeChanged | const | 504 | no | const typeChanged = Object.keys(of).filter((k) =&gt; k in nf &amp;&amp; of[k].type !== nf[k].type).map((k) =&gt; ({ field: k, from: of[k].type, to: nf[k].type })); |
| presenceDrop | const | 505 | no | const presenceDrop = Object.keys(of).filter((k) =&gt; k in nf &amp;&amp; of[k].presence - nf[k].presence &gt; 0.3).map((k) =&gt; ({ field: k, from: of[k].presence, to: nf[k].presence })); |
| repairs | const | 507 | no | const repairs = []; |
| sub | function | 509 | no | const sub = (d, keys) =&gt; ({ fields: Object.fromEntries(keys.map((k) =&gt; [k, d.fields[k]])) }); |
| al | const | 510 | no | const al = alignFields(sub(oldD, removed), sub(newD, added), { minScore: 0.35 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./statistics.mjs | import | 10 | [studio/src/intel/statistics.mjs](./statistics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/run.mjs](../../eval/run.mjs.md) | ../src/intel/schema.mjs |
| [studio/src/intel/corpus.mjs](./corpus.mjs.md) | ./schema.mjs |
| [studio/src/intel/discover.mjs](./discover.mjs.md) | ./schema.mjs |
| [studio/src/intel/learn.mjs](./learn.mjs.md) | ./schema.mjs |
| [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) | ../intel/schema.mjs |
| [studio/src/shapes/profiler.mjs](../shapes/profiler.mjs.md) | ../intel/schema.mjs |

## Annotations

_No annotations._

## Excerpt

````javascript
// Schema induction for arbitrary JSON-like values, online and bounded.
//
// Approach (after genson / Spark JSON inference, extended):
//   - Each path keeps per-kind statistics; a value never forces a premature decision.
//   - describe() decides late: object vs dynamic-key map, plain object vs tagged union,
//     enum vs free string, and attaches string/number formats.
//   - Every decision carries the statistic it was based on, so uncertainty is inspectable.
// Memory is bounded: distinct-value tracking caps out, variant tracking drops high-cardinality tags.

import { CardinalitySketch } from './statistics.mjs';

const DISTINCT_CAP = 200;
const TAG_MAX_VALUES = 24;
const KEY_CAP = 400;

export const FORMAT_TESTS = {
  uuid: (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
  iso_time: (s) => /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s),
  url: (s) => /^(https?:)?\/\/[^\s]+$/.test(s) || /^\/[\w\-./%?=&#]+$/.test(s) && s.length > 1 && s.includes('/') && !/\s/.test(s) && s.length < 300,
  email: (s) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s),
  pointer: (s) => /^\/[\w~-]+(\/[\w~-]+)*$/.test(s) && s.length < 80,
  token_id: (s) => /^[A-Za-z][A-Za-z0-9]*[_-][A-Za-z0-9_-]{6,}$/.test(s) && !/\s/.test(s),
  hex_id: (s) => /^[0-9a-f]{12,}$/i.test(s),
  numeric_string: (s) => /^-?\d+(\.\d+)?$/.test(s),
  markdown: (s) => s.length > 20 && /(^|\n)(#{1,6} |\* |- |\d+\. |```|\|.*\|)/.test(s),
  multiline: (s) => s.includes('\n'),
};

// Format detection is a pure function of the string, and the same strings recur constantly
// (enum values, repeated keys, the cumulative + window double observation). Bounded memo.
const FORMAT_MEMO_MAX = 8192;
const FORMAT_MEMO_STR_MAX = 256;
const formatMemo = new Map();
// Cheap necessary conditions, checked before the regex. A guard may only ever say "cannot match";
// it never decides a match, so results equal running every test (test/unit/capture-perf.test.mjs
// checks this against the raw FORMAT_TESTS on a corpus). Applies only to the stock tests.
const FORMAT_TEST_SNAPSHOT = { ...FORMAT_TESTS };
const isDigitCode = (c) => c >= 48 && c <= 57;
const FORMAT_GUARDS = {
  uuid: (s) => s.length === 36,
  iso_time: (s) => s.length >= 10 && isDigitCode(s.charCodeAt(0)),
  url: (s) => { const c = s.charCodeAt(0); return c === 104 /* h */ || c === 47 /* / */; },
  email: (s) => s.includes('@'),
  pointer: (s) => s.charCodeAt(0) === 47,
  token_id: (s) => s.length >= 8,
  hex_id: (s) => s.length >= 12,
  numeric_string: (s) => { const c = s.charCodeAt(0); return isDigitCode(c) || c === 45 /* - */; },
};
// [name, test, guard] triples built once (the entries array used to be re-allocated per string).
const FORMAT_PLAN = Object.entries(FORMAT_TESTS).map(([f, test]) => [f, test, test === FORMAT_TEST_SNAPSHOT[f] ? FORMAT_GUARDS[f] : undefined]);
export function computeFormats(s) {
  const out = [];
  for (let i = 0; i < FORMAT_PLAN.length; i++) {
    const plan = FORMAT_PLAN[i];
    if (plan[2] !== undefined && !plan[2](s)) continue;
    if (plan[1](s)) out.push(plan[0]);
  }
  return out;
}
function formatsOf(s) {
  if (s.length > FORMAT_MEMO_STR_MAX) return computeFormats(s);
  let r = formatMemo.get(s);
  if (r === undefined) {
    r = computeFormats(s);
    if (formatMemo.size >= FORMAT_MEMO_MAX) formatMemo.clear();
    formatMemo.set(s, r);
  }
  return r;
}

// Sorted key signature of an object. Objects of one shape arrive in the same key order, so the
// sort + join is memoised on the unsorted key sequence (bounded). Result is identical.
const SIG_MEMO_MAX = 1024;
const sigMemo = new Map();
function sortedSignature(keys) {
  const n = keys.length;
  if (n < 2) return n ? keys[0] : '';
  const raw = keys.join('\u0000');
  const hit = sigMemo.get(raw);
  if (hit !== undefined && hit.keys.length === n) {
````

_First 80 of 515 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
