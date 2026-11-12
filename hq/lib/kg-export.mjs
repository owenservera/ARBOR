// hq/lib/kg-export.mjs — deterministic HQKGX1 producer over the operational index.
// @hq:context The single HQ -> Rust graph transport: reads the Bun/SQLite index (the
//   only ingestion authority) and emits a repos-hq.hqkg-exchange/1 JSONL file the
//   native importer (research/rust-knowledge-graph/src/import.rs) accepts verbatim.
// @hq:owner agent-platform-ceo
// @hq:task priority-1 automatic graph ingestion (post-merge convergence campaign)
// @hq:invariant Data-only: never writes the index, never mutates source files, never
//   performs provider or Host effects. Output is deterministic for a given index
//   state: nodes sorted by (project,path), edges by id, tombstones by id, stable
//   JSON key order, one trailing newline.
// @hq:invariant Node identity is path-stable (project + path), so a content edit
//   UPDATES the graph node instead of orphaning it; a rename is one tombstone plus
//   one new node; a deletion is a tombstone only.
// @hq:invariant Personal data must not enter HQ: file paths and content digests only —
//   no file contents, no notes, no receipts, no session data are exported.
// @hq:see hq/lib/schema.mjs · research/rust-knowledge-graph/src/import.rs ·
//   hq/lib/wiki-runtime/graph-index.mjs (consumer-side admission mirror)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const EXCHANGE_SCHEMA = 'repos-hq.hqkg-exchange/1';
export const AUTHORITY = 'data-only; no executable code or provider actions';
const MAX_BYTES = 128 * 1024 * 1024;
const MAX_NODES = 250_000;
const MAX_EDGES = 1_000_000;
const MAX_TOMBSTONES = 250_000;
const ID_RE = /^hqg1:[a-f0-9]{64}$/;
const SENSITIVE = ['password', 'credential', 'token', 'cookie', 'secret', 'api_key', 'private_key', 'authorization'];

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const nodeId = (project, path) => `hqg1:${sha256(`source-file\u0000${project}\u0000${path}`)}`;
const edgeId = (from, to) => `hqg1:${sha256(`imports\u0000${from}\u0000${to}`)}`;

function validId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

// Mirror of the native importer's metadata admission (src/import.rs meta()).
function validMetadata(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
  const keys = Object.keys(meta);
  if (keys.length > 256) return false;
  let total = 0;
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (!key || key.length > 256 || /[\x00-\x1f\x7f]/.test(key)) return false;
    if (key.startsWith('hqkg.') || SENSITIVE.some((s) => lower.includes(s))) return false;
    const value = meta[key];
    if (value === null || !['string', 'number', 'boolean'].includes(typeof value)) return false;
    if (typeof value === 'string' && value.length > 1024) return false;
    total += key.length + String(value).length;
    if (total > 65536) return false;
  }
  return true;
}

function assertAdmissible(row) {
  if (!validId(row.id)) throw new Error(`noncanonical graph id: ${row.id}`);
  if (row.type === 'node') {
    if (typeof row.kind !== 'string' || !row.kind || row.kind.length > 256) throw new Error(`bad node kind: ${row.id}`);
    if (typeof row.title !== 'string' || row.title.length > 65536) throw new Error(`bad node title: ${row.id}`);
    if (!validMetadata(row.metadata)) throw new Error(`inadmissible metadata: ${row.id}`);
  } else if (row.type === 'edge') {
    if (!validId(row.from) || !validId(row.to)) throw new Error(`unresolved edge endpoint: ${row.id}`);
    if (!Number.isInteger(row.weight) || row.weight < 1) throw new Error(`bad edge weight: ${row.id}`);
  } else if (row.type === 'tombstone') {
    // id validity is the whole record; the importer enforces ownership on apply.
  } else {
    throw new Error(`unknown record type: ${row.type}`);
  }
}

/**
 * Build the exchange rows for the current index universe.
 * @param {import('node:sqlite').DatabaseSync} db read-only operational index
 */
function currentUniverse(db) {
  const projects = new Map();
  for (const p of db.prepare('SELECT id, name, path FROM projects ORDER BY name').all()) {
    projects.set(p.id, p);
  }
  const files = db.prepare(
    'SELECT f.id, f.project_id, f.path, f.hash FROM files f ORDER BY f.project_id, f.path',
  ).all();
  const nodes = [];
  const byFileId = new Map();
  for (const f of files) {
    const project = projects.get(f.project_id);
    if (!project || f.hash == null) continue; // unhashed rows carry no content claim
    // Machine-independent identity: <project>/<path>, the same convention the wiki
    // uses for module names (graph.md). Never the absolute checkout path: a clean
    // clone of the same source must produce the same graph identities.
    const rootPath = `${project.name}/${f.path}`.replace(/\\/g, '/');
    if (rootPath.length > 256) continue;
    const id = nodeId(project.name, f.path);
    byFileId.set(f.id, { id, rootPath });
    nodes.push({
      type: 'node',
      id,
      kind: 'source-file',
      title: rootPath,
      metadata: {
        source_path: rootPath,
        content_sha256: f.hash,
        project: project.name,
        namespace: project.name,
      },
    });
  }
  // Only resolved, in-universe import edges (external packages omitted, matching
  // the wiki graph page's aggregation rule).
  const edgeRows = db.prepare(
    `SELECT i.file_id, i.resolved_file_id FROM imports i
      WHERE i.resolved_file_id IS NOT NULL ORDER BY i.file_id, i.resolved_file_id`,
  ).all();
  const seenEdges = new Set();
  const edges = [];
  for (const row of edgeRows) {
    const from = byFileId.get(row.file_id);
    const to = byFileId.get(row.resolved_file_id);
    if (!from || !to || from.id === to.id) continue;
    const id = edgeId(from.id, to.id);
    if (seenEdges.has(id)) continue;
    seenEdges.add(id);
    edges.push({ type: 'edge', id, from: from.id, to: to.id, relation: 'imports', weight: 1, metadata: {} });
  }
  return { nodes, edges };
}

/** Read the previous export's path -> node id map, tolerating absence/corruption. */
function readState(statePath) {
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (state && state.schema === EXCHANGE_SCHEMA && state.entries && typeof state.entries === 'object') {
      return state.entries;
    }
  } catch { /* first export or unreadable state: full universe, no tombstones */ }
  return null;
}

/**
 * Export the operational index as an HQKGX1 exchange.
 *
 * @param {{
 *   db: import('node:sqlite').DatabaseSync,
 *   outPath: string,
 *   statePath?: string,
 * }} args
 * @returns {{
 *   outPath: string, manifest: object, stats: {nodes:number, edges:number,
 *   tombstones:number, unchangedNodes:number}, tombstonedIds: string[],
 *   tombstonedPaths: string[], bytes: number,
 * }}
 */
export function exportGraphExchange({ db, outPath, statePath = null }) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('db_required');
  if (!outPath || typeof outPath !== 'string') throw new TypeError('outPath_required');

  const { nodes, edges } = currentUniverse(db);
  const previous = statePath ? readState(statePath) : null;

  // Tombstones: files present in the previous universe, absent now.
  const tombstonedIds = [];
  const tombstonedPaths = [];
  if (previous) {
    const currentIds = new Set(nodes.map((n) => n.id));
    for (const key of Object.keys(previous).sort()) {
      const entry = previous[key];
      if (!entry || currentIds.has(entry.id)) continue;
      if (!validId(entry.id)) continue;
      tombstonedIds.push(entry.id);
      tombstonedPaths.push(key);
    }
  }
  if (nodes.length > MAX_NODES) throw new Error(`node limit exceeded: ${nodes.length}`);
  if (edges.length > MAX_EDGES) throw new Error(`edge limit exceeded: ${edges.length}`);
  if (tombstonedIds.length > MAX_TOMBSTONES) throw new Error(`tombstone limit exceeded: ${tombstonedIds.length}`);

  const tombstones = tombstonedIds.map((id) => ({ type: 'tombstone', id, reason: 'deleted' }));
  const rows = [...nodes, ...edges, ...tombstones];
  for (const row of rows) assertAdmissible(row);
  const ids = new Set(rows.filter((r) => r.type !== 'edge').map((r) => r.id));
  if (ids.size !== nodes.length + tombstones.length) throw new Error('duplicate graph identity');

  const body = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
  const bytes = Buffer.byteLength(body);
  if (bytes > MAX_BYTES) throw new Error(`exchange too large: ${bytes}`);
  const digest = sha256(body);
  const manifest = {
    type: 'manifest',
    schema: EXCHANGE_SCHEMA,
    source: 'repos-hq.index',
    authority: AUTHORITY,
    // The exporter emits the complete current universe: edges it omits are
    // deletions, so a reconcile-capable importer must drop source-owned edges
    // absent from this projection. Older importers ignore the flag and keep
    // the pre-tombstone behavior (upsert-only).
    reconcile_edges: true,
    node_count: nodes.length,
    edge_count: edges.length,
    tombstone_count: tombstones.length,
    graph_sha256: digest,
  };

  // Atomic-ish write: temp file then rename, so a reader never sees a partial file.
  mkdirSync(dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(manifest) + '\n' + body);
  renameSync(tmp, outPath);

  // State advancement is ACKNOWLEDGMENT-GATED. The computed next state is written
  // to a pending file only; the committed state advances when the importer
  // acknowledges this exact digest (see acknowledgeGraphExport). If the import
  // fails or crashes after export, the old state stands — the next export re-diffs
  // against it and re-emits the same tombstones/deltas, and the idempotent importer
  // replays them safely. Tombstones can no longer be lost between export and import.
  let unchangedNodes = 0;
  if (statePath) {
    const entries = {};
    for (const node of nodes) {
      const meta = node.metadata;
      entries[meta.source_path] = { id: node.id, content_sha256: meta.content_sha256 };
      if (previous && previous[meta.source_path]?.content_sha256 === meta.content_sha256) {
        unchangedNodes += 1;
      }
    }
    mkdirSync(dirname(statePath), { recursive: true });
    const tmpState = `${statePath}.pending-${process.pid}`;
    writeFileSync(tmpState, JSON.stringify({
      schema: EXCHANGE_SCHEMA,
      exportedAt: new Date().toISOString(),
      pendingDigest: digest,
      entries,
    }, null, 0) + '\n');
    renameSync(tmpState, `${statePath}.pending`);
  } else {
    unchangedNodes = -1; // unknown: no state tracking configured
  }

  // Record the last export for the acknowledgment step (digest binding).
  const lastPath = statePath ? `${statePath}.last-export` : null;
  if (lastPath) {
    const tmpLast = `${lastPath}.tmp-${process.pid}`;
    writeFileSync(tmpLast, JSON.stringify({
      schema: EXCHANGE_SCHEMA,
      digest,
      outPath,
      exportedAt: new Date().toISOString(),
      stats: { nodes: nodes.length, edges: edges.length, tombstones: tombstones.length },
    }) + '\n');
    renameSync(tmpLast, lastPath);
  }

  return {
    outPath,
    manifest,
    digest,
    stats: { nodes: nodes.length, edges: edges.length, tombstones: tombstones.length, unchangedNodes },
    tombstonedIds,
    tombstonedPaths,
    bytes,
  };
}

/**
 * Advance the exporter state after a VERIFIED importer acknowledgment.
 *
 * The caller must pass the digest of the exchange it actually imported and the
 * importer's own stats (epoch before/after, nodes_deleted...). The pending state
 * is only committed when its pendingDigest matches, so a failed or stale import
 * never advances the delta base.
 *
 * @param {{
 *   statePath: string,
 *   digest: string,
 *   acknowledgment?: {epochBefore?: number, epochAfter?: number, stats?: string},
 * }} args
 * @returns {{acked: boolean, reason?: string, tombstonesCommitted?: number}}
 */
export function acknowledgeGraphExport({ statePath, digest, acknowledgment = null }) {
  if (!statePath || typeof statePath !== 'string') throw new TypeError('statePath_required');
  if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new TypeError('digest_required_64hex');
  const pendingPath = `${statePath}.pending`;
  const lastPath = `${statePath}.last-export`;
  if (!existsSync(pendingPath)) {
    return { acked: false, reason: 'no_pending_export' };
  }
  const pending = JSON.parse(readFileSync(pendingPath, 'utf8'));
  if (pending?.schema !== EXCHANGE_SCHEMA || pending?.pendingDigest !== digest) {
    return { acked: false, reason: 'digest_mismatch_with_pending_state' };
  }
  if (acknowledgment && acknowledgment.epochAfter != null && acknowledgment.epochBefore != null
    && acknowledgment.epochAfter < acknowledgment.epochBefore) {
    return { acked: false, reason: 'importer_reported_epoch_regression' };
  }
  const committed = {
    schema: EXCHANGE_SCHEMA,
    exportedAt: pending.exportedAt,
    ackedAt: new Date().toISOString(),
    ackedDigest: digest,
    entries: pending.entries,
  };
  const tmpState = `${statePath}.tmp-${process.pid}`;
  writeFileSync(tmpState, JSON.stringify(committed, null, 0) + '\n');
  renameSync(tmpState, statePath);
  rmSync(pendingPath, { force: true });
  return {
    acked: true,
    tombstonesCommitted: acknowledgment?.stats
      ? Number((String(acknowledgment.stats).match(/deleted=(\d+)/) ?? [0, 0])[1])
      : undefined,
  };
}

/** Read the last export record (digest binding for the ack step). */
export function lastGraphExport(statePath) {
  const lastPath = `${statePath}.last-export`;
  if (!existsSync(lastPath)) return null;
  try {
    return JSON.parse(readFileSync(lastPath, 'utf8'));
  } catch {
    return null;
  }
}
