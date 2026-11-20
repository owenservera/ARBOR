# File: studio/src/intel/graph.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/graph.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18807 B |
| Lines | 295 |
| Hash | 18be446062d7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TemporalGraph | class | 14 | yes | export class TemporalGraph { |
| constructor | method | 15 | yes | constructor() { this.nodes = new Map(); this.edges = new Map(); this.changes = []; this.types = new Map(); this.invariants = []; this.quarantinedEntities = 0; } |
| addType | method | 17 | yes | addType(t) { this.types.set(t.id, { id: t.id, name: t.name, key: t.key?.field ?? null, confidence: t.confidence, fields: t.fields.map((f) =&gt; ({ name: f.name, type: f.type, role: f.role, roleConfidenc… |
| upsertEntity | method | 19 | yes | upsertEntity({ eid, type, typeName, key, attrs = {}, t, evidence, changed, removed = [] }) { |
| n | variable | 20 | no | let n = this.nodes.get(eid); |
| incompatible | const | 23 | no | const incompatible = n &amp;&amp; ( (n.type != null &amp;&amp; type != null &amp;&amp; n.type !== type) \|\| (n.key != null &amp;&amp; key != null &amp;&amp; (typeof n.key !== typeof key \|\| stableStringify(n.key) !== stableStringify(key)))); |
| before | const | 32 | no | const before = n.attrs; |
| removedFields | const | 33 | no | const removedFields = Array.isArray(removed) |
| nextAttrs | const | 35 | no | const nextAttrs = foldRevision({ ...n.attrs }, { values: attrs, removed: removedFields, evidence }); // validate first, then publish the newly created node |
| rev | const | 43 | no | const rev = { t, changed: changed ?? Object.keys(attrs).filter((k) =&gt; JSON.stringify(before[k]) !== JSON.stringify(attrs[k])), values: attrs, ...(removedFields.length ? { removed: removedFields } : {… |
| relate | method | 54 | yes | relate({ kind, from, to, confidence, status = &#39;hypothesis&#39;, evidence, t, attrs }) { |
| id | const | 55 | no | const id = `${kind}:${from}-&gt;${to}`; |
| prev | const | 56 | no | const prev = this.edges.get(id); |
| when | const | 57 | no | const when = Number.isFinite(t) ? t : null; |
| score | const | 58 | no | const score = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null; |
| startedAt | const | 59 | no | const startedAt = Number.isFinite(prev?.t) &amp;&amp; when !== null ? Math.min(prev.t, when) : prev?.t ?? when; |
| statusHistory | const | 60 | no | const statusHistory = prev?.statusHistory ?? (prev ? [{ t: prev.t ?? null, status: prev.status }] : [{ t: startedAt, status }]); |
| observations | const | 62 | no | const observations = prev?.observations ?? []; |
| observation | const | 63 | no | const observation = { t: when, confidence: score, evidence, ...(attrs ? { attrs } : {}) }; |
| stronger | const | 65 | no | const stronger = !prev \|\| (score ?? -1) &gt; (prev.confidence ?? -1); |
| e | const | 66 | no | const e = { id, kind, from, to, confidence: stronger ? score : prev.confidence, |
| setEdgeStatus | method | 77 | yes | setEdgeStatus(id, status, at = Date.now()) { |
| e | const | 78 | no | const e = this.edges.get(id); |
| when | const | 81 | no | const when = Number.isFinite(at) ? at : Date.now(); |
| stateAt | method | 88 | yes | stateAt(t) { |
| nodes | const | 89 | no | const nodes = []; |
| revs | const | 92 | no | const revs = n.history.filter((r) =&gt; Number.isFinite(r.t) &amp;&amp; r.t &lt;= t).sort((a, b) =&gt; a.t - b.t); |
| attrs | const | 94 | no | const attrs = revs.reduce((acc, r) =&gt; foldRevision(acc, r), {}); |
| edges | const | 97 | no | const edges = []; |
| statuses | const | 101 | no | const statuses = (e.statusHistory ?? [{ t: e.t, status: e.status }]) |
| historicalStatus | const | 103 | no | const historicalStatus = statuses.at(-1)?.status; |
| observations | const | 105 | no | const observations = (e.observations ?? []).filter((o) =&gt; Number.isFinite(o.t) &amp;&amp; o.t &lt;= t).sort((a, b) =&gt; a.t - b.t); |
| best | const | 106 | no | const best = observations.reduce((a, b) =&gt; !a \|\| (b.confidence ?? -1) &gt; (a.confidence ?? -1) ? b : a, null); |
| neighbors | method | 114 | yes | neighbors(eid) { return [...this.edges.values()].filter((e) =&gt; e.from === eid \|\| e.to === eid); } |
| neighborhood | method | 116 | yes | neighborhood(eid, options = {}) { return graphNeighborhood(this, eid, options); } |
| rank | method | 117 | yes | rank(options = {}) { return rankGraphNodes(this, options); } |
| toJSON | method | 119 | yes | toJSON() { |
| countBy | function | 128 | no | const countBy = (arr, k) =&gt; arr.reduce((a, x) =&gt; ((a[x[k]] = (a[x[k]] ?? 0) + 1), a), {}); |
| nFromHistory | function | 129 | no | const nFromHistory = (history) =&gt; history.reduce((state, rev) =&gt; foldRevision(state, rev), {}); |
| buildGraph | function | 132 | yes | export function buildGraph({ model, resolutions, renderedHyps = [], actionHyps = [], session }) { |
| g | const | 133 | no | const g = new TemporalGraph(); |
| signatures | const | 140 | no | const signatures = new Map(), collisions = new Map(); |
| signature | const | 142 | no | const signature = JSON.stringify([e.type, e.scope, e.method, e.keyType ?? null, e.key]); |
| prior | const | 143 | no | const prior = signatures.get(e.eid); |
| first | const | 153 | no | const first = [...entities][0]; |
| receipt | const | 154 | no | const receipt = observeInvariant(false, &#39;NSP-004&#39;, { boundary: &#39;build-graph&#39;, disposition: &#39;isolated&#39;, reason: &#39;entity-id-collision&#39;, entityId: eid, count: entities.size, source: { session: first.anc… |
| quarantined | const | 163 | no | const quarantined = new Set(collisions.keys()); |
| usable | const | 164 | no | const usable = resolutions.map((r) =&gt; ({ ...r, entities: r.entities.filter((e) =&gt; !quarantined.has(e.eid)), })); |
| keyIndex | const | 167 | no | const keyIndex = new Map(); // typeId\|key -&gt; eid |
| first | variable | 169 | no | let first = true; |
| node | const | 186 | no | const node = g.nodes.get(e.eid); |
| key | const | 192 | no | const key = JSON.stringify([e.type, e.scope, e.keyType ?? typeof e.attrs?.[model.types.find((t) =&gt; t.id === e.type)?.key?.field], e.key]); |
| matches | const | 193 | no | const matches = keyIndex.get(key) ?? []; matches.push(e.eid); keyIndex.set(key, matches); |
| src | const | 199 | no | const src = usable.find((r) =&gt; r.type === rel.from); |
| revisions | const | 202 | no | const revisions = e.revisions?.length ? e.revisions : [{ t: e.first, values: e.attrs }]; |
| v | const | 204 | no | const v = rv.values?.[rel.field]; |
| matches | const | 206 | no | const matches = keyIndex.get(JSON.stringify([rel.to, e.scope, typeof v, String(v)])); |
| target | const | 208 | no | const target = matches[0], targetTime = g.nodes.get(target)?.firstT; |
| parent | const | 218 | no | const parent = usable.find((r) =&gt; r.type === rel.from), child = usable.find((r) =&gt; r.type === rel.to); |
| bySeq | const | 220 | no | const bySeq = new Map(); |
| key | const | 222 | no | const key = JSON.stringify([rv.session ?? &#39;&#39;, rv.sid, rv.seq]), entries = bySeq.get(key) ?? []; |
| candidates | const | 226 | no | const candidates = (bySeq.get(JSON.stringify([rv.session ?? &#39;&#39;, rv.sid, rv.seq])) ?? []) |
| unique | const | 228 | no | const unique = [...new Set(candidates.map((p) =&gt; p.eid))]; |
| graphView | function | 238 | no | function graphView(graph, at) { |
| view | const | 241 | no | const view = { nodes: graph.nodes instanceof Map ? [...graph.nodes.values()] : graph.nodes ?? [], |
| temporal | const | 244 | no | const temporal = new TemporalGraph(); |
| graphNeighborhood | function | 250 | yes | export function graphNeighborhood(graph, eid, { depth = 2, direction = &#39;both&#39;, kinds, minConfidence = 0, maxNodes = 200, at } = {}) { |
| view | const | 252 | no | const view = graphView(graph, at), adjacency = new Map(); |
| allowed | const | 253 | no | const allowed = view.edges.filter((e) =&gt; e.status !== &#39;rejected&#39; &amp;&amp; (e.confidence ?? 0) &gt;= minConfidence &amp;&amp; (!kinds \|\| kinds.includes(e.kind))); |
| cap | const | 259 | no | const cap = Number.isInteger(maxNodes) &amp;&amp; maxNodes &gt; 0 ? maxNodes : 200; |
| distances | const | 260 | no | const distances = new Map([[eid, 0]]), queue = [eid], edges = new Map(); let truncated = false; |
| id | const | 262 | no | const id = queue[i], distance = distances.get(id); if (distance &gt;= depth) continue; |
| nodes | const | 271 | no | const nodes = new Map(view.nodes.map((node) =&gt; [node.eid, node])); |
| rankGraphNodes | function | 276 | yes | export function rankGraphNodes(graph, { damping = 0.85, iterations = 60, tolerance = 1e-8, seeds = [], at } = {}) { |
| view | const | 278 | no | const view = graphView(graph, at), ids = view.nodes.map((n) =&gt; n.eid).sort(), known = new Set(ids); |
| selected | const | 280 | no | const selected = new Set(seeds.filter((id) =&gt; known.has(id))); |
| teleport | const | 281 | no | const teleport = new Map(ids.map((id) =&gt; [id, selected.size ? (selected.has(id) ? 1 / selected.size : 0) : 1 / ids.length])); |
| outgoing | const | 282 | no | const outgoing = new Map(ids.map((id) =&gt; [id, []])), totals = new Map(); |
| ranks | variable | 286 | no | let ranks = new Map(teleport); |
| dangling | variable | 288 | no | let dangling = 0; for (const id of ids) if (!totals.get(id)) dangling += ranks.get(id); |
| next | const | 289 | no | const next = new Map(ids.map((id) =&gt; [id, (1 - damping + damping * dangling) * teleport.get(id)])); |
| delta | const | 291 | no | const delta = ids.reduce((sum, id) =&gt; sum + Math.abs(next.get(id) - ranks.get(id)), 0); ranks = next; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./history.mjs | import | 1 | [studio/src/intel/history.mjs](./history.mjs.md) |
| ../core/invariants.mjs | import | 2 | [studio/src/core/invariants.mjs](../core/invariants.mjs.md) |
| ./similarity.mjs | import | 3 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/knowledge.mjs](../../bin/commands/knowledge.mjs.md) | ../../src/intel/graph.mjs |
| [studio/src/replay/derive-all.mjs](../replay/derive-all.mjs.md) | ../intel/graph.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/graph.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../intel/graph.mjs |
| [studio/src/studio/world-relations.mjs](../studio/world-relations.mjs.md) | ../intel/graph.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { foldRevision } from './history.mjs';
import { InvariantViolation, assertInvariant, observeInvariant, NSP_SCHEMA } from '../core/invariants.mjs';
import { stableStringify } from './similarity.mjs';

// Canonical temporal evidence graph.
//
// Three strata, kept separate:
//   observations  immutable references into raw evidence (session, seq, sid, byte span, dom id)
//   entities      semantic nodes with time-indexed versioned state (event-sourced revisions)
//   edges         typed relations (contains, references, rendered_as, caused, same_as, ...)
//                 each with confidence, status (hypothesis | confirmed | rejected) and evidence
// Unknown/evolving schemas are fine: entity state is whatever attributes were observed.
// stateAt(t) replays revisions to reconstruct the semantic state at any moment.
export class TemporalGraph {
  constructor() { this.nodes = new Map(); this.edges = new Map(); this.changes = []; this.types = new Map(); this.invariants = []; this.quarantinedEntities = 0; }

  addType(t) { this.types.set(t.id, { id: t.id, name: t.name, key: t.key?.field ?? null, confidence: t.confidence, fields: t.fields.map((f) => ({ name: f.name, type: f.type, role: f.role, roleConfidence: f.roleConfidence })) }); }

  upsertEntity({ eid, type, typeName, key, attrs = {}, t, evidence, changed, removed = [] }) {
    let n = this.nodes.get(eid);
    // Direct graph clients get the same protection as buildGraph's preflight:
    // do not silently update a node using an incompatible type/typed key.
    const incompatible = n && (
      (n.type != null && type != null && n.type !== type)
      || (n.key != null && key != null
        && (typeof n.key !== typeof key || stableStringify(n.key) !== stableStringify(key))));
    assertInvariant(!incompatible, 'NSP-004', {
      boundary: 'upsert-entity', disposition: 'rejected', reason: 'entity-id-collision',
      entityId: eid, source: { session: evidence?.session, seq: evidence?.seq, sid: evidence?.sid },
    });
    if (!n) n = { eid, type, typeName, key, attrs: {}, history: [], firstT: null, lastT: null };
    const before = n.attrs;
    const removedFields = Array.isArray(removed)
      ? removed.filter((name) => typeof name === 'string' && name.length > 0) : [];
    const nextAttrs = foldRevision({ ...n.attrs }, { values: attrs, removed: removedFields,
      evidence }); // validate first, then publish the newly created node
    n.attrs = nextAttrs;
    if (!this.nodes.has(eid)) this.nodes.set(eid, n);
    if (Number.isFinite(t)) {
      n.firstT = n.firstT === null ? t : Math.min(n.firstT, t);
      n.lastT = n.lastT === null ? t : Math.max(n.lastT, t);
    }
    const rev = { t, changed: changed ?? Object.keys(attrs).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(attrs[k])), values: attrs, ...(removedFields.length ? { removed: removedFields } : {}), evidence };
    n.history.push(rev);
    if (n.history.length > 1 && Number.isFinite(t) && t < n.lastT) {
      // Online callers may ingest late evidence; current attrs must follow event time.
      n.history.sort((a, b) => (a.t ?? Infinity) - (b.t ?? Infinity));
      n.attrs = n.history.reduce((state, revision) => foldRevision(state, revision), {});
    }
    this.changes.push({ t, eid, revision: n.history.length, changed: rev.changed });
    return n;
  }

  relate({ kind, from, to, confidence, status = 'hypothesis', evidence, t, attrs }) {
    const id = `${kind}:${from}->${to}`;
    const prev = this.edges.get(id);
    const when = Number.isFinite(t) ? t : null;
    const score = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null;
    const startedAt = Number.isFinite(prev?.t) && when !== null ? Math.min(prev.t, when) : prev?.t ?? when;
    const statusHistory = prev?.statusHistory ?? (prev ? [{ t: prev.t ?? null, status: prev.status }] : [{ t: startedAt, status }]);
    if (statusHistory.length && (statusHistory[0].t === null || statusHistory[0].t === prev?.t)) statusHistory[0] = { ...statusHistory[0], t: startedAt };
    const observations = prev?.observations ?? [];
    const observation = { t: when, confidence: score, evidence, ...(attrs ? { attrs } : {}) };
    if (!observations.some((o) => stableStringify(o) === stableStringify(observation))) observations.push(observation);
    const stronger = !prev || (score ?? -1) > (prev.confidence ?? -1);
    const e = { id, kind, from, to, confidence: stronger ? score : prev.confidence,
      status: prev?.status ?? status, statusHistory,
      evidence: stronger ? evidence : prev.evidence, t: startedAt,
      observations, support: observations.length,
      lastT: observations.reduce((latest, o) => o.t === null ? latest : latest === null ? o.t : Math.max(latest, o.t), null),
      ...((stronger ? attrs : prev?.attrs) ? { attrs: stronger ? attrs : prev.attrs } : {}) };
    this.edges.set(id, e);
    return e;
  }

  // Corrections apply at a known time. Never mutate the meaning of an earlier stateAt(t).
  setEdgeStatus(id, status, at = Date.now()) {
    const e = this.edges.get(id);
    if (!e || e.status === status) return e;
    if (!['hypothesis', 'confirmed', 'rejected'].includes(status)) throw new Error('Invalid edge status.');
```

_First 80 of 296 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
