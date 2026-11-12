/**
 * @hq:context Wave 1 Lane A Round 2: isolated source-evidence and coverage auditor.
 * @hq:invariant Read-only. No SQLite, registry, Rust journal, Host effects, or old index reset.
 * @hq:invariant A source comment is a declaration, never a permission grant.
 * @hq:invariant Output is a diagnostic projection only, NOT Lane E source-records/1.
 */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const AUDIT_SCHEMA = 'vivim.wave1.lane-a.r2-audit/1';
export const INPUT_SCHEMA = 'vivim.wave1.code-observations/1';
const DIGEST = /^[a-f0-9]{64}$/i;
const COMMIT = /^[a-f0-9]{40}$/i;
const SECRET = /^(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)$/i;
const DECISIONS = new Set(['eligible', 'excluded', 'unsupported', 'unknown']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const sortBy = (items, key) => [...items].sort((a, b) => String(key(a)).localeCompare(String(key(b)), 'en'));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObj(value)) return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const fingerprint = value => hash(JSON.stringify(canonical(value)));

export function safeRelativePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.length > 1024 || path.includes('\\') || path.startsWith('/') || path.includes(':') || /[\u0000-\u001f]/.test(path)) return false;
  const parts = path.split('/');
  return parts.every(x => x.length && x !== '.' && x !== '..' && !SECRET.test(x));
}
export function classifyRelativePath(path) {
  if (typeof path !== 'string' || !path.trim()) return 'invalid';
  if (/\b(?:passwords?|secrets?|tokens?|cookies?|authorization|private.?key)\b/i.test(path)) return 'sensitive-name-review';
  return safeRelativePath(path) ? 'allowed' : 'unsafe';
}
const enclosed = (base, file) => {
  const diff = relative(base, file);
  return diff === '' || (diff !== '..' && !diff.startsWith('..' + sep) && !isAbsolute(diff));
};
function ensureNoSymlink(root, rel, fs = { lstatSync, realpathSync, statSync, readFileSync }) {
  const rootCanonical = fs.realpathSync(root);
  if (fs.lstatSync(root).isSymbolicLink()) throw Error('ROOT_SYMLINK');
  let cur = rootCanonical;
  for (const component of rel.split('/')) {
    cur = join(cur, component);
    if (fs.lstatSync(cur).isSymbolicLink()) throw Error('SOURCE_SYMLINK');
  }
  const canonical = fs.realpathSync(cur);
  if (!enclosed(rootCanonical, canonical)) throw Error('SOURCE_OUTSIDE_ROOT');
  if (!fs.statSync(canonical).isFile()) throw Error('SOURCE_NOT_FILE');
  return canonical;
}
/** Exact current byte check; caller supplies a private path map, never exported. */
export function verifySourceBytes(file, rootPaths, fs) {
  if (!isObj(file) || !safeRelativePath(file.path) || !DIGEST.test(file.sourceHash ?? '')) return { code: 'SOURCE_METADATA_INVALID' };
  const root = rootPaths?.[file.rootId];
  if (typeof root !== 'string' || !isAbsolute(root)) return { code: 'ROOT_NOT_MOUNTED' };
  try {
    const path = ensureNoSymlink(resolve(root), file.path, fs);
    const bytes = (fs?.readFileSync ?? readFileSync)(path);
    if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) return { code: 'SOURCE_BYTES_NOT_BINARY' };
    const digest = hash(bytes);
    if (digest.toLowerCase() !== file.sourceHash.toLowerCase()) return { code: 'SOURCE_HASH_MISMATCH' };
    if (file.size !== undefined && Number.isSafeInteger(file.size) && file.size !== bytes.length) return { code: 'SOURCE_SIZE_MISMATCH' };
    return { code: 'SOURCE_VERIFIED', digest, size: bytes.length, lineCount: (Buffer.from(bytes).toString('utf8').match(/\n/g) || []).length + 1 };
  } catch (e) {
    const code = String(e?.message || '').match(/^(ROOT_SYMLINK|SOURCE_SYMLINK|SOURCE_OUTSIDE_ROOT|SOURCE_NOT_FILE)$/)?.[1] || 'SOURCE_READ_FAILED';
    return { code };
  }
}
function add(diagnostics, code, ref, severity = 'error') {
  diagnostics.push({ code, ref: String(ref ?? ''), severity });
}
function rootRow(rootId) {
  return { rootId, declared: 1, discovered: 0, eligible: 0, excluded: 0, unsupported: 0, unknown: 0, verified: 0, indexed: 0, missing: 0, errors: 0, symbols: 0, imports: 0, annotations: 0, coverage: null };
}
/**
 * Audits the unchanged v1 A envelope against a separately generated discovery
 * inventory. Does not assert the inventory is genuine: reports its provenance.
 *
 * @param {object} observations Original A code-observations/1 envelope.
 * @param {object} opts  { rootPaths: private root-id -> absolute path,
 *    inventory: [{rootId,path,decision,reason?}], inventoryProof?: object,
 *    fs?: injected readonly filesystem }
 */
export function auditLaneASources(observations, opts = {}) {
  if (!isObj(observations) || observations.schema !== INPUT_SCHEMA) throw Error('A_R2_UNSUPPORTED_SOURCE_SCHEMA');
  if (!Array.isArray(observations.roots) || !observations.roots.length || !Array.isArray(observations.files) || !Array.isArray(observations.symbols) || !Array.isArray(observations.imports) || !Array.isArray(observations.annotations)) throw Error('A_R2_MALFORMED_OBSERVATIONS');
  if (observations.files.length > 250_000 || observations.symbols.length > 1_000_000 || observations.imports.length > 1_000_000 || observations.annotations.length > 1_000_000) throw Error('A_R2_INPUT_TOO_LARGE');
  const diagnostics = [], roots = new Map(), seenFiles = new Map(), seenFileById = new Map(), seenIDs = new Set(), inventory = new Map();
  for (const r of observations.roots) {
    if (!isObj(r) || !r.id || roots.has(r.id) || !COMMIT.test(r.headSha ?? '')) throw Error('A_R2_INVALID_ROOT_OR_HEAD');
    roots.set(r.id, rootRow(r.id));
  }
  const hasInventory = Array.isArray(opts.inventory);
  if (hasInventory) {
    if (opts.inventory.length > 250_000) throw Error('A_R2_INVENTORY_TOO_LARGE');
    for (const item of opts.inventory) {
      if (!isObj(item) || !roots.has(item.rootId) || !safeRelativePath(item.path) || !DECISIONS.has(item.decision) || (item.decision !== 'eligible' && !(typeof item.reason === 'string' && item.reason.trim()))) {
        add(diagnostics, 'INVENTORY_ITEM_INVALID', item?.rootId || '?'); continue;
      }
      const key = item.rootId + '\0' + item.path;
      if (inventory.has(key)) { add(diagnostics, 'INVENTORY_DUPLICATE', key.replace('\0', ':')); continue; }
      inventory.set(key, item);
      const rr = roots.get(item.rootId); rr.discovered++; rr[item.decision]++;
    }
  } else add(diagnostics, 'INVENTORY_NOT_SUPPLIED', observations.project?.id ?? 'project');
  const fileChecks = [], checkById = new Map();
  for (const f of sortBy(observations.files, x => x.id)) {
    if (!isObj(f) || typeof f.id !== 'string' || !roots.has(f.rootId) || !safeRelativePath(f.path)) { add(diagnostics, 'FILE_REF_INVALID', f?.id); continue; }
    const rr = roots.get(f.rootId), key = f.rootId + '\0' + f.path;
    if (seenFiles.has(key) || seenIDs.has(f.id)) { add(diagnostics, 'FILE_DUPLICATE_ID_OR_PATH', f.id); rr.errors++; continue; }
    seenIDs.add(f.id); seenFiles.set(key, f); seenFileById.set(f.id, f); rr.indexed++;
    if (hasInventory && !inventory.has(key)) add(diagnostics, 'INDEX_OUTSIDE_INVENTORY', f.id);
    if (hasInventory && inventory.has(key) && inventory.get(key).decision !== 'eligible') add(diagnostics, 'INDEXED_EXCLUDED_FILE', f.id);
    const check = verifySourceBytes(f, opts.rootPaths, opts.fs);
    if (check.code === 'SOURCE_VERIFIED') rr.verified++; else { add(diagnostics, check.code, f.id); rr.errors++; }
    const fileCheck = { fileId: f.id, rootId: f.rootId, path: f.path, code: check.code, hash: check.digest ?? null, lineCount: check.lineCount ?? null };
    fileChecks.push(fileCheck); checkById.set(f.id, fileCheck);
  }
  if (hasInventory) for (const [key, item] of inventory) {
    if (item.decision === 'eligible' && !seenFiles.has(key)) { add(diagnostics, 'ELIGIBLE_NOT_INDEXED', item.rootId + ':' + item.path); roots.get(item.rootId).missing++; }
    if (item.decision === 'unknown') add(diagnostics, 'INVENTORY_UNKNOWN', item.rootId + ':' + item.path);
  }
  function walkAnchors(items, kind) {
    for (const it of items) {
      if (!isObj(it) || typeof it.id !== 'string' || seenIDs.has(it.id)) { add(diagnostics, 'DUPLICATE_OR_INVALID_RECORD_ID', it?.id); continue; }
      seenIDs.add(it.id);
      const id = kind === 'import' ? it.from : it.fileId;
      const file = seenFileById.get(id);
      if (!file) { add(diagnostics, 'ORPHAN_' + kind.toUpperCase(), it.id); continue; }
      const rr = roots.get(file.rootId); rr[kind === 'symbol' ? 'symbols' : kind === 'import' ? 'imports' : 'annotations']++;
      if (!Number.isSafeInteger(it.line) || it.line < 1) add(diagnostics, 'INVALID_ANCHOR_LINE', it.id);
      const checkedFile = checkById.get(id);
      if (checkedFile?.lineCount && Number.isSafeInteger(it.line) && it.line > checkedFile.lineCount) add(diagnostics, 'ANCHOR_OUTSIDE_SOURCE', it.id);
      if (kind === 'symbol' && (typeof it.name !== 'string' || !it.name.trim() || !Number.isSafeInteger(it.endLine) || it.endLine < it.line)) add(diagnostics, 'INVALID_SYMBOL_RANGE', it.id);
      if (kind === 'import') {
        if (it.to !== null && it.to !== undefined && !seenFileById.has(it.to)) add(diagnostics, 'IMPORT_TO_UNKNOWN_FILE', it.id);
        if (it.observation !== 'source-only' || it.relation !== 'static-import') add(diagnostics, 'NONSTATIC_IMPORT_ASSERTION', it.id);
      }
      if (kind === 'annotation' && !['unverified', 'declared-unverified'].includes(it.claimStatus)) add(diagnostics, 'ANNOTATION_AUTHORITY_ESCALATION', it.id);
    }
  }
  walkAnchors(observations.symbols, 'symbol');
  walkAnchors(observations.imports, 'import');
  walkAnchors(observations.annotations, 'annotation');
  for (const root of roots.values()) {
    root.coverage = hasInventory && root.eligible > 0 ? { verified: root.verified, eligible: root.eligible } : null;
    if (hasInventory && root.eligible === 0) add(diagnostics, 'NO_ELIGIBLE_FILES_DENOMINATOR', root.rootId);
  }
  const sorted = sortBy(diagnostics, d => d.code + '\0' + d.ref), rootResults = sortBy([...roots.values()], x => x.rootId);
  const status = sorted.length ? 'BLOCKED' : hasInventory ? 'AUDIT_CONSISTENT_NOT_INTEGRATED' : 'BLOCKED';
  const result = {
    schema: AUDIT_SCHEMA, status,
    provenance: { inputDigest: observations.digest || null, inventoryProof: opts.inventoryProof || null, localHeadsVerified: false, bytesVerifiedPerFile: true, sourceScannedByAuditor: false, inventoryIndependentVerification: false, graphIntegrated: false },
    totals: { roots: roots.size, files: observations.files.length, fileChecks: fileChecks.length, symbols: observations.symbols.length, imports: observations.imports.length, annotations: observations.annotations.length, diagnostics: sorted.length },
    roots: rootResults, files: fileChecks, diagnostics: sorted,
    boundaries: { v1EnvelopeUnmodified: true, commentActionsRegistered: false, observedRuntimeCommunications: false, sqliteWritten: false, rustJournalWritten: false, previousRunReset: false }
  };
  result.digest = fingerprint(result);
  return result;
}
/** E contract preflight only: never emits an E feed or asserts that E accepted it. */
export function assessLaneECompatibility(observations, scope) {
  if (!isObj(observations) || observations.schema !== INPUT_SCHEMA) throw Error('A_R2_UNSUPPORTED_SOURCE_SCHEMA');
  const issues = [];
  if (!isObj(scope) || scope.schema !== 'vivim.wave1.project-scope/1') issues.push('E_SCOPE_NOT_PROVIDED');
  if (scope?.projectId !== observations.project?.id) issues.push('PROJECT_ID_MISMATCH');
  if (scope?.revision !== observations.project?.intentRevision) issues.push('SCOPE_REVISION_MISMATCH');
  if (!scope?.intentId || typeof scope.intentId !== 'string') issues.push('E_INTENT_ID_MISSING');
  const er = new Map((Array.isArray(scope?.roots) ? scope.roots : []).map(r => [r.id, r]));
  for (const root of observations.roots || []) {
    const e = er.get(root.id);
    if (!e) issues.push('MISSING_E_ROOT:' + root.id);
    else {
      if (e.commitSha?.toLowerCase() !== root.headSha?.toLowerCase()) issues.push('E_ROOT_SHA_MISMATCH:' + root.id);
      if (!e.repo || !e.path) issues.push('E_ROOT_PROVENANCE_INCOMPLETE:' + root.id);
    }
  }
  for (const e of er.values()) if (!(observations.roots || []).some(r => r.id === e.id)) issues.push('E_ROOT_NOT_IN_A:' + e.id);
  issues.push('SOURCE_RECORD_LOWERING_REQUIRED');
  return { schema: 'vivim.wave1.lane-a.e-contract-preflight/1', status: 'BLOCKED_CONTRACT_CROSSWALK', issues: [...new Set(issues)].sort(), aSchema: observations.schema, requiredEFeedSchema: 'vivim.wave1.source-records/1', emittedEFeed: false, wroteRustJournal: false };
}
