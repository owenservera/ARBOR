// hq/lib/kg-export.mjs — deterministic HQKGX1 producer over the operational index.
// @hq:context The single HQ -> Rust graph transport: reads the Bun/SQLite index (the
//   only ingestion authority) and emits a repos-hq.hqkg-exchange/1 JSONL file the
//   native importer (native/hqkg/src/import.rs) accepts verbatim.
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
// @hq:see hq/lib/schema.mjs · native/hqkg/src/import.rs ·
//   hq/lib/wiki-runtime/graph-index.mjs (consumer-side admission mirror)
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXCHANGE_SCHEMA = 'repos-hq.hqkg-exchange/1';
export const AUTHORITY = 'data-only; no executable code or provider actions';
// The one source namespace every HQ exchange is produced and imported under.
// `importGraphExchange` binds an import to it and refuses a mismatch, so a
// packaged product can never apply another producer's projection by accident.
export const SOURCE_NAMESPACE = 'repos-hq.index';
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
    byFileId.set(f.id, { id, rootPath, hash:f.hash, project:project.name });
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
  // @hq:type hq.semantic-file-anchor@1
  // Semantic observations are data, not registry promotions or verified runtime
  // behavior. Keep path-stable file anchors and shared versioned identities.
  const groups=new Map(), semantic=new Map();
  const tagRows=db.prepare("SELECT file_id,kind,ref,line FROM annotations WHERE kind IN ('v2:type','v2:capability','v2:contract','v2:emits','v2:consumes','v2:action') AND ref IS NOT NULL ORDER BY file_id,kind,ref,line").all();
  for(const row of tagRows){
    const file=byFileId.get(row.file_id);
    if(!file||typeof row.ref!=='string'||row.ref.length>180||! /^[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*$/.test(row.ref)||!Number.isSafeInteger(row.line)||row.line<1)continue;
    const tag=row.kind.slice(3);
    const key=JSON.stringify([file.id,tag,row.ref]);
    if(!groups.has(key))groups.set(key,{file,tag,ref:row.ref,lines:[]});
    groups.get(key).lines.push(row.line);
  }
  const graphId=(kind,...parts)=>'hqg1:'+sha256([kind,...parts].join('\u0000'));
  // File/name/kind groups preserve identity across line shifts. Multiple
  // declarations of the same name/kind are explicitly ambiguous: the current
  // index does not prove qualified AST ownership or call-site resolution.
  const symbolGroups=new Map();
  for(const row of db.prepare('SELECT file_id,name,kind,line,end_line,exported FROM symbols ORDER BY file_id,name,kind,line,end_line').all()){
    const file=byFileId.get(row.file_id);
    if(!file||typeof row.name!=='string'||row.name.length>180||! /^[A-Za-z_$][A-Za-z0-9_$:.]*$/.test(row.name)
       ||typeof row.kind!=='string'||! /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(row.kind)
       ||!Number.isSafeInteger(row.line)||row.line<1)continue;
    const key=JSON.stringify([file.id,row.name,row.kind]);
    if(!symbolGroups.has(key))symbolGroups.set(key,{file,name:row.name,kind:row.kind,occurrences:[]});
    symbolGroups.get(key).occurrences.push([row.line,Number.isSafeInteger(row.end_line)&&row.end_line>=row.line?row.end_line:row.line,row.exported===1]);
  }
  for(const [key,g] of [...symbolGroups].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const id=graphId('indexed-symbol',key);
    const count=g.occurrences.length;
    nodes.push({type:'node',id,kind:'source-symbol',title:g.name,metadata:{
      source_path:g.file.rootPath,content_sha256:g.file.hash,project:g.file.project,
      symbol_name:g.name,symbol_kind:g.kind,status:count===1?'indexed-not-live-checked':'ambiguous',
      first_line:g.occurrences[0][0],occurrence_count:count,exported:g.occurrences.some(x=>x[2]),
      anchor_digest:sha256(JSON.stringify([key,g.file.hash,g.occurrences])),domain:'development'
    }});
    edges.push({type:'edge',id:graphId('contains-indexed-symbol',g.file.id,id),from:g.file.id,to:id,
      relation:'contains-indexed-symbol',weight:1,metadata:{evidence_class:'indexed-symbol-occurrence'}});
  }
  for(const [key,g] of [...groups].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const semId=graphId('semantic-id',g.ref), anchorId=graphId('semantic-file-anchor',key);
    if(!semantic.has(semId)){
      semantic.set(semId,{type:'node',id:semId,kind:'semantic-id',title:g.ref,metadata:{
        semantic_id:g.ref,status:'observed-reference',domain:'development',content_sha256:sha256(g.ref)}});
    }
    const lines=[...g.lines].sort((a,b)=>a-b);
    nodes.push({type:'node',id:anchorId,kind:'semantic-file-anchor',title:g.ref,metadata:{
      semantic_id:g.ref,source_path:g.file.rootPath,content_sha256:g.file.hash,project:g.file.project,
      annotation_kind:g.tag,status:lines.length===1?'indexed-not-live-checked':'ambiguous',
      occurrence_count:lines.length,first_line:lines[0],anchor_digest:sha256(JSON.stringify([key,g.file.hash,lines])),
      domain:'development'}});
    edges.push({type:'edge',id:graphId('has-semantic-anchor',g.file.id,anchorId),from:g.file.id,to:anchorId,relation:'has-semantic-anchor',weight:1,metadata:{}});
    edges.push({type:'edge',id:graphId('references-semantic-id',anchorId,semId),from:anchorId,to:semId,relation:'references-semantic-id',weight:1,metadata:{}});
    // A direct typed adjacency is a convenience for traversal, never a runtime
    // call/effect assertion. Ambiguous observations remain only on anchor edges.
    if(lines.length===1){
      const relation=Object.freeze({type:'declares-type',capability:'declares-capability',contract:'declares-contract',emits:'annotated-emits',consumes:'annotated-consumes',action:'annotated-action'})[g.tag];
      edges.push({type:'edge',id:graphId(relation,g.file.id,semId),from:g.file.id,to:semId,relation,weight:1,
        metadata:{anchor_id:anchorId,evidence_class:'indexed-annotation-occurrence',content_sha256:g.file.hash,source_line:lines[0]}});
    }
  }
  nodes.push(...[...semantic.values()].sort((a,b)=>a.id.localeCompare(b.id)));
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
    source: SOURCE_NAMESPACE,
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
      const key=node.kind==='source-file'?meta.source_path:(node.kind==='source-symbol'?'@hq-symbol/':'@hq-semantic/')+node.id;
      const digest=meta.anchor_digest??meta.content_sha256;
      entries[key] = { id: node.id, content_sha256: digest };
      if (previous && previous[key]?.content_sha256 === digest) {
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

// ---------------------------------------------------------------------------
// Packaged importer resolution and execution — the product path, without Cargo.
//
// The producer above is pure data; this is the only place that knows how the
// native importer is located and run. Product callers (the refresh pipeline,
// `hq kg sync`, and any Host service that needs the same capability) call
// importGraphExchange in-process; none of them spawn a shell or Cargo.
//
// `HQKG_IMPORT_MODE=cargo` is the development fallback and is only ever used
// when it is selected explicitly. `VIVIM_HQKG_BIN_DIR` is the explicit
// developer override for a locally built binary (the same convention the
// native graph tests use). Neither is consulted implicitly: an un-packaged
// runtime reports `importer_not_packaged` and leaves the exchange state alone.
// ---------------------------------------------------------------------------

export const IMPORTER_BIN = 'hqkg-import';
export const IMPORT_MODE_ENV = 'HQKG_IMPORT_MODE';
export const IMPORTER_BIN_DIR_ENV = 'VIVIM_HQKG_BIN_DIR';
/** Repo-relative directory a source checkout stages native binaries into. */
export const PACKAGED_NATIVE_BIN_DIR = 'src-tauri/resources/runtime/native/bin';
/** Runtime-relative directory a frozen package keeps its native binaries in. */
export const RUNTIME_NATIVE_BIN_DIR = 'native/bin';
const IMPORTER_MAX_BUFFER = 16 * 1024 * 1024;
const IMPORTER_TIMEOUT_MS = 120_000;
// The staged runtime root: this module ships at <runtime>/hq/lib/kg-export.mjs,
// so the frozen package's native/bin sits two levels up. A source checkout
// resolves the same name through PACKAGED_NATIVE_BIN_DIR instead.
const RUNTIME_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function binaryNames(name, platform) {
  return platform === 'win32' ? [`${name}.exe`, name] : [name, `${name}.exe`];
}

function firstExistingFile(dir, names) {
  if (typeof dir !== 'string' || dir.length === 0) return null;
  for (const name of names) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Resolve the native importer without spawning anything.
 *
 * @param {{root: string, env?: object, platform?: string, runtimeRoot?: string}} args
 * @returns {{mode: string, available: boolean, program: string|null,
 *   args: string[], cwd: string|null, source: string, reason: string|null}}
 */
function resolveGraphBinary(name, features, { root, env = process.env, platform = process.platform, runtimeRoot = RUNTIME_ROOT } = {}) {
  if (typeof root !== 'string' || root.length === 0) throw new TypeError('root_required');
  const base = resolve(root);
  const mode = String(env[IMPORT_MODE_ENV] ?? 'packaged').trim().toLowerCase();
  if (mode === 'cargo') {
    // Explicit development selection only. `--manifest-path` makes the call
    // independent of the caller's working directory.
    const crateDir = join(base, 'native', 'hqkg');
    const manifest = join(crateDir, 'Cargo.toml');
    const available = existsSync(manifest);
    return {
      mode: 'cargo', available, program: available ? 'cargo' : null,
      args: available ? ['run', '--quiet', '--manifest-path', manifest, '--features', features, '--bin', name, '--'] : [],
      cwd: crateDir, source: `${IMPORT_MODE_ENV}=cargo`,
      reason: available ? null : 'cargo_manifest_missing',
    };
  }
  if (mode !== 'packaged') {
    return { mode, available: false, program: null, args: [], cwd: null, source: `${IMPORT_MODE_ENV}=${mode}`, reason: `unsupported_import_mode_${mode}` };
  }
  const names = binaryNames(name, platform);
  const overrideDir = env[IMPORTER_BIN_DIR_ENV];
  const override = firstExistingFile(overrideDir, names);
  if (override) {
    return { mode: 'packaged', available: true, program: override, args: [], cwd: null, source: `${IMPORTER_BIN_DIR_ENV}=${overrideDir}`, reason: null };
  }
  // A frozen package first (the product's own layout), then a source checkout
  // that has been staged by tools/packaging/prepare-host-runtime.mjs --stage.
  const candidates = [
    { dir: join(runtimeRoot, ...RUNTIME_NATIVE_BIN_DIR.split('/')), source: `packaged:${RUNTIME_NATIVE_BIN_DIR}` },
    { dir: join(base, ...PACKAGED_NATIVE_BIN_DIR.split('/')), source: `packaged:${PACKAGED_NATIVE_BIN_DIR}` },
  ];
  for (const candidate of candidates) {
    const found = firstExistingFile(candidate.dir, names);
    if (found) {
      return { mode: 'packaged', available: true, program: found, args: [], cwd: null, source: candidate.source, reason: null };
    }
  }
  return {
    mode: 'packaged', available: false, program: null, args: [], cwd: null,
    source: candidates[0].source, reason: 'importer_not_packaged',
  };
}

export function resolveGraphImporter(options = {}) {
  return resolveGraphBinary(IMPORTER_BIN,'importer',options);
}

// Existing native binary discovery, fixed read-only operation and bounded stdio.
export function queryDevelopmentGraph({root,journal,operation,key,depth,program,env=process.env}={}){
  if(!['sources','symbols','impact','program'].includes(operation))throw Error('UNKNOWN_GRAPH_OPERATION');
  const native=resolveGraphBinary('hqkg-development','importer,native-program',{root,env});
  if(!native.available) return {schema:'hqkg.development-query/1',state:'unavailable',reason:native.reason};
  const args=[...native.args,journal,operation,String(key)];
  if(operation==='impact'&&depth!==undefined)args.push(String(depth));
  if(operation==='program'&&(typeof program!=='string'||Buffer.byteLength(program)>65536))throw Error('INVALID_PROGRAM');
  const result=spawnSync(native.program,args,{cwd:native.cwd??undefined,input:operation==='program'?program:undefined,
    encoding:'utf8',windowsHide:true,shell:false,timeout:120000,maxBuffer:2*1024*1024});
  if(result.error||result.status!==0)return {schema:'hqkg.development-query/1',state:'unavailable',
    reason:result.error?'native_graph_spawn_failed':'native_graph_exit_'+result.status,
    detail:String(result.stderr??'').trim().slice(0,1000)};
  try{
    const value=JSON.parse(result.stdout);
    if(value.schema!=='hqkg.development-query/1'||value.authority!=='read-only'||value.operation!==operation||
       !Number.isSafeInteger(value.epoch)||value.epoch<0)throw Error('invalid response');
    return value;
  }catch{return {schema:'hqkg.development-query/1',state:'unavailable',reason:'native_graph_response_invalid'};}
}

function field(text, key) {
  const match = new RegExp(`(?:^|\\s)${key}=([^\\s]+)`).exec(text);
  return match ? match[1] : null;
}

function counter(text, label) {
  const match = new RegExp(`(?:^|\\s)${label}=(\\d+)`).exec(text);
  return match ? Number(match[1]) : null;
}

/** Parse the importer's stdout contract (schema line, stats line, epoch line). */
export function parseImporterOutput(stdout) {
  const lines = String(stdout ?? '').split(/\r?\n/).filter((line) => line.length > 0);
  const head = lines.find((line) => line.startsWith('schema=')) ?? null;
  const statsLine = lines.find((line) => line.startsWith('node inserted=')) ?? null;
  const epochLine = lines.find((line) => line.startsWith('epoch before=')) ?? null;
  return {
    schema: head ? field(head, 'schema') : null,
    // The importer's own report of the source namespace it applied under.
    namespace: head ? (field(head, 'namespace') ?? field(head, 'source')) : null,
    digest: head ? field(head, 'digest') : null,
    epochBefore: epochLine ? counter(epochLine, 'before') : null,
    epochAfter: epochLine ? counter(epochLine, 'after') : null,
    dryRun: epochLine ? field(epochLine, 'dry_run') : null,
    wroteSnapshot: epochLine ? field(epochLine, 'wrote_snapshot') : null,
    statsLine,
    nodesInserted: statsLine ? counter(statsLine, 'inserted') : null,
    nodesDeleted: statsLine ? counter(statsLine, 'deleted') : null,
  };
}

/**
 * Import one exchange with the packaged native importer and report a verified
 * result. Never advances exporter state: the caller commits the delta base with
 * acknowledgeGraphExport only when `ok` is true.
 *
 * @param {{
 *   root: string,
 *   journal: string,
 *   exchange: string,
 *   namespace?: string|null,
 *   env?: object,
 *   platform?: string,
 *   spawn?: Function,
 * }} args
 */
export function importGraphExchange({
  root, journal, exchange, namespace = SOURCE_NAMESPACE, expectedDigest = null,
  env = process.env, platform = process.platform, runtimeRoot = RUNTIME_ROOT, spawn = spawnSync,
} = {}) {
  if (typeof journal !== 'string' || journal.length === 0) throw new TypeError('journal_required');
  if (typeof exchange !== 'string' || exchange.length === 0) throw new TypeError('exchange_required');
  const resolved = resolveGraphImporter({ root, env, platform, runtimeRoot });
  if (!resolved.available) {
    return {
      ok: false, mode: resolved.mode, reason: resolved.reason ?? 'importer_unavailable',
      importer: resolved.source, program: null, status: null,
      epochBefore: null, epochAfter: null, namespace: null, namespaceOk: null,
      digest: null, statsLine: null, stderrTail: null,
    };
  }
  const result = spawn(resolved.program, [...resolved.args, journal, exchange], {
    cwd: resolved.cwd ?? undefined,
    encoding: 'utf8', windowsHide: true, maxBuffer: IMPORTER_MAX_BUFFER, timeout: IMPORTER_TIMEOUT_MS,
  }) ?? {};
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  const parsed = parseImporterOutput(stdout);
  const status = Number.isInteger(result.status) ? result.status : null;
  const spawnError = result.error ? String(result.error.message ?? result.error) : null;
  // A replay with nothing to do legitimately reports no epoch advance; a
  // regression never does. Namespace binding is checked against the importer's
  // own report, so a packaged product cannot apply another producer's exchange.
  const epochOk = parsed.epochAfter != null && (parsed.epochBefore == null || parsed.epochAfter >= parsed.epochBefore);
  const namespaceOk = namespace == null ? null : parsed.namespace === namespace;
  const digestOk=expectedDigest==null||parsed.digest===expectedDigest;
  const ok = !spawnError && status === 0 && epochOk && namespaceOk !== false && digestOk;
  const reason = ok ? null
    : spawnError ? 'importer_spawn_failed'
      : status !== 0 ? `importer_exit_${status}`
        : !epochOk ? 'epoch_regression'
          : !digestOk ? 'exchange_digest_mismatch' : 'namespace_mismatch';
  return {
    ok, mode: resolved.mode, importer: resolved.source, program: resolved.program,
    status, reason, epochBefore: parsed.epochBefore, epochAfter: parsed.epochAfter,
    namespace: parsed.namespace, namespaceOk, digest: parsed.digest,
    statsLine: parsed.statsLine, nodesInserted: parsed.nodesInserted, nodesDeleted: parsed.nodesDeleted,
    wroteSnapshot: parsed.wroteSnapshot === 'true',
    stderrTail: stderr.trim().length > 0 ? stderr.trim().split(/\r?\n/).slice(-3).join('\n') : null,
  };
}
