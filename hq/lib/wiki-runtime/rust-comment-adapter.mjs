// Trusted read-only source-byte gate. Never accepts a compiler's claimed digest as proof.
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
// Rust Lane 2 -> JS Lane 3: adapters only; never executes or grants authority.
import {
  COMMENT_PROGRAM_SCHEMA, validateCommentProgram, previewCommentProgram,
  activateCommentProgram, rollbackCommentProgram,
} from '../comment-wiki-bridge.mjs';

export const RUST_COMMENT_PROGRAM_SCHEMA = 'hq.comment-program/0.1';
const EVENT_MAP = Object.freeze({ open: 'click', click: 'click', select: 'click',
  submit: 'submit', change: 'change' });
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const isHex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const keysOnly = (x, allow) => Object.keys(x).every(k => allow.includes(k));
const fail = (code, path = '') => ({ ok: false, errors: [{ code, path }] });
const SAFE_SOURCE = /^(?![./])[a-zA-Z0-9_][a-zA-Z0-9_.\/-]{0,239}$/;
const SECRET_SEGMENT = /^(?:\.env.*|.*\.env|.*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json)$/i;

/**
 * Verify the original source bytes with an EXPLICIT caller-owned project root.
 * Walk all components without following symlinks; canonical root containment is
 * checked before reading. No comment value is interpreted as executable content.
 */
export function verifyRustCommentSource(doc, { sourceRoot } = {}) {
  if (!isObject(doc) || !isObject(doc.source)
      || typeof sourceRoot !== 'string' || !isAbsolute(sourceRoot))
    return fail('trusted_source_root_required', 'sourceRoot');
  const { path, digest } = doc.source;
  if (typeof path !== 'string' || !SAFE_SOURCE.test(path) || path.includes('\\')
      || path.includes('//') || path.includes(':')
      || path.split('/').some(p => !p || p === '.' || p === '..' || SECRET_SEGMENT.test(p))
      || !isHex(digest)) return fail('unsafe_source_path', 'source.path');
  try {
    const root = realpathSync(sourceRoot);
    if (!lstatSync(root).isDirectory()) return fail('unsafe_source_root', 'sourceRoot');
    let cursor = root;
    const segments = path.split('/');
    for (const [index, segment] of segments.entries()) {
      cursor = join(cursor, segment);
      const info = lstatSync(cursor);
      if (info.isSymbolicLink() || (index < segments.length - 1 && !info.isDirectory()))
        return fail('unsafe_source_path', 'source.path');
    }
    const canonical = realpathSync(cursor);
    const inside = relative(root, canonical);
    if (!inside || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)
        || !lstatSync(canonical).isFile()) return fail('unsafe_source_path', 'source.path');
    // Open with O_NOFOLLOW when provided by the OS: a replaced final symlink
    // must not bypass the earlier lstat check.
    const fd = openSync(canonical, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    let bytes;
    try {
      const info = fstatSync(fd);
      if (!info.isFile() || info.size > 1048576)
        return fail('source_too_large_or_invalid', 'source.path');
      bytes = readFileSync(fd);
    } finally { closeSync(fd); }
    if (bytes.length > 1048576) return fail('source_too_large', 'source.path');
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== digest) return fail('source_digest_mismatch', 'source.digest');
    // A sourceMap location must name the actual declaration line. This checks
    // provenance, not comment grammar; Rust alone is the comment parser.
    const lines = bytes.toString('utf8').split(/\r?\n/);
    for (const [i, program] of (doc.programs ?? []).entries()) {
      const loc = program?.sourceMap;
      const marker = `@hq:wiki ${program.id}@${program.declarationVersion}`;
      const line = lines[loc?.line - 1];
      if (!Number.isSafeInteger(loc?.line) || loc.line < 1 || !line ||
          !line.includes(marker)) return fail('source_position_mismatch', `programs[${i}].sourceMap.line`);
    }
    return { ok: true, path, digest: actual, bytes: bytes.length };
  } catch {
    return fail('source_unavailable_or_symlinked', 'source.path');
  }
}

/**
 * Convert the real Rust CLI's *collection* manifest into per-program validation
 * fixtures for the existing HQ wiki preview/activation lifecycle. Nothing runs.
 * Caller must independently verify source bytes against source.digest.
 */
export function loadRustCommentPrograms(input, options = {}) {
  let doc;
  if (typeof input === 'string') {
    if (Buffer.byteLength(input, 'utf8') > 1048576) return fail('oversized_compiler_output');
    try { doc = JSON.parse(input); } catch { return fail('invalid_json'); }
  } else doc = input;
  if (!isObject(doc) || !keysOnly(doc, ['schema', 'compilerVersion', 'ok', 'source', 'programs', 'diagnostics'])
      || doc.schema !== RUST_COMMENT_PROGRAM_SCHEMA || doc.ok !== true
      || !Array.isArray(doc.diagnostics) || doc.diagnostics.length !== 0)
    return fail('invalid_or_failed_compiler_output');
  if (!isObject(doc.source) || !keysOnly(doc.source, ['path', 'digest', 'language'])
      || !isHex(doc.source.digest) || typeof doc.source.path !== 'string'
      || typeof doc.source.language !== 'string') return fail('invalid_compiler_source');
  if (!Array.isArray(doc.programs) || doc.programs.length < 1 || doc.programs.length > 64)
    return fail('invalid_program_collection');
  const all = []; const seen = new Set();
  for (let i = 0; i < doc.programs.length; i++) {
    const p = doc.programs[i]; const path = `programs[${i}]`;
    if (!isObject(p) || !keysOnly(p, ['id','declarationVersion','sourceMap','wikiProgram','bindings','requires','evidence'])
        || typeof p.id !== 'string' || seen.has(p.id) || p.declarationVersion !== '0.1'
        || !isObject(p.sourceMap) || !keysOnly(p.sourceMap, ['path','line','digest'])
        || p.sourceMap.path !== doc.source.path || p.sourceMap.digest !== doc.source.digest
        || !Number.isSafeInteger(p.sourceMap.line) || p.sourceMap.line < 1
        || !isObject(p.wikiProgram) || !keysOnly(p.wikiProgram, ['schema','config'])
        || p.wikiProgram.schema !== 'hq.wiki-program/1' || p.wikiProgram.config?.id !== p.id
        || !Array.isArray(p.bindings) || !Array.isArray(p.requires)
        || !Array.isArray(p.evidence)) return fail('invalid_compiled_program', path);
    seen.add(p.id);
    if (p.bindings.length > 128 || p.bindings.some(b => !isObject(b)
        || !keysOnly(b, ['event','actionId','requires','inert','authorized'])
        || b.inert !== true || b.authorized !== false
        || typeof b.event !== 'string' || !Object.hasOwn(EVENT_MAP, b.event)
        || !Array.isArray(b.requires) || JSON.stringify(b.requires) !== JSON.stringify(p.requires)
        || typeof b.actionId !== 'string')) return fail('unsafe_rust_binding', `${path}.bindings`);
    if (p.bindings.length && (!p.requires.length || p.requires.length > 16
        || !Array.isArray(options.activeScopes)
        || p.requires.some(scope => !options.activeScopes.includes(scope)))) {
      return fail('missing_active_scope', `${path}.requires`);
    }
    if (p.bindings.some(b => !Array.isArray(options.actions)
        || !options.actions.some(a => a?.id === b.actionId.slice(0, b.actionId.lastIndexOf('@'))
            && a.mutates === false))) return fail('read_only_action_required', `${path}.bindings`);
    const converted = {
      schema: COMMENT_PROGRAM_SCHEMA, compilerVersion: doc.compilerVersion,
      sourceMap: { path: p.sourceMap.path, lineStart: p.sourceMap.line,
        lineEnd: p.sourceMap.line, digest: p.sourceMap.digest },
      config: p.wikiProgram.config,
      bindings: p.bindings.map(b => ({ id: b.event, event: EVENT_MAP[b.event],
        actionId: b.actionId, requiredScopes: [...b.requires], args: {} })),
      diagnostics: [],
    };
    const checked = validateCommentProgram(converted, options);
    if (!checked.ok) return { ok: false, errors: checked.errors.map(e =>
      ({ ...e, path: `${path}.${e.path}` })) };
    all.push(converted);
  }
  return { ok: true, programs: all, compilerVersion: doc.compilerVersion,
    source: { ...doc.source }, verifiedSourceBytes: false };
}

/** Return sorted per-program HQ previews without any database writes. */
export function previewRustCommentPrograms(db, raw, options = {}) {
  const loaded = loadRustCommentPrograms(raw, { ...options, db });
  if (!loaded.ok) return loaded;
  const verified = verifyRustCommentSource({ source: loaded.source,
    programs: JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)).programs }, options);
  if (!verified.ok) return verified;
  const previews = loaded.programs.map(p => previewCommentProgram(db, p, options));
  if (previews.some(p => !p.ok)) return fail('invalid_wiki_preview');
  return { ok: true, schema: RUST_COMMENT_PROGRAM_SCHEMA,
    source: loaded.source, verifiedSourceBytes: true, sourceVerification: verified,
    previews: previews.sort((a,b) => a.config.id.localeCompare(b.config.id)) };
}

/** Activation still needs the separate reviewed preview receipt and owner approval. */
export function activateRustCommentProgram(db, raw, programId, options = {}) {
  if (options.ownerConfirmed !== true) return { ok: false, reason: 'owner_confirmation_required' };
  const loaded = loadRustCommentPrograms(raw, { ...options, db });
  if (!loaded.ok) return { ok: false, reason: 'invalid_compiler_output', errors: loaded.errors };
  const verified = verifyRustCommentSource({
    source: loaded.source,
    programs: typeof raw === 'string' ? JSON.parse(raw).programs : raw.programs,
  }, options);
  if (!verified.ok) return { ok: false, reason: 'source_not_verified', errors: verified.errors };
  const found = loaded.programs.find(p => p.config.id === programId);
  if (!found) return { ok: false, reason: 'unknown_program' };
  return activateCommentProgram(db, found, options);
}

export { rollbackCommentProgram as rollbackRustCommentProgram };
