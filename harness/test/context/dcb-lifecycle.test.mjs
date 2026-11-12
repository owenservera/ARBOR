// Synthetic contract tests only. No Host, browser, provider or device effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDcbDefinition, reviseDcbDefinition, assessDcbDefinition,
  createCompositeDcbDefinition, dcbMaterializationInput,
} from '../../src/context/dcb-lifecycle.mjs';

const T = '2026-11-10T06:00:00.000Z';
const T2 = '2026-11-10T07:00:00.000Z';
const T3 = '2026-11-11T06:00:00.000Z';
const SHA = 'a'.repeat(64);
const base = (override = {}) => ({
  id: 'dcb:alpha', ownerRef: 'owner:one', mode: 'persistent', createdAt: T,
  policyVersion: 'v2', activityRef: null, flavorRefs: ['project', 'research'],
  sourceRefs: ['source:2', 'source:1'], ...override,
});
const make = override => createDcbDefinition(base(override));

test('persistent definition keeps stable identity and normalized refs without private bodies', () => {
  const d = make({ flavorRefs: ['research', 'project', 'project'] });
  assert.deepEqual(d.flavorRefs, ['project', 'research']);
  assert.deepEqual(d.sourceRefs, ['source:1', 'source:2']);
  assert.equal(d.revision, 1);
  assert.equal(d.status, 'active');
  assert.equal(d.schema, 'vivim.dcb-definition/1');
  assert.equal(JSON.stringify(d).includes('source content'), false);
  assert.ok(Object.isFrozen(d));
});
test('short-lived bundles require expiry and expiration blocks planning', () => {
  assert.throws(() => make({ mode: 'session' }), { code: 'DCB_DEFINITION_EXPIRY' });
  assert.throws(() => make({ mode: 'ephemeral', expiresAt: T }), { code: 'DCB_DEFINITION_EXPIRY' });
  const d = make({ mode: 'session', expiresAt: T2 });
  assert.equal(assessDcbDefinition(d, { at: T }).status, 'candidate_current');
  const expired = assessDcbDefinition(d, { at: T2 });
  assert.equal(expired.status, 'blocked');
  assert.ok(expired.reasons.includes('expired'));
  assert.equal(expired.isSendAuthorized, false);
});
test('deterministic versioning and optimistic concurrency preserve no-op revisions', () => {
  const d = make();
  const noop = reviseDcbDefinition(d, { activityRef: null }, { expectedRevision: 1, at: T2 });
  assert.strictEqual(noop, d);
  const next = reviseDcbDefinition(d, { activityRef: 'activity:research' }, { expectedRevision: 1, at: T2 });
  assert.equal(next.revision, 2);
  assert.equal(d.revision, 1);
  assert.throws(() => reviseDcbDefinition(next, { status: 'suspended' }, { expectedRevision: 1, at: T3 }),
    { code: 'DCB_DEFINITION_CONFLICT' });
  assert.throws(() => reviseDcbDefinition(d, { id: 'dcb:other' }, { expectedRevision: 1, at: T2 }),
    { code: 'DCB_DEFINITION_PATCH' });
});
test('retirement is terminal and expired definitions cannot reactivate', () => {
  const d = make();
  const retired = reviseDcbDefinition(d, { status: 'retired' }, { expectedRevision: 1, at: T2 });
  assert.equal(assessDcbDefinition(retired, { at: T3 }).status, 'blocked');
  assert.throws(() => reviseDcbDefinition(retired, { status: 'active' }, { expectedRevision: 2, at: T3 }),
    { code: 'DCB_DEFINITION_RETIRED' });
  const session = make({ mode: 'session', expiresAt: T2 });
  assert.throws(() => reviseDcbDefinition(session, { status: 'active' }, { expectedRevision: 1, at: T3 }),
    { code: 'DCB_DEFINITION_EXPIRY' });
});
test('source changes invalidate; revocation or grant loss block; no planner status authorizes send', () => {
  const d = make();
  const stale = assessDcbDefinition(d, { at: T, changedSourceRefs: ['source:1'] });
  assert.deepEqual(stale.reasons, ['source_changed']);
  assert.equal(stale.status, 'stale');
  const sourceBlock = assessDcbDefinition(d, { at: T, revokedSourceRefs: ['source:2'] });
  assert.equal(sourceBlock.status, 'blocked');
  const grantBlock = assessDcbDefinition(d, { at: T, grantRevoked: true });
  assert.deepEqual(grantBlock.reasons, ['grant_revoked']);
  assert.equal(grantBlock.isSendAuthorized, false);
});
test('composite references two same-owner parents but never merges facts or grants', () => {
  const first = make();
  const second = make({ id: 'dcb:beta', mode: 'session', expiresAt: T3 });
  const d = createCompositeDcbDefinition({
    id: 'dcb:merged', parents: [second, first], createdAt: T,
    flavorRefs: ['research', 'personal'], policyVersion: 'v2',
  });
  assert.deepEqual(d.parentRefs, ['dcb:alpha', 'dcb:beta']);
  assert.deepEqual(d.sourceRefs, []);
  assert.equal(assessDcbDefinition(d, { at: T, changedParentRefs: ['dcb:beta'] }).status, 'stale');
  assert.throws(() => createCompositeDcbDefinition({
    id: 'dcb:bad', parents: [first, make({ id: 'dcb:foreign', ownerRef: 'owner:other' })],
    createdAt: T, flavorRefs: ['project'], policyVersion: 'v2',
  }), { code: 'DCB_DEFINITION_COMPOSITE' });
});
test('metadata-only materialization inputs are canonical and destination-specific', () => {
  const d = make();
  const sourceRevisions = [{ ref: 'source:2', revision: 'v2', sha256: SHA },
    { ref: 'source:1', revision: 'v1', sha256: SHA }];
  const args = { definition: d, destinationRef: 'provider:claude', requestDigest: SHA,
    policyDigest: SHA, disclosureDigest: SHA, sourceRevisions };
  const first = dcbMaterializationInput(args);
  const second = dcbMaterializationInput({ ...args, sourceRevisions: [...sourceRevisions].reverse() });
  assert.deepEqual(first, second);
  assert.deepEqual(first.sourceRevisions.map(s => s.ref), ['source:1', 'source:2']);
  assert.notDeepEqual(first, dcbMaterializationInput({ ...args, destinationRef: 'provider:gemini' }));
  assert.equal(first.authority, 'read_only_projection');
});
test('duplicate source revisions and malformed digests fail closed', () => {
  const d = make();
  const args = { definition: d, destinationRef: 'provider:claude', requestDigest: SHA,
    policyDigest: SHA, disclosureDigest: SHA };
  assert.throws(() => dcbMaterializationInput({ ...args, sourceRevisions: [
    { ref: 'source:1', revision: 'v1', sha256: SHA },
    { ref: 'source:1', revision: 'v2', sha256: SHA },
  ] }), { code: 'DCB_DEFINITION_SOURCE_REVISION' });
  assert.throws(() => dcbMaterializationInput({ ...args, disclosureDigest: 'wrong', sourceRevisions: [] }),
    { code: 'DCB_DEFINITION_DIGEST' });
});
