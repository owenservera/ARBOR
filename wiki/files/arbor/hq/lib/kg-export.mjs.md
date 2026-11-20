# File: hq/lib/kg-export.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/kg-export.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23103 B |
| Lines | 498 |
| Hash | e7251b7ea695 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EXCHANGE_SCHEMA | const | 23 | yes | export const EXCHANGE_SCHEMA = &#39;repos-hq.hqkg-exchange/1&#39;; |
| AUTHORITY | const | 24 | yes | export const AUTHORITY = &#39;data-only; no executable code or provider actions&#39;; |
| SOURCE_NAMESPACE | const | 28 | yes | export const SOURCE_NAMESPACE = &#39;repos-hq.index&#39;; |
| MAX_BYTES | const | 29 | no | const MAX_BYTES = 128 * 1024 * 1024; |
| MAX_NODES | const | 30 | no | const MAX_NODES = 250_000; |
| MAX_EDGES | const | 31 | no | const MAX_EDGES = 1_000_000; |
| MAX_TOMBSTONES | const | 32 | no | const MAX_TOMBSTONES = 250_000; |
| ID_RE | const | 33 | no | const ID_RE = /^hqg1:[a-f0-9]{64}$/; |
| SENSITIVE | const | 34 | no | const SENSITIVE = [&#39;password&#39;, &#39;credential&#39;, &#39;token&#39;, &#39;cookie&#39;, &#39;secret&#39;, &#39;api_key&#39;, &#39;private_key&#39;, &#39;authorization&#39;]; |
| sha256 | function | 36 | no | const sha256 = (text) =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| nodeId | function | 37 | no | const nodeId = (project, path) =&gt; `hqg1:${sha256(`source-file\\u0000${project}\\u0000${path}`)}`; |
| edgeId | function | 38 | no | const edgeId = (from, to) =&gt; `hqg1:${sha256(`imports\\u0000${from}\\u0000${to}`)}`; |
| validId | function | 40 | no | function validId(id) { |
| validMetadata | function | 45 | no | function validMetadata(meta) { |
| keys | const | 47 | no | const keys = Object.keys(meta); |
| total | variable | 49 | no | let total = 0; |
| lower | const | 51 | no | const lower = key.toLowerCase(); |
| value | const | 54 | no | const value = meta[key]; |
| assertAdmissible | function | 63 | no | function assertAdmissible(row) { |
| currentUniverse | function | 83 | no | function currentUniverse(db) { |
| projects | const | 84 | no | const projects = new Map(); |
| files | const | 88 | no | const files = db.prepare( &#39;SELECT f.id, f.project_id, f.path, f.hash FROM files f ORDER BY f.project_id, f.path&#39;, ).all(); |
| nodes | const | 91 | no | const nodes = []; |
| byFileId | const | 92 | no | const byFileId = new Map(); |
| project | const | 94 | no | const project = projects.get(f.project_id); |
| rootPath | const | 99 | no | const rootPath = `${project.name}/${f.path}`.replace(/\\\\/g, &#39;/&#39;); |
| id | const | 101 | no | const id = nodeId(project.name, f.path); |
| edgeRows | const | 118 | no | const edgeRows = db.prepare( `SELECT i.file_id, i.resolved_file_id FROM imports i WHERE i.resolved_file_id IS NOT NULL ORDER BY i.file_id, i.resolved_file_id`, ).all(); |
| seenEdges | const | 122 | no | const seenEdges = new Set(); |
| edges | const | 123 | no | const edges = []; |
| to | const | 126 | no | const to = byFileId.get(row.resolved_file_id); |
| id | const | 128 | no | const id = edgeId(from.id, to.id); |
| readState | function | 137 | no | function readState(statePath) { |
| state | const | 139 | no | const state = JSON.parse(readFileSync(statePath, &#39;utf8&#39;)); |
| exportGraphExchange | function | 161 | yes | export function exportGraphExchange({ db, outPath, statePath = null }) { |
| previous | const | 166 | no | const previous = statePath ? readState(statePath) : null; |
| tombstonedIds | const | 169 | no | const tombstonedIds = []; |
| tombstonedPaths | const | 170 | no | const tombstonedPaths = []; |
| currentIds | const | 172 | no | const currentIds = new Set(nodes.map((n) =&gt; n.id)); |
| entry | const | 174 | no | const entry = previous[key]; |
| tombstones | const | 185 | no | const tombstones = tombstonedIds.map((id) =&gt; ({ type: &#39;tombstone&#39;, id, reason: &#39;deleted&#39; })); |
| rows | const | 186 | no | const rows = [...nodes, ...edges, ...tombstones]; |
| ids | const | 188 | no | const ids = new Set(rows.filter((r) =&gt; r.type !== &#39;edge&#39;).map((r) =&gt; r.id)); |
| body | const | 191 | no | const body = rows.map((row) =&gt; JSON.stringify(row)).join(&#39;\\n&#39;) + &#39;\\n&#39;; |
| bytes | const | 192 | no | const bytes = Buffer.byteLength(body); |
| digest | const | 194 | no | const digest = sha256(body); |
| manifest | const | 195 | no | const manifest = { |
| tmp | const | 213 | no | const tmp = `${outPath}.tmp-${process.pid}`; |
| unchangedNodes | variable | 223 | no | let unchangedNodes = 0; |
| entries | const | 225 | no | const entries = {}; |
| meta | const | 227 | no | const meta = node.metadata; |
| tmpState | const | 234 | no | const tmpState = `${statePath}.pending-${process.pid}`; |
| lastPath | const | 247 | no | const lastPath = statePath ? `${statePath}.last-export` : null; |
| tmpLast | const | 249 | no | const tmpLast = `${lastPath}.tmp-${process.pid}`; |
| acknowledgeGraphExport | function | 286 | yes | export function acknowledgeGraphExport({ statePath, digest, acknowledgment = null }) { |
| pendingPath | const | 289 | no | const pendingPath = `${statePath}.pending`; |
| lastPath | const | 290 | no | const lastPath = `${statePath}.last-export`; |
| pending | const | 294 | no | const pending = JSON.parse(readFileSync(pendingPath, &#39;utf8&#39;)); |
| committed | const | 302 | no | const committed = { |
| tmpState | const | 309 | no | const tmpState = `${statePath}.tmp-${process.pid}`; |
| lastGraphExport | function | 322 | yes | export function lastGraphExport(statePath) { |
| lastPath | const | 323 | no | const lastPath = `${statePath}.last-export`; |
| IMPORTER_BIN | const | 347 | yes | export const IMPORTER_BIN = &#39;hqkg-import&#39;; |
| IMPORT_MODE_ENV | const | 348 | yes | export const IMPORT_MODE_ENV = &#39;HQKG_IMPORT_MODE&#39;; |
| IMPORTER_BIN_DIR_ENV | const | 349 | yes | export const IMPORTER_BIN_DIR_ENV = &#39;VIVIM_HQKG_BIN_DIR&#39;; |
| PACKAGED_NATIVE_BIN_DIR | const | 351 | yes | export const PACKAGED_NATIVE_BIN_DIR = &#39;src-tauri/resources/runtime/native/bin&#39;; |
| IMPORTER_MAX_BUFFER | const | 352 | no | const IMPORTER_MAX_BUFFER = 16 * 1024 * 1024; |
| IMPORTER_TIMEOUT_MS | const | 353 | no | const IMPORTER_TIMEOUT_MS = 120_000; |
| binaryNames | function | 355 | no | function binaryNames(name, platform) { |
| firstExistingFile | function | 359 | no | function firstExistingFile(dir, names) { |
| candidate | const | 362 | no | const candidate = join(dir, name); |
| resolveGraphImporter | function | 375 | yes | export function resolveGraphImporter({ root, env = process.env, platform = process.platform } = {}) { |
| base | const | 377 | no | const base = resolve(root); |
| mode | const | 378 | no | const mode = String(env[IMPORT_MODE_ENV] ?? &#39;packaged&#39;).trim().toLowerCase(); |
| crateDir | const | 382 | no | const crateDir = join(base, &#39;native&#39;, &#39;hqkg&#39;); |
| manifest | const | 383 | no | const manifest = join(crateDir, &#39;Cargo.toml&#39;); |
| available | const | 384 | no | const available = existsSync(manifest); |
| names | const | 395 | no | const names = binaryNames(IMPORTER_BIN, platform); |
| overrideDir | const | 396 | no | const overrideDir = env[IMPORTER_BIN_DIR_ENV]; |
| packagedDir | const | 401 | no | const packagedDir = join(base, ...PACKAGED_NATIVE_BIN_DIR.split(&#39;/&#39;)); |
| packaged | const | 402 | no | const packaged = firstExistingFile(packagedDir, names); |
| field | function | 409 | no | function field(text, key) { |
| counter | function | 414 | no | function counter(text, label) { |
| parseImporterOutput | function | 420 | yes | export function parseImporterOutput(stdout) { |
| lines | const | 421 | no | const lines = String(stdout ?? &#39;&#39;).split(/\\r?\\n/).filter((line) =&gt; line.length &gt; 0); |
| head | const | 422 | no | const head = lines.find((line) =&gt; line.startsWith(&#39;schema=&#39;)) ?? null; |
| statsLine | const | 423 | no | const statsLine = lines.find((line) =&gt; line.startsWith(&#39;node inserted=&#39;)) ?? null; |
| epochLine | const | 424 | no | const epochLine = lines.find((line) =&gt; line.startsWith(&#39;epoch before=&#39;)) ?? null; |
| importGraphExchange | function | 455 | yes | export function importGraphExchange({ root, journal, exchange, namespace = SOURCE_NAMESPACE, env = process.env, platform = process.platform, spawn = spawnSync, } = {}) { |
| resolved | const | 461 | no | const resolved = resolveGraphImporter({ root, env, platform }); |
| result | const | 470 | no | const result = spawn(resolved.program, [...resolved.args, journal, exchange], { cwd: resolved.cwd ?? undefined, encoding: &#39;utf8&#39;, windowsHide: true, maxBuffer: IMPORTER_MAX_BUFFER, timeout: IMPORTER_… |
| stdout | const | 474 | no | const stdout = typeof result.stdout === &#39;string&#39; ? result.stdout : &#39;&#39;; |
| stderr | const | 475 | no | const stderr = typeof result.stderr === &#39;string&#39; ? result.stderr : &#39;&#39;; |
| parsed | const | 476 | no | const parsed = parseImporterOutput(stdout); |
| status | const | 477 | no | const status = Number.isInteger(result.status) ? result.status : null; |
| spawnError | const | 478 | no | const spawnError = result.error ? String(result.error.message ?? result.error) : null; |
| epochOk | const | 482 | no | const epochOk = parsed.epochAfter != null &amp;&amp; (parsed.epochBefore == null \|\| parsed.epochAfter &gt;= parsed.epochBefore); |
| namespaceOk | const | 483 | no | const namespaceOk = namespace == null \|\| parsed.namespace == null ? null : parsed.namespace === namespace; |
| ok | const | 484 | no | const ok = !spawnError &amp;&amp; status === 0 &amp;&amp; epochOk &amp;&amp; namespaceOk !== false; |
| reason | const | 485 | no | const reason = ok ? null |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 18 | external |
| node:child_process | import | 19 | external |
| node:fs | import | 20 | external |
| node:path | import | 21 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kg-export.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./kg-export.mjs |
| [hq/test/kg-export.test.mjs](../test/kg-export.test.mjs.md) | ../lib/kg-export.mjs |
| [hq/test/kg-import-product.test.mjs](../test/kg-import-product.test.mjs.md) | ../lib/kg-export.mjs |
| [hq/test/revision-cache-lifecycle.test.mjs](../test/revision-cache-lifecycle.test.mjs.md) | ../lib/kg-export.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The single HQ -&gt; Rust graph transport: reads the Bun/SQLite index (the |
| 5 | owner | agent-platform-ceo | — | agent-platform-ceo |
| 6 | task | — | — | priority-1 automatic graph ingestion (post-merge convergence campaign) |
| 7 | invariant | — | — | Data-only: never writes the index, never mutates source files, never |
| 11 | invariant | — | — | Node identity is path-stable (project + path), so a content edit |
| 14 | invariant | — | — | Personal data must not enter HQ: file paths and content digests only — |
| 16 | see | — | hq/lib/schema.mjs | hq/lib/schema.mjs · research/rust-knowledge-graph/src/import.rs · |

## Excerpt

```javascript
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
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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
```

_First 80 of 499 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
