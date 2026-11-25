// HVI Lane A: deterministic, read-only, immutable Git-object snapshots.
// No working-tree HEAD, Git CLI, checkout, automatic network or effect authority.
import {
  SOURCE_SCHEMA, MANIFEST_SCHEMA, assertSha, canonicalRepo, safePath, safeRef,
  digest, gitBlobSha, sensitivePath, checkCancel, fail, SourceError,
} from './common.mjs';
import { assertVerifiedAdapter } from './adapters.mjs';

export const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 50000, maxPages: 1000, pageSize: 500, maxDepth: 64,
  maxBlobBytes: 1500000, maxInspectBytes: 4096, maxInspectTotalBytes: 4000000,
});

function limitsFor(input = {}) {
  const out = {};
  for (const [name, ceiling] of Object.entries(DEFAULT_LIMITS)) {
    const raw = input[name] ?? ceiling;
    if (!Number.isSafeInteger(raw) || raw < 1 || raw > ceiling) fail('RESOURCE_LIMIT', 'invalid_limit');
    out[name] = raw;
  }
  return out;
}
async function authorized(adapter, authorize, operation, scope, context = {}) {
  if (scope !== 'development' || typeof authorize !== 'function') {
    fail('SOURCE_UNAUTHORIZED', 'development_grant_required');
  }
  // A partial or caller-forged boolean adapter is never authority.
  assertVerifiedAdapter(adapter);
  // It is the trusted caller's responsibility to re-evaluate live Host grants.
  // No cached boolean grants or source registry records constitute permission.
  if (await authorize({ operation, scope: 'development', ...context }) !== true) {
    fail('SOURCE_UNAUTHORIZED', 'grant_denied');
  }
}
function checkPin(pin) {
  if (pin?.schema !== SOURCE_SCHEMA || pin.scope !== 'development' ||
      pin.provider !== 'github') fail('SOURCE_UNAUTHORIZED', 'invalid_pin');
  if (canonicalRepo(pin.repoIdentity, pin.provider) !== pin.repoIdentity) {
    fail('ID_CONFLICT', 'noncanonical_repo_identity');
  }
  assertSha(pin.resolvedCommitSha);
  assertSha(pin.rootTreeSha);
  safePath(pin.subPath ?? '', { allowEmpty: true });
  if (pin.requestedRef !== null && pin.requestedRef !== undefined) safeRef(pin.requestedRef);
  const expected = digest({
    provider: pin.provider, repoIdentity: pin.repoIdentity,
    commitSha: pin.resolvedCommitSha, subPath: pin.subPath || '',
  });
  if (pin.pinId !== expected) fail('ID_CONFLICT', 'pin_identity_mismatch');
  return pin;
}
async function commitAt(pin, adapter) {
  const commit = await adapter.readCommit({
    repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
  });
  if (!commit || commit.sha !== pin.resolvedCommitSha ||
      commit.treeSha !== pin.rootTreeSha) fail('PIN_MOVED', 'commit_tree_mismatch');
  return commit;
}

/**
 * resolvePin(source, {adapter, authorize}) freezes a single authorized ref.
 * Adapters MUST read verified committed Git objects and resolve refs once.
 * source = {repo, provider:'github', ref|sha, subPath?, approvedScope:'development'}
 */
export async function resolvePin(source, { adapter, authorize, acquiredAt } = {}) {
  const provider = source?.provider;
  const repoIdentity = canonicalRepo(source?.repo, provider);
  await authorized(adapter, authorize, 'source.pin.resolve', source?.approvedScope,
    { repoIdentity, sourceGrantRef: source.sourceGrantRef ?? null });
  const requestedRef = source.ref == null ? null : safeRef(source.ref);
  const specifiedSha = source.sha == null ? null : assertSha(source.sha);
  if (!requestedRef && !specifiedSha) fail('PIN_NOT_FOUND', 'ref_or_sha_required');
  const subPath = safePath(source.subPath ?? '', { allowEmpty: true });
  const refCommit = requestedRef
    ? await adapter.resolveRef({ repoIdentity, ref: requestedRef })
    : null;
  if (requestedRef && !refCommit?.commitSha) fail('PIN_NOT_FOUND', 'ref_unavailable');
  const resolvedCommitSha = assertSha(requestedRef ? refCommit.commitSha : specifiedSha);
  if (specifiedSha && resolvedCommitSha !== specifiedSha) fail('PIN_MOVED', 'ref_changed_from_expected_sha');
  const commit = await adapter.readCommit({ repoIdentity, commitSha: resolvedCommitSha });
  if (!commit || commit.sha !== resolvedCommitSha) fail('PIN_NOT_FOUND', 'commit_unavailable');
  const rootTreeSha = assertSha(commit.treeSha);
  const pinId = digest({ provider, repoIdentity, commitSha: resolvedCommitSha, subPath });
  return Object.freeze({
    schema: SOURCE_SCHEMA, pinId, provider, repoIdentity, requestedRef,
    resolvedCommitSha, rootTreeSha, subPath, manifestDigest: null,
    acquiredAt: acquiredAt || new Date().toISOString(),
    completeness: 'partial', scope: 'development',
    sourceGrantRef: source.sourceGrantRef ?? null,
    evidenceRef: source.evidenceRef ?? null,
  });
}

/**
 * verifyPin detects a moved requested ref, conflicting commit tree or digest.
 * Older snapshots remain reproducible by SHA: snapshotAt itself NEVER uses ref.
 */
export async function verifyPin(pin, { adapter, authorize, manifest, checkRef = true } = {}) {
  checkPin(pin);
  await authorized(adapter, authorize, 'source.pin.verify', pin.scope,
    { repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
      sourceGrantRef: pin.sourceGrantRef });
  await commitAt(pin, adapter);
  if (checkRef && pin.requestedRef) {
    const tip = await adapter.resolveRef({ repoIdentity: pin.repoIdentity, ref: pin.requestedRef });
    if (tip?.commitSha !== pin.resolvedCommitSha) fail('PIN_MOVED', 'requested_ref_moved');
  }
  if (manifest) {
    if (manifest.pinId !== pin.pinId || manifest.rootTreeSha !== pin.rootTreeSha) {
      fail('ID_CONFLICT', 'manifest_pin_conflict');
    }
    const actual = manifestDigestOf(manifest);
    if (manifest.manifestDigest !== actual || (pin.manifestDigest && pin.manifestDigest !== actual)) {
      fail('DIGEST_CONFLICT', 'manifest_digest_conflict');
    }
  }
  return true;
}

/**
 * Live composition of a registered, approved repository selection:
 * exact repo identity -> immutable pin -> verified snapshot.
 * The registry is the caller's existing approved-repository list; this module
 * keeps no registry of its own. Ref movement, a wrong SHA, a revoked grant or an
 * unregistered repository all fail closed before any comparison is possible.
 */
export async function acquirePinnedSnapshot(source, {
  adapter, authorize, approvedRepositories, limits, inspectContent = false, signal, acquiredAt,
} = {}) {
  assertVerifiedAdapter(adapter);
  if (!Array.isArray(approvedRepositories) || approvedRepositories.length === 0 ||
      approvedRepositories.length > 16) fail('SOURCE_UNAUTHORIZED', 'registered_repository_required');
  const provider = source?.provider ?? 'github';
  const repoIdentity = canonicalRepo(source?.repo, provider);
  const approved = approvedRepositories.map(repo => canonicalRepo(repo, provider));
  if (!approved.includes(repoIdentity)) fail('SOURCE_UNAUTHORIZED', 'repository_not_registered');
  // Only development-scope acquisition exists; the live grant callback decides access.
  const pin = await resolvePin({ ...source, provider, repoIdentity, approvedScope: 'development' },
    { adapter, authorize, acquiredAt });
  // Detect a ref that moved between resolution and acquisition.
  await verifyPin(pin, { adapter, authorize, checkRef: true });
  const manifest = await snapshotAt(pin, { adapter, authorize, limits, inspectContent, signal });
  // Bind the acquired bytes to the same commit/tree and re-check the live ref.
  await verifyPin(pin, { adapter, authorize, manifest, checkRef: true });
  return Object.freeze({
    pin, manifest,
    receipt: Object.freeze({
      pinId: pin.pinId, repoIdentity: pin.repoIdentity, provider: pin.provider,
      requestedRef: pin.requestedRef, resolvedCommitSha: pin.resolvedCommitSha,
      rootTreeSha: pin.rootTreeSha, subPath: pin.subPath,
      manifestDigest: manifest.manifestDigest, completeness: manifest.completeness,
      verifiedAdapter: adapter.kind,
    }),
  });
}

function normalizedEntry(record, pin, lim) {
  const path = safePath(record?.path);
  if (record.type === 'tree') return null;
  if (pin.subPath && !(path === pin.subPath || path.startsWith(pin.subPath + '/'))) return null;
  if (path.split('/').length > lim.maxDepth) fail('RESOURCE_LIMIT', 'depth_exceeded');
  const mode = String(record.mode || '');
  const kind = record.type === 'commit' && mode === '160000' ? 'submodule'
    : record.type === 'blob' && mode === '120000' ? 'symlink'
      : record.type === 'blob' && (mode === '100644' || mode === '100755') ? 'file'
        : null;
  if (!kind) fail('INCOMPLETE_SCAN', 'unsupported_tree_record');
  const blobSha = assertSha(record.sha);
  const bytes = record.size === undefined || record.size === null ? null : record.size;
  if (bytes !== null && (!Number.isSafeInteger(bytes) || bytes < 0)) {
    fail('INCOMPLETE_SCAN', 'invalid_blob_size');
  }
  return {
    path, mode, blobSha, bytes, kind,
    parseStatus: kind === 'submodule' ? 'gitlink_only' : 'uninspected',
    excludedReason: sensitivePath(path) ? 'sensitive_path' : null,
    symlinkTarget: null,
  };
}
function manifestPayload(manifest) {
  return {
    schema: MANIFEST_SCHEMA,
    pinId: manifest.pinId,
    repoIdentity: manifest.repoIdentity,
    resolvedCommitSha: manifest.resolvedCommitSha,
    rootTreeSha: manifest.rootTreeSha,
    subPath: manifest.subPath,
    entries: manifest.entries,
    completeness: manifest.completeness,
    truncated: manifest.truncated,
    observedEntries: manifest.observedEntries,
    omittedMinimum: manifest.omittedMinimum,
    errors: manifest.errors,
  };
}
export function manifestDigestOf(manifest) { return digest(manifestPayload(manifest)); }
function note(errors, code, detail) {
  if (!errors.some(e => e.code === code && e.detail === detail)) errors.push({ code, detail });
}
function bufferFrom(value) {
  // Own the verified bytes: an adapter must not mutate a returned Buffer alias.
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  fail('INCOMPLETE_SCAN', 'binary_blob_required');
}
async function readVerifiedBlob(adapter, pin, sha, maxBytes) {
  const raw = bufferFrom(await adapter.readBlob({
    repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
    blobSha: sha, maxBytes,
  }));
  if (raw.length > maxBytes) fail('RESOURCE_LIMIT', 'blob_size_limit');
  if (gitBlobSha(raw) !== sha) fail('DIGEST_CONFLICT', 'git_blob_hash_mismatch');
  return raw;
}
function inspect(entry, data) {
  if (entry.kind === 'symlink') {
    entry.parseStatus = 'symlink_metadata';
    entry.symlinkTarget = data.toString('utf8');
  } else if (data.subarray(0, 80).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    entry.parseStatus = 'lfs_pointer';
  } else if (data.includes(0)) {
    entry.parseStatus = 'binary';
  } else {
    entry.parseStatus = 'text';
  }
}

/**
 * Consumes ONLY verified flattened Git-tree pages. A page is
 * {verified:true, entries:[{path,type,mode,sha,size}],nextCursor?,truncated?}.
 * The adapter must preserve commit/tree SHA provenance; no working-tree reads.
 */
export async function snapshotAt(pin, {
  adapter, authorize, limits = {}, inspectContent = false, signal,
} = {}) {
  checkPin(pin);
  await authorized(adapter, authorize, 'source.snapshot.read', pin.scope,
    { repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
      sourceGrantRef: pin.sourceGrantRef });
  await commitAt(pin, adapter);
  const lim = limitsFor(limits);
  const entries = new Map();
  const errors = [];
  const cursors = new Set();
  let pages = 0, omittedMinimum = 0, inspectBytes = 0, cursor = null, truncated = false;
  while (true) {
    checkCancel(signal);
    await authorized(adapter, authorize, 'source.snapshot.page', pin.scope,
      { repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
        sourceGrantRef: pin.sourceGrantRef });
    if (++pages > lim.maxPages) {
      truncated = true; omittedMinimum++;
      note(errors, 'RESOURCE_LIMIT', 'max_pages');
      break;
    }
    let page;
    try {
      page = await adapter.listTree({
        repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
        rootTreeSha: pin.rootTreeSha, cursor, pageSize: lim.pageSize,
      });
    } catch (error) {
      if (error instanceof SourceError) throw error;
      truncated = true; omittedMinimum++;
      note(errors, 'INCOMPLETE_SCAN', 'tree_page_unavailable');
      break;
    }
    if (page?.verified !== true || !Array.isArray(page.entries)) {
      fail('INCOMPLETE_SCAN', 'unverified_tree_page');
    }
    if (page.entries.length > lim.pageSize) fail('RESOURCE_LIMIT', 'oversized_tree_page');
    for (let i = 0; i < page.entries.length; i++) {
      checkCancel(signal);
      const entry = normalizedEntry(page.entries[i], pin, lim);
      if (!entry) continue;
      if (entries.has(entry.path)) {
        fail('ID_CONFLICT', 'duplicate_git_tree_path');
      }
      if (entries.size >= lim.maxEntries) {
        truncated = true;
        omittedMinimum += page.entries.length - i + (page.nextCursor ? 1 : 0);
        note(errors, 'RESOURCE_LIMIT', 'max_entries');
        break;
      }
      if (entry.bytes !== null && entry.bytes > lim.maxBlobBytes && entry.kind !== 'submodule') {
        entry.parseStatus = 'oversized';
        entry.excludedReason = entry.excludedReason || 'large_blob';
      } else if (inspectContent && !entry.excludedReason && entry.kind !== 'submodule' &&
        entry.bytes !== null && entry.bytes <= lim.maxInspectBytes &&
        inspectBytes + entry.bytes <= lim.maxInspectTotalBytes) {
        await authorized(adapter, authorize, 'source.snapshot.blob', pin.scope,
          { repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
            sourceGrantRef: pin.sourceGrantRef, path: entry.path });
        const data = await readVerifiedBlob(adapter, pin, entry.blobSha, lim.maxInspectBytes);
        if (data.length !== entry.bytes) fail('DIGEST_CONFLICT', 'blob_length_mismatch');
        inspect(entry, data);
        inspectBytes += data.length;
      } else if (inspectContent && !entry.excludedReason && entry.kind !== 'submodule') {
        entry.parseStatus = 'inspection_deferred';
      }
      entries.set(entry.path, entry);
    }
    if (truncated) break;
    if (page.truncated) {
      truncated = true;
      omittedMinimum++;
      note(errors, 'INCOMPLETE_SCAN', 'adapter_tree_truncated');
      break;
    }
    if (page.nextCursor == null) break;
    if (typeof page.nextCursor !== 'string' || !page.nextCursor || cursors.has(page.nextCursor)) {
      fail('INCOMPLETE_SCAN', 'invalid_pagination_cursor');
    }
    cursors.add(page.nextCursor);
    cursor = page.nextCursor;
  }
  const ordered = [...entries.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  errors.sort((a, b) => (a.code + a.detail).localeCompare(b.code + b.detail));
  const completeness = truncated ? 'partial' : 'complete';
  const manifest = {
    schema: MANIFEST_SCHEMA, pinId: pin.pinId, repoIdentity: pin.repoIdentity,
    resolvedCommitSha: pin.resolvedCommitSha, rootTreeSha: pin.rootTreeSha,
    subPath: pin.subPath, entries: ordered, completeness, truncated,
    observedEntries: ordered.length, omittedMinimum, errors,
  };
  manifest.manifestDigest = manifestDigestOf(manifest);
  manifest.pin = Object.freeze({ ...pin, completeness, manifestDigest: manifest.manifestDigest });
  for (const entry of ordered) Object.freeze(entry);
  for (const error of errors) Object.freeze(error);
  Object.freeze(ordered);
  Object.freeze(errors);
  return Object.freeze(manifest);
}

/** Read only a pinned, in-manifest, non-sensitive Git blob, with Git SHA proof. */
export async function readPinnedBlob(pin, path, {
  adapter, authorize, manifest, maxBytes = DEFAULT_LIMITS.maxBlobBytes,
} = {}) {
  checkPin(pin);
  const rel = safePath(path);
  const ctx = { repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
    sourceGrantRef: pin.sourceGrantRef, path: rel };
  await authorized(adapter, authorize, 'source.blob.read', pin.scope, ctx);
  if (!manifest || manifest.schema !== MANIFEST_SCHEMA || manifest.pinId !== pin.pinId ||
      manifest.repoIdentity !== pin.repoIdentity || manifest.resolvedCommitSha !== pin.resolvedCommitSha ||
      manifest.rootTreeSha !== pin.rootTreeSha || manifest.subPath !== pin.subPath ||
      !Array.isArray(manifest.entries)) fail('ID_CONFLICT', 'manifest_pin_conflict');
  if (manifest.manifestDigest !== manifestDigestOf(manifest) ||
      (pin.manifestDigest && pin.manifestDigest !== manifest.manifestDigest))
    fail('DIGEST_CONFLICT', 'manifest_modified');
  if (pin.subPath && !(rel === pin.subPath || rel.startsWith(pin.subPath + '/')))
    fail('SOURCE_UNAUTHORIZED', 'blob_outside_pin');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > DEFAULT_LIMITS.maxBlobBytes) {
    fail('RESOURCE_LIMIT', 'invalid_blob_limit');
  }
  const entry = manifest.entries.find(e => e.path === rel);
  if (!entry || entry.kind !== 'file' || entry.excludedReason || sensitivePath(rel)) {
    fail('SOURCE_UNAUTHORIZED', 'blob_not_readable');
  }
  if (entry.bytes !== null && entry.bytes > maxBytes) fail('RESOURCE_LIMIT', 'blob_size_limit');
  await commitAt(pin, adapter);
  const bytes = await readVerifiedBlob(adapter, pin, entry.blobSha, maxBytes);
  if (entry.bytes !== null && bytes.length !== entry.bytes) fail('DIGEST_CONFLICT', 'blob_length_mismatch');
  // A live grant may expire or be revoked while the object adapter is awaiting I/O.
  // Reuse the identical Host authorization context immediately before disclosure.
  await authorized(adapter, authorize, 'source.blob.read', pin.scope, ctx);
  return bytes;
}

/** Bounded all-or-nothing reads from one Host-authorized immutable manifest. */
export async function readPinnedBlobs(pin, paths, {
  adapter, authorize, manifest, signal, maxBytesPerFile = 65536, maxTotalBytes = 262144,
} = {}) {
  checkPin(pin);
  checkCancel(signal);
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > 16 ||
      !Number.isSafeInteger(maxBytesPerFile) || maxBytesPerFile < 1 || maxBytesPerFile > 65536 ||
      !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 262144)
    fail('RESOURCE_LIMIT', 'invalid_batch_limit');
  const requested = Array.from(paths, path => safePath(path));
  if (new Set(requested).size !== requested.length) fail('ID_CONFLICT', 'duplicate_batch_path');
  if (!pin.manifestDigest || !manifest || manifest.schema !== MANIFEST_SCHEMA ||
      manifest.pinId !== pin.pinId || manifest.repoIdentity !== pin.repoIdentity ||
      manifest.resolvedCommitSha !== pin.resolvedCommitSha || manifest.rootTreeSha !== pin.rootTreeSha ||
      manifest.subPath !== pin.subPath || !Array.isArray(manifest.entries))
    fail('ID_CONFLICT', 'sealed_manifest_required');
  if (manifest.manifestDigest !== pin.manifestDigest || manifestDigestOf(manifest) !== pin.manifestDigest)
    fail('DIGEST_CONFLICT', 'manifest_modified');
  const ctx = path => ({ repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
    sourceGrantRef: pin.sourceGrantRef, path });
  // Preflight all paths before reading any bytes. No partial result is returned on denial.
  const entries = requested.map(path => {
    if (sensitivePath(path) || (pin.subPath && !(path === pin.subPath || path.startsWith(pin.subPath + '/'))))
      fail('SOURCE_UNAUTHORIZED', 'blob_not_readable');
    const entry = manifest.entries.find(e => e.path === path);
    if (!entry || entry.kind !== 'file' || entry.excludedReason) fail('SOURCE_UNAUTHORIZED', 'blob_not_readable');
    return entry;
  });
  const knownBytes = entries.reduce((sum, entry) => {
    if (entry.bytes !== null && entry.bytes > maxBytesPerFile) fail('RESOURCE_LIMIT', 'blob_size_limit');
    return sum + (entry.bytes ?? 0);
  }, 0);
  if (knownBytes > maxTotalBytes) fail('RESOURCE_LIMIT', 'batch_size_limit');
  for (const path of requested) {
    checkCancel(signal);
    await authorized(adapter, authorize, 'source.blob.read', pin.scope, ctx(path));
  }
  const files = [];
  let totalBytes = 0;
  for (const path of requested) {
    checkCancel(signal);
    const remaining = maxTotalBytes - totalBytes;
    if (remaining < 1) fail('RESOURCE_LIMIT', 'batch_size_limit');
    const bytes = await readPinnedBlob(pin, path, { adapter, authorize, manifest,
      maxBytes: Math.min(maxBytesPerFile, remaining) });
    checkCancel(signal);
    totalBytes += bytes.length;
    files.push(Object.freeze({ path, blobSha: gitBlobSha(bytes), size: bytes.length, bytes }));
  }
  // Re-evaluate every path before release, including paths read earlier in the batch.
  for (const path of requested) {
    checkCancel(signal);
    await authorized(adapter, authorize, 'source.blob.read', pin.scope, ctx(path));
  }
  checkCancel(signal);
  if (manifest.manifestDigest !== pin.manifestDigest || manifestDigestOf(manifest) !== pin.manifestDigest)
    fail('DIGEST_CONFLICT', 'manifest_modified');
  return Object.freeze({ schema: 'arbor.hvi.pinned-blob-batch/1', pinId: pin.pinId,
    repoIdentity: pin.repoIdentity, resolvedCommitSha: pin.resolvedCommitSha,
    manifestDigest: pin.manifestDigest, totalBytes, files: Object.freeze(files) });
}

/** Bounded metadata-only list/search/inspect of a Host-owned immutable source. */
export async function queryPinnedEntries(pin, query, { adapter, authorize, manifest, signal } = {}) {
  checkPin(pin);
  checkCancel(signal);
  if (!query || Object.getPrototypeOf(query) !== Object.prototype ||
      Object.keys(query).some(k => !['prefix', 'contains', 'exactPath', 'after', 'limit'].includes(k)))
    fail('RESOURCE_LIMIT', 'invalid_metadata_query');
  const prefix = safePath(query.prefix ?? '', { allowEmpty: true });
  const contains = query.contains ?? '';
  const exactPath = query.exactPath === undefined ? null : safePath(query.exactPath);
  const after = query.after === undefined ? null : safePath(query.after);
  const limit = query.limit ?? 50;
  if (typeof contains !== 'string' || contains.length > 160 || /[\x00-\x1f\x7f]/.test(contains) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      (exactPath !== null && (prefix || contains || after !== null)))
    fail('RESOURCE_LIMIT', 'invalid_metadata_query');
  const inPrefix = (path, root) => !root || path === root || path.startsWith(root + '/');
  if ([prefix, exactPath, after].some(path => path && sensitivePath(path)) ||
      [prefix, exactPath, after].some(path => path && !inPrefix(path, pin.subPath)))
    fail('SOURCE_UNAUTHORIZED', 'metadata_scope_denied');
  const sealed = () => {
    if (!pin.manifestDigest || !manifest || manifest.schema !== MANIFEST_SCHEMA ||
        manifest.pinId !== pin.pinId || manifest.repoIdentity !== pin.repoIdentity ||
        manifest.resolvedCommitSha !== pin.resolvedCommitSha || manifest.rootTreeSha !== pin.rootTreeSha ||
        manifest.subPath !== pin.subPath || !Array.isArray(manifest.entries))
      fail('ID_CONFLICT', 'sealed_manifest_required');
    if (manifest.manifestDigest !== pin.manifestDigest || manifestDigestOf(manifest) !== pin.manifestDigest)
      fail('DIGEST_CONFLICT', 'manifest_modified');
  };
  const ctx = path => ({ repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
    sourceGrantRef: pin.sourceGrantRef, ...(path ? { path } : {}) });
  const check = async (operation, path) => {
    checkCancel(signal);
    await authorized(adapter, authorize, operation, pin.scope, ctx(path));
    checkCancel(signal);
  };
  await check('source.snapshot.read', exactPath ?? (prefix || pin.subPath));
  sealed();
  await commitAt(pin, adapter);
  const needle = contains.toLowerCase();
  const rows = [];
  const seen = new Set();
  for (const entry of manifest.entries) {
    checkCancel(signal);
    const path = safePath(entry.path);
    if (seen.has(path)) fail('ID_CONFLICT', 'duplicate_git_tree_path');
    seen.add(path);
    if (sensitivePath(path) || entry.excludedReason || !inPrefix(path, pin.subPath) ||
        !inPrefix(path, prefix) || (exactPath !== null && path !== exactPath) ||
        (after !== null && path <= after) || !path.toLowerCase().includes(needle)) continue;
    if (!['file', 'symlink', 'submodule'].includes(entry.kind)) fail('INCOMPLETE_SCAN', 'unsupported_tree_record');
    rows.push(Object.freeze({ path, kind: entry.kind, mode: entry.mode,
      blobSha: assertSha(entry.blobSha), bytes: entry.bytes, parseStatus: entry.parseStatus }));
  }
  rows.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const entries = rows.slice(0, limit);
  // Metadata is also scoped: no names, counts, link targets or content escape a denial.
  for (const entry of entries) await check('source.snapshot.read', entry.path);
  sealed();
  await check('source.snapshot.read', exactPath ?? (prefix || pin.subPath));
  sealed();
  return Object.freeze({ schema: 'arbor.hvi.pinned-metadata/1', pinId: pin.pinId,
    repoIdentity: pin.repoIdentity, resolvedCommitSha: pin.resolvedCommitSha,
    manifestDigest: pin.manifestDigest, completeness: manifest.completeness,
    entries: Object.freeze(entries),
    // A full page can be followed by an empty page. Never count undisclosed candidates.
    nextAfter: exactPath === null && entries.length === limit ? entries.at(-1).path : null });
}
