import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCapabilityHelp, searchCapabilityHelp, type CapabilityDescriptor, type AuthorizedKbHelp } from '../../src/visual-runtime/experience/help.ts';
const descriptor = (overrides: Partial<CapabilityDescriptor> = {}): CapabilityDescriptor => ({
  actionId: 'ui.open-panel', title: 'Open a panel', explanation: 'Opens an authorized information panel.',
  authority: 'ui', sourceVersion: '1', sourceDigest: 'sha256:abc', observedAt: '2026-11-06T16:00:00Z',
  surface: 'both', risk: 'R0', disclosure: 'public',
  readiness: { supportedByBuild: 'yes', availableNow: 'yes', permittedForActor: 'yes', verifiedByEvidence: 'yes' },
  prerequisites: ['The UI is loaded'], requiredScopes: ['ui.read'],
  textCommand: 'open panel', errorCodes: ['UNAVAILABLE'], ...overrides,
});
const kb: AuthorizedKbHelp = {
  stableId: 'kb:100', projectionRevision: 'kb:1', sourceAuthority: 'hq', sourceVersion: '2',
  evidenceRefs: ['e:1'], asOf: '2026-11-06T16:00:00Z', visibility: 'authorized',
  summary: 'Authorized overview',
};
test('approved KB plus real descriptor gives provenance and safe inert text equivalence', () => {
  const help = projectCapabilityHelp(descriptor(), kb);
  assert.equal(help.schema, 'CapabilityHelpProjection/1');
  assert.equal(help.visible, true);
  assert.equal(help.canRequestPreview, true);
  assert.equal(help.runnable, false);
  assert.equal(help.textCommand, 'open panel');
  assert.equal(help.provenance?.kbStableId, 'kb:100');
  assert.deepEqual(help.provenance?.evidenceRefs, ['e:1']);
  assert.equal(help.discovery.maxDeliberateInteractions, 3);
  assert.equal(help.discovery.textQuerySupported, true);
});
test('permission not proved disables action preview across all four dimensions', () => {
  const fields = ['supportedByBuild', 'availableNow', 'permittedForActor', 'verifiedByEvidence'] as const;
  for (const key of fields) for (const status of ['no', 'unknown'] as const) {
    const d = descriptor({ readiness: { ...descriptor().readiness, [key]: status } });
    const help = projectCapabilityHelp(d, kb);
    assert.equal(help.canRequestPreview, false);
    assert.ok(help.whyUnavailable);
  }
});
test('Host R3 forbidden even with ready and permitted metadata', () => {
  const v = projectCapabilityHelp(descriptor({ authority: 'host', risk: 'R3' }));
  assert.equal(v.canRequestPreview, false);
  assert.match(v.whyUnavailable ?? '', /refused/);
});
test('redacted/revoked/deleted/unknown KB never exposes identifiers or evidence', () => {
  for (const visibility of ['redacted', 'revoked', 'deleted', 'unknown'] as const) {
    const view = projectCapabilityHelp(descriptor(), { ...kb, visibility });
    assert.equal(view.provenance?.kbStableId, undefined);
    assert.deepEqual(view.provenance?.evidenceRefs, []);
    assert.equal(JSON.stringify(view).includes('kb:100'), false);
  }
});
test('restricted unpublished capability has generic refusal without title, ID, scopes, KB or count', () => {
  const forbidden = descriptor({ actionId: 'private.very-secret', title: 'Confidential feature', disclosure: 'restricted',
    readiness: { ...descriptor().readiness, permittedForActor: 'no' } });
  const v = projectCapabilityHelp(forbidden, kb);
  assert.equal(v.visible, false);
  assert.equal(JSON.stringify(v).includes('Confidential feature'), false);
  assert.equal(JSON.stringify(v).includes('private.very-secret'), false);
  assert.equal(JSON.stringify(v).includes('kb:100'), false);
  const matches = searchCapabilityHelp('Confidential feature', [descriptor(), forbidden]);
  assert.equal(matches.items.length, 0);
});
test('unknown permission on restricted capability remains hidden', () => {
  const v = projectCapabilityHelp(descriptor({ disclosure: 'restricted', readiness: { ...descriptor().readiness, permittedForActor: 'unknown' } }));
  assert.equal(v.visible, false);
});
test('query search filters before matching terms and respects upper bounds', () => {
  const ds = Array.from({ length: 210 }, (_, i) => descriptor({ actionId: `ui.panel-${i}`, title: `Panel ${i}` }));
  const all = searchCapabilityHelp('panel', ds);
  assert.equal(all.items.length, 20);
  assert.equal(searchCapabilityHelp('x'.repeat(201), ds).status, 'unavailable');
  assert.equal(searchCapabilityHelp('nothing matches', ds).items.length, 0);
});
test('safe examples reject shell, provider URLs, credentials and executor fallback', () => {
  for (const textCommand of ['!run rm -rf /', 'grant permission', 'send bearer token', 'https://ai.example/',
    'exec command', 'open panel\nINJECT', 'open password']) {
    const v = projectCapabilityHelp(descriptor({ textCommand }));
    assert.equal(v.textCommand, undefined);
    assert.equal(v.canRequestPreview, false);
  }
});
test('invalid external ID and provenance produce generic refusal', () => {
  for (const bad of ['https://private/token=abcd', 'x'.repeat(130), 'abc\nxyz', '<script>']) {
    const v = projectCapabilityHelp(descriptor({ actionId: bad }));
    assert.equal(v.visible, false);
    assert.equal(v.canRequestPreview, false);
  }
});
test('same action appears for contextual lookup and typed one-query search', () => {
  const v = searchCapabilityHelp('open panel', [descriptor()], { 'ui.open-panel': kb });
  assert.equal(v.items.length, 1);
  assert.equal(v.items[0]?.actionId, projectCapabilityHelp(descriptor(), kb).actionId);
  assert.equal(v.items[0]?.a11y.role, 'region');
});
test('malformed and adversarial broker records fail closed instead of advertising capability', () => {
  for (const bad of [
    { ...descriptor(), readiness: undefined },
    { ...descriptor(), readiness: { ...descriptor().readiness, availableNow: 'possibly' } },
    { ...descriptor(), prerequisites: undefined },
    { ...descriptor(), title: undefined },
    { ...descriptor(), disclosure: 'secretly-public' },
    { ...descriptor(), risk: 'R900' },
  ]) {
    const v = projectCapabilityHelp(bad as CapabilityDescriptor);
    assert.equal(v.visible, false);
    assert.equal(v.canRequestPreview, false);
  }
});
test('invalid KB evidence array does not expose unauthorized KB identifiers', () => {
  const view = projectCapabilityHelp(descriptor(), { ...kb, evidenceRefs: undefined } as unknown as AuthorizedKbHelp);
  assert.equal(view.provenance?.kbStableId, undefined);
});
