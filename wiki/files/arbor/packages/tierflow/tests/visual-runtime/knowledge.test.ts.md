# File: packages/tierflow/tests/visual-runtime/knowledge.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/knowledge.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5705 B |
| Lines | 101 |
| Hash | 6c516d5e3a2a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 7 | no | const NOW = Date.parse(&#39;2026-11-06T17:00:00.000Z&#39;); |
| query | function | 8 | no | const query = (overrides: { [K in keyof KnowledgeQuery]?: KnowledgeQuery[K] \| undefined } = {}): KnowledgeQuery =&gt; ({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;request_1&#39;, personalWorldRef: &#39;wor… |
| setup | function | 12 | no | const setup = () =&gt; { |
| auth | const | 13 | no | const auth = mutableFixtureBroker(); |
| client | const | 14 | no | const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () =&gt; NOW }); |
| page | const | 20 | no | const page = await client.query(query()); |
| missing | const | 31 | no | const missing = await client.query(query({ query: &#39;no such data&#39; })); |
| down | const | 36 | no | const down = await client.query(query({ query: &#39;no such data&#39; })); |
| page | const | 45 | no | const page = await client.query(query({ entityRef: FIXTURE_IDS.stale, query: undefined })); |
| page1 | const | 54 | no | const page1 = await client.query(query({ limit: 1 })); |
| page2 | const | 57 | no | const page2 = await client.query(query({ limit: 1, cursor: page1.nextCursor })); |
| replay | const | 61 | no | const replay = await client.query(query({ limit: 1, cursor: page1.nextCursor })); |
| before | const | 68 | no | const before = await client.query(query({ limit: 1 })); |
| old | const | 70 | no | const old = await client.query(query({ limit: 1, cursor: before.nextCursor })); |
| after | const | 72 | no | const after = await client.query(query()); |
| first | const | 82 | no | const first = await client.query(query({ limit: 1 })); |
| epoch1 | const | 83 | no | const epoch1 = client.fixtureMetrics().epoch; |
| second | const | 86 | no | const second = await client.query(query({ limit: 1, cursor: first.nextCursor })); |
| auth | const | 91 | no | const auth = mutableFixtureBroker(); |
| injected | const | 92 | no | const injected = [{ ...canonicalKnowledgeFixtures()[0]!, label: &#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39;, summary: &#39;&lt;img src=x onerror=alert(1)&gt;&#39; }]; |
| client | const | 93 | no | const client = createFixtureKnowledgeClient(injected, auth.broker, { now: () =&gt; NOW }); |
| page | const | 94 | no | const page = await client.query(query({ entityRef: FIXTURE_IDS.alpha, query: undefined })); |
| card | const | 95 | no | const card = projectKnowledgePage(page).cards[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/knowledge/client.ts | import | 3 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../src/visual-runtime/knowledge/client.ts.md) |
| ../../src/visual-runtime/knowledge/fixtures.ts | import | 4 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../src/visual-runtime/knowledge/fixtures.ts.md) |
| ../../src/visual-runtime/knowledge/projection.ts | import | 5 | [packages/tierflow/src/visual-runtime/knowledge/projection.ts](../../src/visual-runtime/knowledge/projection.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureKnowledgeClient, type KnowledgeQuery } from '../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, fixtureTrustedContext, FIXTURE_IDS, mutableFixtureBroker } from '../../src/visual-runtime/knowledge/fixtures.ts';
import { projectKnowledgePage } from '../../src/visual-runtime/knowledge/projection.ts';

const NOW = Date.parse('2026-11-06T17:00:00.000Z');
const query = (overrides: { [K in keyof KnowledgeQuery]?: KnowledgeQuery[K] | undefined } = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'request_1', personalWorldRef: 'world_a', purpose: 'task',
  surface: 'pc', query: 'Shared project path', limit: 50, ...overrides,
} as KnowledgeQuery);
const setup = () => {
  const auth = mutableFixtureBroker();
  const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () => NOW });
  return { auth, client };
};

test('two projects with identical path/name stay distinct by opaque stable IDs and native source versions', async () => {
  const { client } = setup();
  const page = await client.query(query());
  assert.equal(page.status, 'ok');
  assert.deepEqual(page.items.map(i => i.stableId).sort(), [FIXTURE_IDS.alpha, FIXTURE_IDS.beta].sort());
  assert.deepEqual(page.items.map(i => i.projectRef).sort(), ['project_one', 'project_two']);
  assert.ok(page.items.every(i => i.source.nativeId && i.source.nativeVersion === 'rev-3' && i.source.digest && i.evidenceRefs.length > 0 && i.asOf));
  assert.ok(page.items.every(i => i.claimStatus === 'observed'));
  assert.equal(page.items.every(i => !('permission' in i) && !('execute' in i)), true);
});

test('empty authorized result differs from KB outage, and does not infer source existence', async () => {
  const { client, auth } = setup();
  const missing = await client.query(query({ query: 'no such data' }));
  assert.equal(missing.status, 'ok');
  assert.equal(missing.items.length, 0);
  assert.equal(missing.completeness, 'complete');
  auth.setContext(fixtureTrustedContext({ offline: true }));
  const down = await client.query(query({ query: 'no such data' }));
  assert.equal(down.status, 'unavailable');
  assert.deepEqual(down.items, []);
  assert.equal(down.projectionRevision, null);
  assert.equal(projectKnowledgePage(down).state, 'unavailable');
});

test('stale evidence is explicit partial and never claimed current/authorized', async () => {
  const { client } = setup();
  const page = await client.query(query({ entityRef: FIXTURE_IDS.stale, query: undefined }));
  assert.equal(page.status, 'partial');
  assert.equal(page.items[0]?.availability, 'stale');
  assert.match(projectKnowledgePage(page).cards[0]?.statusLabel ?? '', /stale/i);
  assert.equal(projectKnowledgePage(page).cards[0]?.interactive, false);
});

test('opaque one-use cursor paginates only authorized items without path deduplication', async () => {
  const { client } = setup();
  const page1 = await client.query(query({ limit: 1 }));
  assert.equal(page1.items.length, 1);
  assert.match(page1.nextCursor ?? '', /^kc_/);
  const page2 = await client.query(query({ limit: 1, cursor: page1.nextCursor }));
  assert.equal(page2.items.length, 1);
  assert.notEqual(page1.items[0]?.stableId, page2.items[0]?.stableId);
  assert.equal(page2.nextCursor, undefined);
  const replay = await client.query(query({ limit: 1, cursor: page1.nextCursor }));
  assert.equal(replay.status, 'denied');
  assert.equal(replay.reasonCode, 'CURSOR_INVALID');
});

test('source tombstone and revocation invalidate cursors and cannot resurrect via query/alias', async () => {
  const { client } = setup();
  const before = await client.query(query({ limit: 1 }));
  client.applyFixtureSourceEvent({ type: 'tombstone', stableId: FIXTURE_IDS.alpha });
  const old = await client.query(query({ limit: 1, cursor: before.nextCursor }));
  assert.equal(old.status, 'denied');
  const after = await client.query(query());
  assert.deepEqual(after.items.map(i => i.stableId), [FIXTURE_IDS.beta]);
  client.applyFixtureSourceEvent({ type: 'revoke', stableId: FIXTURE_IDS.beta });
  assert.equal((await client.query(query())).items.length, 0);
  assert.equal((await client.query(query({ entityRef: FIXTURE_IDS.alpha, query: undefined }))).items.length, 0);
  assert.equal(client.fixtureMetrics().pageCursors, 0);
});

test('source restart invalidates cursors, cannot reuse previous epoch', async () => {
```

_First 80 of 102 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
