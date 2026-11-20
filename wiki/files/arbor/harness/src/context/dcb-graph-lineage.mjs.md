# File: harness/src/context/dcb-graph-lineage.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-graph-lineage.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5846 B |
| Lines | 101 |
| Hash | 53d0d03f885d |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_GRAPH_LINEAGE_SCHEMA | const | 5 | yes | export const DCB_GRAPH_LINEAGE_SCHEMA = &#39;vivim.dcb-graph-lineage/1&#39;; |
| REF | const | 6 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| fail | function | 7 | no | const fail = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| validRef | function | 8 | no | const validRef = value =&gt; typeof value === &#39;string&#39; &amp;&amp; REF.test(value); |
| hash | function | 9 | no | const hash = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| distinctSorted | function | 10 | no | const distinctSorted = values =&gt; [...new Set(values)].sort(); |
| revisionKey | function | 11 | no | const revisionKey = resolution =&gt; JSON.stringify({ sourceRefs: distinctSorted(resolution.sourceRefs), flavorRefs: distinctSorted(resolution.flavorRefs), dependencies: [...resolution.dependencies].map… |
| projectDcbGraphLineage | function | 22 | yes | export function projectDcbGraphLineage({ definitionStore, bundleId, ownerRef, at } = {}) { |
| resolution | const | 28 | no | const resolution = definitionStore.resolve(bundleId, { at }); |
| opaque | function | 33 | no | const opaque = (kind, id) =&gt; `dg-${kind}-${hash(`${ownerRef}\\0${kind}\\0${id}`).slice(0,40)}`; |
| nodes | const | 34 | no | const nodes = new Map(), edges = new Map(), definitions = new Map(); |
| addNode | function | 35 | no | const addNode = (id, kind, attributes) =&gt; { |
| value | const | 36 | no | const value = { id, kind, ...attributes }; |
| old | const | 37 | no | const old = nodes.get(id); |
| link | function | 42 | no | const link = (from, to, kind) =&gt; { |
| id | const | 43 | no | const id = `${from}\\0${kind}\\0${to}`; |
| d | const | 49 | no | const d = definitionStore.get(dep.ref); |
| leafSources | const | 64 | no | const leafSources = []; |
| node | const | 66 | no | const node = opaque(&#39;bundle&#39;, d.id); |
| sourceId | const | 78 | no | const sourceId = opaque(&#39;source&#39;, source); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bench/dcb-graph-lineage.mjs](../../bench/dcb-graph-lineage.mjs.md) | ../src/context/dcb-graph-lineage.mjs |
| [harness/test/context/dcb-graph-lineage.test.mjs](../../test/context/dcb-graph-lineage.test.mjs.md) | ../../src/context/dcb-graph-lineage.mjs |
| [studio/src/agents/dcb-context-runtime.mjs](../../../studio/src/agents/dcb-context-runtime.mjs.md) | ../../../harness/src/context/dcb-graph-lineage.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Owner-local, read-only DCB lineage for the EXISTING Personal World graph.
// No private source IDs, text, grants, graph writer, journal, or effect authority.
import { createHash } from 'node:crypto';

export const DCB_GRAPH_LINEAGE_SCHEMA = 'vivim.dcb-graph-lineage/1';
const REF = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const fail = (code, message) => Object.assign(new Error(message), { code });
const validRef = value => typeof value === 'string' && REF.test(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const distinctSorted = values => [...new Set(values)].sort();
const revisionKey = resolution => JSON.stringify({
  sourceRefs: distinctSorted(resolution.sourceRefs),
  flavorRefs: distinctSorted(resolution.flavorRefs),
  dependencies: [...resolution.dependencies].map(x => [x.ref, x.revision]).sort((a,b) => a[0].localeCompare(b[0])),
});

/**
 * Project canonical Host definition ancestry into an opaque graph read-model.
 * Source refs and bundle IDs are never emitted. The native graph bridge may
 * consume this after verifying the same Host principal; this is NOT a grant.
 */
export function projectDcbGraphLineage({ definitionStore, bundleId, ownerRef, at } = {}) {
  if (typeof definitionStore?.get !== 'function' || typeof definitionStore?.resolve !== 'function')
    throw fail('DCB_GRAPH_STORE', 'Existing Host definition store is required');
  if (!validRef(bundleId) || !validRef(ownerRef) || typeof at !== 'string'
    || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at)
    throw fail('DCB_GRAPH_INPUT', 'Owner, bundle and pinned time required');
  const resolution = definitionStore.resolve(bundleId, { at });
  if (!Array.isArray(resolution?.dependencies) || resolution.dependencies.length > 500
    || !Array.isArray(resolution.sourceRefs) || resolution.sourceRefs.length > 250
    || !Array.isArray(resolution.flavorRefs) || resolution.flavorRefs.length > 100)
    throw fail('DCB_GRAPH_BOUNDS', 'Unexpected resolution shape or size');
  const opaque = (kind, id) => `dg-${kind}-${hash(`${ownerRef}\0${kind}\0${id}`).slice(0,40)}`;
  const nodes = new Map(), edges = new Map(), definitions = new Map();
  const addNode = (id, kind, attributes) => {
    const value = { id, kind, ...attributes };
    const old = nodes.get(id);
    if (old && JSON.stringify(old) !== JSON.stringify(value))
      throw fail('DCB_GRAPH_COLLISION', 'Conflicting projected node');
    nodes.set(id, value);
  };
  const link = (from, to, kind) => {
    const id = `${from}\0${kind}\0${to}`;
    edges.set(id, { from, to, kind, provenance: 'host-definition-read', effectsAuthorized: false });
  };
  for (const dep of resolution.dependencies) {
    if (!validRef(dep?.ref) || !Number.isSafeInteger(dep.revision) || dep.revision < 1
      || definitions.has(dep.ref)) throw fail('DCB_GRAPH_DEPENDENCY', 'Invalid dependency');
    const d = definitionStore.get(dep.ref);
    if (!d || d.id !== dep.ref || d.ownerRef !== ownerRef)
      throw fail('DCB_GRAPH_OWNER', 'Missing or cross-owner definition');
    if (d.revision !== dep.revision || d.status !== 'active')
      throw fail('DCB_GRAPH_DRIFT', 'Definition changed during read');
    if (!Array.isArray(d.sourceRefs) || !Array.isArray(d.parentRefs)
      || d.sourceRefs.length > 250 || d.parentRefs.length > 250)
      throw fail('DCB_GRAPH_BOUNDS', 'Invalid definition ancestry');
    definitions.set(d.id, d);
    addNode(opaque('bundle', d.id), 'context-bundle', {
      revision: d.revision, mode: d.mode, status: d.status,
      owner: 'host-personal-world', origin: 'host-dcb-versioned-store',
    });
  }
  if (!definitions.has(bundleId)) throw fail('DCB_GRAPH_DEPENDENCY', 'Missing root dependency');
  const leafSources = [];
  for (const d of definitions.values()) {
    const node = opaque('bundle', d.id);
    if (d.mode === 'composite') {
      if (d.sourceRefs.length || !d.parentRefs.length) throw fail('DCB_GRAPH_DEPENDENCY', 'Invalid composite');
      for (const parent of d.parentRefs) {
        if (!definitions.has(parent)) throw fail('DCB_GRAPH_DEPENDENCY', 'Unresolved parent');
        link(opaque('bundle', parent), node, 'invalidates');
      }
    } else {
      if (d.parentRefs.length) throw fail('DCB_GRAPH_DEPENDENCY', 'Unexpected parent');
      for (const source of d.sourceRefs) {
        if (!validRef(source)) throw fail('DCB_GRAPH_DEPENDENCY', 'Invalid source reference');
        leafSources.push(source);
        const sourceId = opaque('source', source);
        addNode(sourceId, 'context-source', {
          owner: 'host-personal-world', origin: 'host-authorized-source-reference',
```

_First 80 of 102 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
