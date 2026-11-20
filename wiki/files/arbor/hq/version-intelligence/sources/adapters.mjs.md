# File: hq/version-intelligence/sources/adapters.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/adapters.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14724 B |
| Lines | 336 |
| Hash | ff7340a3bf2b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ADAPTER_METHODS | const | 14 | no | const ADAPTER_METHODS = Object.freeze([&#39;resolveRef&#39;, &#39;readCommit&#39;, &#39;listTree&#39;, &#39;readBlob&#39;]); |
| MAX_OBJECT_BYTES | const | 15 | no | const MAX_OBJECT_BYTES = 32 * 1024 * 1024; |
| MAX_DELTA_DEPTH | const | 16 | no | const MAX_DELTA_DEPTH = 64; |
| MAX_TREE_DEPTH | const | 17 | no | const MAX_TREE_DEPTH = 64; |
| PACK_TYPES | const | 18 | no | const PACK_TYPES = Object.freeze({ 1: &#39;commit&#39;, 2: &#39;tree&#39;, 3: &#39;blob&#39;, 4: &#39;tag&#39; }); |
| SHA40 | const | 19 | no | const SHA40 = /^[0-9a-f]{40}$/; |
| assertVerifiedAdapter | function | 22 | yes | export function assertVerifiedAdapter(adapter) { |
| createGitObjectAdapter | function | 30 | yes | export function createGitObjectAdapter({ resolveRef, readCommit, listTree, readBlob } = {}) { |
| createGitObjectStoreAdapter | function | 48 | yes | export function createGitObjectStoreAdapter({ gitDir, maxObjectBytes = MAX_OBJECT_BYTES } = {}) { |
| objects | const | 53 | no | const objects = new Map(); |
| trees | const | 54 | no | const trees = new Map(); |
| packs | variable | 55 | no | let packs = null; |
| packedRefs | variable | 56 | no | let packedRefs = null; |
| identity | function | 58 | no | const identity = (type, body) =&gt; createHash(&#39;sha1&#39;) |
| inflate | function | 61 | no | function inflate(data) { |
| out | const | 62 | no | const out = inflateSync(data); |
| parseLoose | function | 66 | no | function parseLoose(raw, sha) { |
| nul | const | 67 | no | const nul = raw.indexOf(0); |
| header | const | 69 | no | const header = raw.subarray(0, nul).toString(&#39;utf8&#39;); |
| space | const | 70 | no | const space = header.indexOf(&#39; &#39;); |
| size | const | 72 | no | const size = Number(header.slice(space + 1)); |
| body | const | 76 | no | const body = raw.subarray(nul + 1); |
| readLoose | function | 81 | no | function readLoose(sha) { |
| path | const | 82 | no | const path = join(gitDir, &#39;objects&#39;, sha.slice(0, 2), sha.slice(2)); |
| loadPacks | function | 91 | no | function loadPacks() { |
| dir | const | 93 | no | const dir = join(gitDir, &#39;objects&#39;, &#39;pack&#39;); |
| names | variable | 94 | no | let names = []; |
| idx | const | 99 | no | const idx = readFileSync(join(dir, name)); |
| count | const | 102 | no | const count = idx.readUInt32BE(8 + 255 * 4); |
| shaStart | const | 103 | no | const shaStart = 8 + 1024; |
| crcStart | const | 104 | no | const crcStart = shaStart + count * 20; |
| offStart | const | 105 | no | const offStart = crcStart + count * 4; |
| largeStart | const | 106 | no | const largeStart = offStart + count * 4; |
| offsets | const | 108 | no | const offsets = new Map(); |
| sha | const | 110 | no | const sha = idx.subarray(shaStart + i * 20, shaStart + (i + 1) * 20).toString(&#39;hex&#39;); |
| raw | const | 111 | no | const raw = idx.readUInt32BE(offStart + i * 4); |
| offset | const | 112 | no | const offset = raw &amp; 0x80000000 |
| packPath | const | 117 | no | const packPath = join(dir, name.slice(0, -4) + &#39;.pack&#39;); |
| data | variable | 118 | no | let data = null; |
| applyDelta | function | 123 | no | function applyDelta(base, delta, type, depth) { |
| p | variable | 125 | no | let p = 0; |
| varint | function | 126 | no | const varint = () =&gt; { |
| value | variable | 127 | no | let value = 0, shift = 0, byte; |
| baseSize | const | 136 | no | const baseSize = varint(); |
| resultSize | const | 137 | no | const resultSize = varint(); |
| out | const | 141 | no | const out = Buffer.allocUnsafe(resultSize); |
| written | variable | 142 | no | let written = 0; |
| opcode | const | 144 | no | const opcode = delta[p++]; |
| offset | variable | 146 | no | let offset = 0, size = 0; |
| readPackEntry | function | 172 | no | function readPackEntry(pack, offset, depth) { |
| buf | const | 174 | no | const buf = pack.read(); |
| p | variable | 178 | no | let p = offset; |
| byte | variable | 179 | no | let byte = buf[p++]; |
| size | variable | 181 | no | let size = byte &amp; 15; |
| shift | variable | 182 | no | let shift = 4; |
| distance | variable | 190 | no | let distance = byte &amp; 0x7f; |
| baseOffset | const | 195 | no | const baseOffset = offset - distance; |
| base | const | 199 | no | const base = readPackEntry(pack, baseOffset, depth + 1); |
| baseSha | const | 203 | no | const baseSha = buf.subarray(p, p + 20).toString(&#39;hex&#39;); |
| base | const | 205 | no | const base = readObject(baseSha, depth + 1); |
| name | const | 209 | no | const name = PACK_TYPES[type]; |
| readObject | function | 213 | no | function readObject(sha, depth = 0) { |
| cached | const | 215 | no | const cached = objects.get(sha); |
| found | variable | 217 | no | let found = readLoose(sha); |
| offset | const | 220 | no | const offset = pack.offsets.get(sha); |
| readPackedRefs | function | 231 | no | function readPackedRefs() { |
| map | const | 233 | no | const map = new Map(); |
| resolveRef | function | 243 | no | function resolveRef(ref, depth = 0) { |
| name | const | 244 | no | const name = safeRef(ref); |
| value | const | 247 | no | const value = readFileSync(join(gitDir, name), &#39;utf8&#39;).trim(); |
| flattenTree | function | 253 | no | function flattenTree(treeSha, depth = 0) { |
| cached | const | 254 | no | const cached = trees.get(treeSha); |
| object | const | 257 | no | const object = readObject(treeSha); |
| body | const | 259 | no | const body = object.body; |
| flat | const | 260 | no | const flat = []; |
| i | variable | 261 | no | let i = 0; |
| space | const | 263 | no | const space = body.indexOf(32, i); |
| nul | const | 265 | no | const nul = body.indexOf(0, space + 1); |
| mode | const | 267 | no | const mode = body.subarray(i, space).toString(&#39;utf8&#39;); |
| name | const | 268 | no | const name = body.subarray(space + 1, nul).toString(&#39;utf8&#39;); |
| sha | const | 269 | no | const sha = body.subarray(nul + 1, nul + 21).toString(&#39;hex&#39;); |
| sha | const | 289 | no | const sha = assertSha(input?.commitSha); |
| object | const | 290 | no | const object = readObject(sha); |
| lines | const | 292 | no | const lines = object.body.toString(&#39;utf8&#39;).split(&#39;\\n&#39;); |
| treeLine | const | 293 | no | const treeLine = lines.find(line =&gt; line.startsWith(&#39;tree &#39;)); |
| parents | const | 295 | no | const parents = lines.filter(line =&gt; line.startsWith(&#39;parent &#39;)) |
| commitSha | const | 301 | no | const commitSha = assertSha(input?.commitSha); |
| rootTreeSha | const | 302 | no | const rootTreeSha = assertSha(input?.rootTreeSha); |
| commit | const | 303 | no | const commit = readObject(commitSha); |
| treeLine | const | 305 | no | const treeLine = commit.body.toString(&#39;utf8&#39;).split(&#39;\\n&#39;).find(line =&gt; line.startsWith(&#39;tree &#39;)); |
| flat | const | 307 | no | const flat = flattenTree(rootTreeSha); |
| pageSize | const | 308 | no | const pageSize = input?.pageSize; |
| start | const | 312 | no | const start = input?.cursor == null ? 0 : Number(input.cursor); |
| blobSha | const | 324 | no | const blobSha = assertSha(input?.blobSha); |
| object | const | 325 | no | const object = readObject(blobSha); |
| NO_SOURCE_ADAPTER | const | 336 | yes | export const NO_SOURCE_ADAPTER = Object.freeze({ kind: &#39;disabled&#39;, authorizedDevelopmentSource: false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |
| node:fs | import | 9 | external |
| node:path | import | 10 | external |
| node:zlib | import | 11 | external |
| ./common.mjs | import | 12 | [hq/version-intelligence/sources/common.mjs](./common.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/test/hvi-live-source-composition.test.mjs](../../test/hvi-live-source-composition.test.mjs.md) | ../version-intelligence/sources/adapters.mjs |
| [hq/version-intelligence/integration/index.mjs](../integration/index.mjs.md) | ../sources/adapters.mjs |
| [hq/version-intelligence/sources/fixtures.mjs](./fixtures.mjs.md) | ./adapters.mjs |
| [hq/version-intelligence/sources/index.mjs](./index.mjs.md) | ./adapters.mjs |
| [hq/version-intelligence/sources/snapshots.mjs](./snapshots.mjs.md) | ./adapters.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
    const out = inflateSync(data);
    if (out.length > maxObjectBytes) fail('RESOURCE_LIMIT', 'object_too_large');
    return out;
  }
  function parseLoose(raw, sha) {
    const nul = raw.indexOf(0);
    if (nul < 0) fail('DIGEST_CONFLICT', 'malformed_object');
    const header = raw.subarray(0, nul).toString('utf8');
    const space = header.indexOf(' ');
    const type = header.slice(0, space);
    const size = Number(header.slice(space + 1));
    if (space < 1 || !['commit', 'tree', 'blob', 'tag'].includes(type)) {
      fail('DIGEST_CONFLICT', 'unsupported_loose_type');
    }
    const body = raw.subarray(nul + 1);
    if (body.length !== size) fail('DIGEST_CONFLICT', 'object_size_mismatch');
    if (identity(type, body) !== sha) fail('DIGEST_CONFLICT', 'object_sha_mismatch');
    return { type, body };
  }
```

_First 80 of 336 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
