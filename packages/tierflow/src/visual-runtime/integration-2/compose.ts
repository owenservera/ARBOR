/**
 * Wave 2 / Integration 2 — REAL cross-lane composition over the Lane A–H modules.
 *
 * Integrator-owned path (see WAVE-3-OWNERSHIP.md: `src/visual-runtime/integration-2/**`).
 * This module never writes into a lane-owned path and never re-implements a lane:
 * every value below is produced by calling the committed lane module itself.
 *
 * Evidence level: every lane call is a real in-process call against the real
 * committed module. There are no mocks, no stubs and no re-implementations here.
 * The fixtures are synthetic and inert: no live Host, KB, Studio, Android,
 * provider browser or device is contacted, and no file is written.
 *
 * The composition measures seams instead of papering over them. Where two lanes
 * genuinely disagree (notably A -> B), the disagreement is recorded as a measured
 * refusal with its exact code and reason. Repairing that seam belongs to the
 * lane that owns the contract (Lane B's Wave 3 canonical map), not to this file.
 */
import { validateUiDocument } from '../document/validate.ts';
import { UI_DOCUMENT_SCHEMA } from '../document/schema.ts';
import { inspectComponent } from '../components/catalog.ts';
import { resolveLayout } from '../components/layout.ts';
import { renderUiDocument } from '../render/dom.ts';
import { inspectRenderPlan, snapshotRenderPlan } from '../render/inspect.ts';
import { compileVisualCommand, toExactText } from '../command/compile.ts';
import { resolveCrosswalk, checkArguments, type ActionDescriptor, type CrosswalkRow } from '../command/crosswalk.ts';
import { createFixtureKnowledgeClient } from '../knowledge/client.ts';
import { canonicalKnowledgeFixtures, fixtureTrustedContext, mutableFixtureBroker } from '../knowledge/fixtures.ts';
import { projectKnowledgePage } from '../knowledge/projection.ts';
import { UiRevisionFixtureStore } from '../revisions/fixture-store.ts';
import { createHostCapabilityFixture } from '../host/fixture.ts';
import { projectRecovery } from '../experience/recovery.ts';
import { projectCapabilityHelp } from '../experience/help.ts';
import { projectInertActionRefs } from './action-adapter.mjs';
import { canonicalJson, sha256Hex } from '../../ui/hash.ts';

export const COMPOSITION_SCHEMA = 'vivim.integration-2-composition/1' as const;

/** Lane F's own fixture id for the record this document binds to (FIXTURE_IDS.alpha). */
const KNOWLEDGE_STABLE_ID = 'kn_8f3a0c71';
/** Lane G's canonical semantic id (SEMANTIC_ID shape: name@version). */
const SEMANTIC_ID = 'vivim.preview@1';
/** Lane H's host catalog action id (ACTION_ID shape). */
const HOST_ACTION_ID = 'vivim.preview';
const HOST_CATALOG_VERSION = 1;
/** Lane A's registered action reference id/version. */
const ACTION_REF_ID = 'fixture.preview';
const ACTION_REF_VERSION = 1;
/** Cross-lane version pins shared by Lane G's compile context and Lane H's context. */
const HOST_WORLD = 'world-1';
const POLICY_REVISION = 'policy-1';
const KB_VERSION = 'kb-1';
const UI_REVISION = 'rev-1';
const NOW_MS = 1_792_000_000_000;
const SESSION_TTL_MS = 60_000;

const OWNER_REF = 'owner_a';
const ACTOR_REF = 'actor_a';
const DEVICE_REF = 'desktop_1';
const SESSION_REF = 'session_1';
const WORLD_REF = 'world_a';
const DOCUMENT_ID = 'doc.integration2';

const digestOf = (value: unknown): string => sha256Hex(canonicalJson(value));

/**
 * The one canonical Lane A document used by every leg of the composition.
 * It is authored against Lane A's own schema, so Lane A is the authority for it.
 */
export const CANONICAL_DOCUMENT = {
  schema: UI_DOCUMENT_SCHEMA,
  documentId: DOCUMENT_ID,
  scope: { ownerRef: OWNER_REF, workspaceRef: WORLD_REF },
  revision: 1,
  rootId: 'root',
  nodes: [
    {
      id: 'root',
      type: 'stack',
      children: ['panel', 'grid-1', 'action-button'],
      props: { direction: 'vertical', gap: 'md' },
      layout: { minWidth: 320, maxWidth: 1280, columns: 1, gap: 'md', phone: { minWidth: 320 }, desktop: { minWidth: 1024 } },
      a11y: { role: 'main', name: 'Integration 2 workspace' },
      bindingRefs: [],
    },
    {
      id: 'panel',
      type: 'card',
      children: [],
      props: { title: 'Shared project path', description: 'Synthetic project note' },
      a11y: { role: 'group', name: 'Shared project path' },
      bindingRefs: ['bind-1'],
    },
    {
      id: 'grid-1',
      type: 'grid',
      children: ['cell-a', 'cell-b'],
      props: { columns: 2, gap: 'md' },
      a11y: { role: 'group', name: 'Panel grid' },
      bindingRefs: [],
    },
    {
      id: 'cell-a',
      type: 'text',
      children: [],
      props: { value: 'Shared project path', variant: 'body' },
      a11y: { role: 'text', name: 'Shared project path' },
      bindingRefs: [],
    },
    {
      id: 'cell-b',
      type: 'text',
      children: [],
      props: { value: 'Synthetic note', variant: 'body' },
      a11y: { role: 'text', name: 'Synthetic note' },
      bindingRefs: [],
    },
    {
      id: 'action-button',
      type: 'button',
      children: [],
      props: { label: 'Preview' },
      a11y: { role: 'button', name: 'Preview', focusOrder: 1 },
      actionRefs: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }],
    },
  ],
  bindings: [
    {
      id: 'bind-1',
      version: 1,
      nodeId: 'panel',
      field: 'title',
      knowledgeRef: KNOWLEDGE_STABLE_ID,
      provenanceRef: `fixture-evidence:${KNOWLEDGE_STABLE_ID}`,
      readScope: 'owner',
      availability: 'present',
    },
  ],
  views: [
    { id: 'view-desktop', version: 1, kind: '2d', viewport: 'desktop' },
    { id: 'view-phone', version: 1, kind: '2d', viewport: 'phone' },
    { id: 'view-spatial', version: 1, kind: 'spatial', fallbackViewId: 'view-desktop', sourceRef: 'fixture.spatial.source' },
  ],
} as const;

export interface CompositionLaneLeg {
  readonly lane: string;
  readonly module: string;
  readonly evidence: 'real-module-call';
}

export interface CompositionSeam {
  readonly from: string;
  readonly to: string;
  readonly status: 'composed' | 'refused-measured';
  readonly detail: string;
  readonly owner: string;
}

export interface Integration2Composition {
  readonly schema: typeof COMPOSITION_SCHEMA;
  readonly generatedAtMs: number;
  readonly legs: readonly CompositionLaneLeg[];
  readonly seams: readonly CompositionSeam[];
  readonly laneA: {
    readonly ok: boolean;
    readonly readOnly: boolean;
    readonly diagnostics: readonly { readonly code: string; readonly path: string; readonly message: string }[];
    readonly nodeCount: number;
    readonly bindingKnowledgeRef: string;
    readonly actionRefs: readonly { readonly id: string; readonly version: number }[];
  };
  readonly laneB: {
    readonly aNodeAccepted: boolean;
    readonly aNodeCode: string | null;
    readonly aNodeReason: string | null;
    readonly bNativeAccepted: boolean;
    readonly layout: readonly {
      readonly viewportPx: number;
      readonly columns: number;
      readonly itemWidthPx: number;
      readonly gapPx: number;
      readonly paddingPx: number;
    }[];
  };
  readonly laneC: {
    readonly baseRevision: number;
    readonly draftRevision: number;
    readonly previewMatchesEdit: boolean;
    readonly committedRevision: number | null;
    readonly committedDigest: string | null;
    readonly replayed: boolean;
    readonly staleRefusal: string | null;
    readonly digestMismatchRefusal: string | null;
    readonly rollbackRevision: number | null;
    readonly documentsAfterPreview: number;
  };
  readonly laneD: {
    readonly rawDocumentStatus: string;
    readonly rawDocumentIssues: readonly string[];
    readonly rendered: readonly {
      readonly viewportPx: number;
      readonly status: string;
      readonly issueCodes: readonly string[];
      readonly focusOrder: readonly string[];
      readonly nodeCount: number;
      readonly snapshot: string;
    }[];
    readonly gridColumnsByViewport: readonly { readonly viewportPx: number; readonly columns: number }[];
    readonly spatialLossCodes: readonly string[];
    readonly effectHandles: readonly string[];
    readonly versionTable: readonly { readonly id: string; readonly version: number; readonly inert: boolean }[];
  };
  readonly laneE: {
    readonly recovery: {
      readonly stage: string;
      readonly retryPolicy: string;
      readonly automaticRetryAllowed: boolean;
      readonly actionKinds: readonly string[];
    };
    readonly help: {
      readonly visible: boolean;
      readonly runnable: boolean;
      readonly canRequestPreview: boolean;
      readonly whyUnavailable: string | null;
    };
  };
  readonly laneF: {
    readonly boundItemVisible: boolean;
    readonly boundItemStableId: string | null;
    readonly boundItemLabel: string | null;
    readonly cardCount: number;
    readonly crossOwnerItems: number;
    readonly afterTombstoneItems: number;
    readonly projectionState: string;
  };
  readonly laneG: {
    readonly outcome: string;
    readonly semanticId: string;
    readonly actionId: string;
    readonly risk: string;
    readonly args: Readonly<Record<string, string>>;
    readonly exactText: string;
    readonly triModalParity: boolean;
    readonly crosswalkResolved: boolean;
    readonly argumentsAccepted: boolean;
    readonly unknownSemanticOutcome: string;
    readonly unknownSemanticReason: string | null;
  };
  readonly laneH: {
    readonly capability: {
      readonly supportedByBuild: string;
      readonly availableNow: string;
      readonly permittedForActor: string;
      readonly verifiedByEvidence: string;
      readonly reasonCodes: readonly string[];
    };
    readonly granted: {
      readonly kind: string;
      readonly effectInvoked: boolean;
      readonly approvalRequired: boolean;
      readonly planId: string | null;
    };
    readonly approved: { readonly kind: string; readonly effectInvoked: boolean; readonly next: string | null };
    readonly denied: {
      readonly kind: string;
      readonly reasonCode: string;
      readonly effectInvoked: boolean;
      readonly next: string;
    };
    readonly portMembers: readonly string[];
    readonly hasExecuteEntryPoint: boolean;
  };
}

interface RenderNodeLike {
  readonly id: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly layout: { readonly columns: number };
  readonly children: readonly RenderNodeLike[];
}

const EFFECT_HANDLE_KEYS = /^(?:on[a-z]+|href|src|action|formaction|style|innerhtml|srcdoc)$/i;

function walkNodes(node: RenderNodeLike, visit: (node: RenderNodeLike) => void): void {
  visit(node);
  for (const child of node.children) walkNodes(child, visit);
}

function collectEffectHandles(node: RenderNodeLike): string[] {
  const found: string[] = [];
  walkNodes(node, (current) => {
    for (const [key, value] of Object.entries(current.attributes)) {
      if (EFFECT_HANDLE_KEYS.test(key) || /javascript:/i.test(value)) found.push(`${current.id}.${key}`);
    }
  });
  return found;
}

function findNode(node: RenderNodeLike, id: string): RenderNodeLike | null {
  let hit: RenderNodeLike | null = null;
  walkNodes(node, (current) => {
    if (!hit && current.id === id) hit = current;
  });
  return hit;
}

/**
 * Runs the whole A–H chain once and returns a structured, inspectable report.
 * Pure: it opens no sockets, writes no files and mutates no shared state.
 */
export async function composeIntegration2(): Promise<Integration2Composition> {
  const legs: CompositionLaneLeg[] = [];
  const seams: CompositionSeam[] = [];

  // ---------------------------------------------------------------- Lane A
  legs.push({ lane: 'A', module: 'src/visual-runtime/document/validate.ts', evidence: 'real-module-call' });
  const validation = validateUiDocument(CANONICAL_DOCUMENT, {
    knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }],
  });
  const laneA: Integration2Composition['laneA'] = {
    ok: validation.ok,
    readOnly: validation.readOnly,
    diagnostics: validation.diagnostics.map((d) => ({ code: d.code, path: d.path, message: d.message })),
    nodeCount: validation.ok ? validation.document.nodes.length : 0,
    bindingKnowledgeRef:
      validation.ok && validation.document.bindings.length > 0
        ? (validation.document.bindings[0]?.knowledgeRef ?? '')
        : '',
    actionRefs:
      validation.ok
        ? validation.document.nodes.flatMap((node) =>
            (node.actionRefs ?? []).map((ref) => ({ id: ref.id, version: ref.version })),
          )
        : [],
  };
  if (!validation.ok) {
    throw new Error(`INTEGRATION_2_LANE_A_REFUSED:${validation.diagnostics[0]?.code}`);
  }
  const document = validation.document;

  // ------------------------------------------------------- A -> adapter -> D
  // Lane A's action references are versioned objects; Lane D only accepts
  // inert string reference lists. The integrator adapter is the only bridge.
  legs.push({ lane: 'D', module: 'src/visual-runtime/render/dom.ts', evidence: 'real-module-call' });
  const rawPlan = renderUiDocument(document, { viewportPx: 1280 });
  const rawIssues = rawPlan.issues.map((issue) => issue.code);
  const adapted = projectInertActionRefs(document);
  const renderedPlans = [320, 360, 1280].map((viewportPx) => {
    const plan = renderUiDocument(adapted.rendererDocument, { viewportPx });
    const inspection = inspectRenderPlan(plan);
    return {
      viewportPx,
      status: plan.status,
      issueCodes: inspection.issueCodes,
      focusOrder: inspection.focusOrder,
      nodeCount: inspection.nodeCount,
      snapshot: snapshotRenderPlan(plan),
    };
  });
  const desktopPlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 1280 });
  const phonePlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 320 });
  const gridColumnsByViewport = [320, 360, 1280].map((viewportPx) => {
    const plan = renderUiDocument(adapted.rendererDocument, { viewportPx });
    return { viewportPx, columns: findNode(plan.root as unknown as RenderNodeLike, 'grid-1')?.layout.columns ?? 0 };
  });
  const laneD: Integration2Composition['laneD'] = {
    rawDocumentStatus: rawPlan.status,
    rawDocumentIssues: rawIssues,
    rendered: renderedPlans,
    gridColumnsByViewport,
    spatialLossCodes: desktopPlan.spatial.lossCodes,
    effectHandles: collectEffectHandles(desktopPlan.root as unknown as RenderNodeLike),
    versionTable: adapted.actionVersionTable.map((entry) => ({ id: entry.id, version: entry.version, inert: entry.inert })),
  };
  seams.push({
    from: 'A',
    to: 'D',
    status: 'composed',
    detail: `Lane A's versioned action references are objects; Lane D accepts only inert string reference lists, so the raw document renders ${rawPlan.status} (${rawIssues.join(',') || 'no issues'}) and only the integrator adapter output renders. Adapter preserves {id,version} in a separate read-only table: ${laneD.versionTable.map((e) => `${e.id}@${e.version}`).join(',')}.`,
    owner: 'integrator (src/visual-runtime/integration-2/action-adapter.mjs)',
  });

  // ---------------------------------------------------------------- Lane B
  legs.push({ lane: 'B', module: 'src/visual-runtime/components/catalog.ts', evidence: 'real-module-call' });
  const panelNode = document.nodes.find((node) => node.id === 'panel');
  const aNodeResult = panelNode ? inspectComponent(panelNode as unknown) : { ok: false as const, code: 'INVALID_COMPONENT' as const, reason: 'node missing' };
  const bNative = inspectComponent({
    id: 'panel',
    type: 'card',
    props: { title: 'Shared project path' },
    children: [],
    a11y: { role: 'group', name: 'Shared project path' },
  });
  const layout = [320, 360, 1280].map((viewportPx) => {
    const resolved = resolveLayout(
      { mode: 'grid', gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 },
      viewportPx,
      2,
    );
    return {
      viewportPx,
      columns: resolved.ok ? resolved.value.columns : 0,
      itemWidthPx: resolved.ok ? resolved.value.itemWidthPx : 0,
      gapPx: resolved.ok ? resolved.value.gapPx : 0,
      paddingPx: resolved.ok ? resolved.value.paddingPx : 0,
    };
  });
  const laneB: Integration2Composition['laneB'] = {
    aNodeAccepted: aNodeResult.ok,
    aNodeCode: aNodeResult.ok ? null : aNodeResult.code,
    aNodeReason: aNodeResult.ok ? null : aNodeResult.reason,
    bNativeAccepted: bNative.ok,
    layout,
  };
  seams.push({
    from: 'A',
    to: 'B',
    status: aNodeResult.ok ? 'composed' : 'refused-measured',
    detail: aNodeResult.ok
      ? 'Lane A nodes are accepted by Lane B as-is.'
      : `Lane B's inspector refuses the Lane A card node: ${aNodeResult.code} (${aNodeResult.reason}). Lane B's own vocabulary accepts the equivalent B-native card (${bNative.ok}), so the gap is the A/B vocabulary difference (props, a11y fields, id charset, action-ref shape), not a broken module.`,
    owner: 'Lane B Wave 3 canonical map (src/visual-runtime/components/wave3-canonical-map.ts) — not integrator-owned',
  });

  // ---------------------------------------------------------------- Lane C
  legs.push({ lane: 'C', module: 'src/visual-runtime/revisions/fixture-store.ts', evidence: 'real-module-call' });
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
  const created = store.createDraft(principal, 'draft-1', DOCUMENT_ID, document);
  if (!created.ok) throw new Error(`INTEGRATION_2_LANE_C_DRAFT:${created.code}`);
  const edited = store.editDraft(principal, 'draft-1', created.value.draftRevision, document);
  if (!edited.ok) throw new Error(`INTEGRATION_2_LANE_C_EDIT:${edited.code}`);
  const preview = store.preview(principal, 'draft-1');
  const previewMatchesEdit = preview.ok && preview.value.documentDigest === edited.value.documentDigest;
  const documentsAfterPreview = store.snapshot().documents.length;
  const published = store.publish(principal, {
    commandId: 'cmd-publish-1',
    documentId: DOCUMENT_ID,
    expectedRevision: 0,
    draftId: 'draft-1',
    documentDigest: edited.value.documentDigest,
  });
  const replay = store.publish(principal, {
    commandId: 'cmd-publish-1',
    documentId: DOCUMENT_ID,
    expectedRevision: 0,
    draftId: 'draft-1',
    documentDigest: edited.value.documentDigest,
  });
  // The first publish consumed draft-1, so the stale-base and digest-mismatch
  // refusals each need their own live draft at the current base revision.
  const staleDraft = store.createDraft(principal, 'draft-stale', DOCUMENT_ID, document);
  const stale = staleDraft.ok
    ? store.publish(principal, {
        commandId: 'cmd-publish-stale',
        documentId: DOCUMENT_ID,
        expectedRevision: 0,
        draftId: 'draft-stale',
        documentDigest: staleDraft.value.documentDigest,
      })
    : { ok: false as const, code: 'DRAFT_REFUSED' as const };
  const mismatchDraft = store.createDraft(principal, 'draft-mismatch', DOCUMENT_ID, document);
  const mismatched = mismatchDraft.ok
    ? store.publish(principal, {
        commandId: 'cmd-publish-mismatch',
        documentId: DOCUMENT_ID,
        expectedRevision: 1,
        draftId: 'draft-mismatch',
        documentDigest: `sha256:${'0'.repeat(64)}`,
      })
    : { ok: false as const, code: 'DRAFT_REFUSED' as const };
  const rolledBack = store.rollback(principal, {
    commandId: 'cmd-rollback-1',
    documentId: DOCUMENT_ID,
    expectedRevision: published.ok ? published.value.revision : 1,
    targetRevision: 1,
  });
  const laneC: Integration2Composition['laneC'] = {
    baseRevision: created.value.baseRevision,
    draftRevision: edited.value.draftRevision,
    previewMatchesEdit,
    committedRevision: published.ok ? published.value.revision : null,
    committedDigest: published.ok ? published.value.documentDigest : null,
    replayed: replay.ok && replay.replayed === true,
    staleRefusal: stale.ok ? null : stale.code,
    digestMismatchRefusal: mismatched.ok ? null : mismatched.code,
    rollbackRevision: rolledBack.ok ? rolledBack.value.revision : null,
    documentsAfterPreview,
  };
  seams.push({
    from: 'A',
    to: 'C',
    status: published.ok ? 'composed' : 'refused-measured',
    detail: `Lane A's validated document is published through Lane C's revision port: base revision ${created.value.baseRevision}, draft revision ${edited.value.draftRevision}, committed revision ${laneC.committedRevision ?? 'none'}, digest ${laneC.committedDigest ?? 'none'}. Preview stayed read-only (${documentsAfterPreview} committed documents after preview), replay was idempotent (${laneC.replayed}), stale base refused ${laneC.staleRefusal ?? 'none'}, digest mismatch refused ${laneC.digestMismatchRefusal ?? 'none'}, rollback produced revision ${laneC.rollbackRevision ?? 'none'}.`,
    owner: 'integrator composition over Lane C (src/visual-runtime/revisions/fixture-store.ts)',
  });

  // ---------------------------------------------------------------- Lane G
  legs.push({ lane: 'G', module: 'src/visual-runtime/command/compile.ts', evidence: 'real-module-call' });
  const argsSchema = { target: { type: 'enum' as const, values: [KNOWLEDGE_STABLE_ID] } };
  const argsSchemaHash = digestOf(argsSchema);
  const sourceHash = digestOf({ source: 'fixture.host-catalog', semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION });
  const target = { owner: 'host_effect' as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION };
  const rows: CrosswalkRow[] = [
    {
      semanticRef: { id: SEMANTIC_ID, version: '1', sourceHash },
      target,
      argsSchema,
      argsSchemaHash,
      risk: 'R1',
      riskSource: { authority: 'host_catalog', sourceHash },
      implementationStatus: 'verified',
      reviewedEnabled: true,
    },
  ];
  const descriptors: ActionDescriptor[] = [
    {
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
    },
  ];
  const compileContext = {
    rows,
    descriptors,
    currentVersions: { kb: KB_VERSION, hostWorld: HOST_WORLD, uiRevision: UI_REVISION, policy: POLICY_REVISION },
  };
  const exactText = toExactText(SEMANTIC_ID, { target: KNOWLEDGE_STABLE_ID }) ?? '';
  const textInput = {
    commandId: 'cmd-i2-text',
    source: { surface: 'text' as const, inputDigest: digestOf({ surface: 'text', text: exactText }) },
    text: exactText,
    expectedVersions: { policy: POLICY_REVISION },
  };
  const compiled = compileVisualCommand(textInput, compileContext);
  const touchInput = {
    commandId: 'cmd-i2-touch',
    source: { surface: 'touch' as const, inputDigest: digestOf({ surface: 'touch', text: exactText }) },
    selection: { semanticId: SEMANTIC_ID, args: { target: KNOWLEDGE_STABLE_ID } },
    expectedVersions: { policy: POLICY_REVISION },
  };
  const keyboardInput = {
    commandId: 'cmd-i2-keyboard',
    source: { surface: 'keyboard' as const, inputDigest: digestOf({ surface: 'keyboard', text: exactText }) },
    selection: { semanticId: SEMANTIC_ID, args: { target: KNOWLEDGE_STABLE_ID } },
    expectedVersions: { policy: POLICY_REVISION },
  };
  const compiledTouch = compileVisualCommand(touchInput, compileContext);
  const compiledKeyboard = compileVisualCommand(keyboardInput, compileContext);
  const crosswalk = resolveCrosswalk(SEMANTIC_ID, rows, descriptors);
  const argumentsAccepted = compiled.outcome === 'candidate' && checkArguments(compiled.command.args, rows[0]!.argsSchema);
  const shapeOf = (command: { semanticRef: { id: string; version: string; sourceHash: string }; target: { owner: string; actionId: string; catalogVersion: number }; args: Record<string, string>; risk: { level: string }; capability: { supportedByBuild: boolean | string; availableNow: string; permittedForActor: string; verifiedByEvidence: boolean; reasonCodes: readonly string[] } }) =>
    JSON.stringify({
      semanticRef: command.semanticRef,
      target: command.target,
      args: command.args,
      risk: command.risk,
      capability: command.capability,
    });
  const triModalParity =
    compiled.outcome === 'candidate' &&
    compiledTouch.outcome === 'candidate' &&
    compiledKeyboard.outcome === 'candidate' &&
    shapeOf(compiled.command) === shapeOf(compiledTouch.command) &&
    shapeOf(compiledTouch.command) === shapeOf(compiledKeyboard.command);
  const unknownSemantic = compileVisualCommand(
    {
      commandId: 'cmd-i2-unknown',
      source: { surface: 'text', inputDigest: digestOf({ surface: 'text', text: 'unknown' }) },
      text: toExactText('vivim.unknown@1', { target: KNOWLEDGE_STABLE_ID }) ?? '',
    },
    compileContext,
  );
  const laneG: Integration2Composition['laneG'] = {
    outcome: compiled.outcome,
    semanticId: compiled.outcome === 'candidate' ? compiled.command.semanticRef.id : '',
    actionId: compiled.outcome === 'candidate' ? compiled.command.target.actionId : '',
    risk: compiled.outcome === 'candidate' ? compiled.command.risk.level : '',
    args: compiled.outcome === 'candidate' ? compiled.command.args : {},
    exactText,
    triModalParity,
    crosswalkResolved: crosswalk.ok,
    argumentsAccepted,
    unknownSemanticOutcome: unknownSemantic.outcome,
    unknownSemanticReason: unknownSemantic.outcome === 'candidate' ? null : unknownSemantic.reasonCode,
  };

  // ---------------------------------------------------------------- Lane H
  legs.push({ lane: 'H', module: 'src/visual-runtime/host/fixture.ts', evidence: 'real-module-call' });
  const catalogDigest = digestOf({ catalog: 'fixture.host-catalog', version: HOST_CATALOG_VERSION });
  const host = createHostCapabilityFixture({
    catalogVersion: HOST_CATALOG_VERSION,
    catalogDigest,
    actions: [
      {
        actionId: HOST_ACTION_ID,
        catalogVersion: HOST_CATALOG_VERSION,
        risk: 'R1',
        readiness: 'verified',
        requiredScopes: ['vivim:preview'],
        argsSchema: { target: { type: 'enum', values: [KNOWLEDGE_STABLE_ID] } },
        evidence: 'verified',
        prerequisites: [],
      },
    ],
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
  const deniedContext = { ...hostContext, grant: null };
  const capability = host.describeForPrincipal(deniedContext, HOST_ACTION_ID);
  const hostCommand = {
    schema: 'vivim.visual-command/1' as const,
    commandId: compiled.outcome === 'candidate' ? compiled.command.commandId : 'cmd-i2-text',
    target,
    args: compiled.outcome === 'candidate' ? compiled.command.args : { target: KNOWLEDGE_STABLE_ID },
    sourceVersions: { hostWorld: HOST_WORLD, policy: POLICY_REVISION, catalogDigest },
  };
  const prepared = host.prepare(hostCommand, hostContext);
  const denied = host.prepare(hostCommand, deniedContext);
  const approved = prepared.kind === 'prepared_inert'
    ? host.evaluateApprovalInert(
        prepared.plan,
        { planDigest: prepared.plan.planDigest, channel: 'desktop-owner-token', ownerConfirmed: true },
        hostContext,
      )
    : { kind: 'not-prepared', effectInvoked: false as const, next: null };
  const laneH: Integration2Composition['laneH'] = {
    capability: {
      supportedByBuild: capability.supportedByBuild,
      availableNow: capability.availableNow,
      permittedForActor: capability.permittedForActor,
      verifiedByEvidence: capability.verifiedByEvidence,
      reasonCodes: capability.reasonCodes,
    },
    granted: {
      kind: prepared.kind,
      effectInvoked: prepared.kind === 'prepared_inert' ? prepared.effectInvoked : false,
      approvalRequired: prepared.kind === 'prepared_inert' ? prepared.plan.approvalRequired : false,
      planId: prepared.kind === 'prepared_inert' ? prepared.plan.planId : null,
    },
    approved: { kind: approved.kind, effectInvoked: approved.effectInvoked, next: approved.next },
    denied: {
      kind: denied.kind,
      reasonCode: denied.kind === 'denied' ? denied.reasonCode : 'none',
      effectInvoked: denied.kind === 'denied' ? denied.effectInvoked : false,
      next: denied.kind === 'denied' ? denied.next : 'none',
    },
    portMembers: Object.keys(host),
    hasExecuteEntryPoint: 'execute' in host || 'dispatch' in host,
  };
  seams.push({
    from: 'G',
    to: 'H',
    status: prepared.kind === 'prepared_inert' ? 'composed' : 'refused-measured',
    detail: `Lane G's compiled candidate (${laneG.outcome}) is projected onto Lane H's inert host command schema (same 'vivim.visual-command/1' schema string, same target, same args). Lane H prepared it inertly (${laneH.granted.kind}, effectInvoked=${laneH.granted.effectInvoked}) and, with no grant, refused it (${laneH.denied.reasonCode}, effectInvoked=${laneH.denied.effectInvoked}). The port exposes ${laneH.portMembers.join(', ')} and no execute/dispatch entry point.`,
    owner: 'integrator composition over Lane H (src/visual-runtime/host/fixture.ts)',
  });

  // ---------------------------------------------------------------- Lane F
  legs.push({ lane: 'F', module: 'src/visual-runtime/knowledge/client.ts', evidence: 'real-module-call' });
  const broker = mutableFixtureBroker(fixtureTrustedContext());
  const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () => NOW_MS });
  const boundPage = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-i2-bound',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: KNOWLEDGE_STABLE_ID,
    limit: 10,
  });
  const boundItem = boundPage.items[0];
  const boundProjection = projectKnowledgePage(boundPage);
  const crossOwnerPage = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-i2-cross',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    query: 'private',
    limit: 10,
  });
  knowledge.applyFixtureSourceEvent({ type: 'tombstone', stableId: KNOWLEDGE_STABLE_ID });
  const afterTombstone = await knowledge.query({
    schema: 'vivim.knowledge-query/1',
    requestId: 'req-i2-tombstone',
    personalWorldRef: WORLD_REF,
    purpose: 'task',
    surface: 'pc',
    entityRef: KNOWLEDGE_STABLE_ID,
    limit: 10,
  });
  const laneF: Integration2Composition['laneF'] = {
    boundItemVisible: boundItem?.visibility === 'visible',
    boundItemStableId: boundItem?.stableId ?? null,
    boundItemLabel: boundItem?.label ?? null,
    cardCount: boundProjection.cards.length,
    crossOwnerItems: crossOwnerPage.items.length,
    afterTombstoneItems: afterTombstone.items.length,
    projectionState: boundProjection.state,
  };
  seams.push({
    from: 'A',
    to: 'F',
    status: laneF.boundItemVisible ? 'composed' : 'refused-measured',
    detail: `Lane A's binding knowledgeRef ${KNOWLEDGE_STABLE_ID} resolves through Lane F's real client to the visible record "${laneF.boundItemLabel ?? 'none'}" (${laneF.cardCount} projected card(s), projection state ${laneF.projectionState}). Cross-owner/cross-world records matching "private" returned ${laneF.crossOwnerItems} item(s); after a synthetic tombstone the bound record returned ${laneF.afterTombstoneItems} item(s).`,
    owner: 'integrator composition over Lane F (src/visual-runtime/knowledge/client.ts)',
  });

  // ---------------------------------------------------------------- Lane E
  legs.push({ lane: 'E', module: 'src/visual-runtime/experience/recovery.ts + help.ts', evidence: 'real-module-call' });
  const recovery = projectRecovery({
    authority: 'host',
    stage: 'denied',
    operationKind: 'host_effect',
    reasonCode: laneH.denied.reasonCode,
    offline: false,
    canCancel: true,
    canRequestUndo: false,
    statusCheckedByAuthority: true,
  });
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
  const laneE: Integration2Composition['laneE'] = {
    recovery: {
      stage: recovery.stage,
      retryPolicy: recovery.retryPolicy,
      automaticRetryAllowed: recovery.automaticRetryAllowed,
      actionKinds: recovery.actions.map((action) => action.kind),
    },
    help: {
      visible: help.visible,
      runnable: help.runnable,
      canRequestPreview: help.canRequestPreview,
      whyUnavailable: help.whyUnavailable ?? null,
    },
  };
  seams.push({
    from: 'H',
    to: 'E',
    status: 'composed',
    detail: `Lane H's denial (${laneH.denied.reasonCode}) becomes Lane E's recovery view (stage ${recovery.stage}, retry policy ${recovery.retryPolicy}, automatic retry ${recovery.automaticRetryAllowed}, actions ${recovery.actions.map((a) => a.kind).join('/')}), and Lane H's capability view plus Lane F's authorized record become Lane E's help projection (visible=${help.visible}, runnable=${help.runnable}, canRequestPreview=${help.canRequestPreview}).`,
    owner: 'integrator composition over Lane E (src/visual-runtime/experience/)',
  });

  return {
    schema: COMPOSITION_SCHEMA,
    generatedAtMs: NOW_MS,
    legs,
    seams,
    laneA,
    laneB,
    laneC,
    laneD,
    laneE,
    laneF,
    laneG,
    laneH,
  };
}
