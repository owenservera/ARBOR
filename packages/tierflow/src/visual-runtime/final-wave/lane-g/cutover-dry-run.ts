/**
 * Final Wave G: inert migration/shadow/fence/rollback REHEARSAL ONLY.
 * No Host control-row writer, no UI publisher, no storage, no provider calls.
 * Every returned success is an offline evidence result, never a commit permit.
 * Durable fencing must be implemented inside the existing Host serialization
 * barrier and held through the existing UiStore.runCommandAtomic commit.
 */
import { createHash } from 'node:crypto';
import type { UiDocument } from '../../document/schema.ts';
import type { VerifiedUiPrincipal, UiRevisionPort } from '../../revisions/port.ts';

export const LANE_G_CONTRACT = 'vivim.final-wave-g.dry-run/1' as const;
export const LANE_G_ACTIVATION = Object.freeze({ canPublish: false, canMigrateLiveData: false, canGrantPermit: false, canDispatchEffects: false });
type Hash = `sha256:${string}`;
export type Publisher = 'host-bootstrap-legacy' | 'tierflow-canonical' | 'none';
export type Phase = 'LEGACY_LIVE' | 'SHADOW' | 'COMPARED' | 'DRAINING' | 'QUIESCENT' |
  'CANONICAL_LIVE' | 'OBSERVING' | 'ACCEPTED' | 'ROLLBACK_DRAINING' | 'LEGACY_RECOVERED' | 'BLOCKED_READ_ONLY';
export type DryRunResult<T> = Readonly<
  | { ok: true; simulatedOnly: true; value: T }
  | { ok: false; simulatedOnly: true; blockers: readonly string[] }
>;
export type LegacyRevision = Readonly<{ revision: number; sourceId: string; digest: Hash; parentRevision: number | null;
  status: 'applied' | 'superseded' | 'reverted' }>;
export type LegacySnapshot = Readonly<{
  schema: 'vivim.legacy-ui-snapshot/1'; ownerRef: string; worldRef: string; documentId: string;
  namespace: 'founder-workspace'; sourceSchema: string; sourceVersion: string;
  sourceHash: Hash; sourceCursor: string; activeRevision: number; maxHistoricalRevision: number;
  history: readonly LegacyRevision[]; sourceReaderVersion: string;
}>;
export type RevisionAlias = Readonly<{ legacyRevision: number; targetRevision: number; legacyId: string }>;
export type MigrationInput = Readonly<{
  snapshot: LegacySnapshot; target: { schema: 'vivim.ui-document/1'; documentId: string; ownerRef: string;
    sourceVersion: string; expectedRevision: number; documentDigest: Hash };
  aliases: readonly RevisionAlias[]; readerCompatibility: { sourceReaderRetained: boolean; targetReaderVersion: string };
  pin: { tierflowSha: string; harnessSha: string; hqSha: string };
}>;
export type ShadowFrame = Readonly<{ viewport: 320 | 360 | 1280; ownerRef: string; worldRef: string;
  sourceVersion: string; sourceHash: Hash; activeRevision: number;
  semanticDigest: Hash; actionDigest: Hash; accessibilityDigest: Hash;
  privacyDigest: Hash; tombstoneDigest: Hash; visualDigest: Hash }>;
export type ShadowInput = Readonly<{ legacy: readonly ShadowFrame[]; canonical: readonly ShadowFrame[] }>;
export type FenceObservation = Readonly<{
  expectedEpoch: number; expectedControlRevision: number; ownerRef: string; worldRef: string;
  documentId: string; namespace: string; desiredWriter: Publisher;
  oldIngressClosed: boolean; oldInFlight: number; uncertainClaims: number;
  hostFenceDurable: boolean; heldThroughCommit: boolean; legacyRestartDenied: boolean;
  sourcePinsMatch: boolean; integration5GO: boolean; explicitOwnerApproval: boolean;
  deviceAcceptance: boolean; rollbackRehearsed: boolean;
}>;
export type PublisherControl = Readonly<{ ownerRef: string; worldRef: string; documentId: string;
  namespace: string; phase: Phase; writer: Publisher; epoch: number; controlRevision: number }>;
export type RollbackInput = Readonly<{ control: PublisherControl; expectedEpoch: number;
  expectedControlRevision: number; outstandingCanonicalClaims: number;
  uncertainOutcomes: number; legacyReaderRetained: boolean;
  newRevisions: readonly Readonly<{ revision: number; digest: Hash }>[];
  exportedRevisions: readonly Readonly<{ revision: number; digest: Hash }>[];
  inverseConversionLossless: boolean; previousSourceHash: Hash }>;

const digestOK = (v: unknown): v is Hash => typeof v === 'string' && /^sha256:[a-f0-9]{64}$/.test(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 200 && v.trim() === v;
const whole = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const gitSHA = (v: unknown): boolean => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const blocked = <T>(...blockers: string[]): DryRunResult<T> => ({ ok: false, simulatedOnly: true, blockers });
const ready = <T>(value: T): DryRunResult<T> => ({ ok: true, simulatedOnly: true, value });
const equality = (a: unknown, b: unknown): boolean => a === b;
const stableDigest = (value: unknown): Hash => `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;

/**
 * Does not convert a UI document. It requires an EXPLICIT, loss-reportable
 * source-history alias table, keeps undo ancestry, and leaves original bytes
 * untouched. The future owner broker must verify source/target document hashes
 * using the existing validators; this function cannot certify them.
 */
export function makeShadowMigrationPlan(input: MigrationInput): DryRunResult<Readonly<{
  schema: typeof LANE_G_CONTRACT; authority: 'none'; phase: 'SHADOW'; sourceHash: Hash;
  activeRevision: number; maxHistoricalRevision: number; history: readonly LegacyRevision[];
  aliases: readonly RevisionAlias[]; targetDigest: Hash; targetExpectedRevision: number;
  manifestDigest: Hash; sourceDataValidated: false; eligibleToCommit: false;
}>> {
  if (!input || typeof input !== 'object') return blocked('INVALID_INPUT');
  const s = input.snapshot, t = input.target, aliases = input.aliases;
  if (!s || s.schema !== 'vivim.legacy-ui-snapshot/1' || s.namespace !== 'founder-workspace' || !t || t.schema !== 'vivim.ui-document/1') return blocked('UNSUPPORTED_SCHEMA');
  if (![s.ownerRef,s.worldRef,s.documentId,s.sourceSchema,s.sourceVersion,s.sourceCursor,s.sourceReaderVersion,t.documentId,t.ownerRef,t.sourceVersion,input.readerCompatibility?.targetReaderVersion].every(nonempty)) return blocked('MISSING_SOURCE_IDENTITY');
  if (s.ownerRef !== t.ownerRef || s.documentId !== t.documentId || s.sourceVersion !== t.sourceVersion) return blocked('SCOPE_OR_VERSION_MISMATCH');
  if (!digestOK(s.sourceHash) || !digestOK(t.documentDigest) || !whole(s.activeRevision) || !whole(s.maxHistoricalRevision) || !whole(t.expectedRevision)) return blocked('INVALID_REVISION_OR_DIGEST');
  if (s.activeRevision > s.maxHistoricalRevision || s.maxHistoricalRevision < 1) return blocked('INVALID_HISTORY_HEAD');
  if (!input.readerCompatibility.sourceReaderRetained) return blocked('ROLLBACK_READER_MISSING');
  if (![input.pin?.tierflowSha,input.pin?.harnessSha,input.pin?.hqSha].every(gitSHA)) return blocked('UNPINNED_SOURCE');
  if (!Array.isArray(s.history) || s.history.length === 0 || s.history.length > 10000 || !Array.isArray(aliases) || aliases.length !== s.history.length) return blocked('INCOMPLETE_HISTORY');
  let last = 0;
  const seenIDs = new Set<string>();
  for (const row of s.history) {
    if (!whole(row.revision) || row.revision !== last + 1 || !nonempty(row.sourceId) || !digestOK(row.digest) || seenIDs.has(row.sourceId) || !['applied','superseded','reverted'].includes(row.status)) return blocked('INVALID_HISTORY_ROW');
    if (row.parentRevision !== null && (!whole(row.parentRevision) || row.parentRevision >= row.revision)) return blocked('BROKEN_HISTORY_ANCESTRY');
    seenIDs.add(row.sourceId); last = row.revision;
  }
  if (last !== s.maxHistoricalRevision || !s.history.some(row => row.revision === s.activeRevision)) return blocked('ACTIVE_AND_MAX_HISTORY_DIVERGE');
  const sourceRev = new Set(s.history.map(row => row.revision));
  for (const row of s.history) if (row.parentRevision !== null && !sourceRev.has(row.parentRevision)) return blocked('MISSING_UNDO_ANCESTOR');
  const seenSource = new Set<number>(), seenTarget = new Set<number>();
  let priorTarget = t.expectedRevision;
  for (const alias of aliases) {
    if (!whole(alias.legacyRevision) || !whole(alias.targetRevision) || alias.targetRevision <= priorTarget || !nonempty(alias.legacyId) || !sourceRev.has(alias.legacyRevision) ||
        seenSource.has(alias.legacyRevision) || seenTarget.has(alias.targetRevision) ||
        s.history.find(r => r.revision === alias.legacyRevision)?.sourceId !== alias.legacyId) return blocked('UNSAFE_OR_COLLIDING_ALIAS');
    seenSource.add(alias.legacyRevision); seenTarget.add(alias.targetRevision); priorTarget = alias.targetRevision;
  }
  const history = s.history.map(row => ({ ...row }));
  const mapped = aliases.map(row => ({ ...row }));
  const manifestDigest = stableDigest({ scope:[s.ownerRef,s.worldRef,s.documentId,s.namespace], sourceHash:s.sourceHash,
    activeRevision:s.activeRevision,maxHistoricalRevision:s.maxHistoricalRevision,history,aliases:mapped,
    target:t, readerCompatibility:input.readerCompatibility,pin:input.pin });
  return ready({ schema:LANE_G_CONTRACT, authority:'none',phase:'SHADOW',sourceHash:s.sourceHash,
    activeRevision:s.activeRevision,maxHistoricalRevision:s.maxHistoricalRevision,history,
    aliases:mapped,targetDigest:t.documentDigest,targetExpectedRevision:t.expectedRevision,manifestDigest,
    sourceDataValidated:false,eligibleToCommit:false });
}

/** Compare only ALREADY VERIFIED, owner-scoped render semantics across 320/360/1280.
 * Matching hashes prove consistency of supplied fixtures, NOT native/device proof. */
export function compareShadowSnapshots(input: ShadowInput): DryRunResult<Readonly<{
  compared: 3; result: 'EQUIVALENT_FIXTURE_ONLY'; frameDigests: readonly Hash[];
}>> {
  if (!input || !Array.isArray(input.legacy) || !Array.isArray(input.canonical)) return blocked('INVALID_SHADOW');
  const viewports = [320,360,1280] as const, out: Hash[] = [];
  const errors: string[] = [];
  for (const width of viewports) {
    const l = input.legacy.filter(v => v?.viewport === width);
    const c = input.canonical.filter(v => v?.viewport === width);
    if (l.length !== 1 || c.length !== 1) { errors.push(`MISSING_OR_DUPLICATE_VIEWPORT_${width}`); continue; }
    const a = l[0]!, b = c[0]!;
    const fields = ['ownerRef','worldRef','sourceVersion','sourceHash','activeRevision','semanticDigest',
      'actionDigest','accessibilityDigest','privacyDigest','tombstoneDigest','visualDigest'] as const;
    for (const field of fields) {
      if (!equality(a[field],b[field])) errors.push(`SHADOW_${width}_${field}_MISMATCH`);
      if (field.endsWith('Digest') || field === 'sourceHash') {
        if (!digestOK(a[field]) || !digestOK(b[field])) errors.push(`INVALID_${width}_${field}`);
      }
    }
    if (![a.ownerRef,a.worldRef,a.sourceVersion].every(nonempty) || !whole(a.activeRevision)) errors.push(`INVALID_SCOPE_${width}`);
    if (errors.length === 0) out.push(stableDigest([width,...fields.map(f=>a[f])]));
  }
  if (input.legacy.length !== 3 || input.canonical.length !== 3) errors.push('UNEXPECTED_SHADOW_FRAMES');
  if (input.legacy.length === 3) {
    const first = input.legacy.find(v => v.viewport === 320);
    for (const other of input.legacy) {
      if (!first || ['ownerRef','worldRef','sourceVersion','sourceHash','activeRevision'].some(k =>
        (first as unknown as Record<string, unknown>)[k] !== (other as unknown as Record<string, unknown>)[k])) { errors.push('INCONSISTENT_CROSS_VIEWPORT_SOURCE'); break; }
    }
  }
  if (errors.length) return blocked(...[...new Set(errors)]);
  return ready({compared:3,result:'EQUIVALENT_FIXTURE_ONLY',frameDigests:out});
}

/** Admission feasibility only. Never returns a permit or controls a writer.
 * A production gate MUST fence all old ingress and the new commit in one trusted,
 * durable Host-controlled serialization boundary, not a request-time checkbox. */
export function assessPublisherFence(control: PublisherControl, observation: FenceObservation): DryRunResult<Readonly<{
  recommendation: 'OWNER_BROKER_IMPLEMENTATION_REQUIRED'; safeToActivateHere: false;
  proposedPhase: 'QUIESCENT' }>> {
  if (!control || !observation) return blocked('MISSING_CONTROL');
  const errors: string[] = [];
  if (![control.ownerRef,control.worldRef,control.documentId,control.namespace].every(nonempty)) errors.push('INVALID_CONTROL_SCOPE');
  if (control.ownerRef!==observation.ownerRef || control.worldRef!==observation.worldRef || control.documentId!==observation.documentId || control.namespace!==observation.namespace) errors.push('FOREIGN_SCOPE');
  if (!whole(control.epoch) || !whole(control.controlRevision) || control.epoch!==observation.expectedEpoch || control.controlRevision!==observation.expectedControlRevision) errors.push('STALE_EPOCH_OR_CAS');
  if (control.phase!=='DRAINING' || control.writer!=='host-bootstrap-legacy' || observation.desiredWriter!=='tierflow-canonical') errors.push('INVALID_TRANSITION');
  if (!observation.oldIngressClosed || !observation.legacyRestartDenied) errors.push('LEGACY_WRITER_NOT_FENCED');
  if (!whole(observation.oldInFlight) || observation.oldInFlight !== 0 || !whole(observation.uncertainClaims) || observation.uncertainClaims !== 0) errors.push('UNRESOLVED_IN_FLIGHT');
  if (!observation.hostFenceDurable || !observation.heldThroughCommit) errors.push('ATOMIC_HOST_FENCE_UNPROVEN');
  if (!observation.sourcePinsMatch) errors.push('SOURCE_PIN_MISMATCH');
  if (!observation.integration5GO || !observation.explicitOwnerApproval) errors.push('RELEASE_APPROVAL_MISSING');
  if (!observation.deviceAcceptance || !observation.rollbackRehearsed) errors.push('RELEASE_EVIDENCE_MISSING');
  return errors.length ? blocked(...errors) : ready({recommendation:'OWNER_BROKER_IMPLEMENTATION_REQUIRED',safeToActivateHere:false,proposedPhase:'QUIESCENT'});
}

/** Retains ALL accepted canonical edits; does not reset active history or reacquire
 * legacy authority. Host must serialize a NEW epoch and verify inverse reader. */
export function rehearseRollback(input: RollbackInput): DryRunResult<Readonly<{
  proposedPhase: 'ROLLBACK_DRAINING'; writerAfterDryRun: 'none'; preserve: readonly Readonly<{ revision: number; digest: Hash }>[];
  recoveryManifestDigest: Hash; replayEffects: false; automaticReacquire: false;
}>> {
  if (!input || !input.control) return blocked('MISSING_CONTROL');
  const c = input.control, errors: string[] = [];
  if (!whole(c.epoch) || !whole(c.controlRevision) || c.epoch !== input.expectedEpoch || c.controlRevision !== input.expectedControlRevision) errors.push('STALE_ROLLBACK_EPOCH');
  if (!['CANONICAL_LIVE','OBSERVING'].includes(c.phase) || c.writer!=='tierflow-canonical') errors.push('NOT_CANONICAL_OWNER');
  if (!whole(input.outstandingCanonicalClaims) || input.outstandingCanonicalClaims !== 0 || !whole(input.uncertainOutcomes) || input.uncertainOutcomes !== 0) errors.push('UNRESOLVED_EFFECT_OR_COMMIT');
  if (!input.legacyReaderRetained || !input.inverseConversionLossless || !digestOK(input.previousSourceHash)) errors.push('NO_LOSSLESS_LEGACY_READER');
  if (![c.ownerRef,c.worldRef,c.documentId,c.namespace].every(nonempty) || c.namespace !== 'founder-workspace') errors.push('INVALID_ROLLBACK_SCOPE');
  if (!Array.isArray(input.newRevisions) || !Array.isArray(input.exportedRevisions) ||
      input.newRevisions.length !== input.exportedRevisions.length ||
      input.newRevisions.some((entry,index) => !whole(entry?.revision) || entry.revision < 1 || !digestOK(entry.digest) ||
        entry.revision !== input.exportedRevisions[index]?.revision || entry.digest !== input.exportedRevisions[index]?.digest ||
        (index > 0 && entry.revision <= input.newRevisions[index-1]!.revision))) errors.push('NEW_EDITS_NOT_PRESERVED');
  if (errors.length) return blocked(...errors);
  return ready({ proposedPhase:'ROLLBACK_DRAINING',writerAfterDryRun:'none',
    preserve:input.newRevisions.map(r=>({...r})),recoveryManifestDigest:stableDigest({scope:[c.ownerRef,c.worldRef,c.documentId,c.namespace],epoch:c.epoch,
      source:input.previousSourceHash,edits:input.exportedRevisions}),
    replayEffects:false, automaticReacquire:false });
}

/** Type checks deliberately align with the existing TierFlow document/revision interfaces,
 * without constructing a second store or implementing a new UiRevisionPort. */
export type ExistingCanonicalBindings = Readonly<{ document: UiDocument; port: UiRevisionPort; principal: VerifiedUiPrincipal }>;
