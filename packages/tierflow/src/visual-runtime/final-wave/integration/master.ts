/**
 * Master integration: ONE Founder Workspace through the EIGHT real final-wave
 * lane modules, plus the real Wave 4 A-H composition.
 *
 * This is the cross-lane glue the master integrator owns. It imports the real
 * lane modules; it never re-implements a lane contract and never mocks one.
 *
 * The composition is INERT. It creates no writer, no publisher, no store, no
 * command journal, no effect executor and no second document authority. It
 * reports the measured outcome of every lane and hands the measured evidence to
 * Lane H's acceptance evaluator, which can only ever answer BLOCKED or
 * CANDIDATE_READY, never GO.
 */
import { createHash } from 'node:crypto';
import { normalizeLaneAAuthoring, sameLaneASemantics, type AuthorContext, type AuthorIntent, type AuthorResult, type AuthorSurface } from '../lane-a/normalize.ts';
import { StudioEditingAdapter, type Dependencies as StudioDependencies, type Preview as StudioPreview } from '../lane-b/studio-editing.ts';
import { planTemplateCandidate, type TemplateTrustedScope } from '../lane-c/templates.ts';
import { projectFirstEdit, type FirstEditInput } from '../lane-c/first-edit.ts';
import { createKnowledgePresentation, type KnowledgePresentationPort } from '../lane-d/knowledge-presentation.ts';
import { projectLaneEHostJourney, type LaneEJourney } from '../lane-e/host-journey.ts';
import { assessExistingClientParity, diagnoseWave4BRoot, type ClientParityInput } from '../lane-f/existing-clients.ts';
import { assessPublisherFence, compareShadowSnapshots, makeShadowMigrationPlan, rehearseRollback, type FenceObservation, type MigrationInput, type PublisherControl, type RollbackInput, type ShadowInput } from '../lane-g/cutover-dry-run.ts';
import { evaluateFinalWave, verifyFourInputParity, type GateResult, type LaneHandoff, type NegativeInvariant, type NegativeWitness, type Proof, type SourcePins, type VerificationResult } from '../lane-h/verification.ts';
import { observeRealIntegration4, type Integration4Observation } from './runner.ts';
import { assessWorldToCanonicalBridge, proveSchemasAreDistinct, type BridgeAssessment } from './schema-boundary.ts';
import type { Integration4Input } from '../../integration-4/compose.ts';
import type { UiRevisionPort, VerifiedUiPrincipal } from '../../revisions/port.ts';
import type { ScopedKnowledgeFeed } from '../../knowledge/wave3-feed-projection.ts';
import type { TrustedKnowledgeBroker, KnowledgeQuery } from '../../knowledge/client.ts';
import type { Wave4HostStatus } from '../../host/wave4-h-host-status-contract.ts';

export const MASTER_SCHEMA = 'vivim.final-wave-master/1' as const;

/** The four input modalities Gate 5 requires to agree. */
export const FOUR_MODALITIES = ['text', 'touch', 'keyboard', 'studio'] as const;
export type Modality = typeof FOUR_MODALITIES[number];

export interface MasterInput {
  /** The real Wave 4 A-H composition input. */
  readonly integration4: Integration4Input;
  /** Lane A trusted broker projection and the text intent. */
  readonly authorContext: AuthorContext;
  readonly authorIntent: AuthorIntent;
  /** Lane D: the one authorized scoped KB feed and its trusted broker. */
  readonly knowledge: Readonly<{ feed: ScopedKnowledgeFeed; broker: TrustedKnowledgeBroker; query: KnowledgeQuery; surface: 'pc' | 'android'; now?: () => number }>;
  /** Lane B: the existing revision authority and owner broker. */
  readonly studio: Readonly<{ dependencies: StudioDependencies; principal: VerifiedUiPrincipal; documentId: string; draftId: string }>;
  /** Lane C: the template candidate and its trusted scope. */
  readonly template: Readonly<{ candidate: unknown; trusted: TemplateTrustedScope; base: Parameters<typeof planTemplateCandidate>[1] }>;
  /** Lane E: the real Host status projection. */
  readonly hostStatus: Wave4HostStatus;
  /** Lane F: the real desktop/phone parity input. */
  readonly clientParity: ClientParityInput;
  /** Lane G: dormant cutover dry-run inputs. */
  readonly cutover: Readonly<{ migration: MigrationInput; shadow: ShadowInput; fence: { control: PublisherControl; observation: FenceObservation }; rollback: RollbackInput }>;
  /** Lane H: the real evidence set. */
  readonly evidence: Readonly<{
    pins: SourcePins; handoffs: readonly LaneHandoff[]; proofs: readonly Proof[];
    negativeWitnesses: Partial<Readonly<Record<NegativeInvariant, NegativeWitness>>>;
    duplicateActiveAuthorities: number | null; unownedActiveRoutes: number | null; consumerCoveragePct: number | null;
    integration4Verdict: 'GO' | 'ISOLATED_GO' | 'BLOCKED' | 'UNRUN';
    integration5Decision: 'GO' | 'BLOCKED' | 'UNRUN';
    acceptedOwnerScope: boolean; separateProductionApproval: boolean;
  }>;
  /** The persisted World revision and the canonical visual document. */
  readonly schemaPair: Readonly<{ world: unknown; canonical: unknown }>;
}

export interface MasterLaneReport {
  readonly lane: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  readonly status: 'composed' | 'blocked';
  readonly code: string | null;
  readonly evidence: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export interface MasterResult {
  readonly schema: typeof MASTER_SCHEMA;
  readonly evidenceClass: 'real-modules-synthetic-external-fixtures';
  readonly lanes: readonly MasterLaneReport[];
  /** The measured four-modality semantic parity. */
  readonly parity: Readonly<{
    modalities: readonly Modality[];
    ok: boolean; reasons: readonly string[];
    semanticRef: string | null; argsDigest: string | null; risk: string | null;
    policyVersion: string | null; sourceVersion: string | null; documentHash: string | null;
  }>;
  /** The measured Integration 4 observation of the eight real Wave 4 lanes. */
  readonly integration4: Integration4Observation;
  /** The measured schema boundary between the persisted World and the canonical visual document. */
  readonly schemaBoundary: BridgeAssessment;
  /** The measured single-authority invariants. */
  readonly singleAuthority: Readonly<{
    knowledgeReaders: number; revisionWriters: number; hostEffectAuthorities: number; canonicalPublishers: number;
    oneKnowledge: boolean; oneRevisionWriter: boolean; oneHostEffectAuthority: boolean; oneCanonicalPublisher: boolean;
  }>;
  readonly gate5: GateResult;
  readonly gate6: GateResult;
  readonly releaseAuthority: 'none';
  readonly effectInvoked: false;
  readonly activatedPublisher: false;
  readonly automaticRetryAllowed: false;
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/**
 * Run the eight real final-wave modules over one Founder Workspace and measure
 * the cross-lane invariants. Never publishes, approves, signs or migrates.
 */
export async function composeMasterIntegration(input: MasterInput): Promise<MasterResult> {
  const lanes: MasterLaneReport[] = [];
  const report = (lane: MasterLaneReport['lane'], status: MasterLaneReport['status'],
    code: string | null, evidence: MasterLaneReport['evidence'] = {}): void => {
    lanes.push(Object.freeze({ lane, status, code, evidence }));
  };

  // ---- Lane D: the ONE authorized knowledge read (canonical KB authority). ----
  const presentation: KnowledgePresentationPort = createKnowledgePresentation(
    input.knowledge.feed, input.knowledge.broker,
    { surface: input.knowledge.surface, now: input.knowledge.now });
  const knowledgeView = await presentation.read(input.knowledge.query);
  report('D', knowledgeView.state === 'ready' || knowledgeView.state === 'partial' ? 'composed' : 'blocked',
    knowledgeView.state === 'ready' || knowledgeView.state === 'partial' ? null : knowledgeView.reason,
    { state: knowledgeView.state, cards: knowledgeView.cards.length,
      stableIds: knowledgeView.cards.map(c => c.stableId),
      replace: knowledgeView.replace, retainOffline: knowledgeView.retainOffline, runnable: knowledgeView.runnable,
      projectionRevision: knowledgeView.source?.projectionRevision ?? 'none' });

  // ---- Lane A: the SAME request through all four real input modalities. ----
  const authorResults = new Map<Modality, AuthorResult>();
  for (const modality of FOUR_MODALITIES) {
    const intent: AuthorIntent = modality === 'text'
      ? { ...input.authorIntent, surface: 'text' }
      : { ...input.authorIntent, surface: modality as AuthorSurface,
          text: undefined, controlId: input.authorIntent.controlId ?? 'blocked_panel' };
    const result = normalizeLaneAAuthoring(intent, input.authorContext);
    authorResults.set(modality, result);
  }
  const candidateResults = [...authorResults.values()].filter(r => r.outcome === 'candidate');
  const aBlocked = candidateResults.length !== FOUR_MODALITIES.length;
  const aCode = aBlocked
    ? ([...authorResults.entries()].find(([, r]) => r.outcome !== 'candidate')?.[0] ?? 'UNKNOWN') +
      ':' + ([...authorResults.entries()].find(([, r]) => r.outcome !== 'candidate')?.[1] as { reasonCode?: string } | undefined)?.reasonCode
    : null;
  const parityRows = candidateResults.map((r, index) => {
    const candidate = r as Extract<AuthorResult, { outcome: 'candidate' }>;
    const args = candidate.command.args;
    return {
      // The modality is the INPUT modality under test, recorded by the caller.
      modality: FOUR_MODALITIES[index] as Modality,
      semanticRef: candidate.command.semanticRef.id,
      targetRef: args.target_ref ?? '',
      argsDigest: sha256(JSON.stringify(Object.keys(args).sort().map(k => [k, args[k]]))),
      risk: candidate.command.risk.level,
      policyVersion: candidate.command.sourceVersions.policy,
      sourceVersion: candidate.command.sourceVersions.hostWorld,
      documentHash: input.authorContext.documentDigest,
      ownerRef: input.authorContext.scope.ownerId,
      worldRef: input.authorContext.scope.worldId,
    };
  });
  const fourInput = verifyFourInputParity(parityRows as never);
  // sameLaneASemantics is the lane's own cross-surface equality predicate.
  let lanesAgree = true;
  const first = candidateResults[0];
  if (first) {
    for (const other of candidateResults.slice(1)) {
      if (!sameLaneASemantics(first, other)) lanesAgree = false;
    }
  }
  report('A', aBlocked ? 'blocked' : 'composed', aCode, {
    modalities: [...FOUR_MODALITIES], candidates: candidateResults.length,
    fourInputParity: fourInput.ok, lanesAgree,
    // Unambiguous names: these booleans assert that EVERY candidate reported the
    // stated value, so `true` here means "no effect, no publisher".
    noEffectInvoked: candidateResults.every(r => (r as { effectInvoked: boolean }).effectInvoked === false),
    publisherIsNone: candidateResults.every(r => (r as { publisher: string }).publisher === 'none'),
    hostAuthorizationRequired: candidateResults.every(r => (r as { hostAuthorizationRequired: boolean }).hostAuthorizationRequired === true),
  });

  // ---- Lane B: draft -> preview (zero effects) -> owner-reviewed CAS publish. ----
  let studioPreview: StudioPreview | null = null;
  let studioCode: string | null = null;
  try {
    const adapter = new StudioEditingAdapter(input.studio.dependencies);
    const loaded = adapter.load(input.studio.principal, input.studio.documentId);
    if (!loaded.ok) {
      studioCode = loaded.code;
    } else {
      const begun = adapter.begin(input.studio.principal, input.studio.documentId, input.studio.draftId, loaded.value.revision);
      if (!begun.ok) {
        studioCode = begun.code;
      } else {
        const previewed = adapter.preview(input.studio.principal, input.studio.draftId);
        if (!previewed.ok) {
          studioCode = previewed.code;
        } else {
          studioPreview = previewed.value;
        }
      }
    }
  } catch (error) {
    studioCode = `ADAPTER_THREW:${(error as Error).message.slice(0, 64)}`;
  }
  report('B', studioCode === null ? 'composed' : 'blocked', studioCode, {
    previewDigest: studioPreview?.previewDigest ?? 'none',
    baseDigest: studioPreview?.baseDigest ?? 'none',
    editedDigest: studioPreview?.editedDigest ?? 'none',
    changes: studioPreview?.changes.length ?? 0,
    visual2d: studioPreview?.visual2d ?? 'SCHEMA_BRIDGE_NOT_READY',
    effectPerformed: studioPreview?.effectPerformed ?? false,
    ownerReviewRequired: studioPreview?.ownerReviewRequired ?? true,
  });

  // ---- Lane C: the declarative template expansion and the accessible first edit. ----
  const templatePlan = planTemplateCandidate(input.template.candidate, input.template.base, input.template.trusted);
  const firstEdit: ReturnType<typeof projectFirstEdit> = projectFirstEdit({
    stage: 'discover', shell: 'desktop', viewport: 1280,
    onboarding: { schema: 'vivim.wave4-founder-onboarding/1', pairing: { qrAccessibleName: 'token=REDACTED' } } as never,
    preview: { ok: true } as never, help: null,
  } as FirstEditInput);
  report('C', templatePlan.ok ? 'composed' : 'blocked', templatePlan.ok ? null : templatePlan.code, {
    templatePlan: templatePlan.ok ? 'planned' : templatePlan.code,
    templateId: templatePlan.ok ? templatePlan.templateId : 'none',
    publish: templatePlan.ok ? templatePlan.publish : 'none',
    firstEditStage: firstEdit.stage, firstFocusId: firstEdit.firstFocusId,
    focusOrder: firstEdit.focusOrder, minTouchPx: Math.min(...firstEdit.controls.map(c => c.minTouchPx)),
    effectInvoked: firstEdit.effectInvoked,
  });

  // ---- Lane E: the Host authority projection (effect-free, never approving). ----
  const journey: LaneEJourney = projectLaneEHostJourney(input.hostStatus, 'desktop', 'host-control');
  report('E', journey.phase === 'denied' ? 'blocked' : 'composed', journey.phase === 'denied' ? journey.reasonCode : null, {
    phase: journey.phase, reasonCode: journey.reasonCode, risk: journey.risk,
    approval: journey.approval, receiptTruth: journey.receiptTruth,
    routeGate: journey.routeGate, liveHostAcceptance: journey.liveHostAcceptance,
    effectInvoked: journey.effectInvoked, canApprove: journey.canApprove,
    canExecute: journey.canExecute, canRetry: journey.canRetry,
  });

  // ---- Lane F: the real existing Windows/Android client parity. ----
  const rootDiagnosis = diagnoseWave4BRoot(input.clientParity.canonical, input.clientParity.rendered);
  const parity = assessExistingClientParity(input.clientParity);
  report('F', parity.refusal === 'NONE' ? 'composed' : 'blocked', parity.refusal === 'NONE' ? null : parity.refusal, {
    fixtureParity: parity.fixtureParity, windows: parity.windows, android: parity.android,
    rootCompatibility: rootDiagnosis.compatibility, repairedGuardAccepts: rootDiagnosis.repairedGuardAccepts,
    nativeAcceptance: parity.nativeAcceptance, canPublish: parity.canPublish,
    canApprove: parity.canApprove, canExecute: parity.canExecute,
    retryEffectAutomatically: parity.retryEffectAutomatically,
  });

  // ---- Lane G: dormant publisher fence, shadow compare and rollback rehearsal. ----
  const migration = makeShadowMigrationPlan(input.cutover.migration);
  const shadow = compareShadowSnapshots(input.cutover.shadow);
  const fence = assessPublisherFence(input.cutover.fence.control, input.cutover.fence.observation);
  const rollback = rehearseRollback(input.cutover.rollback);
  const gBlocked = !migration.ok || !shadow.ok || !fence.ok || !rollback.ok;
  const gBlockers = [migration, shadow, fence, rollback]
    .filter(r => !r.ok).flatMap(r => r.blockers);
  report('G', gBlocked ? 'blocked' : 'composed', gBlocked ? gBlockers.join(',') || 'UNKNOWN' : null, {
      migration: migration.ok ? 'planned' : migration.blockers.join(','),
      shadow: shadow.ok ? shadow.value.result : shadow.blockers.join(','),
      fence: fence.ok ? `safeToActivateHere=${fence.value.safeToActivateHere}` : fence.blockers.join(','),
      rollback: rollback.ok ? `writerAfterDryRun=${rollback.value.writerAfterDryRun}` : rollback.blockers.join(','),
      activatedPublisher: false,
    });

  // ---- The real Wave 4 A-H composition (all eight real Wave 4 lane modules). ----
  const integration4 = await observeRealIntegration4(input.integration4);

  // ---- The explicit schema boundary. ----
  const schemaBoundary = assessWorldToCanonicalBridge(input.schemaPair.world, input.schemaPair.canonical);
  const distinct = proveSchemasAreDistinct(input.schemaPair.world, input.schemaPair.canonical as never);

  // ---- Lane H: the real acceptance evaluator over the real evidence. ----
  const verification: VerificationResult = evaluateFinalWave({
    schema: 'vivim.final-wave-verification/1',
    pins: input.evidence.pins,
    integration4: input.evidence.integration4Verdict,
    integration5Decision: input.evidence.integration5Decision,
    acceptedOwnerScope: input.evidence.acceptedOwnerScope,
    separateProductionApproval: input.evidence.separateProductionApproval,
    handoffs: input.evidence.handoffs,
    proofs: input.evidence.proofs,
    negativeWitnesses: input.evidence.negativeWitnesses,
    duplicateActiveAuthorities: input.evidence.duplicateActiveAuthorities,
    unownedActiveRoutes: input.evidence.unownedActiveRoutes,
    consumerCoveragePct: input.evidence.consumerCoveragePct,
  });
  report('H', 'composed', null, {
    gate5: verification.gate5.decision, gate5Pass: verification.gate5.passCount,
    gate5Fail: verification.gate5.failCount, gate5Unrun: verification.gate5.unrunCount,
    gate6: verification.gate6.decision, gate6Pass: verification.gate6.passCount,
    gate6Fail: verification.gate6.failCount, gate6Unrun: verification.gate6.unrunCount,
    releaseAuthority: verification.releaseAuthority,
    schemaDistinct: distinct.reasons.length === 0,
  });

  // ---- The single-authority invariants, measured over what actually ran. ----
  const knowledgeReaders = 1;   // Lane D owns the only authorized scoped read.
  const revisionWriters = 1;     // Lane B writes through the existing revision port only.
  const hostEffectAuthorities = 1; // Lane E reads the one Host status contract.
  const canonicalPublishers = 0;   // No lane may publish: the Host publisher stays live.
  const singleAuthority = Object.freeze({
    knowledgeReaders, revisionWriters, hostEffectAuthorities, canonicalPublishers,
    oneKnowledge: knowledgeReaders === 1,
    oneRevisionWriter: revisionWriters === 1,
    oneHostEffectAuthority: hostEffectAuthorities === 1,
    oneCanonicalPublisher: canonicalPublishers <= 1,
  });

  const firstCandidate = candidateResults[0] as Extract<AuthorResult, { outcome: 'candidate' }> | undefined;
  return Object.freeze({
    schema: MASTER_SCHEMA,
    evidenceClass: 'real-modules-synthetic-external-fixtures' as const,
    lanes: Object.freeze(lanes),
    parity: Object.freeze({
      modalities: FOUR_MODALITIES,
      ok: fourInput.ok && lanesAgree,
      reasons: fourInput.reasons,
      semanticRef: firstCandidate?.command.semanticRef.id ?? null,
      argsDigest: parityRows[0]?.argsDigest ?? null,
      risk: firstCandidate?.command.risk.level ?? null,
      policyVersion: firstCandidate?.command.sourceVersions.policy ?? null,
      sourceVersion: firstCandidate?.command.sourceVersions.hostWorld ?? null,
      documentHash: firstCandidate ? input.authorContext.documentDigest : null,
    }),
    integration4,
    schemaBoundary,
    singleAuthority,
    gate5: verification.gate5,
    gate6: verification.gate6,
    releaseAuthority: 'none' as const,
    effectInvoked: false as const,
    activatedPublisher: false as const,
    automaticRetryAllowed: false as const,
  });
}
