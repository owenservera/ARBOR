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
  assert.equal((await client.query(input({ surface: 'android', entityRef: FIXTURE_IDS.restrictedDevice, query: undefined }))).items.length, 0);
});

test('request-supplied trusted actor/grant and malformed limits/kinds fail closed', async () => {
  const { client } = setup();
  for (const invalid of [
    { ownerRef: 'owner_b' }, { trustedContext: fixtureTrustedContext() }, { deviceRef: 'desktop_1' },
    { limit: 0 }, { limit: 51 }, { limit: 1.1 }, { limit: Infinity }, { query: '' }, { query: 'x'.repeat(257) },
    { kinds: Array(9).fill('project_note') }, { kinds: ['project_note', 'project_note'] }, { kinds: ['bad kind'] },
    { cursor: '!' }, { entityRef: '/' }, { purpose: 'admin' }, { surface: 'provider' },
  ]) {
    await assertOpaqueDeny(client, { ...input(), ...invalid } as KnowledgeQuery);
  }
});

test('expired, tampered, changed-query and cross-policy cursor refuses without disclosing previous result', async () => {
  const { client, auth } = setup();
  const first = await client.query(input({ query: 'Shared project path', limit: 1 }));
  const cursor = first.nextCursor;
  assert.ok(cursor);
  await assertOpaqueDeny(client, input({ query: 'Shared project path', limit: 1, cursor: cursor.slice(0, -1) + 'x' }));
  await assertOpaqueDeny(client, input({ query: 'different', limit: 1, cursor }));
  auth.setContext(fixtureTrustedContext({ policyRevision: 'policy_2' }));
  await assertOpaqueDeny(client, input({ query: 'Shared project path', limit: 1, cursor }));
  auth.setContext(fixtureTrustedContext());
  time += 60_001;
  await assertOpaqueDeny(client, input({ query: 'Shared project path', limit: 1, cursor }));
});

test('offline and revoked source never replay stale cached results or prior cursor', async () => {
  const { client, auth } = setup();
  const first = await client.query(input({ query: 'Shared project path', limit: 1 }));
  auth.setContext(fixtureTrustedContext({ offline: true }));
  const offline = await client.query(input({ query: 'Shared project path', limit: 1, cursor: first.nextCursor }));
  assert.equal(offline.status, 'unavailable');
  assert.deepEqual(offline.items, []);
  auth.setContext(fixtureTrustedContext());
  client.applyFixtureSourceEvent({ type: 'revoke', stableId: FIXTURE_IDS.alpha });
  await assertOpaqueDeny(client, input({ query: 'Shared project path', limit: 1, cursor: first.nextCursor }));
  const after = await client.query(input({ query: 'Shared project path' }));
  assert.deepEqual(after.items.map(i => i.stableId), [FIXTURE_IDS.beta]);
});
