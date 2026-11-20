# File: studio/src/intel/corpus.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/corpus.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7605 B |
| Lines | 127 |
| Hash | 9403783a77ef |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CorpusSearchIndex | export | 6 | yes | export { CorpusSearchIndex, indexCorpus, rankCorpus } |
| indexCorpus | export | 6 | yes | export { CorpusSearchIndex, indexCorpus, rankCorpus } |
| rankCorpus | export | 6 | yes | export { CorpusSearchIndex, indexCorpus, rankCorpus } |
| PATCH_DIALECTS | const | 8 | no | const PATCH_DIALECTS = new Set([&#39;path-ops&#39;, &#39;json-patch&#39;, &#39;typed-events&#39;]); |
| discriminatorOf | function | 10 | yes | export function discriminatorOf(ev) { |
| j | const | 13 | no | const j = ev.json; |
| buildCorpus | function | 18 | yes | export function buildCorpus(reducer, { domTurns = [], domItems = [], session, site } = {}) { |
| samples | const | 19 | no | const samples = []; |
| patchGroups | const | 20 | no | const patchGroups = new Set(); |
| endpoint | const | 22 | no | const endpoint = `${s.method ?? (s.kind === &#39;ws&#39; ? &#39;WS&#39; : &#39;GET&#39;)} ${templateUrl(s.url)}`; |
| dialects | const | 23 | no | const dialects = [...(s._delta?.detected ?? [])]; |
| isPatch | const | 24 | no | const isPatch = dialects.some((d) =&gt; PATCH_DIALECTS.has(d)); |
| group | const | 27 | no | const group = `${endpoint} :: ${discriminatorOf(e)}`; |
| CorpusCollector | class | 52 | yes | export class CorpusCollector { |
| constructor | method | 53 | yes | constructor({ session, site, maxPerGroup = 20000 } = {}) { |
| addEvent | method | 61 | yes | addEvent(ev, stream) { |
| endpoint | const | 63 | no | const endpoint = `${stream?.method ?? (stream?.kind === &#39;ws&#39; ? &#39;WS&#39; : &#39;GET&#39;)} ${templateUrl(stream?.url)}`; |
| group | const | 64 | no | const group = `${endpoint} :: ${discriminatorOf(ev)}`; |
| sq | const | 67 | no | const sq = this.sidSeq.get(ev.sid); |
| g | variable | 71 | no | let g = this.groups.get(group); |
| sh | const | 74 | no | const sh = shapeKey(ev.json); |
| newShape | const | 75 | no | const newShape = !g.shapes.has(sh); |
| _thin | method | 82 | yes | _thin(g) { |
| seenShapes | const | 84 | no | const seenShapes = new Set(); |
| kept | const | 85 | no | const kept = []; |
| sh | const | 87 | no | const sh = shapeKey(s.value); |
| first | const | 88 | no | const first = !seenShapes.has(sh); |
| addDomTurns | method | 95 | yes | addDomTurns(domTurns = []) { |
| addDomItems | method | 103 | yes | addDomItems(domItems = []) { |
| result | method | 107 | yes | result(reducer) { |
| samples | const | 108 | no | const samples = []; |
| patchGroups | const | 109 | no | const patchGroups = new Set(); |
| dialects | const | 112 | no | const dialects = [...(s._delta?.detected ?? [])]; |
| isPatch | const | 113 | no | const isPatch = dialects.some((d) =&gt; PATCH_DIALECTS.has(d)); |
| endpoint | const | 117 | no | const endpoint = `${s.method ?? (s.kind === &#39;ws&#39; ? &#39;WS&#39; : &#39;GET&#39;)} ${templateUrl(s.url)}`; |
| sq | const | 118 | no | const sq = this.sidSeq.get(s.sid); |
| dropped | const | 123 | no | const dropped = {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../shapes/infer.mjs | import | 3 | [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) |
| ./schema.mjs | import | 4 | [studio/src/intel/schema.mjs](./schema.mjs.md) |
| ./search.mjs | export_from | 6 | [studio/src/intel/search.mjs](./search.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/fixtures.mjs](../../eval/fixtures.mjs.md) | ../src/intel/corpus.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/corpus.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Observation corpus: the discovery engine's input, built from any recorded session.
// Every sample keeps provenance back to raw evidence (session, stream, seq, time, DOM node).
import { templateUrl } from '../shapes/infer.mjs';
import { shapeKey } from './schema.mjs';

export { CorpusSearchIndex, indexCorpus, rankCorpus } from './search.mjs';

const PATCH_DIALECTS = new Set(['path-ops', 'json-patch', 'typed-events']);

export function discriminatorOf(ev) {
  if (ev.envelope?.headers?.length) { const h = ev.envelope.headers.filter((x) => !/^\d+$/.test(x)); if (h.length) return h.slice(0, 2).join('|'); }
  if (ev.event && ev.event !== 'message') return ev.event;
  const j = ev.json;
  if (j && typeof j === 'object' && !Array.isArray(j)) for (const k of ['type', 'event', 'kind', 'op', 'action', 'method', 'object', '__typename']) if (typeof j[k] === 'string' && j[k].length <= 48) return j[k];
  return Array.isArray(j) ? '[array]' : '(object)';
}

export function buildCorpus(reducer, { domTurns = [], domItems = [], session, site } = {}) {
  const samples = [];
  const patchGroups = new Set();
  for (const s of reducer.streams.values()) {
    const endpoint = `${s.method ?? (s.kind === 'ws' ? 'WS' : 'GET')} ${templateUrl(s.url)}`;
    const dialects = [...(s._delta?.detected ?? [])];
    const isPatch = dialects.some((d) => PATCH_DIALECTS.has(d));
    for (const e of s._events ?? []) {
      if (e.json === undefined || e.json === null || typeof e.json !== 'object') continue;
      const group = `${endpoint} :: ${discriminatorOf(e)}`;
      if (isPatch) patchGroups.add(group);
      samples.push({ value: e.json, source: { kind: 'event', group, endpoint, sid: s.sid, seq: e.seq, t: e.t, session: session?.id, site } });
    }
    if (s._delta?.revisions > 0 && s._delta.doc && typeof s._delta.doc === 'object' && isPatch) {
      samples.push({ value: s._delta.doc, source: { kind: 'assembled', group: `${endpoint} :: (assembled)`, endpoint, sid: s.sid, seq: null, t: s.endT ?? s.lastChunkT, session: session?.id, site, revisions: s._delta.revisions, final: s.status === 'complete' } });
    }
  }
  for (const t of domTurns) {
    // DOM node handles, positions and capture flags are provenance, not entity data.
    const { blocks, domId, index, roleAttribute, truncated, redactions, ...rest } = t;
    if (rest.id === domId) delete rest.id;
    // One DOM_TURNS capture is a single snapshot: distinct nodes in it are distinct entities.
    samples.push({ value: { ...rest, blockTypes: [...new Set((blocks ?? []).map((b) => b.type))] }, source: { kind: 'dom', group: 'page :: turns', domId, index, session: session?.id, site, snapshot: `${session?.id ?? ''}|dom-turns|${t.capturedAt ?? 'final'}` } });
  }
  for (const it of domItems) samples.push({ value: it.value, source: { kind: 'dom', group: `page :: ${it.group}`, domId: it.domId, session: session?.id, site, snapshot: it.snapshot } });
  return { samples, patchGroups };
}

// ---------------------------------------------------------------------------------------------
// Streaming collector: sees EVERY decoded event as derive processes it, so the corpus is not
// limited to the reducer's bounded in-memory window. When a group exceeds maxPerGroup it is
// thinned deterministically (first occurrence of every shape is always kept, then a stride) and
// the number of observations not kept is reported in stats.dropped, never silently.
// ---------------------------------------------------------------------------------------------
export class CorpusCollector {
  constructor({ session, site, maxPerGroup = 20000 } = {}) {
    this.session = session; this.site = site; this.maxPerGroup = maxPerGroup;
    this.groups = new Map();   // group -> { list, stride, seen, shapes:Set, dropped }
    this.sidGroups = new Map(); // sid -> Set(group)
    this.sidSeq = new Map();    // sid -> { from, to } over events seen
    this.domSamples = [];
  }

  addEvent(ev, stream) {
    if (!ev || ev.json === undefined || ev.json === null || typeof ev.json !== 'object') return;
    const endpoint = `${stream?.method ?? (stream?.kind === 'ws' ? 'WS' : 'GET')} ${templateUrl(stream?.url)}`;
    const group = `${endpoint} :: ${discriminatorOf(ev)}`;
    if (!this.sidGroups.has(ev.sid)) this.sidGroups.set(ev.sid, new Set());
    this.sidGroups.get(ev.sid).add(group);
    const sq = this.sidSeq.get(ev.sid);
    if (!sq) this.sidSeq.set(ev.sid, { from: ev.seq, to: ev.seq });
    else { if (ev.seq < sq.from) sq.from = ev.seq; if (ev.seq > sq.to) sq.to = ev.seq; }

    let g = this.groups.get(group);
    if (!g) { g = { list: [], stride: 1, seen: 0, shapes: new Set(), dropped: 0 }; this.groups.set(group, g); }
    g.seen++;
    const sh = shapeKey(ev.json);
    const newShape = !g.shapes.has(sh);
    if (newShape) g.shapes.add(sh);
    if (!newShape && g.seen % g.stride !== 0) { g.dropped++; return; }
    g.list.push({ value: ev.json, source: { kind: 'event', group, endpoint, sid: ev.sid, seq: ev.seq, t: ev.t, session: this.session?.id, site: this.site } });
    if (g.list.length > this.maxPerGroup) this._thin(g);
  }
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
