# File: studio/src/profiles/stream-map.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/stream-map.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28157 B |
| Lines | 552 |
| Hash | 2ef56147e473 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STREAM_MAP_SCHEMA | const | 47 | yes | export const STREAM_MAP_SCHEMA = &#39;capture-studio.stream-map/1&#39;; |
| FAMILY_COMPONENTS | const | 50 | no | const FAMILY_COMPONENTS = [&#39;paragraph&#39;, &#39;heading&#39;, &#39;list&#39;, &#39;table&#39;, &#39;code&#39;, &#39;quote&#39;, &#39;image&#39;, &#39;file&#39;, &#39;link&#39;, &#39;citation&#39;, &#39;equation&#39;, &#39;rule&#39;, &#39;tool&#39;, &#39;unknown&#39;]; |
| OP_COMPONENTS | const | 52 | no | const OP_COMPONENTS = [...FAMILY_COMPONENTS, &#39;message&#39;]; |
| OPS | const | 53 | no | const OPS = [&#39;open&#39;, &#39;append&#39;, &#39;close&#39;, &#39;finalize&#39;, &#39;ignore&#39;, &#39;signal&#39;]; |
| WHEN_KEYS | const | 54 | no | const WHEN_KEYS = [&#39;event&#39;, &#39;type&#39;, &#39;block.type&#39;, &#39;delta.type&#39;, &#39;path&#39;, &#39;o&#39;, &#39;hasKey&#39;, &#39;terminal&#39;, &#39;data&#39;, &#39;nonNull&#39;, &#39;isObject&#39;, &#39;equals&#39;]; |
| NULLABLE_WHEN | const | 55 | no | const NULLABLE_WHEN = [&#39;event&#39;, &#39;type&#39;, &#39;block.type&#39;, &#39;delta.type&#39;]; |
| SIGNAL_KINDS | const | 56 | no | const SIGNAL_KINDS = [&#39;error&#39;, &#39;status&#39;]; |
| DOTTED_PATH | const | 57 | no | const DOTTED_PATH = /^[A-Za-z_][A-Za-z0-9_]*(\\.[A-Za-z_][A-Za-z0-9_]*)*$/; |
| isDottedPath | function | 58 | no | const isDottedPath = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; DOTTED_PATH.test(s); |
| CODE_TOKEN | const | 60 | no | const CODE_TOKEN = /^[A-Za-z0-9_.:-]+$/; |
| codeToken | function | 61 | no | const codeToken = (v) =&gt; (typeof v === &#39;string&#39; &amp;&amp; v.length &lt;= 64 &amp;&amp; CODE_TOKEN.test(v) ? v : null); |
| DIALECTS | const | 62 | no | const DIALECTS = [&#39;json-patch&#39;, &#39;json-merge-patch&#39;, &#39;path-ops&#39;, &#39;dotted-set&#39;, &#39;array-splice&#39;, &#39;put-merge&#39;, &#39;ot-ops&#39;, &#39;typed-events&#39;]; |
| DOM_COMPONENT_MAP | const | 68 | no | const DOM_COMPONENT_MAP = { |
| CLAUDE_TYPED_EVENTS | const | 85 | no | const CLAUDE_TYPED_EVENTS = { |
| CHATGPT_PATH_OPS | const | 108 | no | const CHATGPT_PATH_OPS = { |
| OPENAI_RESPONSES | const | 180 | no | const OPENAI_RESPONSES = { |
| deepFreeze | function | 201 | no | function deepFreeze(o) { |
| DEFAULT_STREAM_MAPS | const | 209 | yes | export const DEFAULT_STREAM_MAPS = deepFreeze([CLAUDE_TYPED_EVENTS, CHATGPT_PATH_OPS, OPENAI_RESPONSES]); |
| isObj | function | 211 | no | const isObj = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| usableId | function | 212 | no | const usableId = (v) =&gt; (typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0) \|\| Number.isFinite(v); |
| getPath | function | 214 | no | function getPath(obj, dotted) { |
| node | variable | 215 | no | let node = obj; |
| canonicalWhen | function | 224 | no | function canonicalWhen(when) { |
| validateStreamMap | function | 228 | yes | export function validateStreamMap(map) { |
| errors | const | 229 | no | const errors = []; |
| s | const | 238 | no | const s = map.stream; |
| seen | const | 248 | no | const seen = new Set(); |
| at | const | 250 | no | const at = `stream.ops[${i}]`; |
| okType | variable | 258 | no | let okType; |
| sig | const | 269 | no | const sig = canonicalWhen(r.when); |
| isPathLike | function | 303 | no | const isPathLike = (u) =&gt; isObj(u) &amp;&amp; (&#39;p&#39; in u \|\| &#39;o&#39; in u \|\| (&#39;v&#39; in u &amp;&amp; !(&#39;type&#39; in u))); |
| unitsOf | function | 306 | no | function unitsOf(json) { |
| ruleMatches | function | 315 | no | function ruleMatches(when, view, unit) { |
| hit | const | 328 | no | const hit = want.endsWith(&#39;*&#39;) ? view.path.startsWith(want.slice(0, -1)) : view.path === want; |
| paths | const | 333 | no | const paths = Array.isArray(want) ? want : [want]; |
| any | const | 334 | no | const any = paths.some((p) =&gt; { const x = getPath(unit, p); return x !== undefined &amp;&amp; x !== null &amp;&amp; x !== &#39;&#39;; }); |
| x | const | 344 | no | const x = getPath(unit, p); |
| got | const | 349 | no | const got = view[k]; |
| blockIndexOf | function | 355 | no | function blockIndexOf(scope, stream) { |
| raw | const | 357 | no | const raw = getPath(scope, stream.blockIndexPath); |
| present | const | 358 | no | const present = (typeof raw === &#39;string&#39; &amp;&amp; raw !== &#39;&#39;) \|\| Number.isFinite(raw); |
| s | variable | 360 | no | let s = String(raw); |
| m | const | 362 | no | const m = new RegExp(stream.blockIndexPattern).exec(s); |
| messageIdOf | function | 369 | no | function messageIdOf(scope, stream) { |
| raw | const | 371 | no | const raw = getPath(scope, stream.messageIdPath); |
| describeView | function | 375 | no | const describeView = (v) =&gt; [ |
| runMap | function | 383 | no | function runMap(map, events) { |
| stream | const | 384 | no | const stream = map.stream; |
| rules | const | 385 | no | const rules = stream.ops; |
| timeline | const | 386 | no | const timeline = []; |
| unmapped | const | 387 | no | const unmapped = []; |
| components | const | 388 | no | const components = []; |
| signals | const | 389 | no | const signals = []; |
| st | const | 390 | no | const st = { lastPath: null, messageId: null, finalized: false }; |
| list | const | 391 | no | const list = Array.isArray(events) ? events : []; |
| units | variable | 392 | no | let units = 0; |
| matched | variable | 393 | no | let matched = 0; |
| newComponent | function | 395 | no | const newComponent = (key, component, e) =&gt; ({ componentKey: key, component, text: &#39;&#39;, opened: { seq: e.seq, n: e.n }, closed: null, }); |
| findOpen | function | 398 | no | const findOpen = (key, component) =&gt; { |
| c | const | 400 | no | const c = components[i]; |
| emitSignal | function | 408 | no | const emitSignal = (idx, u, ref) =&gt; { |
| r | const | 409 | no | const r = rules[idx]; |
| code | const | 410 | no | const code = r.codePath === undefined ? null : codeToken(getPath(u, r.codePath)); |
| text | const | 411 | no | const text = r.textPath === undefined ? undefined : getPath(u, r.textPath); |
| e | const | 422 | no | const e = isObj(ev) ? ev : {}; |
| base | const | 423 | no | const base = { sid: e.sid, seq: e.seq, n: e.n }; |
| ref | const | 426 | no | const ref = sub === undefined ? base : { ...base, sub }; |
| u | const | 428 | no | const u = unit; |
| pathLike | const | 429 | no | const pathLike = isPathLike(u); |
| p | variable | 430 | no | let p; |
| o | variable | 431 | no | let o; |
| view | const | 436 | no | const view = { |
| resolve | function | 449 | no | const resolve = () =&gt; { |
| r | const | 451 | no | const r = rules[i]; |
| idx | const | 458 | no | const idx = resolve(); |
| app | const | 460 | no | const app = rules.findIndex((r) =&gt; r.op === &#39;append&#39; &amp;&amp; ruleMatches(r.when, view, u)); |
| rule | const | 466 | no | const rule = rules[idx]; |
| scope | const | 468 | no | const scope = pathLike ? { ...u, p } : (isObj(u) ? u : {}); |
| keyed | const | 472 | no | const keyed = rule.keyPath !== undefined; |
| keyedId | const | 473 | no | const keyedId = keyed ? getPath(u, rule.keyPath) : undefined; |
| mid | const | 474 | no | const mid = keyed ? (usableId(keyedId) ? String(keyedId) : undefined) : messageIdOf(scope, stream); |
| bi | const | 476 | no | const bi = blockIndexOf(scope, stream); |
| key | const | 477 | no | const key = keyed ? (mid ?? null) : (st.messageId != null &amp;&amp; bi != null ? `${st.messageId}:${bi}` : null); |
| text | const | 489 | no | const text = getPath(u, rule.textPath); |
| c | variable | 491 | no | let c = findOpen(key, rule.component); |
| c | const | 502 | no | const c = findOpen(key, rule.component); |
| stats | const | 520 | no | const stats = { |
| applyStreamMap | function | 538 | yes | export function applyStreamMap(map, events) { |
| v | const | 539 | no | const v = validateStreamMap(map); |
| detectStreamMap | function | 546 | yes | export function detectStreamMap(events) { |
| candidates | const | 547 | no | const candidates = DEFAULT_STREAM_MAPS.map((m) =&gt; ({ id: m.id, matched: runMap(m, events).matched })); |
| best | const | 548 | no | const best = Math.max(...candidates.map((c) =&gt; c.matched)); |
| top | const | 549 | no | const top = candidates.filter((c) =&gt; c.matched === best); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/categorization-scoreboard.mjs](../../scripts/categorization-scoreboard.mjs.md) | ../src/profiles/stream-map.mjs |
| [studio/scripts/fidelity-survey.mjs](../../scripts/fidelity-survey.mjs.md) | ../src/profiles/stream-map.mjs |
| [studio/scripts/induce-vs-handmap.mjs](../../scripts/induce-vs-handmap.mjs.md) | ../src/profiles/stream-map.mjs |
| [studio/src/profiles/stream-map-induce.mjs](./stream-map-induce.mjs.md) | ./stream-map.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../profiles/stream-map.mjs |
| [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) | ../profiles/stream-map.mjs |
| [studio/src/replay/stream-components.mjs](../replay/stream-components.mjs.md) | ../profiles/stream-map.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Stream-to-component map: declarative rules that say which parsed stream events open, extend,
// close or finish which UI component part of an AI chat answer, plus the DOM block-type mapping.
// Pure functions only: no I/O, no clock, no randomness. Not wired into manage/apply/families/
// derive/server/UI (a later lane does that).
//
// Vocabulary a `when` object may use (every key must match):
//   event        SSE "event:" name (decoded ev.event)
//   type         json.type; null means json.type is absent
//   block.type   json.content_block.type
//   delta.type   json.delta.type
//   path         effective JSON-patch pointer for path-ops; a trailing "*" means prefix match
//   o            effective path-op ("append" when omitted)
//   hasKey       json has this key. A dotted path (e.g. "v.error_code") checks a nested key;
//                a plain key checks the top level only (unchanged)
//   terminal     ev.terminal === true
//   data         raw SSE data string (e.g. "[DONE]")
//   nonNull      a dotted path, or an array of them (ANY): the value exists and is not null, undefined or ""
//   isObject     a dotted path whose value is a plain object (not an array, not a string)
//   equals       { "dotted.path": "text" }: the value at the path is a string equal to "text" (case-insensitive)
//
// Op "open" may carry keyPath (dotted path, open only): the component key is the usable id found at
// that path in the event itself (e.g. "v.message.id"); a message container is keyed by its id alone.
// The id also becomes the message id that later block keys use.
//
// Stream-level fields: messageIdPath and blockIndexPath are dotted paths read from the operation
// (the bare event payload, or one sub-operation of a path-op patch with its effective "p" filled
// in). blockIndexPattern, when present, is a regex whose first capture group is the block index.
// messageId is carried forward from the last event that carried one, so a block event inherits
// the id from its message_start. A componentKey is "<messageId>:<blockIndex>" only when both are
// known; otherwise it is null. Keys are never invented.
//
// Path-op handling follows src/decode/delta.mjs: a bare { v } continues the previous pointer, and
// an { o: "patch", v: [...] } envelope is expanded into its sub-operations (each keeps the parent
// sid/seq/n and gets a `sub` index).
//
// Op "signal" (additive): an event that reports something about the stream (an error envelope,
// or a status frame) rather than reply text. It never enters the timeline or the components. It is
// listed in `signals` as { sid, seq, n, kind, code, messageChars, rule }. `code` is kept only when
// it is a short token; message text is never copied, only its length (messageChars).
//
// Resolution: the first rule (in list order) whose `when` matches wins. One exception: an "append"
// rule whose textPath is not a string does not claim the event; the search continues with the rules
// after it. Such an event was unmapped before, so no timeline entry changes. This lets later rules
// (open, ignore, signal) see a bare envelope that continued a text pointer. Signal rules stay after
// the existing rules, so they cannot change what those rules already match.

export const STREAM_MAP_SCHEMA = 'capture-studio.stream-map/1';

// Mirrors families/ai-chat.json content_block.type (this module does no file I/O, so it is copied).
const FAMILY_COMPONENTS = ['paragraph', 'heading', 'list', 'table', 'code', 'quote', 'image', 'file', 'link', 'citation', 'equation', 'rule', 'tool', 'unknown'];
// Ops may also open 'message', the turn container (an entity, not a content block).
const OP_COMPONENTS = [...FAMILY_COMPONENTS, 'message'];
const OPS = ['open', 'append', 'close', 'finalize', 'ignore', 'signal'];
const WHEN_KEYS = ['event', 'type', 'block.type', 'delta.type', 'path', 'o', 'hasKey', 'terminal', 'data', 'nonNull', 'isObject', 'equals'];
const NULLABLE_WHEN = ['event', 'type', 'block.type', 'delta.type'];
const SIGNAL_KINDS = ['error', 'status'];
const DOTTED_PATH = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const isDottedPath = (s) => typeof s === 'string' && DOTTED_PATH.test(s);
// A signal code is kept only as a short token; anything else (long, spaced, numeric) becomes null.
const CODE_TOKEN = /^[A-Za-z0-9_.:-]+$/;
const codeToken = (v) => (typeof v === 'string' && v.length <= 64 && CODE_TOKEN.test(v) ? v : null);
const DIALECTS = ['json-patch', 'json-merge-patch', 'path-ops', 'dotted-set', 'array-splice', 'put-merge', 'ot-ops', 'typed-events'];

// DOM agent block types -> family component. Identity for the types shared with the family enum.
// Explicit mappings for DOM-only types. rule, equation and file exist in the family enum, so they
// keep their own identity instead of collapsing to unknown (mapping them to unknown discards
// information the family can represent). Only graphic and details have no family equivalent.
const DOM_COMPONENT_MAP = {
  heading: 'heading',
  paragraph: 'paragraph',
  list: 'list',
  table: 'table',
  code: 'code',
  quote: 'quote',
  image: 'image',
  media: 'image',
  figure: 'image',
  graphic: 'unknown',
  details: 'unknown',
  rule: 'rule',
```

_First 80 of 553 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
