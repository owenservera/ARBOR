# File: hq/version-intelligence/sources/fixtures.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/fixtures.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3826 B |
| Lines | 92 |
| Hash | d4dd2d179bbe |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SYNTHETIC_SHAS | const | 5 | yes | export const SYNTHETIC_SHAS = Object.freeze({ v1: &#39;aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&#39;, v2: &#39;bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb&#39;, v3: &#39;cccccccccccccccccccccccccccccccccccccccc&#39;, }); |
| SYNTHETIC_TREES | const | 10 | yes | export const SYNTHETIC_TREES = Object.freeze({ v1: &#39;1111111111111111111111111111111111111111&#39;, v2: &#39;2222222222222222222222222222222222222222&#39;, v3: &#39;3333333333333333333333333333333333333333&#39;, }); |
| syntheticSource | function | 16 | yes | export function syntheticSource({ flipped = false, malicious = null } = {}) { |
| bytes | const | 17 | no | const bytes = new Map(); |
| blob | function | 18 | no | const blob = (path, value, mode = &#39;100644&#39;) =&gt; { |
| data | const | 19 | no | const data = Buffer.isBuffer(value) ? value : Buffer.from(value, &#39;utf8&#39;); |
| sha | const | 20 | no | const sha = gitBlobSha(data); |
| link | const | 24 | no | const link = blob(&#39;links/outside&#39;, &#39;../../private&#39;, &#39;120000&#39;); |
| lfs | const | 25 | no | const lfs = blob(&#39;assets/big.dat&#39;, &#39;version https://git-lfs.github.com/spec/v1\\n&#39; + &#39;oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\\n&#39; + &#39;size 987654321\\n&#39;); |
| secret | const | 29 | no | const secret = blob(&#39;.env.production&#39;, &#39;MUST_NOT_READ_SECRET&#39;); |
| binary | const | 30 | no | const binary = blob(&#39;assets/binary.bin&#39;, Buffer.from([0, 255, 13])); |
| shared | const | 31 | no | const shared = blob(&#39;src/shared.mjs&#39;, &#39;export const shared = 1;\\n&#39;); |
| records | const | 32 | no | const records = { |
| refTable | const | 48 | no | const refTable = new Map([ [&#39;main&#39;, SYNTHETIC_SHAS.v1], [&#39;v1&#39;, SYNTHETIC_SHAS.v1], [&#39;v2&#39;, SYNTHETIC_SHAS.v2], [&#39;v3&#39;, SYNTHETIC_SHAS.v3], |
| commits | const | 54 | no | const commits = new Map([ [SYNTHETIC_SHAS.v1, SYNTHETIC_TREES.v1], [SYNTHETIC_SHAS.v2, SYNTHETIC_TREES.v2], [SYNTHETIC_SHAS.v3, SYNTHETIC_TREES.v3], ]); |
| calls | const | 59 | no | const calls = { blobs: [], tree: [], refs: [] }; |
| adapter | const | 60 | no | const adapter = createGitObjectAdapter({ resolveRef: ({ ref }) =&gt; { calls.refs.push(ref); const commitSha = refTable.get(ref); return commitSha ? { commitSha } : null; |
| commitSha | const | 63 | no | const commitSha = refTable.get(ref); |
| treeSha | const | 67 | no | const treeSha = commits.get(commitSha); |
| items | const | 73 | no | const items = flipped ? [...records[commitSha]].reverse() : records[commitSha]; |
| list | const | 74 | no | const list = malicious ? [...items, malicious] : items; |
| start | const | 75 | no | const start = cursor ? Number(cursor) : 0; |
| page | const | 76 | no | const page = list.slice(start, start + pageSize); |
| next | const | 77 | no | const next = start + pageSize &lt; list.length ? String(start + pageSize) : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./common.mjs | import | 2 | [hq/version-intelligence/sources/common.mjs](./common.mjs.md) |
| ./adapters.mjs | import | 3 | [hq/version-intelligence/sources/adapters.mjs](./adapters.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/hvi-capability.test.mjs](../../../apps/vivim-host/test/hvi-capability.test.mjs.md) | ../../../hq/version-intelligence/sources/fixtures.mjs |
| [apps/vivim-host/test/hvi-source-grant.test.mjs](../../../apps/vivim-host/test/hvi-source-grant.test.mjs.md) | ../../../hq/version-intelligence/sources/fixtures.mjs |
| [hq/test/hvi-mcp-tool.test.mjs](../../test/hvi-mcp-tool.test.mjs.md) | ../version-intelligence/sources/fixtures.mjs |
| [hq/version-intelligence/sources/snapshots.test.mjs](./snapshots.test.mjs.md) | ./fixtures.mjs |
| [tests/hq-version-intelligence/g1-v2-schema.test.mjs](../../../tests/hq-version-intelligence/g1-v2-schema.test.mjs.md) | ../../hq/version-intelligence/sources/fixtures.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/sources/fixtures.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/sources/fixtures.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic synthetic committed Git objects: no checkout, network or donor code.
import { gitBlobSha } from './common.mjs';
import { createGitObjectAdapter } from './adapters.mjs';

export const SYNTHETIC_SHAS = Object.freeze({
  v1: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  v2: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  v3: 'cccccccccccccccccccccccccccccccccccccccc',
});
export const SYNTHETIC_TREES = Object.freeze({
  v1: '1111111111111111111111111111111111111111',
  v2: '2222222222222222222222222222222222222222',
  v3: '3333333333333333333333333333333333333333',
});

export function syntheticSource({ flipped = false, malicious = null } = {}) {
  const bytes = new Map();
  const blob = (path, value, mode = '100644') => {
    const data = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
    const sha = gitBlobSha(data);
    bytes.set(sha, data);
    return { path, mode, sha, type: 'blob', size: data.length };
  };
  const link = blob('links/outside', '../../private', '120000');
  const lfs = blob('assets/big.dat',
    'version https://git-lfs.github.com/spec/v1\n'
    + 'oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'
    + 'size 987654321\n');
  const secret = blob('.env.production', 'MUST_NOT_READ_SECRET');
  const binary = blob('assets/binary.bin', Buffer.from([0, 255, 13]));
  const shared = blob('src/shared.mjs', 'export const shared = 1;\n');
  const records = {
    [SYNTHETIC_SHAS.v1]: [
      blob('src/first.mjs', 'export const version = 1;\n'),
      shared, secret, link, lfs, binary,
    ],
    [SYNTHETIC_SHAS.v2]: [
      blob('src/first.mjs', 'export const version = 2;\n'),
      shared, blob('src/new.mjs', 'export const newThing = true;\n'),
      { path: 'vendor/submodule', type: 'commit', mode: '160000',
        sha: 'dddddddddddddddddddddddddddddddddddddddd', size: null },
    ],
    [SYNTHETIC_SHAS.v3]: [
      blob('src/moved.mjs', 'export const version = 2;\n'),
      shared, blob('src/new.mjs', 'export const newThing = true;\n'),
    ],
  };
  const refTable = new Map([
    ['main', SYNTHETIC_SHAS.v1],
    ['v1', SYNTHETIC_SHAS.v1],
    ['v2', SYNTHETIC_SHAS.v2],
    ['v3', SYNTHETIC_SHAS.v3],
  ]);
  const commits = new Map([
    [SYNTHETIC_SHAS.v1, SYNTHETIC_TREES.v1],
    [SYNTHETIC_SHAS.v2, SYNTHETIC_TREES.v2],
    [SYNTHETIC_SHAS.v3, SYNTHETIC_TREES.v3],
  ]);
  const calls = { blobs: [], tree: [], refs: [] };
  const adapter = createGitObjectAdapter({
    resolveRef: ({ ref }) => {
      calls.refs.push(ref);
      const commitSha = refTable.get(ref);
      return commitSha ? { commitSha } : null;
    },
    readCommit: ({ commitSha }) => {
      const treeSha = commits.get(commitSha);
      return treeSha ? { sha: commitSha, treeSha } : null;
    },
    listTree: ({ commitSha, cursor, pageSize }) => {
      calls.tree.push({ commitSha, cursor });
      if (!records[commitSha]) throw new Error('missing');
      const items = flipped ? [...records[commitSha]].reverse() : records[commitSha];
      const list = malicious ? [...items, malicious] : items;
      const start = cursor ? Number(cursor) : 0;
      const page = list.slice(start, start + pageSize);
      const next = start + pageSize < list.length ? String(start + pageSize) : null;
      return { verified: true, entries: page, nextCursor: next };
    },
    readBlob: ({ blobSha }) => {
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
