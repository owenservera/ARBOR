/**
 * Master integration: ONE Founder Workspace through the eight REAL final-wave
 * lane modules and the REAL Wave 4 A-H composition.
 *
 * Nothing here is mocked: every lane module is imported and executed. The only
 * synthetic values are external facts a Host/Android/Studio owner supplies.
 *
 * These tests assert what was MEASURED. They never assert a GO, never claim a
 * device, never claim a live Host and never activate a publisher.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { composeMasterIntegration, type MasterInput, type MasterResult } from '../../../../src/visual-runtime/final-wave/integration/master.ts';
import { setup as setupIntegration4, founderDocument, ACTION, NOW } from '../../integration-4/fixture.ts';
import { normalizeLaneAAuthoring, LANE_A_CONTEXT_SCHEMA, type AuthorContext, type AuthorIntent } from '../../../../src/visual-runtime/final-wave/lane-a/normalize.ts';
import { TEMPLATE_CATALOG_DIGEST } from '../../../../src/visual-runtime/final-wave/lane-c/templates.ts';
import { renderWave3Semantics } from '../../../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave3ActionSemantics } from '../../../../src/visual-runtime/document/wave3-action-semantics.ts';
import { projectWave4DesktopAdapter } from '../../../../src/visual-runtime/device/wave4-desktop-adapter.ts';
import { projectWave4PhoneAdapter } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';
import { contentHash } from '../../../../src/ui/hash.ts';
import { createWave4HostStatusContract } from '../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts';
import type { UiRevisionPort, VerifiedUiPrincipal, UiFixtureRevision } from '../../../../src/visual-runtime/revisions/port.ts';
import type { ClientParityInput } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';
import type { ShadowFrame, MigrationInput, PublisherControl, FenceObservation, RollbackInput } from '../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts';
import type { Proof, LaneHandoff, NegativeWitness, NegativeInvariant } from '../../../../src/visual-runtime/final-wave/lane-h/verification.ts';

const H = (letter = 'a') => `sha256:${letter.repeat(64)}` as `sha256:${string}`;
const S = (letter = 'a') => letter.repeat(40);
const h = (s: string) => createHash('sha256').update(s).digest('hex');

const TIERFLOW_SHA = 'b5477de6ffd10bb5082a83854880ca4538bc36e6';
const HARNESS_SHA = '09382c61f74a304f120b05445f6dfa900b58494b';
const HQ_SHA = '6679752362a5ef58aa66e2af5463f9d81077001c';

/** The persisted World UI document: schemaVersion + world + objects + relationships + dataFlows. */
const WORLD = {
  schemaVersion: 1 as const,
  world: { id: 'founder-home', kind: 'home' as const, title: 'Founder Workspace',
    accent: '#000000', origin: { x: 0, y: 0, z: 0 }, unitsPerMeter: 1 },
  objects: [{ id: 'task_panel', layer: 'content' as const, kind: 'static' as const, shape: 'box' as const,
    title: 'Blocked tasks',
    transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    props: { panel_type: 'blocked_tasks' } }],
  relationships: [], dataFlows: [],
};

/** Lane A trusted broker projection (HQ semantics + Harness NLCL), not a parser authority. */
const AUTHOR_PINS = { hostWorld: 'world-v8', policy: 'policy-v8', uiRevision: '12', kb: 'kb-v8' };
const AUTHOR_SCOPE = { ownerId: 'owner_a', actorId: 'actor_a', deviceId: 'desktop_a',
  sessionId: 'session_a', worldId: 'world_a', documentId: 'founder_workspace' };
const AUTHOR_ARGS = { target_kind: 'document', target_ref: 'founder_workspace', panel_type: 'blocked_tasks' };

function authorContext(): AuthorContext {
  const hm = h('hq-registry'), hp = h('policy'), hs = h('schema');
  const row = {
    semanticRef: { id: 'ui.create@1', version: '1', sourceHash: hm },
    target: { owner: 'ui_document' as const, actionId: 'ui.panel.create', catalogVersion: 1 },
    argsSchema: {
      target_kind: { type: 'enum' as const, values: ['object', 'document'] },
      target_ref: { type: 'string' as const, min: 1, max: 128 },
      panel_type: { type: 'enum' as const, values: ['blocked_tasks', 'projects'] },
    },
    argsSchemaHash: hs, risk: 'R1' as const,
    riskSource: { authority: 'ui_contract' as const, sourceHash: hp },
    implementationStatus: 'verified' as const, reviewedEnabled: true,
  };
  const descriptor = {
    target: row.target, argsSchemaHash: hs, sourceHash: hp, risk: 'R1' as const,
    implementationStatus: 'verified' as const,
    capability: { supportedByBuild: true, availableNow: 'yes' as const, permittedForActor: 'unknown' as const,
      verifiedByEvidence: false, reasonCodes: ['INERT_FIXTURE_ONLY'] },
  };
  return {
    schema: LANE_A_CONTEXT_SCHEMA, scope: AUTHOR_SCOPE, device: 'desktop', revision: 12,
    documentDigest: h('doc12'), currentVersions: AUTHOR_PINS,
    compiled: { rows: [row], descriptors: [descriptor], currentVersions: AUTHOR_PINS },
    meanings: [{ semanticId: 'ui.create@1', schema: 'hq.semantic-registry/1', status: 'current', sourceHash: hm }],
    nlcl: [{ schema: 'vivim.control-language/1', text: 'add a blocked tasks panel', status: 'ok',
      semanticId: 'ui.create@1', args: AUTHOR_ARGS, gaps: 0, alternatives: 0, sourceHash: h('nlcl') }],
    controls: [{ id: 'blocked_panel', semanticId: 'ui.create@1', args: AUTHOR_ARGS,
      enabled: true, visible: true, surfaces: ['touch', 'keyboard', 'studio'] }],
    targets: [{ kind: 'document', ref: 'founder_workspace' }, { kind: 'object', ref: 'task_panel' }],
  };
}
function authorIntent(): AuthorIntent {
  return { schema: 'vivim.final-wave-lane-a/1', surface: 'text', commandId: 'cmd_master_1',
    scope: AUTHOR_SCOPE, expectedRevision: 12, expectedDocumentDigest: h('doc12'),
    expectedVersions: AUTHOR_PINS, text: 'add a blocked tasks panel' };
}

/** Lane B: the existing revision authority. Effect-free, in-memory, one writer. */
function studioPort(document: unknown, digest: string): UiRevisionPort {
  const revision: UiFixtureRevision = {
    schema: 'UiRevisionPort/1', documentId: 'founder-home', revision: 4,
    document, documentDigest: digest, actorRef: 'actor_a', operation: 'publish',
  };
  const fail = (code: 'UNAVAILABLE' | 'NOT_FOUND') => ({ ok: false as const, code, message: code });
  return {
    readCurrent: () => ({ ok: true as const, value: revision }),
    createDraft: () => fail('UNAVAILABLE'),
    editDraft: () => fail('UNAVAILABLE'),
    preview: () => fail('UNAVAILABLE'),
    publish: () => fail('UNAVAILABLE'),
    rollback: () => fail('UNAVAILABLE'),
    getCommandOutcome: () => fail('NOT_FOUND'),
  };
}

function laneGInputs() {
  const migration: MigrationInput = {
    snapshot: { schema: 'vivim.legacy-ui-snapshot/1', ownerRef: 'owner', worldRef: 'world-local',
      documentId: 'founder-home', namespace: 'founder-workspace', sourceSchema: 'vivim.ui-revision/1',
      sourceVersion: 'host-1', sourceHash: H('b'), sourceCursor: 'cursor-3', activeRevision: 1,
      maxHistoricalRevision: 3, sourceReaderVersion: 'host-v1',
      history: [
        { revision: 1, sourceId: 'rev-1', digest: H('c'), parentRevision: null, status: 'applied' },
        { revision: 2, sourceId: 'rev-2', digest: H('d'), parentRevision: 1, status: 'superseded' },
        { revision: 3, sourceId: 'rev-3', digest: H('e'), parentRevision: 2, status: 'reverted' }] },
    target: { schema: 'vivim.ui-document/1', documentId: 'founder-home', ownerRef: 'owner',
      sourceVersion: 'host-1', expectedRevision: 0, documentDigest: H('f') },
    aliases: [{ legacyRevision: 1, targetRevision: 1, legacyId: 'rev-1' },
      { legacyRevision: 2, targetRevision: 2, legacyId: 'rev-2' },
      { legacyRevision: 3, targetRevision: 3, legacyId: 'rev-3' }],
    readerCompatibility: { sourceReaderRetained: true, targetReaderVersion: 'canon-v1' },
    pin: { tierflowSha: S('a'), harnessSha: S('b'), hqSha: S('c') },
  };
  const frame = (viewport: 320 | 360 | 1280): ShadowFrame => ({ viewport, ownerRef: 'owner',
    worldRef: 'world-local', sourceVersion: 'host-1', sourceHash: H('b'), activeRevision: 1,
    semanticDigest: H('c'), actionDigest: H('d'), accessibilityDigest: H('e'), privacyDigest: H('f'),
    tombstoneDigest: H('a'), visualDigest: H('1') });
  const control: PublisherControl = { ownerRef: 'owner', worldRef: 'world-local', documentId: 'founder-home',
    namespace: 'founder-workspace', phase: 'DRAINING', writer: 'host-bootstrap-legacy', epoch: 8, controlRevision: 17 };
  const observation: FenceObservation = { expectedEpoch: 8, expectedControlRevision: 17, ownerRef: 'owner',
    worldRef: 'world-local', documentId: 'founder-home', namespace: 'founder-workspace',
    desiredWriter: 'tierflow-canonical', oldIngressClosed: true, oldInFlight: 0, uncertainClaims: 0,
    hostFenceDurable: true, heldThroughCommit: true, legacyRestartDenied: true, sourcePinsMatch: true,
    integration5GO: true, explicitOwnerApproval: true, deviceAcceptance: true, rollbackRehearsed: true };
  const rollback: RollbackInput = { control: { ...control, phase: 'OBSERVING', writer: 'tierflow-canonical' },
    expectedEpoch: 8, expectedControlRevision: 17, outstandingCanonicalClaims: 0, uncertainOutcomes: 0,
    legacyReaderRetained: true, newRevisions: [{ revision: 4, digest: H('c') }, { revision: 5, digest: H('d') }],
    exportedRevisions: [{ revision: 4, digest: H('c') }, { revision: 5, digest: H('d') }],
    inverseConversionLossless: true, previousSourceHash: H('b') };
  return { migration, shadow: { legacy: [frame(320), frame(360), frame(1280)], canonical: [frame(320), frame(360), frame(1280)] },
    fence: { control, observation }, rollback };
}

function laneHandoffs(): LaneHandoff[] {
  return (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map(lane => ({
    lane, sha: S(lane.toLowerCase()),
    sourcePaths: [`src/visual-runtime/final-wave/lane-${lane.toLowerCase()}/`],
    testPaths: [`tests/visual-runtime/final-wave/lane-${lane.toLowerCase()}/`],
    rawLogs: [`VIVIM-VISUAL-RUNTIME/FINAL-WAVE/LANE-${lane}/RAW-LOCAL-EVIDENCE.log`],
    status: 'implemented' as const,
  }));
}

async function masterInput(overrides: Partial<MasterInput> = {}): Promise<MasterInput> {
  const i4 = await setupIntegration4();
  const canonical = founderDocument();
  const semantics = { expectedRevision: canonical.revision, knownActions: [ACTION],
    knownBindings: canonical.bindings.map(b => ({ id: b.id, version: b.version, nodeId: b.nodeId,
      knowledgeRef: b.knowledgeRef, provenanceRef: b.provenanceRef })) };
  const projection = projectWave3ActionSemantics(canonical, semantics);
  assert.ok(projection.ok);
  const rendered = renderWave3Semantics(projection.value.canonical, { viewportPx: 360, knownActions: [ACTION] });
  const desktop = projectWave4DesktopAdapter({ document: canonical, semantics,
    host: { state: 'connected', ownerRef: 'owner_a', worldRef: 'workspace_a', decision: 'read-only',
      publisher: 'harness', anotherPublisherPresent: false },
    viewportPx: 1280, lastDisplayedRevision: null });
  assert.ok(desktop.ok);
  const phone = projectWave4PhoneAdapter({
    canonical, rendered,
    shell: { app: 'existing-vivim-apk', relay: 'existing-mobile-relay', publisher: 'harness', viewportPx: 360 },
    pairing: { state: 'paired', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
      sessionRef: 'session_1', epoch: 3, receivedSequence: 51, lastAcceptedSequence: 50, expiresAtMs: NOW + 600_000 },
    host: { state: 'online', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
      sessionRef: 'session_1', pairingEpoch: 3, policyRevision: 9, nowMs: NOW, grantExpiresAtMs: NOW + 600_000,
      documentRevision: canonical.revision, denied: false,
      actionRisks: [{ nodeId: 'preview', id: ACTION.id, version: ACTION.version, risk: 'R0', policyRevision: 9 }] },
  });
  assert.equal(phone.status, 'ready');
  const clientParity: ClientParityInput = { canonical, rendered, desktop, phone,
    phoneInput: { canonical, rendered,
      shell: { app: 'existing-vivim-apk', relay: 'existing-mobile-relay', publisher: 'harness', viewportPx: 360 },
      pairing: { state: 'paired', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
        sessionRef: 'session_1', epoch: 3, receivedSequence: 51, lastAcceptedSequence: 50, expiresAtMs: NOW + 600_000 },
      host: { state: 'online', ownerRef: 'owner_a', worldRef: 'workspace_a', deviceRef: 'phone_1',
        sessionRef: 'session_1', pairingEpoch: 3, policyRevision: 9, nowMs: NOW, grantExpiresAtMs: NOW + 600_000,
        documentRevision: canonical.revision, denied: false,
        actionRisks: [{ nodeId: 'preview', id: ACTION.id, version: ACTION.version, risk: 'R0', policyRevision: 9 }] } },
    windowsViewportPx: 1280 };

  const principal: VerifiedUiPrincipal = { ownerRef: 'owner_a', actorRef: 'actor_a', deviceRef: 'desktop_1',
    sessionRef: 'session_1', grantRef: 'ui_grant', policyRevision: 'policy-1',
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'] };
  const worldDigest = contentHash(WORLD as never);
  const base = { schema: 'vivim.ui-document/1' as const, documentId: 'founder1',
    scope: { ownerRef: 'owner1', workspaceRef: 'workspace1' }, revision: 17, rootId: 'root1',
    nodes: [{ id: 'root1', type: 'stack' as const, props: { direction: 'vertical' as const, gap: 'md' as const },
      children: [], a11y: { role: 'main' as const, name: 'Founder workspace' } }],
    bindings: [], views: [] };
  const proofs: Proof[] = [];
  const negativeWitnesses: Partial<Record<NegativeInvariant, NegativeWitness>> = {};

  const input: MasterInput = {
    integration4: i4.input,
    authorContext: authorContext(),
    authorIntent: authorIntent(),
    knowledge: { feed: i4.feed, broker: i4.auth.broker, query: i4.input.knowledge.query, surface: 'pc', now: () => NOW },
    studio: { dependencies: { revisions: studioPort(WORLD, worldDigest),
        verifyPrincipal: () => true,
        consumeOwnerReview: () => true,
        readHistorical: () => null },
      principal, documentId: 'founder-home', draftId: 'draft_master' },
    template: { candidate: { schema: 'vivim.ui-template-candidate/1', templateId: 'FW.EDIT.FIRST',
        templateVersion: '1.0.0', catalogDigest: TEMPLATE_CATALOG_DIGEST, documentId: 'founder1',
        instanceId: 'inst1', targetNodeId: 'root1', ownerRef: 'owner1', worldRef: 'world1',
        workspaceRef: 'workspace1', deviceRef: 'device1', sessionRef: 'session1', policyRevision: 'policy1',
        baseRevision: 17, proposedBy: 'owner', authority: 'candidate-only' },
      trusted: { ownerRef: 'owner1', worldRef: 'world1', workspaceRef: 'workspace1', deviceRef: 'device1',
        sessionRef: 'session1', policyRevision: 'policy1', catalogDigest: TEMPLATE_CATALOG_DIGEST },
      base },
    hostStatus: createWave4HostStatusContract(i4.input.hostPort).readStatus(i4.input.hostQuery),
    clientParity,
    cutover: laneGInputs(),
    evidence: { pins: { tierflow: TIERFLOW_SHA, harness: HARNESS_SHA, hq: HQ_SHA },
      handoffs: laneHandoffs(), proofs, negativeWitnesses,
      duplicateActiveAuthorities: null, unownedActiveRoutes: null, consumerCoveragePct: null,
      integration4Verdict: 'BLOCKED', integration5Decision: 'UNRUN',
      acceptedOwnerScope: true, separateProductionApproval: false },
    schemaPair: { world: WORLD, canonical },
    ...overrides,
  };
  return input;
}

function laneOf(result: MasterResult, id: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H') {
  const found = result.lanes.find(l => l.lane === id);
  assert.ok(found, `lane ${id} missing`);
  return found!;
}

test('M-01: all eight real final-wave lanes are exercised by one composition', async () => {
  const result = await composeMasterIntegration(await masterInput());
  assert.equal(result.schema, 'vivim.final-wave-master/1');
  assert.equal(result.evidenceClass, 'real-modules-synthetic-external-fixtures');
  assert.equal(result.lanes.length, 8);
  for (const id of ['A','B','C','D','E','F','G','H'] as const) {
    const lane = laneOf(result, id);
    assert.ok(lane.status === 'composed' || lane.status === 'blocked', `${id} status`);
  }
  // The composition itself is inert.
  assert.equal(result.effectInvoked, false);
  assert.equal(result.activatedPublisher, false);
  assert.equal(result.automaticRetryAllowed, false);
  assert.equal(result.releaseAuthority, 'none');
});

test('M-02: the real Wave 4 A-H composition now composes all eight lanes after the authorized repair', async () => {
  const result = await composeMasterIntegration(await masterInput());
  assert.equal(result.integration4.status, 'FIXTURE_ONLY');
  assert.deepEqual(result.integration4.issues, []);
  assert.equal(result.integration4.deviceAcceptance, 'UNRUN');
  assert.equal(result.integration4.hostAcceptance, 'UNRUN');
  assert.equal(result.integration4.effectInvoked, false);
});

test('M-03: text, touch, keyboard and Studio produce identical semantics, args, risk and pins', async () => {
  const result = await composeMasterIntegration(await masterInput());
  const a = laneOf(result, 'A');
  assert.equal(a.status, 'composed');
  assert.equal(a.evidence.candidates, 4);
  assert.equal(a.evidence.fourInputParity, true);
  assert.equal(a.evidence.lanesAgree, true);
  assert.equal(result.parity.ok, true);
  assert.deepEqual(result.parity.reasons, []);
  assert.deepEqual([...result.parity.modalities], ['text', 'touch', 'keyboard', 'studio']);
  assert.equal(result.parity.semanticRef, 'ui.create@1');
  assert.equal(result.parity.risk, 'R1');
  assert.ok(result.parity.argsDigest);
  // No surface may claim an effect or a publisher.
  assert.equal(a.evidence.noEffectInvoked, true);
  assert.equal(a.evidence.publisherIsNone, true);
  assert.equal(a.evidence.hostAuthorizationRequired, true);
});

test('M-04: the persisted World UI schema and the canonical visual UI document are distinct, and the bridge is honestly NOT READY', async () => {
  const result = await composeMasterIntegration(await masterInput());
  assert.equal(result.schemaBoundary.persistedWorldValid, true);
  assert.equal(result.schemaBoundary.canonicalVisualValid, true);
  assert.equal(result.schemaBoundary.status, 'BRIDGE_NOT_READY');
  assert.equal(result.schemaBoundary.unsatisfied.length, 7);
  assert.ok(result.schemaBoundary.unsatisfied.includes('node-projection'));
  assert.ok(result.schemaBoundary.unsatisfied.includes('reverse-projection'));
  assert.equal(result.schemaBoundary.effectInvoked, false);
  assert.equal(result.schemaBoundary.authorityCreated, false);
  const h = laneOf(result, 'H');
  assert.equal(h.evidence.schemaDistinct, true);
});

test('M-05: one KB reader, one revision writer, one Host effect authority, no canonical publisher', async () => {
  const result = await composeMasterIntegration(await masterInput());
  assert.equal(result.singleAuthority.oneKnowledge, true);
  assert.equal(result.singleAuthority.oneRevisionWriter, true);
  assert.equal(result.singleAuthority.oneHostEffectAuthority, true);
  assert.equal(result.singleAuthority.canonicalPublishers, 0);
  assert.equal(result.singleAuthority.oneCanonicalPublisher, true);
});

test('M-06: Gate 5 and Gate 6 are both BLOCKED and never GO', async () => {
  const result = await composeMasterIntegration(await masterInput());
  assert.equal(result.gate5.decision, 'BLOCKED');
  assert.equal(result.gate6.decision, 'BLOCKED');
  // The blockers are the real, named ones.
  assert.ok(result.gate5.missing.some(m => m.includes('Integration 4 BLOCKED')));
  assert.ok(result.gate6.missing.some(m => m.includes('Integration 5 UNRUN')));
  assert.ok(result.gate6.missing.some(m => m.includes('Gate 5 candidate not ready')));
  assert.ok(result.gate6.missing.some(m => m.includes('separate production owner approval absent')));
});

test('M-07: a foreign-scope authoring intent is refused by Lane A and never becomes a candidate', async () => {
  const input = await masterInput();
  const result = await composeMasterIntegration({
    ...input,
    authorContext: { ...input.authorContext, scope: { ...input.authorContext.scope, ownerId: 'owner_foreign' } },
  });
  const a = laneOf(result, 'A');
  assert.equal(a.status, 'blocked');
  assert.equal(a.evidence.candidates, 0);
  assert.equal(result.parity.ok, false);
});

test('M-08: a foreign owner in the Host status is refused by Lane E', async () => {
  const input = await masterInput();
  const result = await composeMasterIntegration({
    ...input,
    hostStatus: { ...input.hostStatus, state: 'denied', reasonCode: 'HOST_SCOPE_DENIED' },
  });
  const e = laneOf(result, 'E');
  assert.equal(e.status, 'blocked');
  assert.equal(e.evidence.effectInvoked, false);
  assert.equal(e.evidence.canExecute, false);
  assert.equal(e.evidence.canRetry, false);
});

test('M-09: Lane F client parity is matched over the real render, with native acceptance still UNRUN', async () => {
  const result = await composeMasterIntegration(await masterInput());
  const f = laneOf(result, 'F');
  assert.equal(f.status, 'composed');
  assert.equal(f.evidence.fixtureParity, 'matched');
  assert.equal(f.evidence.windows, 'projection-ready');
  assert.equal(f.evidence.android, 'projection-ready');
  assert.equal(f.evidence.rootCompatibility, 'WAVE4B_WRAPPER_DEFECT');
  assert.equal(f.evidence.repairedGuardAccepts, true);
  assert.equal(f.evidence.nativeAcceptance, 'UNRUN');
  assert.equal(f.evidence.canPublish, false);
  assert.equal(f.evidence.canApprove, false);
  assert.equal(f.evidence.canExecute, false);
});

test('M-10: Lane G rehearses the cutover without ever activating a publisher', async () => {
  const result = await composeMasterIntegration(await masterInput());
  const g = laneOf(result, 'G');
  assert.equal(g.status, 'composed');
  assert.equal(g.evidence.activatedPublisher, false);
  assert.equal(g.evidence.shadow, 'EQUIVALENT_FIXTURE_ONLY');
  assert.equal(g.evidence.fence, 'safeToActivateHere=false');
});

test('M-11: the composition is deterministic for identical inputs', async () => {
  const a = await composeMasterIntegration(await masterInput());
  const b = await composeMasterIntegration(await masterInput());
  assert.equal(JSON.stringify(a.lanes), JSON.stringify(b.lanes));
  assert.equal(JSON.stringify(a.parity), JSON.stringify(b.parity));
});
