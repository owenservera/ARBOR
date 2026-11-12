/**
 * I2-C step 3 — Integration 2 real A–H composition, at the closure order's
 * proposed path `tests/visual-runtime/integration-2/real-a-h.test.ts`.
 *
 * Integrator-owned path (see VIVIM-VISUAL-RUNTIME/WAVE-2/WAVE-3-OWNERSHIP.md:
 * `tests/visual-runtime/integration-2/**`). No lane-owned path is modified by
 * this file.
 *
 * WHAT THIS FILE PROVES
 *   1. Import provenance: every lane entrypoint exercised below is the real
 *      committed module, resolved from this file's own source directory. No
 *      mocked A–H entrypoint is imported. The only non-lane import is the
 *      integrator's own inert adapter and the repo's own hash helper.
 *   2. A single document crosses all eight lanes in one process, in the order
 *      document -> component -> render -> typed tri-modal command ->
 *      preview/replay -> Host deny -> accessible help/recovery.
 *   3. The adversarial negatives required by I2-C step 5 actually refuse.
 *
 * EVIDENCE LEVEL
 *   `real_module_integration` for every lane call: the real committed module
 *   is invoked in-process. It is NOT `server_e2e`, NOT `native_desktop`, NOT
 *   `android_device` and NOT `live_cutover_verified` — no live Host, KB,
 *   Studio, Android, provider browser or device is contacted, and no file is
 *   written. The KB and Host boundaries use the lanes' own committed
 *   `createFixtureKnowledgeClient` / `createHostCapabilityFixture` fixtures,
 *   which are external transport doubles, clearly labelled below.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// REAL lane entrypoints. No mock, no stub, no re-implementation.
// ---------------------------------------------------------------------------
import { validateUiDocument } from '../../../src/visual-runtime/document/validate.ts';
import { UI_DOCUMENT_SCHEMA } from '../../../src/visual-runtime/document/schema.ts';
import { inspectComponent } from '../../../src/visual-runtime/components/catalog.ts';
import { resolveLayout } from '../../../src/visual-runtime/components/layout.ts';
import { renderUiDocument } from '../../../src/visual-runtime/render/dom.ts';
import { inspectRenderPlan, snapshotRenderPlan } from '../../../src/visual-runtime/render/inspect.ts';
import { compileVisualCommand, toExactText } from '../../../src/visual-runtime/command/compile.ts';
import { resolveCrosswalk, checkArguments, type ActionDescriptor, type CrosswalkRow } from '../../../src/visual-runtime/command/crosswalk.ts';
import { createFixtureKnowledgeClient } from '../../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, fixtureTrustedContext, mutableFixtureBroker, FIXTURE_IDS } from '../../../src/visual-runtime/knowledge/fixtures.ts';
import { projectKnowledgePage } from '../../../src/visual-runtime/knowledge/projection.ts';
import { UiRevisionFixtureStore } from '../../../src/visual-runtime/revisions/fixture-store.ts';
import { createHostCapabilityFixture } from '../../../src/visual-runtime/host/fixture.ts';
import { projectObservedHostOutcome } from '../../../src/visual-runtime/host/outcome.ts';
import { projectRecovery } from '../../../src/visual-runtime/experience/recovery.ts';
import { projectCapabilityHelp } from '../../../src/visual-runtime/experience/help.ts';
import { projectInertActionRefs } from '../../../src/visual-runtime/integration-2/action-adapter.mjs';
import { canonicalJson, sha256Hex } from '../../../src/ui/hash.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolvePath(HERE, '../../..');
const SRC_ROOT = resolvePath(REPO_ROOT, 'src/visual-runtime');

const digestOf = (value: unknown): string => sha256Hex(canonicalJson(value));

// Fixed, deterministic constants: no wall clock, no randomness, no I/O writes.
const NOW_MS = 1_792_000_000_000;
const SESSION_TTL_MS = 60_000;
const OWNER_REF = 'owner_a';
const ACTOR_REF = 'actor_a';
const DEVICE_REF = 'desktop_1';
const SESSION_REF = 'session_1';
const WORLD_REF = 'world_a';
const DOCUMENT_ID = 'doc.integration2.real';
const POLICY_REVISION = 'policy-1';
const HOST_WORLD = 'world-1';
const HOST_CATALOG_VERSION = 1;
const ACTION_REF_ID = 'fixture.preview';
const ACTION_REF_VERSION = 1;
const SEMANTIC_ID = 'vivim.preview@1';
const HOST_ACTION_ID = 'vivim.preview';

/**
 * The one canonical Lane A document. Lane A's schema is the authority for it:
 * a button needs a matched accessible name AND an explicit focus order, and a
 * binding needs the full inert shape (version/nodeId/field/provenanceRef/
 * readScope/availability) plus a same-node declaration.
 */
const CANONICAL_DOCUMENT = {
  schema: UI_DOCUMENT_SCHEMA,
  documentId: DOCUMENT_ID,
  scope: { ownerRef: OWNER_REF, workspaceRef: WORLD_REF },
  revision: 1,
  rootId: 'root',
  nodes: [
    { id: 'root', type: 'stack', children: ['panel', 'grid-1', 'action-button'], props: { direction: 'vertical' }, a11y: { role: 'main', name: 'Workspace' }, bindingRefs: [] },
    { id: 'panel', type: 'card', children: [], props: { title: 'Shared project path', description: 'Synthetic project note' }, a11y: { role: 'group', name: 'Shared project path' }, bindingRefs: ['binding-1'] },
    { id: 'grid-1', type: 'grid', children: ['cell-a'], props: { columns: 2 }, a11y: { role: 'group', name: 'Panel grid' }, bindingRefs: [] },
    { id: 'cell-a', type: 'text', children: [], props: { value: 'Shared project path', variant: 'body' }, a11y: { role: 'text', name: 'Shared project path' }, bindingRefs: [] },
    { id: 'action-button', type: 'button', children: [], props: { label: 'Preview' }, actionRefs: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }], a11y: { role: 'button', name: 'Preview', focusOrder: 1 }, bindingRefs: [] },
  ],
  bindings: [{
    id: 'binding-1',
    version: 1,
    nodeId: 'panel',
    field: 'title',
    knowledgeRef: FIXTURE_IDS.alpha,
    provenanceRef: `fixture-evidence:${FIXTURE_IDS.alpha}`,
    readScope: 'owner',
    availability: 'present',
  }],
  views: [
    { id: 'view-desktop', version: 1, kind: '2d', viewport: 'desktop' },
    { id: 'view-phone', version: 1, kind: '2d', viewport: 'phone' },
    { id: 'view-spatial', version: 1, kind: 'spatial', fallbackViewId: 'view-desktop', sourceRef: 'fixture.spatial.source' },
  ],
};

// ===========================================================================
// I2-C step 3.1 — import provenance
// ===========================================================================

/** Every real lane module this file exercises, and the directory it must live in. */
const LANE_MODULE_PROVENANCE = [
  { lane: 'A', rel: 'document/validate.ts', exported: ['validateUiDocument'] },
  { lane: 'A', rel: 'document/schema.ts', exported: ['UI_DOCUMENT_SCHEMA'] },
  { lane: 'B', rel: 'components/catalog.ts', exported: ['inspectComponent'] },
  { lane: 'B', rel: 'components/layout.ts', exported: ['resolveLayout'] },
  { lane: 'D', rel: 'render/dom.ts', exported: ['renderUiDocument'] },
  { lane: 'D', rel: 'render/inspect.ts', exported: ['inspectRenderPlan', 'snapshotRenderPlan'] },
  { lane: 'G', rel: 'command/compile.ts', exported: ['compileVisualCommand', 'toExactText'] },
  { lane: 'G', rel: 'command/crosswalk.ts', exported: ['resolveCrosswalk', 'checkArguments'] },
  { lane: 'F', rel: 'knowledge/client.ts', exported: ['createFixtureKnowledgeClient'] },
  { lane: 'F', rel: 'knowledge/fixtures.ts', exported: ['canonicalKnowledgeFixtures', 'fixtureTrustedContext', 'mutableFixtureBroker', 'FIXTURE_IDS'] },
  { lane: 'F', rel: 'knowledge/projection.ts', exported: ['projectKnowledgePage'] },
  { lane: 'C', rel: 'revisions/fixture-store.ts', exported: ['UiRevisionFixtureStore'] },
  { lane: 'H', rel: 'host/fixture.ts', exported: ['createHostCapabilityFixture'] },
  { lane: 'H', rel: 'host/outcome.ts', exported: ['projectObservedHostOutcome'] },
  { lane: 'E', rel: 'experience/recovery.ts', exported: ['projectRecovery'] },
  { lane: 'E', rel: 'experience/help.ts', exported: ['projectCapabilityHelp'] },
] as const;

test('import provenance: every lane entrypoint resolves to the real committed module', () => {
  for (const entry of LANE_MODULE_PROVENANCE) {
    const expected = resolvePath(SRC_ROOT, entry.rel);
    assert.ok(
      readdirSync(SRC_ROOT).length > 0,
      'the lane source root must exist',
    );
    const source = readFileSync(expected, 'utf8');
    for (const name of entry.exported) {
      assert.ok(
        new RegExp(`export\\s+(?:async\\s+)?(?:function|const|class|type|interface|let)\\s+${name}\\b`).test(source),
        `Lane ${entry.lane} module ${entry.rel} must really export ${name}`,
      );
    }
    // A mocked entrypoint would live under a mock/fake/stub directory.
    assert.ok(
      !/mock|fake|stub|double/i.test(entry.rel),
      `Lane ${entry.lane} module ${entry.rel} must not be a mock path`,
    );
  }
});

test('import provenance: this test imports no mocked A-H entrypoint', () => {
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const importSpecifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]!);
  const laneImports = importSpecifiers.filter((specifier) => specifier.includes('src/visual-runtime/'));
  assert.ok(laneImports.length >= 17, `expected the real lane imports, saw ${laneImports.length}`);
  for (const specifier of laneImports) {
    assert.ok(
      !/mock|fake|stub/i.test(specifier),
      `import of a mocked lane entrypoint is forbidden: ${specifier}`,
    );
    const resolved = resolvePath(HERE, specifier);
    assert.ok(
      realpathSync(resolved).startsWith(realpathSync(SRC_ROOT)),
      `lane import must resolve inside src/visual-runtime: ${specifier}`,
    );
  }
});

test('import provenance: the integrator adapter is inert and imports no lane implementation', () => {
  const adapterSource = readFileSync(resolvePath(SRC_ROOT, 'integration-2/action-adapter.mjs'), 'utf8');
  assert.ok(!/^\s*import\s/m.test(adapterSource), 'the committed adapter must import nothing');
  assert.ok(!/\bexecute\b|\bdispatch\b/.test(adapterSource), 'the adapter must not add an effect path');
});

// ===========================================================================
// I2-C step 3.2 — the real A->H chain
// ===========================================================================

interface ChainResult {
  readonly laneAOk: boolean;
  readonly laneACode: string | null;
  readonly actionRefs: readonly { readonly id: string; readonly version: number }[];
  readonly laneBAccepted: boolean;
  readonly laneBCode: string | null;
  readonly laneBNativeAccepted: boolean;
  readonly laneBColumns: readonly { readonly viewportPx: number; readonly columns: number }[];
  readonly rawRenderStatus: string;
  readonly rawRenderIssues: readonly string[];
  readonly adaptedRenderStatus: string;
  readonly adaptedIssues: readonly string[];
  readonly focusOrder: readonly string[];
  readonly versionTable: readonly { readonly id: string; readonly version: number; readonly inert: boolean }[];
  readonly compiledOutcome: string;
  readonly semanticId: string;
  readonly risk: string;
  readonly triModalParity: boolean;
  readonly crosswalkResolved: boolean;
  readonly argumentsAccepted: boolean;
  readonly previewMatchesEdit: boolean;
  readonly documentsAfterPreview: number;
  readonly committedRevision: number | null;
  readonly replayed: boolean;
  readonly hostGrantedKind: string;
  readonly hostEffectInvoked: boolean;
  readonly hostDeniedReason: string | null;
  readonly hostDeniedEffectInvoked: boolean;
  readonly hostPortMembers: readonly string[];
  readonly recoveryStage: string;
  readonly recoveryRetryPolicy: string;
  readonly recoveryAutoRetry: boolean;
  readonly recoveryActions: readonly string[];
  readonly helpVisible: boolean;
  readonly helpRunnable: boolean;
  readonly knowledgeVisible: boolean;
  readonly knowledgeCards: number;
  readonly crossOwnerItems: number;
  readonly afterTombstoneItems: number;
}

/**
 * Runs the whole chain once. Every value comes from calling the real lane
 * module; nothing is stubbed, and no lane is re-implemented here.
 */
async function runChain(): Promise<ChainResult> {
  // ---- Lane A: the document is validated by Lane A's own validator.
  const validation = validateUiDocument(CANONICAL_DOCUMENT, {
    knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }],
  });
  // Capture the refusal diagnostics before asserting, so the failure path is
  // still typed (the assertion narrows the union to the accepted branch).
  const laneADiagnostics = validation.ok
    ? []
    : validation.diagnostics.map((diagnostic) => ({ code: diagnostic.code, path: diagnostic.path, message: diagnostic.message }));
  assert.ok(validation.ok, 'Lane A must accept the canonical document');
  const document = validation.document;
  const actionRefs = document.nodes.flatMap((node) =>
    (node.actionRefs ?? []).map((ref) => ({ id: ref.id, version: ref.version })),
  );

  // ---- Lane B: component inspection and responsive layout.
  const cardNode = document.nodes.find((node) => node.id === 'panel');
  const bOnA = cardNode
    ? inspectComponent(cardNode as unknown)
    : { ok: false as const, code: 'INVALID_COMPONENT' as const, reason: 'missing' };
  const bNative = inspectComponent({
    id: 'panel',
    type: 'card',
    props: { title: 'Shared project path' },
    children: [],
    a11y: { role: 'group', name: 'Shared project path' },
  });
  const laneBColumns = [320, 360, 1280].map((viewportPx) => {
    const resolved = resolveLayout(
      { mode: 'grid', gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 },
      viewportPx,
      2,
    );
    return { viewportPx, columns: resolved.ok ? resolved.value.columns : 0 };
  });

  // ---- Lane D: render. Raw Lane A output first, then the adapter output.
  const rawPlan = renderUiDocument(document, { viewportPx: 1280 });
  const adapted = projectInertActionRefs(document);
  const adaptedPlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 1280 });
  const adaptedInspection = inspectRenderPlan(adaptedPlan);

  // ---- Lane G: typed tri-modal command.
  const argsSchema = { target: { type: 'enum' as const, values: [FIXTURE_IDS.alpha] } };
  const argsSchemaHash = digestOf(argsSchema);
  const sourceHash = digestOf({ source: 'fixture.host-catalog', semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION });
  const target = { owner: 'host_effect' as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION };
  const rows: CrosswalkRow[] = [{
    semanticRef: { id: SEMANTIC_ID, version: '1', sourceHash },
    target,
    argsSchema,
    argsSchemaHash,
    risk: 'R1',
    riskSource: { authority: 'host_catalog', sourceHash },
    implementationStatus: 'verified',
    reviewedEnabled: true,
  }];
  const descriptors: ActionDescriptor[] = [{
    target,
    argsSchemaHash,
    sourceHash,
    risk: 'R1',
    implementationStatus: 'verified',
    capability: {
      supportedByBuild: true,
      availableNow: 'yes',
      permittedForActor: 'yes',
      verifiedByEvidence: true,
      reasonCodes: [],
    },
  }];
  const compileContext = {
    rows,
    descriptors,
    currentVersions: { kb: 'kb-1', hostWorld: HOST_WORLD, uiRevision: 'rev-1', policy: POLICY_REVISION },
  };
  const exactText = toExactText(SEMANTIC_ID, { target: FIXTURE_IDS.alpha }) ?? '';
  const compiledText = compileVisualCommand({
    commandId: 'cmd-real-text',
    source: { surface: 'text', inputDigest: digestOf({ surface: 'text', text: exactText }) },
    text: exactText,
    expectedVersions: { policy: POLICY_REVISION },
  }, compileContext);
  const compiledTouch = compileVisualCommand({
    commandId: 'cmd-real-touch',
    source: { surface: 'touch', inputDigest: digestOf({ surface: 'touch', text: exactText }) },
    selection: { semanticId: SEMANTIC_ID, args: { target: FIXTURE_IDS.alpha } },
    expectedVersions: { policy: POLICY_REVISION },
  }, compileContext);
  const compiledKeyboard = compileVisualCommand({
    commandId: 'cmd-real-keyboard',
    source: { surface: 'keyboard', inputDigest: digestOf({ surface: 'keyboard', text: exactText }) },
    selection: { semanticId: SEMANTIC_ID, args: { target: FIXTURE_IDS.alpha } },
    expectedVersions: { policy: POLICY_REVISION },
  }, compileContext);
  const shapeOf = (command: { semanticRef: unknown; target: unknown; args: unknown; risk: unknown; capability: unknown }): string =>
    JSON.stringify({
      semanticRef: command.semanticRef,
      target: command.target,
      args: command.args,
      risk: command.risk,
      capability: command.capability,
    });
  const triModalParity =
    compiledText.outcome === 'candidate' &&
    compiledTouch.outcome === 'candidate' &&
    compiledKeyboard.outcome === 'candidate' &&
    shapeOf(compiledText.command) === shapeOf(compiledTouch.command) &&
    shapeOf(compiledTouch.command) === shapeOf(compiledKeyboard.command);
  const crosswalk = resolveCrosswalk(SEMANTIC_ID, rows, descriptors);
  const argumentsAccepted =
    compiledText.outcome === 'candidate' && checkArguments(compiledText.command.args, rows[0]!.argsSchema);

  // ---- Lane C: draft -> preview -> publish -> replay.
  const store = new UiRevisionFixtureStore();
  const principal = {
    ownerRef: OWNER_REF,
    actorRef: ACTOR_REF,
    deviceRef: DEVICE_REF,
    sessionRef: SESSION_REF,
    grantRef: 'grant-1',
    policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const created = store.createDraft(principal, 'draft-real', DOCUMENT_ID, document);
  assert.ok(created.ok);
  const edited = store.editDraft(principal, 'draft-real', created.value.draftRevision, document);
  assert.ok(edited.ok);
  const preview = store.preview(principal, 'draft-real');
  const previewMatchesEdit = preview.ok && preview.value.documentDigest === edited.value.documentDigest;
  const documentsAfterPreview = store.snapshot().documents.length;
  const publishCommand = {
    commandId: 'cmd-real-publish',
    documentId: DOCUMENT_ID,
    expectedRevision: 0,
    draftId: 'draft-real',
    documentDigest: edited.value.documentDigest,
  };
  const published = store.publish(principal, publishCommand);
  const replay = store.publish(principal, publishCommand);

  // ---- Lane H: inert Host capability, prepared and denied.
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const host = createHostCapabilityFixture({
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    actions: [{
      actionId: HOST_ACTION_ID,
      catalogVersion: HOST_CATALOG_VERSION,
      risk: 'R1',
      readiness: 'verified',
      requiredScopes: ['vivim:preview'],
      argsSchema: { target: { type: 'enum', values: [FIXTURE_IDS.alpha] } },
      evidence: 'verified',
      prerequisites: [],
    }],
  });
  const hostContext = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF,
    actorRef: ACTOR_REF,
    deviceRef: DEVICE_REF,
    sessionRef: SESSION_REF,
    worldRef: WORLD_REF,
    surface: 'desktop' as const,
    nowMs: NOW_MS,
    sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD,
    policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    availabilityByAction: { [HOST_ACTION_ID]: 'yes' as const },
    grant: {
      grantRef: 'grant-1',
      status: 'active' as const,
      ownerRef: OWNER_REF,
      actorRef: ACTOR_REF,
      deviceRef: DEVICE_REF,
      sessionRef: SESSION_REF,
      worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS,
      revision: POLICY_REVISION,
      scopes: ['vivim:preview'],
    },
  };
  const hostCommand = {
    schema: 'vivim.visual-command/1' as const,
    commandId: compiledText.outcome === 'candidate' ? compiledText.command.commandId : 'cmd-real-text',
    target,
    args: compiledText.outcome === 'candidate' ? compiledText.command.args : { target: FIXTURE_IDS.alpha },
    sourceVersions: { hostWorld: HOST_WORLD, policy: POLICY_REVISION, catalogDigest },
  };
  const prepared = host.prepare(hostCommand, hostContext);
  const denied = host.prepare(hostCommand, { ...hostContext, grant: null });

  // ---- Lane F: the bound knowledge record, read through Lane F's real client.
  const broker = mutableFixtureBroker(fixtureTrustedContext());
  const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () => NOW_MS });
  const boundPage = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-real-bound',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.alpha,
    limit: 10,
  });
  const boundItem = boundPage.items[0];
  const boundProjection = projectKnowledgePage(boundPage);
  const crossOwnerPage = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-real-cross',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    query: 'private',
    limit: 10,
  });
  knowledge.applyFixtureSourceEvent({ type: 'tombstone', stableId: FIXTURE_IDS.alpha });
  const afterTombstone = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-real-tombstone',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.alpha,
    limit: 10,
  });

  // ---- Lane E: the Host denial becomes a read-only recovery view + help.
  const recovery = projectRecovery({
    authority: 'host',
    stage: 'denied',
    operationKind: 'host_effect',
    reasonCode: denied.kind === 'denied' ? denied.reasonCode : 'GRANT_MISSING',
    offline: false,
    canCancel: true,
    canRequestUndo: false,
    statusCheckedByAuthority: true,
  });
  const capability = host.describeForPrincipal({ ...hostContext, grant: null }, HOST_ACTION_ID);
  const help = projectCapabilityHelp(
    {
      actionId: capability.actionId,
      title: 'Preview shared project path',
      explanation: 'Inerts the shared project path against the owner-scoped knowledge record.',
      authority: 'host',
      sourceVersion: `catalog-${HOST_CATALOG_VERSION}`,
      sourceDigest: capability.catalogDigest,
      observedAt: new Date(NOW_MS).toISOString(),
      surface: 'desktop',
      risk: capability.risk,
      disclosure: 'public',
      readiness: {
        supportedByBuild: capability.supportedByBuild,
        availableNow: capability.availableNow,
        permittedForActor: capability.permittedForActor,
        verifiedByEvidence: capability.verifiedByEvidence,
      },
      prerequisites: capability.prerequisites,
      requiredScopes: capability.requiredScopes,
      errorCodes: capability.reasonCodes,
    },
    boundItem
      ? {
          stableId: boundItem.stableId,
          projectionRevision: boundPage.projectionRevision ?? 'unknown',
          sourceAuthority: boundItem.source.authority,
          sourceVersion: boundItem.source.nativeVersion,
          evidenceRefs: boundItem.evidenceRefs,
          asOf: boundItem.asOf,
          visibility: 'authorized',
        }
      : null,
  );

  return {
    laneAOk: validation.ok,
    laneACode: laneADiagnostics[0]?.code ?? null,
    actionRefs,
    laneBAccepted: bOnA.ok,
    laneBCode: bOnA.ok ? null : bOnA.code,
    laneBNativeAccepted: bNative.ok,
    laneBColumns,
    rawRenderStatus: rawPlan.status,
    rawRenderIssues: rawPlan.issues.map((issue) => issue.code),
    adaptedRenderStatus: adaptedPlan.status,
    adaptedIssues: adaptedInspection.issueCodes,
    focusOrder: adaptedInspection.focusOrder,
    versionTable: adapted.actionVersionTable.map((entry) => ({ id: entry.id, version: entry.version, inert: entry.inert })),
    compiledOutcome: compiledText.outcome,
    semanticId: compiledText.outcome === 'candidate' ? compiledText.command.semanticRef.id : '',
    risk: compiledText.outcome === 'candidate' ? compiledText.command.risk.level : '',
    triModalParity,
    crosswalkResolved: crosswalk.ok,
    argumentsAccepted,
    previewMatchesEdit,
    documentsAfterPreview,
    committedRevision: published.ok ? published.value.revision : null,
    replayed: replay.ok && replay.replayed === true,
    hostGrantedKind: prepared.kind,
    hostEffectInvoked: prepared.kind === 'prepared_inert' ? prepared.effectInvoked : false,
    hostDeniedReason: denied.kind === 'denied' ? denied.reasonCode : null,
    hostDeniedEffectInvoked: denied.kind === 'denied' ? denied.effectInvoked : false,
    hostPortMembers: Object.keys(host),
    recoveryStage: recovery.stage,
    recoveryRetryPolicy: recovery.retryPolicy,
    recoveryAutoRetry: recovery.automaticRetryAllowed,
    recoveryActions: recovery.actions.map((action) => action.kind),
    helpVisible: help.visible,
    helpRunnable: help.runnable,
    knowledgeVisible: boundItem?.visibility === 'visible',
    knowledgeCards: boundProjection.cards.length,
    crossOwnerItems: crossOwnerPage.items.length,
    afterTombstoneItems: afterTombstone.items.length,
  };
}

test('the canonical document crosses all eight lanes in one composed run', async () => {
  const chain = await runChain();
  assert.equal(chain.laneAOk, true);
  assert.equal(chain.laneACode, null);
  assert.equal(chain.actionRefs.length, 1);
  assert.equal(chain.actionRefs[0]?.id, ACTION_REF_ID);
  assert.equal(chain.actionRefs[0]?.version, ACTION_REF_VERSION);
  assert.equal(chain.compiledOutcome, 'candidate');
  assert.equal(chain.semanticId, SEMANTIC_ID);
  assert.equal(chain.risk, 'R1');
  assert.equal(chain.triModalParity, true);
  assert.equal(chain.crosswalkResolved, true);
  assert.equal(chain.argumentsAccepted, true);
  assert.equal(chain.previewMatchesEdit, true);
  assert.equal(chain.documentsAfterPreview, 0, 'preview must not commit a document');
  assert.equal(chain.committedRevision, 1);
  assert.equal(chain.replayed, true);
  assert.equal(chain.hostGrantedKind, 'prepared_inert');
  assert.equal(chain.hostEffectInvoked, false, 'the Host port must never invoke an effect');
  assert.equal(chain.hostDeniedReason, 'GRANT_MISSING');
  assert.equal(chain.hostDeniedEffectInvoked, false);
  assert.equal(chain.recoveryStage, 'denied');
  assert.equal(chain.recoveryAutoRetry, false);
  assert.equal(chain.knowledgeVisible, true);
  assert.ok(chain.knowledgeCards >= 1);
  assert.equal(chain.crossOwnerItems, 0, 'no cross-owner record may be visible');
  assert.equal(chain.afterTombstoneItems, 0, 'a tombstoned record must not be resurrected');
});

test('the Host capability port exposes no execute or dispatch entry point', async () => {
  const chain = await runChain();
  assert.ok(!chain.hostPortMembers.includes('execute'));
  assert.ok(!chain.hostPortMembers.includes('dispatch'));
  assert.deepEqual([...chain.hostPortMembers].sort(), [
    'describeForPrincipal',
    'evaluateApprovalInert',
    'prepare',
    'reconcileClaimReadOnly',
  ]);
});

test('the A->B vocabulary seam is measured, not papered over', async () => {
  const chain = await runChain();
  // Lane B refuses Lane A's card vocabulary; Lane B's own card is accepted.
  assert.equal(chain.laneBAccepted, false);
  assert.equal(chain.laneBCode, 'UNSAFE_PROP');
  assert.equal(chain.laneBNativeAccepted, true);
});

test('the A->D seam is bridged only by the integrator adapter, preserving the version ref', async () => {
  const chain = await runChain();
  // The raw Lane A document does not render: Lane D wants inert string refs.
  assert.equal(chain.rawRenderStatus, 'unavailable');
  assert.ok(chain.rawRenderIssues.includes('INVALID_REFERENCE'));
  // Only the adapter output renders.
  assert.equal(chain.adaptedRenderStatus, 'partial');
  assert.ok(chain.adaptedIssues.includes('SPATIAL_UNSUPPORTED'));
  assert.deepEqual([...chain.focusOrder], ['action-button']);
  // The canonical version reference survives, in a separate inert table.
  assert.deepEqual(chain.versionTable, [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION, inert: true }]);
});

// ===========================================================================
// I2-C step 5 — adversarial negatives
// ===========================================================================

test('adversarial: a stale action version is refused by Lane A', () => {
  const stale = validateUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'action-button'
          ? { ...node, actionRefs: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION + 1 }] }
          : node,
      ),
    },
    { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }] },
  );
  assert.equal(stale.ok, false);
  assert.ok(stale.diagnostics.some((diagnostic) => diagnostic.code === 'UNBOUND_ACTION'));
});

test('adversarial: an unknown action reference is refused by Lane A', () => {
  const unknown = validateUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'action-button'
          ? { ...node, actionRefs: [{ id: 'fixture.unregistered', version: 1 }] }
          : node,
      ),
    },
    { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }] },
  );
  assert.equal(unknown.ok, false);
  assert.ok(unknown.diagnostics.some((diagnostic) => diagnostic.code === 'UNBOUND_ACTION'));
});

test('adversarial: a wrong principal cannot read or publish through Lane C', () => {
  const store = new UiRevisionFixtureStore();
  const right = {
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF,
    grantRef: 'grant-1', policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const wrongActor = { ...right, actorRef: 'actor_intruder' };
  const wrongOwner = { ...right, ownerRef: 'owner_intruder' };
  const noScope = { ...right, scopes: ['ui:read'] as const };

  // A document is owner-scoped: a different owner must not see it.
  const created = store.createDraft(right, 'draft-principal', DOCUMENT_ID, { schema: 'x' });
  assert.ok(created.ok);
  const published = store.publish(right, {
    commandId: 'cmd-principal', documentId: DOCUMENT_ID, expectedRevision: 0,
    draftId: 'draft-principal', documentDigest: created.value.documentDigest,
  });
  assert.ok(published.ok);
  const foreignOwnerRead = store.readCurrent(wrongOwner, DOCUMENT_ID);
  assert.ok(foreignOwnerRead.ok);
  assert.equal(foreignOwnerRead.ok ? foreignOwnerRead.value : null, null, 'a foreign owner must not read the document');

  // A draft belongs to its actor and device: another actor cannot touch it.
  const foreignActorEdit = store.editDraft(wrongActor, 'draft-principal', created.value.draftRevision, { schema: 'y' });
  assert.equal(foreignActorEdit.ok, false);
  assert.equal(foreignActorEdit.ok ? null : foreignActorEdit.code, 'NOT_FOUND');
  const foreignActorPreview = store.preview(wrongActor, 'draft-principal');
  assert.equal(foreignActorPreview.ok, false);
  assert.equal(foreignActorPreview.ok ? null : foreignActorPreview.code, 'NOT_FOUND');

  // A principal without the publish scope is refused before any write.
  const unscoped = store.publish(noScope, {
    commandId: 'cmd-unscoped', documentId: DOCUMENT_ID, expectedRevision: 1,
    draftId: 'draft-principal', documentDigest: created.value.documentDigest,
  });
  assert.equal(unscoped.ok, false);
  assert.equal(unscoped.ok ? null : unscoped.code, 'FORBIDDEN');
});

test('adversarial: fake provenance is refused by Lane F, not projected', async () => {
  // A record claiming another owner's provenance must never resolve.
  const forged = canonicalKnowledgeFixtures().map((row) =>
    row.stableId === FIXTURE_IDS.alpha ? { ...row, ownerRef: 'owner_attacker', provenance: ['forged/1'] } : row,
  );
  const broker = mutableFixtureBroker(fixtureTrustedContext());
  const knowledge = createFixtureKnowledgeClient(forged, broker.broker, { now: () => NOW_MS });
  const page = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-forged',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.alpha,
    limit: 10,
  });
  assert.equal(page.items.length, 0, 'a forged-provenance record must not be visible');
  const projection = projectKnowledgePage(page);
  assert.equal(projection.cards.length, 0);
  assert.ok(!JSON.stringify(page).includes('forged'));
});

test('adversarial: redacted records stay hidden unless trusted policy allows markers', async () => {
  const rows = canonicalKnowledgeFixtures();
  const strict = mutableFixtureBroker(fixtureTrustedContext());
  const strictClient = createFixtureKnowledgeClient(rows, strict.broker, { now: () => NOW_MS });
  const strictPage = await strictClient.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-redacted-strict',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.redacted,
    limit: 10,
  });
  assert.equal(strictPage.items.length, 0, 'redacted existence is itself private');

  const permissive = mutableFixtureBroker(fixtureTrustedContext({ maySeeRedactedMarkers: true }));
  const permissiveClient = createFixtureKnowledgeClient(rows, permissive.broker, { now: () => NOW_MS });
  const permissivePage = await permissiveClient.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-redacted-permissive',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.redacted,
    limit: 10,
  });
  assert.equal(permissivePage.items.length, 1);
  assert.equal(permissivePage.items[0]?.visibility, 'redacted');
  assert.equal(permissivePage.items[0]?.label, 'Redacted');
  assert.equal(permissivePage.items[0]?.stableId, 'withheld');
});

test('adversarial: a tombstoned record is not resurrected and a revoked session denies', async () => {
  const broker = mutableFixtureBroker(fixtureTrustedContext());
  const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () => NOW_MS });
  knowledge.applyFixtureSourceEvent({ type: 'tombstone', stableId: FIXTURE_IDS.beta });
  const afterTombstone = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-tomb',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.beta,
    limit: 10,
  });
  assert.equal(afterTombstone.items.length, 0);

  broker.setContext(fixtureTrustedContext({ revoked: true }));
  const revokedPage = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-revoked',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: FIXTURE_IDS.alpha,
    limit: 10,
  });
  assert.equal(revokedPage.status, 'denied');
  assert.equal(revokedPage.items.length, 0);
});

test('adversarial: malformed HTML and unsafe refs are refused by Lane A and Lane D', () => {
  const withHtml = validateUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'panel' ? { ...node, props: { title: '<script>alert(1)</script>' } } : node,
      ),
    },
    { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }] },
  );
  assert.equal(withHtml.ok, false);
  assert.ok(withHtml.diagnostics.some((diagnostic) => diagnostic.code === 'UNSAFE_VALUE'));

  const withUrl = validateUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'panel' ? { ...node, props: { title: 'javascript:alert(1)' } } : node,
      ),
    },
    { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }] },
  );
  assert.equal(withUrl.ok, false);
  assert.ok(withUrl.diagnostics.some((diagnostic) => diagnostic.code === 'UNSAFE_VALUE'));

  // A dangling reference is refused rather than silently dropped.
  const dangling = validateUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'grid-1' ? { ...node, children: ['cell-a', 'ghost-1'] } : node,
      ),
    },
    { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }] },
  );
  assert.equal(dangling.ok, false);
  assert.ok(dangling.diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_REFERENCE'));

  // Lane D refuses an unsafe DOM prop outright.
  const unsafePlan = renderUiDocument(
    {
      ...CANONICAL_DOCUMENT,
      nodes: CANONICAL_DOCUMENT.nodes.map((node) =>
        node.id === 'action-button' ? { ...node, props: { label: 'ok', onClick: 'alert(1)' } } : node,
      ),
    },
    { viewportPx: 1280 },
  );
  assert.notEqual(unsafePlan.status, 'ok');
  assert.ok(!JSON.stringify(unsafePlan).includes('alert(1)'));
});

test('adversarial: a revision CAS conflict and a digest mismatch are both refused', () => {
  const store = new UiRevisionFixtureStore();
  const principal = {
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF,
    grantRef: 'grant-1', policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const created = store.createDraft(principal, 'draft-cas', DOCUMENT_ID, { schema: 'x' });
  assert.ok(created.ok);
  const edited = store.editDraft(principal, 'draft-cas', created.value.draftRevision, { schema: 'y' });
  assert.ok(edited.ok);

  // Stale base revision -> REVISION_CONFLICT.
  const staleBase = store.publish(principal, {
    commandId: 'cmd-cas-stale', documentId: DOCUMENT_ID, expectedRevision: 7,
    draftId: 'draft-cas', documentDigest: edited.value.documentDigest,
  });
  assert.equal(staleBase.ok, false);
  assert.equal(staleBase.ok ? null : staleBase.code, 'REVISION_CONFLICT');

  // Wrong digest -> DIGEST_MISMATCH.
  const wrongDigest = store.publish(principal, {
    commandId: 'cmd-cas-digest', documentId: DOCUMENT_ID, expectedRevision: 0,
    draftId: 'draft-cas', documentDigest: `sha256:${'0'.repeat(64)}`,
  });
  assert.equal(wrongDigest.ok, false);
  assert.equal(wrongDigest.ok ? null : wrongDigest.code, 'DIGEST_MISMATCH');
});

test('adversarial: reusing a command id with a different envelope is refused', () => {
  const store = new UiRevisionFixtureStore();
  const principal = {
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF,
    grantRef: 'grant-1', policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const created = store.createDraft(principal, 'draft-idem', DOCUMENT_ID, { schema: 'x' });
  assert.ok(created.ok);
  const command = {
    commandId: 'cmd-idem', documentId: DOCUMENT_ID, expectedRevision: 0,
    draftId: 'draft-idem', documentDigest: created.value.documentDigest,
  };
  const first = store.publish(principal, command);
  assert.equal(first.ok, true);
  // Same id, different envelope -> IDEMPOTENCY_CONFLICT, never a second write.
  const conflicting = store.publish(principal, { ...command, expectedRevision: 1 });
  assert.equal(conflicting.ok, false);
  assert.equal(conflicting.ok ? null : conflicting.code, 'IDEMPOTENCY_CONFLICT');
});

test('adversarial: a crash before commit is uncertain and commits nothing', () => {
  const store = new UiRevisionFixtureStore();
  const principal = {
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF,
    grantRef: 'grant-1', policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const created = store.createDraft(principal, 'draft-crash', DOCUMENT_ID, { schema: 'x' });
  assert.ok(created.ok);
  store.injectOnce('beforeCommit');
  const published = store.publish(principal, {
    commandId: 'cmd-crash', documentId: DOCUMENT_ID, expectedRevision: 0,
    draftId: 'draft-crash', documentDigest: created.value.documentDigest,
  });
  assert.equal(published.ok, false);
  assert.equal(published.ok ? null : published.code, 'UNCERTAIN');
  // Nothing was committed.
  assert.equal(store.snapshot().documents.length, 0);
});

test('adversarial: a lost ACK after commit is uncertain but the outcome is queryable, never resent', () => {
  const store = new UiRevisionFixtureStore();
  const principal = {
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF,
    grantRef: 'grant-1', policyRevision: POLICY_REVISION,
    scopes: ['ui:read', 'ui:draft', 'ui:publish', 'ui:rollback'],
  };
  const created = store.createDraft(principal, 'draft-ack', DOCUMENT_ID, { schema: 'x' });
  assert.ok(created.ok);
  store.injectOnce('afterCommitAckLoss');
  const command = {
    commandId: 'cmd-ack', documentId: DOCUMENT_ID, expectedRevision: 0,
    draftId: 'draft-ack', documentDigest: created.value.documentDigest,
  };
  const published = store.publish(principal, command);
  assert.equal(published.ok, false);
  assert.equal(published.ok ? null : published.code, 'UNCERTAIN');
  // The commit DID land: the outcome must be queryable, and must not be resent.
  const outcome = store.getCommandOutcome(principal, 'publish', command);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.ok ? outcome.value.revision : null, 1);
  // A retry of the same command id is an idempotent replay, not a second write.
  const retry = store.publish(principal, command);
  assert.equal(retry.ok, true);
  assert.equal(retry.ok && retry.replayed === true, true);
  assert.equal(store.snapshot().documents.length, 1, 'exactly one committed document');
});

test('adversarial: R2 on a phone surface is refused and R3 is always refused', () => {
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const host = createHostCapabilityFixture({
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    actions: [
      {
        actionId: 'vivim.r2', catalogVersion: HOST_CATALOG_VERSION, risk: 'R2', readiness: 'verified',
        requiredScopes: ['vivim:preview'], argsSchema: {}, evidence: 'verified', prerequisites: [],
      },
      {
        actionId: 'vivim.r3', catalogVersion: HOST_CATALOG_VERSION, risk: 'R3', readiness: 'verified',
        requiredScopes: ['vivim:preview'], argsSchema: {}, evidence: 'verified', prerequisites: [],
      },
    ],
  });
  const base = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    surface: 'phone' as const,
    nowMs: NOW_MS, sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD, policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION, catalogDigest,
    availabilityByAction: { 'vivim.r2': 'yes' as const, 'vivim.r3': 'yes' as const },
    grant: {
      grantRef: 'grant-1', status: 'active' as const,
      ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS, revision: POLICY_REVISION, scopes: ['vivim:preview'],
    },
  };
  const commandFor = (actionId: string) => ({
    schema: 'vivim.visual-command/1' as const,
    commandId: `cmd-${actionId}`,
    target: { owner: 'host_effect' as const, actionId, catalogVersion: HOST_CATALOG_VERSION },
    args: {},
    sourceVersions: { hostWorld: HOST_WORLD, policy: POLICY_REVISION, catalogDigest },
  });

  const r2Phone = host.prepare(commandFor('vivim.r2'), base);
  assert.equal(r2Phone.kind, 'denied');
  assert.equal(r2Phone.kind === 'denied' ? r2Phone.reasonCode : null, 'R2_DESKTOP_REQUIRED');
  assert.equal(r2Phone.kind === 'denied' ? r2Phone.effectInvoked : true, false);

  // R2 is allowed on desktop.
  const r2Desktop = host.prepare(commandFor('vivim.r2'), { ...base, surface: 'desktop' });
  assert.equal(r2Desktop.kind, 'prepared_inert');

  // R3 is refused on every surface.
  for (const surface of ['phone', 'desktop'] as const) {
    const r3 = host.prepare(commandFor('vivim.r3'), { ...base, surface });
    assert.equal(r3.kind, 'denied', `R3 must be refused on ${surface}`);
    assert.equal(r3.kind === 'denied' ? r3.reasonCode : null, 'R3_REFUSED');
    assert.equal(r3.kind === 'denied' ? r3.effectInvoked : true, false);
  }
});

test('adversarial: an uncertain receipt is read-only reconcile and never a duplicate claim', () => {
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const context = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    surface: 'desktop' as const,
    nowMs: NOW_MS, sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD, policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION, catalogDigest,
    availabilityByAction: {},
    grant: {
      grantRef: 'grant-1', status: 'active' as const,
      ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS, revision: POLICY_REVISION, scopes: ['control:read'],
    },
  };
  const claim = {
    planId: 'plan-1', planDigest: 'digest-1', actionId: HOST_ACTION_ID,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    worldRevision: HOST_WORLD, state: 'claimed' as const,
  };

  // No observation at all -> uncertain, requires read-only reconcile.
  const noObservation = projectObservedHostOutcome(claim, null, context);
  assert.equal(noObservation.status, 'uncertain');
  assert.equal(noObservation.reasonCode, 'CLAIM_WITHOUT_RECEIPT');
  assert.equal(noObservation.requiresReadOnlyReconcile, true);
  assert.equal(noObservation.effectInvoked, false);

  // An uncertain receipt -> uncertain, and still no effect.
  const uncertainReceipt = projectObservedHostOutcome(
    claim,
    {
      receipt: {
        schema: 'vivim.control-receipt/1', planId: 'plan-1', planDigest: 'digest-1',
        actionId: HOST_ACTION_ID, status: 'uncertain', receiptRef: 'receipt-1', worldRevision: HOST_WORLD,
      },
      evidence: { kind: 'unsigned-general-journal' },
    },
    context,
  );
  assert.equal(uncertainReceipt.status, 'uncertain');
  assert.equal(uncertainReceipt.reasonCode, 'HOST_EFFECT_UNCERTAIN');
  assert.equal(uncertainReceipt.effectInvoked, false);
  assert.equal(uncertainReceipt.requiresReadOnlyReconcile, true);

  // A claim that was never claimed is denied, so a duplicate claim cannot pass.
  const duplicate = projectObservedHostOutcome({ ...claim, state: 'planned' }, null, context);
  assert.equal(duplicate.status, 'denied');
  assert.equal(duplicate.reasonCode, 'EFFECT_NOT_CLAIMED');
});

test('adversarial: a receipt with a forged signature state is denied as invalid evidence', () => {
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const context = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    surface: 'desktop' as const,
    nowMs: NOW_MS, sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD, policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION, catalogDigest,
    availabilityByAction: {},
    grant: {
      grantRef: 'grant-1', status: 'active' as const,
      ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS, revision: POLICY_REVISION, scopes: ['control:read'],
    },
  };
  const claim = {
    planId: 'plan-1', planDigest: 'digest-1', actionId: HOST_ACTION_ID,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    worldRevision: HOST_WORLD, state: 'receipt' as const,
  };
  const forged = projectObservedHostOutcome(
    claim,
    {
      receipt: {
        schema: 'vivim.control-receipt/1', planId: 'plan-1', planDigest: 'digest-1',
        actionId: HOST_ACTION_ID, status: 'applied', receiptRef: 'receipt-1', worldRevision: HOST_WORLD,
      },
      // A caller-declared signature status must never be accepted as proof.
      evidence: { kind: 'unsigned-general-journal' } as never,
      signatureState: 'verified',
    } as never,
    context,
  );
  assert.equal(forged.status, 'denied');
  assert.equal(forged.reasonCode, 'RECEIPT_CLAIMED_SIGNATURE_STATUS');
  assert.equal(forged.signatureState, 'invalid');
  assert.equal(forged.effectInvoked, false);
});

test('adversarial: a Host command with forged fields is refused', () => {
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const host = createHostCapabilityFixture({
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    actions: [{
      actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION, risk: 'R1', readiness: 'verified',
      requiredScopes: ['vivim:preview'], argsSchema: {}, evidence: 'verified', prerequisites: [],
    }],
  });
  const context = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    surface: 'desktop' as const,
    nowMs: NOW_MS, sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD, policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION, catalogDigest,
    availabilityByAction: { [HOST_ACTION_ID]: 'yes' as const },
    grant: {
      grantRef: 'grant-1', status: 'active' as const,
      ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS, revision: POLICY_REVISION, scopes: ['vivim:preview'],
    },
  };
  const forged = host.prepare(
    {
      schema: 'vivim.visual-command/1',
      commandId: 'cmd-forged',
      target: { owner: 'host_effect', actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION },
      args: {},
      sourceVersions: { hostWorld: HOST_WORLD, policy: POLICY_REVISION, catalogDigest },
      // A smuggled execution field must be refused, not ignored.
      execute: true,
    } as never,
    context,
  );
  assert.equal(forged.kind, 'denied');
  assert.equal(forged.kind === 'denied' ? forged.reasonCode : null, 'UNTRUSTED_COMMAND_FIELDS');
  assert.equal(forged.kind === 'denied' ? forged.effectInvoked : true, false);
});

test('adversarial: a wrong principal cannot prepare a Host effect', () => {
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const host = createHostCapabilityFixture({
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    actions: [{
      actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION, risk: 'R1', readiness: 'verified',
      requiredScopes: ['vivim:preview'], argsSchema: {}, evidence: 'verified', prerequisites: [],
    }],
  });
  const context = {
    schema: 'fixture.trusted-host-context/1' as const,
    authenticated: true,
    ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
    surface: 'desktop' as const,
    nowMs: NOW_MS, sessionExpiresAtMs: NOW_MS + SESSION_TTL_MS,
    worldRevision: HOST_WORLD, policyRevision: POLICY_REVISION,
    catalogVersion: HOST_CATALOG_VERSION, catalogDigest,
    availabilityByAction: { [HOST_ACTION_ID]: 'yes' as const },
    grant: {
      grantRef: 'grant-1', status: 'active' as const,
      ownerRef: OWNER_REF, actorRef: ACTOR_REF, deviceRef: DEVICE_REF, sessionRef: SESSION_REF, worldRef: WORLD_REF,
      expiresAtMs: NOW_MS + SESSION_TTL_MS, revision: POLICY_REVISION, scopes: ['vivim:preview'],
    },
  };
  const command = {
    schema: 'vivim.visual-command/1' as const,
    commandId: 'cmd-wrong-principal',
    target: { owner: 'host_effect' as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION },
    args: {},
    sourceVersions: { hostWorld: HOST_WORLD, policy: POLICY_REVISION, catalogDigest },
  };
  // A grant bound to a different actor than the context claims is refused.
  const wrongPrincipal = host.prepare(command, { ...context, actorRef: 'actor_intruder' });
  assert.equal(wrongPrincipal.kind, 'denied');
  assert.equal(wrongPrincipal.kind === 'denied' ? wrongPrincipal.reasonCode : null, 'GRANT_PRINCIPAL_MISMATCH');
  assert.equal(wrongPrincipal.kind === 'denied' ? wrongPrincipal.effectInvoked : true, false);

  // An unauthenticated context is refused before anything else.
  const unauthenticated = host.prepare(command, { ...context, authenticated: false });
  assert.equal(unauthenticated.kind, 'denied');
  assert.equal(unauthenticated.kind === 'denied' ? unauthenticated.reasonCode : null, 'AUTHENTICATED_PRINCIPAL_REQUIRED');
  assert.equal(unauthenticated.kind === 'denied' ? unauthenticated.effectInvoked : true, false);

  // A revoked grant is refused, and a grant missing the required scope is refused.
  const revoked = host.prepare(command, { ...context, grant: { ...context.grant, status: 'revoked' } });
  assert.equal(revoked.kind, 'denied');
  assert.equal(revoked.kind === 'denied' ? revoked.reasonCode : null, 'GRANT_REVOKED');
  const outOfScope = host.prepare(command, { ...context, grant: { ...context.grant, scopes: ['vivim:other'] } });
  assert.equal(outOfScope.kind, 'denied');
  assert.equal(outOfScope.kind === 'denied' ? outOfScope.reasonCode : null, 'SCOPE_DENIED');
});

test('adversarial: Lane G refuses an unknown semantic id instead of guessing', () => {
  const argsSchema = { target: { type: 'enum' as const, values: [FIXTURE_IDS.alpha] } };
  const argsSchemaHash = digestOf(argsSchema);
  const sourceHash = digestOf({ source: 'fixture.host-catalog', semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION });
  const target = { owner: 'host_effect' as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION };
  const rows: CrosswalkRow[] = [{
    semanticRef: { id: SEMANTIC_ID, version: '1', sourceHash },
    target, argsSchema, argsSchemaHash, risk: 'R1',
    riskSource: { authority: 'host_catalog', sourceHash },
    implementationStatus: 'verified', reviewedEnabled: true,
  }];
  const descriptors: ActionDescriptor[] = [{
    target, argsSchemaHash, sourceHash, risk: 'R1', implementationStatus: 'verified',
    capability: { supportedByBuild: true, availableNow: 'yes', permittedForActor: 'yes', verifiedByEvidence: true, reasonCodes: [] },
  }];
  const context = {
    rows, descriptors,
    currentVersions: { kb: 'kb-1', hostWorld: HOST_WORLD, uiRevision: 'rev-1', policy: POLICY_REVISION },
  };
  const unknown = compileVisualCommand({
    commandId: 'cmd-unknown',
    source: { surface: 'text', inputDigest: digestOf({ surface: 'text', text: 'unknown' }) },
    text: toExactText('vivim.unknown@1', { target: FIXTURE_IDS.alpha }) ?? '',
    expectedVersions: { policy: POLICY_REVISION },
  }, context);
  assert.equal(unknown.outcome, 'refused');
  assert.equal(unknown.outcome === 'refused' ? unknown.reasonCode : null, 'UNKNOWN_SEMANTIC_ID');

  // A wrong argument value is refused too.
  const badArgs = compileVisualCommand({
    commandId: 'cmd-badargs',
    source: { surface: 'text', inputDigest: digestOf({ surface: 'text', text: 'bad' }) },
    text: toExactText(SEMANTIC_ID, { target: 'kn_does_not_exist' }) ?? '',
    expectedVersions: { policy: POLICY_REVISION },
  }, context);
  assert.equal(badArgs.outcome, 'refused');
});

test('adversarial: Lane E never offers automatic retry for a denied Host effect', () => {
  const recovery = projectRecovery({
    authority: 'host',
    stage: 'denied',
    operationKind: 'host_effect',
    reasonCode: 'GRANT_MISSING',
    offline: false,
    canCancel: true,
    canRequestUndo: false,
    statusCheckedByAuthority: true,
  });
  assert.equal(recovery.automaticRetryAllowed, false);
  assert.equal(recovery.retryPolicy, 'owner_reconcile_only');
  assert.ok(recovery.actions.some((action) => action.kind === 'request_help'));
  assert.ok(recovery.actions.some((action) => action.kind === 'return_to_safe_screen'));
  assert.ok(!recovery.actions.some((action) => action.kind === 'request_undo'));
});
