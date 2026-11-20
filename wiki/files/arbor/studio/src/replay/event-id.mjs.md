# File: studio/src/replay/event-id.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/event-id.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1970 B |
| Lines | 47 |
| Hash | 3fcb38dcf7b2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEQ_RE | const | 7 | no | const SEQ_RE = /^-?\\d+$/; |
| N_RE | const | 8 | no | const N_RE = /^\\d+$/; |
| eventId | function | 10 | yes | export function eventId(e) { |
| base | const | 11 | no | const base = `${e.sid}#${e.seq}`; |
| parseEventId | function | 15 | yes | export function parseEventId(id) { |
| hash | const | 17 | no | const hash = id.lastIndexOf(&#39;#&#39;); |
| sid | const | 19 | no | const sid = id.slice(0, hash); |
| rest | const | 20 | no | const rest = id.slice(hash + 1); |
| dot | const | 21 | no | const dot = rest.lastIndexOf(&#39;.&#39;); |
| seqStr | const | 22 | no | const seqStr = dot === -1 ? rest : rest.slice(0, dot); |
| nStr | const | 23 | no | const nStr = dot === -1 ? null : rest.slice(dot + 1); |
| compareEventIds | function | 31 | yes | export function compareEventIds(a, b) { |
| ia | const | 32 | no | const ia = typeof a === &#39;string&#39; ? a : eventId(a); |
| ib | const | 33 | no | const ib = typeof b === &#39;string&#39; ? b : eventId(b); |
| pa | const | 34 | no | const pa = parseEventId(ia); |
| pb | const | 35 | no | const pb = parseEventId(ib); |
| na | const | 42 | no | const na = pa.n ?? -1; |
| nb | const | 43 | no | const nb = pb.n ?? -1; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Stable, addressable ids for decoded stream events.
// Id shape: `${sid}#${seq}.${n}` where seq is the raw record seq and n is the 0-based position of the
// event within that record's emission (see StreamReducer._emitEvents). Legacy events without n get
// `${sid}#${seq}`. sids may contain '#', ':' or '.', so parsing always splits on the LAST '#' and
// the LAST '.' of the remainder; the seq and n parts are digits only, so this is unambiguous.

const SEQ_RE = /^-?\d+$/;
const N_RE = /^\d+$/;

export function eventId(e) {
  const base = `${e.sid}#${e.seq}`;
  return e.n === undefined || e.n === null ? base : `${base}.${e.n}`;
}

export function parseEventId(id) {
  if (typeof id !== 'string') return null;
  const hash = id.lastIndexOf('#');
  if (hash <= 0) return null;
  const sid = id.slice(0, hash);
  const rest = id.slice(hash + 1);
  const dot = rest.lastIndexOf('.');
  const seqStr = dot === -1 ? rest : rest.slice(0, dot);
  const nStr = dot === -1 ? null : rest.slice(dot + 1);
  if (!SEQ_RE.test(seqStr)) return null;
  if (nStr !== null && !N_RE.test(nStr)) return null;
  return { sid, seq: Number(seqStr), n: nStr === null ? null : Number(nStr) };
}

// Total order: seq, then n (legacy events without n sort before n=0), then sid, then the raw id.
// Malformed ids sort after well-formed ones. Accepts ids or event objects.
export function compareEventIds(a, b) {
  const ia = typeof a === 'string' ? a : eventId(a);
  const ib = typeof b === 'string' ? b : eventId(b);
  const pa = parseEventId(ia);
  const pb = parseEventId(ib);
  if (!pa || !pb) {
    if (pa) return -1;
    if (pb) return 1;
    return ia < ib ? -1 : ia > ib ? 1 : 0;
  }
  if (pa.seq !== pb.seq) return pa.seq < pb.seq ? -1 : 1;
  const na = pa.n ?? -1;
  const nb = pb.n ?? -1;
  if (na !== nb) return na < nb ? -1 : 1;
  if (pa.sid !== pb.sid) return pa.sid < pb.sid ? -1 : 1;
  return ia < ib ? -1 : ia > ib ? 1 : 0;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
