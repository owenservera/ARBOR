# File: apps/vivim-host/bootstrap/web-memory.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/web-memory.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7468 B |
| Lines | 141 |
| Hash | 5001ed5aa916 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| install | const | 10 | no | const install = &#39;12345678-1234-4234-8234-123456789012&#39;; |
| firstId | const | 11 | no | const firstId = &#39;22345678-1234-4234-8234-123456789012&#39;; |
| secondId | const | 12 | no | const secondId = &#39;32345678-1234-4234-8234-123456789012&#39;; |
| stamp | const | 13 | no | const stamp = &#39;2026-11-04T08:00:00.000Z&#39;; |
| fixture | function | 14 | no | const fixture = (items, extra = {}) =&gt; ({ schema: &#39;vivim.web-memory-query/1&#39;, authority: &#39;synthetic&#39;, cursor: null, items, ...extra }); |
| visit | function | 16 | no | const visit = (eventId = firstId, url = &#39;https://example.org/article&#39;, observedAt = stamp) =&gt; |
| fresh | function | 18 | no | function fresh(t, options = {}) { |
| ledger | const | 19 | no | const ledger = openLedger({ file: options.file ?? &#39;:memory:&#39; }); |
| memory | const | 21 | no | const memory = createWebMemory({ ledger, worldId: &#39;world-local&#39;, now: options.now ?? (() =&gt; &#39;2026-11-04T12:00:00.000Z&#39;) }); |
| batch | const | 28 | no | const batch = fixture([visit()]); |
| out | const | 32 | no | const out = memory.recent({ day: &#39;2026-11-04&#39; }); |
| x | const | 51 | no | const x = normalizeRustQuery(fixture([visit(firstId, &#39;https://example.org/reset/someid&#39;)]), { worldId: &#39;world-local&#39;, now: &#39;2026-11-04T12:00:00.000Z&#39; }); |
| first | const | 63 | no | const first = memory.recent({ day: &#39;2026-11-04&#39;, site: &#39;example.org&#39;, limit: 1 }); |
| second | const | 66 | no | const second = memory.recent({ day: &#39;2026-11-04&#39;, site: &#39;example.org&#39;, limit: 1, cursor: first.nextCursor }); |
| b | const | 79 | no | const b = fixture([visit()]); |
| id | const | 81 | no | const id = projectionId(install, firstId); |
| time | variable | 100 | no | let time = &#39;2026-11-04T12:00:00.000Z&#39;; |
| result | const | 105 | no | const result = memory.recent({ day: &#39;2026-11-04&#39; }); |
| id | const | 112 | no | const id = projectionId(install, firstId); |
| approval | const | 114 | no | const approval = { approved: true, allowWebHistory: true, provider: &#39;chatgpt&#39;, conversationId: &#39;signed-in-thread&#39; }; |
| preview | const | 122 | no | const preview = rustMemory.contextPreview({ ids: [id], authorization: approval }); |
| dir | const | 129 | no | const dir = mkdtempSync(path.join(tmpdir(), &#39;vivim-web-memory-test-&#39;)); |
| file | const | 130 | no | const file = path.join(dir, &#39;ledger.db&#39;); |
| ledger | variable | 132 | no | let ledger = openLedger({ file }); |
| memory | const | 136 | no | const memory = createWebMemory({ ledger, now: () =&gt; &#39;2026-11-04T12:00:00.000Z&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ./ledger.mjs | import | 7 | [apps/vivim-host/bootstrap/ledger.mjs](./ledger.mjs.md) |
| ./web-memory.mjs | import | 8 | [apps/vivim-host/bootstrap/web-memory.mjs](./web-memory.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Sprint 01 Lane 3 deterministic tests. Synthetic visits are not real owner history.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLedger } from './ledger.mjs';
import { createWebMemory, projectionId, normalizeRustQuery, readMemoryParams } from './web-memory.mjs';

const install = '12345678-1234-4234-8234-123456789012';
const firstId = '22345678-1234-4234-8234-123456789012';
const secondId = '32345678-1234-4234-8234-123456789012';
const stamp = '2026-11-04T08:00:00.000Z';
const fixture = (items, extra = {}) => ({ schema: 'vivim.web-memory-query/1', authority: 'synthetic',
  cursor: null, items, ...extra });
const visit = (eventId = firstId, url = 'https://example.org/article', observedAt = stamp) =>
  ({ eventId, installationId: install, site: 'example.org', url, observedAt });
function fresh(t, options = {}) {
  const ledger = openLedger({ file: options.file ?? ':memory:' });
  t.after(() => ledger.close());
  const memory = createWebMemory({ ledger, worldId: 'world-local',
    now: options.now ?? (() => '2026-11-04T12:00:00.000Z') });
  return { ledger, memory };
}

test('stable Rust-linked projection ID, duplicate batches and conflicting replay', t => {
  const { memory } = fresh(t);
  const batch = fixture([visit()]);
  assert.equal(projectionId(install, firstId), 'web:visit:' + install + ':' + firstId);
  assert.equal(memory.project(batch).inserted, 1);
  assert.equal(memory.project(batch).duplicates, 1);
  const out = memory.recent({ day: '2026-11-04' });
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].sourceRef, 'browser:' + install + ':' + firstId);
  assert.equal(out.items[0].trust, 'synthetic_unverified');
  assert.equal(out.coverage, 'synthetic_fixture');
  assert.throws(() => memory.project(fixture([visit(firstId, 'https://example.org/else')])),
    { code: 'WEB_EVIDENCE_CONFLICT' });
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 1);
});

test('sensitive URLs reject credentials, query, fragments, mismatched sites and unsafe schemes', () => {
  for (const url of ['https://example.org/?token=secret',
    'https://example.org/article#fragment', 'https://user@example.org/article',
    'https://other.org/article', 'javascript:alert(1)',
    'https://example.org:8443/article']) {
    assert.throws(() => normalizeRustQuery(fixture([visit(firstId, url)]),
      { worldId: 'world-local', now: '2026-11-04T12:00:00.000Z' }),
      { code: 'WEB_URL_UNSAFE' });
  }
  const x = normalizeRustQuery(fixture([visit(firstId, 'https://example.org/reset/someid')]),
    { worldId: 'world-local', now: '2026-11-04T12:00:00.000Z' });
  assert.equal(x.items[0].url, 'https://example.org/');
  assert.equal(x.items[0].reduced, true);
});

test('day and site filters, stable time cursor and small bounded response', t => {
  const { memory } = fresh(t);
  memory.project(fixture([
    visit(firstId, 'https://example.org/earlier', '2026-11-04T07:00:00.000Z'),
    visit(secondId, 'https://example.org/later', '2026-11-04T09:00:00.000Z')
  ]));
  const first = memory.recent({ day: '2026-11-04', site: 'example.org', limit: 1 });
  assert.equal(first.items[0].eventId, secondId);
  assert.ok(first.nextCursor);
  const second = memory.recent({ day: '2026-11-04', site: 'example.org', limit: 1, cursor: first.nextCursor });
  assert.equal(second.items[0].eventId, firstId);
  assert.equal(second.nextCursor, null);
  assert.equal(memory.recent({ day: '2026-11-03' }).items.length, 0);
  assert.equal(memory.recent({ day: '2026-11-04', site: 'other.org' }).items.length, 0);
  assert.throws(() => memory.recent({ limit: 1000 }), { code: 'WEB_LIMIT_INVALID' });
  assert.throws(() => memory.recent({ cursor: '!wrong!' }), { code: 'WEB_PAGE_CURSOR_INVALID' });
  assert.throws(() => readMemoryParams(new URLSearchParams('limit=20&limit=30')),
    { code: 'WEB_FILTER_INVALID' });
});

test('source retraction tombstones cannot be undone by stale replay', t => {
  const { memory } = fresh(t);
  const b = fixture([visit()]);
  memory.project(b);
```

_First 80 of 142 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
