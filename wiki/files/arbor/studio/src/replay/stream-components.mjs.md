# File: studio/src/replay/stream-components.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/stream-components.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4184 B |
| Lines | 97 |
| Hash | 858c55eaeedc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STREAM_COMPONENTS_SCHEMA | const | 7 | yes | export const STREAM_COMPONENTS_SCHEMA = &#39;capture-studio.stream-components/1&#39;; |
| COMPONENT_TEXT_CAP | const | 8 | yes | export const COMPONENT_TEXT_CAP = 2000; |
| UNMAPPED_SAMPLE_SIZE | const | 9 | yes | export const UNMAPPED_SAMPLE_SIZE = 5; |
| SIGNAL_CODE_TOP | const | 10 | yes | export const SIGNAL_CODE_TOP = 5; |
| SIGNAL_SAMPLE_SIZE | const | 11 | yes | export const SIGNAL_SAMPLE_SIZE = 5; |
| componentEntry | function | 13 | no | const componentEntry = (c) =&gt; { |
| full | const | 14 | no | const full = typeof c.text === &#39;string&#39; ? c.text : &#39;&#39;; |
| truncated | const | 15 | no | const truncated = full.length &gt; COMPONENT_TEXT_CAP; |
| codeOrder | function | 28 | no | const codeOrder = (a, b) =&gt; { |
| signalSummary | function | 37 | no | function signalSummary(signals) { |
| errorCount | const | 38 | no | const errorCount = signals.filter((s) =&gt; s.kind === &#39;error&#39;).length; |
| counts | const | 39 | no | const counts = new Map(); |
| codes | const | 41 | no | const codes = [...counts] |
| buildStreamComponents | function | 58 | yes | export function buildStreamComponents(eventsBySid, { componentsImpl = applyStreamMap } = {}) { |
| ordered | const | 59 | no | const ordered = [...eventsBySid.entries()] |
| streams | const | 63 | no | const streams = []; |
| eventsOmitted | const | 65 | no | const eventsOmitted = omitted ?? 0; |
| r | const | 72 | no | const r = componentsImpl(map, events); |
| mapped | const | 86 | no | const mapped = streams.filter((s) =&gt; s.mapId !== null); |
| totals | const | 87 | no | const totals = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../profiles/stream-map.mjs | import | 5 | [studio/src/profiles/stream-map.mjs](../profiles/stream-map.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/replay/derive.mjs](./derive.mjs.md) | ./stream-components.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Builds the kv document STREAM_COMPONENTS: for each response stream, which stream-map the events
// match and which UI component parts they build. Pure: no I/O, no clock, no randomness.
// Honest by construction: a stream with no best map gets mapId null and its candidate list, never a
// guessed map. Full unmapped detail stays out of the document (count plus a short sample only).
import { detectStreamMap, applyStreamMap } from '../profiles/stream-map.mjs';

export const STREAM_COMPONENTS_SCHEMA = 'capture-studio.stream-components/1';
export const COMPONENT_TEXT_CAP = 2000;
export const UNMAPPED_SAMPLE_SIZE = 5;
export const SIGNAL_CODE_TOP = 5;
export const SIGNAL_SAMPLE_SIZE = 5;

const componentEntry = (c) => {
  const full = typeof c.text === 'string' ? c.text : '';
  const truncated = full.length > COMPONENT_TEXT_CAP;
  return {
    componentKey: c.componentKey ?? null,
    component: c.component,
    text: truncated ? full.slice(0, COMPONENT_TEXT_CAP) : full,
    textTruncated: truncated,
    textLength: full.length,
    opened: c.opened,
    closed: c.closed,
  };
};

// null codes sort last; otherwise plain string order (deterministic).
const codeOrder = (a, b) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
};

// Summary of the engine's signals for one stream: counts, top codes (over all signals) and a short
// sample. The engine never reports message text, so none reaches this document.
function signalSummary(signals) {
  const errorCount = signals.filter((s) => s.kind === 'error').length;
  const counts = new Map();
  for (const s of signals) counts.set(s.code, (counts.get(s.code) ?? 0) + 1);
  const codes = [...counts]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => (b.count - a.count) || codeOrder(a.code, b.code))
    .slice(0, SIGNAL_CODE_TOP);
  return {
    errorCount,
    statusCount: signals.length - errorCount,
    codes,
    sample: signals.slice(0, SIGNAL_SAMPLE_SIZE).map((s) => ({
      seq: s.seq, n: s.n, kind: s.kind, code: s.code, messageChars: s.messageChars,
    })),
  };
}

// eventsBySid: Map<sid, { events: object[], omitted: number }>, events in raw order.
// omitted = events that were evicted from the in-memory window (text may then be incomplete).
// componentsImpl(map, events) must behave like applyStreamMap; an exception propagates to the caller.
export function buildStreamComponents(eventsBySid, { componentsImpl = applyStreamMap } = {}) {
  const ordered = [...eventsBySid.entries()]
    .filter(([, v]) => Array.isArray(v.events) && v.events.length > 0)
    .sort(([a, va], [b, vb]) => (Number(va.events[0].seq) - Number(vb.events[0].seq)) || (a < b ? -1 : a > b ? 1 : 0));

  const streams = [];
  for (const [sid, { events, omitted }] of ordered) {
    const eventsOmitted = omitted ?? 0;
    const { map, candidates } = detectStreamMap(events);
    if (!map) {
      // No map ran, so whether this stream errored is unknown (null), not false.
      streams.push({ sid, mapId: null, candidates, eventsOmitted, hadError: null });
      continue;
    }
    const r = componentsImpl(map, events);
    streams.push({
      sid,
      mapId: map.id,
      eventsOmitted,
      stats: r.stats,
      components: r.components.map(componentEntry),
      unmappedCount: r.unmapped.length,
      unmappedSample: r.unmapped.slice(0, UNMAPPED_SAMPLE_SIZE).map((u) => ({ seq: u.seq, reason: u.reason })),
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
