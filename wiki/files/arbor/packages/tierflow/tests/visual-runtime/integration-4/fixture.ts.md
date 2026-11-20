# File: packages/tierflow/tests/visual-runtime/integration-4/fixture.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-4/fixture.ts |
| Language | TypeScript |
| Kind | source |
| Size | 15008 B |
| Lines | 239 |
| Hash | b29799b4aee4 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 28 | yes | export const NOW = Date.parse(&#39;2026-11-06T19:00:00.000Z&#39;); |
| sha | function | 29 | yes | export const sha = (s: string) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| HEX | const | 30 | yes | export const HEX = &#39;a&#39;.repeat(64); |
| HQ | const | 31 | yes | export const HQ = &#39;fixture HQ registry bytes; no live action-registry claim&#39;; |
| principal | const | 33 | yes | export const principal: VerifiedUiPrincipal = { |
| ACTION | const | 39 | yes | export const ACTION = { id: &#39;ui.theme.show&#39;, version: 1 } as const; |
| SEMANTIC_ID | const | 40 | yes | export const SEMANTIC_ID = &#39;ui.theme.show@1&#39;; |
| founderDocument | function | 43 | yes | export function founderDocument(): UiDocument { |
| setup | function | 63 | yes | export async function setup(overrides: Partial&lt;Integration4Input&gt; = {}) { |
| document | const | 64 | no | const document = founderDocument(); |
| actionId | const | 65 | no | const actionId = ACTION.id; |
| risk | const | 66 | no | const risk = &#39;R0&#39; as const; |
| catalogText | const | 67 | no | const catalogText = JSON.stringify({ schema: &#39;vivim.control-action-catalog/1&#39;, version: 6, policy: { allUserFacingActionsRequireTextPath: true, uiSharesTypedExecutor: true, unverifiedActionsAreNotAva… |
| catalogHash | const | 74 | no | const catalogHash = sha(catalogText); |
| descriptorBase | const | 75 | no | const descriptorBase: DescriptorProofContext = { |
| descriptors | const | 86 | no | const descriptors = { |
| context | const | 91 | no | const context = fixtureTrustedContext({ policyRevision: &#39;policy-1&#39;, surface: &#39;pc&#39;, deviceRef: &#39;desktop_1&#39;, sessionExpiresAt: NOW + 600_000, grantExpiresAt: NOW + 600_000 }); |
| auth | const | 93 | no | const auth = mutableFixtureBroker(context); |
| client | const | 94 | no | const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () =&gt; NOW }); |
| feed | const | 95 | no | const feed = createScopedKnowledgeFeed(client, auth.broker, { now: () =&gt; NOW }); |
| query | const | 96 | no | const query = { schema: &#39;vivim.knowledge-query/1&#39; as const, requestId: &#39;i4_req&#39;, |
| hostActions | const | 100 | no | const hostActions: HostActionDescriptor[] = [ |
| hostOptions | const | 104 | no | const hostOptions: HostFixtureOptions = { actions: hostActions, catalogVersion: 6, catalogDigest: catalogHash }; |
| hostContext | const | 105 | no | const hostContext: TrustedFixtureHostContext = { |
| previewHost | const | 116 | no | const previewHost = createHostCapabilityFixture(hostOptions); |
| founder | const | 117 | no | const founder = await projectFounderWorkspaceJourney({ knowledgeBroker: auth.broker, knowledgeClient: client, host: previewHost, hostContext, workspaceRef: &#39;workspace_a&#39;, documentId: &#39;founder_workspa… |
| readGateway | const | 129 | no | const readGateway = createWave3ReadGatewayFixture(hostOptions); |
| hostRead | const | 130 | no | const hostRead = readGateway.readCapability(hostContext, actionId); |
| hostPort | const | 133 | no | const hostPort: Wave4HostReadPort = { |
| revisionDocument | const | 156 | no | const revisionDocument = { |
| input | const | 163 | no | const input: Integration4Input = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 12 | external |
| ../../../src/visual-runtime/integration-4/compose.ts | import | 13 | [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../../../src/visual-runtime/integration-4/compose.ts.md) |
| ../../../src/visual-runtime/document/schema.ts | import | 14 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../../src/visual-runtime/document/schema.ts.md) |
| ../../../src/visual-runtime/knowledge/client.ts | import | 15 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../../src/visual-runtime/knowledge/client.ts.md) |
| ../../../src/visual-runtime/knowledge/fixtures.ts | import | 16 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../../src/visual-runtime/knowledge/fixtures.ts.md) |
| ../../../src/visual-runtime/knowledge/wave3-feed-projection.ts | import | 17 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../../src/visual-runtime/knowledge/wave3-feed-projection.ts.md) |
| ../../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 18 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../../src/visual-runtime/experience/wave3-journey-fixture.ts | import | 19 | [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../../../src/visual-runtime/experience/wave3-journey-fixture.ts.md) |
| ../../../src/visual-runtime/host/wave3-read-gateway-fixture.ts | import | 20 | [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../../../src/visual-runtime/host/wave3-read-gateway-fixture.ts.md) |
| ../../../src/visual-runtime/host/fixture.ts | import | 21 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../../src/visual-runtime/host/fixture.ts.md) |
| ../../../src/visual-runtime/experience/onboarding.ts | import | 22 | [packages/tierflow/src/visual-runtime/experience/onboarding.ts](../../../src/visual-runtime/experience/onboarding.ts.md) |
| ../../../src/ui/hash.ts | import | 23 | [packages/tierflow/src/ui/hash.ts](../../../src/ui/hash.ts.md) |
| ../../../src/visual-runtime/revisions/port.ts | import | 24 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../../src/visual-runtime/revisions/port.ts.md) |
| ../../../src/visual-runtime/host/port.ts | import | 25 | [packages/tierflow/src/visual-runtime/host/port.ts](../../../src/visual-runtime/host/port.ts.md) |
| ../../../src/visual-runtime/host/wave4-h-host-status-contract.ts | import | 26 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../../src/visual-runtime/host/wave4-h-host-status-contract.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/i4-real-import.test.ts](../final-wave/integration/i4-real-import.test.ts.md) | ../../integration-4/fixture.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../final-wave/integration/master.test.ts.md) | ../../integration-4/fixture.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../final-wave/lane-f/real-wave4b-regression.test.ts.md) | ../../integration-4/fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts](./compose.test.ts.md) | ./fixture.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Integration 4: ONE Founder Workspace through the EIGHT real Wave 4 modules.
 *
 * Real imports only: A/B/C/D/E/F/G/H lane modules plus the real Wave 3 A, B, D,
 * F and G modules they build on. Synthetic inputs are strictly EXTERNAL facts a
 * Host/Android owner would supply (broker, catalog bytes, pairing epoch, Host
 * read port). No lane module is mocked and no contract is re-implemented here.
 *
 * Every lane is measured independently. A lane that refuses is reported as a
 * measured BLOCKED gate; the composition never silently works around it.
 */
import { createHash } from 'node:crypto';
import { type Integration4Input } from '../../../src/visual-runtime/integration-4/compose.ts';
import { UI_DOCUMENT_SCHEMA, type UiDocument } from '../../../src/visual-runtime/document/schema.ts';
import { createFixtureKnowledgeClient } from '../../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, FIXTURE_IDS, fixtureTrustedContext, mutableFixtureBroker } from '../../../src/visual-runtime/knowledge/fixtures.ts';
import { createScopedKnowledgeFeed } from '../../../src/visual-runtime/knowledge/wave3-feed-projection.ts';
import { descriptorArgsDigest, type DescriptorProofContext } from '../../../src/visual-runtime/command/wave3-descriptor-proof.ts';
import { projectFounderWorkspaceJourney } from '../../../src/visual-runtime/experience/wave3-journey-fixture.ts';
import { createWave3ReadGatewayFixture } from '../../../src/visual-runtime/host/wave3-read-gateway-fixture.ts';
import { createHostCapabilityFixture, type HostFixtureOptions } from '../../../src/visual-runtime/host/fixture.ts';
import { newJourney } from '../../../src/visual-runtime/experience/onboarding.ts';
import { contentHash } from '../../../src/ui/hash.ts';
import type { VerifiedUiPrincipal } from '../../../src/visual-runtime/revisions/port.ts';
import type { HostActionDescriptor, TrustedFixtureHostContext } from '../../../src/visual-runtime/host/port.ts';
import type { Wave4HostReadPort } from '../../../src/visual-runtime/host/wave4-h-host-status-contract.ts';

export const NOW = Date.parse('2026-11-06T19:00:00.000Z');
export const sha = (s: string) => createHash('sha256').update(s).digest('hex');
export const HEX = 'a'.repeat(64);
export const HQ = 'fixture HQ registry bytes; no live action-registry claim';

export const principal: VerifiedUiPrincipal = {
  ownerRef: 'owner_a', actorRef: 'actor_a', deviceRef: 'desktop_1',
  sessionRef: 'session_1', grantRef: 'ui_grant', policyRevision: 'policy-1',
  scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
};

export const ACTION = { id: 'ui.theme.show', version: 1 } as const;
export const SEMANTIC_ID = 'ui.theme.show@1';

/** The canonical Lane A display document for the Founder Workspace. */
export function founderDocument(): UiDocument {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: 'world_a', revision: 3,
    scope: { ownerRef: 'owner_a', workspaceRef: 'workspace_a' }, rootId: 'root',
    nodes: [
      { id: 'root', type: 'stack', props: { direction: 'vertical' }, children: ['project', 'preview'],
        a11y: { role: 'main', name: 'Founder Workspace' } },
      { id: 'project', type: 'project-card', props: { title: 'Shared project path' }, children: [],
        bindingRefs: ['source'], a11y: { role: 'group', name: 'Shared project path' } },
      { id: 'preview', type: 'button', props: { label: 'Preview action' }, children: [],
        actionRefs: [{ ...ACTION }], a11y: { role: 'button', name: 'Preview action', focusOrder: 1 } },
    ],
    bindings: [{ id: 'source', version: 2, nodeId: 'project', field: 'title',
      knowledgeRef: FIXTURE_IDS.alpha, provenanceRef: 'fixture-evidence:kn_alpha',
      readScope: 'owner', availability: 'present' }],
    views: [{ id: 'phone', version: 1, kind: '2d', viewport: 'phone' },
      { id: 'desktop', version: 1, kind: '2d', viewport: 'desktop' }],
  };
}

export async function setup(overrides: Partial<Integration4Input> = {}) {
  const document = founderDocument();
  const actionId = ACTION.id;
  const risk = 'R0' as const;
  const catalogText = JSON.stringify({
    schema: 'vivim.control-action-catalog/1', version: 6,
    policy: { allUserFacingActionsRequireTextPath: true, uiSharesTypedExecutor: true,
      unverifiedActionsAreNotAvailable: true, modelRole: 'candidate_only',
      sourceWiredIsNotLiveAcceptance: true },
    actions: [{ id: actionId, risk, readiness: 'source_wired', args: {} }],
  });
  const catalogHash = sha(catalogText);
  const descriptorBase: DescriptorProofContext = {
    schema: 'vivim.descriptor-proof-context-fixture/1', catalogText,
    expectedCatalogSha256: catalogHash, hqRegistryText: HQ, expectedHqRegistrySha256: sha(HQ),
    reviews: [{ schema: 'vivim.reviewed-host-binding-fixture/1', semanticId: SEMANTIC_ID,
      semanticVersion: '1', actionId, risk, argsSchemaSha256: descriptorArgsDigest({})!,
      hostCatalogSha256: catalogHash, hqRegistrySha256: sha(HQ), reviewed: true }],
```

_First 80 of 240 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
