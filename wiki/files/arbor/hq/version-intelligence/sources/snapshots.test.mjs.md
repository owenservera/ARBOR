# File: hq/version-intelligence/sources/snapshots.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/snapshots.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9457 B |
| Lines | 193 |
| Hash | f82ef051a264 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| scope | function | 7 | no | const scope = (f, overrides = {}) =&gt; ({ ...f.scope, ...overrides }); |
| pin | function | 8 | no | const pin = (f, overrides = {}) =&gt; resolvePin(scope(f, overrides), { adapter: f.adapter, authorize: f.authorize, acquiredAt: &#39;2026-11-12T00:00:00.000Z&#39;, }); |
| snapshot | function | 11 | no | const snapshot = (f, p, overrides = {}) =&gt; snapshotAt(p, { adapter: f.adapter, authorize: f.authorize, ...overrides, }); |
| f | const | 16 | no | const f = syntheticSource(); |
| p | const | 17 | no | const p = await pin(f); |
| f | const | 29 | no | const f = syntheticSource(); |
| pins | const | 30 | no | const pins = await Promise.all([&#39;v1&#39;, &#39;v2&#39;, &#39;v3&#39;].map(ref =&gt; pin(f, { ref }))); |
| other | const | 33 | no | const other = await pin(f, { ref: &#39;v1&#39;, repo: &#39;Other/ARBOR&#39; }); |
| sub | const | 35 | no | const sub = await pin(f, { ref: &#39;v1&#39;, subPath: &#39;src&#39; }); |
| a | const | 40 | no | const a = syntheticSource(), b = syntheticSource({ flipped: true }); |
| pa | const | 41 | no | const pa = await pin(a), pb = await pin(b); |
| ma | const | 42 | no | const ma = await snapshot(a, pa, { limits: { pageSize: 2 } }); |
| mb | const | 43 | no | const mb = await snapshot(b, pb, { limits: { pageSize: 2 } }); |
| f | const | 54 | no | const f = syntheticSource(); |
| p | const | 55 | no | const p = await pin(f); |
| m | const | 56 | no | const m = await snapshot(f, p, { inspectContent: true }); |
| byPath | function | 57 | no | const byPath = name =&gt; m.entries.find(e =&gt; e.path === name); |
| bytes | const | 70 | no | const bytes = await readPinnedBlob(p, &#39;src/first.mjs&#39;, { adapter: f.adapter, authorize: f.authorize, manifest: m, }); |
| f | const | 77 | no | const f = syntheticSource(); |
| p | const | 78 | no | const p = await pin(f, { ref: &#39;v2&#39; }); |
| m | const | 79 | no | const m = await snapshot(f, p, { inspectContent: true }); |
| sub | const | 80 | no | const sub = m.entries.find(e =&gt; e.path === &#39;vendor/submodule&#39;); |
| f | const | 86 | no | const f = syntheticSource(); |
| p | const | 94 | no | const p = await pin(f); |
| f | const | 99 | no | const f = syntheticSource({ malicious: { path: &#39;../outside&#39;, type: &#39;blob&#39;, mode: &#39;100644&#39;, sha: &#39;e&#39;.repeat(40), size: 1 } }); |
| p | const | 101 | no | const p = await pin(f); |
| f | const | 106 | no | const f = syntheticSource(); |
| p | const | 107 | no | const p = await pin(f); |
| m | const | 108 | no | const m = await snapshot(f, p, { limits: { maxEntries: 2, pageSize: 2 } }); |
| onlySrc | const | 114 | no | const onlySrc = await pin(f, { subPath: &#39;src&#39; }); |
| srcManifest | const | 115 | no | const srcManifest = await snapshot(f, onlySrc); |
| f | const | 120 | no | const f = syntheticSource(); |
| p | const | 121 | no | const p = await pin(f); |
| old | const | 124 | no | const old = await snapshot(f, p); |
| tampered | const | 126 | no | const tampered = { ...old, entries: [...old.entries, { ...old.entries[0], mode: &#39;evil&#39; }] }; |
| f | const | 132 | no | const f = syntheticSource(); |
| p | const | 133 | no | const p = await pin(f); |
| m | const | 137 | no | const m = await snapshot(f, p); |
| original | const | 138 | no | const original = f.adapter.readBlob; |
| corrupt | const | 139 | no | const corrupt = { ...f.adapter, readBlob: async i =&gt; { |
| f | const | 149 | no | const f = syntheticSource(); |
| p | const | 150 | no | const p = await pin(f); |
| m | const | 151 | no | const m = await snapshot(f, p); |
| f | const | 158 | no | const f = syntheticSource(); |
| p | const | 159 | no | const p = await pin(f); |
| pageAuthorizations | variable | 160 | no | let pageAuthorizations = 0; |
| f | const | 174 | no | const f = syntheticSource(); |
| bad | const | 176 | no | const bad = syntheticSource({ malicious: record }); |
| p | const | 177 | no | const p = await pin(bad); |
| f | const | 182 | no | const f = syntheticSource(); |
| p | const | 183 | no | const p = await pin(f); |
| m | const | 184 | no | const m = await snapshot(f, p, { limits: { maxBlobBytes: 16 } }); |
| oversized | const | 187 | no | const oversized = m.entries.filter(e =&gt; e.excludedReason === &#39;large_blob&#39;); |
| uninspected | const | 190 | no | const uninspected = m.entries.filter(e =&gt; e.excludedReason === null); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./snapshots.mjs | import | 3 | [hq/version-intelligence/sources/snapshots.mjs](./snapshots.mjs.md) |
| ./fixtures.mjs | import | 4 | [hq/version-intelligence/sources/fixtures.mjs](./fixtures.mjs.md) |
| ./common.mjs | import | 5 | [hq/version-intelligence/sources/common.mjs](./common.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePin, snapshotAt, verifyPin, readPinnedBlob, manifestDigestOf } from './snapshots.mjs';
import { syntheticSource, SYNTHETIC_SHAS } from './fixtures.mjs';
import { gitBlobSha, safePath } from './common.mjs';

const scope = (f, overrides = {}) => ({ ...f.scope, ...overrides });
const pin = (f, overrides = {}) => resolvePin(scope(f, overrides), {
  adapter: f.adapter, authorize: f.authorize, acquiredAt: '2026-11-12T00:00:00.000Z',
});
const snapshot = (f, p, overrides = {}) => snapshotAt(p, {
  adapter: f.adapter, authorize: f.authorize, ...overrides,
});

test('T01 immutable branch pin, frozen root tree and strict 40hex identity', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  assert.equal(p.resolvedCommitSha, SYNTHETIC_SHAS.v1);
  assert.equal(p.rootTreeSha, '1'.repeat(40));
  assert.equal(p.scope, 'development');
  assert.equal(p.completeness, 'partial');
  assert.equal(await verifyPin(p, { adapter: f.adapter, authorize: f.authorize }), true);
  assert(Object.isFrozen(p));
  await assert.rejects(pin(f, { sha: 'not-a-sha', ref: null }), { code: 'PIN_NOT_FOUND' });
  await assert.rejects(pin(f, { ref: 'missing' }), { code: 'PIN_NOT_FOUND' });
});

test('T02 same repo at three SHAs and same repo name in separate namespaces', async () => {
  const f = syntheticSource();
  const pins = await Promise.all(['v1', 'v2', 'v3'].map(ref => pin(f, { ref })));
  assert.equal(new Set(pins.map(p => p.pinId)).size, 3);
  assert.equal(new Set(pins.map(p => p.repoIdentity)).size, 1);
  const other = await pin(f, { ref: 'v1', repo: 'Other/ARBOR' });
  assert.notEqual(other.pinId, pins[0].pinId);
  const sub = await pin(f, { ref: 'v1', subPath: 'src' });
  assert.notEqual(sub.pinId, pins[0].pinId);
});

test('T04/T05 pinned manifests ignore dirty worktree, repeat, input order and paginate', async () => {
  const a = syntheticSource(), b = syntheticSource({ flipped: true });
  const pa = await pin(a), pb = await pin(b);
  const ma = await snapshot(a, pa, { limits: { pageSize: 2 } });
  const mb = await snapshot(b, pb, { limits: { pageSize: 2 } });
  assert.equal(ma.completeness, 'complete');
  assert.equal(ma.manifestDigest, mb.manifestDigest);
  assert.equal(ma.manifestDigest, manifestDigestOf(ma));
  assert(ma.entries.length >= 6);
  assert(a.calls.tree.length >= 3);
  assert.deepEqual(a.calls.refs, ['main']); // snapshot never resolves HEAD again
  assert.equal(ma.entries.some(e => e.path === 'UNTRACKED_DIRTY.mjs'), false);
});

test('T07 inspect real Git blob bytes for symlink, LFS pointer and binary', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  const m = await snapshot(f, p, { inspectContent: true });
  const byPath = name => m.entries.find(e => e.path === name);
  assert.equal(byPath('links/outside').kind, 'symlink');
  assert.equal(byPath('links/outside').symlinkTarget, '../../private');
  assert.equal(byPath('assets/big.dat').parseStatus, 'lfs_pointer');
  assert.equal(byPath('assets/binary.bin').parseStatus, 'binary');
  assert.equal(byPath('.env.production').excludedReason, 'sensitive_path');
  assert(!f.calls.blobs.includes(byPath('.env.production').blobSha));
  await assert.rejects(readPinnedBlob(p, '.env.production', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(readPinnedBlob(p, 'links/outside', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  const bytes = await readPinnedBlob(p, 'src/first.mjs', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  });
  assert.equal(gitBlobSha(bytes), byPath('src/first.mjs').blobSha);
});

test('T07 submodule gitlink is metadata, never followed', async () => {
  const f = syntheticSource();
  const p = await pin(f, { ref: 'v2' });
  const m = await snapshot(f, p, { inspectContent: true });
  const sub = m.entries.find(e => e.path === 'vendor/submodule');
```

_First 80 of 194 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
