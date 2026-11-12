/**
 * Integration 4: bounded cross-device composition over the REAL Wave 4 A-H modules.
 *
 * ONE Founder Workspace is projected onto the existing Windows desktop shell (A),
 * the existing Android/relay phone surface (B), the shared device input semantics
 * (C), the effect-free session reconciler (D), the onboarding/resume journey (E),
 * the device-scoped KB snapshot (F), the typed transport candidate (G) and the
 * Host status contract (H).
 *
 * Every module is imported from its own lane path. Nothing is re-implemented
 * here and no lane module is mocked. The only synthetic inputs are the EXTERNAL
 * transport/authority facts a real Host/Android owner would supply, and they are
 * supplied by the caller, never synthesised inside this module.
 *
 * This is NOT device acceptance. A positive result proves real module
 * composition and parity in code. It does not prove a physical Windows device,
 * a physical Android device, TalkBack, a signed-in provider browser, a live
 * Host, or a live KB.
 *
 * No writer, publisher, store, Host executor or provider API is created here.
 *
 * Every lane is measured INDEPENDENTLY and reported separately, so a real
 * cross-lane defect is reported as a measured BLOCKED gate with the exact
 * repair patch, never silently worked around.
 */
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from '../document/schema.ts';
import { projectWave3ActionSemantics, type Wave3BindingPin } from '../document/wave3-action-semantics.ts';
import { mapCanonicalComponents, type CanonicalComponentProjection } from '../components/wave3-canonical-map.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { compileDescriptorProof, type DescriptorProofContext, type DescriptorProofResult } from '../command/wave3-descriptor-proof.ts';
import { projectWave4DesktopAdapter, type DesktopAdapterRequest, type DesktopHostObservation } from '../device/wave4-desktop-adapter.ts';
import { projectWave4PhoneAdapter, type PhoneHostObservation, type PhonePairingObservation, type PhoneProjection, type PhoneShellContract } from '../device/wave4-phone-adapter.ts';
import { normalizeWave4DeviceInput, type DeviceInputContext, type TrustedControlBinding } from '../input/wave4-device-semantics.ts';
import { createWave4SessionReconciler, type SessionReconciler, type SessionView } from '../revisions/wave4-session-reconcile.ts';
import { projectWave4OnboardingResume, type Wave4OnboardingInput, type Wave4OnboardingView } from '../experience/wave4-onboarding-resume.ts';
import { createDeviceKnowledgeSnapshotAdapter, type DeviceKnowledgeSnapshot } from '../knowledge/wave4-device-snapshot-adapter.ts';
import { stageTypedCandidate, validateTypedEnvelope, type TransportAuthority, type TransportControls } from '../command/wave4-typed-transport-adapter.ts';
import { createWave4HostStatusContract, type HostStatusQuery, type Wave4HostReadPort, type Wave4HostStatus } from '../host/wave4-h-host-status-contract.ts';
import type { ScopedFeedResult, ScopedKnowledgeFeed } from '../knowledge/wave3-feed-projection.ts';
import type { KnowledgeQuery, TrustedKnowledgeBroker } from '../knowledge/client.ts';
import type { VerifiedUiPrincipal } from '../revisions/port.ts';

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
/** The eight real Wave 4 lanes, in the order this composition exercises them. */
export type Integration4Lane = 'F' | 'A' | 'B' | 'C' | 'G' | 'H' | 'D' | 'E';
export type Integration4Phase = Integration4Lane | 'SCOPE';
/** The two real device surfaces the composition must agree across. */
export type Integration4Surface = 'desktop' | 'phone';

/** A measured cross-lane defect that needs a lane-owned source change. */
export interface Integration4Defect {
  readonly lane: Integration4Lane;
  readonly code: string;
  readonly summary: string;
  /** Exact file:line and the exact patch required. NOT applied by this module. */
  readonly repair: string;
  readonly measured: Readonly<Record<string, string>>;
}

/** Per-lane measured outcome. */
export interface Integration4LaneReport {
  readonly lane: Integration4Lane;
  readonly status: 'composed' | 'blocked' | 'not-reached';
  /** Measured refusal code when blocked, otherwise null. */
  readonly code: string | null;
  /** Measured facts for this lane. Empty when the lane did not compose. */
  readonly evidence: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export type Integration4Result =
  | Readonly<{ ok: false; phase: Integration4Phase; code: string; effectInvoked: false; automaticRetryAllowed: false }>
  | Readonly<{
      ok: true;
      evidenceClass: 'synthetic-real-modules-not-live-acceptance';
      trace: readonly ['F','A','B','C','G','H','D','E'];
      lanes: readonly Integration4LaneReport[];
      /** Measured cross-lane defects. Non-empty means at least one gate is BLOCKED. */
      defects: readonly Integration4Defect[];
      document: Readonly<{ documentId: string; revision: number; documentDigest: string; workspaceRef: string }>;
      effectInvoked: false; automaticRetryAllowed: false;
    }>;

export interface Integration4Input {
  /** Canonical Lane A display document for the Founder Workspace. */
  readonly document: UiDocument;
  /** Exact version pins for the document's action and binding references. */
  readonly pins: Readonly<{ actions: readonly UiActionReference[]; bindings: readonly Wave3BindingPin[] }>;
  /** Real Wave 3 F scoped feed + the trusted broker that authorises it. */
  readonly knowledge: Readonly<{ feed: ScopedKnowledgeFeed; broker: TrustedKnowledgeBroker; query: KnowledgeQuery }>;
  /**
   * The trusted device clock. It MUST be the same clock the scoped feed was
   * built with, otherwise Lane F legitimately treats every row as expired.
   */
  readonly now?: () => number;
  /** Real Wave 3 G descriptor context per surface (the Host supplies both). */
  readonly descriptors: Readonly<Record<Integration4Surface, DescriptorProofContext>>;
  /** Existing Host desktop observation (owner/world/publisher state). */
  readonly desktop: Readonly<{ host: DesktopHostObservation; lastDisplayedRevision: number | null }>;
  /** Existing Android/relay observations: pairing epoch, cursor, Host policy. */
  readonly phone: Readonly<{ shell: PhoneShellContract; pairing: PhonePairingObservation; host: PhoneHostObservation }>;
  /** Trusted Host-side C read port + principal for D's reconciliation. */
  readonly session: Readonly<{
    principal: VerifiedUiPrincipal;
    readCurrent: (principal: VerifiedUiPrincipal, documentId: string) => { ok: true; value: unknown } | { ok: false; code: string; message: string };
    watermark: (principal: VerifiedUiPrincipal, documentId: string) => Readonly<{
      schema: 'vivim.visual-session-watermark/1'; ownerRef: string; deviceRef: string; sessionRef: string;
      policyRevision: string; documentId: string; sequence: number; revision: number; documentDigest: string;
    }>;
  }>;
  /** The ONLY authorized Host read port. H never fabricates authority. */
  readonly hostPort: Wave4HostReadPort;
  readonly hostQuery: HostStatusQuery;
  /** Existing-Host journey evidence for E (never invented inside this module). */
  readonly journey: Omit<Wave4OnboardingInput, 'founder' | 'hostRead' | 'principal' | 'nowMs' | 'viewportPx' | 'shell'> &
    Readonly<{ nowMs: number; viewportPx: number; shell: 'desktop' | 'android' }>;
  /** Real Wave 3 E founder projection and Wave 3 H read result for E. */
  readonly founder: Wave4OnboardingInput['founder'];
  readonly hostRead: Wave4OnboardingInput['hostRead'];
  /** Transport authority + controls per surface, supplied by the authenticated Host broker. */
  readonly transport: Readonly<Record<Integration4Surface, Readonly<{ authority: TransportAuthority; controls: TransportControls }>>>;
}

const refuse = (phase: Integration4Phase, code: string): Integration4Result =>
  Object.freeze({ ok: false, phase, code, effectInvoked: false, automaticRetryAllowed: false });

function identityKey(nodeId: string, id: string, version: number): string {
  return `${nodeId}|${id}|${version}`;
}

/** A and B must project the SAME canonical action and binding identity sets. */
function canonicalIdentities(document: UiDocument): { actions: string[]; bindings: string[] } {
  const actions: string[] = [];
  const bindings: string[] = [];
  for (const node of document.nodes) {
    for (const action of node.actionRefs ?? []) actions.push(identityKey(node.id, action.id, action.version));
    for (const bindingId of node.bindingRefs ?? []) {
      const binding = document.bindings.find(b => b.id === bindingId);
      if (binding) bindings.push(identityKey(binding.nodeId, binding.id, binding.version));
    }
  }
  return { actions: actions.sort(), bindings: bindings.sort() };
}

/** D and F must describe the SAME owner-scoped KB row set, never two snapshots. */
function sameKnowledgeRows(a: ScopedFeedResult | null, b: DeviceKnowledgeSnapshot): boolean {
  if (!a) return b.cards.length === 0;
  const left = a.cards.map(c => c.stableId).sort();
  const right = b.cards.map(c => c.stableId).sort();
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * A fixture-grade integration proof; a positive return is NEVER live device,
 * Host, KB or provider acceptance. Each lane is measured independently so a real
 * cross-lane defect is reported as a BLOCKED gate with its exact repair patch.
 */
export async function composeIntegration4(input: Integration4Input): Promise<Integration4Result> {
  if (!input || !input.document || input.document.schema !== UI_DOCUMENT_SCHEMA ||
      !Array.isArray(input.pins?.actions) || !Array.isArray(input.pins?.bindings) ||
      !input.knowledge?.feed || !input.knowledge?.broker || !input.knowledge?.query ||
      !input.descriptors?.desktop || !input.descriptors?.phone ||
      !input.desktop?.host || !input.phone?.shell ||
      !input.phone?.pairing || !input.phone?.host || !input.session?.principal ||
      !input.hostPort || !input.hostQuery || !input.journey || !input.founder || !input.hostRead ||
      !input.transport?.desktop || !input.transport?.phone)
    return refuse('SCOPE', 'INTEGRATION_INPUT_INCOMPLETE');

  const document = input.document;
  if (![document.documentId, document.scope.ownerRef, document.scope.workspaceRef].every(s => ID.test(s)) ||
      !Number.isSafeInteger(document.revision) || document.revision < 0)
    return refuse('A', 'INVALID_CANONICAL_IDENTITY');

  const lanes: Integration4LaneReport[] = [];
  const defects: Integration4Defect[] = [];
  const order: Integration4Lane[] = ['F', 'A', 'B', 'C', 'G', 'H', 'D', 'E'];
  // Each lane is measured INDEPENDENTLY, so one lane's refusal never hides
  // another lane's behaviour. Only a real data dependency (G consumes C's
  // candidate, D consumes F's feed) makes a lane 'not-reached'.
  const status = new Map<Integration4Lane, Integration4LaneReport['status']>();
  const report = (lane: Integration4Lane, state: Integration4LaneReport['status'],
    code: string | null, evidence: Integration4LaneReport['evidence'] = {}): void => {
    status.set(lane, state);
    lanes.push(Object.freeze({ lane, status: state, code, evidence }));
  };
  const block = (lane: Integration4Lane, code: string,
    evidence: Integration4LaneReport['evidence'] = {}): void => {
    report(lane, 'blocked', code, evidence);
  };
  // Hoisted so an early lane exit can still report the canonical digest.
  let documentDigest = '';

  // ---- F: real scoped KB snapshot, authorised only by the trusted broker. ----
  const snapshotAdapter = createDeviceKnowledgeSnapshotAdapter(
    input.knowledge.feed, input.knowledge.broker,
    { surface: input.knowledge.query.surface === 'android' ? 'android' : 'pc',
      now: input.now ?? Date.now });
  const snapshot: DeviceKnowledgeSnapshot = await snapshotAdapter.resnapshot(input.knowledge.query);
  if (snapshot.state === 'ready' || snapshot.state === 'partial') {
    report('F', 'composed', null, { state: snapshot.state, cards: snapshot.cards.length,
      stableIds: snapshot.cards.map(c => c.stableId), retainOffline: snapshot.retainOffline,
      replace: snapshot.replace });
  } else {
    block('F', snapshot.reason, { state: snapshot.state, cards: 0, stableIds: [], retainOffline: false,
      replace: snapshot.replace });
  }

  // ---- A: real desktop shell adapter over the SAME canonical document. ----
  const semantics = { expectedRevision: document.revision, knownActions: input.pins.actions,
    knownBindings: input.pins.bindings };
  const desktopRequest: DesktopAdapterRequest = {
    document, semantics, host: input.desktop.host,
    viewportPx: 1280, lastDisplayedRevision: input.desktop.lastDisplayedRevision,
  };
  const desktop = projectWave4DesktopAdapter(desktopRequest);
  const canonical = projectWave3ActionSemantics(document, semantics);
  if (!canonical.ok) {
    block('A', canonical.code);
    // Without a canonical projection there is nothing the other lanes may read.
    for (const lane of ['B', 'C', 'G', 'H', 'D', 'E'] as Integration4Lane[]) report(lane, 'not-reached', null);
    return finish();
  }
  documentDigest = canonical.value.documentDigest;
  const identities = canonicalIdentities(document);
  if (!desktop.ok) {
    block('A', desktop.code);
  } else {
    report('A', 'composed', null, { status: desktop.view.status, revision: desktop.view.identity.revision,
      documentDigest: desktop.view.identity.documentDigest, focusOrder: desktop.view.focus.order,
      actionIdentities: identities.actions.length, bindingIdentities: identities.bindings.length,
      effectsInvoked: desktop.view.effectsInvoked, publisher: desktop.view.native.existingPublisher });
  }

  // ---- B: real phone projection over the SAME canonical document + real render. ----
  const phoneViewport = input.phone.shell.viewportPx;
  const phoneRendered = renderWave3Semantics(canonical.value.canonical, {
    viewportPx: phoneViewport, knownActions: input.pins.actions,
  });
  const phone: PhoneProjection = projectWave4PhoneAdapter({
    canonical: document, rendered: phoneRendered,
    shell: input.phone.shell, pairing: input.phone.pairing, host: input.phone.host,
  });
  if (phone.status !== 'ready') {
    const rootDiverged = phoneRendered.plan.root.id !== document.rootId;
    if (rootDiverged) {
      // A MEASURED cross-lane defect: the real Wave 3 renderer wraps the canonical
      // root in a synthetic `render_root` node, so the phone adapter's root-identity
      // equality can never hold. Lane B source is owner-assigned: record, do not patch.
      defects.push(Object.freeze({
        lane: 'B' as const, code: 'CROSS_LANE_ROOT_IDENTITY_MISMATCH',
        summary: 'REGRESSION: the owner-authorized Wave 4 B root repair is applied, but the phone ' +
          'projection refuses a real render again. The real Wave 3 D renderer always emits a ' +
          'synthetic "render_root" wrapper whose child is the canonical root node, so the guard ' +
          'must accept a DECLARED canonical root present in the sanitized render tree.',
        repair: laneBRepairPatch(),
        measured: { canonicalRootId: document.rootId, renderPlanRootId: phoneRendered.plan.root.id,
          renderRootTag: phoneRendered.plan.root.tag, phoneRefusal: phone.refusalCode ?? 'UNKNOWN',
          rendererSource: 'src/visual-runtime/render/dom.ts:248' },
      }));
    }
    block('B', phone.refusalCode ?? 'PHONE_NOT_READY',
      { status: phone.status, refusalCode: phone.refusalCode ?? 'UNKNOWN',
        canonicalRootId: document.rootId, renderPlanRootId: phoneRendered.plan.root.id });
  } else {
    report('B', 'composed', null, { status: phone.status, focusOrder: phone.focusOrder,
      effectInvoked: phone.effectInvoked, canApproveOnPhone: phone.canApproveOnPhone,
      viewportPx: phone.viewportPx,
      // The root-identity measurement is recorded in BOTH states: it is the fact that
      // motivated the owner-authorized repair and must stay observable afterwards.
      canonicalRootId: document.rootId, renderPlanRootId: phoneRendered.plan.root.id,
      renderRootTag: phoneRendered.plan.root.tag });
  }

  // ---- C: real device input semantics, measured on BOTH real surfaces. ----
  const surfaces: Integration4Surface[] = ['desktop', 'phone'];
  const candidates = new Map<Integration4Surface, { commandId: string; semanticId: string; risk: string; actionId: string }>();
  let cBlocked: string | null = null;
  for (const surface of surfaces) {
    const componentMap: CanonicalComponentProjection | null = (() => {
      const mapped = mapCanonicalComponents(document, { knownActions: input.pins.actions });
      return mapped.ok ? mapped.value : null;
    })();
    if (!componentMap) {
      const mapped = mapCanonicalComponents(document, { knownActions: input.pins.actions });
      if (!mapped.ok) { cBlocked = mapped.code; break; }
    }
    const map = componentMap!;
    const controls: TrustedControlBinding[] = map.focusOrder.map(componentId => {
      const source = map.sourceRefs.find(r => r.id === componentId)!;
      const action = map.actionRefs.find(r => r.sourceNodeId === source.sourceId)!;
      const review = input.descriptors[surface].reviews.find(r => r.actionId === action.id);
      return {
        componentId, sourceNodeId: source.sourceId,
        action: { id: action.id, version: action.version },
        semanticId: review?.semanticId ?? `unbound.${action.id}@1`,
        args: {}, enabled: true, visible: true, focusable: true,
        touchTargetPx: 44, requiresConfirmation: false,
      };
    });
    const deviceContext: DeviceInputContext = {
      projection: canonical.value, components: map, descriptors: input.descriptors[surface],
      device: surface, controls, focusedComponentId: controls[0]?.componentId ?? null,
      seenCommandIds: [], pendingComponentIds: [], confirmation: null,
      compile: compileDescriptorProof,
    };
    const commandId = `i4_${surface}_1`;
    const normalized = normalizeWave4DeviceInput({
      schema: 'vivim.wave4-device-input/1', device: surface,
      viewportPx: surface === 'phone' ? phoneViewport : 1280,
      expectedRevision: document.revision, expectedVersions: input.descriptors[surface].currentVersions,
      kind: 'activate',
      method: surface === 'phone' ? 'touch' : 'keyboard',
      key: surface === 'phone' ? undefined : 'Enter',
      commandId, componentId: controls[0]?.componentId ?? 'none',
    }, deviceContext);
    if (normalized.outcome !== 'candidate') {
      cBlocked = normalized.outcome === 'refused' ? normalized.reasonCode : 'NOT_A_CANDIDATE';
      break;
    }
    candidates.set(surface, { commandId: normalized.commandId,
      semanticId: normalized.command.semanticRef.id, risk: normalized.command.risk.level,
      actionId: normalized.command.target.actionId });
  }
  if (cBlocked) {
    block('C', cBlocked);
    report('G', 'not-reached', null);
  } else {
    const desktopCandidate = candidates.get('desktop')!;
    const phoneCandidate = candidates.get('phone')!;
    report('C', 'composed', null, {
      desktopSemanticId: desktopCandidate.semanticId, phoneSemanticId: phoneCandidate.semanticId,
      desktopRisk: desktopCandidate.risk, phoneRisk: phoneCandidate.risk,
      desktopCommandId: desktopCandidate.commandId, phoneCommandId: phoneCandidate.commandId,
      surfacesAgree: desktopCandidate.semanticId === phoneCandidate.semanticId &&
        desktopCandidate.risk === phoneCandidate.risk &&
        desktopCandidate.actionId === phoneCandidate.actionId,
    });
  }

  // ---- G: real typed transport on BOTH surfaces. C's candidate must be exact. ----
  if (cBlocked) {
    // G consumes C's candidate: with no candidate there is nothing to stage.
  } else {
    let gBlocked: string | null = null;
    const gEvidence: Record<string, string | number | boolean | readonly string[]> = {};
    for (const surface of surfaces) {
      const candidate = candidates.get(surface)!;
      const proof: DescriptorProofResult = compileDescriptorProof(
        { commandId: candidate.commandId, source: { surface: 'touch', inputDigest: 'a'.repeat(64) },
          selection: { semanticId: candidate.semanticId, args: {} },
          expectedVersions: input.descriptors[surface].currentVersions },
        input.descriptors[surface]);
      if (proof.outcome !== 'candidate') { gBlocked = proof.reasonCode; break; }
      if (proof.command.semanticRef.id !== candidate.semanticId ||
          proof.command.target.actionId !== candidate.actionId ||
          proof.command.risk.level !== candidate.risk) { gBlocked = 'CANDIDATE_PARITY_BROKEN'; break; }
      // CROSS-LANE invariant (integrator-owned): Lane G trusts the authority
      // object it is handed and never compares it with the canonical document's
      // scope. Without this check a foreign owner/world authority would stage a
      // perfectly valid envelope for the wrong workspace.
      const authority = input.transport[surface].authority;
      if (authority.ownerId !== document.scope.ownerRef ||
          authority.worldId !== document.scope.workspaceRef) {
        gBlocked = 'AUTHORITY_SCOPE_MISMATCH'; break;
      }
      const staged = stageTypedCandidate(proof, authority, input.transport[surface].controls);
      if (staged.outcome !== 'candidate') { gBlocked = staged.reasonCode; break; }
      const envelope = staged.envelope;
      const revalidated = validateTypedEnvelope(envelope, input.transport[surface].authority);
      if (revalidated.outcome !== 'candidate') { gBlocked = revalidated.reasonCode; break; }
      if (revalidated.envelope.envelopeDigest !== envelope.envelopeDigest ||
          revalidated.envelope.semanticDigest !== envelope.semanticDigest) {
        gBlocked = 'ENVELOPE_DIGEST_NOT_STABLE'; break;
      }
      gEvidence[`${surface}SemanticId`] = envelope.command.semanticRef.id;
      gEvidence[`${surface}ActionId`] = envelope.command.target.actionId;
      gEvidence[`${surface}Risk`] = envelope.command.risk.level;
      gEvidence[`${surface}EnvelopeDigest`] = envelope.envelopeDigest;
      gEvidence[`${surface}ExecutionAuthority`] = envelope.executionAuthority;
      gEvidence[`${surface}Approval`] = envelope.approval;
      gEvidence[`${surface}EffectPerformed`] = staged.effectPerformed;
    }
    if (gBlocked) block('G', gBlocked);
    else report('G', 'composed', null, gEvidence);
  }

  // ---- H: real Host status contract. Only the Host can attest authority. ----
  const host: Wave4HostStatus = createWave4HostStatusContract(input.hostPort).readStatus(input.hostQuery);
  if (host.effectInvoked !== false || host.canExecute !== false) {
    block('H', 'HOST_STATUS_CLAIMED_EFFECT');
  } else if (host.state === 'denied') {
    block('H', host.reasonCode, { state: host.state, reasonCode: host.reasonCode,
      receiptState: host.receiptState, receiptVerification: host.receiptVerification,
      effectInvoked: host.effectInvoked, canExecute: host.canExecute,
      evidenceClass: host.source.evidenceClass, liveHostAcceptance: host.source.liveHostAcceptance });
  } else {
    report('H', 'composed', null, { state: host.state, reasonCode: host.reasonCode,
      receiptState: host.receiptState, receiptVerification: host.receiptVerification,
      effectInvoked: host.effectInvoked, canExecute: host.canExecute,
      evidenceClass: host.source.evidenceClass, liveHostAcceptance: host.source.liveHostAcceptance });
  }

  // ---- D: real effect-free reconciler over the session read port + F's feed. ----
  if (status.get('F') === 'blocked') {
    report('D', 'not-reached', null);
  } else {
    const reconciler: SessionReconciler = createWave4SessionReconciler({
      documentId: document.documentId,
      revisionPort: {
        readCurrent: (p, id) => input.session.readCurrent(p, id) as never,
        getCommandOutcome: () => ({ ok: false, code: 'NOT_FOUND', message: 'NOT_FOUND' }) as never,
      },
      readPrincipal: () => input.session.principal,
      readWatermark: input.session.watermark as never,
      knowledgeFeed: {
        resnapshot: async () => input.knowledge.feed.resnapshot(input.knowledge.query),
        clear: () => input.knowledge.feed.clear(),
        notice: () => {},
      },
      knowledgeRequest: () => input.knowledge.query,
    });
    const session: SessionView = await reconciler.reconnect();
    if (session.state !== 'ready') {
      block('D', session.reason);
    } else if (!sameKnowledgeRows(session.knowledge, snapshot)) {
      block('D', 'KNOWLEDGE_ROW_PARITY_BROKEN');
    } else {
      const telemetry = reconciler.telemetry();
      report('D', 'composed', null, { state: session.state, reason: session.reason,
        revision: session.revision?.revision ?? 0, completedSnapshots: telemetry.completedSnapshots,
        attemptedReads: telemetry.attemptedReads, effects: 0 });
    }
  }

  // ---- E: real onboarding/resume journey over the same principal. ----
  const journey: Wave4OnboardingView = projectWave4OnboardingResume({
    ...input.journey, founder: input.founder, hostRead: input.hostRead,
    principal: { ownerRef: document.scope.ownerRef, worldRef: document.scope.workspaceRef,
      deviceRef: input.session.principal.deviceRef, sessionRef: input.session.principal.sessionRef },
    nowMs: input.journey.nowMs, viewportPx: input.journey.viewportPx, shell: input.journey.shell,
  });
  // CROSS-LANE invariant (integrator-owned): Lane E knows nothing about the
  // canonical document's scope. The journey evidence must belong to the SAME
  // owner and world as the workspace being composed.
  const journeyHost = input.journey.host;
  const journeyPairing = input.journey.pairing;
  const scopeMismatch = (journeyHost?.principal?.worldRef !== document.scope.workspaceRef) ||
    (journeyHost?.principal?.ownerRef !== document.scope.ownerRef) ||
    (journeyPairing?.principal?.worldRef !== document.scope.workspaceRef);
  if (journey.effectInvoked !== false || journey.publisherCreated || journey.storeCreated ||
      journey.action.automaticRetryAllowed !== false) {
    block('E', 'JOURNEY_CLAIMED_EFFECT_OR_WRITER');
  } else if (scopeMismatch) {
    block('E', 'JOURNEY_SCOPE_MISMATCH', { stage: journey.stage,
      paired: journey.readiness.paired, permitted: journey.readiness.permitted,
      signedIn: journey.readiness.signedIn, helpVisible: journey.help.visible,
      layout: journey.layout, automaticRetryAllowed: journey.action.automaticRetryAllowed });
  } else if (journey.readiness.permitted !== 'yes' || journey.readiness.paired !== 'yes' ||
             journey.readiness.signedIn !== 'yes') {
    block('E', journey.readiness.permitted !== 'yes' ? 'PERMISSION_UNCONFIRMED' :
      journey.readiness.paired !== 'yes' ? 'PAIRING_REQUIRED' : 'PERMISSION_UNCONFIRMED',
      { stage: journey.stage, paired: journey.readiness.paired, permitted: journey.readiness.permitted,
        signedIn: journey.readiness.signedIn, helpVisible: journey.help.visible, layout: journey.layout,
        automaticRetryAllowed: journey.action.automaticRetryAllowed });
  } else {
    report('E', 'composed', null, { stage: journey.stage, paired: journey.readiness.paired,
      permitted: journey.readiness.permitted, signedIn: journey.readiness.signedIn,
      helpVisible: journey.help.visible, layout: journey.layout,
      automaticRetryAllowed: journey.action.automaticRetryAllowed });
  }

  return finish();

  function finish(): Integration4Result {
    // Any lane that was never measured is explicitly 'not-reached'.
    for (const lane of order) {
      if (!status.has(lane)) report(lane, 'not-reached', null);
    }
    return Object.freeze({
      ok: true,
      evidenceClass: 'synthetic-real-modules-not-live-acceptance' as const,
      trace: ['F', 'A', 'B', 'C', 'G', 'H', 'D', 'E'] as const,
      lanes, defects,
      document: { documentId: document.documentId, revision: document.revision,
        documentDigest, workspaceRef: document.scope.workspaceRef },
      effectInvoked: false as const, automaticRetryAllowed: false as const,
    });
  }
}

/**
 * The exact owner-authorized repair applied to Wave 4 B lane source
 * (FINAL-WAVE/LANE-F/WAVE4B-REPAIR-PROPOSAL.patch). The master integration applied
 * it under the owner authorization in FINAL-WAVE/EXECUTE-NOW.md; this text is the
 * canonical record and the regression reference if the guard is ever reverted.
 */
export function laneBRepairPatch(): string {
  return 'src/visual-runtime/device/wave4-phone-adapter.ts:227\n' +
    '-  if (!root || root.id !== d.rootId || r.plan.focusOrder.some(x => !ids.has(x))) return refuse(\'UNSAFE_RENDER\', w);\n' +
    '+  if (!root || !ids.has(d.rootId) || !d.nodes.some(n => n.id === d.rootId) || r.plan.focusOrder.some(x => !ids.has(x))) return refuse(\'UNSAFE_RENDER\', w);';
}
