/**
 * Final Wave H: effect-free acceptance evaluator. NOT a release authority.
 * It does not publish UI, approve effects, sign binaries, modify stores or grant GO.
 */
export const FINAL_H_SCHEMA = 'vivim.final-wave-verification/1' as const;
export const LANES = ['A','B','C','D','E','F','G','H'] as const;
export type Lane = typeof LANES[number];
export type ProofKind = 'real-module-fixture' | 'source-audit' | 'native-windows' |
  'native-android' | 'live-host' | 'live-hq' | 'signed-artifact' |
  'human-observation' | 'rollback-drill';
export type CheckId = typeof REQUIRED_5[number]['id'] | typeof REQUIRED_6[number]['id'];
export type CheckSpec = Readonly<{id: string; kind: ProofKind; why: string}>;

/** Evidence requirements are not equivalent to implementation claims. */
export const REQUIRED_5 = [
  {id:'canonical-source-document',kind:'real-module-fixture',why:'same bounded canonical document and permissions'},
  {id:'four-input-semantic-parity',kind:'real-module-fixture',why:'text/touch/keyboard/existing Studio semanticRef+args+pins and digest'},
  {id:'preview-zero-effects',kind:'real-module-fixture',why:'draft/preview/diff invokes no Host effect'},
  {id:'cas-conflict-and-lost-ack',kind:'real-module-fixture',why:'stale edits, two-device CAS, lost ACK and idempotence'},
  {id:'restart-and-ui-only-undo',kind:'real-module-fixture',why:'persisted replay and no external-effect undo'},
  {id:'knowledge-provenance',kind:'real-module-fixture',why:'scoped stable knowledge ID/source version/redaction'},
  {id:'owner-denial-and-uncertainty',kind:'real-module-fixture',why:'denial and no retries after uncertain effect'},
  {id:'injection-and-foreign-scope',kind:'real-module-fixture',why:'foreign scope, injection, stale pins and unreviewed tools refused'},
  {id:'accessibility-edit',kind:'real-module-fixture',why:'keyboard/touch and 320/360/1280 focus semantics'},
  {id:'studio-nlcl-consumer-map',kind:'source-audit',why:'actual callers and schema bridge with rollback'},
  {id:'full-tierflow-verify',kind:'source-audit',why:'raw TypeScript, Bun and Rust repository-wide exit codes'},
] as const satisfies readonly CheckSpec[];
export const REQUIRED_6 = [
  {id:'exclusive-publisher-fence',kind:'live-host',why:'one writer across ACK loss/restart/rollback'},
  {id:'legacy-publisher-drained',kind:'live-host',why:'all active legacy write routes fenced'},
  {id:'windows-install-upgrade-rollback',kind:'native-windows',why:'real Windows signed desktop install/rollback'},
  {id:'android-apk-back-a11y',kind:'native-android',why:'real APK bridge, TalkBack, 320/360, Back'},
  {id:'pairing-replay-expiry',kind:'native-android',why:'real device replay/expiry/revocation refused'},
  {id:'host-r2-r3-and-owner-denial',kind:'live-host',why:'R2 phone refusal, R3 global refusal'},
  {id:'host-receipt-truth',kind:'live-host',why:'verified signed vs unsigned vs uncertain'},
  {id:'no-duplicate-provider-effect',kind:'live-host',why:'claim idempotence and uncertain no-retry'},
  {id:'hq-scope-tombstone-revocation',kind:'live-hq',why:'real broker provenance, no hidden counts'},
  {id:'offline-gap-recovery',kind:'native-android',why:'actual device offline purge/reconnect and version gaps'},
  {id:'stale-apk-backward-compatibility',kind:'native-android',why:'existing APK stale client behavior'},
  {id:'backup-migration-rollback',kind:'rollback-drill',why:'non-destructive snapshot/fence/dry-run/restore measured'},
  {id:'signed-binary-source-provenance',kind:'signed-artifact',why:'release binary, toolchain, signature and source SHAs'},
  {id:'latency-resource-energy',kind:'native-windows',why:'p50/p95 CPU RSS disk network energy on release hardware'},
  {id:'novice-first-task-observation',kind:'human-observation',why:'4/5 novice and <=3-step contextual help genuinely observed'},
  {id:'all-consumers-retired-or-adapted',kind:'source-audit',why:'100% release callers reconciled with authority map'},
  {id:'privacy-and-accessibility-native',kind:'native-android',why:'physical privacy, accessibility and release checks'},
  {id:'full-release-regression',kind:'source-audit',why:'Bun/TS/Rust/Node/native suites with raw exits'},
] as const satisfies readonly CheckSpec[];

export interface SourcePins {
  readonly tierflow: string;
  readonly harness: string;
  readonly hq: string;
}
export type CheckOutcome = 'pass' | 'fail' | 'unrun';
export interface Proof {
  readonly id: CheckId;
  readonly outcome: CheckOutcome;
  readonly kind: ProofKind;
  readonly source: Readonly<{repo: keyof SourcePins; sha: string}>;
  /** Raw log path, never a fabricated URL or uncaptured measurement. */
  readonly rawLog: string;
  readonly command: string;
  readonly exitCode: number | null;
  readonly observedAt: string;
  /** Physical/live evidence needs a real build or broker identifier, never 'fixture'. */
  readonly equipmentId?: string;
}
export interface LaneHandoff {
  readonly lane: Lane;
  readonly sha: string;
  readonly sourcePaths: readonly string[];
  readonly testPaths: readonly string[];
  readonly rawLogs: readonly string[];
  readonly status: 'implemented' | 'blocked' | 'unrun';
}
export interface NegativeWitness {
  readonly tested: boolean;
  /** true means forbidden behavior was observed => hard block. */
  readonly forbiddenObserved: boolean;
  readonly proofId: CheckId;
}
export const NEGATIVE_INVARIANTS = [
  'dualPublisher','r2PhoneAllowed','r3ExecutionAllowed','uncertainAutomaticRetry',
  'unsignedClaimCalledVerified','foreignScopeAccepted','hiddenKnowledgeCountExposed',
  'externalEffectUndoneByUi','unreviewedActionExecuted',
] as const;
export type NegativeInvariant = typeof NEGATIVE_INVARIANTS[number];

export interface VerificationInput {
  readonly schema: typeof FINAL_H_SCHEMA;
  readonly pins: SourcePins;
  readonly integration4: 'GO' | 'ISOLATED_GO' | 'BLOCKED' | 'UNRUN';
  /** External signed integrator verdict; H's candidate cannot create it. */
  readonly integration5Decision: 'GO' | 'BLOCKED' | 'UNRUN';
  readonly acceptedOwnerScope: boolean;
  readonly separateProductionApproval: boolean;
  readonly handoffs: readonly LaneHandoff[];
  readonly proofs: readonly Proof[];
  readonly negativeWitnesses: Partial<Readonly<Record<NegativeInvariant,NegativeWitness>>>;
  readonly duplicateActiveAuthorities: number | null;
  readonly unownedActiveRoutes: number | null;
  readonly consumerCoveragePct: number | null;
}
export interface CheckResult { readonly id: string; readonly status: CheckOutcome; readonly reason: string }
export interface GateResult {
  readonly decision: 'CANDIDATE_READY' | 'BLOCKED';
  readonly missing: readonly string[];
  readonly checks: readonly CheckResult[];
  readonly passCount: number;
  readonly failCount: number;
  readonly unrunCount: number;
}
export interface VerificationResult {
  readonly schema: typeof FINAL_H_SCHEMA;
  readonly gate5: GateResult;
  readonly gate6: GateResult;
  readonly releaseAuthority: 'none';
  readonly effectInvoked: false;
  readonly activatedPublisher: false;
  readonly automaticRetryAllowed: false;
}
const SHA = /^[0-9a-f]{40}$/;
const CLASS_NEEDS_DEVICE: ReadonlySet<ProofKind> = new Set([
  'native-windows','native-android','live-host','live-hq','signed-artifact','human-observation','rollback-drill'
]);

function evaluateChecks(specs: readonly CheckSpec[],input:VerificationInput): CheckResult[] {
  return specs.map(spec => {
    const matches = input.proofs.filter(p => p.id === spec.id);
    if (matches.length === 0) return {id:spec.id,status:'unrun',reason:'no captured evidence'};
    if (matches.length !== 1) return {id:spec.id,status:'fail',reason:'duplicate/ambiguous proof'};
    const p = matches[0]!;
    if (p.outcome === 'unrun') return {id:spec.id,status:'unrun',reason:'explicitly unrun'};
    if (p.outcome === 'fail') return {id:spec.id,status:'fail',reason:'measured failure'};
    if (p.kind !== spec.kind) return {id:spec.id,status:'fail',reason:`evidence class ${p.kind} cannot satisfy ${spec.kind}`};
    if (!SHA.test(p.source.sha) || p.source.sha !== input.pins[p.source.repo])
      return {id:spec.id,status:'fail',reason:'unmatched repo/source pin'};
    if (p.exitCode !== 0 || !p.command.trim() || !p.rawLog.trim() || Number.isNaN(Date.parse(p.observedAt)))
      return {id:spec.id,status:'fail',reason:'missing measured command/exit/log/time'};
    if (CLASS_NEEDS_DEVICE.has(spec.kind) && (!p.equipmentId || /(synthetic|fixture|mock|unknown|simulat|emulat|test.only)/i.test(p.equipmentId)))
      return {id:spec.id,status:'fail',reason:'missing real equipment/broker/build identifier'};
    return {id:spec.id,status:'pass',reason:'source-pinned command evidence accepted for candidate review'};
  });
}
function report(checks: CheckResult[], prerequisites: string[]):GateResult {
  const missing = [...prerequisites,...checks.filter(x=>x.status!=='pass').map(x=>`${x.id}: ${x.reason}`)];
  return {
    decision:missing.length===0?'CANDIDATE_READY':'BLOCKED', missing, checks,
    passCount:checks.filter(x=>x.status==='pass').length,
    failCount:checks.filter(x=>x.status==='fail').length,
    unrunCount:checks.filter(x=>x.status==='unrun').length,
  };
}
export function evaluateFinalWave(input: VerificationInput): VerificationResult {
  const hard: string[] = [];
  if (!input || input.schema !== FINAL_H_SCHEMA) throw new Error('INVALID_FINAL_H_INPUT');
  if (!Object.values(input.pins).every(s=>SHA.test(s))) hard.push('unverified or missing repository SHA');
  const entries = new Map<Lane,LaneHandoff>();
  for(const h of input.handoffs) {
    if (!LANES.includes(h.lane) || entries.has(h.lane) || !SHA.test(h.sha) ||
        h.sourcePaths.length===0 || h.testPaths.length===0 || h.rawLogs.length===0 ||
        h.status!=='implemented') hard.push(`lane ${h.lane}: missing/duplicate/unverified handoff`);
    entries.set(h.lane,h);
  }
  for(const lane of LANES) if(!entries.has(lane)) hard.push(`lane ${lane}: handoff absent`);
  for(const [lane, handoff] of entries) {
    if (handoff.sourcePaths.some(p=>!p.startsWith(`src/visual-runtime/final-wave/lane-${lane.toLowerCase()}/`)) ||
        handoff.testPaths.some(p=>!p.startsWith(`tests/visual-runtime/final-wave/lane-${lane.toLowerCase()}/`)))
      hard.push(`lane ${lane}: path outside assigned scope`);
  }
  const validChecks = new Map([...evaluateChecks(REQUIRED_5,input),...evaluateChecks(REQUIRED_6,input)].map(c=>[c.id,c.status]));
  for(const invariant of NEGATIVE_INVARIANTS) {
    const witness=input.negativeWitnesses[invariant];
    if(!witness?.tested || !witness.proofId || validChecks.get(witness.proofId)!=='pass')
      hard.push(`security witness UNRUN: ${invariant}`);
    else if(witness.forbiddenObserved) hard.push(`SECURITY FAILURE: ${invariant}`);
  }
  const g5pre=[...hard];
  if(input.integration4!=='GO') g5pre.push(`Integration 4 ${input.integration4} (requires independent GO)`);
  if(!input.acceptedOwnerScope) g5pre.push('accepted owner scope absent');
  const gate5=report(evaluateChecks(REQUIRED_5,input),g5pre);
  const g6pre=[...hard];
  if(input.integration5Decision!=='GO') g6pre.push(`Integration 5 ${input.integration5Decision} (requires independent GO)`);
  if(gate5.decision!=='CANDIDATE_READY') g6pre.push('Gate 5 candidate not ready');
  if(!input.separateProductionApproval) g6pre.push('separate production owner approval absent');
  if(input.duplicateActiveAuthorities!==0) g6pre.push('zero duplicate active authority not proven');
  if(input.unownedActiveRoutes!==0) g6pre.push('zero unowned active route not proven');
  if(input.consumerCoveragePct!==100) g6pre.push('100% release consumer coverage not proven');
  const gate6=report(evaluateChecks(REQUIRED_6,input),g6pre);
  return {schema:FINAL_H_SCHEMA,gate5,gate6,releaseAuthority:'none',effectInvoked:false,activatedPublisher:false,automaticRetryAllowed:false};
}

/** Pure cross-modal parity; origin is recorded separately and NEVER authorizes an action. */
export interface SemanticObservation {
  readonly modality: 'text'|'touch'|'keyboard'|'studio';
  readonly semanticRef:string;
  readonly targetRef:string;
  readonly argsDigest:string;
  readonly risk:'R0'|'R1'|'R2'|'R3';
  readonly policyVersion:string;
  readonly sourceVersion:string;
  readonly documentHash:string;
  readonly ownerRef:string;
  readonly worldRef:string;
}
export function verifyFourInputParity(rows: readonly SemanticObservation[]):{ok:boolean;reasons:string[]} {
  const required=['text','touch','keyboard','studio'];
  const reasons:string[]=[];
  if(rows.length!==4 || new Set(rows.map(r=>r.modality)).size!==4 ||
     required.some(m=>!rows.some(r=>r.modality===m))) reasons.push('MISSING_OR_DUPLICATE_MODALITY');
  const first=rows[0];
  if(!first) return {ok:false,reasons};
  for(const row of rows.slice(1)) {
    for(const key of ['semanticRef','targetRef','argsDigest','risk','policyVersion','sourceVersion','documentHash','ownerRef','worldRef'] as const)
      if(row[key]!==first[key]) reasons.push(`MISMATCH_${key}:${row.modality}`);
  }
  if(rows.some(r=>r.risk==='R3')) reasons.push('R3_CANNOT_BE_APPROVED');
  return {ok:reasons.length===0,reasons};
}

/** This is a plan, never a script which flips production flags or overwrites data. */
export function offlineRollbackDrillPlan() {
  return Object.freeze([
    'Record immutable source SHA, signer and current exclusive writer epoch before changes',
    'Create read-only checksum snapshot of Host ledger, UI history, settings and APK compatibility state',
    'Verify source active revision AND historical max revision and undo lineage independently',
    'Dry-run migration on disposable copy; compare state hashes and unknown-key preservation',
    'Simulate lost ACK, stale APK and interrupted write; reject dual publisher epochs',
    'Prove old reader can recover snapshot without replaying Host effect claims',
    'Require independent owner approval and Integration 5 GO for any actual production operation',
  ] as const);
}