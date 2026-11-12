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
  const marker = 'node_modules/';
  const tail = toPosix(installPath).split(marker).filter(Boolean).pop() || installPath;
  return tail;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function walkPackageFiles(root, installPath, acc) {
  const dir = join(root, installPath);
  if (!existsSync(dir)) return acc;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try { entries = readdirSync(current, { withFileTypes: true }); } catch { continue; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === 'node_modules') continue;
      const abs = join(current, entry.name);
      if (entry.isDirectory()) { stack.push(abs); continue; }
      if (!entry.isFile()) continue;
      const relInPackage = toPosix(relative(dir, abs));
      const rel = toPosix(relative(root, abs));
      acc.push({ rel, relInPackage, abs });
    }
  }
  return acc;
}

export function loadTaxonomy() {
  return JSON.parse(readFileSync(join(REGISTRY_DIR, 'taxonomy.v1.json'), 'utf8'));
}

export function loadContracts() {
  return JSON.parse(readFileSync(join(REGISTRY_DIR, 'contracts.v1.json'), 'utf8'));
}

export function capabilitySchemaSql() {
  return CAPABILITY_DDL;
}

function matchRule(pkg, rules) {
  let score = 0;
  const reasons = [];
  const name = pkg.name || '';
  const desc = pkg.description || '';
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords.join(' ') : String(pkg.keywords || '');
  const check = (list, text, weight, label) => {
    for (const raw of list || []) {
      let re;
      try { re = new RegExp(raw, 'i'); } catch { continue; }
      if (re.test(text)) { score += weight; reasons.push(`${label}:${raw}`); break; }
    }
  };
  check(rules.name, name, 3, 'name');
  check(rules.keywords, keywords, 2.5, 'keyword');
  check(rules.description, desc, 1.5, 'description');
  return { score, reasons };
}

export function scanCapabilitySource(rootInput, opts = {}) {
  const root = join(rootInput);
  if (!existsSync(root)) throw new Error(`capability root not found: ${rootInput}`);
  const sourceId = String(opts.id || basename(root) || 'source').replace(/[^A-Za-z0-9._-]+/g, '-');
  const taxonomy = opts.taxonomy || loadTaxonomy();
  const contractsFile = opts.contracts || loadContracts();
  const now = opts.now || nowISO();
  const maxFiles = Number(opts.maxFiles || 20000);
  const maxDocBytes = Number(opts.maxDocBytes || 512 * 1024);
  const lockPath = join(root, 'package-lock.json');
  const lock = existsSync(lockPath) ? readJson(lockPath) : null;

  const entries = [];
  if (lock && lock.packages) {
    for (const [key, meta] of Object.entries(lock.packages)) {
      if (!key.startsWith('node_modules/')) continue;
      entries.push({ installPath: key, meta: meta || {}, name: packageNameFromInstallPath(key) });
    }
  } else {
    const nm = join(root, 'node_modules');
    if (!existsSync(nm)) throw new Error(`no package-lock.json and no node_modules under ${rootInput}`);
    for (const entry of readdirSync(nm, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (entry.name.startsWith('@')) {
        for (const sub of readdirSync(join(nm, entry.name), { withFileTypes: true })) {
          if (sub.isDirectory()) entries.push({ installPath: `node_modules/${entry.name}/${sub.name}`, meta: {}, name: `${entry.name}/${sub.name}` });
        }
      } else {
        entries.push({ installPath: `node_modules/${entry.name}`, meta: {}, name: entry.name });
      }
    }
  }
  entries.sort((a, b) => a.installPath.localeCompare(b.installPath));

  const resolved = new Map(entries.map((e) => [e.installPath, e]));
  const packages = [];
  const dependencies = [];
  const files = [];
  const documents = [];
  const evidence = [];
  const maps = [];
  const seenEvidence = new Set();
  const seenFiles = new Set();
  let totalFiles = 0;
  let totalBytes = 0;
  let omittedFiles = 0;

  const addEvidence = (record) => {
    if (evidence.length >= MAX_EVIDENCE) return;
    const id = sha256(`${sourceId}|${record.installPath || ''}|${record.kind}|${record.signal}|${record.value || ''}`);
    if (seenEvidence.has(id)) return;
    seenEvidence.add(id);
    evidence.push({ id, sourceId, installPath: record.installPath || null, kind: record.kind, signal: record.signal, value: record.value || null, path: record.path || null, line: record.line || null, weight: record.weight || 1, authority: 'candidate', observedAt: now });
  };

  for (const entry of entries) {
    const dir = join(root, entry.installPath);
    const manifest = existsSync(join(dir, 'package.json')) ? readJson(join(dir, 'package.json')) : null;
    const name = manifest?.name || entry.name;
    const version = entry.meta.version || manifest?.version || '0.0.0';
    const license = entry.meta.license || manifest?.license || (Array.isArray(manifest?.licenses) ? manifest.licenses.map((l) => l.type).filter(Boolean).join(' OR ') : null);
    const bin = manifest?.bin ? canonicalJson(manifest.bin) : null;
    const keywords = Array.isArray(manifest?.keywords) ? manifest.keywords : [];
    const deps = entry.meta.dependencies || manifest?.dependencies || {};
    const optional = entry.meta.optionalDependencies || manifest?.optionalDependencies || {};
    const peer = entry.meta.peerDependencies || manifest?.peerDependencies || {};

    for (const [dep, spec] of Object.entries(deps)) {
      const nested = `${entry.installPath}/node_modules/${dep}`;
      dependencies.push({ sourceId, fromPath: entry.installPath, toName: dep, spec: String(spec), resolvedVersion: (resolved.get(nested) || resolved.get(`node_modules/${dep}`))?.meta?.version || null, kind: 'runtime' });
    }
    for (const [dep, spec] of Object.entries(optional)) {
      const nested = `${entry.installPath}/node_modules/${dep}`;
      dependencies.push({ sourceId, fromPath: entry.installPath, toName: dep, spec: String(spec), resolvedVersion: (resolved.get(nested) || resolved.get(`node_modules/${dep}`))?.meta?.version || null, kind: 'optional' });
    }
    for (const [dep, spec] of Object.entries(peer)) {
      dependencies.push({ sourceId, fromPath: entry.installPath, toName: dep, spec: String(spec), resolvedVersion: null, kind: 'peer' });
    }

    const collected = walkPackageFiles(root, entry.installPath, []);
    let pkgFiles = 0;
    let pkgBytes = 0;
    for (const file of collected) {
      if (isSecretPath(file.rel)) continue;
      if (totalFiles >= maxFiles) { omittedFiles++; continue; }
      let buffer;
      try { buffer = readFileSync(file.abs); } catch { continue; }
      const kind = fileKind(file.rel);
      const binary = isBinary(buffer);
      const hash = createHash('sha256').update(buffer).digest('hex');
      const rel = file.rel;
      if (!seenFiles.has(rel)) {
        seenFiles.add(rel);
        files.push({
          sourceId, installPath: entry.installPath, path: rel, kind, sha256: hash, bytes: buffer.length,
          lines: binary ? null : lineCount(buffer), lang: LANG[extname(rel).toLowerCase()] || 'other',
        });
        totalFiles++;
        pkgFiles++;
        pkgBytes += buffer.length;
        totalBytes += buffer.length;
      }
      if (kind === 'doc' && !binary) {
        const bodyBuffer = buffer.length > maxDocBytes ? buffer.subarray(0, maxDocBytes) : buffer;
        const body = bodyBuffer.toString('utf8');
        const titleMatch = body.match(/^\s*#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : basename(rel);
        documents.push({
          id: sha256(`${sourceId}|${rel}`), sourceId, installPath: entry.installPath, path: rel,
          kind: docKind(rel) === 'doc' ? (basename(rel).toLowerCase().startsWith('license') || basename(rel).toLowerCase().startsWith('licence') ? 'license' : /changelog|changes/i.test(basename(rel)) ? 'changelog' : 'docs') : 'docs',
          title, body, sha256: hash, bytes: buffer.length, lines: lineCount(buffer),
          lang: LANG[extname(rel).toLowerCase()] || 'text', authority: 'candidate', observedAt: now,
        });
      }
    }

    if (manifest) {
      let pkgEvidence = 0;
      const add = (record) => { if (pkgEvidence >= 8) return; pkgEvidence++; addEvidence(record); };
      add({ installPath: entry.installPath, kind: 'manifest', signal: 'description', value: (manifest.description || '').slice(0, 240), weight: 1 });
      if (manifest.main) add({ installPath: entry.installPath, kind: 'manifest', signal: 'main', value: String(manifest.main), weight: 1 });
      if (manifest.bin) add({ installPath: entry.installPath, kind: 'manifest', signal: 'bin', value: Object.keys(manifest.bin).join(','), weight: 1.5 });
      if (keywords.length) add({ installPath: entry.installPath, kind: 'manifest', signal: 'keywords', value: keywords.join(','), weight: 1.5 });
      add({ installPath: entry.installPath, kind: 'manifest', signal: 'field_count', value: String(Object.keys(manifest).length), weight: 0.5 });
      for (const file of collected.slice(0, 40)) {
        if (entry.installPath && file.relInPackage && /(^|\/)(cli|bin|index|lib)(\.|\/|$)/i.test(file.relInPackage)) {
          add({ installPath: entry.installPath, kind: 'file_pattern', signal: 'entry', value: file.relInPackage, path: file.rel, weight: 1 });
        }
      }
      let inspected = 0;
      for (const file of collected) {
        if (inspected >= 40) break;
        const ext = extname(file.rel).toLowerCase();
        if (!CODE_EXT.has(ext)) continue;
        let buffer;
        try { buffer = readFileSync(file.abs); } catch { continue; }
        if (buffer.length > 200 * 1024) continue;
        const text = buffer.toString('utf8');
        inspected++;
        for (const token of TOKENS) {
          if (text.includes(token)) add({ installPath: entry.installPath, kind: 'source_token', signal: token, path: file.rel, weight: 1 });
        }
      }
    }

    const pkg = {
      sourceId, name, version, installPath: entry.installPath, license,
      description: manifest?.description || null, main: manifest?.main ? String(manifest.main) : null,
      bin, keywords: keywords.length ? canonicalJson(keywords) : null, depCount: Object.keys(deps).length,
      fileCount: pkgFiles, bytes: pkgBytes, integrity: entry.meta.integrity || null,
      manifest: manifest ? canonicalJson(manifest) : null,
      manifestDigest: manifest ? digestOf(manifest) : null,
      manifestFields: manifest ? Object.keys(manifest).length : 0,
      lockEntry: canonicalJson(entry.meta),
      status: 'candidate', authority: 'candidate',
    };
    packages.push(pkg);

    for (const node of taxonomy.nodes || []) {
      const { score, reasons } = matchRule(pkg, node.rules || {});
      if (score >= 2.5) maps.push({ sourceId, installPath: entry.installPath, nodeId: node.id, score: Number(score.toFixed(3)), reasons, status: 'candidate', authority: 'candidate' });
    }
  }

  const mapByPackage = new Map();
  for (const map of maps.sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId))) {
    const key = map.installPath;
    const list = mapByPackage.get(key) || [];
    if (list.length < 5) list.push(map);
    mapByPackage.set(key, list);
  }
  const boundedMaps = [...mapByPackage.values()].flat();

  const contracts = [];
  for (const c of contractsFile.contracts || []) {
    const best = boundedMaps.filter((m) => m.nodeId === c.nodeId).sort((a, b) => b.score - a.score)[0] || null;
    contracts.push({
      id: c.id, version: c.version || 1, nodeId: c.nodeId, sourceId: best ? sourceId : null,
      installPath: best ? best.installPath : null, title: c.title, description: c.description || null,
      effects: canonicalJson(c.effects || []), scopes: canonicalJson(c.scopes || []), verification: c.verification || null,
      status: 'proposed', authority: 'candidate', ownerConfirmed: 0, proposedAt: now, receipt: null,
    });
  }

  const digest = digestOf({
    root: toPosix(root), lockfile: lock ? 'package-lock.json' : null,
    taxonomyVersion: taxonomy.version || 1, contractsVersion: contractsFile.version || 1,
    packages: packages.map((p) => ({ install_path: p.installPath, manifest_digest: p.manifestDigest })).sort((a, b) => a.install_path.localeCompare(b.install_path)),
    files: files.map((f) => ({ path: f.path, sha256: f.sha256 })).sort((a, b) => a.path.localeCompare(b.path)),
    documents: documents.map((d) => ({ path: d.path, sha256: d.sha256 })).sort((a, b) => a.path.localeCompare(b.path)),
  });

  return {
    source: {
      id: sourceId, project: opts.project || null, root: toPosix(root), packageManager: lock ? 'npm' : 'unknown',
      lockfile: lock ? 'package-lock.json' : null, packageCount: packages.length, fileCount: files.length,
      documentCount: documents.length, bytes: totalBytes, digest, status: 'candidate', authority: 'candidate', scannedAt: now,
    },
    packages: packages.sort((a, b) => a.installPath.localeCompare(b.installPath)),
    dependencies: dependencies.sort((a, b) => a.fromPath.localeCompare(b.fromPath) || a.toName.localeCompare(b.toName) || a.kind.localeCompare(b.kind)),
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    documents: documents.sort((a, b) => a.path.localeCompare(b.path)),
    evidence: evidence.sort((a, b) => a.id.localeCompare(b.id)),
    maps: boundedMaps.sort((a, b) => a.installPath.localeCompare(b.installPath) || a.nodeId.localeCompare(b.nodeId)),
    contracts,
    taxonomy: taxonomy.nodes || [],
    stats: { omittedFiles, truncatedDocuments: documents.filter((d) => d.bytes > maxDocBytes).length },
  };
}

export function persistCapabilityScan(db, scan) {
  const s = scan.source;
  return transaction(db, () => {
    for (const table of ['capability_contract', 'capability_map', 'capability_evidence', 'capability_document', 'capability_file', 'capability_dependency', 'capability_package', 'capability_source']) {
      db.prepare(`DELETE FROM ${table} WHERE ${table === 'capability_source' ? 'id' : 'source_id'} = ?`).run(s.id);
    }
    db.prepare('DELETE FROM capability_document_fts WHERE source_id = ?').run(s.id);
    db.prepare('DELETE FROM capability_package_fts WHERE source_id = ?').run(s.id);
    // Contracts are keyed by the global registry id and many carry a null
    // source_id (no mapping), so a source-scoped delete alone leaves them
    // behind and the re-insert collides on (id, version).
    const dropContract = db.prepare('DELETE FROM capability_contract WHERE id = ?');
    for (const c of scan.contracts) dropContract.run(c.id);

    db.prepare(`INSERT INTO capability_source
      (id, project, root, package_manager, lockfile, package_count, file_count, document_count, bytes, digest, status, authority, scanned_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      s.id, s.project, s.root, s.packageManager, s.lockfile, s.packageCount, s.fileCount,
      s.documentCount, s.bytes, s.digest, s.status, s.authority, s.scannedAt,
    );

    const pkgStmt = db.prepare(`INSERT INTO capability_package
      (source_id, name, version, install_path, license, description, main, bin, keywords, dep_count, file_count, bytes, integrity, manifest, manifest_digest, manifest_fields, lock_entry, status, authority)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const p of scan.packages) pkgStmt.run(p.sourceId, p.name, p.version, p.installPath, p.license, p.description, p.main, p.bin, p.keywords, p.depCount, p.fileCount, p.bytes, p.integrity, p.manifest, p.manifestDigest, p.manifestFields, p.lockEntry, p.status, p.authority);

    const depStmt = db.prepare('INSERT INTO capability_dependency (source_id, from_path, to_name, spec, resolved_version, kind) VALUES (?,?,?,?,?,?)');
    for (const d of scan.dependencies) depStmt.run(d.sourceId, d.fromPath, d.toName, d.spec, d.resolvedVersion, d.kind);

    const fileStmt = db.prepare('INSERT INTO capability_file (source_id, install_path, path, kind, sha256, bytes, lines, lang) VALUES (?,?,?,?,?,?,?,?)');
    for (const f of scan.files) fileStmt.run(f.sourceId, f.installPath, f.path, f.kind, f.sha256, f.bytes, f.lines, f.lang);

    const docStmt = db.prepare(`INSERT INTO capability_document
      (id, source_id, install_path, path, kind, title, body, sha256, bytes, lines, lang, authority, observed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const docFts = db.prepare('INSERT INTO capability_document_fts (source_id, install_path, path, kind, title, body) VALUES (?,?,?,?,?,?)');
    for (const d of scan.documents) {
      docStmt.run(d.id, d.sourceId, d.installPath, d.path, d.kind, d.title, d.body, d.sha256, d.bytes, d.lines, d.lang, d.authority, d.observedAt);
      docFts.run(d.sourceId, d.installPath, d.path, d.kind, d.title, d.body);
    }

    const pkgFts = db.prepare('INSERT INTO capability_package_fts (source_id, install_path, name, description, keywords, manifest) VALUES (?,?,?,?,?,?)');
    for (const p of scan.packages) pkgFts.run(p.sourceId, p.installPath, p.name, p.description || '', p.keywords || '', p.manifest || '');

    const evStmt = db.prepare(`INSERT INTO capability_evidence
      (id, source_id, install_path, kind, signal, value, path, line, weight, authority, observed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    for (const e of scan.evidence) evStmt.run(e.id, e.sourceId, e.installPath, e.kind, e.signal, e.value, e.path, e.line, e.weight, e.authority, e.observedAt);

    const nodeStmt = db.prepare(`INSERT OR IGNORE INTO capability_node (id, domain, name, description, parent_id, status, authority) VALUES (?,?,?,?,?,?,?)`);
    for (const n of scan.taxonomy) {
      const domain = n.domain || String(n.id).split('.')[0];
      const parent = String(n.id).includes('.') ? String(n.id).split('.')[0] : null;
      nodeStmt.run(n.id, domain, n.name, n.description || null, n.parentId || parent, 'current', 'project_observed');
    }

    const mapStmt = db.prepare('INSERT INTO capability_map (source_id, install_path, node_id, score, reasons, status, authority) VALUES (?,?,?,?,?,?,?)');
    for (const m of scan.maps) mapStmt.run(m.sourceId, m.installPath, m.nodeId, m.score, canonicalJson(m.reasons), m.status, m.authority);

    const cStmt = db.prepare(`INSERT INTO capability_contract
      (id, version, node_id, source_id, install_path, title, description, effects, scopes, verification, status, authority, owner_confirmed, proposed_at, receipt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const c of scan.contracts) cStmt.run(c.id, c.version, c.nodeId, c.sourceId, c.installPath, c.title, c.description, c.effects, c.scopes, c.verification, c.status, c.authority, c.ownerConfirmed, c.proposedAt, c.receipt);

    return {
      sourceId: s.id, packages: scan.packages.length, dependencies: scan.dependencies.length,
      files: scan.files.length, documents: scan.documents.length, evidence: scan.evidence.length,
      maps: scan.maps.length, contracts: scan.contracts.length, digest: s.digest,
    };
  });
}

export function capabilityStatus(db) {
  const row = db.prepare('SELECT COUNT(*) AS sources, COALESCE(SUM(package_count),0) AS packages, COALESCE(SUM(file_count),0) AS files, COALESCE(SUM(document_count),0) AS documents, COALESCE(SUM(bytes),0) AS bytes FROM capability_source').get();
  const counts = {
    packages: db.prepare('SELECT COUNT(*) AS n FROM capability_package').get().n,
    dependencies: db.prepare('SELECT COUNT(*) AS n FROM capability_dependency').get().n,
    files: db.prepare('SELECT COUNT(*) AS n FROM capability_file').get().n,
    documents: db.prepare('SELECT COUNT(*) AS n FROM capability_document').get().n,
    evidence: db.prepare('SELECT COUNT(*) AS n FROM capability_evidence').get().n,
    nodes: db.prepare('SELECT COUNT(*) AS n FROM capability_node').get().n,
    maps: db.prepare('SELECT COUNT(*) AS n FROM capability_map').get().n,
    contracts: db.prepare('SELECT COUNT(*) AS n FROM capability_contract').get().n,
    proposed: db.prepare("SELECT COUNT(*) AS n FROM capability_contract WHERE status = 'proposed'").get().n,
    approved: db.prepare('SELECT COUNT(*) AS n FROM capability_contract WHERE owner_confirmed = 1').get().n,
  };
  return { schema: CAPABILITY_REGISTRY_SCHEMA, sources: row.sources, sourcePackages: row.packages, sourceFiles: row.files, sourceDocuments: row.documents, bytes: row.bytes, counts };
}

export function listCapabilitySources(db) {
  return db.prepare('SELECT id, project, root, package_count AS packageCount, file_count AS fileCount, document_count AS documentCount, bytes, digest, status, authority, scanned_at AS scannedAt FROM capability_source ORDER BY id').all();
}

export function listCapabilityPackages(db, { query = null, limit = 100 } = {}) {
  const n = Math.max(1, Math.min(Number(limit) || 100, 1000));
  if (query) {
    const q = String(query).toLowerCase();
    return db.prepare(`SELECT source_id AS sourceId, name, version, install_path AS installPath, license, description, file_count AS fileCount, bytes
      FROM capability_package WHERE lower(name) LIKE ? OR lower(description) LIKE ? ORDER BY name LIMIT ?`).all(`%${q}%`, `%${q}%`, n);
  }
  return db.prepare('SELECT source_id AS sourceId, name, version, install_path AS installPath, license, description, file_count AS fileCount, bytes FROM capability_package ORDER BY name LIMIT ?').all(n);
}

export function getCapabilityPackage(db, { sourceId = null, name }) {
  if (!name) return null;
  const sql = sourceId
    ? 'SELECT * FROM capability_package WHERE source_id = ? AND name = ? ORDER BY install_path LIMIT 1'
    : 'SELECT * FROM capability_package WHERE name = ? ORDER BY source_id, install_path LIMIT 1';
  return sourceId ? db.prepare(sql).get(sourceId, name) : db.prepare(sql).get(name);
}

export function listCapabilityNodes(db, { domain = null } = {}) {
  return domain
    ? db.prepare('SELECT id, domain, name, description, parent_id AS parentId, status, authority FROM capability_node WHERE domain = ? ORDER BY id').all(domain)
    : db.prepare('SELECT id, domain, name, description, parent_id AS parentId, status, authority FROM capability_node ORDER BY domain, id').all();
}

export function listCapabilityMaps(db, { nodeId = null, limit = 100 } = {}) {
  const n = Math.max(1, Math.min(Number(limit) || 100, 2000));
  const sql = `SELECT m.source_id AS sourceId, m.install_path AS installPath, p.name, p.version, p.license, m.node_id AS nodeId, m.score, m.reasons, m.status, m.authority
    FROM capability_map m JOIN capability_package p ON p.source_id = m.source_id AND p.install_path = m.install_path
    ${nodeId ? 'WHERE m.node_id = ?' : ''} ORDER BY m.score DESC, p.name LIMIT ?`;
  return nodeId ? db.prepare(sql).all(nodeId, n) : db.prepare(sql).all(n);
}

export function listCapabilityContracts(db, { status = null } = {}) {
  const sql = status
    ? 'SELECT * FROM capability_contract WHERE status = ? ORDER BY id, version'
    : 'SELECT * FROM capability_contract ORDER BY id, version';
  return (status ? db.prepare(sql).all(status) : db.prepare(sql).all()).map((row) => ({
    ...row, effects: JSON.parse(row.effects || '[]'), scopes: JSON.parse(row.scopes || '[]'),
  }));
}

export function getCapabilityContract(db, { id, version = null }) {
  const row = version
    ? db.prepare('SELECT * FROM capability_contract WHERE id = ? AND version = ?').get(id, Number(version))
    : db.prepare('SELECT * FROM capability_contract WHERE id = ? ORDER BY version DESC LIMIT 1').get(id);
  return row ? { ...row, effects: JSON.parse(row.effects || '[]'), scopes: JSON.parse(row.scopes || '[]') } : null;
}

export function searchCapabilityDocuments(db, { query = '', limit = 20 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];
  const terms = q.split(/\s+/).map((t) => `"${t.replace(/"/g, '')}"*`).join(' ');
  const n = Math.max(1, Math.min(Number(limit) || 20, 200));
  try {
    return db.prepare(`SELECT d.source_id AS sourceId, d.install_path AS installPath, d.path, d.kind, d.title, d.bytes,
        snippet(capability_document_fts, 5, '[', ']', '...', 12) AS snippet, bm25(capability_document_fts) AS rank
      FROM capability_document_fts f JOIN capability_document d ON d.source_id = f.source_id AND d.path = f.path
      WHERE capability_document_fts MATCH ? ORDER BY rank LIMIT ?`).all(terms, n);
  } catch {
    return [];
  }
}

export function exportCapabilityJson(db, { sourceId = null } = {}) {
  const where = sourceId ? 'WHERE source_id = ?' : '';
  const args = sourceId ? [sourceId] : [];
  return {
    schema: CAPABILITY_REGISTRY_SCHEMA,
    source: sourceId ? db.prepare('SELECT * FROM capability_source WHERE id = ?').get(sourceId) : listCapabilitySources(db),
    packages: db.prepare(`SELECT * FROM capability_package ${where} ORDER BY source_id, name, install_path`).all(...args),
    dependencies: db.prepare(`SELECT * FROM capability_dependency ${where} ORDER BY source_id, from_path, to_name, kind`).all(...args),
    files: db.prepare(`SELECT * FROM capability_file ${where} ORDER BY source_id, path`).all(...args),
    documents: db.prepare(`SELECT * FROM capability_document ${where} ORDER BY source_id, path`).all(...args),
    evidence: db.prepare(`SELECT * FROM capability_evidence ${where} ORDER BY id`).all(...args),
    nodes: listCapabilityNodes(db),
    maps: db.prepare(`SELECT * FROM capability_map ${where} ORDER BY source_id, install_path, node_id`).all(...args),
    contracts: db.prepare(`SELECT * FROM capability_contract ${where} ORDER BY id, version`).all(...args),
  };
}

const EXPORT_TABLES = ['capability_source', 'capability_package', 'capability_dependency', 'capability_file', 'capability_document', 'capability_evidence', 'capability_node', 'capability_map', 'capability_contract'];

export function exportCapabilitySqlite(db, { path, sourceId = null } = {}) {
  if (!path) throw new Error('export path required');
  const target = new DatabaseSync(path);
  try {
    target.exec('PRAGMA journal_mode = MEMORY');
    target.exec('PRAGMA synchronous = OFF');
    target.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    target.exec(CAPABILITY_DDL);
    const docs = sourceId ? db.prepare('SELECT * FROM capability_document WHERE source_id = ?').all(sourceId) : db.prepare('SELECT * FROM capability_document').all();
    const pkgs = sourceId ? db.prepare('SELECT * FROM capability_package WHERE source_id = ?').all(sourceId) : db.prepare('SELECT * FROM capability_package').all();
    transaction(target, () => {
      for (const table of EXPORT_TABLES) {
        // capability_source is keyed by id; capability_node is shared taxonomy.
        const scoped = sourceId && table !== 'capability_node';
        const where = scoped ? ` WHERE ${table === 'capability_source' ? 'id' : 'source_id'} = ?` : '';
        const rows = scoped
          ? db.prepare(`SELECT * FROM ${table}${where}`).all(sourceId)
          : db.prepare(`SELECT * FROM ${table}`).all();
        if (!rows.length) continue;
        const cols = Object.keys(rows[0]);
        const stmt = target.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
        for (const row of rows) stmt.run(...cols.map((c) => row[c]));
      }
      const docFts = target.prepare('INSERT INTO capability_document_fts (source_id, install_path, path, kind, title, body) VALUES (?,?,?,?,?,?)');
      for (const d of docs) docFts.run(d.source_id, d.install_path, d.path, d.kind, d.title, d.body);
      const pkgFts = target.prepare('INSERT INTO capability_package_fts (source_id, install_path, name, description, keywords, manifest) VALUES (?,?,?,?,?,?)');
      for (const p of pkgs) pkgFts.run(p.source_id, p.install_path, p.name, p.description || '', p.keywords || '', p.manifest || '');
      target.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('capability_export', ?)").run(new Date().toISOString());
    });
    return { path, tables: EXPORT_TABLES.length, documents: docs.length, packages: pkgs.length };
  } finally {
    target.close();
  }
}

export function writeCapabilitySchema(path) {
  writeFileSync(path, CAPABILITY_DDL, 'utf8');
  return { path, bytes: Buffer.byteLength(CAPABILITY_DDL) };
}
