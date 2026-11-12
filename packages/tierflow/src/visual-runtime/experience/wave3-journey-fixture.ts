/**
 * Wave 3 Lane E — inert, synthetic Founder Workspace composition.
 * No live KB/Host/provider access, execution, permission minting or persistent UI writes.
 * Real Wave 2 modules retain authority for knowledge, document, rendering, command and Host decisions.
 */
import { UI_DOCUMENT_SCHEMA, type UiDocument, type UiDocumentNode, type UiDocumentBinding } from '../document/schema.ts';
import { validateUiDocument, type UiDocumentValidation } from '../document/validate.ts';
import { renderUiDocument, type RenderPlan } from '../render/dom.ts';
import { projectKnowledgePage, type KnowledgeCard } from '../knowledge/projection.ts';
import { KNOWLEDGE_QUERY_SCHEMA, type KnowledgeClient, type KnowledgeItem, type KnowledgePage,
  type TrustedKnowledgeBroker, type TrustedKnowledgeContext } from '../knowledge/client.ts';
import { compileVisualCommand, toExactText, type CompileContext } from '../command/compile.ts';
import type { CommandInput, VisualCommand } from '../command/ir.ts';
import type { HostCapabilityPort, TrustedFixtureHostContext, HostCapabilityView } from '../host/port.ts';
import { projectCapabilityHelp, type HelpView, type CapabilityDescriptor } from './help.ts';
import { projectRecovery, type RecoveryView, type RecoveryStage } from './recovery.ts';
import { projectJourney, transitionJourney, type JourneyState, type JourneyView, type OnboardingEvidence } from './onboarding.ts';

export const FOUNDER_JOURNEY_SCHEMA = 'vivim.founder-journey-fixture/1' as const;
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const safeId = (v: unknown): v is string => typeof v === 'string' && ID.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const safeProvenanceText = (v: unknown): v is string => typeof v === 'string' && v.length > 0 &&
  v.length <= 160 && !/[<>\u0000-\u001f\u007f]|(?:javascript:|data:|https?:\/\/|onerror\s*=|onclick\s*=)/i.test(v);
const safeProjectedText = (v: string): boolean => !/(?:&lt;|&gt;|<|>|javascript:|data:|https?:\/\/|onerror\s*=|onclick\s*=)/i.test(v);

export interface FounderJourneyInput {
  /** The same trusted broker instance used by knowledgeClient, injected outside the UI. */
  readonly knowledgeBroker: TrustedKnowledgeBroker;
  readonly knowledgeClient: KnowledgeClient;
  readonly host: HostCapabilityPort;
  /** Host fixture context injected by test harness, NEVER copied from a browser request. */
  readonly hostContext: TrustedFixtureHostContext;
  readonly workspaceRef: string;
  readonly documentId: string;
  readonly requestId: string;
  /** Exact stable IDs, not user-provided labels or unscoped search results. */
  readonly projectStableIds: readonly string[];
  /** Read-only comparison baseline; differences are cues, not source-confirmed changes. */
  readonly earlierSourceVersions?: Readonly<Record<string, string>>;
  readonly commandInput: CommandInput;
  readonly commandContext: CompileContext;
  readonly hostCatalogDigest: string;
  readonly onboardingState: JourneyState;
  readonly onboardingEvidence: OnboardingEvidence;
  readonly viewportPx: number;
  readonly nowMs: number;
}
export interface FounderProject {
  readonly stableId: string;
  readonly title: string;
  readonly summary: string;
  readonly availability: KnowledgeItem['availability'];
  readonly statusLabel: string;
  readonly changeCue: 'no-baseline' | 'same-version' | 'version-diff-unverified';
  readonly source: Readonly<{ authority: string; nativeVersion: string; digest: string; evidenceRefs: readonly string[]; asOf: string }>;
  readonly interactive: false;
}
export interface FounderCommandPreview {
  readonly kind: 'typed-inert-candidate';
  readonly command: Readonly<Pick<VisualCommand, 'schema' | 'semanticRef' | 'target' | 'args' | 'risk' | 'sourceVersions'>>;
  readonly exactText: string;
  readonly authorization: 'not-granted';
  readonly effectInvoked: false;
}
export interface FounderJourneyView {
  readonly schema: typeof FOUNDER_JOURNEY_SCHEMA;
  readonly evidenceClass: 'synthetic-real-module-fixture';
  readonly state: 'ready' | 'partial' | 'empty' | 'denied' | 'unavailable';
  readonly projects: readonly FounderProject[];
  readonly knowledgeRevisions: readonly string[];
  readonly document: UiDocumentValidation;
  readonly render: RenderPlan;
  readonly commandPreview: FounderCommandPreview | null;
  readonly commandRefusal: string | null;
  readonly hostDecision: Readonly<{ kind: 'denied' | 'prepared_inert' | 'not_evaluated'; reasonCode: string | null; effectInvoked: false }>;
  readonly help: HelpView;
  readonly onboarding: JourneyView;
  readonly recovery: RecoveryView;
  readonly navigation: Readonly<{
    openHelp: 'open-contextual-help'; textHelpQuery: string;
    cancelAccepted: boolean; resumeAccepted: boolean; resumedStep: JourneyState['current'];
    focusReturn: 'onboarding-current-step'; escape: 'return_to_safe_screen';
    deliberateInteractionsToHelp: 1;
  }>;
  readonly effectInvoked: false;
}

/** Verified only against injected test brokers; production must bind the two brokers at integration time. */
function alignedKnowledgeScope(k: TrustedKnowledgeContext | null, h: TrustedFixtureHostContext, nowMs: number): k is TrustedKnowledgeContext {
  return !!k && h.authenticated === true && h.schema === 'fixture.trusted-host-context/1' &&
    Number.isSafeInteger(nowMs) && nowMs === h.nowMs && nowMs < h.sessionExpiresAtMs &&
    k.ownerRef === h.ownerRef && k.sessionRef === h.sessionRef && k.deviceRef === h.deviceRef &&
    k.personalWorldRef === h.worldRef && k.surface === (h.surface === 'phone' ? 'android' : 'pc') &&
    k.allowedPurposes.includes('task') && !k.revoked && !k.offline &&
    k.sessionExpiresAt > nowMs && k.grantExpiresAt > nowMs;
}
function sameScope(a: TrustedKnowledgeContext, b: TrustedKnowledgeContext): boolean {
  return a.ownerRef === b.ownerRef && a.sessionRef === b.sessionRef && a.deviceRef === b.deviceRef &&
    a.personalWorldRef === b.personalWorldRef && a.surface === b.surface &&
    a.policyRevision === b.policyRevision && a.grantExpiresAt === b.grantExpiresAt &&
    a.sessionExpiresAt === b.sessionExpiresAt && a.allowPhoneS1 === b.allowPhoneS1 &&
    a.maySeeRedactedMarkers === b.maySeeRedactedMarkers &&
    [...a.allowedPurposes].sort().join('|') === [...b.allowedPurposes].sort().join('|');
}
function emptyDocument(input: FounderJourneyInput): UiDocument {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: input.documentId,
    scope: { ownerRef: input.hostContext.ownerRef, workspaceRef: input.workspaceRef },
    revision: 0, rootId: 'root',
    nodes: [{ id: 'root', type: 'stack', props: { direction: 'vertical' }, children: [],
      a11y: { role: 'main', name: 'Founder Workspace read-only evidence' } }],
    bindings: [], views: [{ id: 'view_phone', version: 1, kind: '2d', viewport: 'phone' },
      { id: 'view_desktop', version: 1, kind: '2d', viewport: 'desktop' }],
  };
}
function toDocument(input: FounderJourneyInput, items: readonly KnowledgeItem[], cards: readonly KnowledgeCard[]): UiDocument {
  const base = emptyDocument(input);
  const byId = new Map(cards.map(card => [card.stableId, card]));
  const nodes: UiDocumentNode[] = [];
  const bindings: UiDocumentBinding[] = [];
  for (const item of items) {
    const card = byId.get(item.stableId);
    if (!card || !safeId(item.stableId) || !item.evidenceRefs.some(safeId) ||
      !item.source.authority || !item.source.nativeVersion || !item.source.digest) continue;
    const n = `project_${nodes.length + 1}`;
    const b = `binding_${nodes.length + 1}`;
    const title = card.title.slice(0, 80);
    const description = `${card.statusLabel} | Source version: ${card.sourceVersion}`.slice(0, 240);
    nodes.push({ id: n, type: 'project-card', props: { title, description }, children: [],
      bindingRefs: [b], a11y: { role: 'group', name: title } });
    bindings.push({ id: b, version: 1, nodeId: n, field: 'title', knowledgeRef: item.stableId,
      provenanceRef: item.evidenceRefs.find(safeId)!, readScope: 'owner', availability: item.availability });
  }
  return { ...base, nodes: [{ id: 'root', type: 'stack', props: { direction: 'vertical' },
    children: nodes.map(n => n.id), a11y: { role: 'main', name: 'Founder Workspace read-only evidence' } }, ...nodes], bindings };
}
function safeHelp(capability: HostCapabilityView, item: KnowledgeItem | undefined, revision: string | null, nowMs: number): HelpView {
  const yesNoUnknown = (value: 'yes' | 'no' | 'unknown'): 'yes' | 'no' | 'unknown' => value;
  const d: CapabilityDescriptor = {
    actionId: capability.actionId, title: 'Preview a workspace action',
    explanation: 'This is a read-only explanation. A typed candidate is not an owner authorization.',
    authority: 'host', sourceVersion: `catalog-${capability.catalogVersion}`,
    sourceDigest: capability.catalogDigest, observedAt: new Date(nowMs).toISOString(), surface: 'desktop',
    risk: capability.risk, disclosure: 'public',
    readiness: { supportedByBuild: yesNoUnknown(capability.supportedByBuild),
      availableNow: yesNoUnknown(capability.availableNow),
      permittedForActor: yesNoUnknown(capability.permittedForActor),
      verifiedByEvidence: yesNoUnknown(capability.verifiedByEvidence) },
    prerequisites: capability.prerequisites, requiredScopes: capability.requiredScopes,
    errorCodes: capability.reasonCodes,
  };
  return projectCapabilityHelp(d, item && revision && item.visibility === 'visible' ? {
    stableId: item.stableId, projectionRevision: revision, sourceAuthority: item.source.authority,
    sourceVersion: item.source.nativeVersion, evidenceRefs: item.evidenceRefs, asOf: item.asOf,
    visibility: 'authorized',
  } : null);
}

/** Single read-only journey. All external evidence is fixture-grade, not a signed live assertion. */
export async function projectFounderWorkspaceJourney(input: FounderJourneyInput): Promise<FounderJourneyView> {
  if (!safeId(input.documentId) || !safeId(input.workspaceRef) || !safeId(input.requestId) ||
    input.requestId.length > 64 || !Array.isArray(input.projectStableIds) || input.projectStableIds.length > 8 ||
    new Set(input.projectStableIds).size !== input.projectStableIds.length || !input.projectStableIds.every(safeId)) {
    throw new TypeError('Invalid inert Founder Workspace request');
  }
  const onboarding = projectJourney(input.onboardingState, input.onboardingEvidence, input.nowMs);
  const cancelled = transitionJourney(input.onboardingState, 'cancel', input.onboardingEvidence, input.nowMs);
  const resumed = transitionJourney(cancelled.state, 'resume', input.onboardingEvidence, input.nowMs);
  const navigation: FounderJourneyView['navigation'] = {
    openHelp: 'open-contextual-help', textHelpQuery: 'help preview workspace action',
    cancelAccepted: cancelled.accepted, resumeAccepted: resumed.accepted,
    resumedStep: resumed.state.current, focusReturn: onboarding.focus.returnFocusTo,
    escape: 'return_to_safe_screen', deliberateInteractionsToHelp: 1,
  };
  const before = input.knowledgeBroker.readContext();
  let pages: readonly KnowledgePage[] = [];
  let state: FounderJourneyView['state'] = 'denied';
  if (alignedKnowledgeScope(before, input.hostContext, input.nowMs)) {
    pages = await Promise.all(input.projectStableIds.map((entityRef, i) => input.knowledgeClient.query({
      schema: KNOWLEDGE_QUERY_SCHEMA, requestId: `${input.requestId}_${i}`,
      personalWorldRef: before.personalWorldRef, surface: before.surface, purpose: 'task', entityRef, limit: 1,
    })));
    const after = input.knowledgeBroker.readContext();
    if (!alignedKnowledgeScope(after, input.hostContext, input.nowMs) || !sameScope(before, after)) {
      pages = []; state = 'denied';
    } else if (pages.some(page => page.status === 'denied')) {
      pages = []; state = 'denied';
    } else if (pages.some(page => page.status === 'unavailable')) {
      pages = []; state = 'unavailable';
    } else {
      state = 'ready';
    }
  }
  const revisionList = pages.map(p => p.projectionRevision).filter((x): x is string => x !== null);
  if (new Set(revisionList).size > 1 || pages.some(p => p.completeness === 'unknown')) {
    pages = []; state = 'unavailable';
  }
  const items = pages.flatMap(page => page.items).filter((item): item is KnowledgeItem =>
    item.visibility === 'visible' && input.projectStableIds.includes(item.stableId) &&
    ['present', 'stale', 'unknown', 'unavailable'].includes(item.availability) &&
    safeProvenanceText(item.source?.authority) && safeProvenanceText(item.source.nativeVersion) &&
    safeProvenanceText(item.source.digest) && safeProvenanceText(item.asOf) &&
    safeProjectedText(item.label) && safeProjectedText(item.summary) && item.evidenceRefs.some(safeId));
  const cards = pages.flatMap(page => projectKnowledgePage(page).cards);
  const document = validateUiDocument(toDocument(input, items, cards));
  const render = renderUiDocument(document.ok ? document.document : null, { viewportPx: input.viewportPx });
  const visibleItems = document.ok && render.status !== 'unavailable' ? items : [];
  const visibleCards = new Map(cards.map(card => [card.stableId, card]));
  const projects: FounderProject[] = visibleItems.map(item => {
    const card = visibleCards.get(item.stableId)!;
    const prior = input.earlierSourceVersions?.[item.stableId];
    return { stableId: item.stableId, title: card.title, summary: card.summary,
      availability: item.availability, statusLabel: card.statusLabel,
      changeCue: prior === undefined ? 'no-baseline' : prior === item.source.nativeVersion ? 'same-version' : 'version-diff-unverified',
      source: { authority: item.source.authority, nativeVersion: item.source.nativeVersion,
        digest: item.source.digest, evidenceRefs: item.evidenceRefs.filter(safeId), asOf: item.asOf }, interactive: false };
  });
  if (state === 'ready') {
    state = !document.ok || render.status === 'unavailable' ? 'unavailable' :
      projects.length === 0 ? 'empty' : pages.some(p => p.status === 'partial') || projects.some(p => p.availability !== 'present') ? 'partial' : 'ready';
  }
  // Compile only a command explicitly scoped to a currently visible, provenance-backed entity.
  const compilation = projects.length > 0 && state !== 'denied' && state !== 'unavailable'
    ? compileVisualCommand(input.commandInput, input.commandContext) : null;
  const candidate = compilation?.outcome === 'candidate' ? compilation.command : null;
  const target = candidate?.args.target;
  const usable = !!candidate && candidate.target.owner === 'host_effect' &&
    typeof target === 'string' && projects.some(p => p.stableId === target && p.availability === 'present');
  const commandPreview: FounderCommandPreview | null = usable && candidate ? {
    kind: 'typed-inert-candidate',
    command: { schema: candidate.schema, semanticRef: candidate.semanticRef, target: candidate.target,
      args: candidate.args, risk: candidate.risk, sourceVersions: candidate.sourceVersions },
    exactText: toExactText(candidate.semanticRef.id, candidate.args) ?? '',
    authorization: 'not-granted', effectInvoked: false,
  } : null;
  const commandRefusal = commandPreview ? null : !compilation ? 'NO_AUTHORIZED_KNOWLEDGE' :
    compilation.outcome !== 'candidate' ? compilation.reasonCode : 'TARGET_NOT_CURRENT_AND_VISIBLE';
  // The Host decides independently using its broker-issued current context. Never evaluate approval.
  const hostDecision: FounderJourneyView['hostDecision'] = commandPreview && candidate ? (() => {
    const result = input.host.prepare({ schema: 'vivim.visual-command/1', commandId: candidate.commandId,
      target: { owner: 'host_effect', actionId: candidate.target.actionId, catalogVersion: candidate.target.catalogVersion },
      args: candidate.args, sourceVersions: {
        hostWorld: candidate.sourceVersions.hostWorld ?? '', policy: candidate.sourceVersions.policy ?? '',
        catalogDigest: input.hostCatalogDigest,
      } }, input.hostContext);
    return result.kind === 'denied'
      ? { kind: 'denied', reasonCode: result.reasonCode, effectInvoked: false }
      : { kind: 'prepared_inert', reasonCode: null, effectInvoked: false };
  })() : { kind: 'not_evaluated', reasonCode: null, effectInvoked: false };
  const capability = input.host.describeForPrincipal(input.hostContext,
    candidate?.target.actionId ?? 'vivim.preview');
  const matchingItem = projects.length && commandPreview ? visibleItems.find(item => item.stableId === target) : undefined;
  const help = safeHelp(capability, matchingItem, revisionList[0] ?? null, input.nowMs);
  const recoveryStage: RecoveryStage = state === 'denied' ? 'revoked' : state === 'unavailable' ? 'offline' :
    hostDecision.kind === 'denied' || hostDecision.kind === 'prepared_inert' ? 'denied' : 'stale';
  const recovery = projectRecovery({
    authority: state === 'denied' || state === 'unavailable' ? 'kb' : 'host',
    stage: recoveryStage, operationKind: state === 'denied' || state === 'unavailable' ? 'knowledge_read' : 'host_effect',
    ...(hostDecision.reasonCode ? { reasonCode: hostDecision.reasonCode } : {}),
    offline: state === 'unavailable', canCancel: true, canRequestUndo: false, statusCheckedByAuthority: false,
  });
  return { schema: FOUNDER_JOURNEY_SCHEMA, evidenceClass: 'synthetic-real-module-fixture',
    state, projects, knowledgeRevisions: state === 'denied' || state === 'unavailable' ? [] : revisionList,
    document, render, commandPreview, commandRefusal, hostDecision, help, onboarding, recovery, navigation,
    effectInvoked: false };
}