# File: studio/src/replay/derive-all.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/derive-all.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15456 B |
| Lines | 351 |
| Hash | fadd5e0d8ec7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STAGES | const | 8 | no | const STAGES = Object.freeze([&#39;base&#39;, &#39;search-index&#39;, &#39;graph-ranked&#39;, &#39;schemas&#39;, &#39;stream-timelines&#39;, &#39;revisions&#39;]); |
| MANIFEST_KEY | const | 9 | no | const MANIFEST_KEY = &#39;DERIVE_MANIFEST&#39;; |
| TEXT_CAP | const | 10 | no | const TEXT_CAP = 4000; |
| TIMELINE_CAP | const | 11 | no | const TIMELINE_CAP = 400; |
| HANDLERS | const | 13 | no | const HANDLERS = { |
| emit | function | 22 | no | function emit(onStage, stage, detail = {}) { |
| event | const | 24 | no | const event = { stage, name: stage, ...detail }; |
| clip | function | 28 | no | function clip(text, n = TEXT_CAP) { |
| s | const | 29 | no | const s = String(text ?? &#39;&#39;); |
| readKv | function | 33 | no | function readKv(session, key) { |
| readDataset | function | 37 | no | async function readDataset(session, name) { |
| ds | const | 38 | no | const ds = session.dataset(name); |
| writeDataset | function | 43 | no | function writeDataset(session, name, rows) { |
| ds | const | 44 | no | const ds = session.dataset(name); |
| rawCount | function | 50 | no | async function rawCount(session) { |
| stats | const | 52 | no | const stats = session.rawStats?.(); |
| n | variable | 55 | no | let n = 0; |
| entityText | function | 60 | no | function entityText(entity) { |
| parts | const | 61 | no | const parts = [entity.typeName, entity.type, entity.key, entity.eid]; |
| eventText | function | 70 | no | function eventText(ev) { |
| stageBase | function | 79 | no | async function stageBase(session, profile, onStage) { |
| result | const | 80 | no | const result = await derive(session, profile, { onProgress: (records) =&gt; emit(onStage, &#39;base&#39;, { status: &#39;progress&#39;, records }), }); |
| stageSearch | function | 90 | no | async function stageSearch(session) { |
| index | const | 91 | no | const index = new CorpusSearchIndex(); |
| records | variable | 92 | no | let records = 0; |
| entities | variable | 93 | no | let entities = 0; |
| text | const | 95 | no | const text = entityText(entity); |
| source | const | 97 | no | const source = { layer: &#39;entities&#39;, eid: entity.eid ?? null, kind: &#39;entity&#39;, typeName: entity.typeName ?? null }; |
| events | variable | 102 | no | let events = 0; |
| text | const | 104 | no | const text = eventText(ev); |
| source | const | 106 | no | const source = { layer: &#39;events&#39;, sid: ev.sid ?? null, seq: ev.seq ?? null, t: ev.t ?? null }; |
| blocks | const | 111 | no | const blocks = session.kv.get(&#39;DOM_BLOCKS&#39;, []) ?? []; |
| dom | variable | 113 | no | let dom = 0; |
| text | const | 115 | no | const text = clip(block?.text ?? &#39;&#39;); |
| source | const | 117 | no | const source = { layer: &#39;dom&#39;, domId: block.id ?? dom, t: block.lastT ?? block.firstT ?? null }; |
| rows | const | 123 | no | const rows = index.toRows({ includeDocument: true }); |
| stageGraph | function | 128 | no | async function stageGraph(session) { |
| graph | const | 129 | no | const graph = session.kv.get(&#39;GRAPH&#39;, null) ?? { nodes: [], edges: [] }; |
| ranked | const | 130 | no | const ranked = rankGraphNodes(graph); |
| meta | const | 131 | no | const meta = new Map((graph.nodes ?? []).map((node) =&gt; [node.eid, node])); |
| nodes | const | 132 | no | const nodes = ranked.map((item, index) =&gt; ({ rank: index + 1, eid: item.eid, score: item.score, typeName: meta.get(item.eid)?.typeName ?? null, })); |
| artifact | const | 135 | no | const artifact = { algorithm: &#39;confidence-weighted-pagerank&#39;, nodes }; |
| stageSchemas | function | 141 | no | async function stageSchemas(session) { |
| endpoints | const | 142 | no | const endpoints = new Map(); |
| profiler | const | 146 | no | const profiler = new OnlineSchemaProfiler(); |
| records | variable | 147 | no | let records = 0; |
| value | const | 149 | no | const value = entity.attrs &amp;&amp; typeof entity.attrs === &#39;object&#39; ? entity.attrs : null; |
| value | const | 157 | no | const value = ev.json &amp;&amp; typeof ev.json === &#39;object&#39; ? ev.json : null; |
| report | const | 164 | no | const report = profiler.report(); |
| groups | const | 165 | no | const groups = report.groups.map((group) =&gt; ({ id: group.group, group: group.group, name: group.group, observations: group.observations, |
| artifact | const | 175 | no | const artifact = { groups, evictedGroups: report.evictedGroups, windowSize: report.windowSize, minWindow: report.minWindow }; |
| stageTimelines | function | 181 | no | async function stageTimelines(session) { |
| meta | const | 182 | no | const meta = new Map(); |
| rows | const | 184 | no | const rows = new Map(); |
| records | variable | 185 | no | let records = 0; |
| sid | const | 187 | no | const sid = ev?.sid ?? &#39;unknown&#39;; |
| row | variable | 188 | no | let row = rows.get(sid); |
| stream | const | 190 | no | const stream = meta.get(sid) ?? {}; |
| streams | const | 213 | no | const streams = [...rows.values()].sort((a, b) =&gt; String(a.sid).localeCompare(String(b.sid))); |
| stageRevisions | function | 219 | no | async function stageRevisions(session) { |
| rows | const | 220 | no | const rows = []; |
| revisions | const | 222 | no | const revisions = Array.isArray(entity.revisions) ? entity.revisions : []; |
| acc | const | 223 | no | const acc = RevisionAccumulator.from(revisions); |
| nodes | const | 233 | no | const nodes = session.kv.get(&#39;GRAPH&#39;, null)?.nodes ?? []; |
| acc | const | 235 | no | const acc = RevisionAccumulator.from(node.history ?? []); |
| deriveAll | function | 244 | yes | export async function deriveAll(session, { profile, incremental = true, stages, onStage } = {}) { |
| requested | const | 245 | no | const requested = Array.isArray(stages) &amp;&amp; stages.length ? stages : [...STAGES]; |
| unknown | const | 246 | no | const unknown = requested.filter((name) =&gt; !STAGES.includes(name)); |
| selected | const | 248 | no | const selected = new Set(requested); |
| cursor | const | 249 | no | const cursor = await rawCount(session); |
| prev | const | 250 | no | const prev = readKv(session, MANIFEST_KEY); |
| done | const | 251 | no | const done = new Set((prev?.stages ?? []).filter((stage) =&gt; stage &amp;&amp; !stage.error).map((stage) =&gt; stage.name)); |
| meta | function | 252 | no | const meta = (() =&gt; { try { return session.meta ?? {}; } catch { return {}; } })(); |
| ENDED_STATUSES | const | 253 | no | const ENDED_STATUSES = new Set([&#39;stopped&#39;, &#39;closed&#39;, &#39;done&#39;, &#39;complete&#39;, &#39;complete_with_integrity_warnings&#39;, &#39;failed&#39;]); |
| endedAt | const | 254 | no | const endedAt = meta.endedAt ?? meta.ended_at ?? meta.endT ?? meta.endedT ?? null; |
| stillRecording | const | 256 | no | const stillRecording = !ENDED_STATUSES.has(String(meta.status ?? &#39;&#39;)) \|\| endedAt == null; |
| rolesStale | const | 260 | no | const rolesStale = selected.has(&#39;base&#39;) &amp;&amp; !streamRolesCurrent(session); |
| fresh | const | 261 | no | const fresh = !!incremental &amp;&amp; prev?.version === 1 &amp;&amp; prev.cursor === cursor &amp;&amp; prev.ok !== false &amp;&amp; !stillRecording &amp;&amp; !rolesStale; |
| plan | const | 262 | no | const plan = STAGES.filter((name) =&gt; selected.has(name) &amp;&amp; !(fresh &amp;&amp; done.has(name))); |
| stageResults | const | 263 | no | const stageResults = new Map((prev?.stages ?? []).filter((stage) =&gt; stage?.name).map((stage) =&gt; [stage.name, stage])); |
| loaded | const | 267 | no | const loaded = await loadArtifacts(session); |
| errors | const | 271 | no | const errors = []; |
| started | const | 273 | no | const started = Date.now(); |
| out | const | 276 | no | const out = await HANDLERS[name](session, profile, onStage); |
| row | const | 277 | no | const row = { |
| row | const | 284 | no | const row = { name, ms: Date.now() - started, records: 0, datasets: [], error: String(error?.message ?? error) }; |
| plannedOk | const | 294 | no | const plannedOk = plan.every((name) =&gt; !stageResults.get(name)?.error); |
| nextCursor | const | 295 | no | const nextCursor = plannedOk &amp;&amp; (plan.includes(&#39;base&#39;) \|\| prev?.cursor === cursor) ? cursor : (prev?.cursor ?? null); |
| finalStages | const | 296 | no | const finalStages = STAGES.map((name) =&gt; stageResults.get(name)).filter(Boolean); |
| ok | const | 297 | no | const ok = !finalStages.some((stage) =&gt; stage &amp;&amp; stage.error); |
| manifest | const | 298 | no | const manifest = { |
| loaded | const | 309 | no | const loaded = await loadArtifacts(session); |
| loadArtifacts | function | 313 | yes | export async function loadArtifacts(session) { |
| manifest | const | 314 | no | const manifest = readKv(session, MANIFEST_KEY); |
| searchIndex | const | 315 | no | const searchIndex = await readDataset(session, &#39;search-index&#39;); |
| graphRanked | const | 316 | no | const graphRanked = readKv(session, &#39;GRAPH_RANKED&#39;) ?? await readDataset(session, &#39;graph-ranked&#39;); |
| schemas | const | 317 | no | const schemas = readKv(session, &#39;SCHEMAS&#39;) ?? await readDataset(session, &#39;schemas&#39;); |
| timelines | const | 318 | no | const timelines = readKv(session, &#39;TIMELINES&#39;) ?? await readDataset(session, &#39;timelines&#39;); |
| revisions | const | 319 | no | const revisions = readKv(session, &#39;REVISIONS&#39;) ?? await readDataset(session, &#39;revisions&#39;); |
| searchSession | function | 331 | yes | export async function searchSession(session, query, { limit = 20, fuzzy = true } = {}) { |
| rows | const | 332 | no | const rows = await readDataset(session, &#39;search-index&#39;); |
| cap | const | 334 | no | const cap = Number.isInteger(limit) &amp;&amp; limit &gt; 0 ? limit : 20; |
| source | const | 337 | no | const source = hit.source ?? hit.document?.source ?? {}; |
| layer | const | 338 | no | const layer = source.layer ?? (source.domId != null ? &#39;dom&#39; : &#39;events&#39;); |
| eid | const | 339 | no | const eid = source.eid ?? (layer === &#39;entities&#39; ? hit.id : undefined); |
| ref | const | 340 | no | const ref = eid ?? (source.sid != null ? source.sid : null) ?? (source.domId != null ? `dom:${source.domId}` : hit.id); |
| matched | const | 341 | no | const matched = hit.matched ?? hit.matchedTerms ?? []; |
| fuzzyMatched | const | 342 | no | const fuzzyMatched = hit.fuzzyMatched ?? []; |
| snippet | const | 343 | no | const snippet = hit.snippet ?? &#39;&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./derive.mjs | import | 2 | [studio/src/replay/derive.mjs](./derive.mjs.md) |
| ../intel/search.mjs | import | 3 | [studio/src/intel/search.mjs](../intel/search.mjs.md) |
| ../intel/graph.mjs | import | 4 | [studio/src/intel/graph.mjs](../intel/graph.mjs.md) |
| ../shapes/profiler.mjs | import | 5 | [studio/src/shapes/profiler.mjs](../shapes/profiler.mjs.md) |
| ../intel/history.mjs | import | 6 | [studio/src/intel/history.mjs](../intel/history.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../replay/derive-all.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Full offline derivation. Raw records are read-only; every stage is recomputable.
import { derive, streamRolesCurrent } from './derive.mjs';
import { CorpusSearchIndex, primeFuzzySearch, highlightSpans } from '../intel/search.mjs';
import { rankGraphNodes } from '../intel/graph.mjs';
import { OnlineSchemaProfiler, toJsonSchema } from '../shapes/profiler.mjs';
import { RevisionAccumulator } from '../intel/history.mjs';

const STAGES = Object.freeze(['base', 'search-index', 'graph-ranked', 'schemas', 'stream-timelines', 'revisions']);
const MANIFEST_KEY = 'DERIVE_MANIFEST';
const TEXT_CAP = 4000;
const TIMELINE_CAP = 400;

const HANDLERS = {
  base: stageBase,
  'search-index': stageSearch,
  'graph-ranked': stageGraph,
  schemas: stageSchemas,
  'stream-timelines': stageTimelines,
  revisions: stageRevisions,
};

function emit(onStage, stage, detail = {}) {
  if (typeof onStage !== 'function') return;
  const event = { stage, name: stage, ...detail };
  onStage(event, detail);
}

function clip(text, n = TEXT_CAP) {
  const s = String(text ?? '');
  return s.length > n ? s.slice(0, n) : s;
}

function readKv(session, key) {
  try { return session.kv.get(key, null); } catch { return null; }
}

async function readDataset(session, name) {
  const ds = session.dataset(name);
  if (!ds.exists()) return null;
  return ds.toArray();
}

function writeDataset(session, name, rows) {
  const ds = session.dataset(name);
  ds.reset();
  if (rows.length) ds.push(rows);
  return rows.length;
}

async function rawCount(session) {
  try {
    const stats = session.rawStats?.();
    if (stats && Number.isFinite(stats.records) && stats.records > 0) return stats.records;
  } catch { /* count the log instead */ }
  let n = 0;
  if (typeof session.records === 'function') for await (const _ of session.records()) n++;
  return n;
}

function entityText(entity) {
  const parts = [entity.typeName, entity.type, entity.key, entity.eid];
  if (entity.attrs && typeof entity.attrs === 'object') {
    for (const [key, value] of Object.entries(entity.attrs)) {
      parts.push(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
  return clip(parts.filter((part) => part != null && part !== '').join(' '));
}

function eventText(ev) {
  if (typeof ev.text === 'string' && ev.text) return clip(ev.text);
  if (typeof ev.data === 'string' && ev.data) return clip(ev.data);
  if (ev.json !== undefined) {
    try { return clip(JSON.stringify(ev.json)); } catch { return ''; }
  }
  return '';
}

async function stageBase(session, profile, onStage) {
  const result = await derive(session, profile, {
```

_First 80 of 352 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
