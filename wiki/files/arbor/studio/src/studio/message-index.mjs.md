# File: studio/src/studio/message-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/message-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9225 B |
| Lines | 182 |
| Hash | ab41a0a5245a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KIND | const | 16 | yes | export const KIND = { ask: 0, work: 1, reply: 2, event: 3 }; |
| STATUS | const | 17 | yes | export const STATUS = { ok: 0, partial: 1, fail: 2, uncertain: 3, refused: 4 }; |
| EFFORT | const | 18 | yes | export const EFFORT = { instant: 0, medium: 1, high: 2 }; |
| EVIDENCE | const | 19 | yes | export const EVIDENCE = { claim: 0, observation: 1, verified: 2 }; |
| invert | function | 21 | no | const invert = (table) =&gt; Object.fromEntries(Object.entries(table).map(([k, v]) =&gt; [v, k])); |
| KIND_BY_CODE | const | 22 | no | const KIND_BY_CODE = invert(KIND); |
| STATUS_BY_CODE | const | 23 | no | const STATUS_BY_CODE = invert(STATUS); |
| EFFORT_BY_CODE | const | 24 | no | const EFFORT_BY_CODE = invert(EFFORT); |
| EVIDENCE_BY_CODE | const | 25 | no | const EVIDENCE_BY_CODE = invert(EVIDENCE); |
| FRAME_RE | const | 27 | no | const FRAME_RE = /^(?:\\[\\[\|⟦)\\s*(.+?)\\s*(?:\\]\\]\|⟧)$/; |
| unwrap | function | 30 | no | function unwrap(line) { |
| m | const | 31 | no | const m = FRAME_RE.exec(String(line ?? &#39;&#39;).trim()); |
| body | const | 33 | no | const body = m[1]; |
| parts | const | 34 | no | const parts = (body.includes(&#39;\|&#39;) ? body.split(&#39;\|&#39;) : body.split(/\\s+/)).map((p) =&gt; p.trim()); |
| head | const | 35 | no | const head = /^([HF])(\\d+)$/.exec(parts[0] ?? &#39;&#39;); |
| resolve | function | 41 | no | function resolve(table, codeTable, value, field) { |
| raw | const | 42 | no | const raw = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| dash | function | 48 | no | const dash = (v) =&gt; (v === null \|\| v === undefined \|\| v === &#39;&#39; ? &#39;-&#39; : String(v)); |
| encodeHeader | function | 51 | yes | export function encodeHeader({ id, rid, parent, src, dst, kind, thread, effort, version = 1 }) { |
| k | const | 55 | no | const k = resolve(KIND, KIND_BY_CODE, kind, &#39;kind&#39;); |
| e | const | 56 | no | const e = resolve(EFFORT, EFFORT_BY_CODE, effort ?? &#39;medium&#39;, &#39;effort&#39;); |
| encodeFooter | function | 64 | yes | export function encodeFooter({ status, evidence = &#39;claim&#39;, turns = 0, ms = 0, costMicroUsd = null, receipt = null, hash = &#39;&#39;, version = 1, harnessVerified = false }) { |
| s | const | 65 | no | const s = resolve(STATUS, STATUS_BY_CODE, status, &#39;status&#39;); |
| ev | const | 66 | no | const ev = resolve(EVIDENCE, EVIDENCE_BY_CODE, evidence, &#39;evidence&#39;); |
| h | const | 70 | no | const h = String(hash ?? &#39;&#39;).replace(/^sha256:/i, &#39;&#39;).slice(0, 16); |
| t | const | 72 | no | const t = Number.isInteger(turns) &amp;&amp; turns &gt;= 0 ? turns : 0; |
| m | const | 73 | no | const m = Number.isFinite(ms) &amp;&amp; ms &gt;= 0 ? Math.round(ms) : 0; |
| c | const | 74 | no | const c = Number.isInteger(costMicroUsd) &amp;&amp; costMicroUsd &gt;= 0 ? costMicroUsd : null; |
| parseFrame | function | 79 | yes | export function parseFrame(line) { |
| k | const | 84 | no | const k = resolve(KIND, KIND_BY_CODE, kind, &#39;kind&#39;); |
| e | const | 85 | no | const e = resolve(EFFORT, EFFORT_BY_CODE, effort, &#39;effort&#39;); |
| s | const | 94 | no | const s = resolve(STATUS, STATUS_BY_CODE, status, &#39;status&#39;); |
| ev | const | 95 | no | const ev = resolve(EVIDENCE, EVIDENCE_BY_CODE, evidence, &#39;evidence&#39;); |
| frameMessage | function | 106 | yes | export function frameMessage(header, body, footer) { |
| readMessage | function | 111 | yes | export function readMessage(text) { |
| lines | const | 112 | no | const lines = String(text ?? &#39;&#39;).split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter((l) =&gt; l.length); |
| header | const | 114 | no | const header = parseFrame(lines[0]); |
| footer | const | 115 | no | const footer = parseFrame(lines[lines.length - 1]); |
| VOCABULARY | const | 126 | yes | export const VOCABULARY = [ |
| V_RE | const | 133 | no | const V_RE = /^(?:\\[\\[\|⟦)V(\\d+)\\\|([^\|⟧\\]]+)\\\|(\\d+)\\\|([^\|⟧\\]]+)(?:\\]\\]\|⟧)$/; |
| encodeVocab | function | 135 | yes | export function encodeVocab({ table, code, word, version = 1 }) { |
| parseVocab | function | 141 | yes | export function parseVocab(line) { |
| m | const | 142 | no | const m = V_RE.exec(String(line ?? &#39;&#39;).trim()); |
| encodeVocabulary | function | 148 | yes | export function encodeVocabulary(vocabulary = VOCABULARY) { |
| tablesFromVocabulary | function | 153 | yes | export function tablesFromVocabulary(lines) { |
| tables | const | 154 | no | const tables = {}; |
| selfCheck | function | 166 | yes | export function selfCheck() { |
| built | const | 167 | no | const built = tablesFromVocabulary(encodeVocabulary()); |
| expected | const | 168 | no | const expected = { kind: KIND, status: STATUS, effort: EFFORT, evidence: EVIDENCE }; |
| a | const | 170 | no | const a = JSON.stringify(table); |
| b | const | 171 | no | const b = JSON.stringify(built[name] ?? {}); |
| round | const | 174 | no | const round = encodeVocabulary(VOCABULARY.map((v) =&gt; ({ ...v }))); |
| rebuilt | const | 175 | no | const rebuilt = tablesFromVocabulary(round); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../bin/commands/chat.mjs.md) | ../../src/studio/message-index.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./message-index.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Header/footer index codec V1 (co-designed with ChatGPT 2026-11-04): indices, not words. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-12 |
| 5 | see | — | docs/chatgpt-channel/INDEX-V0.md | docs/chatgpt-channel/INDEX-V0.md |
| 6 | invariant | — | — | a line that does not parse is reported, never guessed into a valid message. |
| 7 | invariant | — | — | these lines are DESCRIPTIVE, never authoritative: only the harness may assert |

## Excerpt

```javascript
/**
 * @hq:context Header/footer index codec V1 (co-designed with ChatGPT 2026-11-04): indices, not words.
 * @hq:owner atlas
 * @hq:task VC-12
 * @hq:see docs/chatgpt-channel/INDEX-V0.md
 * @hq:invariant a line that does not parse is reported, never guessed into a valid message.
 * @hq:invariant these lines are DESCRIPTIVE, never authoritative: only the harness may assert
 *              local verification, and encodeFooter refuses to do so without that authority.
 */
// The compression is the index: each field is a small integer pointing into a table both ends hold.
// V1 changes over V0, all of them ChatGPT's: a replay id distinct from the message id, a causal
// parent, four kinds instead of six (execution is an action, not an intent), an explicit cost slot,
// and a receipt reference binding a footer to its trace. ASCII brackets are emitted so no terminal
// encoding can corrupt the frame; the pretty brackets are accepted on read.

export const KIND = { ask: 0, work: 1, reply: 2, event: 3 };
export const STATUS = { ok: 0, partial: 1, fail: 2, uncertain: 3, refused: 4 };
export const EFFORT = { instant: 0, medium: 1, high: 2 };
export const EVIDENCE = { claim: 0, observation: 1, verified: 2 };

const invert = (table) => Object.fromEntries(Object.entries(table).map(([k, v]) => [v, k]));
const KIND_BY_CODE = invert(KIND);
const STATUS_BY_CODE = invert(STATUS);
const EFFORT_BY_CODE = invert(EFFORT);
const EVIDENCE_BY_CODE = invert(EVIDENCE);

const FRAME_RE = /^(?:\[\[|⟦)\s*(.+?)\s*(?:\]\]|⟧)$/;

/** Strip brackets and split into fields. Pipe is canonical; whitespace is accepted on read. */
function unwrap(line) {
  const m = FRAME_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('INDEX_NOT_A_FRAME');
  const body = m[1];
  const parts = (body.includes('|') ? body.split('|') : body.split(/\s+/)).map((p) => p.trim());
  const head = /^([HF])(\d+)$/.exec(parts[0] ?? '');
  if (!head) throw new Error('INDEX_NOT_A_FRAME');
  return { type: head[1], version: Number(head[2]), fields: parts.slice(1) };
}

/** Resolve a field written as an index or as its word. Unknown values are an error. */
function resolve(table, codeTable, value, field) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw in table) return table[raw];
  if (/^\d+$/.test(raw) && Number(raw) in codeTable) return Number(raw);
  throw new Error(`INDEX_BAD_${field.toUpperCase()}: "${value}"`);
}

const dash = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

/** Encode the header that opens a message. */
export function encodeHeader({ id, rid, parent, src, dst, kind, thread, effort, version = 1 }) {
  if (!id) throw new Error('INDEX_ID_REQUIRED');
  if (!rid) throw new Error('INDEX_RID_REQUIRED');
  if (!src || !dst) throw new Error('INDEX_PARTIES_REQUIRED');
  const k = resolve(KIND, KIND_BY_CODE, kind, 'kind');
  const e = resolve(EFFORT, EFFORT_BY_CODE, effort ?? 'medium', 'effort');
  return `[[H${version}|${id}|${rid}|${dash(parent)}|${src}|${dst}|${k}|${dash(thread)}|${e}]]`;
}

/**
 * Encode the footer that closes a message. `verified` is refused unless the caller holds local
 * harness authority; an agent may only ever submit a claim or an observation.
 */
export function encodeFooter({ status, evidence = 'claim', turns = 0, ms = 0, costMicroUsd = null, receipt = null, hash = '', version = 1, harnessVerified = false }) {
  const s = resolve(STATUS, STATUS_BY_CODE, status, 'status');
  const ev = resolve(EVIDENCE, EVIDENCE_BY_CODE, evidence, 'evidence');
  if (ev === EVIDENCE.verified && harnessVerified !== true) {
    throw new Error('INDEX_VERIFICATION_NOT_AUTHORIZED');
  }
  const h = String(hash ?? '').replace(/^sha256:/i, '').slice(0, 16);
  if (h && !/^[0-9a-f]{16}$/i.test(h)) throw new Error('INDEX_BAD_HASH');
  const t = Number.isInteger(turns) && turns >= 0 ? turns : 0;
  const m = Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : 0;
  const c = Number.isInteger(costMicroUsd) && costMicroUsd >= 0 ? costMicroUsd : null;
  return `[[F${version}|${s}|${ev}|${t}|${m}|${dash(c)}|${dash(receipt)}|${dash(h)}]]`;
}

/** Parse one frame line. Returns {type, ...fields} carrying both indices and their words. */
export function parseFrame(line) {
  const { type, version, fields } = unwrap(line);
```

_First 80 of 183 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
