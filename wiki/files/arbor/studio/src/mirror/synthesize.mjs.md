# File: studio/src/mirror/synthesize.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/synthesize.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11946 B |
| Lines | 240 |
| Hash | bfcfb35d4cd7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sseBlock | function | 20 | yes | export function sseBlock({ event, id, retry, data, comments }) { |
| s | variable | 21 | no | let s = &#39;&#39;; |
| frameText | function | 30 | no | function frameText(unit, payload) { |
| makeUnit | function | 36 | no | function makeUnit(ev, framing, at, payloadText, raw, opcode) { |
| envRaw | const | 37 | no | const envRaw = ev.envelope &amp;&amp; !ev.headerOnly &amp;&amp; typeof ev.envelope.raw === &#39;string&#39; ? ev.envelope.raw : &#39;&#39;; |
| rewritable | variable | 38 | no | let rewritable = false; |
| unitsFromStreamEvents | function | 51 | yes | export function unitsFromStreamEvents(events, t0) { |
| units | const | 52 | no | const units = []; |
| at | const | 54 | no | const at = Math.max(0, (ev.t ?? t0) - t0); |
| unitsFromWsFrames | function | 65 | yes | export function unitsFromWsFrames(frames) { |
| ev | const | 68 | no | const ev = decodeWsPayload({ opcode: 1, payload: f.text }); |
| renderUnit | function | 73 | yes | export function renderUnit(unit, forDeltaJson, at = unit.at) { |
| outer | const | 75 | no | const outer = unit.nestedKey ? { ...unit.outer, [unit.nestedKey]: JSON.stringify(forDeltaJson) } : forDeltaJson; |
| payload | const | 76 | no | const payload = unit.envRaw + JSON.stringify(outer); |
| findLeaf | function | 83 | no | function findLeaf(node, pred, p = []) { |
| setLeaf | function | 91 | no | function setLeaf(obj, leaf, value) { |
| node | variable | 93 | no | let node = obj; |
| mapLeaves | function | 99 | no | function mapLeaves(node, fn) { |
| learnDeltas | function | 106 | yes | export function learnDeltas(units, { dialect = &#39;auto&#39; } = {}) { |
| full | const | 107 | no | const full = new DeltaAssembler({ dialect, opsLog: 0 }); |
| primary | const | 109 | no | const primary = full.texts(1).filter((t) =&gt; !/\\/_(incomplete\|done)$/.test(t.path))[0]; |
| parts | const | 111 | no | const parts = primary.path.split(&#39;/&#39;).slice(1); |
| a | const | 112 | no | const a = new DeltaAssembler({ dialect, opsLog: 0 }); |
| textAt | function | 113 | no | const textAt = (doc) =&gt; { const v = getPointer(doc, parts); return typeof v === &#39;string&#39; ? v : &#39;&#39;; }; |
| deltas | const | 114 | no | const deltas = [], opaque = new Set(); |
| base | variable | 115 | no | let base = null; |
| before | const | 118 | no | const before = textAt(a.doc); |
| after | const | 120 | no | const after = textAt(a.doc); |
| mode | variable | 122 | no | let mode = null, leaf = null; |
| piece | const | 124 | no | const piece = after.slice(before.length); |
| splitText | function | 142 | yes | export function splitText(text, size = 4) { |
| n | const | 144 | no | const n = Math.max(1, Math.round(size)); |
| toks | const | 145 | no | const toks = text.match(/\\s*\\S+\|\\s+$/g) ?? [text]; |
| out | const | 146 | no | const out = []; |
| cur | variable | 147 | no | let cur = &#39;&#39;; |
| cps | const | 156 | no | const cps = Array.from(p), r = []; |
| median | function | 162 | no | const median = (xs) =&gt; { if (!xs.length) return 0; const s = [...xs].sort((a, b) =&gt; a - b); return s[Math.floor(s.length / 2)]; }; |
| synthesizeUnits | function | 168 | yes | export function synthesizeUnits(units, text, { dialect = &#39;auto&#39;, pieceSize } = {}) { |
| L | const | 169 | no | const L = learnDeltas(units, { dialect }); |
| first | const | 171 | no | const first = L.deltas[0].i, last = L.deltas[L.deltas.length - 1].i; |
| deltaAt | const | 172 | no | const deltaAt = new Map(L.deltas.map((d) =&gt; [d.i, d])); |
| target | const | 173 | no | const target = typeof text === &#39;string&#39; ? text : L.finalText; |
| resetBase | const | 174 | no | const resetBase = L.base &amp;&amp; !target.startsWith(L.base); |
| base | const | 175 | no | const base = resetBase ? &#39;&#39; : L.base; |
| streamed | const | 176 | no | const streamed = target.slice(base.length); |
| changed | const | 177 | no | const changed = target !== L.finalText; |
| fixUnit | function | 179 | no | const fixUnit = (u, at) =&gt; { |
| touched | variable | 185 | no | let touched = false; |
| json | const | 186 | no | const json = mapLeaves(u.json, (s) =&gt; { if (changed &amp;&amp; s === L.finalText) { touched = true; return target; } if (changed &amp;&amp; L.finalText.length &gt;= 8 &amp;&amp; s.includes(L.finalText)) { touched = true; retur… |
| out | const | 195 | no | const out = []; |
| grow | const | 198 | no | const grow = L.deltas.map((d) =&gt; d.grew).filter((n) =&gt; n &gt; 0 &amp;&amp; n &lt; 400); |
| size | const | 199 | no | const size = pieceSize ?? Math.max(1, median(grow) \|\| 4); |
| pieces | const | 200 | no | const pieces = splitText(streamed, size); |
| ats | const | 201 | no | const ats = L.deltas.map((d) =&gt; units[d.i].at); |
| gaps | const | 202 | no | const gaps = ats.slice(1).map((t, k) =&gt; Math.max(0, t - ats[k])); |
| mids | const | 204 | no | const mids = []; |
| at | variable | 209 | no | let at = units[first].at, acc = &#39;&#39;, m = 0; |
| tpl | const | 213 | no | const tpl = L.deltas[Math.min(k, L.deltas.length - 1)]; |
| json | const | 215 | no | const json = setLeaf(structuredClone(units[tpl.i].json), tpl.leaf, tpl.mode === &#39;append&#39; ? pieces[k] : base + acc); |
| lastAt | const | 219 | no | const lastAt = units[last].at; |
| chk | const | 223 | no | const chk = new DeltaAssembler({ dialect, opsLog: 0 }); |
| got | const | 225 | no | const got = getPointer(chk.doc, L.parts); |
| ok | const | 226 | no | const ok = got === base + streamed; |
| summary | function | 235 | no | function summary(L) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../decode/delta.mjs | import | 14 | [studio/src/decode/delta.mjs](../decode/delta.mjs.md) |
| ../decode/decoders.mjs | import | 15 | [studio/src/decode/decoders.mjs](../decode/decoders.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./synthesize.mjs |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./synthesize.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// "Synthesize" mode: stream a reconstructed (or substituted) answer in the delta dialect that was
// learned from the capture.
//
// Learning works on the decoded event sequence of one captured stream (SSE, NDJSON or WebSocket
// text frames): the events are re-applied through DeltaAssembler (decode/delta.mjs) exactly as
// the reducer does, the primary text path of the final document is located, and every event that
// grows that text is classified as a delta *carrier*:
//   append      a string leaf equal to the appended piece (typed-events, path-ops, ot-ops, ...)
//   cumulative  a string leaf equal to the whole text so far (json-patch replace, full documents)
// Synthesis then keeps the captured preamble/postamble events, and emits one cloned carrier event
// per text piece (template i follows captured delta i, the last template repeats), with the
// captured inter-delta rhythm. The output is re-assembled through a fresh DeltaAssembler as a
// self-check: if it does not reproduce the requested text, the caller falls back to replay.
import { DeltaAssembler, getPointer } from '../decode/delta.mjs';
import { decodeWsPayload } from '../decode/decoders.mjs';

// ---------------------------------------------------------------------------------------------
// Units: one decoded event plus everything needed to re-serialize it.
// ---------------------------------------------------------------------------------------------
export function sseBlock({ event, id, retry, data, comments }) {
  let s = '';
  for (const c of comments ?? []) s += `: ${c}\n`;
  if (event !== undefined && event !== 'message') s += `event: ${event}\n`;
  if (id !== undefined) s += `id: ${id}\n`;
  if (retry !== undefined) s += `retry: ${retry}\n`;
  if (data !== undefined && (data !== '' || !s)) for (const line of String(data).split('\n')) s += `data: ${line}\n`;
  return s + '\n';
}

function frameText(unit, payload) {
  if (unit.framing === 'sse') return sseBlock({ ...unit.ev, data: payload });
  if (unit.framing === 'ndjson') return payload + '\n';
  return payload;
}

function makeUnit(ev, framing, at, payloadText, raw, opcode) {
  const envRaw = ev.envelope && !ev.headerOnly && typeof ev.envelope.raw === 'string' ? ev.envelope.raw : '';
  let rewritable = false;
  if (ev.json !== undefined && typeof payloadText === 'string' && payloadText.startsWith(envRaw)) {
    try { JSON.parse(payloadText.slice(envRaw.length)); rewritable = true; } catch { rewritable = false; }
  }
  return {
    at, framing, ev, raw, opcode, payloadText, envRaw, rewritable,
    outer: ev.json, nestedKey: ev.jsonNested?.key ?? null,
    json: ev.jsonNested?.json !== undefined ? ev.jsonNested.json : ev.json,
  };
}

// HTTP stream events as produced by StreamReducer / reconstructStream. Returns null when the
// framing cannot be re-serialized (chunked-json, gRPC, ...).
export function unitsFromStreamEvents(events, t0) {
  const units = [];
  for (const ev of events) {
    const at = Math.max(0, (ev.t ?? t0) - t0);
    if (ev.type === 'sse' || ev.type === 'sse.comment' || ev.type === 'eventsource') {
      units.push(makeUnit(ev, 'sse', at, ev.type === 'sse.comment' ? undefined : ev.data, sseBlock(ev)));
    } else if (ev.type === 'ndjson') {
      units.push(makeUnit(ev, 'ndjson', at, ev.text, `${ev.text}\n`));
    } else return null;
  }
  return units;
}

// WebSocket frames of one turn: [{ rel, opcode, text, payload:Buffer }].
export function unitsFromWsFrames(frames) {
  return frames.map((f) => {
    if (f.opcode !== 1 || typeof f.text !== 'string') return { at: f.rel, framing: 'ws', ev: {}, raw: f.payload, opcode: f.opcode, json: undefined, rewritable: false };
    const ev = decodeWsPayload({ opcode: 1, payload: f.text });
    return makeUnit(ev, 'ws', f.rel, f.text, f.text, 1);
  });
}

export function renderUnit(unit, forDeltaJson, at = unit.at) {
  if (forDeltaJson === undefined || !unit.rewritable) return { at, raw: unit.raw, opcode: unit.opcode, json: unit.json, framing: unit.framing };
  const outer = unit.nestedKey ? { ...unit.outer, [unit.nestedKey]: JSON.stringify(forDeltaJson) } : forDeltaJson;
  const payload = unit.envRaw + JSON.stringify(outer);
  return { at, raw: frameText(unit, payload), opcode: unit.opcode, json: forDeltaJson, framing: unit.framing };
}

// ---------------------------------------------------------------------------------------------
```

_First 80 of 241 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
