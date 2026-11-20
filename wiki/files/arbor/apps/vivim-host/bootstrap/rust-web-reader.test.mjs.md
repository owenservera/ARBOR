# File: apps/vivim-host/bootstrap/rust-web-reader.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/rust-web-reader.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3116 B |
| Lines | 70 |
| Hash | 151dae1848a1 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| installationId | const | 6 | no | const installationId = &#39;12345678-1234-4234-8234-123456789012&#39;; |
| eventId | const | 7 | no | const eventId = &#39;22345678-1234-4234-8234-123456789012&#39;; |
| row | const | 8 | no | const row = { id: eventId, installationId, site: &#39;example.org&#39;, |
| output | function | 12 | no | const output = (patch = {}) =&gt; ({ schema: &#39;vivim.web-memory-query/1&#39;, graphEpoch: 2, cursor: 1, nextCursor: 1, hasMore: false, results: [row], ...patch }); |
| root | const | 14 | no | const root = path.resolve(&#39;/tmp/vivim-rust-fixture&#39;); |
| bin | const | 15 | no | const bin = path.resolve(&#39;/tmp/hqkg-web-feed&#39;); |
| read | const | 18 | no | const read = createRustWebReader({ dataRoot: root, env: {} }); |
| saw | variable | 23 | no | let saw; |
| read | const | 24 | no | const read = createRustWebReader({ dataRoot: root, env: { VIVIM_WEB_MEMORY_BIN: bin }, execute: async (file, args, options) =&gt; { saw = { file, args, options }; return { stdout: JSON.stringify(output(… |
| batch | const | 29 | no | const batch = await read(0); |
| read | const | 45 | no | const read = createRustWebReader({ dataRoot: root, env: { VIVIM_WEB_MEMORY_BIN: bin }, execute: async () =&gt; ({ stdout: JSON.stringify(output({ results: [{ ...row, provenance: &#39;fake&#39; }] })) }) }); |
| read | const | 58 | no | const read = createRustWebReader({ dataRoot: root, env: { VIVIM_WEB_MEMORY_BIN: bin }, execute: async () =&gt; ({ stdout: body }) }); |
| read | const | 66 | no | const read = createRustWebReader({ dataRoot: root, env: { VIVIM_WEB_MEMORY_BIN: bin }, execute: async () =&gt; { throw new Error(&#39;journal unavailable&#39;); } }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:path | import | 3 | external |
| ./rust-web-reader.mjs | import | 4 | [apps/vivim-host/bootstrap/rust-web-reader.mjs](./rust-web-reader.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRustWebReader } from './rust-web-reader.mjs';

const installationId = '12345678-1234-4234-8234-123456789012';
const eventId = '22345678-1234-4234-8234-123456789012';
const row = { id: eventId, installationId, site: 'example.org',
  url: 'https://example.org/article', observedAt: '2026-11-04T08:00:00.000Z',
  provenance: 'browser:' + installationId + ':' + eventId,
  cursor: 1, verified: true, source: 'vivim.browser-companion' };
const output = (patch = {}) => ({ schema: 'vivim.web-memory-query/1',
  graphEpoch: 2, cursor: 1, nextCursor: 1, hasMore: false, results: [row], ...patch });
const root = path.resolve('/tmp/vivim-rust-fixture');
const bin = path.resolve('/tmp/hqkg-web-feed');

test('missing Rust executable cannot imply live evidence', async () => {
  const read = createRustWebReader({ dataRoot: root, env: {} });
  await assert.rejects(read(0), { code: 'WEB_RUST_QUERY_UNAVAILABLE' });
});

test('read-only CLI uses shell:false, bounded output and cursor', async () => {
  let saw;
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async (file, args, options) => {
      saw = { file, args, options }; return { stdout: JSON.stringify(output()) };
    } });
  const batch = await read(0);
  assert.equal(saw.file, bin);
  assert.deepEqual(saw.args, [
    path.join(root, 'browser-companion', 'web-memory.hqj'), 'query',
    '--after-cursor', '0', '--limit', '32'
  ]);
  assert.equal(saw.options.shell, false);
  assert.equal(saw.options.maxBuffer, 65536);
  assert.equal(batch.authority, 'hqkg');
  assert.equal(batch.items.length, 1);
  assert.equal(batch.items[0].sourceRef, row.provenance);
  assert.equal(batch.cursor, '1');
  assert.equal(batch.coverage, 'complete');
});

test('untrusted Rust source provenance is rejected, never promoted', async () => {
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async () => ({ stdout: JSON.stringify(output({ results: [{ ...row, provenance: 'fake' }] })) }) });
  await assert.rejects(read(0), { code: 'WEB_RUST_SOURCE_UNVERIFIED' });
});

test('malformed output and stuck pagination fail closed', async () => {
  for (const body of [
    JSON.stringify(output({ schema: 'other' })),
    JSON.stringify(output({ hasMore: true, nextCursor: 0, results: [] })),
    JSON.stringify(output({ results: Array(33).fill(row) })),
    'not-json'
  ]) {
    const read = createRustWebReader({ dataRoot: root,
      env: { VIVIM_WEB_MEMORY_BIN: bin },
      execute: async () => ({ stdout: body }) });
    await assert.rejects(read(0));
  }
});

test('Rust process failure never fabricates an accepted visit', async () => {
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async () => { throw new Error('journal unavailable'); } });
  await assert.rejects(read(0), { code: 'WEB_RUST_QUERY_FAILED' });
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
