# File: studio/src/decode/delta.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/decode/delta.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26063 B |
| Lines | 481 |
| Hash | f917d4eb0591 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PATH_OPS | const | 20 | no | const PATH_OPS = new Set([&#39;append&#39;, &#39;replace&#39;, &#39;add&#39;, &#39;remove&#39;, &#39;patch&#39;, &#39;set&#39;, &#39;truncate&#39;, &#39;insert&#39;, &#39;delete&#39;, &#39;merge&#39;, &#39;splice&#39;, &#39;increment&#39;]); |
| TYPED | const | 21 | no | const TYPED = /(^\|[._])(start\|stop\|delta\|done\|created\|completed\|added\|in_progress\|chunk\|partial\|update\|updated)$/; |
| TYPED_START | const | 22 | no | const TYPED_START = /(^\|[._])(start\|created\|added\|in_progress)$/; |
| TYPED_STOP | const | 23 | no | const TYPED_STOP = /(^\|[._])(stop\|done\|completed)$/; |
| TYPED_DELTA | const | 24 | no | const TYPED_DELTA = /(delta\|chunk\|partial)/; |
| INDEX_KEYS | const | 25 | no | const INDEX_KEYS = [&#39;index&#39;, &#39;output_index&#39;, &#39;content_index&#39;, &#39;block_index&#39;, &#39;candidate_index&#39;, &#39;choice_index&#39;]; |
| DELTA_KEYS | const | 26 | no | const DELTA_KEYS = [&#39;delta&#39;, &#39;text_delta&#39;, &#39;chunk&#39;, &#39;partial&#39;, &#39;diff&#39;]; |
| TEXT_DELTA_FIELD | const | 28 | no | const TEXT_DELTA_FIELD = /^(text\|content\|value\|token\|tokens\|append\|partial\|chunk\|delta\|body\|output_text\|message_text\|answer\|completion)$/i; |
| usableId | function | 30 | no | const usableId = (v) =&gt; (typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0) \|\| Number.isFinite(v); |
| META_LEAF | const | 34 | no | const META_LEAF = /^(?:id\|type\|role\|model\|status\|object\|created\|created_at\|updated_at\|stop_reason\|stop_sequence\|finish_reason\|content_type\|messageId\|_done\|_incomplete)$\|_id$/i; |
| META_SUBTREE | const | 37 | no | const META_SUBTREE = /(?:^\|\\/)metadata\\//; |
| isMetaTextPath | function | 38 | no | const isMetaTextPath = (p) =&gt; (p.startsWith(&#39;/meta/&#39;) \|\| META_SUBTREE.test(p) \|\| META_LEAF.test(p.slice(p.lastIndexOf(&#39;/&#39;) + 1))) ? 1 : 0; |
| parsePointer | function | 40 | yes | export function parsePointer(p) { |
| parseDotted | function | 45 | yes | export function parseDotted(p) { |
| parts | const | 48 | no | const parts = []; |
| m | const | 49 | no | const m = /^([^[]*)((\\[\\d+\\])*)$/.exec(seg); |
| getParent | function | 57 | no | function getParent(doc, parts, create) { |
| node | variable | 58 | no | let node = doc; |
| k | const | 60 | no | const k = parts[i]; |
| getPointer | function | 70 | yes | export function getPointer(doc, parts) { |
| node | variable | 71 | no | let node = doc; |
| applyMergePatch | function | 80 | yes | export function applyMergePatch(target, patch) { |
| base | const | 82 | no | const base = (target &amp;&amp; typeof target === &#39;object&#39; &amp;&amp; !Array.isArray(target)) ? target : {}; |
| detectDialect | function | 90 | yes | export function detectDialect(json) { |
| arr | const | 91 | no | const arr = Array.isArray(json) ? json : [json]; |
| keys | const | 96 | no | const keys = Object.keys(json); |
| DeltaAssembler | class | 109 | yes | export class DeltaAssembler { |
| constructor | method | 111 | yes | constructor(arg = &#39;auto&#39;) { |
| opts | const | 112 | no | const opts = typeof arg === &#39;string&#39; ? { dialect: arg } : (arg ?? {}); |
| _note | method | 135 | yes | _note(op, path) { |
| _fail | method | 144 | yes | _fail(reason, detail) { |
| _commit | method | 150 | yes | _commit() { |
| apply | method | 160 | yes | apply(json) { |
| d | const | 162 | no | const d = this.dialect === &#39;auto&#39; ? detectDialect(json) : this.dialect; |
| parts | const | 175 | no | const parts = parseDotted(json.path ?? json.key); |
| _ensureDoc | method | 203 | yes | _ensureDoc() { if (this.doc === undefined \|\| this.doc === null \|\| typeof this.doc !== &#39;object&#39;) this.doc = {}; } |
| _set | method | 205 | yes | _set(parts, value, mode) { |
| parent | const | 208 | no | const parent = getParent(this.doc, parts, true); |
| key | const | 209 | no | const key = parts[parts.length - 1]; |
| cur | const | 211 | no | const cur = parent[key]; |
| cur | const | 221 | no | const cur = parent[key]; |
| _jsonPatch | method | 230 | yes | _jsonPatch(op) { |
| parts | const | 231 | no | const parts = parsePointer(op.path); |
| v | const | 238 | no | const v = getPointer(this.doc, from); |
| v | const | 246 | no | const v = getPointer(this.doc, parsePointer(op.from)); |
| v | const | 253 | no | const v = getPointer(this.doc, parts); |
| ok | const | 254 | no | const ok = JSON.stringify(v) === JSON.stringify(op.value); |
| _pathOp | method | 263 | yes | _pathOp(op) { |
| path | const | 271 | no | const path = op.p !== undefined ? op.p : this.lastPath; |
| mode | const | 274 | no | const mode = op.o ?? &#39;append&#39;; |
| _splice | method | 279 | yes | _splice(op) { |
| parts | const | 281 | no | const parts = op.path ? (String(op.path).startsWith(&#39;/&#39;) ? parsePointer(op.path) : parseDotted(op.path)) : []; |
| parent | const | 289 | no | const parent = getParent(this.doc, parts, true); |
| key | const | 290 | no | const key = parts[parts.length - 1]; |
| _putMerge | method | 297 | yes | _putMerge(op) { |
| spec | const | 298 | no | const spec = op.put ?? op.merge; |
| raw | const | 300 | no | const raw = spec.path ?? &#39;&#39;; |
| parts | const | 301 | no | const parts = String(raw).startsWith(&#39;/&#39;) ? parsePointer(raw) : parseDotted(String(raw).replace(/^\\/+\|\\/+$/g, &#39;&#39;).replace(/\\//g, &#39;.&#39;)); |
| data | const | 302 | no | const data = &#39;data&#39; in spec ? spec.data : spec.value; |
| _otOps | method | 316 | yes | _otOps(json) { |
| path | const | 317 | no | const path = typeof json.path === &#39;string&#39; ? json.path : null; |
| parts | const | 318 | no | const parts = path ? (path.startsWith(&#39;/&#39;) ? parsePointer(path) : parseDotted(path)) : [&#39;text&#39;]; |
| parent | const | 320 | no | const parent = getParent(this.doc, parts, true); |
| key | const | 321 | no | const key = parts[parts.length - 1]; |
| text | variable | 322 | no | let text = typeof parent[key] === &#39;string&#39; ? parent[key] : &#39;&#39;; |
| cursor | variable | 323 | no | let cursor = 0; |
| applied | variable | 324 | no | let applied = false; |
| _setMessageId | method | 336 | yes | _setMessageId(id, source) { |
| _idFromSnapshot | method | 347 | yes | _idFromSnapshot() { |
| id | const | 349 | no | const id = this.doc?.message?.id; |
| _typed | method | 353 | yes | _typed(ev) { |
| t | const | 354 | no | const t = ev.type; |
| mid | const | 358 | no | const mid = ev.message?.id ?? ev.id; |
| rid | const | 364 | no | const rid = ev.response?.id; |
| iid | const | 368 | no | const iid = ev.item_id; |
| key | const | 371 | no | const key = INDEX_KEYS.filter((k) =&gt; Number.isInteger(ev[k])).map((k) =&gt; ev[k]).join(&#39;.&#39;); |
| rootObj | function | 372 | no | const rootObj = () =&gt; { for (const [k, v] of Object.entries(this.doc)) if (k !== &#39;blocks&#39; &amp;&amp; v !== this._meta &amp;&amp; v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v)) return v; return this.doc; }; |
| objectFields | const | 373 | no | const objectFields = Object.entries(ev).filter(([k, v]) =&gt; k !== &#39;type&#39; &amp;&amp; !DELTA_KEYS.includes(k) &amp;&amp; !INDEX_KEYS.includes(k) &amp;&amp; v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v)); |
| target | const | 384 | no | const target = key ? ((this.doc.blocks ??= {})[key] ??= {}) : rootObj(); |
| dk | const | 385 | no | const dk = DELTA_KEYS.find((k) =&gt; ev[k] !== undefined); |
| d | const | 386 | no | const d = dk ? ev[dk] : undefined; |
| inline | const | 399 | no | const inline = [&#39;text&#39;, &#39;content&#39;, &#39;value&#39;, &#39;token&#39;, &#39;append&#39;].find((k) =&gt; typeof ev[k] === &#39;string&#39;); |
| texts | method | 417 | yes | texts(minLength = 1) { |
| out | const | 418 | no | const out = []; |
| walk | function | 420 | no | const walk = (node, p, ptr) =&gt; { |
| textOf | method | 432 | yes | textOf(path) { |
| parts | const | 433 | no | const parts = String(path ?? &#39;&#39;).startsWith(&#39;/&#39;) ? parsePointer(path) : parseDotted(path); |
| v | const | 434 | no | const v = getPointer(this.doc, parts); |
| blocks | method | 439 | yes | blocks() { |
| b | const | 440 | no | const b = this.doc?.blocks; |
| primaryText | method | 450 | yes | primaryText(minLength = 1) { return this.texts(minLength)[0]?.text; } |
| stats | method | 452 | yes | stats() { |
| bytes | variable | 453 | no | let bytes = 0; |
| finalize | method | 463 | yes | finalize({ complete = true } = {}) { |
| reconstruct | function | 472 | yes | export function reconstruct(items, { dialect = &#39;auto&#39;, opsLog = 0, snapshotEvery = 0 } = {}) { |
| a | const | 473 | no | const a = new DeltaAssembler({ dialect, opsLog, snapshotEvery }); |
| applied | variable | 474 | no | let applied = 0; |
| json | const | 476 | no | const json = it &amp;&amp; typeof it === &#39;object&#39; &amp;&amp; &#39;json&#39; in it ? it.json : it; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/replay.mjs](../../bin/commands/replay.mjs.md) | ../../src/decode/delta.mjs |
| [studio/src/capture/live-tap.mjs](../capture/live-tap.mjs.md) | ../decode/delta.mjs |
| [studio/src/mirror/synthesize.mjs](../mirror/synthesize.mjs.md) | ../decode/delta.mjs |
| [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) | ../decode/delta.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../decode/delta.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Generic delta/patch assembler. Many streaming UIs send a document once and then patches.
// The dialects below are recognised automatically from operation shape, never from a provider
// name, so a new site that uses a known encoding is reconstructed without any configuration:
//
//   json-patch        RFC 6902 operations { op, path, value } (add/remove/replace/move/copy/test)
//   json-merge-patch  RFC 7386 recursive merge where null deletes a key
//   path-ops          compact ops { p: "/a/b", o: "append|replace|add|remove|patch", v }
//                     where a bare { v: "..." } continues appending to the previous path
//   dotted-set        { path: "a.b.c", value } / { key, value } with dot-separated paths
//   array-splice      { path, splice: [start, deleteCount, ...items] }
//   put-merge         { put: { path, data } } / { merge: { path, data } } tree writes
//   ot-ops            { ops: [{ insert }, { retain }, { delete }] } text operational transforms
//   typed-events      { type: "x_start" | "x_delta" | "x_stop" | "a.b.delta", index?, delta? }
//                     start events carry objects, delta events append strings to the indexed
//                     block, stop/done events finalise
//
// Anything else is treated as a full document replacement when it is a plain object.
// Every applied operation counts as a revision, so intermediate states can be replayed.

const PATH_OPS = new Set(['append', 'replace', 'add', 'remove', 'patch', 'set', 'truncate', 'insert', 'delete', 'merge', 'splice', 'increment']);
const TYPED = /(^|[._])(start|stop|delta|done|created|completed|added|in_progress|chunk|partial|update|updated)$/;
const TYPED_START = /(^|[._])(start|created|added|in_progress)$/;
const TYPED_STOP = /(^|[._])(stop|done|completed)$/;
const TYPED_DELTA = /(delta|chunk|partial)/;
const INDEX_KEYS = ['index', 'output_index', 'content_index', 'block_index', 'candidate_index', 'choice_index'];
const DELTA_KEYS = ['delta', 'text_delta', 'chunk', 'partial', 'diff'];
// Field names whose string values are incremental content rather than a replaced attribute.
const TEXT_DELTA_FIELD = /^(text|content|value|token|tokens|append|partial|chunk|delta|body|output_text|message_text|answer|completion)$/i;
// A provider-supplied id is usable only when it is a non-empty string or a finite number.
const usableId = (v) => (typeof v === 'string' && v.length > 0) || Number.isFinite(v);

// Leaves that describe a message rather than carry its content. Matched on the last path segment;
// everything under /meta/ (the assembler's own bookkeeping) counts too.
const META_LEAF = /^(?:id|type|role|model|status|object|created|created_at|updated_at|stop_reason|stop_sequence|finish_reason|content_type|messageId|_done|_incomplete)$|_id$/i;
// A message's own /metadata/ subtree (for example ChatGPT's model_dil_v2 render code and
// fallbackMarkdown) describes or re-renders the reply; the reply itself is under content/parts.
const META_SUBTREE = /(?:^|\/)metadata\//;
const isMetaTextPath = (p) => (p.startsWith('/meta/') || META_SUBTREE.test(p) || META_LEAF.test(p.slice(p.lastIndexOf('/') + 1))) ? 1 : 0;

export function parsePointer(p) {
  if (p === '' || p === '/' || p === undefined || p === null) return [];
  return String(p).split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function parseDotted(p) {
  if (p === undefined || p === null || p === '') return [];
  return String(p).split('.').flatMap((seg) => {
    const parts = [];
    const m = /^([^[]*)((\[\d+\])*)$/.exec(seg);
    if (!m) return [seg];
    if (m[1]) parts.push(m[1]);
    for (const idx of (m[2] ?? '').match(/\d+/g) ?? []) parts.push(idx);
    return parts;
  });
}

function getParent(doc, parts, create) {
  let node = doc;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (node[k] === undefined || node[k] === null || typeof node[k] !== 'object') {
      if (!create) return undefined;
      node[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    node = node[k];
  }
  return node;
}

export function getPointer(doc, parts) {
  let node = doc;
  for (const k of parts) {
    if (node === undefined || node === null || typeof node !== 'object') return undefined;
    node = node[k];
  }
  return node;
}

// RFC 7386 JSON merge patch (null deletes).
export function applyMergePatch(target, patch) {
```

_First 80 of 482 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
