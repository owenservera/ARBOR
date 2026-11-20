# File: studio/src/intel/join.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/join.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24069 B |
| Lines | 438 |
| Hash | 80a65526e05c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STATUSES | const | 56 | no | const STATUSES = [&#39;verified&#39;, &#39;partial&#39;, &#39;near_match&#39;, &#39;ambiguous&#39;, &#39;text_mismatch&#39;, &#39;unlinked_stream&#39;, &#39;unlinked_dom&#39;]; |
| TEXT_LIKE | const | 57 | no | const TEXT_LIKE = new Set([&#39;paragraph&#39;, &#39;text&#39;, &#39;heading&#39;, &#39;list&#39;, &#39;quote&#39;, &#39;code&#39;, &#39;markdown&#39;]); |
| DOM_TEXT | const | 58 | no | const DOM_TEXT = new Set([&#39;paragraph&#39;, &#39;heading&#39;, &#39;list&#39;, &#39;quote&#39;, &#39;code&#39;]); |
| NEAR_THRESHOLD | const | 60 | yes | export const NEAR_THRESHOLD = 0.95; |
| NEAR_OTHER_CEILING | const | 61 | no | const NEAR_OTHER_CEILING = 0.8; |
| sourcesCompatible | function | 67 | yes | export function sourcesCompatible(a, b) { |
| pairAllowed | function | 76 | no | const pairAllowed = (a, b) =&gt; sourcesCompatible(a.source, b.source) |
| ROLE_SYNONYMS | const | 80 | no | const ROLE_SYNONYMS = { |
| normalizeRole | function | 87 | yes | export function normalizeRole(r) { |
| k | const | 88 | no | const k = String(r ?? &#39;&#39;).trim().toLowerCase(); |
| ENTITY | const | 94 | no | const ENTITY = /&amp;(#x[0-9a-f]+\|#[0-9]+\|amp\|lt\|gt\|quot\|apos\|nbsp);/gi; |
| NAMED_ENTITY | const | 95 | no | const NAMED_ENTITY = { amp: &#39;&amp;&#39;, lt: &#39;&lt;&#39;, gt: &#39;&gt;&#39;, quot: &#39;&quot;&#39;, apos: &quot;&#39;&quot;, nbsp: &#39; &#39; }; |
| decodeEntity | function | 96 | no | function decodeEntity(whole, body) { |
| b | const | 97 | no | const b = body.toLowerCase(); |
| cp | const | 99 | no | const cp = b[1] === &#39;x&#39; ? parseInt(b.slice(2), 16) : parseInt(b.slice(1), 10); |
| valid | const | 100 | no | const valid = Number.isInteger(cp) &amp;&amp; cp &gt; 0 &amp;&amp; cp &lt;= 0x10ffff &amp;&amp; (cp &lt; 0xd800 \|\| cp &gt; 0xdfff); |
| FENCE | const | 105 | no | const FENCE = /^[ \\t]*(`{3,}\|~{3,})(.*)$/; |
| HR | const | 106 | no | const HR = /^[ \\t]*([-*_])(?:[ \\t]*\\1){2,}[ \\t]*$/; |
| IMG_REF | const | 107 | no | const IMG_REF = /!\\[([^\\]]*)\\]\\[[^\\]]*\\]/g; |
| IMG_INLINE | const | 108 | no | const IMG_INLINE = /!\\[([^\\]]*)\\]\\((?:[^()\\s]\|\\([^()\\s]*\\))*(?:\\s+&quot;[^&quot;]*&quot;)?\\)/g; |
| LINK_REF | const | 109 | no | const LINK_REF = /(?&lt;![\\w\\]])\\[([^\\]]*[A-Za-z][^\\]]*)\\]\\[[^\\]]*\\]/g; |
| LINK_INLINE | const | 110 | no | const LINK_INLINE = /(?&lt;![\\w\\]])\\[([^\\]]*)\\]\\((?:[^()\\s]\|\\([^()\\s]*\\))*(?:\\s+&quot;[^&quot;]*&quot;)?\\)/g; |
| CITE_SPACED | const | 111 | no | const CITE_SPACED = /(?&lt;=[\\p{L}\\p{N}.,;:!?&quot;&#39;\\]])[ \\t]+\\[\\^?\\d+\\](?=$\|[\\s.,;:!?])/gu; |
| CITE_ATTACHED | const | 112 | no | const CITE_ATTACHED = /(?&lt;=[.,;:!?&quot;&#39;])\\[\\^?\\d+\\](?=$\|[\\s.,;:!?])/gu; |
| CITE_TOOL | const | 113 | no | const CITE_TOOL = /[ \\t]*【\\d+(?::\\d+)?†[^】]*】/gu; |
| STRIKE | const | 114 | no | const STRIKE = /~~([^~\\n]+)~~/g; |
| EMPH_STAR | const | 115 | no | const EMPH_STAR = /(^\|[^\\w*])\\*(?!\\s)([^*\\n]*\\w)\\*(?![\\w*])/g; |
| EMPH_UNDER | const | 116 | no | const EMPH_UNDER = /(^\|[^\\w_])_(?!\\s)([^_\\n]*\\w)_(?![\\w_])/g; |
| MARKERS | const | 117 | no | const MARKERS = /\\*\\*\|__\|`/g; |
| HEADING | const | 118 | no | const HEADING = /^[ \\t]*#{1,6}[ \\t]+/; |
| QUOTE | const | 119 | no | const QUOTE = /^[ \\t]*&gt;[ \\t]?/; |
| BULLET | const | 120 | no | const BULLET = /^[ \\t]*(?:[-*+]\|\\d+[.)])[ \\t]+/; |
| isTableSeparator | function | 124 | no | function isTableSeparator(line) { |
| cells | const | 126 | no | const cells = line.split(&#39;\|&#39;).map((c) =&gt; c.trim()).filter((c) =&gt; c !== &#39;&#39;); |
| codeLine | function | 130 | no | function codeLine(line) { |
| proseLine | function | 134 | no | function proseLine(line) { |
| s | variable | 135 | no | let s = line.replace(MARKERS, &#39;&#39;); |
| normalizeForJoin | function | 149 | yes | export function normalizeForJoin(text) { |
| src | const | 150 | no | const src = String(text ?? &#39;&#39;) |
| kept | const | 158 | no | const kept = []; |
| fence | variable | 159 | no | let fence = null; |
| fm | const | 161 | no | const fm = FENCE.exec(line); |
| relate | function | 178 | no | function relate(s, t) { |
| fitsRel | function | 185 | no | const fitsRel = (rel) =&gt; rel === &#39;exact&#39; \|\| rel === &#39;prefix&#39;; |
| textMatchOf | function | 186 | no | const textMatchOf = (rel) =&gt; (fitsRel(rel) ? rel : rel === &#39;empty&#39; ? &#39;none&#39; : &#39;differs&#39;); |
| textMatchFor | function | 187 | no | const textMatchFor = (status, rel) =&gt; (status === &#39;near_match&#39; ? &#39;near&#39; : status === &#39;ambiguous&#39; ? &#39;none&#39; : textMatchOf(rel)); |
| tokenDice | function | 190 | no | function tokenDice(a, b) { |
| A | const | 191 | no | const A = a.split(&#39; &#39;).filter(Boolean); |
| B | const | 192 | no | const B = b.split(&#39; &#39;).filter(Boolean); |
| counts | const | 194 | no | const counts = new Map(); |
| common | variable | 196 | no | let common = 0; |
| c | const | 198 | no | const c = counts.get(t) ?? 0; |
| nearScore | function | 205 | no | function nearScore(s, t, rel) { |
| d | const | 207 | no | const d = tokenDice(s, t); |
| nearNote | function | 210 | no | const nearNote = (score) =&gt; `near_match: token Dice ${score.toFixed(3)} &gt;= ${NEAR_THRESHOLD}; texts differ after normalization, not verified`; |
| nearText | function | 214 | no | function nearText(m, free) { |
| scored | const | 215 | no | const scored = free.map((x) =&gt; ({ x, score: tokenDice(m.nt, x.nt) })); |
| hits | const | 216 | no | const hits = scored.filter((s) =&gt; s.score &gt;= NEAR_THRESHOLD); |
| hit | const | 219 | no | const hit = hits[0]; |
| othersLow | const | 220 | no | const othersLow = scored.every((s) =&gt; s === hit \|\| s.score &lt; NEAR_OTHER_CEILING); |
| decide | function | 229 | no | function decide(rel, final, notes) { |
| blockCompatible | function | 240 | no | function blockCompatible(s, d) { |
| st | const | 242 | no | const st = String(s.type).toLowerCase(), dt = String(d.type ?? &#39;&#39;).toLowerCase(); |
| byNaturalIndex | function | 252 | no | const byNaturalIndex = (a, b) =&gt; String(a.index).localeCompare(String(b.index), undefined, { numeric: true }); |
| linkBlocks | function | 254 | no | function linkBlocks(sbs, dbs, final) { |
| out | const | 255 | no | const out = []; |
| reason | const | 257 | no | const reason = `block counts differ (stream ${sbs.length}, dom ${dbs.length}): no ordinal link`; |
| ss | const | 262 | no | const ss = [...sbs].sort(byNaturalIndex); |
| ds | const | 264 | no | const ds = dbs.every((d) =&gt; Number.isFinite(d.ord)) ? [...dbs].sort((a, b) =&gt; a.ord - b.ord) : dbs; |
| s | const | 266 | no | const s = ss[i], d = ds[i]; |
| notes | const | 272 | no | const notes = [`paired by rank ${i}: stream index ${JSON.stringify(s.index)} &lt;-&gt; dom ord ${d.ord}`]; |
| rel | const | 273 | no | const rel = relate(s.nt, d.nt); |
| joinStreamToDom | function | 279 | yes | export function joinStreamToDom({ messages = [], turns = [] } = {}) { |
| ms | const | 280 | no | const ms = (Array.isArray(messages) ? messages : []).map((m, pos) =&gt; { const x = m ?? {}; return { pos, key: x.key ?? null, messageId: x.messageId ?? null, role: normalizeRole(x.role), nt: normalizeF… |
| x | const | 281 | no | const x = m ?? {}; |
| ts | const | 288 | no | const ts = (Array.isArray(turns) ? turns : []).map((t, pos) =&gt; { const x = t ?? {}; return { pos, index: x.index ?? pos, id: x.id ?? null, domId: x.domId ?? null, role: normalizeRole(x.role), nt: nor… |
| x | const | 289 | no | const x = t ?? {}; |
| res | const | 297 | no | const res = new Array(ms.length).fill(null); // message pos -&gt; { status, turnPos, textMatch, evidence } |
| claimed | const | 298 | no | const claimed = new Map(); // turn pos -&gt; message pos |
| candidateOf | const | 299 | no | const candidateOf = new Map(); // turn pos -&gt; [message pos] (ambiguous candidacy) |
| addCand | function | 300 | no | const addCand = (tp, mp) =&gt; { if (!candidateOf.has(tp)) candidateOf.set(tp, []); candidateOf.get(tp).push(mp); }; |
| roles | const | 301 | no | const roles = [...new Set([...ms, ...ts].map((x) =&gt; x.role))]; |
| mL | const | 304 | no | const mL = ms.filter((x) =&gt; x.role === role); |
| tL | const | 305 | no | const tL = ts.filter((x) =&gt; x.role === role); |
| countsEqual | const | 306 | no | const countsEqual = mL.length === tL.length; |
| countNote | const | 307 | no | const countNote = countsEqual ? null : `role counts differ (stream ${mL.length}, dom ${tL.length}): aligned by text, ordering not assumed`; |
| aligned | variable | 308 | no | let aligned = true; |
| m | const | 312 | no | const m = mL[i]; |
| t | const | 314 | no | const t = tL[i]; |
| rel | const | 316 | no | const rel = relate(m.nt, t.nt); |
| notes | const | 317 | no | const notes = [&#39;ordering assumed from equal role counts&#39;]; |
| fits | const | 318 | no | const fits = tL.filter((x) =&gt; pairAllowed(m, x) &amp;&amp; fitsRel(relate(m.nt, x.nt))); |
| evidence | const | 319 | no | const evidence = { rule: &#39;order+text&#39;, ordering: &#39;position&#39;, notes, candidates: [] }; |
| status | variable | 320 | no | let status, turnPos = t.pos; |
| score | const | 334 | no | const score = nearScore(m.nt, t.nt, rel); |
| notes | const | 350 | no | const notes = countNote ? [countNote] : []; |
| evidence | const | 353 | no | const evidence = { rule: &#39;text-only&#39;, ordering: &#39;text&#39;, notes, candidates: [] }; |
| fits | const | 354 | no | const fits = tL.filter((x) =&gt; !claimed.has(x.pos) &amp;&amp; pairAllowed(m, x) &amp;&amp; fitsRel(relate(m.nt, x.nt))); |
| near | const | 356 | no | const near = nearText(m, tL.filter((x) =&gt; !claimed.has(x.pos) &amp;&amp; pairAllowed(m, x))); |
| t | const | 375 | no | const t = fits[0]; |
| rel | const | 376 | no | const rel = relate(m.nt, t.nt); |
| links | const | 382 | no | const links = []; |
| r | const | 384 | no | const r = res[m.pos]; |
| t | const | 385 | no | const t = r.turnPos === null ? null : ts[r.turnPos]; |
| blockLinks | const | 386 | no | const blockLinks = t &amp;&amp; (r.status === &#39;verified&#39; \|\| r.status === &#39;partial&#39;) ? linkBlocks(m.blocks, t.blocks, m.final) : []; |
| messageStatus | const | 404 | no | const messageStatus = Object.fromEntries(STATUSES.map((s) =&gt; [s, 0])); |
| blockStatus | const | 405 | no | const blockStatus = Object.fromEntries(STATUSES.map((s) =&gt; [s, 0])); |
| rules | const | 406 | no | const rules = { &#39;order+text&#39;: 0, &#39;text-only&#39;: 0, ordinal: 0 }; |
| summary | const | 412 | no | const summary = { messages: ms.length, turns: ts.length, messageStatus, blockStatus, rules, |
| verifiedContentRelations | function | 421 | yes | export function verifiedContentRelations({ messages = [], links = [] } = {}) { |
| out | const | 422 | no | const out = []; |
| m | const | 425 | no | const m = messages[link.messageIndex]; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/fidelity-survey.mjs](../../scripts/fidelity-survey.mjs.md) | ../src/intel/join.mjs |
| [studio/scripts/proto-field-search.mjs](../../scripts/proto-field-search.mjs.md) | ../src/intel/join.mjs |
| [studio/src/intel/correlate.mjs](./correlate.mjs.md) | ./join.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/join.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Verified stream-to-DOM join: ties each parsed stream message (and its blocks) to the rendered
// DOM turn (and block) it produced. Deterministic, honest: an unmatched element stays unlinked and
// a tie stays ambiguous. Pure functions on plain objects; no I/O; no imports from capture code.
//
// INPUT
//   messages: [{ key, messageId, role, text, final: bool, blocks: [{ key, index, type, text }] }]
//     stream order. key: `${messageId}:${index}`-style string, or null (then joined by text only).
//     blocks[].index: stream block index. type: optional stream block type (paragraph, heading,
//     list, quote, code, ...); when absent, the type check is skipped.
//   turns: [{ index, id, domId, role, text, blocks: [{ ord, type, text }] }]
//     document order. blocks[].ord: 0-based ordinal among sibling blocks in document order.
//
// OUTPUT
//   { links, summary }
//   link = { messageKey, messageIndex, messageId, role, turnIndex, turnId, domId, status,
//            textMatch, blockLinks, evidence }
//   status (message and block level):
//     verified        aligned (order or unique text) AND normalized text equal (final stream)
//     partial         stream text is a strict prefix of rendered text (stream not final, or render
//                     ahead); also an exact match of a stream message still marked not final
//     near_match      aligned or uniquely found, texts NOT equal after normalization, but token
//                     Dice >= NEAR_THRESHOLD. Never verified; never justifies block links; the score
//                     is in evidence.notes. Positional pass: the aligned turn is near. Text-only pass:
//                     exactly one free turn is >= NEAR_THRESHOLD and every other free turn is < 0.8.
//     ambiguous       more than one candidate fits and order/ordinal does not decide; no link
//     text_mismatch   aligned by order but text differs (or render is behind stream); no text
//                     with nothing to verify (both empty) also lands here
//     unlinked_stream a stream element with no candidate
//     unlinked_dom    a DOM element no stream element claimed
//   textMatch: exact | prefix | near | differs | none
//   evidence.rule: order+text (position + text), ordinal (duplicate text decided by position with
//     all earlier messages aligned), text-only (joined by text; order not used), null (unlinked).
//
// RULES
//   Roles: normalizeRole maps role synonyms on BOTH sides. Its table mirrors
//   families/ai-chat.json (normalize map and valueHints); a unit test reads the JSON to stop drift.
//   Per role (user/assistant/...):
//   - Equal role counts and keyed message: positional. Stream i <-> DOM i, then text decides.
//     Duplicate DOM text: ordinal decides only if every earlier message of the role was aligned;
//     otherwise ambiguous.
//   - Otherwise (counts differ, or null key): text only. A message links to a free DOM turn only
//     when exactly one free turn fits (equal or stream-prefix); several fitting turns -> ambiguous.
//     With no fitting turn, the near-match tier may apply (see near_match above).
//     Ordering is not assumed and evidence.notes says so.
//   Blocks: linked only for verified/partial messages, and only when block counts agree. Stream
//     block index -> DOM block with the same ord; type must be compatible (text-like stream types
//     map to paragraph/heading/list/quote/code; equal types always compatible).
//   Near-match metric: multiset Dice coefficient over whitespace tokens of the normalized texts,
//     D = 2 * |A ∩ B| / (|A| + |B|), where |A ∩ B| counts each token min(countA, countB) times.
//     Chosen over containment |A ∩ B| / min(|A|, |B|): containment scores a short stream fragment
//     inside a long render as 1.0, which is the prefix-of-render case that must not read as near.
//     Dice penalises the length gap, so one extra word in a 22-token sentence scores 0.978 (near)
//     and two replaced words score 0.909 (not near).
//   Normalization: see normalizeForJoin (NFKC, entities, zero-width, links, citations, fences, etc.).

const STATUSES = ['verified', 'partial', 'near_match', 'ambiguous', 'text_mismatch', 'unlinked_stream', 'unlinked_dom'];
const TEXT_LIKE = new Set(['paragraph', 'text', 'heading', 'list', 'quote', 'code', 'markdown']);
const DOM_TEXT = new Set(['paragraph', 'heading', 'list', 'quote', 'code']);

export const NEAR_THRESHOLD = 0.95;
const NEAR_OTHER_CEILING = 0.8;

// Role synonyms. Mirrors families/ai-chat.json entities.message.fields.role.normalize (human, ai,
// model, bot) and its valueHints. Extras are common provider labels.
// Explicit provenance fences joins by provider origin, account and native thread.
// Two unscoped legacy inputs remain comparable, but are never source-qualified.
export function sourcesCompatible(a, b) {
  if (a == null && b == null) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  for (const key of ['origin', 'account', 'threadRef']) {
    if (typeof a[key] !== 'string' || !a[key].trim() || a[key] !== b[key]) return false;
  }
  if (a.sessionId != null || b.sessionId != null) return !!a.sessionId && a.sessionId === b.sessionId;
  return true;
}
const pairAllowed = (a, b) => sourcesCompatible(a.source, b.source)
  && (a.nativeMessageId == null || b.nativeMessageId == null
    || (typeof a.nativeMessageId === 'string' && a.nativeMessageId === b.nativeMessageId));

const ROLE_SYNONYMS = {
```

_First 80 of 439 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
