import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioLearningPipeline, createTrustedManifestProvider } from '../../src/studio/adapter-learning-pipeline.mjs';

const scope = { siteId: 'chatgpt', origin: 'https://chatgpt.com', accountRef: 'fixture-account', surface: 'chat' };
function fixture() {
  let writes = 0;
  const store = { current: () => null, load: () => null, versions: () => [],
    compareAndSave() { writes++; throw Error('unexpected write'); },
    compareAndRollback() { writes++; throw Error('unexpected rollback'); } };
  return { api: createStudioLearningPipeline({ sessionsDir: '/unused-fixture-sessions', store }), writes: () => writes };
}
function event(i) {
  const evidenceRef = 'fixture-' + i;
  return { scope, source: { captureId: evidenceRef, sessionId: evidenceRef, sequence: i,
    rawDigest: i.toString(16).padStart(64, '0'), origin: scope.origin, accountRef: scope.accountRef,
    accountBinding: 'unverified', carrier: 'dom', coverage: 'complete',
    evidenceClass: 'SYNTHETIC_TEST', evidenceRef },
    observations: [{ feature: 'user-turn', outcome: 'present', evidenceRef,
      attributes: { 'data-fixture-role': 'user' }, roleAttribute: 'data-fixture-role',
      roleMatch: 'exact', identityVerdict: 'verified', identityRef: evidenceRef, identityRole: 'user' }] };
}
test('claimed core account binding is not an acceptance credential', async () => {
  const verifier = createTrustedManifestProvider({ sessionsDir: '/unused-fixture-sessions' });
  assert.equal(await verifier.verifyCapture({ scope, source: { ...event(1).source, accountBinding: 'core-verified' } }), false);
});
test('production caller event bodies cannot reach proposal or unattended evolution', async () => {
  const { api, writes } = fixture();
  const args = { scope, training: [event(1)], heldout: [event(2)] };
  await assert.rejects(api.propose(args), { code: 'PRODUCTION_SESSION_IDS_REQUIRED' });
  await assert.rejects(api.evolve(args), { code: 'SESSION_IDS_REQUIRED' });
  assert.equal(writes(), 0);
});
test('unknown qualification digest is refused without dereferencing caller evidence', async () => {
  const { api, writes } = fixture();
  await assert.rejects(api.promoteQualified({ proposalDigest: 'missing', evidence: { trainingSources: [{ accountBinding: 'core-verified' }] } }), { code: 'PROPOSAL_NOT_SERVER_MINTED' });
  await assert.rejects(api.promoteQualified(null), { code: 'PROPOSAL_NOT_SERVER_MINTED' });
  assert.equal(writes(), 0);
});
test('server-minted synthetic proposal cannot be qualified by replacing its account evidence', async () => {
  const { api, writes } = fixture();
  const proposal = await api.propose({ scope, training: [event(1), event(2), event(3)], heldout: [event(4), event(5)], testOnly: true });
  const forged = { ...proposal, metrics: { forged: true }, evidence: {
    trainingSources: [{ accountBinding: 'core-verified' }], heldoutSources: [{ accountBinding: 'core-verified' }] } };
  const result = await api.promoteQualified(forged);
  assert.equal(result.status, 'abstained');
  assert.equal(result.reason, 'ACCOUNT_BINDING_NOT_CORE_VERIFIED');
  assert.deepEqual(result.metrics, proposal.metrics);
  assert.equal(result.sendPermission, false);
  assert.equal(writes(), 0);
});
