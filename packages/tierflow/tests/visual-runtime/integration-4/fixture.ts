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
    deviceSurface: 'desktop',
    currentVersions: { hostWorld: 'world-1', policy: 'policy-1', kb: 'kb-1', uiRevision: 'doc-3' },
  };
  // The Host supplies a descriptor context per real surface. The catalog bytes,
  // digests and reviews are identical; only the surface label differs.
  const descriptors = {
    desktop: descriptorBase,
    phone: { ...descriptorBase, deviceSurface: 'phone' as const },
  };

  const context = fixtureTrustedContext({ policyRevision: 'policy-1', surface: 'pc',
    deviceRef: 'desktop_1', sessionExpiresAt: NOW + 600_000, grantExpiresAt: NOW + 600_000 });
  const auth = mutableFixtureBroker(context);
  const client = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), auth.broker, { now: () => NOW });
  const feed = createScopedKnowledgeFeed(client, auth.broker, { now: () => NOW });
  const query = { schema: 'vivim.knowledge-query/1' as const, requestId: 'i4_req',
    personalWorldRef: 'world_a', surface: 'pc' as const, purpose: 'task' as const,
    entityRef: FIXTURE_IDS.alpha, limit: 1 };

  const hostActions: HostActionDescriptor[] = [
    { actionId, catalogVersion: 6, risk, readiness: 'source_wired', requiredScopes: ['control:read'],
      argsSchema: {}, evidence: 'verified', prerequisites: [] },
  ];
  const hostOptions: HostFixtureOptions = { actions: hostActions, catalogVersion: 6, catalogDigest: catalogHash };
  const hostContext: TrustedFixtureHostContext = {
    schema: 'fixture.trusted-host-context/1', authenticated: true, ownerRef: 'owner_a',
    actorRef: 'actor_a', deviceRef: 'desktop_1', sessionRef: 'session_1', worldRef: 'world_a',
    surface: 'desktop', nowMs: NOW, sessionExpiresAtMs: NOW + 600_000, worldRevision: 'world-1',
    policyRevision: 'policy-1', catalogVersion: 6, catalogDigest: catalogHash,
    availabilityByAction: { [actionId]: 'yes' },
    grant: { grantRef: 'host_grant', status: 'active', ownerRef: 'owner_a', actorRef: 'actor_a',
      deviceRef: 'desktop_1', sessionRef: 'session_1', worldRef: 'world_a',
      expiresAtMs: NOW + 600_000, revision: 'grant-rev-1', scopes: ['control:read'] },
  };

  const previewHost = createHostCapabilityFixture(hostOptions);
  const founder = await projectFounderWorkspaceJourney({
    knowledgeBroker: auth.broker, knowledgeClient: client, host: previewHost, hostContext,
    workspaceRef: 'workspace_a', documentId: 'founder_workspace', requestId: 'founder_req',
    projectStableIds: [FIXTURE_IDS.alpha],
    commandInput: { commandId: 'cmd_i4', source: { surface: 'text', inputDigest: HEX },
      text: `/${SEMANTIC_ID}`, expectedVersions: { hostWorld: 'world-1', policy: 'policy-1' } },
    commandContext: { rows: [], descriptors: [], currentVersions: descriptorBase.currentVersions },
    hostCatalogDigest: catalogHash, onboardingState: newJourney(),
    onboardingEvidence: { provider: { source: 'studio', proof: 'tab_ready', observedAtMs: NOW },
      owner: { source: 'other', selectionConfirmed: 'yes' } },
    viewportPx: 1280, nowMs: NOW,
  });
  const readGateway = createWave3ReadGatewayFixture(hostOptions);
  const hostRead = readGateway.readCapability(hostContext, actionId);

  // A synthetic-fixture Host read port for H. It never grants authority by itself.
  const hostPort: Wave4HostReadPort = {
    evidenceClass: 'synthetic_fixture',
    currentScope: () => ({
      schema: 'vivim.host-authorized-read-scope/1' as const, authenticated: true,
      ownerRef: 'owner_a', actorRef: 'actor_a', worldRef: 'world_a', deviceRef: 'desktop_1',
      sessionRef: 'session_1', surface: 'desktop' as const, purpose: 'founder_workspace' as const,
      nowMs: NOW, sessionExpiresAtMs: NOW + 600_000, worldRevision: 'world-1', policyRevision: 'policy-1',
      catalogVersion: 6, catalogDigest: catalogHash,
      grant: { grantRef: 'host_grant', revision: 'grant-rev-1', status: 'active' as const,
        ownerRef: 'owner_a', actorRef: 'actor_a', worldRef: 'world_a', deviceRef: 'desktop_1',
        sessionRef: 'session_1', purpose: 'founder_workspace' as const, expiresAtMs: NOW + 300_000,
        scopes: ['control:read'] },
    }),
    readCapability: () => ({
      schema: 'vivim.host-capability/1' as const, actionId, catalogVersion: 6, catalogDigest: catalogHash,
      risk: 'R0' as const, requiredScopes: ['control:read'], prerequisites: [],
      supportedByBuild: 'yes' as const, availableNow: 'yes' as const, permittedForActor: 'yes' as const,
      verifiedByEvidence: 'yes' as const, reasonCodes: [],
      source: { authority: 'host-catalog-fixture' as const, observedAtMs: NOW, proof: 'fixture_only' as const },
    }),
    readPlan: () => null,
  };

  const revisionDocument = {
    schemaVersion: 1 as const,
    world: { id: 'world_a', kind: 'custom' as const, title: 'Founder Workspace', accent: '#f2b134',
      origin: { x: 0, y: 0, z: 0 }, unitsPerMeter: 1 },
    objects: [], relationships: [], dataFlows: [], entries: ['r1'],
  };

  const input: Integration4Input = {
    document,
    pins: { actions: [{ ...ACTION }], bindings: [{ id: 'source', version: 2, nodeId: 'project',
      knowledgeRef: FIXTURE_IDS.alpha, provenanceRef: 'fixture-evidence:kn_alpha' }] },
    knowledge: { feed, broker: auth.broker, query },
    now: () => NOW,
    desktop: { host: { state: 'connected', ownerRef: 'owner_a', worldRef: 'workspace_a',
      decision: 'read-only', publisher: 'harness', anotherPublisherPresent: false },
      lastDisplayedRevision: null },
    phone: { shell: { app: 'existing-vivim-apk', relay: 'existing-mobile-relay',
      publisher: 'harness', viewportPx: 360 },
      pairing: { state: 'paired', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
        sessionRef: 'session_1', epoch: 3, receivedSequence: 51, lastAcceptedSequence: 50,
        expiresAtMs: NOW + 600_000 },
      host: { state: 'online', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
        sessionRef: 'session_1', pairingEpoch: 3, policyRevision: 9, nowMs: NOW,
        grantExpiresAtMs: NOW + 600_000, documentRevision: document.revision, denied: false,
        actionRisks: [{ nodeId: 'preview', id: ACTION.id, version: ACTION.version, risk: 'R0',
          policyRevision: 9 }] } },
    session: {
      principal: { ...principal, deviceRef: 'desktop_1' },
      readCurrent: (_p: VerifiedUiPrincipal, _id: string) => ({ ok: true as const, value: {
        schema: 'UiRevisionPort/1' as const, documentId: document.documentId, revision: 3,
        operation: 'publish' as const, actorRef: 'actor_a', document: revisionDocument,
        documentDigest: contentHash(revisionDocument as never) } }),
      watermark: (_p: VerifiedUiPrincipal, _id: string) => ({ schema: 'vivim.visual-session-watermark/1' as const,
        ownerRef: 'owner_a', deviceRef: 'desktop_1', sessionRef: 'session_1',
        policyRevision: 'policy-1', documentId: document.documentId, sequence: 7, revision: 3,
        documentDigest: contentHash(revisionDocument as never) }),
    },
    hostPort,
    hostQuery: { actionId, purpose: 'founder_workspace',
      expected: { worldRevision: 'world-1', policyRevision: 'policy-1', catalogVersion: 6,
        catalogDigest: catalogHash } },
    journey: {
      installation: { desktopReady: true, androidInstalled: true, dedicatedBrowserReady: true },
      host: { source: 'host', connected: true, observedAtMs: NOW, worldRevision: 'world-1',
        principal: { ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'desktop_1',
          sessionRef: 'session_1' },
        grant: { status: 'active', ownerApproved: true, expiresAtMs: NOW + 600_000,
          scopes: ['project:read', 'control:plan'] } },
      pairing: { source: 'host', enrollment: 'active', enrollmentExpiresAtMs: NOW + 600_000,
        tokenStatus: 'redeemed', tokenExpiresAtMs: NOW + 600_000,
        principal: { ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'desktop_1',
          sessionRef: 'session_1' } },
      provider: { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW },
      action: null, reconnect: null,
      nowMs: NOW, viewportPx: 1280, shell: 'desktop',
    },
    founder, hostRead,
    descriptors,
    transport: {
      desktop: {
        authority: { ownerId: 'owner_a', worldId: 'workspace_a', deviceId: 'desktop_1',
          sessionId: 'session_1', device: 'desktop' as const, authenticated: true, granted: true, connected: true,
          nowMs: NOW, policyVersion: 'policy-1', hostWorldVersion: 'world-1', catalogVersion: 6,
          catalogSha256: catalogHash, hqRegistrySha256: sha(HQ),
          reviewed: { semanticId: SEMANTIC_ID, actionId, risk: 'R0' as const,
            argsSchemaSha256: descriptorArgsDigest({})! } },
        controls: { correlationId: 'corr_i4', idempotencyKey: 'idem_i4', nonce: 'nonce_i4',
          cancelId: 'cancel_i4', sequence: 1, issuedAtMs: NOW - 1000, expiresAtMs: NOW + 60_000 },
      },
      phone: {
        authority: { ownerId: 'owner_a', worldId: 'workspace_a', deviceId: 'phone_1',
          sessionId: 'session_1', device: 'phone' as const, authenticated: true, granted: true, connected: true,
          nowMs: NOW, policyVersion: 'policy-1', hostWorldVersion: 'world-1', catalogVersion: 6,
          catalogSha256: catalogHash, hqRegistrySha256: sha(HQ),
          reviewed: { semanticId: SEMANTIC_ID, actionId, risk: 'R0' as const,
            argsSchemaSha256: descriptorArgsDigest({})! } },
        controls: { correlationId: 'corr_i4_phone', idempotencyKey: 'idem_i4_phone', nonce: 'nonce_i4_phone',
          cancelId: 'cancel_i4_phone', sequence: 1, issuedAtMs: NOW - 1000, expiresAtMs: NOW + 60_000 },
      },
    },
    ...overrides,
  };
  return { input, feed, auth, client, catalogHash, hostOptions, hostContext, document };
}
