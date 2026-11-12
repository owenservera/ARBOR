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
        });
        link(sourceId, node, 'invalidates');
      }
    }
  }
  if (JSON.stringify(distinctSorted(leafSources)) !== JSON.stringify(distinctSorted(resolution.sourceRefs)))
    throw fail('DCB_GRAPH_DEPENDENCY', 'Source ancestry disagrees with resolution');
  // Second read detects concurrent revision/ancestry changes. The Host's
  // authenticated source adapter remains responsible for source-byte freshness.
  if (revisionKey(definitionStore.resolve(bundleId, { at })) !== revisionKey(resolution))
    throw fail('DCB_GRAPH_DRIFT', 'Definition changed during projection');
  return Object.freeze({
    schema: DCB_GRAPH_LINEAGE_SCHEMA,
    namespaceId: `personal-${hash(`owner\0${ownerRef}`).slice(0,40)}`,
    rootId: opaque('bundle', bundleId),
    revisionDigest: hash(`${ownerRef}\0${revisionKey(resolution)}`),
    nodes: [...nodes.values()].sort((a,b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a,b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
    complete: true, authority: 'read_only_projection', effectsAuthorized: false,
  });
}
