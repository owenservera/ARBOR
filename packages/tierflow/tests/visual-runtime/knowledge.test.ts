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
  const { client } = setup();
  const first = await client.query(query({ limit: 1 }));
  const epoch1 = client.fixtureMetrics().epoch;
  client.applyFixtureSourceEvent({ type: 'source-reset' });
  assert.equal(client.fixtureMetrics().epoch, epoch1 + 1);
  const second = await client.query(query({ limit: 1, cursor: first.nextCursor }));
  assert.equal(second.status, 'denied');
});

test('projection removes markup from all text and cannot create clickable action', async () => {
  const auth = mutableFixtureBroker();
  const injected = [{ ...canonicalKnowledgeFixtures()[0]!, label: '<script>alert(1)</script>', summary: '<img src=x onerror=alert(1)>' }];
  const client = createFixtureKnowledgeClient(injected, auth.broker, { now: () => NOW });
  const page = await client.query(query({ entityRef: FIXTURE_IDS.alpha, query: undefined }));
  const card = projectKnowledgePage(page).cards[0];
  assert.ok(card);
  assert.doesNotMatch(card.title, /<script>/);
  assert.doesNotMatch(card.summary, /<img/);
  assert.equal(card.interactive, false);
  assert.equal('actionRefs' in card, false);
});
