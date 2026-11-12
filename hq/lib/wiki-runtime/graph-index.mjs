/**
 * Graph identity index for the wiki writer.
 *
 * Reads the published `repos-hq.hqkg-exchange/1` file that Lane E's assembler
 * produced, verifies the manifest's own SHA-256 over the body, and returns a
 * bounded read model that lets the existing wiki writer name the canonical graph
 * id of a source file, a semantic identity and a registered command.
 *
 * It is a READ MODEL over the graph. It creates no identity, computes no
 * canonical id of its own, and stores nothing.
 *
 * @hq:context Graph-linked wiki projection over Lane E's published exchange.
 * @hq:owner hq-agent
 * @hq:task wave1-wiki-graph-index
 * @hq:invariant Read only. No graph write, no journal write, no second identity
 *   authority: every id in the index is copied from the exchange verbatim.
 * @hq:invariant The exchange body must match the manifest's own graph_sha256, or
 *   the index is refused.
 * @hq:see hq/live-graph/wave1/master/README.md
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const GRAPH_INDEX_SCHEMA = 'vivim.wave1.wiki-graph-index/1';
const EXCHANGE_SCHEMA = 'repos-hq.hqkg-exchange/1';
const MAX_BYTES = 128 * 1024 * 1024;
const MAX_NODES = 250000;
const MAX_EDGES = 1000000;
const ID_RE = /^hqg1:[a-f0-9]{64}$/;

const sha256 = value => createHash('sha256').update(value).digest('hex');

export function buildGraphIndex(exchangePath) {
  const text = readFileSync(exchangePath, 'utf8');
  if (!text || Buffer.byteLength(text) > MAX_BYTES) throw new Error('BAD_EXCHANGE_BYTES');
  const eol = text.indexOf('\n');
  if (eol <= 0) throw new Error('MISSING_MANIFEST');
  const body = text.slice(eol + 1);
  const manifest = JSON.parse(text.slice(0, eol));
  if (manifest.schema !== EXCHANGE_SCHEMA || manifest.type !== 'manifest') throw new Error('BAD_EXCHANGE_MANIFEST');
  if (manifest.graph_sha256 !== sha256(body)) throw new Error('BAD_EXCHANGE_SHA');
  // Match the existing native importer admission rules before exposing records to
  // the wiki. The hash authenticates bytes against this manifest, not structure.
  if (manifest.authority !== 'data-only; no executable code or provider actions'
    || typeof manifest.source !== 'string' || !manifest.source || Buffer.byteLength(manifest.source) > 256
    || /[\x00-\x1f\x7f]/.test(manifest.source)) throw new Error('BAD_EXCHANGE_AUTHORITY');
  if (!Number.isSafeInteger(manifest.node_count) || manifest.node_count < 0 || manifest.node_count > MAX_NODES
    || !Number.isSafeInteger(manifest.edge_count) || manifest.edge_count < 0 || manifest.edge_count > MAX_EDGES) {
    throw new Error('BAD_EXCHANGE_COUNTS');
  }
  if (!body.endsWith('\n')) throw new Error('BAD_EXCHANGE_NEWLINE');

  // One semantic identity can name several graph nodes (the knowledge record and
  // the command that carries it), so every key keeps a list, never a single winner.
  const bySemanticId = new Map();
  const byActionId = new Map();
  const bySourceFile = new Map();
  const ambiguousSourceFiles = new Set();
  const byNodeId = new Map();
  const push = (map, key, entry) => {
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  };
  let nodes = 0;
  let edges = 0;
  let seenEdges = false;
  const edgeIds = new Set();
  const endpoints = [];
  const validId = id => typeof id === 'string' && ID_RE.test(id);
  const validName = value => typeof value === 'string' && value.length > 0
    && Buffer.byteLength(value) <= 256 && !/[\x00-\x1f\x7f]/.test(value);
  const validMetadata = meta => {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
    const keys = Object.keys(meta);
    if (keys.length > 256) return false;
    let size = 0;
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (!validName(key) || key.startsWith('hqkg.')
        || ['password', 'credential', 'token', 'cookie', 'secret', 'api_key', 'private_key', 'authorization']
          .some(sensitive => lower.includes(sensitive))) return false;
      const value = meta[key];
      if (value === null || !['string', 'number', 'boolean'].includes(typeof value)
        || typeof value === 'number' && !Number.isFinite(value)) return false;
      const rendered = String(value);
      if (Buffer.byteLength(rendered) > 1024) return false;
      size += Buffer.byteLength(key) + Buffer.byteLength(rendered);
      if (size > 65536) return false;
    }
    return true;
  };

  for (const line of body.slice(0, -1).split('\n')) {
    if (!line || line.endsWith('\r')) throw new Error('BAD_EXCHANGE_RECORD');
    let row;
    try { row = JSON.parse(line); } catch { throw new Error('BAD_EXCHANGE_JSON'); }
    if (!row || typeof row !== 'object' || Array.isArray(row) || !validId(row.id)) {
      throw new Error('BAD_EXCHANGE_RECORD');
    }
    if (row.type === 'edge') {
      seenEdges = true;
      edges++;
      if (edges > MAX_EDGES || edgeIds.has(row.id) || !validId(row.from) || !validId(row.to)
        || !validName(row.relation) || !Number.isInteger(row.weight)
        || row.weight < 1 || row.weight > 0xffffffff) throw new Error('BAD_EXCHANGE_EDGE');
      if (!validMetadata(row.metadata ?? {})) throw new Error('BAD_EXCHANGE_METADATA');
      edgeIds.add(row.id);
      endpoints.push([row.from, row.to]);
      continue;
    }
    if (row.type !== 'node' || seenEdges || !validName(row.kind)
      || typeof row.title !== 'string' || Buffer.byteLength(row.title) > 65536
      || byNodeId.has(row.id)) throw new Error('BAD_EXCHANGE_NODE');
    nodes++;
    if (nodes > MAX_NODES) throw new Error('TOO_MANY_NODES');
    const meta = row.metadata ?? {};
    if (!validMetadata(meta)) throw new Error('BAD_EXCHANGE_METADATA');
    const entry = {
      id: row.id,
      kind: row.kind,
      title: row.title,
      status: meta.status ?? null,
      semanticId: meta.semantic_id ?? null,
      actionId: meta.action_id ?? null,
      sourcePath: meta.source_path ?? null,
      sourceSha256: meta.content_sha256 ?? null,
      sourceCommit: meta.source_commit ?? null,
      domain: meta.domain ?? null,
    };
    byNodeId.set(row.id, entry);
    if (entry.semanticId) push(bySemanticId, entry.semanticId, entry);
    if (entry.actionId) push(byActionId, entry.actionId, entry);
    // This legacy lookup is unscoped. Never choose a winner when two
    // repositories contain identical path+digest pairs.
    if (entry.kind === 'source-file' && entry.sourcePath && entry.sourceSha256) {
      const key = entry.sourcePath + '\u0000' + entry.sourceSha256;
      if (ambiguousSourceFiles.has(key)) continue;
      if (bySourceFile.has(key)) {
        bySourceFile.delete(key);
        ambiguousSourceFiles.add(key);
      } else {
        bySourceFile.set(key, entry);
      }
    }
  }
  if (nodes !== manifest.node_count || edges !== manifest.edge_count) throw new Error('EXCHANGE_COUNT_MISMATCH');
  for (const [from, to] of endpoints) {
    if (!byNodeId.has(from) || !byNodeId.has(to)) throw new Error('UNRESOLVED_EXCHANGE_EDGE');
  }
  return {
    schema: GRAPH_INDEX_SCHEMA,
    exchangeDigest: manifest.graph_sha256,
    nodeCount: nodes,
    edgeCount: edges,
    bySemanticId,
    byActionId,
    bySourceFile,
    ambiguousSourceFiles,
    byNodeId,
  };
}
