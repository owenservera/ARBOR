/** Non-personal synthetic records. Never derived from owner private KB data. */
import type { CanonicalKnowledgeRecord, TrustedKnowledgeContext, TrustedKnowledgeBroker } from './client.ts';

const source = (nativeId: string) => ({ authority: 'fixture.hq', nativeId, nativeVersion: 'rev-3', digest: `sha256:synthetic-${nativeId}` });
const make = (stableId: string, ownerRef: string, personalWorldRef: string, projectRef: string, label: string, sensitivity: CanonicalKnowledgeRecord['sensitivity'] = 'S0'): CanonicalKnowledgeRecord => ({
  stableId, ownerRef, personalWorldRef, projectRef, label, sensitivity,
  kind: 'project_note', summary: `Synthetic note for ${label}`, path: 'src/README.md', availability: 'present',
  claimStatus: 'observed', source: source(stableId), evidenceRefs: [`fixture-evidence:${stableId}`],
  provenance: ['synthetic.corpus/1'], asOf: '2026-11-06T12:00:00.000Z',
});
export const FIXTURE_IDS = {
  alpha: 'kn_8f3a0c71', beta: 'kn_3c6f10ba', otherOwner: 'kn_8d2936aa', otherWorld: 'kn_7121ddac',
  sensitive: 'kn_7e8d3b19', secret: 'kn_4ddad7b0', redacted: 'kn_877efac4', stale: 'kn_9ae15b18',
  deleted: 'kn_690f13dd', revoked: 'kn_0c011fcc', restrictedDevice: 'kn_001277c0',
} as const;

export function canonicalKnowledgeFixtures(): CanonicalKnowledgeRecord[] {
  const a = make(FIXTURE_IDS.alpha, 'owner_a', 'world_a', 'project_one', 'Shared project path');
  const b = make(FIXTURE_IDS.beta, 'owner_a', 'world_a', 'project_two', 'Shared project path');
  return [
    a, b,
    make(FIXTURE_IDS.otherOwner, 'owner_b', 'world_a', 'project_three', 'Owner B private'),
    make(FIXTURE_IDS.otherWorld, 'owner_a', 'world_b', 'project_four', 'Another World private'),
    make(FIXTURE_IDS.sensitive, 'owner_a', 'world_a', 'project_one', 'Sensitive medical sample', 'S2'),
    make(FIXTURE_IDS.secret, 'owner_a', 'world_a', 'project_one', 'Third-party secret sample', 'S3'),
    { ...make(FIXTURE_IDS.redacted, 'owner_a', 'world_a', 'project_one', 'Hidden clue'), availability: 'redacted' },
    { ...make(FIXTURE_IDS.stale, 'owner_a', 'world_a', 'project_one', 'Outdated sample', 'S1'), availability: 'stale' },
    { ...make(FIXTURE_IDS.deleted, 'owner_a', 'world_a', 'project_one', 'Deleted sample'), availability: 'deleted' },
    { ...make(FIXTURE_IDS.revoked, 'owner_a', 'world_a', 'project_one', 'Revoked sample'), availability: 'revoked' },
    { ...make(FIXTURE_IDS.restrictedDevice, 'owner_a', 'world_a', 'project_one', 'Desktop-only sample'), allowedDeviceRefs: ['desktop_1'] },
  ];
}
export function fixtureTrustedContext(overrides: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext {
  return {
    ownerRef: 'owner_a', sessionRef: 'session_1', deviceRef: 'desktop_1', personalWorldRef: 'world_a',
    surface: 'pc', allowedPurposes: ['task', 'explain', 'help'], allowPhoneS1: false,
    policyRevision: 'policy_1', sessionExpiresAt: Date.parse('2030-01-01'), grantExpiresAt: Date.parse('2030-01-01'),
    revoked: false, offline: false, ...overrides,
  };
}
/** Test-only broker lets fixtures model a separate trusted authentication layer. */
export function mutableFixtureBroker(initial: TrustedKnowledgeContext = fixtureTrustedContext()): {
  broker: TrustedKnowledgeBroker;
  setContext(context: TrustedKnowledgeContext | null): void;
} {
  let current: TrustedKnowledgeContext | null = initial;
  return { broker: { readContext: () => current }, setContext: next => { current = next; } };
}
