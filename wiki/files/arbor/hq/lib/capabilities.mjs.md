# File: hq/lib/capabilities.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/capabilities.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 32356 B |
| Lines | 566 |
| Hash | ee71c68ec7c3 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAPABILITY_REGISTRY_SCHEMA | const | 13 | yes | export const CAPABILITY_REGISTRY_SCHEMA = &#39;hq.capability-registry/1&#39;; |
| MODULE_DIR | const | 15 | no | const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); |
| REGISTRY_DIR | const | 16 | no | const REGISTRY_DIR = join(MODULE_DIR, &#39;..&#39;, &#39;capabilities&#39;, &#39;registry&#39;); |
| SECRET_NAME | const | 18 | no | const SECRET_NAME = [ |
| SECRET_SEGMENT | const | 23 | no | const SECRET_SEGMENT = /(^\|\\/)(\\.git\|\\.ssh\|secrets?\|credentials?)(\\/\|$)/i; |
| LANG | const | 25 | no | const LANG = { |
| DOC_EXT | const | 33 | no | const DOC_EXT = new Set([&#39;.md&#39;, &#39;.markdown&#39;, &#39;.txt&#39;, &#39;.rst&#39;]); |
| CODE_EXT | const | 34 | no | const CODE_EXT = new Set([&#39;.js&#39;, &#39;.mjs&#39;, &#39;.cjs&#39;, &#39;.jsx&#39;, &#39;.ts&#39;, &#39;.mts&#39;, &#39;.cts&#39;, &#39;.tsx&#39;]); |
| DOC_NAME | const | 35 | no | const DOC_NAME = /^(readme\|license\|licence\|changelog\|changes\|contributing\|code_of_conduct\|notice\|authors\|history)(\\..*)?$/i; |
| TOKENS | const | 36 | no | const TOKENS = [&#39;module.exports&#39;, &#39;require(&#39;, &#39;glob&#39;, &#39;micromatch&#39;, &#39;render&#39;, &#39;template&#39;, &#39;task&#39;, &#39;store&#39;, &#39;cache&#39;, &#39;prompt&#39;, &#39;config&#39;, &#39;semver&#39;, &#39;argv&#39;, &#39;resolve&#39;]; const MAX_EVIDENCE = 5000; functi… |
| MAX_EVIDENCE | const | 37 | no | const MAX_EVIDENCE = 5000; |
| isSecretPath | function | 39 | no | function isSecretPath(rel) { |
| name | const | 40 | no | const name = basename(rel); |
| sha256 | function | 44 | no | function sha256(text) { |
| isBinary | function | 48 | no | function isBinary(buffer) { |
| max | const | 49 | no | const max = Math.min(buffer.length, 8192); |
| lineCount | function | 54 | no | function lineCount(buffer) { |
| n | variable | 56 | no | let n = 1; |
| docKind | function | 61 | no | function docKind(rel) { |
| name | const | 62 | no | const name = basename(rel); |
| ext | const | 63 | no | const ext = extname(name).toLowerCase(); |
| fileKind | function | 69 | no | function fileKind(rel) { |
| name | const | 70 | no | const name = basename(rel); |
| ext | const | 71 | no | const ext = extname(name).toLowerCase(); |
| packageNameFromInstallPath | function | 80 | no | function packageNameFromInstallPath(installPath) { |
| marker | const | 81 | no | const marker = &#39;node_modules/&#39;; |
| tail | const | 82 | no | const tail = toPosix(installPath).split(marker).filter(Boolean).pop() \|\| installPath; |
| readJson | function | 86 | no | function readJson(path) { |
| walkPackageFiles | function | 90 | no | function walkPackageFiles(root, installPath, acc) { |
| dir | const | 91 | no | const dir = join(root, installPath); |
| stack | const | 93 | no | const stack = [dir]; |
| current | const | 95 | no | const current = stack.pop(); |
| entries | variable | 96 | no | let entries = []; |
| abs | const | 101 | no | const abs = join(current, entry.name); |
| relInPackage | const | 104 | no | const relInPackage = toPosix(relative(dir, abs)); |
| rel | const | 105 | no | const rel = toPosix(relative(root, abs)); |
| loadTaxonomy | function | 112 | yes | export function loadTaxonomy() { |
| loadContracts | function | 116 | yes | export function loadContracts() { |
| capabilitySchemaSql | function | 120 | yes | export function capabilitySchemaSql() { |
| matchRule | function | 124 | no | function matchRule(pkg, rules) { |
| score | variable | 125 | no | let score = 0; |
| reasons | const | 126 | no | const reasons = []; |
| name | const | 127 | no | const name = pkg.name \|\| &#39;&#39;; |
| desc | const | 128 | no | const desc = pkg.description \|\| &#39;&#39;; |
| keywords | const | 129 | no | const keywords = Array.isArray(pkg.keywords) ? pkg.keywords.join(&#39; &#39;) : String(pkg.keywords \|\| &#39;&#39;); |
| check | function | 130 | no | const check = (list, text, weight, label) =&gt; { |
| re | variable | 132 | no | let re; |
| scanCapabilitySource | function | 143 | yes | export function scanCapabilitySource(rootInput, opts = {}) { |
| root | const | 144 | no | const root = join(rootInput); |
| sourceId | const | 146 | no | const sourceId = String(opts.id \|\| basename(root) \|\| &#39;source&#39;).replace(/[^A-Za-z0-9._-]+/g, &#39;-&#39;); |
| taxonomy | const | 147 | no | const taxonomy = opts.taxonomy \|\| loadTaxonomy(); |
| contractsFile | const | 148 | no | const contractsFile = opts.contracts \|\| loadContracts(); |
| now | const | 149 | no | const now = opts.now \|\| nowISO(); |
| maxFiles | const | 150 | no | const maxFiles = Number(opts.maxFiles \|\| 20000); |
| maxDocBytes | const | 151 | no | const maxDocBytes = Number(opts.maxDocBytes \|\| 512 * 1024); |
| lockPath | const | 152 | no | const lockPath = join(root, &#39;package-lock.json&#39;); |
| lock | const | 153 | no | const lock = existsSync(lockPath) ? readJson(lockPath) : null; |
| entries | const | 155 | no | const entries = []; |
| nm | const | 162 | no | const nm = join(root, &#39;node_modules&#39;); |
| resolved | const | 177 | no | const resolved = new Map(entries.map((e) =&gt; [e.installPath, e])); |
| packages | const | 178 | no | const packages = []; |
| dependencies | const | 179 | no | const dependencies = []; |
| files | const | 180 | no | const files = []; |
| documents | const | 181 | no | const documents = []; |
| evidence | const | 182 | no | const evidence = []; |
| maps | const | 183 | no | const maps = []; |
| seenEvidence | const | 184 | no | const seenEvidence = new Set(); |
| seenFiles | const | 185 | no | const seenFiles = new Set(); |
| totalFiles | variable | 186 | no | let totalFiles = 0; |
| totalBytes | variable | 187 | no | let totalBytes = 0; |
| omittedFiles | variable | 188 | no | let omittedFiles = 0; |
| addEvidence | function | 190 | no | const addEvidence = (record) =&gt; { |
| id | const | 192 | no | const id = sha256(`${sourceId}\|${record.installPath \|\| &#39;&#39;}\|${record.kind}\|${record.signal}\|${record.value \|\| &#39;&#39;}`); |
| dir | const | 199 | no | const dir = join(root, entry.installPath); |
| manifest | const | 200 | no | const manifest = existsSync(join(dir, &#39;package.json&#39;)) ? readJson(join(dir, &#39;package.json&#39;)) : null; |
| name | const | 201 | no | const name = manifest?.name \|\| entry.name; |
| version | const | 202 | no | const version = entry.meta.version \|\| manifest?.version \|\| &#39;0.0.0&#39;; |
| license | const | 203 | no | const license = entry.meta.license \|\| manifest?.license \|\| (Array.isArray(manifest?.licenses) ? manifest.licenses.map((l) =&gt; l.type).filter(Boolean).join(&#39; OR &#39;) : null); |
| bin | const | 204 | no | const bin = manifest?.bin ? canonicalJson(manifest.bin) : null; |
| keywords | const | 205 | no | const keywords = Array.isArray(manifest?.keywords) ? manifest.keywords : []; |
| deps | const | 206 | no | const deps = entry.meta.dependencies \|\| manifest?.dependencies \|\| {}; |
| optional | const | 207 | no | const optional = entry.meta.optionalDependencies \|\| manifest?.optionalDependencies \|\| {}; |
| peer | const | 208 | no | const peer = entry.meta.peerDependencies \|\| manifest?.peerDependencies \|\| {}; |
| nested | const | 211 | no | const nested = `${entry.installPath}/node_modules/${dep}`; |
| nested | const | 215 | no | const nested = `${entry.installPath}/node_modules/${dep}`; |
| collected | const | 222 | no | const collected = walkPackageFiles(root, entry.installPath, []); |
| pkgFiles | variable | 223 | no | let pkgFiles = 0; |
| pkgBytes | variable | 224 | no | let pkgBytes = 0; |
| buffer | variable | 228 | no | let buffer; |
| kind | const | 230 | no | const kind = fileKind(file.rel); |
| binary | const | 231 | no | const binary = isBinary(buffer); |
| hash | const | 232 | no | const hash = createHash(&#39;sha256&#39;).update(buffer).digest(&#39;hex&#39;); |
| rel | const | 233 | no | const rel = file.rel; |
| bodyBuffer | const | 246 | no | const bodyBuffer = buffer.length &gt; maxDocBytes ? buffer.subarray(0, maxDocBytes) : buffer; |
| body | const | 247 | no | const body = bodyBuffer.toString(&#39;utf8&#39;); |
| titleMatch | const | 248 | no | const titleMatch = body.match(/^\\s*#\\s+(.+)$/m); |
| title | const | 249 | no | const title = titleMatch ? titleMatch[1].trim() : basename(rel); |
| pkgEvidence | variable | 260 | no | let pkgEvidence = 0; |
| add | function | 261 | no | const add = (record) =&gt; { if (pkgEvidence &gt;= 8) return; pkgEvidence++; addEvidence(record); }; |
| inspected | variable | 272 | no | let inspected = 0; |
| ext | const | 275 | no | const ext = extname(file.rel).toLowerCase(); |
| buffer | variable | 277 | no | let buffer; |
| text | const | 280 | no | const text = buffer.toString(&#39;utf8&#39;); |
| pkg | const | 288 | no | const pkg = { |
| mapByPackage | const | 307 | no | const mapByPackage = new Map(); |
| key | const | 309 | no | const key = map.installPath; |
| list | const | 310 | no | const list = mapByPackage.get(key) \|\| []; |
| boundedMaps | const | 314 | no | const boundedMaps = [...mapByPackage.values()].flat(); |
| contracts | const | 316 | no | const contracts = []; |
| best | const | 318 | no | const best = boundedMaps.filter((m) =&gt; m.nodeId === c.nodeId).sort((a, b) =&gt; b.score - a.score)[0] \|\| null; |
| digest | const | 327 | no | const digest = digestOf({ root: toPosix(root), lockfile: lock ? &#39;package-lock.json&#39; : null, taxonomyVersion: taxonomy.version \|\| 1, contractsVersion: contractsFile.version \|\| 1, packages: packages.ma… |
| persistCapabilityScan | function | 353 | yes | export function persistCapabilityScan(db, scan) { |
| s | const | 354 | no | const s = scan.source; |
| dropContract | const | 364 | no | const dropContract = db.prepare(&#39;DELETE FROM capability_contract WHERE id = ?&#39;); |
| pkgStmt | const | 374 | no | const pkgStmt = db.prepare(`INSERT INTO capability_package (source_id, name, version, install_path, license, description, main, bin, keywords, dep_count, file_count, bytes, integrity, manifest, manif… |
| depStmt | const | 379 | no | const depStmt = db.prepare(&#39;INSERT INTO capability_dependency (source_id, from_path, to_name, spec, resolved_version, kind) VALUES (?,?,?,?,?,?)&#39;); |
| fileStmt | const | 382 | no | const fileStmt = db.prepare(&#39;INSERT INTO capability_file (source_id, install_path, path, kind, sha256, bytes, lines, lang) VALUES (?,?,?,?,?,?,?,?)&#39;); |
| docStmt | const | 385 | no | const docStmt = db.prepare(`INSERT INTO capability_document (id, source_id, install_path, path, kind, title, body, sha256, bytes, lines, lang, authority, observed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,… |
| docFts | const | 388 | no | const docFts = db.prepare(&#39;INSERT INTO capability_document_fts (source_id, install_path, path, kind, title, body) VALUES (?,?,?,?,?,?)&#39;); |
| pkgFts | const | 394 | no | const pkgFts = db.prepare(&#39;INSERT INTO capability_package_fts (source_id, install_path, name, description, keywords, manifest) VALUES (?,?,?,?,?,?)&#39;); |
| evStmt | const | 397 | no | const evStmt = db.prepare(`INSERT INTO capability_evidence (id, source_id, install_path, kind, signal, value, path, line, weight, authority, observed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`); |
| nodeStmt | const | 402 | no | const nodeStmt = db.prepare(`INSERT OR IGNORE INTO capability_node (id, domain, name, description, parent_id, status, authority) VALUES (?,?,?,?,?,?,?)`); |
| domain | const | 404 | no | const domain = n.domain \|\| String(n.id).split(&#39;.&#39;)[0]; |
| parent | const | 405 | no | const parent = String(n.id).includes(&#39;.&#39;) ? String(n.id).split(&#39;.&#39;)[0] : null; |
| mapStmt | const | 409 | no | const mapStmt = db.prepare(&#39;INSERT INTO capability_map (source_id, install_path, node_id, score, reasons, status, authority) VALUES (?,?,?,?,?,?,?)&#39;); |
| cStmt | const | 412 | no | const cStmt = db.prepare(`INSERT INTO capability_contract (id, version, node_id, source_id, install_path, title, description, effects, scopes, verification, status, authority, owner_confirmed, propos… |
| capabilityStatus | function | 425 | yes | export function capabilityStatus(db) { |
| row | const | 426 | no | const row = db.prepare(&#39;SELECT COUNT(*) AS sources, COALESCE(SUM(package_count),0) AS packages, COALESCE(SUM(file_count),0) AS files, COALESCE(SUM(document_count),0) AS documents, COALESCE(SUM(bytes)… |
| counts | const | 427 | no | const counts = { |
| listCapabilitySources | function | 442 | yes | export function listCapabilitySources(db) { |
| listCapabilityPackages | function | 446 | yes | export function listCapabilityPackages(db, { query = null, limit = 100 } = {}) { |
| n | const | 447 | no | const n = Math.max(1, Math.min(Number(limit) \|\| 100, 1000)); |
| q | const | 449 | no | const q = String(query).toLowerCase(); |
| getCapabilityPackage | function | 456 | yes | export function getCapabilityPackage(db, { sourceId = null, name }) { |
| sql | const | 458 | no | const sql = sourceId |
| listCapabilityNodes | function | 464 | yes | export function listCapabilityNodes(db, { domain = null } = {}) { |
| listCapabilityMaps | function | 470 | yes | export function listCapabilityMaps(db, { nodeId = null, limit = 100 } = {}) { |
| n | const | 471 | no | const n = Math.max(1, Math.min(Number(limit) \|\| 100, 2000)); |
| sql | const | 472 | no | const sql = `SELECT m.source_id AS sourceId, m.install_path AS installPath, p.name, p.version, p.license, m.node_id AS nodeId, m.score, m.reasons, m.status, m.authority |
| listCapabilityContracts | function | 478 | yes | export function listCapabilityContracts(db, { status = null } = {}) { |
| sql | const | 479 | no | const sql = status |
| getCapabilityContract | function | 487 | yes | export function getCapabilityContract(db, { id, version = null }) { |
| row | const | 488 | no | const row = version |
| searchCapabilityDocuments | function | 494 | yes | export function searchCapabilityDocuments(db, { query = &#39;&#39;, limit = 20 } = {}) { |
| q | const | 495 | no | const q = String(query \|\| &#39;&#39;).trim(); |
| terms | const | 497 | no | const terms = q.split(/\\s+/).map((t) =&gt; `&quot;${t.replace(/&quot;/g, &#39;&#39;)}&quot;*`).join(&#39; &#39;); |
| n | const | 498 | no | const n = Math.max(1, Math.min(Number(limit) \|\| 20, 200)); |
| exportCapabilityJson | function | 509 | yes | export function exportCapabilityJson(db, { sourceId = null } = {}) { |
| args | const | 511 | no | const args = sourceId ? [sourceId] : []; |
| EXPORT_TABLES | const | 526 | no | const EXPORT_TABLES = [&#39;capability_source&#39;, &#39;capability_package&#39;, &#39;capability_dependency&#39;, &#39;capability_file&#39;, &#39;capability_document&#39;, &#39;capability_evidence&#39;, &#39;capability_node&#39;, &#39;capability_map&#39;, &#39;capab… |
| exportCapabilitySqlite | function | 528 | yes | export function exportCapabilitySqlite(db, { path, sourceId = null } = {}) { |
| target | const | 530 | no | const target = new DatabaseSync(path); |
| docs | const | 536 | no | const docs = sourceId ? db.prepare(&#39;SELECT * FROM capability_document WHERE source_id = ?&#39;).all(sourceId) : db.prepare(&#39;SELECT * FROM capability_document&#39;).all(); |
| pkgs | const | 537 | no | const pkgs = sourceId ? db.prepare(&#39;SELECT * FROM capability_package WHERE source_id = ?&#39;).all(sourceId) : db.prepare(&#39;SELECT * FROM capability_package&#39;).all(); |
| scoped | const | 541 | no | const scoped = sourceId &amp;&amp; table !== &#39;capability_node&#39;; |
| rows | const | 543 | no | const rows = scoped |
| cols | const | 547 | no | const cols = Object.keys(rows[0]); |
| stmt | const | 548 | no | const stmt = target.prepare(`INSERT INTO ${table} (${cols.join(&#39;,&#39;)}) VALUES (${cols.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;)})`); |
| docFts | const | 551 | no | const docFts = target.prepare(&#39;INSERT INTO capability_document_fts (source_id, install_path, path, kind, title, body) VALUES (?,?,?,?,?,?)&#39;); |
| pkgFts | const | 553 | no | const pkgFts = target.prepare(&#39;INSERT INTO capability_package_fts (source_id, install_path, name, description, keywords, manifest) VALUES (?,?,?,?,?,?)&#39;); |
| writeCapabilitySchema | function | 563 | yes | export function writeCapabilitySchema(path) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| node:sqlite | import | 7 | external |
| node:url | import | 8 | external |
| ./util.mjs | import | 9 | [hq/lib/util.mjs](./util.mjs.md) |
| ./schema.mjs | import | 10 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./capability-schema.mjs | import | 11 | [hq/lib/capability-schema.mjs](./capability-schema.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs](../aii/fixtures/HQ-113-harvestable-assets-identification.mjs.md) | ../../lib/capabilities.mjs |
| [hq/aii/fixtures/HQ-115-domain-query-ranking.mjs](../aii/fixtures/HQ-115-domain-query-ranking.mjs.md) | ../../lib/capabilities.mjs |
| [hq/aii/fixtures/HQ-116-harvest-ready-components.mjs](../aii/fixtures/HQ-116-harvest-ready-components.mjs.md) | ../../lib/capabilities.mjs |
| [hq/aii/fixtures/HQ-117-harvesting-plan.mjs](../aii/fixtures/HQ-117-harvesting-plan.mjs.md) | ../../lib/capabilities.mjs |
| [hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs](../aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs.md) | ../../lib/capabilities.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/capabilities.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./capabilities.mjs |
| [hq/test/capability-surfaces.test.mjs](../test/capability-surfaces.test.mjs.md) | ../lib/capabilities.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/capabilities.mjs — deterministic capability inventory for a dependency tree.
// Static only: this module reads manifests, lockfiles and text files. It never
// imports, requires, installs, spawns or executes a scanned package.
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, basename, extname, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { canonicalJson, digestOf, toPosix, nowISO } from './util.mjs';
import { transaction } from './schema.mjs';
import { CAPABILITY_DDL } from './capability-schema.mjs';

export const CAPABILITY_REGISTRY_SCHEMA = 'hq.capability-registry/1';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = join(MODULE_DIR, '..', 'capabilities', 'registry');

const SECRET_NAME = [
  /^\.env(\..*)?$/i, /\.pem$/i, /\.key$/i, /\.keystore$/i, /^session\.json$/i,
  /^storage-state\.json$/i, /^release-profile\.json$/i, /^cookies$/i, /^login data$/i,
  /^\.npmrc$/i, /^\.netrc$/i, /^id_rsa$/i, /^id_ed25519$/i,
];
const SECRET_SEGMENT = /(^|\/)(\.git|\.ssh|secrets?|credentials?)(\/|$)/i;

const LANG = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.jsx': 'javascript',
  '.ts': 'typescript', '.mts': 'typescript', '.cts': 'typescript', '.tsx': 'typescript',
  '.json': 'json', '.md': 'markdown', '.markdown': 'markdown', '.txt': 'text', '.rst': 'text',
  '.yml': 'yaml', '.yaml': 'yaml', '.css': 'css', '.html': 'html', '.sh': 'shell',
  '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust', '.c': 'c', '.h': 'c',
  '.cpp': 'cpp', '.cc': 'cpp', '.java': 'java', '.php': 'php', '.sql': 'sql',
};
const DOC_EXT = new Set(['.md', '.markdown', '.txt', '.rst']);
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx']);
const DOC_NAME = /^(readme|license|licence|changelog|changes|contributing|code_of_conduct|notice|authors|history)(\..*)?$/i;
const TOKENS = ['module.exports', 'require(', 'glob', 'micromatch', 'render', 'template', 'task', 'store', 'cache', 'prompt', 'config', 'semver', 'argv', 'resolve'];
const MAX_EVIDENCE = 5000;

function isSecretPath(rel) {
  const name = basename(rel);
  return SECRET_NAME.some((re) => re.test(name)) || SECRET_SEGMENT.test(toPosix(rel));
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function isBinary(buffer) {
  const max = Math.min(buffer.length, 8192);
  for (let i = 0; i < max; i++) if (buffer[i] === 0) return true;
  return false;
}

function lineCount(buffer) {
  if (!buffer.length) return 0;
  let n = 1;
  for (let i = 0; i < buffer.length; i++) if (buffer[i] === 0x0a) n++;
  return n;
}

function docKind(rel) {
  const name = basename(rel);
  const ext = extname(name).toLowerCase();
  if (DOC_NAME.test(name)) return 'doc';
  if (DOC_EXT.has(ext)) return 'doc';
  return null;
}

function fileKind(rel) {
  const name = basename(rel);
  const ext = extname(name).toLowerCase();
  if (name === 'package.json') return 'manifest';
  if (/^licen[cs]e/i.test(name)) return 'license';
  if (docKind(rel)) return 'doc';
  if (/(^|\/)(test|tests|spec|__tests__)(\/|$)/i.test(toPosix(rel)) || /\.(test|spec)\.[^.]+$/i.test(name)) return 'test';
  if (CODE_EXT.has(ext)) return 'code';
  return 'asset';
}

function packageNameFromInstallPath(installPath) {
```

_First 80 of 567 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
