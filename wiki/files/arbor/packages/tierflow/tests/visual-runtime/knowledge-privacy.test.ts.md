# File: packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7300 B |
| Lines | 122 |
| Hash | 6f691d04233f |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| START | const | 7 | no | const START = Date.parse(&#39;2026-11-06T17:00:00Z&#39;); |
| time | variable | 8 | no | let time = START; |
| input | function | 9 | no | const input = (changes: { [K in keyof KnowledgeQuery]?: KnowledgeQuery[K] \| undefined } = {}): KnowledgeQuery =&gt; ({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req_1&#39;, personalWorldRef: &#39;world_a&#39;,… |
| setup | function | 11 | no | const setup = () =&gt; { |
| auth | const | 13 | no | const auth = mutableFixtureBroker(); |
| client | const | 14 | no | const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () =&gt; time }); |
| assertOpaqueDeny | function | 17 | no | const assertOpaqueDeny = async (client: ReturnType&lt;typeof setup&gt;[&#39;client&#39;], q: KnowledgeQuery) =&gt; { |
| before | const | 18 | no | const before = client.fixtureMetrics().discoveryScans; |
| page | const | 19 | no | const page = await client.query(q); |
| page | const | 56 | no | const page = await client.query(input({ query: &#39;private&#39; })); |
| redacted | const | 58 | no | const redacted = await client.query(input({ query: &#39;Hidden clue&#39; })); |
| absent | const | 59 | no | const absent = await client.query(input({ query: &#39;nonexistent private&#39; })); |
| deviceOnly | const | 64 | no | const deviceOnly = await client.query(input({ entityRef: FIXTURE_IDS.restrictedDevice, query: undefined })); |
| byId | const | 74 | no | const byId = await client.query(input({ surface: &#39;android&#39;, entityRef: id, query: undefined })); |
| first | const | 98 | no | const first = await client.query(input({ query: &#39;Shared project path&#39;, limit: 1 })); |
| cursor | const | 99 | no | const cursor = first.nextCursor; |
| first | const | 112 | no | const first = await client.query(input({ query: &#39;Shared project path&#39;, limit: 1 })); |
| offline | const | 114 | no | const offline = await client.query(input({ query: &#39;Shared project path&#39;, limit: 1, cursor: first.nextCursor })); |
| after | const | 120 | no | const after = await client.query(input({ query: &#39;Shared project path&#39; })); |

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

const START = Date.parse('2026-11-06T17:00:00Z');
let time = START;
const input = (changes: { [K in keyof KnowledgeQuery]?: KnowledgeQuery[K] | undefined } = {}): KnowledgeQuery => ({ schema: 'vivim.knowledge-query/1',
  requestId: 'req_1', personalWorldRef: 'world_a', purpose: 'task', surface: 'pc', query: 'sample', limit: 10, ...changes } as KnowledgeQuery);
const setup = () => {
  time = START;
  const auth = mutableFixtureBroker();
  const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () => time });
  return { client, auth };
};
const assertOpaqueDeny = async (client: ReturnType<typeof setup>['client'], q: KnowledgeQuery) => {
  const before = client.fixtureMetrics().discoveryScans;
  const page = await client.query(q);
  assert.equal(page.status, 'denied');
  assert.deepEqual(page.items, []);
  assert.equal(page.projectionRevision, null);
  assert.equal(page.asOf, null);
  assert.equal('nextCursor' in page, false);
  assert.equal(client.fixtureMetrics().discoveryScans, before, 'authorization must reject before discovery');
  assert.equal(projectKnowledgePage(page).cards.length, 0);
};

test('missing broker denies before any lookup or metadata reveal', async () => {
  const { client, auth } = setup();
  auth.setContext(null);
  await assertOpaqueDeny(client, input());
  assert.equal((await client.query(input())).reasonCode, 'NO_TRUSTED_CONTEXT');
});

test('reject owner, World, session, device, surface, purpose and grant drift without discovery', async () => {
  const { client, auth } = setup();
  for (const bad of [
    { personalWorldRef: 'world_b' }, { sessionRef: '' }, { deviceRef: '' },
    { revoked: true }, { grantExpiresAt: START }, { sessionExpiresAt: START },
    { surface: 'android' as const }, { allowedPurposes: ['help' as const] }, { policyRevision: '' },
  ]) {
    auth.setContext(fixtureTrustedContext(bad));
    await assertOpaqueDeny(client, input());
  }
  auth.setContext(fixtureTrustedContext({ ownerRef: 'owner_b' }));
  assert.deepEqual((await client.query(input({ entityRef: FIXTURE_IDS.alpha, query: undefined }))).items, []);
  auth.setContext(fixtureTrustedContext());
  await assertOpaqueDeny(client, input({ personalWorldRef: 'world_b' }));
  await assertOpaqueDeny(client, input({ surface: 'wiki' }));
  await assertOpaqueDeny(client, input({ purpose: 'help', surface: 'android' }));
});

test('foreign owner/world/device records and untrusted redaction never appear in result counts or snippets', async () => {
  const { client } = setup();
  const page = await client.query(input({ query: 'private' }));
  assert.equal(page.items.length, 0);
  const redacted = await client.query(input({ query: 'Hidden clue' }));
  const absent = await client.query(input({ query: 'nonexistent private' }));
  assert.deepEqual(redacted.items, absent.items);
  assert.equal(redacted.status, absent.status);
  assert.equal('count' in redacted, false);
  assert.equal('nextCursor' in redacted, false);
  const deviceOnly = await client.query(input({ entityRef: FIXTURE_IDS.restrictedDevice, query: undefined }));
  assert.equal(deviceOnly.items.length, 1);
  assert.equal((await client.query(input({ query: 'Deleted sample' }))).items.length, 0);
  assert.equal((await client.query(input({ query: 'Revoked sample' }))).items.length, 0);
});

test('S2 and S3 are invisible on phone even when searched by exact native ID; S1 requires grant', async () => {
  const { client, auth } = setup();
  auth.setContext(fixtureTrustedContext({ surface: 'android', deviceRef: 'phone_1', allowPhoneS1: true }));
  for (const id of [FIXTURE_IDS.sensitive, FIXTURE_IDS.secret]) {
    const byId = await client.query(input({ surface: 'android', entityRef: id, query: undefined }));
    assert.equal(byId.status, 'ok');
    assert.deepEqual(byId.items, []);
  }
  assert.equal((await client.query(input({ surface: 'android', entityRef: FIXTURE_IDS.stale, query: undefined }))).items[0]?.availability, 'stale');
  auth.setContext(fixtureTrustedContext({ surface: 'android', deviceRef: 'phone_1', allowPhoneS1: false }));
  assert.equal((await client.query(input({ surface: 'android', entityRef: FIXTURE_IDS.stale, query: undefined }))).items.length, 0);
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
