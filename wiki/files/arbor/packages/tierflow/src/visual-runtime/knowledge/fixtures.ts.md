# File: packages/tierflow/src/visual-runtime/knowledge/fixtures.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/fixtures.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3502 B |
| Lines | 48 |
| Hash | f9fc8a969d83 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | function | 4 | no | const source = (nativeId: string) =&gt; ({ authority: &#39;fixture.hq&#39;, nativeId, nativeVersion: &#39;rev-3&#39;, digest: `sha256:synthetic-${nativeId}` }); |
| make | function | 5 | no | const make = (stableId: string, ownerRef: string, personalWorldRef: string, projectRef: string, label: string, sensitivity: CanonicalKnowledgeRecord[&#39;sensitivity&#39;] = &#39;S0&#39;): CanonicalKnowledgeRecord =… |
| FIXTURE_IDS | const | 11 | yes | export const FIXTURE_IDS = { |
| canonicalKnowledgeFixtures | function | 17 | yes | export function canonicalKnowledgeFixtures(): CanonicalKnowledgeRecord[] { |
| a | const | 18 | no | const a = make(FIXTURE_IDS.alpha, &#39;owner_a&#39;, &#39;world_a&#39;, &#39;project_one&#39;, &#39;Shared project path&#39;); |
| b | const | 19 | no | const b = make(FIXTURE_IDS.beta, &#39;owner_a&#39;, &#39;world_a&#39;, &#39;project_two&#39;, &#39;Shared project path&#39;); |
| fixtureTrustedContext | function | 33 | yes | export function fixtureTrustedContext(overrides: Partial&lt;TrustedKnowledgeContext&gt; = {}): TrustedKnowledgeContext { |
| mutableFixtureBroker | function | 42 | yes | export function mutableFixtureBroker(initial: TrustedKnowledgeContext = fixtureTrustedContext()): { |
| current | variable | 46 | no | let current: TrustedKnowledgeContext \| null = initial; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./client.ts | import | 2 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](./client.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts](../../../tests/visual-runtime/knowledge-privacy.test.ts.md) | ../../src/visual-runtime/knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/knowledge.test.ts](../../../tests/visual-runtime/knowledge.test.ts.md) | ../../src/visual-runtime/knowledge/fixtures.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/knowledge/fixtures.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
