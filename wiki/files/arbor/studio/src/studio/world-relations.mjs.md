# File: studio/src/studio/world-relations.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-relations.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17362 B |
| Lines | 220 |
| Hash | 1f63ee2750cb |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| check | function | 7 | no | const check = (ok, message) =&gt; { if (!ok) throw problem(400, message, &#39;WORLD_INVALID_INPUT&#39;); }; |
| clean | function | 8 | no | const clean = ({ name, changeNote, ...value }) =&gt; value; |
| fields | function | 11 | no | const fields = (body, keys) =&gt; check(body &amp;&amp; typeof body === &#39;object&#39; &amp;&amp; !Array.isArray(body) &amp;&amp; Object.keys(body).every((k) =&gt; keys.includes(k)), &#39;Invalid or unknown field&#39;); |
| legacySelectionFingerprint | function | 15 | yes | export const legacySelectionFingerprint = (messages) =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(messages.map(({ domId, roleAttribute, ...legacy }) =&gt; { const { domId: sourceDomId, ...source } = le… |
| fingerprint | const | 18 | no | const fingerprint = legacySelectionFingerprint; |
| createWorldRelations | function | 19 | yes | export function createWorldRelations({ store, service, save, readControlLineage = () =&gt; null }) { |
| ns | variable | 20 | no | let ns; |
| loadStored | function | 27 | no | const loadStored = (id, kind) =&gt; { |
| stored | const | 28 | no | const stored = load(id, kind); const { availability, availabilityReason, coverage, identity, qualification, ...data } = stored; void availability; |
| load | function | 31 | no | const load = (id, kind) =&gt; { |
| context | function | 40 | no | const context = () =&gt; ({ projections: new Map(), fingerprints: new Map() }); |
| projection | function | 41 | no | const projection = (id, ctx) =&gt; { |
| result | const | 46 | no | const result = ctx.projections.get(id); if (result.error) throw result.error; return result.value; |
| unavailable | function | 48 | no | const unavailable = (e) =&gt; { |
| evidenceAvailability | function | 53 | no | const evidenceAvailability = (p) =&gt; p.coverage.state === &#39;missing&#39; ? { availability: &#39;missing&#39;, availabilityReason: &#39;EVIDENCE_MISSING&#39; } |
| object | const | 56 | no | const object = (id, ctx = context()) =&gt; { |
| selection | const | 61 | no | const selection = (id, ctx = context()) =&gt; { |
| owner | const | 64 | no | const owner = load(record.objectId, &#39;source-reference&#39;), p = projection(owner.conversationId, ctx), available = evidenceAvailability(p); |
| matches | const | 67 | no | const matches = ctx.fingerprints.get(owner.conversationId) === record.source.revision; |
| list | function | 72 | no | const list = (kind, q, project) =&gt; { |
| names | const | 73 | no | const names = store.names(), selected = page(names.filter((id) =&gt; id.startsWith(kind === &#39;selection&#39; ? &#39;s-&#39; : &#39;o-&#39;)), q), ctx = context(); |
| ref | function | 76 | no | const ref = (id) =&gt; { |
| parsed | const | 80 | no | const parsed = parseNoteUnitRef(id); |
| validate | function | 91 | no | const validate = (values, previous, selectionsOnly = false) =&gt; { |
| source | const | 105 | no | const source = service.conversation(body.conversationId), id = `o-${randomUUID()}`; |
| owner | const | 113 | no | const owner = object(body.objectId), projection = service.conversation(owner.conversationId); |
| message | const | 115 | no | const message = projection.messages[body.messageIndex], partPath = body.partPath ?? []; |
| value | variable | 119 | no | let value = message.blocks; |
| id | const | 121 | no | const id = `s-${randomUUID()}`; |
| graph | const | 133 | no | const graph = new TemporalGraph(); |
| controlLineage | const | 134 | no | const controlLineage=readControlLineage(); |
| conversations | const | 139 | no | const conversations = service.conversations({ limit: 1000, custody: &#39;all&#39; }), projects = service.projects({ limit: 1000 }), notes = service.notes({ limit: 1000 }); |
| names | const | 140 | no | const names = store.names(), objectNames = names.filter((id) =&gt; id.startsWith(&#39;o-&#39;)), selectionNames = names.filter((id) =&gt; id.startsWith(&#39;s-&#39;)); |
| mapCtx | const | 141 | no | const mapCtx = context(); |
| nodes | const | 142 | no | const nodes = [...conversations.items.map((r) =&gt; ({ ...r, kind: &#39;conversation&#39; })), ...projects.items, ...notes.items, |
| inputTruncated | const | 144 | no | const inputTruncated = conversations.total &gt; 1000 \|\| projects.total &gt; 1000 \|\| notes.total &gt; 1000 \|\| objectNames.length &gt; 1000 \|\| selectionNames.length &gt; 1000; |
| metadataRequest | const | 145 | no | const metadataRequest = {}; |
| edgesScanned | variable | 146 | no | let edgesScanned = 0, placeholders = 0, scanTruncated = false; |
| addNode | function | 147 | no | const addNode = (record) =&gt; graph.upsertEntity({ eid: record.id, type: record.kind, attrs: { id: record.id, kind: record.kind, title: record.title ?? null, provenance: record.provenance ?? (record.ki… |
| relate | function | 155 | no | const relate = (r, to, kind) =&gt; { |
| targetKind | const | 161 | no | const targetKind = ({ c: &#39;conversation&#39;, p: &#39;project&#39;, n: &#39;note&#39;, o: &#39;source-reference&#39;, s: &#39;selection&#39; })[to[0]] ?? &#39;unresolved-reference&#39;; |
| target | variable | 162 | no | let target = { id: to, kind: targetKind, availability: &#39;unresolved&#39;, availabilityReason: &#39;NOT_SCANNED&#39; }; |
| targets | const | 178 | no | const targets = r.kind === &#39;project&#39; ? new Set([...(r.conversationIds ?? []), ...(r.noteIds ?? []), ...(r.memberIds ?? [])]) |
| matched | const | 201 | no | const matched = [...graph.nodes.values()].filter((n) =&gt; (!q.id \|\| n.eid === q.id \|\| [...graph.edges.values()].some((e) =&gt; e.from === q.id &amp;&amp; e.to === n.eid \|\| e.to === q.id &amp;&amp; e.from === n.eid)) &amp;&amp; (… |
| selected | const | 202 | no | const selected = matched.slice(0, Number(q.limit ?? 100)), included = new Set(selected.map((n) =&gt; n.eid)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 1 | external |
| ./http.mjs | import | 2 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../intel/graph.mjs | import | 3 | [studio/src/intel/graph.mjs](../intel/graph.mjs.md) |
| ./world-url.mjs | import | 4 | [studio/src/studio/world-url.mjs](./world-url.mjs.md) |
| ./world-note-units.mjs | import | 5 | [studio/src/studio/world-note-units.mjs](./world-note-units.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-relations.mjs |
| [studio/src/studio/world-transfer.mjs](./world-transfer.mjs.md) | ./world-relations.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { randomUUID, createHash } from 'node:crypto';
import { problem, page } from './http.mjs';
import { TemporalGraph } from '../intel/graph.mjs';
import { sanitizedSource } from './world-url.mjs';
import { parseNoteUnitRef } from './world-note-units.mjs';

const check = (ok, message) => { if (!ok) throw problem(400, message, 'WORLD_INVALID_INPUT'); };
const clean = ({ name, changeNote, ...value }) => value;
// Keep the original selection revision bytes: newly exposed provenance is not a source rewrite.

const fields = (body, keys) => check(body && typeof body === 'object' && !Array.isArray(body)
  && Object.keys(body).every((k) => keys.includes(k)), 'Invalid or unknown field');

// Durable local addresses and user relations; the map is rebuilt through the existing graph owner.
export const legacySelectionFingerprint = (messages) => createHash('sha256').update(JSON.stringify(messages.map(({ domId, roleAttribute, ...legacy }) => {
  const { domId: sourceDomId, ...source } = legacy.source; void sourceDomId; return { ...legacy, source };
}))).digest('hex');
const fingerprint = legacySelectionFingerprint;
export function createWorldRelations({ store, service, save, readControlLineage = () => null }) {
  let ns;
  try { ns = store.load('world-namespace'); }
  catch (e) {
    if (e.code !== 'STORE_NO_SUCH_ITEM') throw e;
    try { ns = store.compareAndSave('world-namespace', { id: `w-${randomUUID()}`, kind: 'namespace', schema: 'vivim.world/1' }, { expectedVersion: null }); }
    catch (e) { if (e.code !== 'CAS_VERSION_CONFLICT') throw e; ns = store.load('world-namespace'); }
  }
  const loadStored = (id, kind) => {
    const stored = load(id, kind); const { availability, availabilityReason, coverage, identity, qualification, ...data } = stored; void availability;
    return data;
  };
  const load = (id, kind) => {
    check(typeof id === 'string' && new RegExp(`^${kind === 'selection' ? 's' : 'o'}-(?:[a-f0-9-]{36}|[a-f0-9]{36}f)$`).test(id), 'Invalid local object ID');
    let record;
    try { record = store.load(id); } catch (e) { if (e.code !== 'STORE_NO_SUCH_ITEM') throw e; throw problem(404, 'Local object not found', 'WORLD_NOT_FOUND'); }
    check(record.kind === kind, 'Object type mismatch');
    // Read-time projection: a stored record.source.providerUrl is sanitized (origin+pathname),
    // covering object/selection API reads, search hit source and every export of these records.
    return { ...clean(record), source: sanitizedSource(record.source) };
  };
  const context = () => ({ projections: new Map(), fingerprints: new Map() });
  const projection = (id, ctx) => {
    if (!ctx.projections.has(id)) {
      try { ctx.projections.set(id, { value: service.conversation(id) }); }
      catch (error) { ctx.projections.set(id, { error }); }
    }
    const result = ctx.projections.get(id); if (result.error) throw result.error; return result.value;
  };
  const unavailable = (e) => {
    if (e.code === 'WORLD_NOT_FOUND') return { availability: 'missing', availabilityReason: 'SOURCE_MISSING' };
    if (e.code === 'WORLD_SOURCE_ACTIVE') return { availability: 'unavailable', availabilityReason: 'SOURCE_ACTIVE' };
    throw e;
  };
  const evidenceAvailability = (p) => p.coverage.state === 'missing' ? { availability: 'missing', availabilityReason: 'EVIDENCE_MISSING' }
    : p.coverage.state === 'unavailable' ? { availability: 'unavailable', availabilityReason: p.coverage.reason }
      : { availability: 'locally-available', availabilityReason: p.coverage.state === 'partial' ? 'PARTIAL_EVIDENCE' : null };
  const object = (id, ctx = context()) => {
    const record = load(id, 'source-reference');
    try { const p = projection(record.conversationId, ctx); return { ...record, ...evidenceAvailability(p), coverage: p.coverage, identity: p.identity }; }
    catch (e) { return { ...record, ...unavailable(e), identity: record.identity }; }
  };
  const selection = (id, ctx = context()) => {
    const record = load(id, 'selection');
    try {
      const owner = load(record.objectId, 'source-reference'), p = projection(owner.conversationId, ctx), available = evidenceAvailability(p);
      if (available.availability !== 'locally-available') return { ...record, ...available };
      if (!ctx.fingerprints.has(owner.conversationId)) ctx.fingerprints.set(owner.conversationId, fingerprint(p.messages));
      const matches = ctx.fingerprints.get(owner.conversationId) === record.source.revision;
      return { ...record, availability: matches ? 'locally-available' : 'stale', availabilityReason: matches ? available.availabilityReason : 'REVISION_CHANGED',
        qualification: 'Address pinned to saved observation revision; never automatically reanchored' };
    } catch (e) { return { ...record, ...unavailable(e) }; }
  };
  const list = (kind, q, project) => {
    const names = store.names(), selected = page(names.filter((id) => id.startsWith(kind === 'selection' ? 's-' : 'o-')), q), ctx = context();
    return { ...selected, items: selected.items.map((id) => project(id, ctx)), namesEnumerated: names.length };
  };
  const ref = (id) => {
    if (typeof id !== 'string') throw problem(400, 'Invalid reference', 'WORLD_INVALID_INPUT');
    // n-<id>#u-<unit> addresses one atomic unit inside a note (see world-note-units.mjs).
    if (id.startsWith('n-') && id.includes('#')) {
      const parsed = parseNoteUnitRef(id);
```

_First 80 of 221 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
