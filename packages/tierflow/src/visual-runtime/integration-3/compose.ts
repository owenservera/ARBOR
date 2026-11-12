/**
 * Integration 3: executable fixture composition over the REAL Wave 3 A-H modules.
 * No live route, Host executor, KB writer or replacement UI store. The trusted
 * caller must own the broker, seed the legacy World via its existing UiStore,
 * and explicitly opt into a reviewed UI-only CAS. Host effects remain refused.
 *
 * The persisted UiDocument/1 World is deliberately NEVER derived from, cast to,
 * or serialized as the distinct vivim.ui-document/1 display document.
 */
import type { ScopedKnowledgeFeed, ScopedFeedCard } from '../knowledge/wave3-feed-projection.ts';
import type { KnowledgeQuery } from '../knowledge/client.ts';
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from '../document/schema.ts';
import { projectWave3ActionSemantics, type Wave3BindingPin } from '../document/wave3-action-semantics.ts';
import { mapCanonicalComponents } from '../components/wave3-canonical-map.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { compileDescriptorProof, type DescriptorProofContext } from '../command/wave3-descriptor-proof.ts';
import { UiAtomicReplay, type AtomicReplayStore } from '../revisions/wave3-atomic-replay.ts';
import type { VerifiedUiPrincipal, RevisionCommand } from '../revisions/port.ts';
import { parseUiDocument } from '../../ui/world.ts';
import { createWave3ReadGatewayFixture } from '../host/wave3-read-gateway-fixture.ts';
import type { HostFixtureOptions } from '../host/fixture.ts';
import type { HostClaimSnapshot, HostReceiptObservation, TrustedFixtureHostContext } from '../host/port.ts';
import { projectFounderWorkspaceJourney, type FounderJourneyInput } from '../experience/wave3-journey-fixture.ts';

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
type Phase = 'F' | 'A' | 'B' | 'D' | 'G' | 'C' | 'H' | 'E' | 'SCOPE';
export type Integration3Result =
  | Readonly<{ ok: false; phase: Phase; code: string; effectInvoked: false; automaticRetryAllowed: false }>
  | Readonly<{
      ok: true;
      evidenceClass: 'synthetic-real-modules-not-live-acceptance';
      trace: readonly ['F','A','B','D','G','C','H','E'];
      documentId: string; documentRevision: number; documentDigest: string;
      identity: Readonly<{ canonicalNodes: number; mappedNodes: number; actions: number; bindings: number; exact: true }>;
      viewports: readonly { viewportPx: 320 | 360 | 1280; status: string; rootTag: string; focusCount: number }[];
      command: Readonly<{ actionId: string; risk: string; modalities: readonly ['text','touch','keyboard']; authorized: false }>;
      world: Readonly<{ schema: 'UiDocument/1'; worldId: string; revision: number; committed: boolean; ackLost: boolean; replayVerified: boolean }>;
      host: Readonly<{ state: string; reasonCode: string; receiptState: string | null; receiptReasonCode: string | null; effectInvoked: false }>;
      experience: Readonly<{ state: string; helpVisible: boolean; cancel: boolean; resume: boolean; focusReturn: string; automaticRetryAllowed: false }>;
      effectInvoked: false; automaticRetryAllowed: false;
    }>;

export interface Integration3Input {
  /** Created by Lane F from a trusted owner-scoped KnowledgeClient and broker. */
  readonly feed: ScopedKnowledgeFeed;
  readonly query: KnowledgeQuery;
  readonly founder: FounderJourneyInput;
  readonly display: Readonly<{
    documentId: string; workspaceRef: string; revision: number;
    selectedStableId: string; action: UiActionReference;
  }>;
  /** Catalog and HQ bytes and reviews are trusted EXTERNAL fixtures, never user input. */
  readonly descriptor: DescriptorProofContext;
  readonly modalities: Readonly<{ text: unknown; touch: unknown; keyboard: unknown }>;
  readonly world: Readonly<{
    store: AtomicReplayStore; principal: VerifiedUiPrincipal;
    verifyPrincipal: (principal: VerifiedUiPrincipal) => boolean;
    /** Separate prevalidated legacy World snapshot; never a Lane A display doc. */
    document: unknown;
    draftId: string; commandId: string;
    /** UI persistence only. It does not authorize any Host/provider effect. */
    reviewedUiPublish: boolean;
    /** Test-only fault injection to check the real SQLite journal. */
    fault?: 'beforeCommit' | 'afterCommitAckLoss';
  }>;
  readonly host: Readonly<{
    options: HostFixtureOptions; context: TrustedFixtureHostContext;
    claim?: HostClaimSnapshot; observation?: HostReceiptObservation | null;
  }>;
}
const refuse = (phase: Phase, code: string): Integration3Result =>
  Object.freeze({ok: false, phase, code, effectInvoked: false, automaticRetryAllowed: false});
function sameCard(a: ScopedFeedCard, b: ScopedFeedCard): boolean {
  return a.stableId === b.stableId && a.availability === 'present' && b.availability === 'present' &&
    a.source.authority === b.source.authority && a.source.nativeVersion === b.source.nativeVersion &&
    a.source.digest === b.source.digest &&
    JSON.stringify(a.evidenceRefs) === JSON.stringify(b.evidenceRefs);
}
function aligned(input: Integration3Input): boolean {
  const k = input.founder.knowledgeBroker.readContext();
  const h = input.host.context, p = input.world.principal;
  return !!k && !k.revoked && !k.offline &&
    k.ownerRef === h.ownerRef && k.ownerRef === p.ownerRef &&
    k.deviceRef === h.deviceRef && k.deviceRef === p.deviceRef &&
    k.sessionRef === h.sessionRef && k.sessionRef === p.sessionRef &&
    k.personalWorldRef === h.worldRef && k.personalWorldRef === input.query.personalWorldRef &&
    input.founder.hostContext.ownerRef === h.ownerRef &&
    input.founder.hostContext.deviceRef === h.deviceRef &&
    input.founder.hostContext.sessionRef === h.sessionRef &&
    input.founder.hostContext.worldRef === h.worldRef &&
    input.query.surface === k.surface &&
    input.descriptor.deviceSurface === h.surface &&
    p.policyRevision === h.policyRevision && k.policyRevision === h.policyRevision &&
    k.sessionExpiresAt > h.nowMs && k.grantExpiresAt > h.nowMs &&
    h.nowMs < h.sessionExpiresAtMs &&
    k.allowedPurposes.includes(input.query.purpose);
}
function displayDocument(input: Integration3Input, card: ScopedFeedCard): UiDocument {
  const title = card.title.slice(0, 80);
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: input.display.documentId,
    scope: {ownerRef: input.host.context.ownerRef, workspaceRef: input.display.workspaceRef},
    revision: input.display.revision, rootId: 'root',
    nodes: [
      {id: 'root', type: 'stack', props: {direction: 'vertical'}, children: ['project', 'preview'],
        a11y: {role: 'main', name: 'Founder Workspace'}},
      {id: 'project', type: 'project-card', props: {title, description: card.summary.slice(0, 200)},
        children: [], bindingRefs: ['source'], a11y: {role: 'group', name: title}},
      {id: 'preview', type: 'button', props: {label: 'Preview action'},
        children: [], actionRefs: [input.display.action], a11y: {role: 'button', name: 'Preview action', focusOrder: 1}},
    ],
    bindings: [{id: 'source', version: 1, nodeId: 'project', field: 'title',
      knowledgeRef: card.stableId, provenanceRef: card.evidenceRefs[0]!,
      readScope: 'owner', availability: 'present'}],
    views: [{id: 'phone', version: 1, kind: '2d', viewport: 'phone'},
      {id: 'desktop', version: 1, kind: '2d', viewport: 'desktop'}],
  };
}
/** All A/B/D crosswalks compare CANONICAL IDs, not their independently generated aliases. */
function identitiesAgree(
  document: UiDocument,
  a: Extract<ReturnType<typeof projectWave3ActionSemantics>, {ok: true}>['value'],
  b: Extract<ReturnType<typeof mapCanonicalComponents>, {ok: true}>['value'],
  d: ReturnType<typeof renderWave3Semantics>,
): boolean {
  if (a.documentId !== b.documentId || a.revision !== b.revision ||
      a.documentId !== document.documentId || d.sourceSchema !== UI_DOCUMENT_SCHEMA ||
      a.documentDigest.length < 16 || b.authority !== 'inert-display-only') return false;
  for (const node of document.nodes) {
    const match = b.sourceRefs.filter(x => !x.synthesized && x.sourceId === node.id);
    if (match.length !== 1 || JSON.stringify(match[0]!.canonicalA11y) !== JSON.stringify(node.a11y)) return false;
  }
  for (const action of a.references.filter(x => x.kind === 'action')) {
    if (!b.actionRefs.some(x => x.sourceNodeId === action.nodeId && x.id === action.id &&
      x.version === action.version && x.executable === false)) return false;
    if (!d.actions.some(x => x.nodeId === action.nodeId && x.id === action.id &&
      x.version === action.version && x.inert)) return false;
  }
  for (const binding of a.references.filter(x => x.kind === 'binding')) {
    if (!b.bindingRefs.some(x => x.sourceNodeId === binding.nodeId && x.id === binding.id &&
      x.version === binding.version && x.availability === 'present')) return false;
    if (!d.provenance.some(x => x.nodeId === binding.nodeId && x.bindingId === binding.id &&
      x.bindingVersion === binding.version && x.provenanceRef === binding.provenanceRef &&
      x.authorized === false)) return false;
  }
  return true;
}

/**
 * A fixture-grade integration proof; positive return is NEVER live Host/KB GO.
 * It uses A-H implementations directly, with ONLY external transport/authority
 * inputs supplied synthetically by the caller. No A-H modules are mocked.
 */
export async function composeIntegration3(input: Integration3Input): Promise<Integration3Result> {
  if (!aligned(input)) return refuse('SCOPE','PRINCIPAL_SCOPE_MISMATCH');
  if (![input.display.documentId, input.display.workspaceRef, input.display.selectedStableId,
    input.display.action.id].every(s => ID.test(s)) ||
    !Number.isSafeInteger(input.display.revision) || input.display.revision < 0 ||
    !Number.isSafeInteger(input.display.action.version) || input.display.action.version < 1)
    return refuse('A','INVALID_DISPLAY_IDENTITY');
  const first = await input.feed.poll(input.query);
  if (first.state !== 'ready' && first.state !== 'partial') return refuse('F','KNOWLEDGE_' + first.state.toUpperCase());
  if (first.cards.length !== 1 || first.cards[0]?.stableId !== input.display.selectedStableId ||
      first.cards[0].availability !== 'present' || !first.cards[0].evidenceRefs.length ||
      !first.cards[0].provenance.length) return refuse('F','PRESENT_SCOPED_CARD_REQUIRED');
  const card = first.cards[0];
  const document = displayDocument(input, card);
  const pins: Wave3BindingPin[] = [{id: 'source', version: 1, nodeId: 'project',
    knowledgeRef: card.stableId, provenanceRef: card.evidenceRefs[0]!}];
  const knownActions = [input.display.action];
  const a = projectWave3ActionSemantics(document, {
    expectedRevision: input.display.revision, knownBindings: pins, knownActions,
  });
  if (!a.ok) return refuse('A',a.code);
  const b = mapCanonicalComponents(a.value.canonical, {knownActions});
  if (!b.ok) return refuse('B',b.code);
  const viewports = [] as {viewportPx: 320 | 360 | 1280; status: string; rootTag: string; focusCount: number}[];
  for (const viewportPx of [320,360,1280] as const) {
    const d = renderWave3Semantics(a.value.canonical, {viewportPx, knownActions});
    if (d.status === 'unavailable' || !identitiesAgree(document,a.value,b.value,d))
      return refuse('D',d.refusalCode ?? 'CANONICAL_IDENTITY_MISMATCH');
    if (!b.value.viewports.some(p => p.viewportPx === viewportPx)) return refuse('B','VIEWPORT_MISSING');
    viewports.push({viewportPx, status:d.status, rootTag:d.plan.root.tag, focusCount:d.plan.focusOrder.length});
  }
  const results = (['text','touch','keyboard'] as const).map(modality =>
    compileDescriptorProof(input.modalities[modality],input.descriptor));
  if (results.some(x => x.outcome !== 'candidate')) {
    const bad = results.find(x => x.outcome !== 'candidate')!;
    return refuse('G',bad.reasonCode);
  }
  const [rText,rTouch,rKeyboard] = results;
  if (!rText || !rTouch || !rKeyboard || rText.outcome !== 'candidate' ||
      rTouch.outcome !== 'candidate' || rKeyboard.outcome !== 'candidate')
    return refuse('G','INCOMPLETE_MODALITY_PROOF');
  const text=rText, touch=rTouch, keyboard=rKeyboard;
  const semantic = (v: typeof text) => JSON.stringify({
    semanticRef:v.command.semanticRef,target:v.command.target,args:v.command.args,
    risk:v.command.risk,sourceVersions:v.command.sourceVersions,capability:v.command.capability,
  });
  if (semantic(text) !== semantic(touch) || semantic(text) !== semantic(keyboard))
    return refuse('G','MODALITY_SEMANTICS_DIVERGED');
  if (text.command.target.actionId !== input.display.action.id ||
      text.evidence.deviceSurface !== input.host.context.surface)
    return refuse('G','ACTION_IDENTITY_OR_SURFACE_MISMATCH');

  // Preflight E before ANY UI write; it provides help/recovery, never authority.
  const experience = await projectFounderWorkspaceJourney(input.founder);
  const selected = experience.projects.find(p => p.stableId === card.stableId);
  if (!selected || !['ready','partial'].includes(experience.state) ||
      selected.availability !== 'present' ||
      selected.source.nativeVersion !== card.source.nativeVersion ||
      selected.source.digest !== card.source.digest ||
      !selected.source.evidenceRefs.includes(card.evidenceRefs[0]!) ||
      experience.navigation.deliberateInteractionsToHelp !== 1)
    return refuse('E','EXPERIENCE_SOURCE_OR_HELP_UNAVAILABLE');
  // F re-reads the upstream authorization and source immediately before C.
  if (!aligned(input)) return refuse('SCOPE','PRINCIPAL_REVOKED_OR_CHANGED');
  const fresh = await input.feed.poll(input.query);
  if ((fresh.state !== 'ready' && fresh.state !== 'partial') ||
      fresh.cards.length !== 1 || !sameCard(card,fresh.cards[0]!))
    return refuse('F','RESNAPSHOT_REQUIRED');

  // The only writer is the CALLER-OWNED, already-open UiStore behind Lane C.
  // No implicit A-document migration, schema cast or persistence of KB content.
  let worldDocument: ReturnType<typeof parseUiDocument>;
  try { worldDocument = parseUiDocument(input.world.document); }
  catch { return refuse('C','DISTINCT_WORLD_SCHEMA_REQUIRED'); }
  if (worldDocument.world.id !== input.query.personalWorldRef) return refuse('C','WRONG_WORLD');
  const p = input.world.principal;
  const replay = new UiAtomicReplay({store:input.world.store,ownerRef:input.host.context.ownerRef,
    verifyPrincipal:input.world.verifyPrincipal});
  const current = replay.readCurrent(p,worldDocument.world.id);
  if (!current.ok) return refuse('C',current.code);
  if (!current.value) return refuse('C','INITIAL_WORLD_REVISION_REQUIRED');
  let revision = current.value.revision;
  let committed = false, ackLost = false, replayVerified = false;
  if (input.world.reviewedUiPublish) {
    const draft = replay.createDraft(p,input.world.draftId,worldDocument.world.id,worldDocument);
    if (!draft.ok) return refuse('C',draft.code);
    const preview = replay.preview(p,input.world.draftId);
    if (!preview.ok || preview.value.documentDigest !== draft.value.documentDigest)
      return refuse('C',preview.ok ? 'PREVIEW_DIGEST_MISMATCH' : preview.code);
    const command: RevisionCommand = {commandId:input.world.commandId,documentId:worldDocument.world.id,
      expectedRevision:current.value.revision,draftId:draft.value.draftId,
      documentDigest:draft.value.documentDigest,
      sourceVersions:{policy:p.policyRevision,schema:'UiDocument/1'},
      target:{actionId:'ui.publish',catalogVersion:'1'}};
    if (input.world.fault) replay.injectOnce(input.world.fault);
    const published = replay.publish(p,command);
    if (!published.ok && published.code !== 'UNCERTAIN') return refuse('C',published.code);
    if (!published.ok) ackLost = true;
    const durable = replay.getCommandOutcome(p,'publish',command);
    if (!durable.ok) return refuse('C',durable.code);
    const ordered = replay.replayCommitted(p,worldDocument.world.id,[{operation:'publish',command}]);
    if (!ordered.ok || ordered.value.revision !== durable.value.revision)
      return refuse('C',ordered.ok ? 'DURABLE_REPLAY_MISMATCH' : ordered.code);
    revision = durable.value.revision; committed = true; replayVerified = true;
  }
  // H is read-only, even after a verified UI-only World CAS.
  const host = createWave3ReadGatewayFixture(input.host.options);
  const capability = host.readCapability(input.host.context,text.command.target.actionId);
  const receipt = input.host.claim
    ? host.readReceiptStatus(input.host.context,input.host.claim,input.host.observation ?? null) : null;
  const noDispatch = host.refuseUiEffect(text.command);
  if (noDispatch.canExecute || noDispatch.effectInvoked || noDispatch.automaticRetryAllowed ||
      capability.canExecute || capability.effectInvoked || capability.automaticRetryAllowed ||
      receipt?.canExecute || receipt?.effectInvoked || receipt?.automaticRetryAllowed)
    return refuse('H','EFFECT_BOUNDARY_BREACH');
  // Final E pass follows H: fresh, scope-checked help and recoverability.
  // Earlier E preflight prevents a refused source from reaching the UI CAS.
  const closingExperience = await projectFounderWorkspaceJourney(input.founder);
  const closingProject = closingExperience.projects.find(p => p.stableId === card.stableId);
  if (!closingProject || closingProject.availability !== 'present' ||
      closingProject.source.nativeVersion !== card.source.nativeVersion ||
      closingProject.source.digest !== card.source.digest ||
      !closingExperience.help.visible || !closingExperience.navigation.cancelAccepted ||
      !closingExperience.navigation.resumeAccepted || closingExperience.recovery.automaticRetryAllowed)
    return refuse('E','FINAL_SOURCE_OR_RECOVERY_CHANGED');
  return Object.freeze({
    ok:true,evidenceClass:'synthetic-real-modules-not-live-acceptance',
    trace:['F','A','B','D','G','C','H','E'] as const,
    documentId:document.documentId,documentRevision:document.revision,documentDigest:a.value.documentDigest,
    identity:{canonicalNodes:document.nodes.length,mappedNodes:b.value.components.length,
      actions:b.value.actionRefs.length,bindings:b.value.bindingRefs.length,exact:true as const},
    viewports,
    command:{actionId:text.command.target.actionId,risk:text.command.risk.level,
      modalities:['text','touch','keyboard'] as const,authorized:false as const},
    world:{schema:'UiDocument/1' as const,worldId:worldDocument.world.id,revision,committed,ackLost,replayVerified},
    host:{state:capability.state,reasonCode:capability.reasonCode,
      receiptState:receipt?.state ?? null,receiptReasonCode:receipt?.reasonCode ?? null,effectInvoked:false as const},
    experience:{state:closingExperience.state,helpVisible:closingExperience.help.visible,
      cancel:closingExperience.navigation.cancelAccepted,resume:closingExperience.navigation.resumeAccepted,
      focusReturn:closingExperience.navigation.focusReturn,automaticRetryAllowed:false as const},
    effectInvoked:false as const,automaticRetryAllowed:false as const,
  });
}
