// Authorized development-source adapters.
// The caller must supply authorization; nothing here connects to GitHub, invokes
// gh/git, reads user-home credentials, or touches a working tree.
//   createGitObjectAdapter      wraps caller-injected Git-object functions.
//   createGitObjectStoreAdapter reads a caller-named local Git object database
//                               (loose objects and packfiles), read-only, with no
//                               Git executable, no network and no checkout.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { assertSha, fail, safeRef } from './common.mjs';

const ADAPTER_METHODS = Object.freeze(['resolveRef', 'readCommit', 'listTree', 'readBlob']);
const MAX_OBJECT_BYTES = 32 * 1024 * 1024;
const MAX_DELTA_DEPTH = 64;
const MAX_TREE_DEPTH = 64;
const PACK_TYPES = Object.freeze({ 1: 'commit', 2: 'tree', 3: 'blob', 4: 'tag' });
const SHA40 = /^[0-9a-f]{40}$/;

/** A caller-supplied boolean, a partial object or an absent adapter is never authority. */
export function assertVerifiedAdapter(adapter) {
  if (!adapter || adapter.authorizedDevelopmentSource !== true ||
      ADAPTER_METHODS.some(method => typeof adapter[method] !== 'function')) {
    fail('SOURCE_UNAUTHORIZED', 'adapter_methods_missing');
  }
  return adapter;
}

export function createGitObjectAdapter({ resolveRef, readCommit, listTree, readBlob } = {}) {
  return Object.freeze(assertVerifiedAdapter({
    kind: 'verified-git-objects',
    authorizedDevelopmentSource: true,
    resolveRef: async input => resolveRef(input),
    readCommit: async input => readCommit(input),
    listTree: async input => listTree(input),
    readBlob: async input => readBlob(input),
  }));
}

/**
 * Read-only Git-object adapter over an explicit local object database.
 * Every object is identified by re-hashing its inflated content, so a damaged or
 * substituted pack entry fails closed instead of being trusted by offset alone.
 * Missing objects resolve to null; the caller (snapshots.mjs) reports them as
 * unavailable rather than as an empty repository.
 */
export function createGitObjectStoreAdapter({ gitDir, maxObjectBytes = MAX_OBJECT_BYTES } = {}) {
  if (typeof gitDir !== 'string' || !gitDir || !existsSync(join(gitDir, 'objects')) ||
      !existsSync(join(gitDir, 'HEAD'))) fail('SOURCE_UNAUTHORIZED', 'invalid_git_dir');
  if (!Number.isSafeInteger(maxObjectBytes) || maxObjectBytes < 1 ||
      maxObjectBytes > MAX_OBJECT_BYTES) fail('RESOURCE_LIMIT', 'invalid_object_limit');
  const objects = new Map();
  const trees = new Map();
  let packs = null;
  let packedRefs = null;

  const identity = (type, body) => createHash('sha1')
    .update(type + ' ' + body.length + '\0').update(body).digest('hex');

  function inflate(data) {
    let out;
    try {
      out = inflateSync(data, { maxOutputLength: maxObjectBytes });
    } catch (error) {
      if (error?.code === 'ERR_BUFFER_TOO_LARGE') fail('RESOURCE_LIMIT', 'object_too_large');
      fail('DIGEST_CONFLICT', 'unreadable_object');
    }
    if (out.length > maxObjectBytes) fail('RESOURCE_LIMIT', 'object_too_large');
    return out;
  }
  function parseLoose(raw, sha) {
    const nul = raw.indexOf(0);
    if (nul < 0) fail('DIGEST_CONFLICT', 'malformed_object');
    const header = raw.subarray(0, nul).toString('utf8');
    const space = header.indexOf(' ');
    if (space < 1) fail('DIGEST_CONFLICT', 'malformed_object');
    const type = header.slice(0, space);
    const size = Number(header.slice(space + 1));
    if (!['commit', 'tree', 'blob', 'tag'].includes(type)) {
      fail('DIGEST_CONFLICT', 'unsupported_loose_type');
    }
    const body = raw.subarray(nul + 1);
    if (body.length !== size) fail('DIGEST_CONFLICT', 'object_size_mismatch');
    if (identity(type, body) !== sha) fail('DIGEST_CONFLICT', 'object_sha_mismatch');
    return { type, body };
  }
  function readLoose(sha) {
    const path = join(gitDir, 'objects', sha.slice(0, 2), sha.slice(2));
    if (!existsSync(path)) return null;
    try {
      return parseLoose(inflate(readFileSync(path)), sha);
    } catch (error) {
      if (error?.code === 'DIGEST_CONFLICT' || error?.code === 'RESOURCE_LIMIT') throw error;
      fail('DIGEST_CONFLICT', 'unreadable_loose_object');
    }
  }
  function loadPacks() {
    if (packs) return packs;
    const dir = join(gitDir, 'objects', 'pack');
    let names = [];
    try { names = readdirSync(dir); } catch { names = []; }
    packs = [];
    for (const name of names) {
      if (!name.endsWith('.idx')) continue;
      const idx = readFileSync(join(dir, name));
      if (idx.length < 8 + 1024 || idx.readUInt32BE(0) !== 0xff744f63 ||
          idx.readUInt32BE(4) !== 2) fail('INCOMPLETE_SCAN', 'unsupported_pack_index');
      const count = idx.readUInt32BE(8 + 255 * 4);
      const shaStart = 8 + 1024;
      const crcStart = shaStart + count * 20;
      const offStart = crcStart + count * 4;
      const largeStart = offStart + count * 4;
      // 20-byte pack checksum + 20-byte index checksum terminate the file; large
      // offsets live between the offset table and that trailer.
      const trailer = 40;
      if (idx.length < largeStart + trailer) fail('INCOMPLETE_SCAN', 'truncated_pack_index');
      const largeEnd = idx.length - trailer;
      const offsets = new Map();
      for (let i = 0; i < count; i++) {
        const sha = idx.subarray(shaStart + i * 20, shaStart + (i + 1) * 20).toString('hex');
        const raw = idx.readUInt32BE(offStart + i * 4);
        let offset = raw;
        if (raw & 0x80000000) {
          const at = largeStart + (raw & 0x7fffffff) * 8;
          if (at < largeStart || at + 8 > largeEnd) fail('INCOMPLETE_SCAN', 'truncated_pack_index');
          offset = Number(idx.readBigUInt64BE(at));
        }
        offsets.set(sha, offset);
      }
      const packPath = join(dir, name.slice(0, -4) + '.pack');
      let data = null;
      packs.push({ offsets, read: () => (data ??= readFileSync(packPath)) });
    }
    return packs;
  }
  function applyDelta(base, delta, type, depth) {
    if (depth > MAX_DELTA_DEPTH) fail('RESOURCE_LIMIT', 'delta_depth');
    let p = 0;
    const varint = () => {
      let value = 0, shift = 0, byte;
      do {
        if (p >= delta.length) fail('DIGEST_CONFLICT', 'truncated_delta');
        byte = delta[p++];
        value += (byte & 0x7f) * Math.pow(2, shift);
        shift += 7;
      } while (byte & 0x80);
      return value;
    };
    const baseSize = varint();
    const resultSize = varint();
    if (baseSize !== base.length || resultSize > maxObjectBytes) {
      fail('DIGEST_CONFLICT', 'delta_size');
    }
    const out = Buffer.allocUnsafe(resultSize);
    let written = 0;
    while (p < delta.length) {
      const opcode = delta[p++];
      if (opcode & 0x80) {
        let offset = 0, size = 0;
        if (opcode & 0x01) offset |= delta[p++];
        if (opcode & 0x02) offset |= delta[p++] << 8;
        if (opcode & 0x04) offset |= delta[p++] << 16;
        if (opcode & 0x08) offset |= delta[p++] << 24;
        if (opcode & 0x10) size |= delta[p++];
        if (opcode & 0x20) size |= delta[p++] << 8;
        if (opcode & 0x40) size |= delta[p++] << 16;
        if (size === 0) size = 0x10000;
        if (offset + size > base.length || written + size > resultSize) {
          fail('DIGEST_CONFLICT', 'delta_copy');
        }
        base.copy(out, written, offset, offset + size);
        written += size;
      } else if (opcode > 0) {
        if (written + opcode > resultSize) fail('DIGEST_CONFLICT', 'delta_insert');
        delta.copy(out, written, p, p + opcode);
        p += opcode;
        written += opcode;
      } else {
        fail('DIGEST_CONFLICT', 'delta_opcode_zero');
      }
    }
    if (written !== resultSize) fail('DIGEST_CONFLICT', 'delta_result_size');
    return { type, body: out };
  }
  function readPackEntry(pack, offset, depth) {
    if (depth > MAX_DELTA_DEPTH) fail('RESOURCE_LIMIT', 'delta_depth');
    const buf = pack.read();
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= buf.length) {
      fail('DIGEST_CONFLICT', 'invalid_pack_offset');
    }
    let p = offset;
    let byte = buf[p++];
    const type = (byte >> 4) & 7;
    let size = byte & 15;
    let shift = 4;
    while (byte & 0x80) {
      byte = buf[p++];
      size |= (byte & 0x7f) * Math.pow(2, shift);
      shift += 7;
    }
    if (type === 6) {
      byte = buf[p++];
      let distance = byte & 0x7f;
      while (byte & 0x80) {
        byte = buf[p++];
        distance = ((distance + 1) << 7) | (byte & 0x7f);
      }
      const baseOffset = offset - distance;
      if (distance <= 0 || baseOffset < 0 || baseOffset >= offset) {
        fail('DIGEST_CONFLICT', 'invalid_offset_delta');
      }
      const base = readPackEntry(pack, baseOffset, depth + 1);
      return applyDelta(base.body, inflate(buf.subarray(p)), base.type, depth + 1);
    }
    if (type === 7) {
      const baseSha = buf.subarray(p, p + 20).toString('hex');
      p += 20;
      const base = readObject(baseSha, depth + 1);
      if (!base) fail('INCOMPLETE_SCAN', 'delta_base_unavailable');
      return applyDelta(base.body, inflate(buf.subarray(p)), base.type, depth + 1);
    }
    const name = PACK_TYPES[type];
    if (!name) fail('INCOMPLETE_SCAN', 'unsupported_pack_object');
    return { type: name, body: inflate(buf.subarray(p)) };
  }
  function readObject(sha, depth = 0) {
    if (!SHA40.test(String(sha))) fail('PIN_NOT_FOUND', 'invalid_object_sha');
    const cached = objects.get(sha);
    if (cached) return cached;
    let found = readLoose(sha);
    if (!found) {
      for (const pack of loadPacks()) {
        const offset = pack.offsets.get(sha);
        if (offset === undefined) continue;
        found = readPackEntry(pack, offset, depth);
        break;
      }
    }
    if (!found) return null;
    if (identity(found.type, found.body) !== sha) fail('DIGEST_CONFLICT', 'object_sha_mismatch');
    if (found.type !== 'blob') objects.set(sha, found);
    return found;
  }
  function readPackedRefs() {
    if (packedRefs) return packedRefs;
    const map = new Map();
    try {
      for (const line of readFileSync(join(gitDir, 'packed-refs'), 'utf8').split('\n')) {
        const match = /^([0-9a-f]{40}) (refs\/.+)$/.exec(line.trim());
        if (match && !map.has(match[2])) map.set(match[2], match[1]);
      }
    } catch { /* no packed refs */ }
    packedRefs = map;
    return map;
  }
  function resolveRef(ref, depth = 0) {
    const name = safeRef(ref);
    if (depth > 8) fail('SOURCE_UNAUTHORIZED', 'ref_symlink_depth');
    try {
      const value = readFileSync(join(gitDir, name), 'utf8').trim();
      if (SHA40.test(value)) return value;
      if (value.startsWith('ref: ')) return resolveRef(value.slice(5).trim(), depth + 1);
    } catch { /* loose ref absent: fall through to packed refs */ }
    return readPackedRefs().get(name) ?? null;
  }
  function flattenTree(treeSha, depth = 0) {
    const cached = trees.get(treeSha);
    if (cached) return cached;
    if (depth > MAX_TREE_DEPTH) fail('RESOURCE_LIMIT', 'tree_depth');
    const object = readObject(treeSha);
    if (!object || object.type !== 'tree') fail('PIN_NOT_FOUND', 'tree_unavailable');
    const body = object.body;
    const flat = [];
    let i = 0;
    while (i < body.length) {
      const space = body.indexOf(32, i);
      if (space < 0) fail('DIGEST_CONFLICT', 'malformed_tree');
      const nul = body.indexOf(0, space + 1);
      if (nul < 0 || nul + 21 > body.length) fail('DIGEST_CONFLICT', 'malformed_tree');
      const mode = body.subarray(i, space).toString('utf8');
      const name = body.subarray(space + 1, nul).toString('utf8');
      const sha = body.subarray(nul + 1, nul + 21).toString('hex');
      i = nul + 21;
      if (!SHA40.test(sha)) fail('DIGEST_CONFLICT', 'malformed_tree_sha');
      if (mode === '40000' || mode === '040000') {
        for (const child of flattenTree(sha, depth + 1)) {
          flat.push({ path: name + '/' + child.path, type: child.type, mode: child.mode,
            sha: child.sha, size: child.size });
        }
      } else {
        flat.push({ path: name, type: mode === '160000' ? 'commit' : 'blob', mode, sha, size: null });
      }
    }
    trees.set(treeSha, flat);
    return flat;
  }
  return Object.freeze({
    kind: 'verified-git-object-store',
    authorizedDevelopmentSource: true,
    resolveRef: async input => {
      const commitSha = resolveRef(input?.ref);
      return commitSha ? { commitSha } : null;
    },
    readCommit: async input => {
      const sha = assertSha(input?.commitSha);
      const object = readObject(sha);
      if (!object || object.type !== 'commit') return null;
      const lines = object.body.toString('utf8').split('\n');
      const treeLine = lines.find(line => line.startsWith('tree '));
      if (!treeLine || !SHA40.test(treeLine.slice(5).trim())) fail('DIGEST_CONFLICT', 'commit_tree_missing');
      const parents = lines.filter(line => line.startsWith('parent '))
        .map(line => line.slice(7).trim()).filter(value => SHA40.test(value));
      return { sha, treeSha: treeLine.slice(5).trim(), parents,
        repoIdentity: input?.repoIdentity ?? null };
    },
    listTree: async input => {
      const commitSha = assertSha(input?.commitSha);
      const rootTreeSha = assertSha(input?.rootTreeSha);
      const commit = readObject(commitSha);
      if (!commit || commit.type !== 'commit') fail('PIN_NOT_FOUND', 'commit_unavailable');
      const treeLine = commit.body.toString('utf8').split('\n').find(line => line.startsWith('tree '));
      if (!treeLine || treeLine.slice(5).trim() !== rootTreeSha) fail('PIN_MOVED', 'commit_tree_mismatch');
      const flat = flattenTree(rootTreeSha);
      const pageSize = input?.pageSize;
      if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 5000) {
        fail('RESOURCE_LIMIT', 'invalid_page_size');
      }
      const start = input?.cursor == null ? 0 : Number(input.cursor);
      if (!Number.isSafeInteger(start) || start < 0 || start > flat.length) {
        fail('INCOMPLETE_SCAN', 'invalid_pagination_cursor');
      }
      return Object.freeze({
        verified: true,
        entries: flat.slice(start, start + pageSize),
        nextCursor: start + pageSize < flat.length ? String(start + pageSize) : null,
        truncated: false,
      });
    },
    readBlob: async input => {
      const blobSha = assertSha(input?.blobSha);
      const object = readObject(blobSha);
      if (!object || object.type !== 'blob') return null;
      if (Number.isSafeInteger(input?.maxBytes) && object.body.length > input.maxBytes) {
        fail('RESOURCE_LIMIT', 'blob_size_limit');
      }
      return object.body;
    },
  });
}

// This deliberate non-adapter prevents ambient source access.
export const NO_SOURCE_ADAPTER = Object.freeze({ kind: 'disabled', authorizedDevelopmentSource: false });